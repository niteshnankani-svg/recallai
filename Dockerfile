FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build


FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ build-essential libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "\
from transformers import pipeline; \
pipeline('text-classification', model='j-hartmann/emotion-english-distilroberta-base'); \
from sentence_transformers import SentenceTransformer; \
SentenceTransformer('all-MiniLM-L6-v2')"

COPY . .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
