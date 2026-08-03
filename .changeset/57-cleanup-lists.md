---
"ieuanign-skills": patch
---

`dev-loop`: `cleanup` lists the worktrees it cannot prove are done, instead of deleting them.

Cleanup mode scanned every worktree and removed the ones whose branch was merged. That predicate was never the right one: a branch merges the moment its pull request lands, which says nothing about whether the run holding that checkout has finished with it — so cleanup could delete an active worktree out from under a batch still in flight, and the failure looked exactly like the scan working correctly.

Now that every normal path removes its own worktree the moment its work reaches the remote, the scan is also unnecessary. Cleanup **removes no worktree at all**. It lists every one still standing with what can actually be observed about it — uncommitted or untracked work, meaning a removal that was refused; nothing on the remote, meaning a lane held at a gate or a session that died mid-run; or pushed with its pull request still open — and hands the human the removal command rather than running it for them. None of those states has an exact done-signal, and none of them distinguishes a live run's worktree from an abandoned one.

Merged lanes' local branches and plan files are still reaped: those have an exact signal, and reaping them is why cleanup exists. Branch deletion now states git's real rule rather than assuming one. `git branch -d` succeeds whenever the branch is merged into the default branch **or** still matches its upstream, so a pushed branch reaps cleanly even after a squash merge. It refuses exactly one combination — a squash-merged pull request whose remote branch was then deleted, GitHub's default on merge — where the commits are not ancestors of the default branch and the remote-tracking ref that held the proof is gone. That proof is cleanup's own merged check, which is what licenses `git branch -D` there and nowhere else. A branch a surviving worktree still holds cannot be deleted at all, and is listed alongside it.

The report keeps **reaped** and **needs attention** apart, so the difference between what was cleaned up and what a human has to look at is visible rather than merged into one table. An empty second table is the good outcome.
