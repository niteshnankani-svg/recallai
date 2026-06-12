"""
Streaming TTS — sends audio to Twilio as it arrives from ElevenLabs.
Two modes:
  1. stream_response_audio: full streaming — pipes ElevenLabs chunks directly
  2. stream_sentences: sentence-by-sentence fallback

Supports barge-in: pass an asyncio.Event as `interrupted` — when set,
streaming stops immediately and Twilio's audio buffer is cleared.
"""
import asyncio
import base64
import re
from services.elevenlabs_service import synthesize_speech, synthesize_speech_stream
from services.sarvam_service import sarvam_synthesize

FRAME_SIZE = 160


def split_into_sentences(text: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?।])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


async def _clear_twilio_audio(stream_sid: str, websocket):
    """Send a clear message to flush Twilio's audio buffer."""
    try:
        await websocket.send_json({
            "event": "clear",
            "streamSid": stream_sid,
        })
        print(f"[TTS Stream] Cleared Twilio audio buffer")
    except Exception as e:
        print(f"[TTS Stream] Clear error: {e}")


async def _send_frames(audio_bytes: bytes, stream_sid: str, websocket,
                       interrupted: asyncio.Event | None) -> bool:
    """Frame raw mulaw bytes out to Twilio. Returns False if interrupted."""
    for i in range(0, len(audio_bytes), FRAME_SIZE):
        if interrupted and interrupted.is_set():
            await _clear_twilio_audio(stream_sid, websocket)
            return False
        frame = audio_bytes[i:i + FRAME_SIZE]
        if len(frame) < FRAME_SIZE:
            frame = frame + b'\xff' * (FRAME_SIZE - len(frame))
        frame_b64 = base64.b64encode(frame).decode("utf-8")
        await websocket.send_json({
            "event": "media",
            "streamSid": stream_sid,
            "media": {"payload": frame_b64},
        })
    return True


async def _stream_sarvam(ai_text, stream_sid, websocket, interrupted) -> bool:
    """Hindi TTS via Sarvam Bulbul (native Indian-language voice)."""
    if interrupted and interrupted.is_set():
        return False
    try:
        audio_bytes = await sarvam_synthesize(ai_text)
    except Exception as e:
        print(f"[TTS Stream] Sarvam error: {e}")
        return True
    return await _send_frames(audio_bytes, stream_sid, websocket, interrupted)


async def stream_response_audio(
    ai_text: str,
    stream_sid: str,
    websocket,
    lang: str = "en",
    interrupted: asyncio.Event | None = None,
) -> bool:
    """Stream audio to Twilio. Hindi → Sarvam Bulbul, English → ElevenLabs.
    Returns True if completed, False if interrupted."""
    print(f"[TTS Stream] Streaming: '{ai_text[:50]}...' ({lang})")

    if lang == "hi":
        return await _stream_sarvam(ai_text, stream_sid, websocket, interrupted)

    try:
        async for chunk in synthesize_speech_stream(ai_text, lang=lang):
            if interrupted and interrupted.is_set():
                print(f"[TTS Stream] Interrupted — stopping")
                await _clear_twilio_audio(stream_sid, websocket)
                return False

            for i in range(0, len(chunk), FRAME_SIZE):
                if interrupted and interrupted.is_set():
                    print(f"[TTS Stream] Interrupted mid-chunk — stopping")
                    await _clear_twilio_audio(stream_sid, websocket)
                    return False

                frame = chunk[i:i + FRAME_SIZE]
                if len(frame) < FRAME_SIZE:
                    frame = frame + b'\xff' * (FRAME_SIZE - len(frame))
                frame_b64 = base64.b64encode(frame).decode("utf-8")
                await websocket.send_json({
                    "event": "media",
                    "streamSid": stream_sid,
                    "media": {"payload": frame_b64},
                })
        print(f"[TTS Stream] Done streaming")
        return True
    except Exception as e:
        print(f"[TTS Stream] Stream error, falling back to sentence mode: {e}")
        return await stream_sentences(ai_text, stream_sid, websocket, lang, interrupted)


async def stream_sentences(
    ai_text: str,
    stream_sid: str,
    websocket,
    lang: str = "en",
    interrupted: asyncio.Event | None = None,
) -> bool:
    """Fallback: synthesize and send sentence by sentence.
    Returns True if completed, False if interrupted."""
    sentences = split_into_sentences(ai_text)
    if not sentences:
        return True

    print(f"[TTS Stream] {len(sentences)} sentences to synthesize")

    for i, sentence in enumerate(sentences):
        if interrupted and interrupted.is_set():
            print(f"[TTS Stream] Interrupted before sentence {i+1}")
            await _clear_twilio_audio(stream_sid, websocket)
            return False

        try:
            audio_bytes = await synthesize_speech(sentence, lang=lang)
            for j in range(0, len(audio_bytes), FRAME_SIZE):
                if interrupted and interrupted.is_set():
                    await _clear_twilio_audio(stream_sid, websocket)
                    return False

                frame = audio_bytes[j:j + FRAME_SIZE]
                if len(frame) < FRAME_SIZE:
                    frame = frame + b'\xff' * (FRAME_SIZE - len(frame))
                frame_b64 = base64.b64encode(frame).decode("utf-8")
                await websocket.send_json({
                    "event": "media",
                    "streamSid": stream_sid,
                    "media": {"payload": frame_b64},
                })
            print(f"[TTS Stream] Sent sentence {i+1}/{len(sentences)}")
        except Exception as e:
            print(f"[TTS Stream] Error on sentence {i+1}: {e}")
    return True
