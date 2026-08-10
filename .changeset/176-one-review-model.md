---
"ieuanign-skills": minor
---

`/code-review-mp` is retired. `/mattpocock-skills:code-review` is the command to reach for by hand,
and the `reviewer` agent preloads that same skill — one review model, in two shells.

The fork carried its own copy of the twelve-smell Fowler baseline and so did `agents/reviewer.md`,
with nothing comparing either pair; the fork had meanwhile drifted three versions behind the skill it
was forked from. The agent now takes the baseline and its two binding rules from the preload, and
states which four of that skill's process steps a `/dev-loop` run governs instead — the fixed-point
pin, the spec source, the parallel sub-agents, and the `## Standards` / `## Spec` aggregation format.
Its seven priority-ordered rubric dimensions, its Spec axis and its return format are untouched, so
the pipeline parses the same contract it always did.

Nothing to migrate but the name: `/mattpocock-skills:code-review` arrives with the plugin dependency,
so it is already installed wherever `/code-review-mp` was. `/setup-ieuanign-skills` and its
smell-overrides template, `README.md`, `CONTEXT.md` and `docs/pr-comments.md` all name it now.
