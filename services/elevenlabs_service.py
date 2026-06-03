import httpx
import os
from dotenv import load_dotenv
load_dotenv()


async def synthesize_speech(text: str, lang: str = "en") -> bytes:
    api_key = os.getenv("ELEVENLABS_API_KEY")

    if lang == "hi":
        voice_id = os.getenv("ELEVENLABS_HINDI_VOICE_ID")
        model_id = "eleven_turbo_v2_5"   # multilingual — required for Hindi
    else:
        voice_id = os.getenv("ELEVENLABS_VOICE_ID")
        model_id = "eleven_turbo_v2"     # English

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        f"?output_format=ulaw_8000"
    )
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.75,
            "similarity_boost": 0.85,
        },
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        audio_bytes = response.content
        header = audio_bytes[:3]
        if header == b'ID3':
            print(f"[ElevenLabs] WARNING: got MP3 not mulaw!")
        else:
            print(f"[ElevenLabs] ✓ {lang} | voice:{voice_id} | {len(audio_bytes)} bytes | '{text[:40]}'")
        return audio_bytes
