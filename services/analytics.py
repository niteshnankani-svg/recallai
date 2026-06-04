"""
Analytics
─────────
Tracks call events and emotion data in Redis for the admin dashboard.

Redis keys used:
  recallai:calls              — hash of call_sid → JSON call metadata
  recallai:calls:list         — sorted set of call_sids by timestamp
  recallai:emotions           — hash of emotion → count
  recallai:emotions:{user}    — hash of emotion → count per user
  recallai:stats              — hash of aggregate stats
"""

import json
import time
from datetime import datetime
from services import redis_store


def record_call_start(call_sid: str, phone: str, user_name: str, direction: str):
    """Record when a call begins."""
    now = datetime.now().isoformat()
    call_data = {
        "call_sid": call_sid,
        "phone": phone,
        "user_name": user_name,
        "direction": direction,
        "started_at": now,
        "ended_at": None,
        "duration_seconds": None,
        "emotions": [],
        "exchanges": 0,
    }
    redis_store.set(f"recallai:call:{call_sid}", json.dumps(call_data), ex=86400 * 30)

    # Add to sorted set (score = timestamp for ordering)
    client = redis_store._get_client()
    if client:
        try:
            client.zadd("recallai:calls:list", {call_sid: time.time()})
        except Exception as e:
            print(f"[Analytics] zadd error: {e}")

    # Increment total call count
    if client:
        try:
            client.hincrby("recallai:stats", "total_calls", 1)
            client.hincrby("recallai:stats", f"calls:{user_name}", 1)
        except Exception:
            pass

    print(f"[Analytics] Call started: {call_sid} ({user_name})")


def record_call_end(call_sid: str):
    """Record when a call ends and calculate duration."""
    raw = redis_store.get(f"recallai:call:{call_sid}")
    if not raw:
        return

    try:
        call_data = json.loads(raw)
    except json.JSONDecodeError:
        return

    now = datetime.now().isoformat()
    call_data["ended_at"] = now

    started = datetime.fromisoformat(call_data["started_at"])
    ended = datetime.fromisoformat(now)
    duration = int((ended - started).total_seconds())
    call_data["duration_seconds"] = duration

    redis_store.set(f"recallai:call:{call_sid}", json.dumps(call_data), ex=86400 * 30)
    print(f"[Analytics] Call ended: {call_sid} — {duration}s")


def record_emotion(call_sid: str, emotion: str, user_name: str):
    """Record an emotion detection event."""
    # Global emotion count
    client = redis_store._get_client()
    if client:
        try:
            client.hincrby("recallai:emotions", emotion, 1)
            client.hincrby(f"recallai:emotions:{user_name}", emotion, 1)
        except Exception:
            pass

    # Append to call data
    raw = redis_store.get(f"recallai:call:{call_sid}")
    if raw:
        try:
            call_data = json.loads(raw)
            call_data["emotions"].append(emotion)
            call_data["exchanges"] = call_data.get("exchanges", 0) + 1
            redis_store.set(f"recallai:call:{call_sid}", json.dumps(call_data), ex=86400 * 30)
        except Exception:
            pass


def get_recent_calls(limit: int = 20) -> list[dict]:
    """Get the most recent calls."""
    client = redis_store._get_client()
    if not client:
        return []

    try:
        call_sids = client.zrevrange("recallai:calls:list", 0, limit - 1)
    except Exception:
        return []

    calls = []
    for sid in call_sids:
        raw = redis_store.get(f"recallai:call:{sid}")
        if raw:
            try:
                calls.append(json.loads(raw))
            except json.JSONDecodeError:
                pass
    return calls


def get_emotion_distribution() -> dict[str, int]:
    """Get global emotion counts."""
    return {k: int(v) for k, v in redis_store.hgetall("recallai:emotions").items()}


def get_user_emotion_distribution(user_name: str) -> dict[str, int]:
    """Get emotion counts for a specific user."""
    return {k: int(v) for k, v in redis_store.hgetall(f"recallai:emotions:{user_name}").items()}


def get_stats() -> dict[str, str]:
    """Get aggregate stats."""
    return redis_store.hgetall("recallai:stats")
