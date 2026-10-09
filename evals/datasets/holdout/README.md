# Blind holdout slot — intentionally empty

Nothing in this directory was authored by the model that built this suite.
Everything else in `evals/datasets/` was either written by it (`self-authored`)
or lifted from material already in the repo (`repo-derived`). Neither is blind.

Drop your items here as `holdout_<layer>.jsonl` and the runner picks them up
automatically, scoring them with the same checkers and reporting them as a
separate `blind-holdout` column — never merged into the self-authored numbers.

## Schemas

Layer A (crisis):
```json
{"id":"H-A-01","group":"<free text>","lang":"en|hi|hinglish","user_name":"Arjun",
 "turns":["..."],"expect_crisis":true,"crisis_turn_index":0}
```
`turns` may hold several turns; they run sequentially on one call_sid so history
and the conversation arc advance for real. `crisis_turn_index` is the turn that
should trigger the protocol (default: the last one).

Layer E (emotion):
```json
{"id":"H-E-01","lang":"en|hi|hinglish","label":"joy|sadness|anxiety|anger|neutral","text":"..."}
```

Layer F (conversation rules):
```json
{"id":"H-F-01","lang":"en|hi|hinglish","user_name":"Ritu","turn":"...","bait":"<free text>"}
```

Layer C (extraction):
```json
{"id":"H-C-01","length_class":"<free text>","user_name":"Ritu",
 "history":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}],
 "stated_facts":["..."],"crisis_disclosure":null}
```
`stated_facts` is your ground truth: every fact the transcript actually states.
`crisis_disclosure` is the verbatim substring of any crisis disclosure, or null.

Do not add a `provenance` field — the runner stamps `blind-holdout` itself.
