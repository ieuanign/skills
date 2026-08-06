---
"ieuanign-skills": minor
---

`/dev-loop-cleanup` becomes its own skill, so reaping merged work no longer loads the pipeline.

Cleanup was a mode of `/dev-loop` reached by a trigger word — material only some runs reach, and
therefore disclosed reference rather than an in-file step. It keeps its behaviour exactly: it reaps on
a **merged** signal and never a pushed one, deleting the local branch and the plan file once the pull
request has merged, and it **lists** lingering worktrees with the reason each is still there while
removing none. A branch whose pull request is still open keeps its branch and its plan, which is what
a reviewer or a resume reads.

In-run worktree removal is unchanged and did not move: `/dev-loop` still removes a sub-lane's worktree
the moment its push and pull request succeed.

`/dev-loop`'s own file no longer carries cleanup mode and points at the new skill instead.
