"""
Eval runner.

    ./evals/.venv/bin/python -m evals.runner --layers A,B,C,D,E,F,G

Writes evals/results/<utc>/raw.jsonl (one row per run) and, at the end,
REPORT.md. Rows are flushed as they are produced so a crash keeps the data.
"""

import argparse
import asyncio
import json
import os
import platform
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from . import env

env.setup()
env.assert_not_real_chroma()

from . import guards, seeding            # noqa: E402

RESULTS_ROOT = Path(__file__).resolve().parent / "results"
DATASETS = Path(__file__).resolve().parent / "datasets"
HOLDOUT = DATASETS / "holdout"


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_holdout(layer: str) -> list[dict]:
    """Blind items supplied from outside this session. Stamped, never merged."""
    rows = []
    for p in sorted(HOLDOUT.glob(f"holdout_{layer.lower()}*.jsonl")):
        for r in load_jsonl(p):
            r["provenance"] = "blind-holdout"
            r.setdefault("_holdout_file", p.name)
            rows.append(r)
    return rows


class Ctx:
    def __init__(self, out_dir: Path, runs: int, limit: int | None):
        self.out_dir = out_dir
        self.runs = runs
        self.limit = limit
        # Rows are appended with an open-write-close per row rather than a
        # long-lived handle: it is crash-safe (a killed run keeps every row it
        # produced) and it survives sandboxed filesystems that discard writes
        # made through a handle held open across heavy native imports.
        self._path = out_dir / "raw.jsonl"
        self._path.touch()
        self._rows = 0
        self.counts: dict[str, int] = {}
        self.invalid: list[dict] = []
        self.cost = {"haiku_in": 0, "haiku_out": 0}
        self.t0 = time.time()

    def emit(self, row: dict) -> None:
        row.setdefault("ts", datetime.now(timezone.utc).isoformat())
        with self._path.open("a") as fh:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")
        self._rows += 1
        key = f"{row.get('layer')}:{'INVALID' if row.get('invalid') else 'ok'}"
        self.counts[key] = self.counts.get(key, 0) + 1
        if row.get("invalid"):
            self.invalid.append({"layer": row.get("layer"),
                                 "item_id": row.get("item_id"),
                                 "reason": row.get("invalid_reason")})
        self.cost["haiku_in"] += row.get("input_tokens", 0) or 0
        self.cost["haiku_out"] += row.get("output_tokens", 0) or 0

    def close(self) -> None:
        on_disk = sum(1 for _ in self._path.open())
        if on_disk != self._rows:
            print(f"[runner] WARNING: emitted {self._rows} rows but "
                  f"{on_disk} are on disk at {self._path}")


def git_rev() -> str:
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                              capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception:
        return "unknown"


def manifest(ctx: Ctx, layers: list[str]) -> dict:
    import anthropic
    import chromadb
    import transformers

    import services.agent_service as agent_service
    from . import judge

    return {
        "started_utc": datetime.now(timezone.utc).isoformat(),
        "git_rev": git_rev(),
        "layers": layers,
        "runs_per_item": ctx.runs,
        "python": platform.python_version(),
        "platform": platform.platform(),
        "system_under_test": {
            "hot_model": agent_service.HOT_MODEL,
            "max_tokens": 120,
            "temperature": 0.75,
            "extract_model": os.getenv("EXTRACT_MODEL", "claude-haiku-4-5-20251001"),
        },
        "judge_model": judge.JUDGE_MODEL,
        "deps": {
            "anthropic": anthropic.__version__,
            "chromadb": chromadb.__version__,
            "transformers": transformers.__version__,
        },
        "deps_deviation": (
            "PRODUCTION PINS chromadb==0.5.0 and transformers==4.41.2 "
            f"(requirements.txt); this run used chromadb {chromadb.__version__} / "
            f"transformers {transformers.__version__} because the project venv's "
            "torch install is broken. Layer B filter semantics are therefore "
            "measured on a DIFFERENT major version of ChromaDB than is deployed."
        ),
        "isolation": env.describe(),
        "holdout_items": {L: len(load_holdout(L)) for L in "ABCDEFG"},
        "guards_clean": guards.assert_clean() == [],
    }


async def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--layers", default="A,B,C,D,E,F,G")
    ap.add_argument("--runs", type=int, default=5, help="runs per item for Layer A")
    ap.add_argument("--limit", type=int, default=None, help="cap items per layer (smoke)")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    layers = [x.strip().upper() for x in args.layers.split(",") if x.strip()]
    stamp = args.out or datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = RESULTS_ROOT / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    ctx = Ctx(out_dir, args.runs, args.limit)

    print(f"[runner] results -> {out_dir}")
    wiped = seeding.wipe_seeds()
    seeded = seeding.seed_all()
    print(f"[runner] seeds: wiped {wiped}, {seeded}")

    man = manifest(ctx, layers)
    man["seeding"] = {"wiped": wiped, **seeded}
    (out_dir / "manifest.json").write_text(json.dumps(man, indent=2))
    print(f"[runner] model under test: {man['system_under_test']['hot_model']} | judge: {man['judge_model']}")

    from .layers import (a_crisis, b_privacy, c_extraction, d_memory_use,
                         e_emotion, f_rules, g_ops)
    table = {"A": a_crisis, "B": b_privacy, "C": c_extraction, "D": d_memory_use,
             "E": e_emotion, "F": f_rules, "G": g_ops}

    for L in layers:
        mod = table.get(L)
        if mod is None:
            print(f"[runner] unknown layer {L}, skipping")
            continue
        print(f"\n[runner] ===== LAYER {L} =====")
        t = time.time()
        try:
            await mod.run(ctx)
        except Exception as e:
            print(f"[runner] LAYER {L} ABORTED: {type(e).__name__}: {e}")
            ctx.emit({"layer": L, "item_id": "__layer__", "invalid": True,
                      "invalid_reason": f"layer aborted: {type(e).__name__}: {e}"})
        print(f"[runner] layer {L} done in {time.time()-t:.0f}s")

    man["finished_utc"] = datetime.now(timezone.utc).isoformat()
    man["wall_seconds"] = round(time.time() - ctx.t0, 1)
    man["row_counts"] = ctx.counts
    man["invalid_runs"] = ctx.invalid
    man["token_totals_system_under_test"] = ctx.cost
    man["guards_clean_after"] = guards.assert_clean() == []
    (out_dir / "manifest.json").write_text(json.dumps(man, indent=2))
    ctx.close()

    print(f"\n[runner] rows: {ctx.counts}")
    print(f"[runner] invalid runs: {len(ctx.invalid)}")
    print(f"[runner] done in {man['wall_seconds']}s -> {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
