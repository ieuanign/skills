---
"ieuanign-skills": minor
---

`dev-loop`: a lane that throws comes back attributed instead of vanishing.

A lane that died from a terminal API error left no trace at all. The workflow runner resolves a thrown thunk to nothing and both phase scripts filtered their results for truthiness, so the lane disappeared from the returned array entirely — no entry, no issue number, no reason, no record of which issue was lost. Supervised mode survives this because a human counts lanes at Gate 2; unattended there is nothing to count against.

Each per-lane closure is now wrapped once. A throw is caught and converted into an ending of the shape the lane would have produced itself: the issue number, the **FAILED** category, and a reason built from the error message plus the stack trace where one exists. A genuinely dead agent frequently throws neither, so the wording says so rather than promising a trace that will be empty.

The crashed lane's partial sub-results come back with it, **attempt log included** — the record most worth keeping from a lane that crashed mid-recovery. Each unfinished sub-lane takes the same ending and is run through the terminal-state table, so the host meets a complete row at Gate 2 rather than a record with no `terminal` it cannot dispose of. Per the terminal-category split the label decides nothing: a crashed lane with commits on its branch pushes and opens a draft pull request like any other ending.

**Neither phase script can drop a requested issue any more.** Both final filters became maps that attribute a null, which — now that the thunks cannot throw — can only be the runner itself dropping a lane, and is exactly as unattributable as the throw used to be. A throw in the planning phase's per-issue thunk returns the same `DIED` entry a dead architect already produced.

The attribution is **mode-neutral**: the catch, the category and the reason are identical under `gated` and `unattended`, because a lane vanishing is a bug in the gated path too — there it shows up as a lane silently missing from the Gate 2 report.

The wrapper is also the single point later work hooks an ending-time dispatch into. The lane body has seventeen ending sites, and threading anything through each of them is how two writers drift apart.
