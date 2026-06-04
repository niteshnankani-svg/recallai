"""Tests for services/call_registry.py — in-memory call state."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.call_registry import (
    register_call, get_call_info, get_user_for_call,
    get_phone_for_call, unregister_call, update_call_user_name,
)


class TestCallRegistry:
    def test_register_inbound_call(self):
        register_call("sid_1", "+11111111111", "+12222222222", "inbound")
        info = get_call_info("sid_1")
        assert info is not None
        assert info["phone"] == "+11111111111"  # From number for inbound
        assert info["direction"] == "inbound"
        unregister_call("sid_1")

    def test_register_outbound_call(self):
        register_call("sid_2", "+12222222222", "+11111111111", "outbound")
        info = get_call_info("sid_2")
        assert info is not None
        assert info["phone"] == "+11111111111"  # To number for outbound
        assert info["direction"] == "outbound"
        unregister_call("sid_2")

    def test_get_user_for_call(self):
        register_call("sid_3", "+13333333333", "+14444444444", "inbound")
        user = get_user_for_call("sid_3")
        # Without a saved name, returns the phone number
        assert user == "+13333333333"
        unregister_call("sid_3")

    def test_get_user_for_unknown_call(self):
        assert get_user_for_call("nonexistent_sid") == "Unknown"

    def test_get_phone_for_call(self):
        register_call("sid_4", "+15555555555", "+16666666666", "inbound")
        assert get_phone_for_call("sid_4") == "+15555555555"
        unregister_call("sid_4")

    def test_get_phone_for_unknown_call(self):
        assert get_phone_for_call("nonexistent_sid") == "unknown"

    def test_update_call_user_name(self):
        register_call("sid_5", "+17777777777", "+18888888888", "inbound")
        update_call_user_name("sid_5", "Nitesh")
        assert get_user_for_call("sid_5") == "Nitesh"
        unregister_call("sid_5")

    def test_unregister_call(self):
        register_call("sid_6", "+19999999999", "+10000000000", "inbound")
        unregister_call("sid_6")
        assert get_call_info("sid_6") is None
