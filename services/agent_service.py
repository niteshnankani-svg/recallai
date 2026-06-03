import os
from dotenv import load_dotenv
load_dotenv()

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from emotion.detector import detect_emotion
from rag.retriever import retrieve_relevant_passages
from memory.retriever import retrieve_user_memories
from memory.extractor import extract_and_store_memories
from services.conversation_arc import get_arc, clear_arc

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

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

TONE: Warm, unhurried, genuine.
LANGUAGE RULE: ALWAYS respond in the same language the user just spoke. If they spoke Hindi, respond in Hindi. If they spoke English, respond in English. If they mixed both (Hinglish), match their mix. Never switch languages mid-response.
CALL LENGTH: 1-2 short sentences max. Speak in short, natural turns like a real phone call — never a paragraph. This is a phone call.
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


def get_ai_response(
    transcript: str,
    call_sid: str,
    user_name: str,
    memory_context: str = "",
) -> str:
    emotion_data = detect_emotion(transcript)

    arc = get_arc(call_sid)
    arc.record_exchange(
        emotion=emotion_data["wellness_category"],
        user_text=transcript,
    )

    book_context = retrieve_relevant_passages(
        query=transcript,
        n_results=2,
    )

    if not memory_context:
        memory_context = retrieve_user_memories(
            user_name=user_name,
            current_topic=transcript,
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

    llm = ChatAnthropic(
        model="claude-sonnet-4-5",
        api_key=ANTHROPIC_API_KEY,
        temperature=0.8,
        max_tokens=90,
    )

    response = llm.invoke(messages)
    ai_text = response.content.strip()

    history.append(HumanMessage(content=transcript))
    history.append(AIMessage(content=ai_text))
    if len(history) > 20:
        _call_histories[call_sid] = history[-20:]

    print(f"[Agent] Stage: {arc.get_stage_name()} | Emotion: {emotion_data['wellness_category']}")
    print(f"[Agent] Response: {ai_text[:80]}...")
    return ai_text


def save_call_memories(call_sid: str, user_name: str) -> None:
    history = _call_histories.get(call_sid, [])
    if history:
        count = extract_and_store_memories(
            conversation_history=history,
            user_name=user_name,
            call_sid=call_sid,
        )
        print(f"[Memory] Saved {count} memories for {user_name}")


def clear_call_history(call_sid: str, user_name: str = "Nitesh") -> None:
    save_call_memories(call_sid, user_name)
    clear_arc(call_sid)
    _call_histories.pop(call_sid, None)
    print(f"[Agent] Cleared history for call {call_sid}")
