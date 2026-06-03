import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pathlib import Path
from pypdf import PdfReader
import chromadb
from chromadb.utils import embedding_functions
from core.config import settings

BOOKS_DIR = Path("data/books")
CHUNK_SIZE = 400
CHUNK_OVERLAP = 50
COLLECTION_NAME = "therapy_books"


def get_chroma_collection():
    client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )
    return collection


def extract_text_from_pdf(pdf_path: Path) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    pages = []
    for page_num, page in enumerate(reader.pages):
        try:
            text = page.extract_text()
            if text and text.strip():
                pages.append({
                    "page_num": page_num + 1,
                    "text": text.strip(),
                    "book_name": pdf_path.stem[:50],
                })
        except Exception as e:
            print(f"  [Skip] Page {page_num+1} error: {e}")
    print(f"  [PDF] Extracted {len(pages)} pages from {pdf_path.name[:50]}")
    return pages


def chunk_text(text: str) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + CHUNK_SIZE
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def ingest_books():
    if not BOOKS_DIR.exists():
        print(f"[Ingest] Books directory not found: {BOOKS_DIR}")
        return

    pdf_files = list(BOOKS_DIR.glob("*.pdf"))
    if not pdf_files:
        print("[Ingest] No PDFs found in data/books/")
        return

    print(f"[Ingest] Found {len(pdf_files)} books")
    collection = get_chroma_collection()
    existing = collection.get()["ids"]
    print(f"[Ingest] ChromaDB already has {len(existing)} chunks")

    total_chunks = 0

    for pdf_path in pdf_files:
        book_name = pdf_path.stem[:50]
        print(f"\n[Ingest] Processing: {pdf_path.name[:60]}")

        already_ingested = any(book_name[:20] in id for id in existing)
        if already_ingested:
            print(f"  [Skip] Already ingested")
            continue

        pages = extract_text_from_pdf(pdf_path)
        documents, metadatas, ids = [], [], []
        chunk_index = 0

        for page in pages:
            chunks = chunk_text(page["text"])
            for chunk in chunks:
                doc_id = f"{book_name[:30]}_{page['page_num']}_{chunk_index}"
                documents.append(chunk)
                metadatas.append({
                    "book": book_name[:50],
                    "page": page["page_num"],
                    "chunk_index": chunk_index,
                })
                ids.append(doc_id)
                chunk_index += 1

        batch_size = 100
        for i in range(0, len(documents), batch_size):
            collection.add(
                documents=documents[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size],
                ids=ids[i:i+batch_size],
            )

        total_chunks += len(documents)
        print(f"  [Done] {len(documents)} chunks stored")

    print(f"\n[Ingest] Complete — {total_chunks} new chunks added")
    print(f"[Ingest] Total in ChromaDB: {collection.count()}")


if __name__ == "__main__":
    ingest_books()
