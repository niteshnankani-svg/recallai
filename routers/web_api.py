"""
Web API
───────
JSON REST + WebSocket endpoints for the React frontend. Two prefixes:
  /api          — public: self-service "call me" (rate-limited) + watch a
                  call already in progress (by call_sid)
  /api/admin    — admin: analytics, users, memories, system status, call
                  trigger, and a live event feed across every call.
                  Protected by the same Basic Auth as /admin (see main.py).

Reuses the exact same service functions as admin_panel.py (the Gradio
console) — one source of truth, two front doors.

Public call-triggering spends real money on the Twilio account, so it's
rate-limited per phone number and per IP (services/rate_limit.py) — a call
to any number is still possible, but not repeatably/cheaply abusable.
"""

import re

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from core.auth import admin_auth_enabled, check_basic_auth
from services import call_events, rate_limit
from services.telephony import trigger_outbound_call
from services.system_status import get_env_status
from services.call_registry import set_user_name, get_all_user_names, get_call_info
from services.analytics import get_recent_calls, get_emotion_distribution, get_stats, get_latency_stats
from memory.browser import list_all_memories

router = APIRouter(prefix="/api", tags=["web-api"])

_PHONE_RE = re.compile(r"^\+?[1-9]\d{6,14}$")
CALL_RATE_LIMIT_SECONDS = 600  # one self-service call per number/IP per 10 minutes


class CallRequest(BaseModel):
    phone_number: str


class UserRequest(BaseModel):
    phone: str
    name: str


# ── public: self-service call + watch a call already in progress ──

@router.post("/call")
async def start_call(body: CallRequest, request: Request):
    phone = body.phone_number.strip()
    if not _PHONE_RE.match(phone):
        return {"ok": False, "error": "Enter a valid phone number, e.g. +919850509898."}

    client_ip = request.client.host if request.client else "unknown"
    if not rate_limit.allow(f"phone:{phone}", CALL_RATE_LIMIT_SECONDS):
        return {"ok": False, "error": "You can request a call to this number once every 10 minutes."}
    if not rate_limit.allow(f"ip:{client_ip}", CALL_RATE_LIMIT_SECONDS):
        return {"ok": False, "error": "Too many call requests from this location — please try again shortly."}

    result = trigger_outbound_call(phone)
    if not result["ok"]:
        return {"ok": False, "error": result["error"]}
    return {"ok": True, "call_sid": result["sid"]}


@router.get("/call/{call_sid}")
async def call_status(call_sid: str):
    info = get_call_info(call_sid)
    if not info:
        return {"ok": False, "error": "Call not found or has ended."}
    return {"ok": True, "call_sid": call_sid, **info}


@router.websocket("/call/{call_sid}/events")
async def call_events_ws(websocket: WebSocket, call_sid: str):
    """Live event feed for a single call — transcripts, AI replies, emotion,
    stage, lifecycle. Consumed by the web-call frontend."""
    await websocket.accept()
    queue = call_events.subscribe(call_sid)
    try:
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        call_events.unsubscribe(call_sid, queue)


# ── admin: analytics, users, memories, system status, call trigger ─

@router.get("/admin/status")
async def admin_status():
    return get_env_status()


@router.get("/admin/analytics")
async def admin_analytics():
    stats = get_stats()
    return {
        "total_calls": int(stats.get("total_calls", 0)),
        "calls_per_user": {
            key.replace("calls:", ""): int(value)
            for key, value in stats.items() if key.startswith("calls:")
        },
        "emotion_distribution": get_emotion_distribution(),
        "recent_calls": get_recent_calls(15),
    }


@router.get("/admin/users")
async def admin_list_users():
    return get_all_user_names()


@router.post("/admin/users")
async def admin_save_user(body: UserRequest):
    if not body.phone.strip() or not body.name.strip():
        return {"ok": False, "error": "Both phone number and name are required."}
    set_user_name(body.phone.strip(), body.name.strip())
    return {"ok": True}


@router.get("/admin/memories")
async def admin_memories():
    return list_all_memories()


@router.get("/admin/metrics/latency")
async def admin_latency_metrics(last_n: int | None = None):
    """
    p50/p95/p99 for transcript→first-audio latency, over the last `last_n`
    turns (default: all cached, up to 2000). Split by whether the speculative
    precompute (emotion/RAG run on interim transcripts) was ready in time —
    that split shows whether the precompute design is actually saving time.
    """
    return get_latency_stats(last_n=last_n)


@router.post("/admin/call")
async def admin_trigger_call(body: CallRequest):
    return trigger_outbound_call(body.phone_number)


@router.websocket("/admin/events")
async def admin_events_ws(websocket: WebSocket):
    """Live event feed across every call — transcripts, AI replies, emotion,
    stage, lifecycle. Consumed by the admin dashboard.

    The HTTP Basic Auth middleware in main.py doesn't run for WebSocket scope,
    so this endpoint checks auth itself. Browser JS can't set headers on a WS
    handshake, so the admin dashboard (a custom login form, not the browser's
    native auth prompt) passes credentials as `?auth=<base64 user:pass>`
    instead — accepted here as equivalent to an Authorization header."""
    auth_header = websocket.headers.get("authorization")
    if not auth_header:
        token = websocket.query_params.get("auth")
        if token:
            auth_header = f"Basic {token}"
    if admin_auth_enabled() and not check_basic_auth(auth_header):
        await websocket.close(code=1008)
        return
    await websocket.accept()
    queue = call_events.subscribe_admin()
    try:
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        call_events.unsubscribe_admin(queue)
