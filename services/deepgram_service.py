import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")


async def transcribe_stream(
    audio_queue: asyncio.Queue,
    transcript_callback,
    ready_event=None,
    interim_callback=None,
) -> None:
    deepgram = DeepgramClient(DEEPGRAM_API_KEY)
    connection = deepgram.listen.asynclive.v("1")

    async def on_transcript(self, result, **kwargs):
        try:
            transcript = result.channel.alternatives[0].transcript
            is_final = result.is_final
            if not transcript.strip():
                return
            if is_final:
                print(f"[Deepgram] ✓ {transcript}")
                await transcript_callback(transcript)
            elif interim_callback is not None:
                # Interim hypothesis — used to precompute emotion/RAG while
                # the user is still speaking (zero perceived latency).
                await interim_callback(transcript)
        except Exception as e:
            print(f"[Deepgram] Parse error: {e}")

    async def on_open(self, open, **kwargs):
        print(f"[Deepgram] Connection opened ✓")
        if ready_event:
            ready_event.set()

    async def on_error(self, error, **kwargs):
        pass

    async def on_close(self, close, **kwargs):
        print(f"[Deepgram] Connection closed")

    async def on_utterance_end(self, utterance_end, **kwargs):
        print(f"[Deepgram] Utterance end detected")

    connection.on(LiveTranscriptionEvents.Transcript, on_transcript)
    connection.on(LiveTranscriptionEvents.Open, on_open)
    connection.on(LiveTranscriptionEvents.Error, on_error)
    connection.on(LiveTranscriptionEvents.Close, on_close)
    connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

    options = LiveOptions(
        model="nova-3",
        language="multi",
        encoding="mulaw",
        sample_rate=8000,
        channels=1,
        interim_results=True,
        endpointing=250,
        utterance_end_ms=1200,
        smart_format=True,
        punctuate=True,
        filler_words=True,
    )

    started = await connection.start(options)
    print(f"[Deepgram] Started: {started} (nova-3 multilingual)")

    while True:
        chunk = await audio_queue.get()
        if chunk is None:
            break
        try:
            await connection.send(chunk)
        except Exception:
            pass

    try:
        await connection.finish()
    except Exception:
        pass

    print("[Deepgram] Session closed")
