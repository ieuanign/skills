# Stacked pull requests

Pull requests here may be **stacked**: a chain where each branch is based on the one below rather than
on the default branch, so each reviews as its own change. The chain is recorded on GitHub with the
`gh-stack` extension, which makes the ordering data the platform holds rather than a sentence in a
body.

## Rebasing a stacked branch

Use **`gh stack rebase`**. Never `git rebase` followed by a force-push.

A plain rebase rewrites one branch's commits without touching the branches above it, so every one of
them is left based on commits that no longer exist. The force-push then makes that permanent on the
remote. The chain has to be rebuilt by hand from there, and the recorded stack no longer describes the
pull requests it names.

For the same reason: **`gh stack sync`** to bring a chain up to date with the default branch, and
**`gh stack merge`** to merge one. Merging the bottom of a chain by hand leaves everything above it
based on a branch that is gone.

## A pull request a rebase empties

When a fix lands a pull request's only change in the one below it, `gh stack rebase` drops that pull
request's commits as already applied, and it is left with none. Do this, in this order:

1. **Close it unmerged**, with a comment naming the pull request its change now sits in:
   `gh pr close <number> --comment "<why, and where the change went>"`.
2. **Base the one above it on the one below it**: `gh pr edit <above> --base <below's branch>` —
   onto the trunk when the emptied one was the bottom. When it was the top, there is nothing to
   re-base.
3. **`gh stack rebase`**.
4. **`gh stack push`**.

Those are its only writes to GitHub: one close, one base change, one push. Nothing is merged,
re-opened or deleted.

Not merged, and not left open to be pushed: a head with nothing beyond its base is what lets GitHub
mark a pull request merged, so the close and the base change come before the rebase and the push. Not
closed without re-basing the one above: that one would be left based on a closed pull request's
branch. Not `gh stack modify`: it is an interactive interface, which an agent cannot drive.

## What this does not cover

**A branch that is not part of a stack rebases normally.** This rule is about chains; a single branch
off the default branch has nothing above it to strand.

**`/dev-loop` never rebases and never force-pushes.** It only ever pushes forward — a fix lands as a new
commit on top — and opens the pull requests already chained. Everything above is about what *you* do
to those branches afterwards.
