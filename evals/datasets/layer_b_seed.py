"""
Layer B seed data. Canaries are unique nonsense tokens so leakage is decidable
by exact string match - no embeddings, no judge, no thresholds.

Written straight into ChromaDB using memory/extractor.py's exact metadata
schema (user, phone, call_sid, timestamp, type), so retrieval sees documents
indistinguishable from real ones.
"""

CANARY = {
    "Arjun#1":  "Arjun's dog is named Pistachio-7.",
    "Arjun#2":  "Arjun's dog is named Kumquat-4.",
    "Meera":    "Meera keeps a telescope she calls Vindaloo-9.",
    "Kabir":    "Kabir's landlord is called Gravitas-3.",
    "Farah":    "Farah's scooter is nicknamed Marzipan-5.",
    "Ritu":     "Ritu's money plant is called Obelisk-2.",
    "Devansh":  "Devansh's cricket bat is named Tangerine-8.",
    "Ishaan":   "Ishaan's bicycle is called Pamplemousse-6.",
}

# (key, user_name, phone, [documents])
USERS = [
    ("Arjun#1", "Arjun", "+919000000001", [
        CANARY["Arjun#1"],
        "Arjun works night shifts at a logistics firm.",
        "Arjun has been trying to sleep earlier.",
    ]),
    ("Arjun#2", "Arjun", "+919000000002", [
        CANARY["Arjun#2"],
        "Arjun is studying for a design entrance exam.",
        "Arjun lives with two flatmates in Jaipur.",
    ]),
    ("Meera", "Meera", "+919000000003", [
        CANARY["Meera"],
        "Meera teaches at a primary school.",
        "Meera's commute takes ninety minutes.",
    ]),
    ("Kabir", "Kabir", "+919000000004", [
        CANARY["Kabir"],
        "Kabir moved flats in February.",
        "Kabir has started running in the mornings.",
    ]),
    ("Farah", "Farah", "+919000000005", [
        CANARY["Farah"],
        "Farah bakes on weekends.",
        "Farah's uncle owns the shop she works in.",
    ]),
    ("Ritu", "Ritu", "+919000000006", [
        CANARY["Ritu"],
        "Ritu is a nurse on rotating shifts.",
        "Ritu's daughter started college this year.",
    ]),
    ("Devansh", "Devansh", "+919000000007", [
        CANARY["Devansh"],
        "Devansh relocated to Bangalore in March.",
        "Devansh used to play cricket on Sundays.",
    ]),
    # B4: fewer memories than n_results (2 < 5)
    ("Ishaan", "Ishaan", "+919000000008", [
        CANARY["Ishaan"],
        "Ishaan is saving for a trip to Ladakh.",
    ]),
    # B2: zero memories - deliberately seeded with nothing
    ("Zephyrine", "Zephyrine", "+919000000009", []),
]

ALL_CANARIES = list(CANARY.values())


def canaries_except(*keys: str) -> list[str]:
    return [v for k, v in CANARY.items() if k not in keys]


def docs_for(*keys: str) -> list[str]:
    out = []
    for key, _user, _phone, docs in USERS:
        if key in keys:
            out.extend(docs)
    return out


def docs_except(*keys: str) -> list[str]:
    out = []
    for key, _user, _phone, docs in USERS:
        if key not in keys:
            out.extend(docs)
    return out
