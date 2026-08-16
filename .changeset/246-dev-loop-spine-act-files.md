---
"ieuanign-skills": minor
---

`/dev-loop`'s `SKILL.md` is a spine over seven act files, each read at the boundary where its act
fires.

The file was 61,782 chars — roughly 15.4k tokens — and every one of them loads into the orchestrator
session at invocation and stays there. A run long enough to compact loses about two-thirds of its own
contract, and what it loses is silent: the orchestrator carries on with whatever survived, and an act
performed from a half-remembered contract looks exactly like one performed from the real thing.

**The spine keeps only what binds *between* acts** — the frontmatter, the identity paragraph,
`## Arguments`, a skeleton naming each act and gate at a line apiece, `### Run mode`'s four decision
lines, `### How you write a ⟨notify⟩ event`, `## Derived facts` and `## Hard rules` — and comes to
13,516 chars. **Each act's whole contract moves into its own file** under `skills/dev-loop/acts/`:
`act-0.md`, `act-1.md`, `gate-1.md`, `act-2.md`, `act-3.md`, `gate-2.md`, `act-4.md`. The standing
rule in the skeleton is what makes the split work — read the act's file before performing it, at
EVERY boundary where it fires, so an act that runs per layer is read per layer and the freshly read
file, not the conversation, is the current word.

**Nothing is relaxed.** Every rule, gate, refusal and unattended-answer row survives, relocated
mostly verbatim; the eight files together come to fewer chars than the one they replace. Two pieces of
prose left rather than moved. The stack-linking table's **Why** column: `docs/dev-loop-internals.md`
§Stack linking already reasoned three of its six rows and gained the other three here, so the rules
ride in `acts/gate-2.md` as bare bullets. And `## Where configuration lives`, gone from the skill
entirely — `docs/dev-loop.md` now states the three refusals it used to defer to `SKILL.md` for.
`## Repo profile` went into `acts/act-0.md`. Act files carry no frontmatter, which is what keeps them
supporting files rather than seven more skills.

`scripts/check.sh`'s worktree-removal guardrail follows the prose it pins: it scans every bundled
`.md` rather than `SKILL.md` alone, because a skill may split its steps across supporting files and
the removal travels with the step that performs it. `acts/gate-2.md` is the carrier the spine used to
be, and the stage still reports three. `.claude-plugin/plugin.json` needed no change — it lists skill
folders, so `acts/` ships and resolves as-is.
