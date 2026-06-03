import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from transformers import pipeline

_classifier = None


def _load_classifier():
    global _classifier
    if _classifier is None:
        print("[Emotion] Loading BERT emotion classifier...")
        _classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None,
        )
        print("[Emotion] Classifier loaded ✓")
    return _classifier


# This model outputs: anger, disgust, fear, joy, neutral, sadness, surprise
EMOTION_MAP = {
    "joy":      "joy",
    "sadness":  "sadness",
    "anger":    "anger",
    "fear":     "anxiety",
    "disgust":  "anger",
    "surprise": "neutral",
    "neutral":  "neutral",
}

EMOTION_INSTRUCTIONS = {
    "joy": (
        "The user is in a positive state. Match their energy warmly. "
        "Celebrate with them. Ask what is going well."
    ),
    "sadness": (
        "The user is feeling sad or low. Do NOT offer advice yet. "
        "First validate fully. Use: 'That sounds really hard', 'I hear you'. "
        "Only after they feel heard, gently explore what they need."
    ),
    "anxiety": (
        "The user is anxious or fearful. Speak slowly and calmly. "
        "Ground them in the present moment. Do not amplify the worry."
    ),
    "anger": (
        "The user is frustrated or angry. Acknowledge the frustration first. "
        "Never tell them to calm down. Validate before any reframe."
    ),
    "neutral": (
        "The user's state is calm or unclear. "
        "Continue naturally and check in gently."
    ),
}


def detect_emotion(text: str) -> dict:
    classifier = _load_classifier()
    results = classifier(text)[0]
    results_sorted = sorted(results, key=lambda x: x["score"], reverse=True)
    top = results_sorted[0]

    raw_emotion = top["label"].lower()
    wellness_category = EMOTION_MAP.get(raw_emotion, "neutral")
    confidence = round(top["score"], 3)

    print(f"[Emotion] Detected: {raw_emotion} ({confidence}) → {wellness_category}")

    return {
        "raw_emotion": raw_emotion,
        "wellness_category": wellness_category,
        "confidence": confidence,
        "instruction": EMOTION_INSTRUCTIONS[wellness_category],
    }
