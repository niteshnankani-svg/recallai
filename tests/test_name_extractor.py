"""Tests for services/name_extractor.py — regex-based name extraction only."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.name_extractor import extract_name_fast


class TestNameExtractorFast:
    """Test regex-based name extraction (no LLM calls)."""

    def test_im_name(self):
        assert extract_name_fast("I'm Nitesh") == "Nitesh"

    def test_i_am_name(self):
        assert extract_name_fast("I am Priya") == "Priya"

    def test_my_name_is(self):
        assert extract_name_fast("My name is Rahul") == "Rahul"

    def test_this_is(self):
        assert extract_name_fast("This is Sara") == "Sara"

    def test_call_me(self):
        assert extract_name_fast("Call me Amit") == "Amit"

    def test_single_word_name(self):
        assert extract_name_fast("Nitesh") == "Nitesh"

    def test_name_here(self):
        assert extract_name_fast("Nitesh here") == "Nitesh"

    def test_name_speaking(self):
        assert extract_name_fast("Priya speaking") == "Priya"

    def test_stop_word_hello(self):
        assert extract_name_fast("Hello") is None

    def test_stop_word_yes(self):
        assert extract_name_fast("Yes") is None

    def test_stop_word_okay(self):
        assert extract_name_fast("Okay") is None

    def test_stop_word_hi(self):
        assert extract_name_fast("Hi") is None

    def test_stop_word_fine(self):
        assert extract_name_fast("Fine") is None

    def test_nothing_useful(self):
        assert extract_name_fast("I don't know what to say") is None

    def test_too_short(self):
        assert extract_name_fast("I'm A") is None

    def test_lowercase_gets_titlecased(self):
        # Deepgram often returns lowercase — regex is case-insensitive, result is title-cased
        assert extract_name_fast("nitesh") == "Nitesh"

    def test_name_with_trailing_punctuation(self):
        assert extract_name_fast("I'm Nitesh.") == "Nitesh"

    def test_im_contraction(self):
        assert extract_name_fast("im Deepak") == "Deepak"

    def test_mera_naam(self):
        assert extract_name_fast("Mera naam Raj") == "Raj"

    def test_its_name(self):
        assert extract_name_fast("It's Meera") == "Meera"
