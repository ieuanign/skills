---
name: dev-loop-cleanup
description: Reaps a finished /dev-loop run's merged branches and plan files, and lists lingering worktrees without removing any. Use for /dev-loop-cleanup, or when asked to tidy up after dev-loop runs.
---

# /dev-loop cleanup — reap merged work

Reap what has an exact **done-signal**; list what does not. Safe to run at any time, including while another batch is mid-layer. Dispatch no agent — this is your own plain Bash from start to finish.

## Derived facts (compute once — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`. Every lane worktree lives here.
- Every `gh` command runs inside a checkout of this repo and gh infers the repository from the remote, so no `gh` command carries `--repo`.

## Steps

1. `git fetch origin <DEFAULT>`.

2. **Reap on the merged signal.** A lane is done when its pull request is merged (`gh pr view <branch> --json state,mergedAt`), or its branch is fully merged into `origin/<DEFAULT>`. **The `gh` arm is the load-bearing one and the git arm is the fallback**: a repository merging by **squash** or **rebase** replays the work under new shas, so the branch's own commits are never ancestors of the default branch, `git branch --merged origin/<DEFAULT>` never lists it, and only the merged-PR check sees the truth. The git arm still earns its place for plain merge commits and for a branch that never had a pull request.

   For each done lane, delete the local branch and the lane's plan file `.scratch/*/plans/<n>-*.md`. Reaping these is why cleanup exists.

3. **Delete with `git branch -d`**, which succeeds whenever the branch is merged into the default branch **or** still matches its upstream — the ordinary case, since every branch that got a pull request was pushed. Squash and rebase both produce the one combination it refuses: rewritten commits whose remote branch was then deleted (GitHub's default on merge), so the ancestry no longer proves the merge and the remote-tracking ref that carried the proof instead is gone.

   **When `-d` refuses AND step 2's merged check passed, re-run it as `git branch -D`** — that check is the proof git can no longer see for itself, and without this fallback cleanup reaps nothing at all in either of the two commonest GitHub configurations.

4. **A branch checked out in a surviving worktree stays**, and git refuses to delete it — correctly, since something still holds it. List it alongside that worktree rather than working around it; the plan file still goes.

5. **List every worktree under `<WORKTREES>`; remove none.** Per worktree, say why it is still here, from what you can observe: uncommitted or untracked work (`git -C <wt> status --porcelain` non-empty — a removal that was refused), nothing on the remote (no upstream, or `git -C <wt> rev-list --count @{u}..HEAD` unreadable — held at a gate, or a session that died mid-run), or pushed with its pull request still open. None of these has an exact done-signal, and none tells a live run's worktree from an abandoned one, so the human decides: give them the `git worktree remove <path>` line to run if they agree, and never run it for them.

6. Report the two apart, so the difference is visible: **reaped** (branch, plan file) and **needs attention** (worktree, why it is lingering, the removal command). An empty second table is the good outcome.

## Hard rules

- **This skill's only worktree output is a list and a command a human may choose to run.** Remove no worktree — not MAIN, not a lane's, not one you are confident about: a worktree still standing is one nothing proved done. **NEVER remove, force-modify, or `rm -rf` MAIN** (first entry of `git worktree list`).
- **`git branch -D` only after the merged check passed.** Everywhere else, `-d`'s refusal is information to report rather than an obstacle to get past.
- **Reap on a merged signal, never a pushed one.** A branch whose pull request is still open keeps its branch and its plan — the plan is what a reviewer or a resume reads.
