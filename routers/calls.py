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
from services.agent_service import get_ai_response, clear_call_history
from services.tts_stream import stream_response_audio

router = APIRouter(prefix="/calls", tags=["calls"])
BASE_URL = os.getenv("BASE_URL")


@router.post("/webhook")
async def call_webhook(request: Request):
    form = await request.form()
    call_sid = form.get("CallSid", "unknown")
    print(f"[Webhook] Call answered → SID: {call_sid}")
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
        clear_call_history(call_sid, user_name="Nitesh")
        clear_session_language(call_sid)
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

    async def handle_transcript(transcript: str):
        if is_speaking.is_set():
            return
        print(f"[RecallAI] User said: {transcript}")
        is_speaking.set()
        try:
            lang = detect_language(transcript, call_sid=call_sid)

            ai_response = await get_ai_response(
                transcript=transcript,
                call_sid=call_sid or "unknown",
                user_name="Nitesh",
            )
            print(f"[RecallAI] AI says ({lang}): {ai_response}")

            await stream_response_audio(ai_response, stream_sid, websocket, lang=lang)

        finally:
            is_speaking.clear()

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
                is_speaking.set()
                opening = "Hi there, this is RecallAI calling to check in on you. How are you feeling today?"
                await stream_response_audio(opening, stream_sid, websocket, lang="en")
                is_speaking.clear()

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
        await transcription_task
        if call_sid:
            clear_session_language(call_sid)
        print("[WebSocket] Cleanup complete")
