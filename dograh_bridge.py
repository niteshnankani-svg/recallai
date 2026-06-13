"""
Dograh Retrieval Bridge
───────────────────────
Exposes RecallAI's EXISTING ChromaDB retrieval as plain HTTP endpoints so a
Dograh voice agent can call them as HTTP-API tools.

Nothing is migrated or duplicated — these wrap the same rag/retriever.py and
memory/retriever.py against the same data/chromadb store (13 therapy books +
user_memories). Proves the data/database is reused, not rebuilt.

Run:  uvicorn dograh_bridge:app --host 0.0.0.0 --port 8090
Dograh (in Docker) reaches it at:  http://host.docker.internal:8090
"""

from fastapi import FastAPI
from pydantic import BaseModel

from rag.retriever import retrieve_relevant_passages
from memory.retriever import retrieve_user_memories
from services.call_registry import get_user_name, is_known_user

app = FastAPI(title="RecallAI Retrieval Bridge for Dograh")


class PassageQuery(BaseModel):
    query: str
    n_results: int = 3


class MemoryQuery(BaseModel):
    user_name: str
    topic: str = ""
    n_results: int = 5


@app.get("/health")
def health():
    return {"status": "ok", "service": "recallai-retrieval-bridge"}


@app.post("/retrieve_passages")
def retrieve_passages(q: PassageQuery):
    """Therapy-book RAG over the existing ChromaDB therapy_books collection."""
    passages = retrieve_relevant_passages(q.query, n_results=q.n_results)
    return {"passages": passages or "No relevant passages found."}


@app.post("/retrieve_memories")
def retrieve_memories(q: MemoryQuery):
    """Cross-call memories for a user from the existing user_memories collection."""
    memories = retrieve_user_memories(q.user_name, q.topic, n_results=q.n_results)
    return {"memories": memories or "No past memories for this user yet."}


class PreCall(BaseModel):
    phone: str = ""
    user_name: str = ""


@app.post("/precall")
def precall(p: PreCall):
    """Dograh Pre-Call Data Fetch: at call start, resolve the caller and pull
    their past memories so the agent can greet a returning user by name.

    Returns variables Dograh injects into the agent prompt:
      known_user, user_name, opening, memories
    """
    name = p.user_name or (get_user_name(p.phone) if p.phone else "")
    known = bool(p.user_name) or (is_known_user(p.phone) if p.phone else False)
    memories = ""
    if name:
        memories = retrieve_user_memories(name, "", n_results=5)

    if known and name:
        opening = f"Hi {name}, this is RecallAI. How have you been since we last talked?"
    else:
        opening = ("Hi there! I'm RecallAI, your wellness companion. "
                   "I'd love to get to know you. What's your name?")

    return {
        "known_user": known,
        "user_name": name or "there",
        "opening": opening,
        "memories": memories or "No past memories yet.",
    }
