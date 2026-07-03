"""
Rate Limit
──────────
Minimal in-memory rate limiter for the public call-trigger endpoint — bounds
Twilio cost exposure from a self-service "call me" button without requiring
full auth. Not distributed; fine for RecallAI's single-process deployment.
"""

import time

_last_hit: dict[str, float] = {}  # key (phone or IP) -> last-allowed unix time


def allow(key: str, window_seconds: int) -> bool:
    """True (and records a hit) if `key` hasn't been used within `window_seconds`."""
    now = time.time()
    last = _last_hit.get(key)
    if last is not None and (now - last) < window_seconds:
        return False
    _last_hit[key] = now
    return True
