import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
import gradio as gr
from core.auth import ADMIN_PASS, check_basic_auth
from routers.calls import router as calls_router
from routers.web_api import router as web_api_router
from admin_panel import demo as admin_demo

app = FastAPI(
    title="RecallAI",
    description="Voice-enabled AI wellness agent with empathetic memory",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth + Gradio queue fix middleware ---

# Gradio internal paths that must bypass auth
_GRADIO_INTERNAL = ("/admin/queue/", "/admin/api/", "/admin/upload", "/admin/file=",
                    "/admin/assets/")

# Gradio sends queue/api requests to root — rewrite to /admin prefix
_GRADIO_REWRITE = ("/queue/", "/api/predict", "/api/queue")

# Path prefixes protected by Basic Auth (Gradio console + REST/WS admin API).
# NOTE: this middleware only runs for HTTP scope — /api/admin/events (WS)
# checks auth itself, see routers/web_api.py.
_ADMIN_PROTECTED = ("/admin", "/api/admin")


@app.middleware("http")
async def gradio_rewrite_and_auth(request: Request, call_next):
    path = request.url.path

    # Rewrite root-level Gradio requests to /admin prefix
    if any(path.startswith(p) for p in _GRADIO_REWRITE):
        new_path = f"/admin{path}"
        scope = request.scope
        scope["path"] = new_path
        scope["raw_path"] = new_path.encode()
        return await call_next(request)

    # Auth for /admin and /api/admin (skip Gradio internal paths)
    if any(path.startswith(p) for p in _ADMIN_PROTECTED) and ADMIN_PASS:
        if any(path.startswith(p) for p in _GRADIO_INTERNAL):
            return await call_next(request)

        auth = request.headers.get("Authorization", "")
        if not check_basic_auth(auth):
            return Response(
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="RecallAI Admin"'},
                content="Authentication required" if not auth else "Invalid credentials",
            )

    return await call_next(request)


app.include_router(calls_router)
app.include_router(web_api_router)
app = gr.mount_gradio_app(app, admin_demo, path="/admin")

# Serve the built React frontend (task: Scaffold frontend/) as the catch-all
# for everything not matched above. Mounted last so /calls, /api, /admin,
# /health keep priority. No-op until frontend/dist exists.
_FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(_FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=_FRONTEND_DIST, html=True), name="frontend")


@app.on_event("startup")
async def warmup_models():
    """Load the BERT emotion model + embedder at boot, not during a live call.
    This prevents the first caller from eating a multi-second stall (and the
    memory spike that previously OOM-crashed mid-call)."""
    import asyncio

    def _warm():
        try:
            from emotion.detector import detect_emotion
            detect_emotion("warmup")
            print("[Warmup] Emotion model loaded ✓")
        except Exception as e:
            print(f"[Warmup] Emotion warmup failed: {e}")
        try:
            from rag.retriever import retrieve_relevant_passages
            retrieve_relevant_passages("warmup", 1)
            print("[Warmup] RAG embedder + ChromaDB loaded ✓")
        except Exception as e:
            print(f"[Warmup] RAG warmup failed: {e}")

    # Run in a thread so startup isn't blocked from accepting the port
    asyncio.get_event_loop().run_in_executor(None, _warm)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "project": "RecallAI",
        "layers_complete": ["Layer 1 — Voice Pipeline", "Layer 2 — Agent + Emotion"],
        "layers_pending": ["Layer 3 — Memory", "Layer 4 — Redis", "Layer 5 — Gradio + Docker"],
    }
