"""Tests for services/conversation_arc.py — stage transitions."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.conversation_arc import ConversationArc, Stage, get_arc, clear_arc


class TestConversationArc:
    def test_starts_at_feel(self):
        arc = ConversationArc("test_1")
        assert arc.current_stage == Stage.FEEL

    def test_stage_name(self):
        arc = ConversationArc("test_2")
        assert arc.get_stage_name() == "FEEL"

    def test_stage_instruction_not_empty(self):
        arc = ConversationArc("test_3")
        assert len(arc.get_stage_instruction()) > 0

    def test_book_focus_returns_list(self):
        arc = ConversationArc("test_4")
        books = arc.get_book_focus()
        assert isinstance(books, list)
        assert len(books) > 0

    def test_no_advance_before_min_exchanges(self):
        arc = ConversationArc("test_5")
        arc.record_exchange("sadness", "I feel really sad")
        assert arc.current_stage == Stage.FEEL  # min is 2

    def test_advance_from_feel_after_min_exchanges(self):
        arc = ConversationArc("test_6")
        arc.record_exchange("sadness", "I feel really sad")
        arc.record_exchange("sadness", "It's been like this for weeks")
        arc.record_exchange("sadness", "I can't shake this feeling")
        assert arc.current_stage == Stage.CAUSE

    def test_crisis_resets_to_feel(self):
        arc = ConversationArc("test_7")
        # Advance to CAUSE first
        arc.record_exchange("sadness", "I feel really sad")
        arc.record_exchange("sadness", "It's been hard")
        arc.record_exchange("sadness", "I don't know why")
        assert arc.current_stage == Stage.CAUSE
        # Crisis keyword resets to FEEL
        arc.record_exchange("sadness", "I want to kill myself")
        assert arc.current_stage == Stage.FEEL

    def test_manifest_does_not_advance(self):
        arc = ConversationArc("test_8")
        arc.current_stage = Stage.MANIFEST
        arc.stage_exchanges[Stage.MANIFEST] = 10
        arc.record_exchange("joy", "I feel hopeful about the future")
        assert arc.current_stage == Stage.MANIFEST

    def test_get_arc_creates_new(self):
        arc = get_arc("test_new_sid")
        assert arc.current_stage == Stage.FEEL
        clear_arc("test_new_sid")

    def test_get_arc_returns_same(self):
        arc1 = get_arc("test_same_sid")
        arc2 = get_arc("test_same_sid")
        assert arc1 is arc2
        clear_arc("test_same_sid")

    def test_clear_arc(self):
        get_arc("test_clear_sid")
        clear_arc("test_clear_sid")
        arc = get_arc("test_clear_sid")
        assert arc.total_exchanges == 0
        clear_arc("test_clear_sid")
