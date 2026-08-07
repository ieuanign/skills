---
name: pr-comments
description: Reads a pull request's unresolved comments and classifies each fix or skip for a human's approval, then drives the approved fix through /dev-loop's execute phase and pushes it to that pull request's own branch. Use for `/pr-comments <pull request>`.
---

# /pr-comments — a pull request's comments, through to a pushed fix

You are the orchestrator and you stay in the MAIN worktree. This skill reads one pull request's unresolved comments, classifies each **fix** or **skip**, and shows a human the table; the approved fix then runs through `/dev-loop`'s execute phase — writer, review loop and suite gate, unchanged — in a worktree attached to the pull request's own head branch.

**Gated, and append-only against artifacts someone else owns.** There is no unattended mode and no token that asks for one. The whole run makes two writes — one `git push` to the branch the pull request already has, and one `gh pr comment` on it — and neither of them happens before the gate below.

## Arguments

`/pr-comments <pull request>`

- `<pull request>` — one pull request, as a number or a URL. One run reads one pull request; there is no batch.
- A URL contributes its **number** only. Every command here resolves the repository from this checkout's remote, so a URL pointing at a different repository is refused rather than quietly reinterpreted as this one's pull request of the same number.

## Derived facts (compute once — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`, where this run's worktree goes.
- **NAMESPACE** — the agent namespace, read off your own roster: find `code-writer` among your available agent types — listed bare, it is the empty string; listed as `<prefix>:code-writer`, it is `<prefix>`. This is the ONLY place it is derived, and it comes from the roster rather than from a path, a package name or a manifest.
- **DEV-LOOP** — the sibling skill folder, `<this-skill-dir>/../dev-loop`. Both install paths put skill folders side by side, so the sibling relation holds on either and no absolute path is written down.
- Every `gh` command runs inside a checkout of this repo and gh infers the repository from the remote, so no `gh` command carries `--repo`.

## Step 1 — preconditions, before anything is read or shown

Each one below makes this run's promise — one fix, pushed to this pull request's own branch — impossible to keep. Refuse on it **here**, because discovering it after a human has read a table wastes the reading as well as the read.

1. **The Workflow tool.** The execute phase is dispatched through it, so a session without it in your toolset stops the run. Name the setting — `"enableWorkflows": true` in the per-machine settings file (`~/.claude/settings.json`) — and say a **restart is required**. Ask nothing and write nothing: `/dev-loop` owns that question and asks it once per machine, and a second asker is a second question.
2. **The sibling `dev-loop` skill folder.** `<DEV-LOOP>/phase-execute.js` missing ⇒ stop, saying the two install together. That script runs the fix, and nothing here reimplements it.
3. **The pull request is open.** `gh pr view <n> --json number,title,url,state,isCrossRepository,headRefName,baseRefName` — one read, which every later step uses. Any state but `OPEN` ⇒ stop: the branch of a merged or closed pull request may already be deleted, and pushing to one is not a fix anybody asked for.
4. **Not a fork.** `isCrossRepository: true` ⇒ stop, saying so. The head branch lives on another remote, so the push this skill promises cannot be made from this checkout at all.
5. **The head branch is not `<DEFAULT>`.** The one push lands on `headRefName`, and a pull request opened from the default branch would take it to the trunk.

## Step 2 — read the unresolved comments

`node <this-skill-dir>/read-comments.mjs <n>` — the bundled read, and the only one. It prints one JSON document, `{ pullRequest, comments: [...] }`, whose entries carry the same keys whatever each started as: `origin` (`review-thread`, `review-body` or `issue-comment`), `author`, `body`, `url`, `createdAt`, `path`, `line`, `originalLine`, `outdated`, `threadId`, `reviewState`.

- **A non-zero exit is a failed read, never an empty pull request.** It prints no JSON when it fails, so report its message and stop — that is what lets an empty `comments` array mean only what it says.
- **What it excludes is its own business**: a resolved thread, a minimised comment, an unsubmitted or bodyless review. Never re-derive any of that, and issue no `gh` call of your own for comments — a second reader is a second answer.
- **An empty list ends the run.** Say the pull request has no unresolved comments, show no table, ask nothing.

## Step 3 — classify, and show the table

