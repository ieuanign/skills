---
"ieuanign-skills": minor
---

dev-loop: worktrees now live in `<MAIN>/.scratch/worktrees/`, and provisioning copy rules move from the repo profile into a root `.worktreeinclude` file (gitignore syntax — the same file Claude Code's native worktrees read). Act 0 creates it ask-then-persist, guards `.scratch/` in `.gitignore`, and keeps `!.scratch/**` as its last line so no copy mechanism — dev-loop's or Claude Code's native worktrees — clones `.scratch` contents into new worktrees; Act 2 fast-copies every match, retiring the node_modules special case and the disk warning. Migration is manual and one-time: finish or `git worktree remove` any trees under the old path, and fold any profile "Provisioning copy rules" into `.worktreeinclude`.
