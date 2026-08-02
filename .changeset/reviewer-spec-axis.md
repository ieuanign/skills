---
"ieuanign-skills": minor
---

`dev-loop`: the reviewer now checks the work against the issue, not just against the plan.

Nothing in the pipeline had ever compared the diff to the request. The reviewer saw only the plan — a faithful distillation is still a proxy — and its own text justified skipping a spec check on the grounds that a later conformance sign-off covered it. That sign-off never read the issue either, and it no longer runs.

The reviewer now receives the originating issue's body in its arguments, fenced, and returns a `met` / `partial` / `not-met` verdict per acceptance criterion with the evidence for each. It is passed the body rather than an issue number, so its Bash stays read-only and git-only. The spec report brief is inlined in the agent definition, the same way the standards one is.

**Spec verdicts never block, by construction.** They stay out of `FINDINGS`, never change the `VERDICT`, never trigger a fix cycle and never end a lane — a review with zero blocking findings and a not-met criterion is `APPROVED`. The writer is plan-bound and returns BLOCKED rather than improvise, and the architect, the only agent that could re-decide a plan, does not run again in the lane; a blocking spec finding would demand a fix nobody available could make. The verdicts route to the findings ledger, then to the per-lane report at Gate 2 and an **Acceptance criteria** section in the PR body, in front of the human who merges.

`contracts.md` gains the per-stage context contract — what each stage receives, what it is permitted to read, and what it returns — with the reviewer's row stating the issue body in and the criterion verdicts out.