Classification is **your own plain reading of each body**, and dispatches no agent — the same shape `/dev-loop`'s Gate 1 classifies touchpoint overlap in.

| Intent | What it is |
|---|---|
| **fix** | the comment asks for a change to the code on this pull request, and says enough for someone to make it |
| **skip** | it asks for no such change, and one reason below fits it — carrying that reason's evidence |
| **unclassified** | no reason below fits, or the evidence its reason takes cannot be produced |

**A skip's reason is picked from this table, never written.** Four, and no fifth is invented at run time; free text never stands where a reason goes. A comment none of them fits is the signal the vocabulary needs widening, which is a deliberate change and never a run's decision.

| Reason | What it covers | The evidence it takes |
|---|---|---|
| `question` | it asks something rather than asking for a change | the fragment of the body that makes it a question, **verbatim** — never a paraphrase |
| `already addressed` | the code on this pull request already does what it asks | the short sha and subject of a commit **this pull request holds**, and what in it addressed the comment |
| `out of scope for this branch` | the change is wanted, somewhere other than this pull request | what that separate piece of work is, so the comment reads as deferred rather than dropped |
| `disagreed with` | the change was asked for, understood, and is not being made | the reasoning, in full |

**Evidence that restates the reason is no evidence.** A skip whose evidence you cannot produce is `unclassified` instead.

`already addressed` is the one whose evidence is not in the comment set: `gh pr view <n> --json commits`, then name a commit that read actually returned — its `oid` short, and its `messageHeadline`. This is a read of the pull request, not a second read of its comments; Step 2's module stays the only source of those. A sha from anywhere else is one nobody can check.

**An `unclassified` row is stated, not buried.** For each, say plainly that the vocabulary did not cover it and what it appeared to ask. Nothing acts on one: it is not a fix, and Step 4 counts fix rows.

**Every unresolved comment gets a row, whichever way it went.** A table showing only the work is one nobody can check, and the skips are the half a human is likeliest to disagree with.

**Classify what the comment says, not what its metadata suggests.** An outdated comment — `line: null`, `outdated: true`, its stale anchor left in `originalLine` — is one whose code moved, which says nothing about whether anyone did what it asked. `outdated: true` is therefore never the evidence for `already addressed`; a commit is.

One row per entry, in the order the read returned them:

| Comment | Author | Intent | Why |
|---|---|---|---|
| `<path>:<line>` where the entry has both, `<path>` marked *stale anchor* where `line` is null, and the origin in words where there is no path at all — each linked to the entry's `url` — then the opening of the body | the entry's `author`, or `unknown` where it is null | **fix**, **skip** or **unclassified** | one clause saying what makes it that |

The cell is for reading: the body's opening is truncated to fit and any `|` in it escaped, while the body itself travels on verbatim.

## Step 4 — the gate

**Nothing above this line wrote anything** — every command so far was a read — and nothing below it runs without an explicit answer.

Present the table, then count its **fix** rows:

- **None** ⇒ there is nothing to do. Say so and stop, having shown the table: it is the answer.
- **More than one** ⇒ show the table and stop, saying that grouping several fixes into commits is not built yet and that one at a time is what this skill can do. Never pick one.
- **Exactly one** ⇒ ask.

AskUserQuestion, once: approve this table, or stop. Say what approving does, so the answer is an informed one — a worktree attached to `headRefName`, one commit for the one fix, one push to that same branch, and one comment carrying the findings back. A human may correct any row's intent first; the corrected table is the one that counts, and the count above is taken again from it. Anything short of approval ends the run with nothing written.

## Step 5 — the approved row becomes the plan

`phase-execute.js` hands the writer a `planPath` and the writer reads it before anything else — a path that does not exist comes straight back as BLOCKED. So the approved row is written as a file, at `<MAIN>/.scratch/pr-comments/<n>-comments.md`, creating the directory. **Not under a `plans/` subdirectory**: `/dev-loop-cleanup` reaps `.scratch/*/plans/<n>-*.md` by number, and an issue sharing a number with this pull request would take a live table with it.

Plan-shaped, and carrying the comment's own content:

