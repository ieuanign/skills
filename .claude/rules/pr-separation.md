# PR separation

How work in this repository splits into pull requests. Read by anyone splitting a change by hand, and
by `/dev-loop` at two points: the architect applies **Order** and **Size** when writing a plan's
commit and PR breakdown, and the pipeline applies **Overlapping changes** when deciding which work
runs in parallel.

## Order

A change that spans areas splits in dependency order, each area its own pull request, each based on
the one below:

`scripts/lib/` → `agents/` → `skills/<name>/` → `README.md`, `CONTEXT.md`, `docs/`

A skill's `.claude-plugin/plugin.json` entry rides with its folder, never ahead of it. Most changes
touch one link only.

A later pull request may assume the one below it has landed. One that cannot is not in this chain.

## Size

Split any pull request that would exceed **~45** changed files.

This is a review-attention limit, not a correctness rule: past it, a human reviewer skims. Prefer
splitting along a seam that leaves each part independently reviewable over trimming to hit the number.

**It binds the plan, not the diff.** Sizing is decided when the work is broken up, because that is the
only point at which it can still be changed cheaply — a finished pull request cannot be un-split by
whoever reviews it.

## Overlapping changes

When two pieces of work in flight touch the same file:

**`additive`** — fine in parallel when they touch different parts of the file, such as two appends to a
registry or barrel. Edits to the *same region* go in separate, stacked pull requests instead.

**Work that consumes another change's output is always stacked, whatever this section says** — the
alternative is a pull request that does not build against its base. This section governs work that
merely *touches* the same file, never work that *depends* on it.
