"""
Call Registry
─────────────
Maps call_sid → user info for active calls (in-memory, ephemeral).
Maps phone → display name persistently via Redis (survives redeploys).
"""

from services import redis_store

_active_calls: dict[str, dict] = {}

USER_NAMES_KEY = "recallai:user_names"


def set_user_name(phone: str, name: str):
    redis_store.hset(USER_NAMES_KEY, phone, name)


def get_user_name(phone: str) -> str:
    name = redis_store.hget(USER_NAMES_KEY, phone)
    return name if name else phone


def is_known_user(phone: str) -> bool:
    """True if we have a saved display name (not just the phone number)."""
    return redis_store.hexists(USER_NAMES_KEY, phone)


def get_all_user_names() -> dict[str, str]:
    return redis_store.hgetall(USER_NAMES_KEY)


def register_call(call_sid: str, from_number: str, to_number: str, direction: str):
    phone = to_number if direction == "outbound" else from_number
    _active_calls[call_sid] = {
        "phone": phone,
        "from": from_number,
        "to": to_number,
        "direction": direction,
        "user_name": get_user_name(phone),
    }
    print(f"[Registry] Call {call_sid} registered — user: {_active_calls[call_sid]['user_name']} ({phone})")


def get_call_info(call_sid: str) -> dict | None:
    return _active_calls.get(call_sid)


def get_user_for_call(call_sid: str) -> str:
    info = _active_calls.get(call_sid)
    if not info:
        return "Unknown"
    return info["user_name"]


def get_phone_for_call(call_sid: str) -> str:
    info = _active_calls.get(call_sid)
    if not info:
        return "unknown"
    return info["phone"]


def update_call_user_name(call_sid: str, name: str):
    """Update the user name for an active call after name extraction."""
    info = _active_calls.get(call_sid)
    if info:
        info["user_name"] = name
        set_user_name(info["phone"], name)
        print(f"[Registry] Updated call {call_sid} user name → {name}")


def unregister_call(call_sid: str):
    _active_calls.pop(call_sid, None)
