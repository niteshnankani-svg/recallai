"""
System Status
─────────────
Environment-key health checks, shared by the Gradio admin console
(admin_panel.py) and the REST API (routers/web_api.py).
"""

import os

_ENV_KEYS = [
    "ANTHROPIC_API_KEY",
    "DEEPGRAM_API_KEY",
    "ELEVENLABS_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "BASE_URL",
]


def get_env_status() -> dict:
    """Returns an ordered dict of key -> bool (present/ok), including Redis."""
    status = {key: bool(os.environ.get(key)) for key in _ENV_KEYS}

    from services import redis_store
    status["REDIS (persistent store)"] = redis_store.is_available()

    return status
