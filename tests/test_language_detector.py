"""Tests for services/language_detector.py"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.language_detector import detect_language, has_devanagari


class TestDevanagariDetection:
    def test_devanagari_text(self):
        assert has_devanagari("मैं ठीक हूं")

    def test_english_text(self):
        assert not has_devanagari("I am fine")

    def test_mixed_text(self):
        assert has_devanagari("I am ठीक")


class TestLanguageDetection:
    def test_pure_english(self):
        assert detect_language("I am feeling really stressed today") == "en"

    def test_pure_hindi_words(self):
        assert detect_language("mujhe bahut pareshan hai") == "hi"

    def test_devanagari_script(self):
        assert detect_language("मैं बहुत परेशान हूं") == "hi"

    def test_single_hindi_word_short(self):
        """Single Hindi word in 1-3 word input should trigger Hindi."""
        assert detect_language("haan") == "hi"

    def test_single_hindi_word_nahi(self):
        assert detect_language("nahi") == "hi"

    def test_theek_hai(self):
        assert detect_language("theek hai") == "hi"

    def test_hinglish_mixed(self):
        """Mixed Hindi-English with enough Hindi words."""
        assert detect_language("mujhe bahut tension ho raha hai") == "hi"

    def test_short_english(self):
        assert detect_language("yes") == "en"

    def test_short_english_fine(self):
        assert detect_language("I'm fine") == "en"

    def test_empty_string(self):
        assert detect_language("") == "en"

    def test_new_hindi_words_chahiye(self):
        assert detect_language("chahiye mujhe") == "hi"

    def test_new_hindi_words_mushkil(self):
        assert detect_language("bahut mushkil hai") == "hi"

    def test_session_persistence(self):
        """Once Hindi is detected for a call, ambiguous words stay Hindi."""
        call_sid = "test_session_123"
        detect_language("mujhe bahut stress hai", call_sid=call_sid)
        # "main" is ambiguous — should stay Hindi due to session
        result = detect_language("main sad hoon", call_sid=call_sid)
        # Clean up
        from services.language_detector import clear_session_language
        clear_session_language(call_sid)
        assert result == "hi"
