import os
from enum import Enum


class Stage(Enum):
    FEEL = 1
    CAUSE = 2
    NEED = 3
    STABILIZE = 4
    REFRAME = 5
    MANIFEST = 6


STAGE_MIN_EXCHANGES = {
    Stage.FEEL: 3,
    Stage.CAUSE: 4,
    Stage.NEED: 3,
    Stage.STABILIZE: 3,
    Stage.REFRAME: 3,
    Stage.MANIFEST: 5,
}

STAGE_INSTRUCTIONS = {
    Stage.FEEL: """
STAGE 1 — FEEL
Your only job is to make the user feel completely heard.
Do NOT offer advice. Do NOT reframe. Do NOT suggest solutions.
Validate their emotion fully. Use reflective listening.
Ask only ONE gentle open question at the end.
Formula: Reflection (1 sentence) + Question (1 sentence)
""",
    Stage.CAUSE: """
STAGE 2 — CAUSE
The user feels heard. Now gently explore the root cause.
Ask open questions to understand what is underneath.
Still no advice. Pure curiosity and warmth.
Maximum 3 questions before moving on.
Formula: Reflection (1 sentence) + Question (1 sentence)
""",
    Stage.NEED: """
STAGE 3 — NEED
You understand the cause. Now identify what the user needs.
Ask what would feel helpful. Let them lead.
Phrases: "What would feel most helpful right now?"
Formula: Reflection (1 sentence) + Question (1 sentence)
""",
    Stage.STABILIZE: """
STAGE 4 — STABILIZE
The user has shared deeply. Help them feel grounded and safe.
NO questions in this stage. Just presence and warmth.
Acknowledge their strength for sharing.
You may gently offer a breathing invitation.
Formula: Pure validation. No question.
""",
    Stage.REFRAME: """
STAGE 5 — REFRAME
The user is stabilized. Gently introduce possibility.
Do NOT force positivity. Ask what a better version might look like.
Phrases: "What would feel different if things shifted even a little?"
Formula: Gentle reframe + Possibility question
""",
    Stage.MANIFEST: """
STAGE 6 — MANIFEST
The user is open to possibility. Co-create a vision.
Ground manifestation in ONE small concrete action.
Phrases: "What is one small thing that would move you forward tomorrow?"
Formula: Vision (1 sentence) + One small action question
""",
}

STAGE_BOOK_FOCUS = {
    Stage.FEEL:      ["Nonviolent Communication", "Radical Acceptance", "gifts of imperfection"],
    Stage.CAUSE:     ["Radical Acceptance", "Feeling Good", "Mans Search"],
    Stage.NEED:      ["Nonviolent Communication", "Radical Acceptance", "Feeling Good"],
    Stage.STABILIZE: ["Power of Now", "Radical Acceptance", "Feeling Good"],
    Stage.REFRAME:   ["Feeling Good", "Mans Search", "Atomic Habits"],
    Stage.MANIFEST:  ["You Can Heal", "Atomic Habits", "Power of Now"],
}

CAUSE_KEYWORDS = [
    "because", "since", "when", "after", "work", "family",
    "money", "health", "relationship", "job", "mother", "father",
    "wife", "husband", "friend", "stress", "pressure", "problem",
]

POSSIBILITY_KEYWORDS = [
    "maybe", "could", "would", "if", "wish", "want",
    "hope", "try", "better", "change", "different", "improve",
]

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end it", "no point living",
    "want to die", "hurt myself", "self harm",
]


class ConversationArc:
    def __init__(self, call_sid: str):
        self.call_sid = call_sid
        self.current_stage = Stage.FEEL
        self.stage_exchanges = {stage: 0 for stage in Stage}
        self.total_exchanges = 0
        print(f"[Arc] Call {call_sid} — Starting at FEEL")

    def get_stage_instruction(self) -> str:
        return STAGE_INSTRUCTIONS[self.current_stage]

    def get_stage_name(self) -> str:
        return self.current_stage.name

    def get_book_focus(self) -> list:
        return STAGE_BOOK_FOCUS[self.current_stage]

    def record_exchange(self, emotion: str, user_text: str):
        self.total_exchanges += 1
        self.stage_exchanges[self.current_stage] += 1
        self._maybe_advance(emotion, user_text)

    def _maybe_advance(self, emotion: str, user_text: str):
        current = self.current_stage
        exchanges = self.stage_exchanges[current]
        min_ex = STAGE_MIN_EXCHANGES[current]
        text_lower = user_text.lower()

        # Crisis — reset to FEEL
        if any(w in text_lower for w in CRISIS_KEYWORDS):
            self.current_stage = Stage.FEEL
            print(f"[Arc] Crisis detected — reset to FEEL")
            return

        if exchanges < min_ex:
            return

        if current == Stage.MANIFEST:
            return

        # NOTE: the BERT emotion model is English-only and returns "neutral" for
        # all Hindi/Hinglish speech, so emotion is NOT a reliable advance signal.
        # Advancement is driven by exchange count (always reliable) plus the
        # text-keyword cues for cause/possibility (which work in any language).
        should_advance = False

        if current == Stage.CAUSE:
            has_cause = any(w in text_lower for w in CAUSE_KEYWORDS)
            should_advance = has_cause or exchanges >= min_ex + 2

        elif current == Stage.REFRAME:
            has_possibility = any(w in text_lower for w in POSSIBILITY_KEYWORDS)
            should_advance = has_possibility or exchanges >= min_ex + 2

        else:  # FEEL, NEED, STABILIZE — purely time-based (min_ex already met)
            should_advance = True

        if should_advance:
            next_stage = Stage(current.value + 1)
            self.current_stage = next_stage
            print(f"[Arc] Advanced → {next_stage.name}")


_active_arcs: dict[str, ConversationArc] = {}


def get_arc(call_sid: str) -> ConversationArc:
    if call_sid not in _active_arcs:
        _active_arcs[call_sid] = ConversationArc(call_sid)
    return _active_arcs[call_sid]


def clear_arc(call_sid: str):
    _active_arcs.pop(call_sid, None)
    print(f"[Arc] Cleared for call {call_sid}")