```markdown
# <n> — <pull request title>

## Issue summary
<the pull request's url, and that this is a review comment on it rather than an issue>

## The comment
<author> — <path>:<line>, or the stale anchor `<path>:<originalLine>`, or the origin in words where
there is no path — and the entry's url.

<the body, VERBATIM: not summarised, not re-wrapped, not corrected>

## Approach
<what the fix must achieve, as an outcome rather than a diff>

Only this comment. Every unresolved comment was classified and shown; the rest were not approved and
are not this commit's scope.

## Hard constraints
None. A review comment supplies none, and constraints invented here would bind the writer to
something nobody asked for.

## File touchpoints
<the comment's path where it has one; otherwise say plainly that it names no file>

## Test expectations
<the profile's Full-suite command>, from the worktree.

## Commit / PR breakdown
1. `<message>` — <one line saying what the commit does>
```

`<message>` is a conventional-commit message — `<type>(<scope>): #<n> - <what changes>`, its type and scope taken from what the fix actually is — and the **same string, verbatim,** is what Step 7 passes as `commits[0].message`. `#<n>` is the pull request: GitHub numbers pull requests and issues in one sequence.

The file is gitignored working material and nothing may depend on it surviving: delete it once the ledger comment carrying its content has posted, and on a run that ends before that keep it and say where it is.

## Step 6 — a worktree on the pull request's own branch

**Nothing here creates a branch.** `headRefName` from Step 1's read is the branch the worktree checks out and the only branch this run will ever push to.

1. `git fetch origin <headRefName>` — the worktree starts at the remote's tip, which is what makes the later push a fast-forward instead of a race.
2. Attach at `<WORKTREES>/pr-<n>` — a directory name, and the only name this run invents:
   - branch already exists locally ⇒ `git worktree add <WORKTREES>/pr-<n> <headRefName>`, with no `-b`, which errors on an existing branch;
   - it does not ⇒ `git worktree add <WORKTREES>/pr-<n> -b <headRefName> --track origin/<headRefName>`. That is the only `-b` there is here: a local ref for that same remote branch, under that same name.
   - A branch already checked out in another worktree makes `git worktree add` refuse — report its message verbatim and stop.
3. The checkout must sit at `origin/<headRefName>` — **checked, not assumed**. Where a stale local branch left it behind, `git -C <worktree> merge --ff-only origin/<headRefName>` catches it up; a refusal means the local branch diverged, so no push from it could be a fast-forward — report git's message verbatim, leave the worktree in place, and stop.

   Then `git -C <worktree> rev-parse HEAD` and `git -C <worktree> rev-parse origin/<headRefName>`, and **stop unless the two shas are equal**. The merge alone does not settle it: to a local branch *ahead* of the remote it says `Already up to date` and exits 0, and those unpushed commits — someone's work in progress, which the first bullet of step 2 attaches whatever state it is in — would be captured as the `base` below and then ride out on Step 8's push, landing on the pull request unreviewed and absent from Step 10's ledger. Report both shas and how they differ, keep the worktree, and stop.
4. `git -C <worktree> rev-parse HEAD`. **That sha is the sub-lane's `base`**, captured now, before anything is written to the branch. The reviewer diffs `base..<branch>`; the pull request's own base branch in its place would have it review the human's entire pull request, flooding findings and spending fix cycles on code this run did not write.
5. `.worktreeinclude` copies, the same mechanism `/dev-loop` provisions with: `git -C <MAIN> ls-files -oi --exclude-from=.worktreeinclude --directory` lists the matches — files, plus fully-ignored directories collapsed to one entry — and each is fast-copied from MAIN into the worktree at the same relative path, parent directories created, the trailing slash git puts on a directory entry stripped first. No `.worktreeinclude` ⇒ no copies and no question asked: `/dev-loop`'s Act 0 owns that one.
6. Run the profile's Setup command from inside the worktree.

**Three profile keys, all read from `docs/agents/dev-loop.md`**: Setup command, Full-suite command and Fix cycles. For one the file lacks, follow its own ask-then-persist rule — ask once, write the answer in, never ask again. This skill adds no key of its own, no second profile and no argument that changes what the pipeline does.

## Step 7 — dispatch the execute phase

Run the Workflow tool with `scriptPath: <DEV-LOOP>/phase-execute.js`, and these arguments and no others:

