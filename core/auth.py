"""
Admin Auth
──────────
Shared Basic Auth check for everything under /admin (Gradio) and /api/admin
(REST/WS). HTTP routes are gated by the middleware in main.py; the
/api/admin WebSocket can't go through that middleware (Starlette's
`@app.middleware("http")` only runs for the "http" ASGI scope, not
"websocket"), so it calls `check_basic_auth` directly before accepting.
"""

import base64
import os
import secrets

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "")


def admin_auth_enabled() -> bool:
    return bool(ADMIN_PASS)


def check_basic_auth(header_value: str | None) -> bool:
    """Validate an `Authorization: Basic ...` header value."""
    if not header_value or not header_value.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(header_value.split(" ", 1)[1]).decode()
        username, password = decoded.split(":", 1)
    except Exception:
        return False
    return secrets.compare_digest(username, ADMIN_USER) and secrets.compare_digest(password, ADMIN_PASS)
