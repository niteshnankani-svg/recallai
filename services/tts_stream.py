"""
Streaming TTS — reduces latency significantly.
Instead of waiting for full response, synthesize
sentence by sentence and send each one immediately.

Before: user waits 4-5 seconds for full response
After:  user hears first sentence in under 1 second
"""
import asyncio
import base64
import re
from services.elevenlabs_service import synthesize_speech


def split_into_sentences(text: str) -> list[str]:
    """Split response into sentences for streaming."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


async def stream_response_audio(
    ai_text: str,
    stream_sid: str,
    websocket,
) -> None:
    """
    Converts AI response to audio sentence by sentence.
    Sends each sentence immediately — user hears response faster.
    """
    sentences = split_into_sentences(ai_text)

    if not sentences:
        return

    print(f"[TTS Stream] {len(sentences)} sentences to synthesize")

    for i, sentence in enumerate(sentences):
        try:
            audio_bytes = await synthesize_speech(sentence)
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

            await websocket.send_json({
                "event": "media",
                "streamSid": stream_sid,
                "media": {"payload": audio_b64},
            })
            print(f"[TTS Stream] Sent sentence {i+1}/{len(sentences)}: '{sentence[:40]}'")

        except Exception as e:
            print(f"[TTS Stream] Error on sentence {i+1}: {e}")
