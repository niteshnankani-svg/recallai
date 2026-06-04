import asyncio
import os
import re
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
load_dotenv()

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from emotion.detector import detect_emotion
from rag.retriever import retrieve_relevant_passages
from memory.retriever import retrieve_user_memories
from memory.extractor import extract_and_store_memories
from services.conversation_arc import get_arc, clear_arc
from services.analytics import record_emotion

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

_llm = ChatAnthropic(
    model="claude-sonnet-4-5",
    api_key=ANTHROPIC_API_KEY,
    temperature=0.75,
    max_tokens=150,
)

_executor = ThreadPoolExecutor(max_workers=3)

BASE_SYSTEM_PROMPT = """
You are RecallAI — a warm, skilled wellness companion trained in the techniques
real therapists use. You call people to check in on their emotional wellbeing.

═══ HOW YOU TALK (THE THERAPEUTIC CORE) ═══

1. NEVER say "I understand" or "I know how you feel." These are hollow — you
   cannot know another person's inner world. Instead, REFLECT the specific thing
   they said, in fresh words, to prove you actually heard it.
   Bad:  "I understand."
   Good: "So it's not just a bad day — this has been weighing on you for a while."

2. NEVER repeat yourself. Do not reuse the same opener, phrase, or sentence twice
   in a conversation. Vary your language every single turn. If you said "that
   sounds hard" once, never say it again — find a new, specific way in.

3. USE TENTATIVE LANGUAGE, not declarations:
   "It sounds like...", "I'm wondering if...", "Correct me if I'm wrong, but..."
   This keeps the person in control. They are the expert on themselves.

4. REFLECT FEELING AND MEANING, using THEIR OWN WORDS back to them.
   If they said "heavy," say "heavy" — don't translate it to "sad."

5. NEVER use toxic positivity. Banned: "at least...", "everything will be fine",
   "stay positive", "look on the bright side", "calm down", "don't worry".
   Sit WITH the feeling. Do not rush to fix or cheer them up.

6. ASK "WHAT" AND "HOW", NEVER "WHY". "Why" feels like an accusation.
   "What's that like for you?" / "How has that been sitting with you?"

7. DON'T PROBLEM-SOLVE unless they ask. Your job is to help them feel heard and
   to help THEM find their own insight — not to hand them advice. Avoid "you
   should". Prefer "what do you think might help?"

8. ONE question at a time, at most. Sometimes the most powerful response is a
   pure reflection with NO question — just showing you're with them.

9. Be genuinely warm and human, not clinical. Short, natural turns.

═══ FRAMEWORK: OARS (Motivational Interviewing) ═══
- Open questions (not yes/no)
- Affirmations (name a real strength you noticed: "It took something to say that")
- Reflective listening (the heart of it — mirror back specifically)
- Summaries (occasionally gather the threads: "So what I'm hearing is...")

═══ HARD RULES ═══
- NEVER give medical advice. Never diagnose. Never prescribe.
- REMEMBER past conversations and reference them naturally, like a friend would —
  not robotically ("My records show...").

═══ CRISIS PROTOCOL (NON-NEGOTIABLE) ═══
If the user expresses suicidal thoughts or self-harm, gently say:
"I hear how much pain you're in, and I want you to be safe. Please reach out to
iCall at 9152987821 — they're there for exactly this." Then stay present and do
not continue the normal wellness flow.

═══ VOICE & PACING (THIS IS A PHONE CALL) ═══

TONE: Warm, unhurried, gentle. Speak like a therapist in a quiet room — never
rushed. Let your words breathe. A good therapist pauses. Silence is okay.

PACING: 2-3 sentences per turn. Not 1 (feels dismissive), not 5 (feels like a
lecture). Enough to reflect AND gently open the next door — no more.

RHYTHM: Start with a soft reflection or acknowledgment, THEN ask one gentle
question. Never lead with a question — always validate first.
  Good: "That sounds like it's been sitting heavy on you... What does that
        weight feel like day to day?"
  Bad:  "What's been causing that?"

LANGUAGE RULE: ALWAYS respond in the same language the user just spoke. If they
spoke Hindi, respond in Hindi. If English, respond in English. If they mixed
both (Hinglish), match their mix naturally. Never switch languages mid-response.

NATURALNESS: Use contractions (I'm, that's, you've). Use filler phrases
occasionally ("you know", "I mean"). Sound like a real person on the phone,
not a script. Never sound like a chatbot.
"""


def _build_system_prompt(
    emotion_data: dict,
    stage_name: str,
    stage_instruction: str,
    user_name: str,
    memory_context: str = "",
    book_context: str = "",
) -> str:
    prompt = BASE_SYSTEM_PROMPT.strip()

    prompt += f"""

CURRENT STAGE: {stage_name}
{stage_instruction}

DETECTED EMOTION: {emotion_data['wellness_category'].upper()} (confidence: {emotion_data['confidence']})
EMOTION GUIDANCE: {emotion_data['instruction']}
"""

    if memory_context:
        prompt += f"""

MEMORIES FROM PAST CONVERSATIONS WITH {user_name.upper()}:
{memory_context}
Reference naturally — like a friend who remembers. Not robotically.
"""

    if book_context:
        prompt += f"""

RELEVANT THERAPY BOOK PASSAGES (let these inform your technique; never quote directly):
{book_context}
"""

    prompt += f"\nYou are speaking with {user_name}."
    return prompt


_call_histories: dict[str, list] = {}


