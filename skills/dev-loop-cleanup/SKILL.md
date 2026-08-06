---
name: dev-loop-cleanup
description: Reaps what a finished /dev-loop run left behind — deletes the local branch and the plan file for every lane whose pull request merged, and lists every lingering worktree with the reason it is still there without removing any. Use when the user invokes /dev-loop-cleanup, or asks to tidy up after dev-loop runs.
---

# /dev-loop cleanup — reap merged work

Cleanup reaps what has an exact done-signal and **lists** what does not. It is safe to run at any time, including while another batch is mid-layer, and that is the property to preserve.

This is a separate invocation from the pipeline on purpose: reaping merged work should not require loading the orchestrator. Nothing here plans, implements, reviews, or dispatches an agent — it is your own plain Bash from start to finish.

**It removes no worktree.** Every normal path removes its own the moment its work reaches the remote, so a worktree still standing is one nothing proved done. The old scan proved it with "the branch is merged", which is not the same claim: a branch merges the moment its pull request lands, which says nothing about whether the run holding that checkout has finished with it — so the scan could delete an active worktree out from under a run still in flight, and would look like it was working correctly while doing it.

**In-run worktree removal is not this skill's.** A sub-lane's worktree is removed by the pipeline itself, at its push/PR gate, the moment its push and pull request succeed. Nothing here changes that and nothing here waits for it.

## Derived facts (compute once — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`. Every lane worktree lives here.
- **GitHub repo** — never pass `--repo`: every `gh` command runs inside a checkout of this repo, and gh infers the repository from the remote.

## Steps

1. `git fetch origin <DEFAULT>`.

2. **Reap, by the exact signal.** A lane is done when its PR is merged (`gh pr view <branch> --json state,mergedAt`) or its branch is fully merged into `origin/<DEFAULT>`. **The `gh` arm is the load-bearing one, and the git arm is the fallback** — not the other way round. A repository that merges by **squash** or by **rebase** replays the work under new shas, so the branch's own commits are never ancestors of the default branch and `git branch --merged origin/<DEFAULT>` never lists it; the git arm silently never fires there, and only the merged-PR check sees the truth. Keep it anyway for plain merge commits and for a branch that never had a PR. For each done lane: delete the local branch, and delete the lane's plan file `.scratch/*/plans/<n>-*.md` (plans are temporary artifacts). Reaping these is why cleanup exists.

   Delete with `git branch -d`, which succeeds whenever the branch is merged into the default branch **or** still matches its upstream — the ordinary case, since every branch that got a PR was pushed. It refuses one combination, and **squash and rebase both produce it**: a merge that rewrote the commits, whose remote branch was then deleted (GitHub's default on merge). The rewrite means the commits are not ancestors of the default branch, and the deletion takes away the remote-tracking ref that was carrying the proof instead. Only when `-d` refuses AND the merged check above passed, re-run it as `git branch -D`: that check is the proof git can no longer see for itself, and without this fallback cleanup would reap nothing at all in either of the two commonest GitHub configurations. Never reach for `-D` in any other situation — not on a branch the merged check did not pass, and not to get past any other refusal.

3. **A branch checked out in a surviving worktree cannot be deleted**, and git refuses — correctly, since something still holds it. List it alongside that worktree instead of working around it; the plan file still goes.

4. **List every worktree under `<WORKTREES>`; remove none.** Per worktree, say why it is still here, from what you can observe: uncommitted or untracked work (`git -C <wt> status --porcelain` non-empty — a removal that was refused), nothing on the remote (no upstream, or `git -C <wt> rev-list --count @{u}..HEAD` unreadable — held at a gate, or a session that died mid-run), or pushed with its PR still open. None of these has an exact done-signal and none distinguishes a live run's worktree from an abandoned one, so the human decides — give them the `git worktree remove <path>` line to run if they agree, and never run it for them.

5. NEVER touch MAIN (the first entry of `git worktree list`) — it is not a candidate under any condition, and only worktrees under `<WORKTREES>` are listed at all.

6. Report the two apart, so the difference is visible: **reaped** (branch, plan file) and **needs attention** (worktree, why it is lingering, the removal command). An empty second table is the good outcome.

## Hard rules

- **Remove no worktree, ever.** Not the main one, not a lane's, not one you are confident about. This skill's only worktree output is a list and the command a human may choose to run.
- **NEVER remove, force-modify, or `rm -rf` the main worktree** (first entry of `git worktree list`).
- **`git branch -D` only after the merged check passed.** Everywhere else, `-d`'s refusal is information to report, not an obstacle to get past.
- **Reap on a merged signal, never a pushed one.** A branch whose pull request is still open keeps its branch and its plan — the plan is what a reviewer or a resume reads.
- This skill is repo- and machine-agnostic: it hardcodes no repository name, path, or project fact.
