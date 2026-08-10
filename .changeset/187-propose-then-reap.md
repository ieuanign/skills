---
"ieuanign-skills": patch
---

`/dev-loop-cleanup` proposes every candidate a run left behind, and reaps only the ones a human picks.

Cleanup reaped a merged lane's branch and its plan file, and was forbidden from touching worktrees at
all. But `/dev-loop` deliberately keeps a sub-lane's worktree in three cases — a `gated` ending, a lane
held at Gate 2, a refused removal — and when that pull request later merged, nothing removed it. The
branch could not go either: one checked out in a surviving worktree is undeletable.

The skill is now **propose, then reap**. Candidates come from three observable sources unioned by lane
number — worktree directories under `<WORKTREES>`, local branches, and `.scratch/**/<n>-*.md` in any
folder. An argument scopes the run to one lane and no argument lists every candidate; session context
is never consulted for scope. One table — `Lane | PR | Worktree | Branch | Scratch | Recommend | Why` —
prints in both modes, and nothing has happened when it does. `remove` is recommended only where
`gh pr view` reports merged **and** `git status --porcelain` is empty; everything else is `keep`, with
**Why** naming the half that failed. A lane whose worktree is already gone is the ordinary case, not a
failed condition. Then the skill stops and asks, in plain text, because the table has an arbitrary
number of rows and `AskUserQuestion` has four options. **Naming an issue on the command line is not
consent to delete its artifacts** — the answer is.

Picked lanes reap worktree, then branch, then scratch, in that order because a branch is held by the
worktree it is checked out in. Removal is `git worktree remove` against a path under `<WORKTREES>`
confirmed not to be the main worktree, and a refusal is reported with that worktree's porcelain status
rather than retried. `git branch -d` escalates to `-D` only where the merged check already passed —
squash and rebase replay the work under new shas, so ancestry can no longer prove a merge — and only
against a local ref. Scratch reaping widens from `.scratch/*/plans/<n>-*.md` to every scratch file
keyed to that number in any folder, which brings `/pr-comments`'s comment table into scope; that
skill's sentence claiming otherwise is corrected in the same change that falsifies it.

`/dev-loop`'s hand-off now says cleanup removes the worktree that run kept, so both skills describe one
contract in the same words.

`npm run check` gains a **worktree removal guardrail** stage. Three skills state
`Worktree removal never passes --force.` because none of them loads the others, so the copies can drift
silently and a guardrail nobody notices going missing is one an agent can talk its way past. The stage
requires that sentence, verbatim and markup-free, in every `SKILL.md` under `skills/` that mentions
`worktree remove`, and fails naming the files that lack it — the same treatment the cost-stage
vocabulary and the review-loop ceiling already get.