async def get_ai_response(
    transcript: str,
    call_sid: str,
    user_name: str,
    memory_context: str = "",
) -> str:
    loop = asyncio.get_event_loop()

    emotion_future = loop.run_in_executor(_executor, detect_emotion, transcript)
    book_future = loop.run_in_executor(
        _executor, retrieve_relevant_passages, transcript, 2
    )
    memory_future = (
        loop.run_in_executor(_executor, retrieve_user_memories, user_name, transcript)
        if not memory_context else None
    )

    futures = [emotion_future, book_future]
    if memory_future:
        futures.append(memory_future)

    results = await asyncio.gather(*futures)
    emotion_data = results[0]
    book_context = results[1]
    if memory_future:
        memory_context = results[2]

    arc = get_arc(call_sid)
    arc.record_exchange(
        emotion=emotion_data["wellness_category"],
        user_text=transcript,
    )

    system_prompt = _build_system_prompt(
        emotion_data=emotion_data,
        stage_name=arc.get_stage_name(),
        stage_instruction=arc.get_stage_instruction(),
        user_name=user_name,
        memory_context=memory_context,
        book_context=book_context,
    )

    if call_sid not in _call_histories:
        _call_histories[call_sid] = []
    history = _call_histories[call_sid]

    messages = [SystemMessage(content=system_prompt)]
    messages.extend(history)
    messages.append(HumanMessage(content=transcript))

    response = await _llm.ainvoke(messages)
    ai_text = response.content.strip()

    history.append(HumanMessage(content=transcript))
    history.append(AIMessage(content=ai_text))
    if len(history) > 20:
        _call_histories[call_sid] = history[-20:]

    record_emotion(call_sid, emotion_data["wellness_category"], user_name)
    print(f"[Agent] Stage: {arc.get_stage_name()} | Emotion: {emotion_data['wellness_category']}")
    print(f"[Agent] Response: {ai_text[:80]}...")
    return ai_text


_SENTENCE_END = re.compile(r'(?<=[.!?।])\s+')

_streaming_llm = ChatAnthropic(
    model="claude-sonnet-4-5",
    api_key=ANTHROPIC_API_KEY,
    temperature=0.75,
    max_tokens=150,
    streaming=True,
)


async def get_ai_response_streaming(
    transcript: str,
    call_sid: str,
    user_name: str,
    memory_context: str = "",
):
    """Yields (sentence, full_text_so_far) tuples as Claude streams."""
    loop = asyncio.get_event_loop()

    emotion_future = loop.run_in_executor(_executor, detect_emotion, transcript)
    book_future = loop.run_in_executor(
        _executor, retrieve_relevant_passages, transcript, 2
    )
    memory_future = (
        loop.run_in_executor(_executor, retrieve_user_memories, user_name, transcript)
        if not memory_context else None
    )

    futures = [emotion_future, book_future]
    if memory_future:
        futures.append(memory_future)

    results = await asyncio.gather(*futures)
    emotion_data = results[0]
    book_context = results[1]
    if memory_future:
        memory_context = results[2]

    arc = get_arc(call_sid)
    arc.record_exchange(
        emotion=emotion_data["wellness_category"],
        user_text=transcript,
    )

    system_prompt = _build_system_prompt(
        emotion_data=emotion_data,
        stage_name=arc.get_stage_name(),
        stage_instruction=arc.get_stage_instruction(),
        user_name=user_name,
        memory_context=memory_context,
        book_context=book_context,
    )

    if call_sid not in _call_histories:
        _call_histories[call_sid] = []
    history = _call_histories[call_sid]

    messages = [SystemMessage(content=system_prompt)]
    messages.extend(history)
    messages.append(HumanMessage(content=transcript))

    buffer = ""
    full_text = ""

    async for chunk in _streaming_llm.astream(messages):
        token = chunk.content if hasattr(chunk, 'content') else str(chunk)
        if not token:
            continue
        buffer += token
        parts = _SENTENCE_END.split(buffer)
        if len(parts) > 1:
            for sentence in parts[:-1]:
                sentence = sentence.strip()
                if sentence:
                    full_text += sentence + " "
                    yield sentence, full_text.strip()
            buffer = parts[-1]

    if buffer.strip():
        full_text += buffer.strip()
        yield buffer.strip(), full_text.strip()

    ai_text = full_text.strip()
    history.append(HumanMessage(content=transcript))
    history.append(AIMessage(content=ai_text))
    if len(history) > 20:
        _call_histories[call_sid] = history[-20:]

    record_emotion(call_sid, emotion_data["wellness_category"], user_name)
    print(f"[Agent] Stage: {arc.get_stage_name()} | Emotion: {emotion_data['wellness_category']}")
    print(f"[Agent] Streamed: {ai_text[:80]}...")


def save_call_memories(call_sid: str, user_name: str, phone: str = "unknown") -> None:
    history = _call_histories.get(call_sid, [])
    if history:
        count = extract_and_store_memories(
            conversation_history=history,
            user_name=user_name,
            call_sid=call_sid,
            phone=phone,
        )
        print(f"[Memory] Saved {count} memories for {user_name}")


def clear_call_history(call_sid: str, user_name: str = "Unknown", phone: str = "unknown") -> None:
    save_call_memories(call_sid, user_name, phone)
    clear_arc(call_sid)
    _call_histories.pop(call_sid, None)
    print(f"[Agent] Cleared history for call {call_sid}")
