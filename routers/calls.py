import asyncio
import base64
import json
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream

from services.deepgram_service import transcribe_stream
from services.language_detector import detect_language, clear_session_language
from services.agent_service import get_ai_response_streaming, clear_call_history
from services.tts_stream import stream_response_audio
from services.call_registry import (
    register_call, get_user_for_call, get_phone_for_call,
    unregister_call, is_known_user, update_call_user_name,
)
from services.name_extractor import extract_name

router = APIRouter(prefix="/calls", tags=["calls"])
BASE_URL = os.getenv("BASE_URL")


@router.post("/webhook")
async def call_webhook(request: Request):
    form = await request.form()
    call_sid = form.get("CallSid", "unknown")
    from_number = form.get("From", "unknown")
    to_number = form.get("To", "unknown")
    direction = form.get("Direction", "inbound")
    direction = "outbound" if "outbound" in direction.lower() else "inbound"
    register_call(call_sid, from_number, to_number, direction)
    print(f"[Webhook] Call answered → SID: {call_sid} | {from_number} → {to_number}")
    response = VoiceResponse()
    connect = Connect()
    stream = Stream(url=f"wss://{request.headers['host']}/calls/stream")
    connect.append(stream)
    response.append(connect)
    return Response(content=str(response), media_type="application/xml")


@router.post("/status")
async def call_status(request: Request):
    form = await request.form()
    status = form.get("CallStatus", "unknown")
    call_sid = form.get("CallSid", "unknown")
    print(f"[Status] Call {call_sid} → {status}")
    if status == "completed":
        user_name = get_user_for_call(call_sid)
        phone = get_phone_for_call(call_sid)
        clear_call_history(call_sid, user_name=user_name, phone=phone)
        clear_session_language(call_sid)
        unregister_call(call_sid)
    return Response(status_code=200)


