---
"ieuanign-skills": minor
---

dev-loop: an unattended run settles what it can before it drafts. A `partial` criterion now carries the reviewer's `check` — one command whose exit status settles it — and the lane runs it after review: exit 0 is `met`, anything else `not-met`, and only a criterion a person must settle stays `partial`. Where a repository opts in with the new `docs/agents/dev-loop.md` key **CI wait** — `wait`, against the default `none`, which waits for nothing — Gate 2 then waits for the GitHub Actions runs its push started: a red run the change caused goes through a debugger and writer fix cycle of at most 3 rounds, pushed forward and never forced; one it did not cause ends the sub-lane. Under `unattended` the pull request flips between draft and ready where CI changed the answer, and the worktree, closing message and label all follow CI. The pull request body gains a **CI** section beneath **Suite**.
