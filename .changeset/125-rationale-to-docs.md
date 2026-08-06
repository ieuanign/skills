---
"ieuanign-skills": minor
---

`/dev-loop`'s rationale moves to `docs/`, where a human reads it and no run loads it. **Purely additive** — nothing under `skills/` or `agents/` changes, no file is deleted, and a run behaves byte-identically before and after. This is the expand step: the new form exists beside the old so that later changes can delete the old without losing anything.

**`docs/dev-loop.md`** is the narrative. What the pipeline does, the four words you need before the rest reads (lane, sub-lane, layer, stack), when to reach for it over `/implement`, prerequisites, what one run does in six acts, and then the seven run shapes end to end — one lane, parallel lanes, stacked lanes, a split issue, an unattended run, a resumed run, cleanup. It closes with the questions people actually ask, each answered with the reason rather than the rule: why a draft opened, why the issue's checkboxes are still unticked, why planning looks expensive in the cost log, why there is no token budget, why a worktree is still standing, why there is no watchdog.

**`docs/dev-loop-internals.md`** is the mechanism. Every loop, every bound, every route, every ending, and the reasoning that fixed each one where it is: the per-commit implement loop and its give-up clause, the review loop's progress-sensitive counter with both worked traces, finding identity, the suite gate and why a red suite is diagnosed rather than handed to the writer, the commit-breakdown check, the lane conclusion, the worktree invariant, the terminal-state table and its four-way ready predicate, the findings ledger, and touchpoint overlap with its two accepted costs. A reader wants this; the orchestrator never branches on any of it.

It also records **why the suite gate has no agent definition while the notifier has one**, so the asymmetry is not later "fixed". The rule behind both: a role gets a definition when it has judgement to constrain. The suite gate runs a quoted command and has none — which is also why its effort tier lives at its dispatch site, there being nowhere else it could live.

Three architecture decision records for decisions that were load-bearing and unrecorded:

- **[ADR-0005](https://github.com/ieuanign/skills/blob/main/docs/adr/0005-no-token-ceiling.md)** — token spend is reported, never enforced. Four reasons a ceiling could not work, and the load-bearing reason it was unnecessary: a lane is already bounded from five directions, and the most expensive lane in the measured set was not stuck but thirteen commits of genuine work against a median of three. A ceiling would not have caught a runaway; it would have refused a big issue.
- **[ADR-0006](https://github.com/ieuanign/skills/blob/main/docs/adr/0006-empty-returns-stay-failed.md)** — an empty return is reported as an empty return, and its ending stays `FAILED`. A skipped agent and a dead one are indistinguishable from where the pipeline sits, so asserting a death sends a reader looking for a crash that may never have happened; and calling it a halt would assert the one thing known not to have happened.
- **[ADR-0007](https://github.com/ieuanign/skills/blob/main/docs/adr/0007-per-commit-push-is-not-implementable.md)** — per-commit push cannot be built from where the commits happen, and buys nothing where it could. No stage in the pipeline consumes an intermediate push.

A fourth was expected and turned out to exist already: the implement loop keeping a flat bound where the review loop is progress-sensitive is [ADR-0002](https://github.com/ieuanign/skills/blob/main/docs/adr/0002-review-loop-progress-sensitive-bound.md)'s, written when that bound changed. Ticked against it rather than duplicated — a derived copy with no invalidation is what ADR-0001's first corollary forbids.

92 of the rule inventory's 389 entries are ticked, each recording where it landed.
