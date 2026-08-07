---
"ieuanign-skills": minor
---

`/dev-loop-pr-comments` turns one pull request's unresolved comments into a table, and the approved
fix into a pushed commit.

It reads the comments through the normaliser the folder already held, classifies each **fix** or
**skip** on its own plain reading, and shows every one of them — the skips included, since those are
the half a human is likeliest to disagree with. Nothing below the approval gate runs without an
explicit answer, and exactly one **fix** row may proceed: more than one shows the table and stops,
because grouping several fixes into commits is not built.

The fix itself runs on `/dev-loop`'s existing execute phase — writer, review loop and suite gate,
dispatched with no phase script of its own and no edit to that one. The worktree attaches to the pull
request's **existing** head branch and invents none, its tip sha becoming the sub-lane's base so the
reviewer diffs this run's work rather than the human's whole pull request. There is no issue behind a
review comment, so no acceptance-criteria axis is passed and none is reported.

The artifacts belong to someone else, so the whole run makes two writes: one `git push` to the branch
the pull request already has — never forced, in any form — and one `gh pr comment` carrying the
findings ledger. No review thread is resolved, no draft state converted, no label added, no body
edited. A sub-lane that ends pushes nothing and keeps its worktree; removal happens only after a
push has succeeded.

Gated only — there is no unattended mode and no token that asks for one.
