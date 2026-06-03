"""
Streaming TTS — sends audio to Twilio as it arrives from ElevenLabs.
Two modes:
  1. stream_response_audio: full streaming — pipes ElevenLabs chunks directly
  2. stream_sentences: sentence-by-sentence fallback
"""
import asyncio
import base64
import re
from services.elevenlabs_service import synthesize_speech, synthesize_speech_stream

FRAME_SIZE = 160


def split_into_sentences(text: str) -> list[str]:
    sentences = re.split(r'(?<=[.!?।])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


async def stream_response_audio(
    ai_text: str,
    stream_sid: str,
    websocket,
    lang: str = "en",
) -> None:
    """Stream audio directly from ElevenLabs to Twilio as chunks arrive."""
    print(f"[TTS Stream] Streaming: '{ai_text[:50]}...' ({lang})")

    try:
        async for chunk in synthesize_speech_stream(ai_text, lang=lang):
            for i in range(0, len(chunk), FRAME_SIZE):
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
    except Exception as e:
        print(f"[TTS Stream] Stream error, falling back to sentence mode: {e}")
        await stream_sentences(ai_text, stream_sid, websocket, lang)


async def stream_sentences(
    ai_text: str,
    stream_sid: str,
    websocket,
    lang: str = "en",
) -> None:
    """Fallback: synthesize and send sentence by sentence."""
    sentences = split_into_sentences(ai_text)
    if not sentences:
        return

    print(f"[TTS Stream] {len(sentences)} sentences to synthesize")

    for i, sentence in enumerate(sentences):
        try:
            audio_bytes = await synthesize_speech(sentence, lang=lang)
            for j in range(0, len(audio_bytes), FRAME_SIZE):
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
