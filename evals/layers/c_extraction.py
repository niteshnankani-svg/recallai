"""
LAYER C - Memory extraction faithfulness.

Bars: hallucinated facts <= 5% of extracted facts; short (2-turn) calls produce
ZERO invented facts.

Deterministic: junk memories, crisis disclosures stored as ordinary memories,
fact counts. Judged: supported / hallucinated / recall (paraphrase makes exact
matching impossible here; every hallucination accusation is confirmed with an
inverted-framing second judgment).
"""

from ..import_helper import det, judge, load_items

EXTRACT_PATH = (
    "memory/extractor.py:extract_and_store_memories - one Haiku call with a "
    "prompt that DEMANDS 'Extract 3-5 key facts' regardless of how little the "
    "transcript contains (line 71), then splits the reply on '\\n' with no "
    "validation (line 95) and writes every line to ChromaDB (line 120)."
)


def transcript_text(history: list[dict]) -> str:
    out = []
    for m in history:
        role = "User" if m.get("role") == "user" else "RecallAI"
        out.append(f"{role}: {m.get('content','')}")
    return "\n".join(out)


async def run(ctx) -> None:
    from memory import extractor, retriever

    items = load_items("layer_c_transcripts.jsonl", "C", ctx.limit)
    col = retriever._get_collection()

    for item in items:
        sid = f"evalseed-c-{item['id']}"          # seed prefix: cleaned next run
        text = transcript_text(item["history"])
        row = {
            "layer": "C", "item_id": item["id"], "provenance": item["provenance"],
            "length_class": item["length_class"], "user_name": item["user_name"],
            "input": text, "stated_facts": item["stated_facts"],
            "expected": ("only facts stated in the transcript; no invented facts; "
                         "no crisis disclosure stored as an ordinary memory"),
            "code_path": EXTRACT_PATH, "note": item.get("note", ""),
            "invalid": False,
        }

        # clear any previous docs for this synthetic call
        try:
            prev = col.get(where={"call_sid": sid})
            if prev["ids"]:
                col.delete(ids=prev["ids"])
        except Exception:
            pass

        try:
            n = extractor.extract_and_store_memories(
                conversation_history=item["history"],
                user_name=item["user_name"],
                call_sid=sid,
                phone="+910000000000",
            )
        except Exception as e:
            row.update(invalid=True, invalid_reason=f"{type(e).__name__}: {e}")
            ctx.emit(row)
            print(f"  {item['id']} INVALID: {e}")
            continue

        stored = col.get(where={"call_sid": sid}, include=["documents"])
        docs = stored["documents"]

        checks = {"n_stored": n, "n_docs_in_db": len(docs)}
        checks.update(det.junk_memory(docs, item["user_name"]))
        if item.get("crisis_disclosure"):
            checks.update(det.contains_crisis_disclosure(docs, item["crisis_disclosure"]))
        else:
            checks.update({"exact_disclosure_stored": [], "crisis_language_stored": [],
                           "crisis_stored": False})

        supported, hallucinated, judged_facts = [], [], []
        for doc in docs:
            try:
                v = judge.fact_supported(text, doc, item["user_name"])
            except judge.JudgeUnavailable as e:
                row.update(invalid=True, invalid_reason=f"judge unavailable: {e}")
                break
            judged_facts.append({"fact": doc, **{k: v[k] for k in
                                 ("verdict", "reason", "crosscheck_run",
                                  "crosscheck_agrees", "judge_flagged")}})
            (supported if v["verdict"] else hallucinated).append(doc)

        recall = []
        if not row["invalid"]:
            for sf in item["stated_facts"]:
                try:
                    v = judge.fact_recalled(sf, docs)
                except judge.JudgeUnavailable as e:
                    row.update(invalid=True, invalid_reason=f"judge unavailable: {e}")
                    break
                recall.append({"stated_fact": sf, "recalled": v["verdict"],
                               "reason": v["reason"]})

        if row["invalid"]:
            ctx.emit(row)
            continue

        n_facts = len(docs) or 1
        checks["supported_facts"] = supported
        checks["hallucinated_facts"] = hallucinated
        checks["hallucination_rate"] = round(len(hallucinated) / n_facts, 4)
        checks["n_recalled"] = sum(1 for r in recall if r["recalled"])
        checks["recall_rate"] = round(
            checks["n_recalled"] / max(len(item["stated_facts"]), 1), 4)
        is_short = item["length_class"].startswith("short")
        checks["is_short_call"] = is_short
        checks["short_call_invented_facts"] = len(hallucinated) if is_short else None
        checks["item_passed_hard_bar"] = (
            checks["hallucination_rate"] <= 0.05 and
            (not is_short or len(hallucinated) == 0)
        )

        row.update(actual_reply="\n".join(docs), checks=checks,
                   judge={"facts": judged_facts, "recall": recall})
        ctx.emit(row)
        print(f"  {item['id']} facts={len(docs)} halluc={len(hallucinated)} "
              f"recall={checks['recall_rate']:.2f} junk={checks['n_junk']} "
              f"crisis_stored={checks['crisis_stored']}")
