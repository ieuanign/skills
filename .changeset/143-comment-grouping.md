---
"ieuanign-skills": minor
---

`/pr-comments` runs a whole pull request's comments in one pass, and the table says which
commit each fix becomes.

The one-fix ceiling is gone: every **fix**-classified comment proceeds, and the default is one commit
each. Two share an ordinal only where they ask for the same change — two reviewers wanting one rename
— and that row states what makes them one. **Proximity is never sameness**: two comments on the same
region of a file take one commit each, because silent merging is the thing the table exists to
prevent. A run left with no fix row shows the table and stops, provisioning no worktree and
dispatching no phase.

Grouping is decided at classification time, the table being the plan — approving those rows is what
approves the commits. Ordinals run file by file and ascending by anchor within each, fixes anchored to
no file last, and all of them in **one** sub-lane: sequential commits in one worktree is the only
thing that makes a later fix open a file with the earlier one already in it. The table gains a Commit
column and is ordered by it, so a shared ordinal shows by adjacency; every row is still one line and
an excerpt rather than a body, so fifteen rows read as three do.

The file the execute phase reads grows a real breakdown — one entry per ordinal, each naming by number
and url exactly the comment(s) it satisfies and carrying their bodies verbatim, every message unique,
and every anchor labelled a **pre-run** position, since the first commit's edit moves the second's line
number. The `commits` array handed to the phase is that breakdown entry for entry, and is never empty.

The ledger reads its commit list from `git log <base>..<branch>` in the worktree rather than from the
writer's returned one, and reports `<n> planned, <m> made`: a `wip:` commit is listed and not counted,
and a planned commit the branch does not hold is named as not made.

Unchanged: the gate above every write, the two writes below it, no force-push in any form, and nothing
under `skills/dev-loop/` touched — its execute phase already ran a sub-lane's commits sequentially in
one worktree.
