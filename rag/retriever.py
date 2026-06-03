"""
RAG Retrieval — Layer 3
────────────────────────
During a call, when the user speaks:
  1. Convert their words to a vector
  2. Search ChromaDB for the most similar book passages
  3. Return those passages to be injected into Claude's prompt

Analogy:
  The librarian who, when you describe your problem,
  instantly finds the 3 most relevant paragraphs
  from all the therapy books on the shelf.
"""

import chromadb
from chromadb.utils import embedding_functions
from core.config import settings

COLLECTION_NAME = "therapy_books"
_collection = None


def _get_collection():
    """Lazy load — only connects to ChromaDB when first needed."""
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def retrieve_relevant_passages(query: str, n_results: int = 3) -> str:
    """
    Searches ChromaDB for passages relevant to the user's statement.

    query     : what the user just said
    n_results : how many passages to retrieve (3 is usually enough)

    Returns a formatted string ready to inject into Claude's prompt.

    Example:
      query = "I feel completely worthless and nothing matters"
      returns passages from "Feeling Good" on cognitive distortions
               and from "Radical Acceptance" on self-compassion
    """
    collection = _get_collection()

    # If collection is empty, return empty string gracefully
    if collection.count() == 0:
        print("[RAG] ChromaDB is empty — no books ingested yet")
        return ""

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    if not results["documents"][0]:
        return ""

    # Format retrieved passages for Claude's prompt
    passages = []
    for doc, meta, distance in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        relevance = round(1 - distance, 3)   # convert distance to similarity score
        passage = (
            f"[From '{meta['book']}', Page {meta['page']} | Relevance: {relevance}]\n"
            f"{doc}"
        )
        passages.append(passage)
        print(f"[RAG] Retrieved from {meta['book']} p{meta['page']} (relevance: {relevance})")

    return "\n\n---\n\n".join(passages)


def retrieve_for_emotion(emotion: str, query: str, n_results: int = 2) -> str:
    """
    Emotion-aware retrieval — adds emotion context to the search query
    for more targeted results.

    Example:
      emotion = "sadness"
      query   = "I've been feeling really low"
      searches for: "sadness feeling low therapeutic response validation"
    """
    emotion_context = {
        "sadness":  "sadness grief loss depression therapeutic validation",
        "anxiety":  "anxiety fear worry calm grounding mindfulness",
        "anger":    "anger frustration validation acknowledgment",
        "joy":      "happiness gratitude positive reinforcement",
        "loneliness": "loneliness isolation connection belonging",
        "neutral":  "wellness check-in emotional support",
    }

    enhanced_query = f"{query} {emotion_context.get(emotion, '')}"
    return retrieve_relevant_passages(enhanced_query, n_results)
