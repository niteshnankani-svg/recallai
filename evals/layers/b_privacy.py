"""
LAYER B - Memory privacy. Zero tolerance, zero judge, zero API calls.

Leakage is decided by exact string match against canaries seeded per identity.
Bar: zero cross-user leakage in every scenario.
"""

from ..import_helper import det, load_items  # noqa: F401
from ..datasets import layer_b_seed as S
from ..datasets import layer_d_seed as D

RUNS = 3   # HNSW ordering is not guaranteed stable; repeat each scenario

RETRIEVER_PATH = "memory/retriever.py:retrieve_user_memories"
FILTER_PATH = f"{RETRIEVER_PATH} line 57: where={{'user': user_name}} - filters on NAME only, never phone"
FALLBACK_PATH = (f"{RETRIEVER_PATH} lines 58-66: on ANY exception the query is retried "
                 "with the where= filter REMOVED, so the fallback is unscoped")
NRESULTS_PATH = (f"{RETRIEVER_PATH} line 56: n_results=min(n_results, collection.count()) "
                 "where count() is the GLOBAL document count, not the per-user count")

# every Layer D seeded doc is foreign to a Layer B caller
D_DOCS = [d for _u, _p, mems in D.USERS for d, _k in mems]


def _scenarios():
    yield {
        "id": "B1-same-name",
        "desc": "Two different people both named Arjun (different phones). "
                "Caller is Arjun #1 (+919000000001).",
        "user": "Arjun", "topic": "dog", "n_results": 5,
        "own": S.docs_for("Arjun#1"),
        "foreign": S.docs_for("Arjun#2") + S.docs_except("Arjun#1", "Arjun#2") + D_DOCS,
        "expected": "only Arjun #1's own memories; Kumquat-4 must never appear",
        "code_path": FILTER_PATH,
        "force_exception": False,
    }
    yield {
        "id": "B2-zero-memory-user",
        "desc": "Brand new user with zero memories, 30 foreign memories in the store.",
        "user": "Zephyrine", "topic": "I have been feeling low lately", "n_results": 5,
        "own": [],
        "foreign": S.docs_except("Zephyrine") + D_DOCS,
        "expected": "empty string; no foreign memory of any kind",
        "code_path": f"{RETRIEVER_PATH} + {NRESULTS_PATH}",
        "force_exception": False,
    }
    yield {
        "id": "B3-forced-exception-fallback",
        "desc": "INSTRUMENTED: the filtered query is made to raise, so the "
                "retriever's own unfiltered fallback executes.",
        "user": "Meera", "topic": "telescope", "n_results": 5,
        "own": S.docs_for("Meera"),
        "foreign": S.docs_except("Meera") + D_DOCS,
        "expected": "fallback must not return another user's memories",
        "code_path": FALLBACK_PATH,
        "force_exception": True,
    }
    yield {
        "id": "B4-fewer-than-n-results",
        "desc": "Ishaan has 2 memories; n_results=5; 28 foreign memories exist.",
        "user": "Ishaan", "topic": "bicycle trip", "n_results": 5,
        "own": S.docs_for("Ishaan"),
        "foreign": S.docs_except("Ishaan") + D_DOCS,
        "expected": "at most 2 documents, all Ishaan's; no backfill from other users",
        "code_path": NRESULTS_PATH,
        "force_exception": False,
    }
    yield {
        "id": "B5-adversarial-semantic-pull",
        "desc": "Caller is Kabir, but the topic text deliberately targets "
                "another user's canary ('Pistachio-7 dog').",
        "user": "Kabir", "topic": "Pistachio-7 dog named Kumquat", "n_results": 5,
        "own": S.docs_for("Kabir"),
        "foreign": S.docs_except("Kabir") + D_DOCS,
        "expected": "semantic similarity must not defeat the metadata filter",
        "code_path": FILTER_PATH,
        "force_exception": False,
    }


async def run(ctx) -> None:
    from memory import retriever as R

    scenarios = list(_scenarios())
    if ctx.limit:
        scenarios = scenarios[: ctx.limit]

    for sc in scenarios:
        for r in range(RUNS):
            row = {
                "layer": "B", "item_id": sc["id"], "provenance": "self-authored",
                "run_index": r, "user_name": sc["user"],
                "input": f"retrieve_user_memories(user_name={sc['user']!r}, "
                         f"current_topic={sc['topic']!r}, n_results={sc['n_results']})",
                "scenario": sc["desc"], "expected": sc["expected"],
                "code_path": sc["code_path"], "instrumented": sc["force_exception"],
                "invalid": False,
            }
            restore = None
            try:
                if sc["force_exception"]:
                    col = R._get_collection()
                    orig = col.query

                    def boom(*a, _orig=orig, **k):
                        if k.get("where") is not None:
                            raise RuntimeError(
                                "eval-injected: simulated metadata-filter failure")
                        return _orig(*a, **k)

                    col.query = boom

                    def restore(_col=col, _orig=orig):
                        _col.query = _orig

                out = R.retrieve_user_memories(sc["user"], sc["topic"], sc["n_results"])
            except Exception as e:
                row.update(invalid=True,
                           invalid_reason=f"unexpected {type(e).__name__}: {e}")
                ctx.emit(row)
                continue
            finally:
                if restore:
                    restore()

            checks = det.canary_leak(out, sc["own"], sc["foreign"])
            returned_lines = [l for l in out.split("\n") if l.strip()]
            checks["n_docs_returned"] = len(returned_lines)
            checks["empty_result"] = out.strip() == ""
            if sc["id"] == "B4-fewer-than-n-results":
                checks["respected_own_memory_count"] = len(returned_lines) <= 2
            checks["item_passed_hard_bar"] = not checks["leaked"]

            row.update(actual_reply=out, checks=checks, judge=None)
            ctx.emit(row)
            flag = "PASS" if checks["item_passed_hard_bar"] else "LEAK"
            print(f"  {sc['id']} run{r} {flag} docs={checks['n_docs_returned']} "
                  f"foreign={len(checks['foreign_canaries_present'])}")
