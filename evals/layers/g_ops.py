"""
LAYER G - Operational.

  * time to first sentence, strictly sequential (concurrency would corrupt it),
    for BOTH the cold path and production's precomputed hot path
  * behaviour when Anthropic / ChromaDB / Redis are unavailable
  * the integrity gate's own accounting

Failure injection is instrumented and labelled as such. Nothing is fixed.
"""

import os
import tempfile
from pathlib import Path

from ..import_helper import harness, load_items


async def _latency(ctx) -> None:
    items = load_items("layer_g_latency.jsonl", "G", ctx.limit)
    for mode in ("cold", "precomputed"):
        for item in items:
            sid = harness.new_call_sid(f"g-{mode}-{item['id']}")
            harness.reset_state(sid)
            row = {
                "layer": "G", "item_id": f"{item['id']}-{mode}",
                "provenance": "self-authored", "subtest": f"latency_{mode}",
                "lang": item["lang"], "length": item["length"],
                "input": item["turn"],
                "expected": "measured, no bar",
                "code_path": ("services/agent_service.py:get_ai_response_streaming - "
                              + ("_gather_context runs emotion+RAG+memory inline "
                                 "before the first token" if mode == "cold" else
                                 "precomputed context passed in, as routers/calls.py "
                                 "does from interim transcripts")),
                "invalid": False,
            }
            try:
                fn = harness.one_turn if mode == "cold" else harness.one_turn_precomputed
                res = await fn(item["turn"], sid, "Ritu")
            except harness.RunInvalid as e:
                row.update(invalid=True, invalid_reason=str(e)); ctx.emit(row); continue
            except Exception as e:
                row.update(invalid=True,
                           invalid_reason=f"unexpected {type(e).__name__}: {e}")
                ctx.emit(row); continue
            row.update(actual_reply=res["reply"],
                       checks={"first_sentence_ms": round(res["first_sentence_ms"], 1),
                               "total_ms": round(res["total_ms"], 1),
                               "mode": mode, "item_passed_hard_bar": None},
                       first_sentence_ms=res["first_sentence_ms"],
                       stop_reason=res["stop_reason"],
                       input_tokens=res["input_tokens"],
                       output_tokens=res["output_tokens"], judge=None)
            ctx.emit(row)
            harness.reset_state(sid)
            print(f"  {mode} {item['id']} ttfs={res['first_sentence_ms']:.0f}ms "
                  f"total={res['total_ms']:.0f}ms")


async def _anthropic_down(ctx) -> None:
    import anthropic
    import services.agent_service as A

    class _DeadStream:
        async def __aenter__(self):
            raise anthropic.APIConnectionError(request=None)

        async def __aexit__(self, *a):
            return False

    class _DeadMessages:
        def stream(self, **kw):
            return _DeadStream()

    class _DeadClient:
        messages = _DeadMessages()

    row = {"layer": "G", "item_id": "G-OUT-anthropic", "provenance": "self-authored",
           "subtest": "outage_anthropic", "instrumented": True,
           "input": "APIConnectionError injected into agent_service._client",
           "expected": "observed only - no bar",
           "code_path": ("services/agent_service.py:get_ai_response_streaming has no "
                         "try/except around the stream; routers/calls.py:229 is the caller"),
           "invalid": False}
    original = A._client
    A._client = _DeadClient()
    sid = harness.new_call_sid("g-out-anthropic")
    yielded, err = [], None
    try:
        async for s, _f in A.get_ai_response_streaming("I feel low", sid, "Ritu"):
            yielded.append(s)
    except Exception as e:
        err = f"{type(e).__name__}: {e}"
    finally:
        A._client = original
        harness.reset_state(sid)
    row.update(actual_reply=f"exception={err}; yielded={yielded}",
               checks={"exception_propagated": err is not None,
                       "exception": err, "partial_sentences_yielded": len(yielded),
                       "spoken_fallback_offered": bool(yielded),
                       "item_passed_hard_bar": None}, judge=None)
    ctx.emit(row)
    print(f"  anthropic down -> propagated={err is not None} ({err})")


