---
"ieuanign-skills": minor
---

`/pr-comments` runs a fix phase of its own, and the roster stops naming who dispatches it.

The lane drove its approved fix rows through `skills/dev-loop/phase-execute.js`, a script written to
run many lanes over many issues, and `skills/pr-comments/SKILL.md` paid for the mismatch in prose: a
lane-and-sub-lane nesting it has exactly one of each of, four omitted keys with a paragraph justifying
each, a run mode the script never branched on, and a rule forbidding the skill from editing the
sibling it depended on.

**`skills/pr-comments/phase-fix.js`** now ships with the skill. It keeps every behaviour the lane
needs — the per-commit implement loop with its two debug+fix attempts and give-up clause, the review
loop under its no-progress threshold and 5-fix-cycle ceiling, the suite gate's 8-round and
2-rounds-without-a-new-failure bounds, the debugger on a failed writer and on a red suite, the `HALT`
and `FAILED` endings — and sheds what belonged to the pipeline: the lane and sub-lane nesting, the
spec-axis keys, the notifier and its skill directory, the run handle, the draft-state token, the
sub-lane area and the run mode. Its arguments are flat — `pr`, `planPath`, `worktree`, `branch`,
`base`, `commits` as message strings whose position is the ordinal, `suiteCommand`,
`fixCycleThreshold`, `agentNamespace` — and the sub-lane record comes back directly. Its header names
what it was derived from and which invariants must not drift, which is where that belongs: a decision
is recorded with the code it binds, so `CONTEXT.md` gains no note about the copy.

**`/dev-loop`'s execute phase, its lanes and its behaviour are untouched.** Sharing survives where it
was built to — `preconditions.mjs` and `notify.sh`, both the unattended branch's alone — so the
sibling-folder precondition moves into that branch, naming those two files, and a supervised run reads
nothing from the sibling skill folder at all. The plan file's path is unchanged, so
`/dev-loop-cleanup`'s existing sweep still finds it.

**The roster states its own contracts rather than its caller's.** `code-writer` and `reviewer` name
the plan sections they read — and treat one they do not find as empty, not as a malformed plan — take
their commit message from the plan instead of templating an issue number, and stop naming one
pipeline's plan directory; `debugger`'s replan diagnosis names the section that must change instead of
who re-plans it. Nothing is renamed, and the architect's plan template is unchanged.

`scripts/state-machine.mjs` compiles both phase scripts and drives the new one's loops, bounds and
endings with nothing dispatched. `scripts/check.sh` gains a stage that fails, naming both sides, when
an argument key the script reads is absent from the skill's dispatch block, and its review-loop ceiling
stage now takes a list of script-and-prose pairs, so each lane's ceiling is pinned against its own
documentation page. The syntax and resolved-agent-type stages cover the new script by filename glob,
with no edit.
