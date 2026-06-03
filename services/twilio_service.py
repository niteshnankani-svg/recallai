from core.config import settings
from twilio.rest import Client

client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def initiate_call(to_number: str, user_name: str) -> str:
    call = client.calls.create(
        to=to_number,
        from_=settings.TWILIO_PHONE_NUMBER,
        url=f"{settings.BASE_URL}/calls/webhook",
        status_callback=f"{settings.BASE_URL}/calls/status",
        status_callback_method="POST",
    )
    print(
        f"[Twilio] Call initiated → SID: {call.sid} | To: {to_number} | User: {user_name}")
    return call.sid


def end_call(call_sid: str) -> None:
    client.calls(call_sid).update(status="completed")
    print(f"[Twilio] Call {call_sid} ended")