async def _chroma_down(ctx) -> None:
    from memory import retriever as MR
    from rag import retriever as RR
    from core.config import settings

    bad = Path(tempfile.mkdtemp(prefix="eval-chroma-broken-"))
    (bad / "chroma.sqlite3").write_bytes(b"this is not a sqlite database")

    saved_mem, saved_rag = MR._memory_collection, RR._collection
    saved_env, saved_set = os.environ.get("CHROMA_PERSIST_DIR"), settings.CHROMA_PERSIST_DIR
    saved_mod = MR.CHROMA_PERSIST_DIR

    results = {}
    try:
        MR._memory_collection = None
        RR._collection = None
        MR.CHROMA_PERSIST_DIR = str(bad)
        settings.CHROMA_PERSIST_DIR = str(bad)
        os.environ["CHROMA_PERSIST_DIR"] = str(bad)

        try:
            out = MR.retrieve_user_memories("Ritu", "anything")
            results["memory"] = {"raised": False, "returned": out}
        except Exception as e:
            results["memory"] = {"raised": True, "error": f"{type(e).__name__}: {e}"}

        try:
            out = RR.retrieve_relevant_passages("I feel low", 2)
            results["rag"] = {"raised": False, "returned": out[:200]}
        except Exception as e:
            results["rag"] = {"raised": True, "error": f"{type(e).__name__}: {e}"}
    finally:
        MR._memory_collection, RR._collection = saved_mem, saved_rag
        MR.CHROMA_PERSIST_DIR = saved_mod
        settings.CHROMA_PERSIST_DIR = saved_set
        if saved_env is not None:
            os.environ["CHROMA_PERSIST_DIR"] = saved_env

    ctx.emit({
        "layer": "G", "item_id": "G-OUT-chromadb", "provenance": "self-authored",
        "subtest": "outage_chromadb", "instrumented": True,
        "input": f"corrupt chroma.sqlite3 at {bad}",
        "expected": "observed only - no bar",
        "code_path": ("memory/retriever.py has two nested try/except and degrades to ''; "
                      "rag/retriever.py:retrieve_relevant_passages has NO try/except"),
        "actual_reply": str(results),
        "checks": {"memory_raised": results["memory"]["raised"],
                   "memory_degraded_silently": not results["memory"]["raised"],
                   "rag_raised": results["rag"]["raised"],
                   "detail": results, "item_passed_hard_bar": None},
        "judge": None, "invalid": False,
    })
    print(f"  chroma down -> memory_raised={results['memory']['raised']} "
          f"rag_raised={results['rag']['raised']}")


async def _redis_down(ctx) -> None:
    from services import redis_store

    # (a) the state this whole eval runs in: REDIS_URL unset
    unset_available = redis_store.is_available()
    redis_store.set("recallai:eval:probe", "x")
    unset_roundtrip = redis_store.get("recallai:eval:probe")

    # (b) forced bad URL: a closed port
    saved_url = os.environ.get("REDIS_URL")
    saved_client, saved_flag = redis_store._client, redis_store._redis_available
    os.environ["REDIS_URL"] = "redis://127.0.0.1:1/0"
    redis_store._client, redis_store._redis_available = None, False
    try:
        bad_available = redis_store.is_available()
        redis_store.set("recallai:eval:probe2", "y")
        bad_roundtrip = redis_store.get("recallai:eval:probe2")
    finally:
        if saved_url is None:
            os.environ.pop("REDIS_URL", None)
        else:
            os.environ["REDIS_URL"] = saved_url
        redis_store._client, redis_store._redis_available = saved_client, saved_flag

    ctx.emit({
        "layer": "G", "item_id": "G-OUT-redis", "provenance": "self-authored",
        "subtest": "outage_redis", "instrumented": True,
        "input": "(a) REDIS_URL unset  (b) REDIS_URL=redis://127.0.0.1:1/0",
        "expected": "observed only - no bar; silent fallback is expected and MUST be reported",
        "code_path": ("services/redis_store.py:_get_client - returns None and prints to "
                      "stdout, then every op writes to the in-process _fallback dict. "
                      "services/analytics.py writes call and emotion records through it, "
                      "so with Redis down the admin dashboard silently loses them on restart."),
        "actual_reply": (f"unset: available={unset_available} roundtrip={unset_roundtrip!r}; "
                         f"bad_url: available={bad_available} roundtrip={bad_roundtrip!r}"),
        "checks": {"unset_available": unset_available,
                   "unset_roundtrip_ok": unset_roundtrip == "x",
                   "bad_url_available": bad_available,
                   "bad_url_roundtrip_ok": bad_roundtrip == "y",
                   "fell_back_silently": (not unset_available) and unset_roundtrip == "x",
                   "raised": False, "item_passed_hard_bar": None},
        "judge": None, "invalid": False,
    })
    print(f"  redis -> unset_available={unset_available} bad_url_available={bad_available} "
          f"(in-memory fallback worked: {unset_roundtrip == 'x'})")


async def run(ctx) -> None:
    await _latency(ctx)
    await _anthropic_down(ctx)
    await _chroma_down(ctx)
    await _redis_down(ctx)
