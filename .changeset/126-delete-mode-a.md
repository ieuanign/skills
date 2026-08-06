---
"ieuanign-skills": minor
---

`/dev-loop` runs on the Workflow tool only — the Agent-tool fallback is deleted.

Mode A was a natural-language reimplementation of the phase scripts: the same state machine expressed
as instructions to be followed rather than code to be run, so its bounds were remembered rather than
enforced and nothing could test them. It never implemented the unattended half of lane conclusion, and
it was tier-locked by construction — the direct Agent tool has no effort parameter.

The `enableWorkflows` ask-then-persist flow is promoted from an `auto`-only guard to a precondition of
the whole pipeline: a session without the Workflow tool is refused at intake whatever the run mode,
told the setting and that a restart is required, and asked once per machine. A persisted refusal is
honoured without asking again.

The rule requiring a behaviour change to edit the contract first and then both implementations is
retired, there now being one implementation. `docs/adr/0004-mode-a-deleted.md` records what Mode A
was, why it goes, and what is lost.
