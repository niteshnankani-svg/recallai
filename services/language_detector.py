HINDI_WORDS = [
    "mujhe", "main", "mein", "hai", "hain", "nahi", "nahin",
    "acha", "theek", "bahut", "kuch", "kya", "aap", "tum",
    "hum", "wo", "yeh", "par", "aur", "lekin", "kyun", "kyu",
    "mehsoos", "lagta", "lagti", "raha", "rahi", "rahe",
    "kaisa", "kaisi", "thoda", "bohot", "bilkul", "zaroor",
    "dil", "mann", "ghar", "kaam", "paisa", "rishta",
    "pareshan", "udaas", "khush", "dukhi", "tension", "chinta",
    "accha", "theek", "bura", "zyada", "kam", "abhi", "phir",
    "matlab", "samajh", "pata", "laga", "lagi", "hua", "hui",
    "sab", "koi", "kuch", "sirf", "bas", "toh", "na", "ji",
]

# Devanagari Unicode range — if any Hindi script characters present
DEVANAGARI_START = 0x0900
DEVANAGARI_END = 0x097F


def has_devanagari(text: str) -> bool:
    return any(DEVANAGARI_START <= ord(c) <= DEVANAGARI_END for c in text)


def detect_language(text: str) -> str:
    """
    Returns 'hi' for Hindi/Hinglish, 'en' for English.
    Checks Devanagari script first, then Hindi romanized keywords.
    """
    if has_devanagari(text):
        print(f"[Language] Devanagari script detected → Hindi")
        return "hi"

    text_lower = text.lower()
    words = text_lower.split()
    hindi_count = sum(1 for w in words if w in HINDI_WORDS)

    if hindi_count >= 1:
        print(f"[Language] Hindi/Hinglish ({hindi_count} Hindi words)")
        return "hi"

    try:
        from langdetect import detect
        lang = detect(text)
        print(f"[Language] langdetect: {lang}")
        return "hi" if lang in ["hi", "mr", "ur"] else "en"
    except Exception:
        return "en"
