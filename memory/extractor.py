"""
Memory Extractor
─────────────────
At the end of every call, extracts key facts
from the conversation and stores in ChromaDB.

Examples of what gets stored:
  "Nitesh is stressed about job search"
  "Nitesh mentioned his mother is unwell"
  "Nitesh feels lonely and disconnected"
  "Nitesh's goal is to get an AI Engineer role"
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
import chromadb
from chromadb.utils import embedding_functions

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chromadb")
MEMORY_COLLECTION = "user_memories"


def _get_memory_collection():
    client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    collection = client.get_or_create_collection(
        name=MEMORY_COLLECTION,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )
    return collection


def extract_and_store_memories(
    conversation_history: list,
    user_name: str,
    call_sid: str,
) -> int:
    """
    Called at end of every call.
    Uses Claude to extract key facts from conversation.
    Stores each fact as a separate vector in ChromaDB.
    Returns number of memories stored.
    """
    if not conversation_history:
        return 0

    # Build conversation text
    conv_text = ""
    for msg in conversation_history:
        role = "User" if msg.__class__.__name__ == "HumanMessage" else "RecallAI"
        conv_text += f"{role}: {msg.content}\n"

    # Ask Claude to extract key facts
    llm = ChatAnthropic(
        model="claude-sonnet-4-5",
        api_key=ANTHROPIC_API_KEY,
        max_tokens=500,
    )

    extraction_prompt = f"""
You are extracting key facts from a wellness conversation for future reference.

CONVERSATION:
{conv_text}

Extract 3-5 key facts about the user that would be useful to remember for future calls.
Each fact should be a single sentence starting with the user's name.

Format: one fact per line, no bullets, no numbers.

Examples:
Nitesh mentioned feeling stressed about his job search.
Nitesh's mother has been unwell recently.
Nitesh finds it hard to sleep at night.
Nitesh responded well to breathing exercises.
"""

    response = llm.invoke([HumanMessage(content=extraction_prompt)])
    facts_text = response.content.strip()

    facts = [f.strip() for f in facts_text.split('\n') if f.strip()]
    print(f"[Memory] Extracted {len(facts)} facts from call")

    # Store each fact in ChromaDB
    collection = _get_memory_collection()
    timestamp = datetime.now().isoformat()

    documents = []
    metadatas = []
    ids = []

    for i, fact in enumerate(facts):
        doc_id = f"{user_name}_{call_sid}_{i}"
        documents.append(fact)
        metadatas.append({
            "user": user_name,
            "call_sid": call_sid,
            "timestamp": timestamp,
            "type": "memory",
        })
        ids.append(doc_id)
        print(f"[Memory] Stored: {fact}")

    if documents:
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )

    return len(documents)
