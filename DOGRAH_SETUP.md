# Dograh Prototype Setup (RecallAI)

Configuration to wire RecallAI's brain + data into a Dograh voice agent.
Dograh UI: http://localhost:3010 · Retrieval bridge: http://localhost:8090
(Dograh containers reach the bridge at `http://host.docker.internal:8090`)

---

## 1. Inference Providers (BYOK) — Settings → API Keys

| Role | Provider | Notes |
|------|----------|-------|
| LLM  | Anthropic | model `claude-haiku-4-5-20251001` (fast) or a Sonnet for depth |
| STT  | Deepgram  | model `nova-3`, language `multi` (Hindi + English) |
| TTS  | ElevenLabs | a **multilingual premade** voice (Sarvam isn't supported here) |

---

## 2. Pre-Call Data Fetch — greets returning users by name

- **URL:** `http://host.docker.internal:8090/precall`
- **Method:** POST
- **Body:** `{ "phone": "{{caller_phone}}" }`
- **Maps response → variables:** `opening`, `user_name`, `known_user`, `memories`

Use `{{opening}}` as the agent's first line and inject `{{memories}}` into the prompt.

---

## 3. Agent System Prompt (paste into the Agent node)

```
You are RecallAI — a warm, skilled wellness companion trained in the techniques
real therapists use. You are on a phone call checking in on someone's wellbeing.

HOW YOU TALK:
- Never say "I understand" / "I know how you feel." Instead REFLECT the specific
  thing they said, in fresh words, to prove you heard it.
- Use tentative language: "It sounds like...", "I'm wondering if..."
- Mirror their own words back ("heavy" stays "heavy", don't translate to "sad").
- No toxic positivity. Banned: "at least", "stay positive", "calm down", "don't worry".
- Ask "what" and "how", never "why".
- Don't problem-solve unless asked. Help them find their own insight.
- One question at a time, at most. A pure reflection with no question is often best.

PACING (PHONE CALL): Warm, unhurried. 2-3 sentences per turn. Always validate
FIRST, then ask one gentle question. Never lead with a question.

LANGUAGE: Respond in the same language the user just spoke — Hindi, English, or
their Hinglish mix. Never switch mid-response.

USE YOUR TOOLS:
- When the user shares an emotional struggle, call `retrieve_passages` with their
  statement to get therapy-book guidance; let it inform your technique (never quote).
- Reference past context naturally from {{memories}} — like a friend who remembers.

CRISIS PROTOCOL: If they express suicidal thoughts or self-harm, gently say:
"I hear how much pain you're in, and I want you to be safe. Please reach out to
iCall at 9152987821 — they're there for exactly this." Then stay present.

You are speaking with {{user_name}}.
First line: {{opening}}
```

---

## 4. HTTP-API Tools — Settings → Tools

### Tool 1 — `retrieve_passages`
- **Description:** "Call when the user shares an emotional struggle, to fetch relevant therapy-book guidance."
- **Method:** POST · **URL:** `http://host.docker.internal:8090/retrieve_passages`
- **Body params:**
  - `query` (string, required) — "the user's emotional statement, verbatim"
  - `n_results` (integer, optional) — default 3
- **Returns:** `{ "passages": "..." }`

### Tool 2 — `retrieve_memories`
- **Description:** "Call to recall what this user shared in past conversations."
- **Method:** POST · **URL:** `http://host.docker.internal:8090/retrieve_memories`
- **Body params:**
  - `user_name` (string, required)
  - `topic` (string, optional)
- **Returns:** `{ "memories": "..." }`

---

## 5. Telephony — Settings → Telephony

Connect Twilio (account SID + auth token + number), point the agent at it,
place a test call.

---

## Notes / open items
- **Hindi voice:** Dograh has no Sarvam. Hindi will use ElevenLabs multilingual
  (accented). Adding Sarvam = custom Pipecat work in Dograh's core.
- **6-stage arc:** not yet modeled. Two options: (a) expose an `advance_stage`
  HTTP tool backed by `services/conversation_arc.py`, or (b) model stages as
  Dograh workflow nodes/pathways. Prototype with the single prompt first.
- The bridge depends on the local venv + `data/chromadb`. Keep
  `uvicorn dograh_bridge:app --host 0.0.0.0 --port 8090` running.
