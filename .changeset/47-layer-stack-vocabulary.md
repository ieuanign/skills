---
"ieuanign-skills": patch
---

`dev-loop`: the pipeline gains a word for the chain, and stops using one word for two shapes.

It said **wave** for a set of lanes that run concurrently and had nothing at all for a chain of branches each based on the one below. Those are different shapes — a wave holding three independent lanes is not a chain of anything — so every sentence about ordering was ambiguous, and none of it lined up with the vocabulary a developer meets in `gh stack --help`.

The horizontal thing is now a **layer** and the vertical thing a **stack**, with a **trunk** at the bottom and a **top**. The rename is exhaustive across the skill, the contract and the phase scripts, and `CONTEXT.md` gains both terms — it defined neither before, so these are additions rather than rewrites.

Renaming wave → *stack* was the original proposal and would have been wrong: it turns "wave 2 runs after wave 1" into "stack 2 runs after stack 1", which asserts the opposite of the truth. Those are two layers of one stack.

Nothing behaves differently. The layer rule reads exactly as the wave rule did — anything based on the trunk runs in layer 1, anything based on a branch that receives its commits in layer N runs in layer N+1.
