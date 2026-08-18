---
"ieuanign-skills": patch
---

`npm run check` gains a **blocking precondition coverage** stage: every precondition
`skills/dev-loop/preconditions.mjs` refuses an unattended run on has to be written by
`/setup-ieuanign-skills`.

Nothing checked that pairing. The existing **profile split** stage answers a different question — it
validates _this_ repository's `docs/agents/worktree.md` — and it stayed green for the whole life of
the gap #256 closed, where the setup skill wrote no worktree profile and no `.worktreeinclude` while
both pipelines refused at intake naming exactly those three. The two files can drift apart again the
moment a fourth blocking entry is added, and a refusal nobody can satisfy without a supervised run is
the failure that follows.

The stage reads both sides **as text**: an awk range over each caller's `blocking: [` block yields one
label per entry — a `profileKey(...)` call's key literal, and `WORKTREEINCLUDE`'s value for
`worktreeinclude(...)` — and a label is covered when it appears anywhere in
`skills/setup-ieuanign-skills/SKILL.md`. Uncovered labels FAIL, naming each one and the file it was
expected in. The module is never imported and never run, so the stage holds no second copy of its
blocks, its exit codes, or of what a label means; matching is substring, so Part 4's prose keeps its
own formatting.

**Half a parse is treated as a break, not a pass.** A caller key whose blocking range yields no label
fails naming that caller, a blocking entry in a shape the extractor does not know fails naming its
`file:line` alongside the two forms it reads, and either side coming up empty fails naming which side
and what it found. A stage that silently compared nothing to nothing would reopen the gap it exists to
hold shut. Every `grep` feeding one of those guards ends `|| true`, because under `pipefail` a
no-match would end the run before the guard could name anything.

`skills/dev-loop/preconditions.mjs` and `skills/setup-ieuanign-skills/SKILL.md` are unchanged, and no
existing stage was touched.
