Skeleton for `.claude/rules/scratch-files.md`. Substitute the repo's own scratch directory if it is
not `.scratch/`. No `paths` frontmatter — this governs a habit, not a file type. Everything below the
line goes in the file.

---

# Scratch files

Anything under `<.scratch/>` is **working material, never a deliverable**. It is gitignored, so it
exists on exactly one machine, in exactly one checkout, until something deletes it.

**Nothing may depend on one surviving.** Not a later task, not an acceptance criterion, not a reader
you expect to find it. A plan that names a scratch path as an output is naming work being done, not an
artifact something later will open.

**When its content matters, move the content before the file goes.** Two ways, and no third:

- **Commit it.** Being tracked is what makes it survive — and it is also what takes it out of scratch.
- **Paste it onto the issue or the pull request**, then delete the file. The thread is durable, it is
  where anyone looking for the context will actually be, and it survives the checkout.

**Then delete it.** A scratch file left behind is one nobody can tell from a live one — it accumulates
until someone has to guess which are still in use, and guessing wrong is how real working notes get
deleted. Clear yours in the change that finishes with them.

`/dev-loop` already names, in each pull request body, every gitignored path a plan listed before
removing the worktree that holds it. This rule covers the ones no plan named.
