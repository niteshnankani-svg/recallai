import json
import os

_active_calls: dict[str, dict] = {}

_USER_NAMES_FILE = os.getenv("USER_NAMES_FILE", "./data/user_names.json")


def _load_user_names() -> dict[str, str]:
    try:
        with open(_USER_NAMES_FILE) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_user_names(names: dict[str, str]):
    os.makedirs(os.path.dirname(_USER_NAMES_FILE), exist_ok=True)
    with open(_USER_NAMES_FILE, "w") as f:
        json.dump(names, f, indent=2)


def set_user_name(phone: str, name: str):
    names = _load_user_names()
    names[phone] = name
    _save_user_names(names)


def get_user_name(phone: str) -> str:
    names = _load_user_names()
    return names.get(phone, phone)


def is_known_user(phone: str) -> bool:
    """True if we have a saved display name (not just the phone number)."""
    names = _load_user_names()
    return phone in names


def get_all_user_names() -> dict[str, str]:
    return _load_user_names()


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
