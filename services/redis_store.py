"""
Redis Store
───────────
Persistent key-value store backed by Redis.
Used for data that must survive container restarts (user names, call stats).

Falls back to in-memory dict if Redis is unavailable — the app still works,
just loses persistence on redeploy.
"""

import json
import os
import redis

_client: redis.Redis | None = None
_fallback: dict[str, str] = {}
_redis_available = False


def _get_client() -> redis.Redis | None:
    global _client, _redis_available
    if _client is not None:
        return _client

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("[Redis] No REDIS_URL set — using in-memory fallback")
        _redis_available = False
        return None

    try:
        _client = redis.from_url(redis_url, decode_responses=True, socket_timeout=3)
        _client.ping()
        _redis_available = True
        print(f"[Redis] Connected ✓")
        return _client
    except Exception as e:
        print(f"[Redis] Connection failed: {e} — using in-memory fallback")
        _client = None
        _redis_available = False
        return None


def is_available() -> bool:
    _get_client()
    return _redis_available


# --- Simple key-value operations ---

def set(key: str, value: str, ex: int | None = None):
    """Set a string value. ex = expiry in seconds."""
    client = _get_client()
    if client:
        try:
            client.set(key, value, ex=ex)
            return
        except Exception as e:
            print(f"[Redis] SET error: {e}")
    _fallback[key] = value


def get(key: str) -> str | None:
    client = _get_client()
    if client:
        try:
            return client.get(key)
        except Exception as e:
            print(f"[Redis] GET error: {e}")
    return _fallback.get(key)


def delete(key: str):
    client = _get_client()
    if client:
        try:
            client.delete(key)
            return
        except Exception as e:
            print(f"[Redis] DEL error: {e}")
    _fallback.pop(key, None)


# --- Hash operations (for user names, structured data) ---

def hset(name: str, key: str, value: str):
    client = _get_client()
    if client:
        try:
            client.hset(name, key, value)
            return
        except Exception as e:
            print(f"[Redis] HSET error: {e}")
    if name not in _fallback:
        _fallback[name] = {}
    _fallback[name][key] = value


def hget(name: str, key: str) -> str | None:
    client = _get_client()
    if client:
        try:
            return client.hget(name, key)
        except Exception as e:
            print(f"[Redis] HGET error: {e}")
    fb = _fallback.get(name)
    if isinstance(fb, dict):
        return fb.get(key)
    return None


def hgetall(name: str) -> dict[str, str]:
    client = _get_client()
    if client:
        try:
            return client.hgetall(name)
        except Exception as e:
            print(f"[Redis] HGETALL error: {e}")
    fb = _fallback.get(name)
    if isinstance(fb, dict):
        return fb
    return {}


def hexists(name: str, key: str) -> bool:
    client = _get_client()
    if client:
        try:
            return client.hexists(name, key)
        except Exception as e:
            print(f"[Redis] HEXISTS error: {e}")
    fb = _fallback.get(name)
    return isinstance(fb, dict) and key in fb


# --- List operations (for rolling metric sample windows) ---

def rpush_capped(name: str, value: str, cap: int):
    """Append to a list, trimming it to the most recent `cap` entries."""
    client = _get_client()
    if client:
        try:
            pipe = client.pipeline()
            pipe.rpush(name, value)
            pipe.ltrim(name, -cap, -1)
            pipe.execute()
            return
        except Exception as e:
            print(f"[Redis] RPUSH error: {e}")
    lst = _fallback.setdefault(name, [])
    if not isinstance(lst, list):
        lst = []
        _fallback[name] = lst
    lst.append(value)
    del lst[:-cap]


def lrange(name: str, start: int, end: int) -> list[str]:
    client = _get_client()
    if client:
        try:
            return client.lrange(name, start, end)
        except Exception as e:
            print(f"[Redis] LRANGE error: {e}")
    lst = _fallback.get(name)
    if not isinstance(lst, list):
        return []
    if end == -1:
        return lst[start:]
    return lst[start:end + 1]
