---
name: dev-loop-cleanup
description: Lists every candidate this plugin's skills left behind — worktree, local branch, scratch files — each with a recommendation and its reason, then reaps only the ones a human picks, or with `auto` every one it recommends removing. Use for /dev-loop-cleanup, or when asked to tidy up after dev-loop, mockup or infrastructure runs.
---

# /dev-loop cleanup — propose, then reap

Gather every candidate, recommend a disposal for each, stop for an answer unless the run is `auto`, reap the picks. Safe to run at any time, including while another batch is mid-layer. Dispatch no agent — this is your own plain Bash from start to finish.

## Arguments

`/dev-loop-cleanup [auto] [<issue>]` — an issue number scopes the run to that lane, and `pr-<n>` scopes it to that pull request's worktree instead, as `infrastructure-<mode>` scopes it to that key; no argument lists every candidate. **The command line is the whole of the scope**: a lane discussed earlier in this session is a candidate only when step 2's sources hold it.

**`auto` present ⇒ unattended; absent ⇒ gated.** Read it off the arguments ONCE, before anything else, and carry that single value through the run — no later step re-derives it, and it changes nothing about the scope.

**`unattended` assumes a permission mode that approves tool calls on its own, and asks nothing at all on that path.** It removes step 5's question, never a check: every candidate is still gathered, recommended and printed.

## Derived facts (compute once per run)

