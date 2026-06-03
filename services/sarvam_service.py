import httpx
import os
import base64
from dotenv import load_dotenv
load_dotenv()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")


async def sarvam_transcribe(audio_bytes: bytes) -> str:
    import audioop, io, wave
    pcm_data = audioop.ulaw2lin(audio_bytes, 2)
    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(8000)
        wf.writeframes(pcm_data)
    wav_bytes = wav_buffer.getvalue()

    url = "https://api.sarvam.ai/speech-to-text"
    headers = {"api-subscription-key": SARVAM_API_KEY}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            headers=headers,
            files={"file": ("audio.wav", wav_bytes, "audio/wav")},
            data={"language_code": "unknown", "model": "saarika:v2.5"},
        )
        response.raise_for_status()
        result = response.json()
        transcript = result.get("transcript", "")
        print(f"[Sarvam STT] {transcript}")
        return transcript


async def sarvam_synthesize(text: str) -> bytes:
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "target_language_code": "hi-IN",
        "speaker": "priya",
        "model": "bulbul:v3",
        "pace": 1.0,
        "temperature": 0.6,
        "speech_sample_rate": 8000,
        "output_audio_codec": "mulaw",
        "enable_preprocessing": True,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        audio_b64 = result.get("audios", [""])[0]
        mulaw_bytes = base64.b64decode(audio_b64)
        print(f"[Sarvam TTS] {len(mulaw_bytes)} bytes | '{text[:50]}'")
        return mulaw_bytes
