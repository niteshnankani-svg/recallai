"""
Memory Browser
──────────────
Read-only listing over the ChromaDB `user_memories` collection, shared by the
Gradio admin console (admin_panel.py) and the REST API (routers/web_api.py).
"""

import os
import chromadb


def list_all_memories() -> list[dict]:
    """Returns all stored memory facts as [{date, user, fact}, ...], newest first."""
    chroma_dir = os.environ.get("CHROMA_PERSIST_DIR", "./data/chromadb")
    client = chromadb.PersistentClient(path=chroma_dir)

    try:
        collection = client.get_collection("user_memories")
    except Exception:
        return []

    result = collection.get(include=["documents", "metadatas"])
    if not result["documents"]:
        return []

    rows = []
    for doc, meta in zip(result["documents"], result["metadatas"]):
        date = meta.get("timestamp", "")[:10] if meta else "—"
        user = meta.get("user", "—") if meta else "—"
        rows.append({"date": date, "user": user, "fact": doc})

    rows.sort(key=lambda r: r["date"], reverse=True)
    return rows
