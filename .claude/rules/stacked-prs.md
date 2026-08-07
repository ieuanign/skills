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

## What this does not cover

**A branch that is not part of a stack rebases normally.** This rule is about chains; a single branch
off the default branch has nothing above it to strand.

**`/dev-loop` never rebases and never force-pushes.** It pushes each branch exactly once and opens the
pull requests already chained. Everything above is about what *you* do to those branches afterwards.