```json
{
  "lanes": [{
    "issue": <n>,
    "planPath": "<MAIN>/.scratch/pr-comments/<n>-comments.md",
    "subLanes": [{
      "branch": "<headRefName>",
      "worktree": "<WORKTREES>/pr-<n>",
      "base": "<the sha from Step 6>",
      "commits": [{ "ordinal": 1, "message": "<Step 5's message, verbatim>" }]
    }]
  }],
  "mode": "gated",
  "fixCycleThreshold": <the profile's Fix cycles>,
  "suiteCommand": "<the profile's Full-suite command>",
  "agentNamespace": "<NAMESPACE>"
}
```

`planPath` and `worktree` are **absolute** — `.scratch` and the worktrees directory both live under MAIN. `mode` is the literal `gated`, this skill having no other mode to parse. `fixCycleThreshold` and `suiteCommand` are the profile's values passed verbatim, never literals written here — and `fixCycleThreshold` is a **number**: the script tests it with `Number.isInteger` and a quoted one silently becomes the default instead.

Four keys are left out, each deliberately:

- **`issueBody`** and **`ownedCriteria`** — there is no issue, so there is no spec axis. The script already tells the reviewer to return an empty `criterionVerdicts` and say so in its notes; that is the existing contract's degenerate case, reached by passing less rather than by editing anything.
- **`skillDir`** — it exists for the notifier, which the script dispatches under `unattended` only.
- **`runHandle`** — the notifier is the only thing that writes it, and none is dispatched.

**Change nothing under `<DEV-LOOP>`.** The execute phase runs as it is — writer, review loop, suite gate — and this skill adds no phase script of its own.

The call returns one entry for the lane, whose single `subResults` entry carries the `ending` (`null` where the sub-lane finished clean), the commits made, the fixed and won't-fix findings, the reviewer's notes and the suite result. Everything that happens after this is decided from that record.

## Step 8 — the push

`ending` decides this step before anything else is read: non-null ⇒ **Step 9**, which pushes nothing. The clean path:

1. `git -C <worktree> rev-list --count <the sha from Step 6>..<headRefName>`. **Ask git, never the reported commit list** — the count is what settles the push.
2. **Zero** ⇒ nothing landed on the branch. Push nothing and take Step 9's disposal, saying the phase reported no ending and made no commit.
3. Otherwise `git -C <worktree> push origin <headRefName>` — **never `--force`, never `--force-with-lease`**. This is the run's one push, and the only write to a git remote it will ever make.

The push is a fast-forward by construction: Step 6 started the worktree at `origin/<headRefName>` and stopped where it could not. **A rejection therefore means the branch moved while the fix was being written** — someone else pushed to the pull request. Report git's message verbatim, keep the worktree, and go to Step 10 saying nothing was pushed. Never retry harder, and never reach for a flag that would make it land anyway.

## Step 9 — an ending pushes nothing

An `ending` is **HALT** (something deliberately stopped) or **FAILED** (something broke), and both are disposed of the same way here: the branch is not touched.

`/dev-loop` pushes an ended sub-lane because the branch is its own. This one is a human's pull request, and a half-applied fix or a `wip:` commit landing on it is precisely the state change on someone else's artifact this skill refuses — whoever wrote the comment would find commits nobody approved sitting under it.

Report the label, the stage it ended at, the reason verbatim, the debugger's diagnosis where there is one, and the `attempts` log in order. Then Step 10's comment, and Step 11 keeps the worktree: the work is in it, and it is the only copy there is.

## Step 10 — the ledger, commented back

**One comment, on every path that reached Step 7's dispatch, and one only** — including the paths that pushed nothing, because a run that touched a pull request and said so nowhere on it is one nobody can audit.

```bash
gh pr comment <n> --body-file - <<'BODY'
...
BODY
```

**The heredoc is quoted and the body arrives on stdin.** Comment bodies, reviewer notes and findings are agent-facing prose full of backticks, dollar signs and quotes; interpolated into a shell string they are executed, and the one place this run quotes a human's words back at them is the last place to allow that. Everything it carries travels verbatim.

What it says, from the sub-lane record and nothing else:

| Section | What it holds |
|---|---|
| what reached the branch | the pushed commit's sha and subject — or plainly that nothing was pushed, and why |
| the comment it answers | the entry's author and `url`. `gh pr comment` posts at the pull request rather than in the thread, so the link is what tells a reader which comment this is about |
| fixed | `fixedFindings` — reviewer findings the writer applied |
| won't-fix | `wontFix`, each with the writer's reason |
| notes | `reviewNotes` verbatim, and `reviewTrajectory` where a bound ended the review loop |
| suite | `suite.state`: `passed`, `failed` with its failing identifiers, or `not run` with why. A suite that did not run never reads as green |
| attempt log | `attempts` in order, on a run that ended — what was tried after the first thing went wrong |

**No acceptance-criteria section**: there was no issue and so no spec axis, `criterionVerdicts` comes back empty by the contract Step 7 invoked, and a section rendering nothing claims something was judged. `terminal` goes unread too — it decides a pull request's draft state, and this run opens none.

**Nothing else on the pull request changes.** The thread stays unresolved: whether a fix answers a comment is its author's call, and a run that resolved its own work marks its own homework. No draft or ready conversion, no label, no edit to the pull request's body, the issue behind it, or anyone's comment.

Then the table file. It restates a comment the pull request already holds, and this ledger says what became of it, so nothing in it goes unread when it goes: **delete `<MAIN>/.scratch/pr-comments/<n>-comments.md` once the comment has posted**, and on any path that never got there keep it and say where it is.

## Step 11 — the worktree, removed last

| How the run got here | The branch | The worktree |
|---|---|---|
| clean, commits pushed | fast-forwarded | removed |
| clean, nothing to push | untouched | kept |
| ended HALT or FAILED | untouched | **kept** |
| push rejected | untouched | kept, reported |
| removal refused | fast-forwarded | kept, reported |

Removal is `git -C <MAIN> worktree remove <WORKTREES>/pr-<n>`, **never `--force`**, and only once the push has succeeded — after it the remote branch is the only copy of the fix, so a push that failed or never ran keeps its worktree. **Confirm the path is not the first entry of `git worktree list` first.** The main worktree is never a removal candidate on any path, and nothing here reaches for `rm -rf`.

A refusal is the guard working: `git worktree remove` declines on tracked modifications and on untracked non-ignored files, and with no `--force` anywhere in this skill there is nothing to talk past it with. Report `git -C <worktree> status --porcelain` verbatim and keep the worktree.

**The branch is left alone either way, local ref and remote.** The remote one is what the pull request *is*; the local one may have been the human's before Step 6 attached to it.

## Hard rules

- **Two writes, and the gate sits above both.** One `git push` to the branch the pull request already has, one `gh pr comment` on it, and nothing else leaves this session. Every command before Step 4 is a read.
- **Append-only, and narrower than `/dev-loop`'s, because the artifacts belong to someone else.** No review thread resolved, no draft or ready state converted, no label added or removed, no issue body, pull request body or anyone's comment edited. No ending, no failure and no absent human relaxes this.
- **Never force-push, in any form** — no `--force`, no `--force-with-lease`. The push is a fast-forward by construction, so forcing is never the repair.
- **Push before you remove**, never remove the main worktree, and remove only with `git worktree remove` without `--force`, against a path under `<WORKTREES>`.
- **Gated, always.** Nothing below Step 4 runs without an explicit answer; there is no unattended mode, no `auto` token and no argument that reaches one.
- **One fix per run.** Every unresolved comment is classified and shown; more than one **fix** row shows the table and stops.
- **Every skip names one of Step 3's four reasons and carries its evidence.** No fifth reason is invented at run time and no free text stands in for one; a comment none of them fits, or whose evidence cannot be produced, is `unclassified`, and nothing acts on it.
- **Change nothing under `<DEV-LOOP>`** and add no phase script here. The execute phase runs as it is.
- **Every body is carried verbatim and never interpolated into a shell string.**
- **No repository name, absolute path, label string or project fact lives in this skill.** MAIN, DEFAULT, NAMESPACE and DEV-LOOP are derived at run time, and the three profile keys come from the repo's own `docs/agents/dev-loop.md` — this skill adds none of its own.
- **`.scratch/` is working material nothing may depend on surviving.** The table file goes once the ledger has posted, and is named where it lies on a run that ended before that.