@router.websocket("/stream")
async def media_stream(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Connected")

    stream_sid = None
    call_sid = None
    audio_queue: asyncio.Queue = asyncio.Queue()
    deepgram_ready = asyncio.Event()
    is_speaking = asyncio.Event()
    interrupted = asyncio.Event()
    speaking_task: asyncio.Task | None = None
    silence_task: asyncio.Task | None = None
    awaiting_name = False
    silence_nudge_count = 0

    SILENCE_TIMEOUT = 20  # seconds
    MAX_NUDGES = 2

    NUDGE_MESSAGES = [
        "I'm still here whenever you're ready. Take your time.",
        "No rush at all. I'm here if you'd like to keep talking.",
    ]

    async def _silence_watcher():
        """Nudge the user after prolonged silence."""
        nonlocal silence_nudge_count, speaking_task
        try:
            while silence_nudge_count < MAX_NUDGES:
                await asyncio.sleep(SILENCE_TIMEOUT)
                if not is_speaking.is_set() and stream_sid:
                    msg = NUDGE_MESSAGES[min(silence_nudge_count, len(NUDGE_MESSAGES) - 1)]
                    print(f"[Silence] Nudge #{silence_nudge_count + 1}: {msg}")
                    speaking_task = asyncio.create_task(_speak(msg))
                    silence_nudge_count += 1
        except asyncio.CancelledError:
            pass

    def _reset_silence_timer():
        """Reset the silence timer when user speaks."""
        nonlocal silence_task, silence_nudge_count
        silence_nudge_count = 0
        if silence_task and not silence_task.done():
            silence_task.cancel()
        silence_task = asyncio.create_task(_silence_watcher())

    async def _interrupt_current_speech():
        """Cancel current AI speech if playing."""
        nonlocal speaking_task
        if is_speaking.is_set() and speaking_task and not speaking_task.done():
            interrupted.set()
            print("[Barge-in] User interrupted — cancelling AI speech")
            try:
                await asyncio.wait_for(speaking_task, timeout=1.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                speaking_task.cancel()
            is_speaking.clear()
            interrupted.clear()

    async def _speak(text: str, lang: str = "en"):
        """Stream TTS with interruption support."""
        interrupted.clear()
        is_speaking.set()
        try:
            await stream_response_audio(text, stream_sid, websocket, lang=lang, interrupted=interrupted)
        finally:
            is_speaking.clear()

    async def handle_transcript(transcript: str):
        nonlocal awaiting_name, speaking_task

        # --- Barge-in: interrupt AI if it's speaking ---
        if is_speaking.is_set():
            await _interrupt_current_speech()

        print(f"[RecallAI] User said: {transcript}")
        _reset_silence_timer()

        # --- Name extraction for first-time callers ---
        if awaiting_name:
            name = await extract_name(transcript)
            if name:
                update_call_user_name(call_sid, name)
                awaiting_name = False
                greeting = f"Great to meet you, {name}! I'm RecallAI, your wellness companion. How are you feeling today?"
                print(f"[RecallAI] Name captured: {name}")
                speaking_task = asyncio.create_task(_speak(greeting))
                return
            else:
                awaiting_name = False
                fallback = "No worries! I'm RecallAI, your wellness companion. How are you feeling today?"
                speaking_task = asyncio.create_task(_speak(fallback))
                return

        # --- Normal conversation flow ---
        lang = detect_language(transcript, call_sid=call_sid)
        user_name = get_user_for_call(call_sid or "unknown")

        async def _stream_ai_response():
            interrupted.clear()
            is_speaking.set()
            try:
                async for sentence, full_so_far in get_ai_response_streaming(
                    transcript=transcript,
                    call_sid=call_sid or "unknown",
                    user_name=user_name,
                ):
                    if interrupted.is_set():
                        print(f"[Barge-in] Stopping mid-response")
                        break
                    print(f"[RecallAI] Streaming sentence ({lang}): {sentence}")
                    completed = await stream_response_audio(
                        sentence, stream_sid, websocket, lang=lang, interrupted=interrupted,
                    )
                    if not completed:
                        break
            finally:
                is_speaking.clear()

        speaking_task = asyncio.create_task(_stream_ai_response())

    async def run_deepgram():
        await transcribe_stream(audio_queue, handle_transcript, deepgram_ready)

    transcription_task = asyncio.create_task(run_deepgram())

    try:
        await asyncio.wait_for(deepgram_ready.wait(), timeout=5.0)
        print("[WebSocket] Deepgram ready")
    except asyncio.TimeoutError:
        print("[WebSocket] Deepgram timeout — continuing")

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event_type = data.get("event")

            if event_type == "start":
                stream_sid = data["start"]["streamSid"]
                call_sid = data["start"].get("callSid", "unknown")
                print(f"[WebSocket] Stream started → {stream_sid}")

                phone = get_phone_for_call(call_sid)
                if is_known_user(phone):
                    user_name = get_user_for_call(call_sid)
                    opening = f"Hi {user_name}, this is RecallAI. How have you been since we last talked?"
                    print(f"[WebSocket] Returning user: {user_name}")
                else:
                    opening = "Hi there! I'm RecallAI, your wellness companion. I'd love to get to know you. What's your name?"
                    awaiting_name = True
                    print(f"[WebSocket] New user — asking for name")

                speaking_task = asyncio.create_task(_speak(opening))
                _reset_silence_timer()

            elif event_type == "media":
                audio_bytes = base64.b64decode(data["media"]["payload"])
                await audio_queue.put(audio_bytes)

            elif event_type == "stop":
                print("[WebSocket] Stream stopped")
                break

    except WebSocketDisconnect:
        print("[WebSocket] Disconnected")

    finally:
        await audio_queue.put(None)
        if silence_task and not silence_task.done():
            silence_task.cancel()
        if speaking_task and not speaking_task.done():
            speaking_task.cancel()
        await transcription_task
        if call_sid:
            clear_session_language(call_sid)
        print("[WebSocket] Cleanup complete")
