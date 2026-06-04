"""
Name Extractor
──────────────
Extracts a person's name from their spoken response.
Uses regex patterns first (fast), falls back to Claude for ambiguous cases.
"""

import re
import os
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

# Patterns like "I'm Nitesh", "my name is Priya", "this is Rahul", "call me Sara"
_NAME_PATTERNS = [
    r"(?:i'?m|i am|my name is|this is|call me|it'?s|mai|mera naam|naam)\s+([A-Z][a-z]{1,15})",
    r"^([A-Z][a-z]{1,15})$",                   # just a name by itself: "Nitesh"
    r"^([A-Z][a-z]{1,15})\s+(?:here|speaking)", # "Nitesh here"
]

# Common non-name words that match the single-word pattern
_STOP_WORDS = {
    "Hello", "Hi", "Hey", "Yes", "Yeah", "No", "Okay", "Sure", "Thanks",
    "Good", "Fine", "Great", "Well", "Please", "Sorry", "What", "How",
    "The", "This", "That", "Just", "Like", "Really", "Actually",
    "Nothing", "Something", "Everything", "Anything", "Maybe",
    "Haan", "Nahi", "Theek", "Achha", "Bas", "Kuch",
}


def extract_name_fast(text: str) -> str | None:
    """Try regex extraction — returns name or None."""
    text_clean = text.strip().rstrip(".!?,")
    for pattern in _NAME_PATTERNS:
        match = re.search(pattern, text_clean, re.IGNORECASE)
        if match:
            name = match.group(1).strip().title()
            if name not in _STOP_WORDS and len(name) >= 2:
                return name
    return None


async def extract_name_llm(text: str) -> str | None:
    """Fallback: ask Claude to extract the name."""
    try:
        llm = ChatAnthropic(
            model="claude-sonnet-4-5",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            max_tokens=20,
            temperature=0,
        )
        prompt = f"""Extract ONLY the person's name from this text.
If they said their name, return just the name (e.g. "Nitesh").
If no name is present, return exactly "NONE".

Text: "{text}"

Name:"""
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        result = response.content.strip().strip('"').strip("'")
        if result.upper() == "NONE" or len(result) > 20 or len(result) < 2:
            return None
        return result.title()
    except Exception as e:
        print(f"[NameExtract] LLM error: {e}")
        return None


async def extract_name(text: str) -> str | None:
    """Extract name: regex first, Claude fallback."""
    name = extract_name_fast(text)
    if name:
        print(f"[NameExtract] Regex match: {name}")
        return name

    name = await extract_name_llm(text)
    if name:
        print(f"[NameExtract] LLM match: {name}")
        return name

    print(f"[NameExtract] No name found in: '{text[:50]}'")
    return None
