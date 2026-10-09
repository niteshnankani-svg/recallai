"""Shared imports for layer modules, in the one correct order (env first)."""

import json
from pathlib import Path

from . import env

env.setup()
env.assert_not_real_chroma()

from . import harness, judge                    # noqa: E402,F401
from .checks import deterministic as det        # noqa: E402,F401

DATASETS = Path(__file__).resolve().parent / "datasets"


def load_items(filename: str, layer: str, limit: int | None = None) -> list[dict]:
    """Authored items + any blind holdout items, holdout last, provenance stamped."""
    from .runner import load_holdout, load_jsonl
    rows = load_jsonl(DATASETS / filename)
    rows += load_holdout(layer)
    if limit:
        rows = rows[:limit]
    return rows
