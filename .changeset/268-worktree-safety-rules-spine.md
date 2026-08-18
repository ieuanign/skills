---
"ieuanign-skills": patch
---

`/dev-loop`'s worktree-removal guardrails are stated in the spine's `## Hard rules`, not in the act
file that performs the removal.

They sat in `acts/gate-2.md`'s step 3 — a file read at each layer's Gate 2 and nowhere else. The
rules bind *between* layers as much as during one, so between those reads they were resident only
because an earlier read happened to leave them there, and an orchestrator that had compacted since
was holding a destructive-action guard from memory. Three of the six statements already half-lived
in the spine — the never-`--force` sentence, resting on the act file for the mechanism it states;
the main-worktree prohibition, without the pre-removal confirmation; push-before-remove, without its
consequence — and the dirty-worktree refusal itself was in the spine nowhere.

**All six are stated there now**, folded into the bullets already present rather than appended beside
them: `git worktree remove` without `--force` refuses on tracked modifications or on untracked
non-ignored files, and **that refusal IS the guard**; a refusal is reported with
`git -C <wt> status --porcelain` verbatim and keeps that worktree; ignored files — provisioning's
copied-in configuration and dependency directories among them — do not trip it; a push that failed or
never ran keeps its worktree; and the main worktree is confirmed against the first entry of
`git worktree list` before any removal. There is still exactly one rule about force-pushing and one
about the main worktree, and no rule reaches into an act file for its own statement.

**Step 3 keeps the procedure**: the worktree invariant, the sub-lane state table, the removal command
carrying the sentence `scripts/check.sh` pins on it, the disposition of what the table kept, the
*Name what the removal destroys* paragraph, and a one-line citation that carries its own why — the
rules are the spine's *because* this file is read per layer. Nothing is relaxed and no statement is
lost. `/dev-loop-cleanup` and `/pr-comments` keep their own copies, deliberately: none of the three
skills loads the others.
