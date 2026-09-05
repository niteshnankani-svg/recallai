# RecallAI

A voice-based wellness check-in agent: callers talk to it over the phone (or a browser call widget), and it remembers who they are across calls — using retrieved memory, emotion detection, and a RAG layer grounded in wellness/self-help reference material.

## Architecture

RecallAI is a FastAPI backend with a Gradio-based admin panel mounted alongside it, plus a React frontend (a caller-facing web-call app and an internal dashboard).

- **`main.py`** — FastAPI app entrypoint. Mounts two routers (`routers/calls.py` for Twilio telephony call handling, `routers/web_api.py` for the browser-based web-call flow) and a custom `gradio_rewrite_and_auth` middleware that path-rewrites and HTTP-Basic-Auth-protects the `/admin` and `/api/admin` routes serving the Gradio admin panel (`admin_panel.py`).
- **`core/`** — shared app configuration and startup wiring.
- **`services/`** — integration and business-logic layer: `telephony.py` and `twilio_service.py` (call handling), `deepgram_service.py` (speech-to-text), `elevenlabs_service.py` and `tts_stream.py` (text-to-speech/streaming), `sarvam_service.py` (Sarvam AI, used for Hindi/multilingual support), `agent_service.py` (conversation orchestration), `conversation_arc.py` (call-flow/state), `call_events.py` and `call_registry.py` (call lifecycle tracking), `analytics.py` and `system_status.py`, `redis_store.py` (session/state storage), `rate_limit.py`, `language_detector.py`, `name_extractor.py`.
- **`memory/`** — cross-call user memory: `extractor.py` pulls durable facts out of a conversation, `retriever.py` fetches relevant memories for a new call, `browser.py` supports browsing/inspecting stored memories (surfaced in the admin panel).
- **`rag/`** — retrieval-augmented generation over reference material: `ingest.py` builds a ChromaDB vector index from source documents, `retriever.py` queries it at call time to ground the agent's responses.
- **`emotion/`** — `detector.py`, a fine-tuned emotion-classification model (`j-hartmann/emotion-english-distilroberta-base` via `transformers`) used to read caller sentiment during a call.
- **`frontend/`** — a Vite + React app with two surfaces: a caller-facing web-call UI and an internal `dashboard`.
- **`admin_panel.py`** — Gradio admin UI (call history, memory browser, system status), mounted into the FastAPI app and auth-protected.
- **`dograh_bridge.py`** — a small HTTP bridge (`DOGRAH_SETUP.md`) that lets a self-hosted [Dograh](https://dograh.com) voice-agent prototype pull RecallAI's pre-call memory/greeting data and post-call summaries, for experimenting with alternate voice-agent runtimes against the same backend.

```
Caller (phone / browser)
        │
   Twilio or WebRTC
        │
routers/calls.py, routers/web_api.py
        │
services/  ── STT (Deepgram) ── LLM (Anthropic) ── TTS (ElevenLabs / Sarvam)
        │
memory/ (retrieve + extract)   rag/ (ChromaDB retrieval)   emotion/ (sentiment)
        │
   redis_store (session state)
```

## Tech stack

FastAPI, Uvicorn, Gradio (admin panel), React + Vite (frontend), Twilio (telephony), Deepgram (speech-to-text), ElevenLabs (text-to-speech), Sarvam AI (multilingual TTS/STT), Anthropic Claude (conversation), ChromaDB + `sentence-transformers` (RAG retrieval), Hugging Face `transformers`/PyTorch (emotion classification), Redis (session state), SQLite via `aiosqlite`, Docker (multi-stage build: React build → Python runtime), deployed on Railway (`railway.json`).

## Setup / run

```bash
# Backend
pip install -r requirements.txt
cp .env.example .env  # fill in API keys — see below
uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Required environment variables (see `.env.example`) include API keys/credentials for Twilio, Deepgram, ElevenLabs, Sarvam AI, Anthropic, Redis, and the admin panel's HTTP Basic Auth username/password.

Docker: `docker build -t recallai .` builds the frontend and backend into a single image (see `Dockerfile`); `railway.json` configures a Dockerfile-based deploy on Railway.

For the optional Dograh voice-agent prototype integration, see `DOGRAH_SETUP.md`.

## Tests

`tests/` contains unit tests for call registry, conversation-arc state, emotion detection, language detection, and name extraction (`pytest`).

## Known limitations

- `data/` (reference material for the RAG layer) and the generated ChromaDB vector index are not tracked in this repo — see `data/README.md`. You'll need to supply your own source documents and run `rag/ingest.py` to build a local index before RAG retrieval will work.
- The admin panel is protected by HTTP Basic Auth only; treat it as suitable for a private/internal deployment, not public exposure without additional hardening.
- No CI workflow is currently configured in this repo.
