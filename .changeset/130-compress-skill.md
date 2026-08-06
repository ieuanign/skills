---
"ieuanign-skills": minor
---

`SKILL.md` is compressed to the writing-for-agents standard, and the host load is measured rather than
projected.

Four levers over what the relocations left behind. **No-op and rationale removal** did most of it: the
file argued with itself constantly, and an orchestrator does not need to be persuaded of a rule it is
being given. **Positive phrasing** replaced prohibitions, since steering by prohibition makes the
forbidden behaviour more available rather than less — with exactly three destructive operations keeping
an explicit ban alongside the positive, because they are hard guardrails: removing or force-modifying
the main worktree, passing `--force` to `git worktree remove`, and force-pushing. **Leading words**
collapsed restatements into the terms `CONTEXT.md` already carries. And the **description** — loaded in
every session on the machine, not only runs that invoke the skill — is now one line with one trigger
per branch.

The notifier's `model` and `effort` move into its own frontmatter and the dispatch site stops setting
them: a second copy of a tier can only drift. The suite gate's stay at its dispatch site, since it has
no agent definition by design and there is nowhere else they could live.

`CONTEXT.md` gains four terms that were being used interchangeably: **discovery cost** (what a skill
costs a session that never invokes it), **host load** (what the orchestrator carries for a run),
**agent load** (what one dispatched subagent carries), and **run spend** (what a run actually consumes,
measured after the fact).

Measured host load — `wc -c` over every file the orchestrator loads — is **146,547 → 53,273 bytes**, a
63.6% reduction, or roughly 36,700 → 13,400 tokens on the metric the baseline was taken on.
