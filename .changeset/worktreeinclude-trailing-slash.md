---
"ieuanign-skills": patch
---

`dev-loop`: Act 2's `.worktreeinclude` copy step now says to strip the trailing slash off directory entries before copying.

`git ls-files --directory` collapses a fully-ignored directory to a single entry ending in `/`, and `cp -R dir/ dest/` copies that directory's *contents* rather than the directory itself — so anything provisioned this way landed one level too high, scattered directly into the worktree's `.claude/` instead of `.claude/agents/` and `.claude/skills/`. Silent: the copy reports success and the files exist, just at the wrong path.
