"""
Seeds canary memories into the ISOLATED Chroma store using memory/extractor.py's
exact metadata schema, so retrieval cannot tell them from real memories.
Never touches data/chromadb.
"""

from datetime import datetime

from . import env

env.setup()
env.assert_not_real_chroma()

from memory import retriever as mem_retriever        # noqa: E402
from .datasets import layer_b_seed, layer_d_seed     # noqa: E402

SEED_PREFIX = "evalseed"


def wipe_seeds() -> int:
    """Remove anything this suite previously seeded. Leaves nothing else."""
    col = mem_retriever._get_collection()
    got = col.get(where={"type": "memory"}, include=["metadatas"])
    ids = [i for i, m in zip(got["ids"], got["metadatas"])
           if str(m.get("call_sid", "")).startswith(SEED_PREFIX)]
    if ids:
        col.delete(ids=ids)
    return len(ids)


def seed_all() -> dict:
    col = mem_retriever._get_collection()
    ts = datetime.now().isoformat()
    docs, metas, ids = [], [], []

    for key, user, phone, documents in layer_b_seed.USERS:
        for i, d in enumerate(documents):
            sid = f"{SEED_PREFIX}-b-{key.replace('#','')}"
            docs.append(d)
            metas.append({"user": user, "phone": phone, "call_sid": sid,
                          "timestamp": ts, "type": "memory"})
            ids.append(f"{sid}-{i}")

    for user, phone, mems in layer_d_seed.USERS:
        for i, (d, kind) in enumerate(mems):
            sid = f"{SEED_PREFIX}-d-{user}"
            docs.append(d)
            metas.append({"user": user, "phone": phone, "call_sid": sid,
                          "timestamp": ts, "type": "memory", "kind": kind})
            ids.append(f"{sid}-{i}")

    if docs:
        col.add(documents=docs, metadatas=metas, ids=ids)
    return {"seeded_docs": len(docs), "collection_count": col.count()}
