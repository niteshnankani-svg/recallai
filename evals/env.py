"""
Isolation. MUST be imported (and `setup()` called) before anything under
services/, memory/, rag/ or emotion/ is imported, because those modules read
CHROMA_PERSIST_DIR at import time.

What this guarantees:
  * ChromaDB  -> evals/.chroma_eval  (a copy; the real data/chromadb is never written)
  * Redis     -> REDIS_URL set to "" so services/redis_store.py takes its
                 in-memory fallback. python-dotenv will not override an
                 already-present key, so the real REDIS_URL in .env cannot
                 leak in. This is a DEVIATION from production and is reported
                 as such in Layer G.
  * Telephony -> blocked at import (evals/guards.py)
"""

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EVAL_CHROMA_DIR = REPO_ROOT / "evals" / ".chroma_eval"
REAL_CHROMA_DIR = REPO_ROOT / "data" / "chromadb"

_done = False


def setup() -> dict:
    global _done
    if _done:
        return describe()

    from . import guards
    guards.install()

    resolved = str(EVAL_CHROMA_DIR)
    os.environ["CHROMA_PERSIST_DIR"] = resolved
    # present-but-empty: dotenv won't override it, redis_store sees it as falsy
    os.environ["REDIS_URL"] = ""
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    # HF hub is unreachable from this sandbox and the import hangs on it.
    # Both models (emotion classifier, MiniLM embeddings) are already in the
    # local HF cache, so offline mode loads the SAME weights production would
    # resolve to. Reported as a deviation in Layer G.
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

    if not EVAL_CHROMA_DIR.exists():
        raise RuntimeError(
            f"{EVAL_CHROMA_DIR} missing. Create it with:\n"
            f"  cp -R {REAL_CHROMA_DIR}/. {EVAL_CHROMA_DIR}/\n"
            f"then drop the user_memories collection (see evals/README.md)."
        )

    _done = True
    return describe()


def describe() -> dict:
    return {
        "chroma_persist_dir": os.environ.get("CHROMA_PERSIST_DIR"),
        "real_chroma_dir_untouched": str(REAL_CHROMA_DIR),
        "redis_url": os.environ.get("REDIS_URL") or "<unset: in-memory fallback>",
    }


def assert_not_real_chroma() -> None:
    """Belt and braces: refuse to run if anything repointed us at real data."""
    cur = Path(os.environ.get("CHROMA_PERSIST_DIR", "")).resolve()
    if cur == REAL_CHROMA_DIR.resolve():
        raise RuntimeError("refusing to run: CHROMA_PERSIST_DIR is the real store")
