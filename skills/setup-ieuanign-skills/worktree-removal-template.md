Skeleton for `.claude/rules/worktree-removal.md`. No substitutions — the rule names a command, not a
path in this repo. No `paths` frontmatter — this governs an operation, not a file type. It is the
instruction alone, since every session carries it; `worktree-removal-reference.md` is the rule in
full. Everything below the line goes in the file.

---

# Worktree removal

**Before removing a worktree, read `.claude/reference/worktree-removal.md`.** A removal is plain
`git worktree remove` — never `--force`, never `rm -rf` on the directory — and when git refuses, that
file says what to do before a second attempt.
