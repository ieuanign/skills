Skeleton for `.claude/rules/worktree-removal.md`. No substitutions — the rule names a command, not a
path in this repo. No `paths` frontmatter — this governs an operation, not a file type. Everything
below the line goes in the file.

---

# Worktree removal

**Never `git worktree remove --force`** — not by hand, not by an agent, and not on a second attempt
after the first was refused.

A refusal is the guard doing its job. `git worktree remove` declines when the worktree holds
modifications to tracked files, or untracked files that are not ignored, and what it declines over is
the only copy in existence: no commit holds it, no remote has it, and `--force` deletes it with no
confirmation and nothing to recover it from.

**Read what is there, then clear it.** `git -C <worktree> status --porcelain` names every file holding
the removal up. Commit and push it, or move it outside the worktree. The plain removal then succeeds —
because nothing is left to lose, rather than because the objection was overruled.

**`rm -rf` on the directory is the same forcing under another name.** The files are gone just as
finally, and git is left with an administrative entry `git worktree prune` has to clear.

**The main worktree is never a removal candidate.** It is the first entry of `git worktree list`;
confirm the path you are about to remove is not that one.

`/dev-loop` never passes `--force` when it removes a worktree it made itself. This rule is the same
guarantee for the ones you remove by hand.
