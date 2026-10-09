"""
Hard guards. The eval must never be able to place a real call or hit a
voice/telephony vendor, even by accident through a transitive import.

This is enforced at import time rather than promised in a comment: any attempt
to import a telephony/STT/TTS module raises, and the runner marks the layer
INVALID instead of silently continuing.
"""

import builtins
import sys

BLOCKED_TOP_LEVEL = {"twilio", "deepgram", "elevenlabs"}
BLOCKED_PROJECT = {
    "services.twilio_service",
    "services.deepgram_service",
    "services.elevenlabs_service",
    "services.sarvam_service",
    "services.telephony",
    "services.tts_stream",
    "routers.calls",
}


class BlockedImport(RuntimeError):
    pass


def _is_blocked(name: str) -> bool:
    top = name.split(".")[0]
    return top in BLOCKED_TOP_LEVEL or name in BLOCKED_PROJECT


class _Blocker:
    """sys.meta_path finder that refuses blocked modules before they load."""

    def find_module(self, fullname, path=None):   # py<3.12 compat
        return self.find_spec(fullname, path)

    def find_spec(self, fullname, path=None, target=None):
        if _is_blocked(fullname):
            raise BlockedImport(
                f"eval guard: refused to import {fullname!r}. "
                "The eval suite runs at the text layer only — no Twilio, "
                "Deepgram, ElevenLabs or Sarvam, and no real calls."
            )
        return None


_installed = False


def install() -> None:
    global _installed
    if _installed:
        return
    sys.meta_path.insert(0, _Blocker())
    # also catch modules already resident in sys.modules
    for name in list(sys.modules):
        if _is_blocked(name):
            raise BlockedImport(f"eval guard: {name!r} was already imported")
    _installed = True


def assert_clean() -> list[str]:
    """Returns any blocked module that got loaded anyway. Should always be []."""
    return [n for n in sys.modules if _is_blocked(n)]
