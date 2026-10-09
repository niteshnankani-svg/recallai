"""
LAYER E - Emotion classifier. Descriptive, no bar. No API calls.

Accuracy per language against the 5 wellness categories. Truth is the label,
not the model: a Hindi sentence labelled `sadness` is sadness even if the
English-only classifier says neutral.
"""

from ..import_helper import load_items

CODE_PATH = (
    "emotion/detector.py:detect_emotion -> transformers pipeline on "
    "j-hartmann/emotion-english-distilroberta-base (English-only), mapped "
    "through EMOTION_MAP to {joy, sadness, anxiety, anger, neutral}. "
    "services/conversation_arc.py already documents that this returns "
    "'neutral' for all Hindi/Hinglish speech."
)


async def run(ctx) -> None:
    from emotion.detector import detect_emotion

    items = load_items("layer_e_emotion.jsonl", "E", ctx.limit)
    for item in items:
        row = {
            "layer": "E", "item_id": item["id"], "provenance": item["provenance"],
            "lang": item["lang"], "input": item["text"], "expected": item["label"],
            "code_path": CODE_PATH, "invalid": False,
        }
        try:
            d = detect_emotion(item["text"])
        except Exception as e:
            row.update(invalid=True, invalid_reason=f"{type(e).__name__}: {e}")
            ctx.emit(row)
            continue
        correct = d["wellness_category"] == item["label"]
        row.update(
            actual_reply=d["wellness_category"],
            checks={
                "predicted": d["wellness_category"],
                "raw_emotion": d["raw_emotion"],
                "confidence": d["confidence"],
                "correct": correct,
                "degenerate_neutral": (d["wellness_category"] == "neutral"
                                       and item["label"] != "neutral"),
                "item_passed_hard_bar": None,     # descriptive layer
            },
            judge=None,
        )
        ctx.emit(row)
    print("  (per-language accuracy is computed in the report)")
