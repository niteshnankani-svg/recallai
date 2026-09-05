# data/

This directory holds the source reference material and generated vector index for the RAG layer, and is intentionally not tracked in git (see `.gitignore`).

- `data/books/` — source documents used to ground the wellness agent's responses. The previous contents of this folder included copyrighted third-party books obtained from unauthorized sources and have been removed from version control. Populate this folder with your own properly-licensed or public-domain reference material before running ingestion.
- `data/chromadb/` — generated ChromaDB vector index, built from `data/books/` by `rag/ingest.py`. This is build output, not source material, and should never be committed.

To rebuild the index locally:

\`\`\`bash
python rag/ingest.py
\`\`\`
