import os
import secrets
import base64
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, RedirectResponse
import gradio as gr
from routers.calls import router as calls_router
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
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "")

# Gradio internal paths that must bypass auth
_GRADIO_INTERNAL = ("/admin/queue/", "/admin/api/", "/admin/upload", "/admin/file=",
                    "/admin/assets/")

# Gradio sends queue/api requests to root — rewrite to /admin prefix
_GRADIO_REWRITE = ("/queue/", "/api/predict", "/api/queue")


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

    # Auth for /admin pages (skip Gradio internal paths)
    if path.startswith("/admin") and ADMIN_PASS:
        if any(path.startswith(p) for p in _GRADIO_INTERNAL):
            return await call_next(request)

        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Basic "):
            return Response(
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="RecallAI Admin"'},
                content="Authentication required",
            )
        try:
            decoded = base64.b64decode(auth.split(" ", 1)[1]).decode()
            username, password = decoded.split(":", 1)
            if not (secrets.compare_digest(username, ADMIN_USER)
                    and secrets.compare_digest(password, ADMIN_PASS)):
                raise ValueError()
        except Exception:
            return Response(
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="RecallAI Admin"'},
                content="Invalid credentials",
            )

    return await call_next(request)


app.include_router(calls_router)
app = gr.mount_gradio_app(app, admin_demo, path="/admin")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "project": "RecallAI",
        "layers_complete": ["Layer 1 — Voice Pipeline", "Layer 2 — Agent + Emotion"],
        "layers_pending": ["Layer 3 — Memory", "Layer 4 — Redis", "Layer 5 — Gradio + Docker"],
    }