- **MAIN** — the main worktree: first entry of `git worktree list`.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`. Every lane worktree lives here.
- Every `gh` command runs inside a checkout of this repo, so gh reads the repository off the checkout's remote.

## Steps

1. `git fetch origin <DEFAULT>`.

2. **Gather candidates from these observable sources**, unioned by lane number `<n>` — the leading digits of a worktree slug or of a branch's tail, since a sub-lane suffixes its area onto the number (`feat/208-backend` → slug `208-backend`, lane `208`): worktree directories under `<WORKTREES>` whose slug is `<n>`, starts `<n>-`, or is `pr-<n>`, local branches whose segment after the first `/` is `<n>` or starts `<n>-`, `.scratch/**/<n>-*.md` in any folder, and the lane's cost log `<MAIN>/.scratch/dev-loop-cost/<n>.txt`, which joins the lane's **Scratch** cell. `mockup`'s branches `mockup/<N>-<slug>` and `design-fix/<N>-<slug>` fall under the branch rule as they stand, `<N>` being a PRD's issue number. A `pr-<n>` slug is a `/pr-comments` worktree, keyed by pull request rather than lane — the full slug is its key, which is what separates it from lane `<n>` — and it contributes its **worktree alone**: the branch it holds is that pull request's own head branch, never a candidate. An argument keeps its own key alone, lane number or `pr-<n>`. **A lane whose worktree is already gone is the ordinary case** — its Worktree cell reads absent, a state to report rather than a condition that failed.

   One candidate is keyed to the repo rather than a lane: the staged phase-script directory `<MAIN>/.scratch/dev-loop-scripts/`, under the fixed key `staged-scripts`. It is gathered only when no argument scopes the run, and it contributes its key in the **Lane** cell and the directory path in **Scratch** — its PR, Worktree and Branch cells are absent.

   `mockup`'s draft folder `<MAIN>/.scratch/mockups/<N>-<slug>/` is a row of its own, keyed `<N>`: the folder in **Scratch**, and PR, Worktree and Branch absent, because step 3 decides it by another rule than a branch's.

   `infrastructure`'s leftovers are keyed `infrastructure-<mode>`: the worktree `git worktree list` reports at exactly `<MAIN>-infrastructure-<mode>` — MAIN's own path plus that suffix, a sibling of the checkout and never under `<WORKTREES>` — and the local branches `infrastructure/<mode>` and `infrastructure/<mode>-<k>`. The branch that worktree holds is its row's Branch; a detached one is a row with Branch absent. Like `staged-scripts`, this key is gathered by a run with no scoping argument, or by an argument naming it.

3. **Recommend per branch.** A lane's sub-lanes have a worktree, branch and pull request each, so each contributes its own row. `remove` needs both halves: `gh pr view <branch> --json number,state,mergedAt,headRefOid` reports merged, **and** `git -C <wt> status --porcelain` is empty. An absent worktree has nothing to be dirty, so the merged half decides that row alone. Everything else is `keep`, with **Why** naming the half that failed — the pull request is not merged, or the worktree holds work. A `pr-<n>` row runs its merged half by number — `gh pr view <n> --json number,state,mergedAt,headRefOid` — and its Branch cell names the head branch it holds for information, never as a candidate. The `staged-scripts` row is `remove` unconditionally, with no halves to check: every `/dev-loop` re-stages with `cp -f` immediately before use, so a leftover is never read and removing it mid-run is safe.

   **A closed pull request that never merged** — `state` `CLOSED`, no `mergedAt` — passes the first half only when `headRefOid` equals the local tip, `git rev-parse <branch>`; the clean half still applies. Any other tip is `keep`, with **Why** naming the unpushed tip. A `pr-<n>` row compares its worktree's `HEAD` instead.

   **A draft-folder row has one half**: `gh issue view <N> --json state` reports `CLOSED` ⇒ `remove`, anything else ⇒ `keep`. No pull request decides it.

   **A lane with no branch and no worktree left** — only its scratch files or its cost log, as a lane dropped at intake leaves — is one row decided the same way, by `gh issue view <n> --json state`.

   **A state that cannot be read is `keep`**: a branch with no pull request, a detached `infrastructure` worktree, which has none to ask about, or a `gh` call that failed, with **Why** saying which.

4. **Print one table**, in both modes, with these columns:

   `Lane | PR | Worktree | Branch | Scratch | Recommend | Why`

   It is a proposal: nothing has happened when it prints, and nothing below runs until step 5 has an answer. Lane and Scratch repeat down a lane's rows — the number and its scratch files belong to the lane — and every other cell is that row's branch's own.

5. **Ask, then wait.** Ask in plain text for what to reap — lane numbers, one row's branch where a lane's rows differ, `all`, or `none` — since the table has a row per branch and AskUserQuestion's four options cannot hold an arbitrary number of them. **The answer is what authorises a deletion**; the argument only decided what to look at. A picked lane number takes every row it shows, and a `pr-<n>`, `staged-scripts` or `infrastructure-<mode>` row is picked by that full key; `none`, silence and an answer you cannot read all end the run on the proposal.

   **Under `unattended` there is no question.** The picked set is exactly the `remove` rows — never a `keep`, never a row the table does not show — and step 4's table is the report of what is kept and why. Steps 6 and 7 follow as they would on that answer.

6. **Reap each picked row in one order — worktree, then branch, then scratch files** — because a branch checked out in a worktree is held by that checkout for as long as it stands.

   - **Worktree** — `git worktree remove <path>`, the path as `git worktree list` reports it rather than one rebuilt from the lane number, and only once it is confirmed to be under `<WORKTREES>`, or at exactly `<MAIN>-infrastructure-<mode>`, and not MAIN. A refusal is the guard working: report that worktree's `git -C <wt> status --porcelain` verbatim, keep it, and carry on to the next row.
   - **Branch** — `git branch -d <branch>`, escalating to `git branch -D` where step 3's merged check passed, since squash and rebase replay the work under new shas and ancestry can no longer prove the merge, or where its closed-pull-request check matched the tip, since ancestry cannot show those commits are on the pull request. Any other refusal — a `mockup` branch MAIN is still on — is reported verbatim and the branch kept: this skill never switches MAIN.
   - **Scratch** — every `.scratch/**/<n>-*.md` keyed to that number, whichever folder holds it, and its cost log, each by the path step 2 gathered, once no row of that lane is left standing: the files are the lane's, and a sub-lane still in flight reads its plan from them. Scratch is working material, so a plan, a comment table or a note all go the same way. The `staged-scripts` row reaps exactly `<MAIN>/.scratch/dev-loop-scripts/`, that directory by its path and never a glob. A draft-folder row reaps exactly the `<MAIN>/.scratch/mockups/<N>-<slug>/` step 2 gathered, by that path and never a glob, whatever other rows share its number.

7. **Confirm in one line per reaped row**: what went, in the order it went. Step 4's table already carries every kept row's reason, which makes the confirmation a line rather than a second table.

## Hard rules

Four prohibitions; everything above is a target to hit. `/dev-loop` and `/pr-comments` state these same worktree guardrails, deliberately — every skill that removes a worktree carries its own copy, because none of the three loads the others.

- **Worktree removal never passes --force.** The refusal on a dirty worktree IS the guard, and step 6 reports it rather than getting past it.
- **MAIN is never a removal candidate** (first entry of `git worktree list`). Only paths under `<WORKTREES>` are, beside the one sibling at exactly `<MAIN>-infrastructure-<mode>`, each as `git worktree list` reports it, and `git worktree remove` is the only command here that removes one.
- **`git branch -D` only where step 3's merged check passed or its closed-pull-request check matched the local tip, and only against a local ref.** The remote branch belongs to the pull request and is no target of this skill.
- **`auto` reaps exactly the `remove` rows.** A refused removal is reported with the refusal's own output and the row kept, since no person is there to catch an overreach.
