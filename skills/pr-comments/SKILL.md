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

`node <this-skill-dir>/read-comments.mjs <n>` — the bundled read, and the only one. It prints one JSON document, `{ pullRequest, comments: [...] }`, whose entries carry the same keys whatever each started as: `origin` (`review-thread`, `review-body` or `issue-comment`), `author`, `body`, `url`, `createdAt`, `path`, `line`, `originalLine`, `outdated`, `reviewState`.

- **A non-zero exit is a failed read, never an empty pull request.** It prints no JSON when it fails, so report its message and stop — that is what lets an empty `comments` array mean only what it says.
- **What it excludes is its own business**: a resolved thread, a minimised comment, an unsubmitted or bodyless review. Never re-derive any of that, and issue no `gh` call of your own for comments — a second reader is a second answer.
- **An empty list ends the run.** Say the pull request has no unresolved comments, show no table, ask nothing.

## Step 3 — classify, and show the table

Classification is **your own plain reading of each body**, and dispatches no agent — the same shape `/dev-loop`'s Gate 1 classifies touchpoint overlap in.

| Intent | What it is |
|---|---|
| **fix** | the comment asks for a change to the code on this pull request, and says enough for someone to make it |
| **skip** | everything else — a reply, a question, an observation, a change wanted somewhere other than this pull request, or a request nobody could act on without first asking what it meant |

**Every unresolved comment gets a row, whichever way it went.** A table showing only the work is one nobody can check, and the skips are the half a human is likeliest to disagree with.

**Classify what the comment says, not what its metadata suggests.** An outdated comment — `line: null`, `outdated: true`, its stale anchor left in `originalLine` — is one whose code moved, which says nothing about whether anyone did what it asked; a comment that reads as already dealt with is a **skip** on what it says, never on where it sits.

One row per entry, in the order the read returned them:

| Comment | Author | Intent | Why |
|---|---|---|---|
| `<path>:<line>` where the entry has both, `<path>` marked *stale anchor* where `line` is null, and the origin in words where there is no path at all — each linked to the entry's `url` — then the opening of the body | the entry's `author`, or `unknown` where it is null | **fix** or **skip** | one clause saying what makes it that |

The cell is for reading: the body's opening is truncated to fit and any `|` in it escaped, while the body itself travels on verbatim.

## Step 4 — the gate

**Nothing above this line wrote anything** — every command so far was a read — and nothing below it runs without an explicit answer.

Present the table, then count its **fix** rows:

- **None** ⇒ there is nothing to do. Say so and stop, having shown the table: it is the answer.
- **More than one** ⇒ show the table and stop, saying that grouping several fixes into commits is not built yet and that one at a time is what this skill can do. Never pick one.
- **Exactly one** ⇒ ask.

AskUserQuestion, once: approve this table, or stop. Say what approving does, so the answer is an informed one — a worktree attached to `headRefName`, one commit for the one fix, one push to that same branch, and one comment carrying the findings back. A human may correct any row's intent first; the corrected table is the one that counts, and the count above is taken again from it. Anything short of approval ends the run with nothing written.
