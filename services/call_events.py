"""
Call Events — pub/sub bus
─────────────────────────
In-process async pub/sub for live call state (transcripts, AI replies,
emotion, lifecycle). routers/calls.py and services/agent_service.py publish;
routers/web_api.py subscribes to push updates over WebSocket to the web-call
frontend (one call) and the admin dashboard (every call) — without either
publisher knowing HTTP/WS exists.
"""

import asyncio
import time

_subscribers: dict[str, list[asyncio.Queue]] = {}   # call_sid -> queues
_admin_subscribers: list[asyncio.Queue] = []          # every call, for the admin dashboard


def publish(call_sid: str, event_type: str, data: dict | None = None) -> None:
    """Fire-and-forget publish to subscribers of this call and to admin subscribers."""
    event = {"type": event_type, "call_sid": call_sid, "ts": time.time(), **(data or {})}
    for q in _subscribers.get(call_sid, []):
        q.put_nowait(event)
    for q in _admin_subscribers:
        q.put_nowait(event)


def subscribe(call_sid: str) -> asyncio.Queue:
    """Subscribe to events for a single call (used by the web-call frontend)."""
    q: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(call_sid, []).append(q)
    return q


def unsubscribe(call_sid: str, q: asyncio.Queue) -> None:
    queues = _subscribers.get(call_sid)
    if queues and q in queues:
        queues.remove(q)
        if not queues:
            _subscribers.pop(call_sid, None)


def subscribe_admin() -> asyncio.Queue:
    """Subscribe to events across all calls (used by the admin dashboard)."""
    q: asyncio.Queue = asyncio.Queue()
    _admin_subscribers.append(q)
    return q


def unsubscribe_admin(q: asyncio.Queue) -> None:
    if q in _admin_subscribers:
        _admin_subscribers.remove(q)
