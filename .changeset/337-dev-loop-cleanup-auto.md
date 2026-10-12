---
"ieuanign-skills": minor
---

dev-loop-cleanup: `/dev-loop-cleanup auto` reaps every row the table recommends removing and asks nothing, so an unattended run can be followed by an unattended tidy-up; a run without `auto` is unchanged. The table now also lists what the plugin's other skills leave: a lane's cost log, `mockup`'s two branches and its draft folder — `remove` once the PRD's issue is closed — and `infrastructure`'s sibling worktree and its branches. A pull request closed without merging counts as `remove` when its head is the local tip, so nothing unpushed is lost. Reaping the infrastructure worktree by a glob over sibling paths was rejected: the one exact path `git worktree list` reports is the only shape admitted outside the worktrees folder.
