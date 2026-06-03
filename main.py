from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
