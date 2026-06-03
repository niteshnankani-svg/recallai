"""
Memory Retriever
─────────────────
At the start of every call, retrieves relevant
memories for this user from ChromaDB.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import chromadb
from chromadb.utils import embedding_functions

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chromadb")
MEMORY_COLLECTION = "user_memories"

_memory_collection = None


def _get_collection():
    global _memory_collection
    if _memory_collection is None:
        client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _memory_collection = client.get_or_create_collection(
            name=MEMORY_COLLECTION,
            embedding_function=embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
    return _memory_collection


def retrieve_user_memories(user_name: str, current_topic: str = "", n_results: int = 5) -> str:
    """
    Retrieves past memories for a user.
    Returns formatted string ready to inject into Claude's prompt.
    """
    collection = _get_collection()

    if collection.count() == 0:
        return ""

    # Search by user name + current topic
    query = f"{user_name} {current_topic}".strip()

    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(n_results, collection.count()),
            where={"user": user_name},
            include=["documents", "metadatas", "distances"],
        )
    except Exception:
        try:
            results = collection.query(
                query_texts=[query],
                n_results=min(n_results, collection.count()),
                include=["documents", "metadatas"],
            )
        except Exception as e:
            print(f"[Memory] Retrieval error: {e}")
            return ""

    if not results["documents"][0]:
        return ""

    memories = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        timestamp = meta.get("timestamp", "")[:10]
        memories.append(f"[{timestamp}] {doc}")
        print(f"[Memory] Retrieved: {doc}")

    return "\n".join(memories)
