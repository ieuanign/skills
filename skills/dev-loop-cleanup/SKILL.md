---
name: dev-loop-cleanup
description: Lists every candidate a /dev-loop run left behind — worktree, local branch, scratch files — each with a recommendation and its reason, then reaps only the ones a human picks. Use for /dev-loop-cleanup, or when asked to tidy up after dev-loop runs.
---

# /dev-loop cleanup — propose, then reap

Gather every candidate, recommend a disposal for each, stop for an answer, reap the picks. Safe to run at any time, including while another batch is mid-layer. Dispatch no agent — this is your own plain Bash from start to finish.

## Arguments

`/dev-loop-cleanup [<issue>]` — an issue number scopes the run to that lane; no argument lists every candidate. **The command line is the whole of the scope**: a lane discussed earlier in this session is a candidate only when step 2's sources hold it.

## Derived facts (compute once per run)

- **MAIN** — the main worktree: first entry of `git worktree list`.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`. Every lane worktree lives here.
- Every `gh` command runs inside a checkout of this repo, so gh reads the repository off the checkout's remote.

## Steps

1. `git fetch origin <DEFAULT>`.

2. **Gather candidates from three observable sources**, unioned by lane number `<n>` — the leading digits of a worktree slug or of a branch's tail, since a sub-lane suffixes its area onto the number (`feat/208-backend` → slug `208-backend`, lane `208`): worktree directories under `<WORKTREES>` whose slug is `<n>` or starts `<n>-`, local branches whose segment after the first `/` does the same, and `.scratch/**/<n>-*.md` in any folder. A `/pr-comments` worktree is keyed by pull request rather than lane — slug `pr-<n>` — and contributes its **worktree alone**: the branch it holds is that pull request's own head branch, never a candidate. An argument keeps that number alone. **A lane whose worktree is already gone is the ordinary case** — its Worktree cell reads absent, a state to report rather than a condition that failed.

3. **Recommend per branch.** A lane's sub-lanes have a worktree, branch and pull request each, so each contributes its own row. `remove` needs both halves: `gh pr view <branch> --json number,state,mergedAt` reports merged, **and** `git -C <wt> status --porcelain` is empty. An absent worktree has nothing to be dirty, so the merged half decides that row alone. Everything else is `keep`, with **Why** naming the half that failed — the pull request is not merged, or the worktree holds work.

4. **Print one table**, in both modes, with these columns:

   `Lane | PR | Worktree | Branch | Scratch | Recommend | Why`

   It is a proposal: nothing has happened when it prints, and nothing below runs until step 5 has an answer. Lane and Scratch repeat down a lane's rows — the number and its scratch files belong to the lane — and every other cell is that row's branch's own.

5. **Ask, then wait.** Ask in plain text for what to reap — lane numbers, one row's branch where a lane's rows differ, `all`, or `none` — since the table has a row per branch and AskUserQuestion's four options cannot hold an arbitrary number of them. **The answer is what authorises a deletion**; the argument only decided what to look at. A picked lane number takes every row it shows; `none`, silence and an answer you cannot read all end the run on the proposal.

6. **Reap each picked row in one order — worktree, then branch, then scratch files** — because a branch checked out in a worktree is held by that checkout for as long as it stands.

   - **Worktree** — `git worktree remove <path>`, the path as `git worktree list` reports it rather than one rebuilt from the lane number, and only once it is confirmed to be under `<WORKTREES>` and not MAIN. A refusal is the guard working: report that worktree's `git -C <wt> status --porcelain` verbatim, keep it, and carry on to the next row.
   - **Branch** — `git branch -d <branch>`, escalating to `git branch -D` where step 3's merged check passed, since squash and rebase replay the work under new shas and ancestry can no longer prove the merge.
   - **Scratch** — every `.scratch/**/<n>-*.md` keyed to that number, whichever folder holds it, once no row of that lane is left standing: the files are the lane's, and a sub-lane still in flight reads its plan from them. Scratch is working material, so a plan, a comment table or a note all go the same way.

7. **Confirm in one line per reaped row**: what went, in the order it went. Step 4's table already carries every kept row's reason, which makes the confirmation a line rather than a second table.

## Hard rules

Three prohibitions; everything above is a target to hit. `/dev-loop` and `/pr-comments` state these same worktree guardrails, deliberately — every skill that removes a worktree carries its own copy, because none of the three loads the others.

- **Worktree removal never passes --force.** The refusal on a dirty worktree IS the guard, and step 6 reports it rather than getting past it.
- **MAIN is never a removal candidate** (first entry of `git worktree list`). Only paths under `<WORKTREES>` are, and `git worktree remove` is the only command here that removes one.
- **`git branch -D` only where step 3's merged check passed, and only against a local ref.** The remote branch belongs to the pull request and is no target of this skill.
