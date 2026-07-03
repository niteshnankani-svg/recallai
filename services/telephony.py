"""
Telephony
─────────
Outbound-call triggering, shared by the Gradio admin console (admin_panel.py)
and the REST API (routers/web_api.py) so there is one source of truth.
"""

import os


def trigger_outbound_call(phone_number: str) -> dict:
    """Place an outbound Twilio call to `phone_number`.

    Returns {"ok": True, "sid": ...} on success or {"ok": False, "error": ...}.
    """
    try:
        from twilio.rest import Client

        sid = os.environ.get("TWILIO_ACCOUNT_SID")
        token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_number = os.environ.get("TWILIO_PHONE_NUMBER")
        base_url = os.environ.get("BASE_URL")

        if not all([sid, token, from_number, base_url]):
            return {"ok": False, "error": "Missing Twilio or BASE_URL environment variables."}

        client = Client(sid, token)
        call = client.calls.create(
            to=phone_number,
            from_=from_number,
            url=f"{base_url}/calls/webhook",
            status_callback=f"{base_url}/calls/status",
            status_callback_event=["initiated", "ringing", "answered", "completed"],
        )
        return {"ok": True, "sid": call.sid}
    except Exception as e:
        return {"ok": False, "error": str(e)}
