"""
The only place the eval touches the agent. Text layer, one turn or many,
fresh module state per item.
"""

import time
import uuid

from . import env

env.setup()
env.assert_not_real_chroma()

import services.agent_service as agent_service          # noqa: E402
from services import conversation_arc                    # noqa: E402
from . import instrument                                  # noqa: E402

SINK = instrument.Sink()
_restore = instrument.attach(agent_service, SINK)

# Throttle / outage signatures that invalidate a run rather than failing an item.
INVALIDATING = ("rate_limit", "429", "529", "overloaded", "APIStatusError",
                "APIConnectionError", "InternalServerError")


class RunInvalid(RuntimeError):
    """Raised when the model or infra, not the item, is the reason we have no answer."""


# ── Chroma warmup ────────────────────────────────────────────────
# FINDING (reported, not fixed): `_gather_context` runs memory retrieval and
# RAG retrieval in parallel ThreadPoolExecutor workers, and each lazily builds
# its OWN chromadb.PersistentClient against the SAME persist path. On
# chromadb 1.5.9 that races in SharedSystemClient._release_system and raises
#   AttributeError: 'RustBindingsAPI' object has no attribute 'bindings'
# on the first turn of a call. Observed on 1.5.9; NOT verified against the
# deployed 0.5.0, whose client registry differs.
#
# Warming both module-level singletons serially before any item makes the
# parallel path reuse already-built clients. This is harness-side only: no
# agent code is modified.
_warmed = False


def warm_chroma() -> None:
    global _warmed
    if _warmed:
        return
    from memory import retriever as mem_retriever
    from rag import retriever as rag_retriever
    mem_retriever._get_collection()
    rag_retriever._get_collection()
    _warmed = True


def new_call_sid(prefix: str = "eval") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def reset_state(call_sid: str | None = None) -> None:
    """Module-level dicts are global; items must not contaminate each other."""
    if call_sid is None:
        agent_service._call_histories.clear()
        agent_service._call_memories.clear()
        conversation_arc._active_arcs.clear()
    else:
        agent_service._call_histories.pop(call_sid, None)
        agent_service._call_memories.pop(call_sid, None)
        conversation_arc._active_arcs.pop(call_sid, None)


async def one_turn(transcript: str, call_sid: str, user_name: str) -> dict:
    """
    One real pass through get_ai_response_streaming.
    Returns reply text, first-sentence latency, sentence list and the
    instrumented stop_reason/usage.
    """
    warm_chroma()
    SINK.clear()
    t0 = time.perf_counter()
    first_sentence_ms = None
    sentences: list[str] = []
    reply = ""

    try:
        async for sentence, full in agent_service.get_ai_response_streaming(
            transcript=transcript,
            call_sid=call_sid,
            user_name=user_name,
        ):
            if first_sentence_ms is None:
                first_sentence_ms = (time.perf_counter() - t0) * 1000.0
            sentences.append(sentence)
            reply = full
    except Exception as e:
        detail = f"{type(e).__name__}: {e}"
        if any(sig.lower() in detail.lower() for sig in INVALIDATING):
            raise RunInvalid(detail) from e
        raise

    total_ms = (time.perf_counter() - t0) * 1000.0
    rec = SINK.last()

    arc = conversation_arc._active_arcs.get(call_sid)
    return {
        "reply": reply,
        "sentences": sentences,
        "first_sentence_ms": first_sentence_ms,
        "total_ms": total_ms,
        "stop_reason": rec.stop_reason if rec else None,
        "input_tokens": rec.input_tokens if rec else 0,
        "output_tokens": rec.output_tokens if rec else 0,
        "max_tokens": rec.max_tokens if rec else 0,
        "temperature": rec.temperature if rec else 0.0,
        "model": rec.model if rec else "",
        "arc_stage": arc.get_stage_name() if arc else None,
    }


async def conversation(turns: list[str], call_sid: str, user_name: str) -> list[dict]:
    """Sequential turns on one call_sid, so history and arc advance for real."""
    out = []
    for t in turns:
        out.append(await one_turn(t, call_sid, user_name))
    return out


def memory_context_for(call_sid: str) -> str:
    """Whatever memory text got injected into this call's prompt, for auditing."""
    return agent_service._call_memories.get(call_sid, "")


async def one_turn_precomputed(transcript: str, call_sid: str, user_name: str) -> dict:
    """
    Production's hot path: emotion / RAG / memory are precomputed speculatively
    from interim transcripts, so they cost no perceived latency. Timed
    separately from the cold path in Layer G.
    """
    warm_chroma()
    pre = await agent_service.precompute_context(transcript, call_sid, user_name)
    SINK.clear()
    t0 = time.perf_counter()
    first_ms = None
    reply = ""
    async for _sentence, full in agent_service.get_ai_response_streaming(
        transcript=transcript, call_sid=call_sid, user_name=user_name,
        precomputed=pre,
    ):
        if first_ms is None:
            first_ms = (time.perf_counter() - t0) * 1000.0
        reply = full
    rec = SINK.last()
    return {
        "reply": reply,
        "first_sentence_ms": first_ms,
        "total_ms": (time.perf_counter() - t0) * 1000.0,
        "stop_reason": rec.stop_reason if rec else None,
        "input_tokens": rec.input_tokens if rec else 0,
        "output_tokens": rec.output_tokens if rec else 0,
    }
