import httpx
import os
import re
from dotenv import load_dotenv
load_dotenv()

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=20)
    return _client


def _add_pauses(text: str) -> str:
    """Insert natural pauses to slow down speech and make it human-like."""
    # Add a longer pause after sentence-ending punctuation
    text = re.sub(r'([.!?।])\s+', r'\1 ... ... ', text)
    return text


async def synthesize_speech(text: str, lang: str = "en") -> bytes:
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if lang == "hi":
        voice_id = os.getenv("ELEVENLABS_HINDI_VOICE_ID")
        model_id = "eleven_multilingual_v2"
    else:
        voice_id = os.getenv("ELEVENLABS_VOICE_ID")
        model_id = "eleven_multilingual_v2"

    text = _add_pauses(text)

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        f"?output_format=ulaw_8000&optimize_streaming_latency=2"
    )
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.90,
            "similarity_boost": 0.60,
            "style": 0.45,
            "use_speaker_boost": True,
        },
        "speed": 0.78,
    }

    client = _get_client()
    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()
    audio_bytes = response.content
    print(f"[ElevenLabs] {lang} | voice:{voice_id} | {len(audio_bytes)} bytes | '{text[:40]}'")
    return audio_bytes


async def synthesize_speech_stream(text: str, lang: str = "en"):
    """Yields audio chunks as they arrive from ElevenLabs for lower TTFB."""
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if lang == "hi":
        voice_id = os.getenv("ELEVENLABS_HINDI_VOICE_ID")
        model_id = "eleven_multilingual_v2"
    else:
        voice_id = os.getenv("ELEVENLABS_VOICE_ID")
        model_id = "eleven_multilingual_v2"

    text = _add_pauses(text)

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        f"?output_format=ulaw_8000&optimize_streaming_latency=2"
    )
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.90,
            "similarity_boost": 0.60,
            "style": 0.45,
            "use_speaker_boost": True,
        },
        "speed": 0.78,
    }

    client = _get_client()
    async with client.stream("POST", url, json=payload, headers=headers) as response:
        response.raise_for_status()
        async for chunk in response.aiter_bytes(chunk_size=3200):
            if chunk:
                yield chunk
