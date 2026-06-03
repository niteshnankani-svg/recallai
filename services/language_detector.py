from langdetect import detect as _langdetect

HINDI_ONLY_WORDS = {
    "mujhe", "hai", "hain", "nahi", "nahin",
    "acha", "theek", "bahut", "kuch", "kya", "aap", "tum",
    "hum", "yeh", "aur", "lekin", "kyun", "kyu",
    "mehsoos", "lagta", "lagti", "raha", "rahi", "rahe",
    "kaisa", "kaisi", "thoda", "bohot", "bilkul", "zaroor",
    "dil", "mann", "ghar", "kaam", "paisa", "rishta",
    "pareshan", "udaas", "khush", "dukhi", "chinta",
    "accha", "bura", "zyada", "abhi", "phir",
    "matlab", "samajh", "pata", "laga", "lagi", "hua", "hui",
    "sab", "koi", "sirf", "bas", "toh", "ji",
    "mera", "meri", "tera", "teri", "uska", "uski",
    "haan", "naa", "dekho", "suno", "bolo", "batao",
    "karke", "karna", "karte", "karti", "karenge",
    "achha", "sochta", "sochti", "sochte", "chahiye",
    "wala", "wali", "wale", "isliye", "kyunki",
    "mushkil", "takleef", "fikar", "tension",
    "baat", "batana", "sunna", "dekhna",
    "hogaya", "hogayi", "hoga", "hogi",
    "aaj", "kal", "subah", "raat", "shaam",
}

AMBIGUOUS_WORDS = {"main", "par", "kam", "wo", "na", "kuch"}

DEVANAGARI_START = 0x0900
DEVANAGARI_END = 0x097F


def has_devanagari(text: str) -> bool:
    return any(DEVANAGARI_START <= ord(c) <= DEVANAGARI_END for c in text)


_session_language: dict[str, str] = {}


def set_session_language(call_sid: str, lang: str):
    _session_language[call_sid] = lang


def get_session_language(call_sid: str) -> str | None:
    return _session_language.get(call_sid)


def clear_session_language(call_sid: str):
    _session_language.pop(call_sid, None)


def detect_language(text: str, call_sid: str | None = None) -> str:
    if has_devanagari(text):
        lang = "hi"
        if call_sid:
            set_session_language(call_sid, lang)
        print(f"[Language] Devanagari script → Hindi")
        return lang

    text_lower = text.lower()
    words = text_lower.split()
    total = len(words)

    if total == 0:
        return get_session_language(call_sid) or "en" if call_sid else "en"

    hindi_count = sum(1 for w in words if w in HINDI_ONLY_WORDS)
    ambiguous_count = sum(1 for w in words if w in AMBIGUOUS_WORDS)

    hindi_ratio = hindi_count / total

    if hindi_count >= 2 or (hindi_count >= 1 and (hindi_ratio >= 0.3 or total <= 3)):
        lang = "hi"
        if call_sid:
            set_session_language(call_sid, lang)
        print(f"[Language] Hindi/Hinglish ({hindi_count}/{total} words, ratio={hindi_ratio:.2f})")
        return lang

    if hindi_count == 0 and ambiguous_count >= 1 and call_sid:
        prev = get_session_language(call_sid)
        if prev == "hi":
            print(f"[Language] Ambiguous words + Hindi session → Hindi")
            return "hi"

    try:
        detected = _langdetect(text)
        if detected in ("hi", "mr", "ur"):
            lang = "hi"
            if call_sid:
                set_session_language(call_sid, lang)
            print(f"[Language] langdetect: {detected} → Hindi")
            return lang
    except Exception:
        pass

    if call_sid and not hindi_count:
        set_session_language(call_sid, "en")

    return "en"
