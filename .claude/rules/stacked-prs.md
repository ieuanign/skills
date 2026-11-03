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

When a fix moves a pull request's only change into the one below it, `gh stack rebase` drops its
commits as already applied and leaves it **emptied**. In this order:

1. **Close it unmerged**, with a comment naming the pull request its change now sits in:
   `gh pr close <number> --comment "<why, and where the change went>"`. Closing comes first because
   GitHub marks a pull request merged once its head has nothing beyond its base, which the push
   would give it.
2. **Base the one above it on the one below it**, keeping the chain unbroken:
   `gh pr edit <above> --base <below's branch>` — the trunk when the emptied one was the bottom. When
   it was the top, there is no one above, so go to step 3.
3. **`gh stack rebase`**.
4. **`gh stack push`**.

The close, the base change and the push are the only writes to GitHub.

## What this does not cover

**A branch that is not part of a stack rebases normally.** This rule is about chains; a single branch
off the default branch has nothing above it to strand.

**`/dev-loop` never rebases and never force-pushes.** It only ever pushes forward — a fix lands as a new
commit on top — and opens the pull requests already chained. Everything above is about what *you* do
to those branches afterwards.
