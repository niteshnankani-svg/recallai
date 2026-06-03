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
from services.elevenlabs_service import synthesize_speech
from services.language_detector import detect_language
from services.agent_service import get_ai_response, clear_call_history

router = APIRouter(prefix="/calls", tags=["calls"])
BASE_URL = os.getenv("BASE_URL")

FRAME_SIZE = 160
FRAME_DELAY = 0.02


async def send_audio_in_frames(websocket, stream_sid, audio_bytes):
    for i in range(0, len(audio_bytes), FRAME_SIZE):
        frame = audio_bytes[i:i + FRAME_SIZE]
        if len(frame) < FRAME_SIZE:
            frame = frame + b'\xff' * (FRAME_SIZE - len(frame))
        frame_b64 = base64.b64encode(frame).decode("utf-8")
        await websocket.send_json({
            "event": "media",
            "streamSid": stream_sid,
            "media": {"payload": frame_b64},
        })
        await asyncio.sleep(FRAME_DELAY)


@router.post("/webhook")
async def call_webhook(request: Request):
    form = await request.form()
    call_sid = form.get("CallSid", "unknown")
    print(f"[Webhook] Call answered → SID: {call_sid}")
    response = VoiceResponse()
    response.pause(length=1)
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
            # Detect once, use everywhere
            lang = detect_language(transcript)

            ai_response = get_ai_response(
                transcript=transcript,
                call_sid=call_sid or "unknown",
                user_name="Nitesh",
                detected_language=lang,
            )
            print(f"[RecallAI] AI says ({lang}): {ai_response}")

            audio_bytes = await synthesize_speech(ai_response, lang=lang)
            await send_audio_in_frames(websocket, stream_sid, audio_bytes)

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
                opening = "Hi there, this is RecallAI calling to check in on you. How are you feeling today?"
                audio_bytes = await synthesize_speech(opening, lang="en")
                await send_audio_in_frames(websocket, stream_sid, audio_bytes)

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
        print("[WebSocket] Cleanup complete")
