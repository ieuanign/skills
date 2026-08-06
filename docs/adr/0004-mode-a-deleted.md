# 0004 — Mode A is deleted, and the Workflow tool becomes a precondition

**Status**: accepted, and implemented — `/dev-loop` dispatches only through the Workflow tool, and a
session without it is refused at intake whatever the run mode.

`/dev-loop` used to carry two dispatch mechanisms. **Mode W** ran the phase scripts on the Workflow
tool. **Mode A** was what the orchestrator did when the Workflow tool was not in its toolset: it drove
the Agent tool directly — one background agent per parallel unit, sequential awaits inside a lane —
enforcing every cap, route and ending from `contracts.md` by reading them and remembering.

Mode A is deleted. What remains is one implementation, and a precondition where the second one used
to be.

## Decision

**The Workflow tool is a precondition of the whole pipeline.** Act 0 refuses a session that does not
have it, before a single agent is dispatched and before intake asks anything else. The refusal names
the setting — `"enableWorkflows": true` in the per-machine settings file — and says a **restart is
required**, because tool availability is fixed at session start and writing the setting cannot rescue
the run that discovered the problem. The question is asked once per machine and the answer, including
a refusal, is persisted in that settings file.

**There is no fallback dispatch path**, so the refusal is the end of the run rather than a branch into
something lesser.

**The rule requiring a behaviour change to edit the contract first and then both implementations is
retired.** There is one implementation. ADR-0002 and ADR-0003 record in their status lines that they
were implemented under that rule; those lines are history and stay as written.

## What Mode A was, and why it goes

Mode A was a natural-language reimplementation of the phase scripts — the same state machine, expressed
as instructions to be followed rather than as code to be run. That is what makes it indefensible, and
the contract conceded it in terms: **bound enforcement is mechanical in a script and merely remembered
by a model otherwise.** A bound that is remembered is not a bound. Nothing could test it, because
there was nothing to run.

Two of its properties were already load-bearing arguments against it, both recorded before this
decision:

- **It was tier-locked by construction.** The direct Agent tool has no effort parameter, so Mode A had
  no mechanism for varying effort per stage, and any cost dial the pipeline ever gained was Mode W's
  alone. This was a property of the mechanism, not an oversight in it.
- **It never implemented the unattended half of lane conclusion.** Unattended runs were Mode W's only,
  for three independently sufficient reasons: per-stage effort was impossible under the tier-lock; the
  notifier fires from inside the phase script, and Mode A's host is never blind, so the same
  notifications would have needed a second, differently shaped implementation; and bound enforcement
  is mechanical in a script and remembered otherwise.

So Mode A was already a partial implementation restricted to the supervised run, where a human
absorbed the difference. Its one recorded firing was a manual-recovery path — a person plus an agent
reading a reference — which is a use of `contracts.md` as documentation, not a second normative
implementation of it.

## What is lost

**A session without the Workflow tool can no longer run `/dev-loop` at all.** Before this, a `gated`
run in such a session degraded quietly into Mode A and produced work; now it is refused and the
developer restarts. That is the whole of the loss, and it is paid once per machine.

It is worth paying because the thing being lost is the appearance of a working run rather than a
working run. A Mode A lane enforced its caps by recollection across a long context, and the failure it
produced — a loop that ran one cycle too many, an ending that skipped a stage — is silent and looks
exactly like success.

**The manual-recovery path survives**, because it never needed Mode A to exist. A human reading the
state machine and driving agents by hand is reading a document, and the document is still there.

## Considered options

**Keep Mode A for `gated` runs only.** Rejected. This was already the status quo, and it is what made
the pipeline expensive to change: every behaviour change had to be written twice, in two languages,
with only one of the two testable. The cost was paid on every edit; the benefit arrived when someone
had not enabled a setting.

**Keep Mode A as documentation, in the contract but not as a mode.** Rejected as a distinction without
a difference. Prose that describes how to drive the pipeline by hand, sitting in the normative
contract, is read as normative — and the "edit both implementations" rule existed precisely because it
was.

**Detect the missing tool and offer to continue degraded.** Rejected. The question is unanswerable at
the point it would be asked: nobody can weigh "a run whose bounds are advisory" against restarting,
and offering it implies the two outcomes are comparable.

## Consequences

- **Refusal is now a whole-pipeline precondition rather than an `unattended` guard**, which is the one
  behaviour change in this compression effort. Everything else in it relocates prose.
- **The answer persists per machine, never to the repo profile.** Which tools a session has is a
  property of the machine, not of the repository being worked, so the repo profile is the wrong home —
  and the setting is read back from the same file that grants the tool, so no derived copy exists.
  ADR-0001's boundary is undisturbed: availability is still detected at runtime and declared in no
  profile.
- **`contracts.md` loses its only branch point.** Lane conclusion still branches on the run mode —
  `gated` and `unattended` — but nothing branches on how a stage is dispatched, and the two remaining
  "modes" in the vocabulary are unambiguous.
- **A future cost dial is now simply possible.** Per-stage effort was blocked on Mode A having no way
  to express it; that constraint is gone with it.
