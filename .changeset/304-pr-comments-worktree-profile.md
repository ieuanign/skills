---
"ieuanign-skills": patch
---

pr-comments: its worktree is made runnable — it copies what `.worktreeinclude` lists and runs `docs/agents/worktree.md`'s Setup and Full-suite commands where the repository has them, and works them out from the checkout where it does not. It never asks for, writes, or refuses on either file; a Full-suite `none` reports the suite as not run. `preconditions.mjs`, `check.sh` and setup-ieuanign-skills no longer say `/pr-comments` refuses without the worktree profile — only `/dev-loop auto` does.
