---
name: pr-comments
description: Reads a pull request's unresolved comments and classifies each fix or skip for a human's approval, then drives the approved fixes through /dev-loop's execute phase and pushes them to that pull request's own branch. Use for `/pr-comments <pull request>`, or `/pr-comments auto <pull request>` for an unattended run.
---

# /pr-comments — a pull request's comments, through to a pushed fix

You are the orchestrator and you stay in the MAIN worktree. This skill reads one pull request's unresolved comments, classifies each **fix** or **skip**, and puts the table in front of a human — or, under `auto`, on the pull request itself; the fix rows then run through `/dev-loop`'s execute phase — writer, review loop and suite gate, unchanged — in a worktree attached to the pull request's own head branch.

**Append-only against artifacts someone else owns, whichever mode it runs in.** The whole run writes one `git push` to the branch the pull request already has, and comments on it — never more than one under `gated` or two under `unattended`. Nothing else leaves this session. Under `gated` no write happens before the gate below; under `unattended` the first of them **is** where that gate would have asked.

## Arguments

`/pr-comments [auto] <pull request>`

- `auto` — optional leading token: run **unattended**, from comments to pushed fix, without stopping for approval.
- `<pull request>` — one pull request, as a number or a URL. One run reads one pull request; there is no batch.
- A URL contributes its **number** only. Every command here resolves the repository from this checkout's remote, so a URL pointing at a different repository is refused rather than quietly reinterpreted as this one's pull request of the same number.

### Run mode — `gated` or `unattended`

`auto` present ⇒ **unattended**; absent ⇒ **gated**. Read it off the arguments ONCE, before Step 1, and carry that single value through the run — no later step re-derives it from the arguments, and **no other argument and no profile key overrides it**. Same token and same leading position as `/dev-loop [auto] <issues>`, so the two read alike.

> **Gate suppression.** Step 4 raises its question under `gated` and raises none under `unattended`. That is the only thing this value decides.

**Suppression removes the questions, not the work.** Every step of Step 4 still runs: every comment is still classified, the table is still rendered, and it is still written to Step 5's file. Each question resolves to its unattended answer instead.

| The gate's question | Its unattended answer |
|---|---|
| approve this table? | every **fix** row proceeds — that is what the run is for |
| act on a **skip** anyway? | no. It stays skipped, and its reason and evidence are posted with the table |
| what about an **unclassified** row? | nobody can decide it, so it is reported as unclassified and acted on by nothing |
| no **fix** row at all? | there is no work: post the table, say so, provision no worktree, push nothing, and stop |

**No comment is re-classified to reach a different intent**, least of all here. Under `gated` a `disagreed with` skip is a disagreement a human can overrule at the gate; under `unattended` it is this skill overruling a reviewer with nobody left to overrule it back, which is why its reasoning is posted in full on the pull request where that reviewer will read it.

**The preconditions are not gates and fire under both modes** — Step 1's five refusals, and the three profile keys Step 6 reads under that profile's own ask-then-persist rule. Suppression is scoped to the question above, so **no unattended default is invented for a profile key**: a run needing one the profile lacks asks once and persists the answer, exactly as a gated run does.

## Derived facts (compute once — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`, where this run's worktree goes.
- **NAMESPACE** — the agent namespace, read off your own roster: find `code-writer` among your available agent types — listed bare, it is the empty string; listed as `<prefix>:code-writer`, it is `<prefix>`. This is the ONLY place it is derived, and it comes from the roster rather than from a path, a package name or a manifest.
- **DEV-LOOP** — the sibling skill folder, `<this-skill-dir>/../dev-loop`. Both install paths put skill folders side by side, so the sibling relation holds on either and no absolute path is written down.
- Every `gh` command runs inside a checkout of this repo and gh infers the repository from the remote, so no `gh` command carries `--repo`.

## Step 1 — preconditions, before anything is read or shown

Each one below makes this run's promise — the fixes, pushed to this pull request's own branch — impossible to keep. Refuse on it **here**, because discovering it after a human has read a table wastes the reading as well as the read. **All five fire under both modes**, and a run refused here has written nothing anywhere.

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
| **skip** | this pull request will not make the change, or none was asked for — and one reason below fits it, carrying that reason's evidence |
| **unclassified** | no reason below fits, or the evidence its reason takes cannot be produced |

**Fits both rows ⇒ skip.** Three of the four reasons below cover a change that *was* asked for and is still not being made, so the fix row matches those comments too; a reason that fits is what settles it, and a disagreement stated is the whole point.

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

### Which commit each fix becomes

**Every fix row carries a commit ordinal, and the default is one ordinal per fix.** Grouping is decided here rather than after the gate, because the table is the plan: approving these rows is what approves the commits.

Two fix rows share an ordinal **only where they ask for the same change** — two reviewers wanting one rename — and a shared ordinal states what makes them one. **Proximity is never sameness**: two comments on the same region of one file are one commit each, because touching the same lines is not asking for the same thing. Silent merging is what the table exists to prevent, so a merge carrying no reason is not one.

**Ordinals run file by file, ascending by anchor within each.** One file's fixes take adjacent ordinals, ordered by the line each sits at — `originalLine` where `line` is null — and the fixes anchored to no file come last. They all run in **one sub-lane**: sequential commits in one worktree is the only thing that makes a later fix open a file with the earlier one already in it, and splitting a run's fixes across sub-lanes or branches races them instead.

A **skip** and an **unclassified** row have no ordinal, and nothing acts on either.

### The table

**One line per entry, ordered by commit ordinal** — two rows sharing one are then adjacent, so a merge is seen rather than looked for. The rows carrying no ordinal follow, in the order the read returned them. Anything longer than a clause goes to an expansion beneath the table and never into a cell.

| # | Comment | Author | Intent | Reason | Why | Commit |
|---|---|---|---|---|---|---|
| the row's key, from `1` down the table | `<path>:<line>` where the entry has both, `<path>` marked *stale anchor* where `line` is null, and the origin in words where there is no path at all — each linked to the entry's `url` — then an excerpt of the body | the entry's `author`, or `unknown` where it is null | **fix**, **skip** or **unclassified** | a **skip**'s reason, spelled as the table above spells it and marked `(!)` where it is `disagreed with`; empty on the other two intents | one clause, per the intent below | the row's commit ordinal, or empty where it has none |

**The comment cell is an excerpt, never the body** — its opening, cut to one line. The body itself travels on verbatim, into Step 5's file, which is where a writer reads it. **Any `|` a cell carries is escaped, and anything wanting a newline goes to its expansion** — the excerpts cut for evidence included, since one unescaped pipe silently eats the rest of a row.

**Fifteen rows read as three do**, because every row is one line whatever it carries and everything that would not fit is beneath the table rather than in it. That is a property of the shape, not of the count.

| Intent | Its clause |
|---|---|
| **fix** | what the fix will do — written once here, and the same string Step 5 hands the writer |
| **skip** | the evidence its reason takes, or `see [<#>]` where that evidence runs past a clause |
| **unclassified** | that the vocabulary did not cover it, and what it appeared to ask |

### Expansions

Beneath the table, one block per row that needs one, keyed by that row's `#`:

```markdown
**[3] disagreed with**

<the full text — as many paragraphs as it takes>
```

**Every `disagreed with` row has one, carrying the reasoning in full**; a row with that reason and no expansion is an unfinished table. Any other row may have one where its clause would not fit.

`(!)` is the mark, carried by no other reason. It is plain ASCII on purpose: it reads the same in a terminal as in GitHub's renderer, and nothing here says anything with colour.

**This is the only table definition there is.** Step 4 below — shown at the gate or posted in its place — Step 5's file and Step 10's comment each render *this* table, expansions included: the same rows, columns and clauses, never a second summary of them.

## Step 4 — the gate, and what stands in for it

**Nothing above this line wrote anything** — every command so far was a read. Under `gated` nothing below it runs without an explicit answer; under `unattended` the answers are the Run mode table's, already given.

Render Step 3's table and its expansions, then count its **fix** rows:

- **None** ⇒ there is nothing to do, and the table is the answer: show it under `gated`, post it under `unattended`, say so, and stop either way. No worktree is provisioned, no phase dispatched and nothing pushed — an empty fix set has no commit to make, and dispatching one anyway would send the review loop at an empty diff.
- **One or more** ⇒ carry on by the mode. There is no ceiling on the count: a pull request's whole comment set runs in one pass, and the ordinals above are how it divides.

### `gated` — ask

AskUserQuestion, once: approve this table, or stop. Say what approving does, so the answer is an informed one — a worktree attached to `headRefName`, one commit per ordinal the table shows, one push to that same branch, and one comment carrying the findings back. A human may correct any row's intent, reason, clause or grouping first; the corrected table is the one that counts, everything downstream renders that one, and the count above is taken again from it. Anything short of approval ends the run with nothing written.

### `unattended` — post the table where the question would have been

Nobody is going to correct a row, so Step 3's table as classified is the one that counts and the one everything downstream renders. It goes on the pull request, because a table nobody was watching is a decision made in a terminal that closes:

```bash
gh pr comment <n> --body-file - <<'BODY'
...
BODY
```

**Quoted heredoc, body on standard input.** The table carries excerpts of other people's comments and the reasoning behind every `disagreed with` — prose full of backticks, dollar signs and quotes, which interpolated into a shell string is executed instead of quoted. Every comment this skill posts arrives this way.

It holds Step 3's table and every expansion, rendered identically — no second summary of them — under one line saying an unattended run of this skill classified them and what it will do next: a worktree on `headRefName`, one commit per ordinal, one push to that same branch, and one further comment when it finishes. Where no row was a fix it says that instead, and is the whole account: nothing follows it.

**This is the run's first write and its first comment, and an unattended run posts this one and Step 10's and never a third** — a run stopping here for want of a fix row posts only this one. **A skip gets no comment of its own**: it stays skipped, its reason and evidence travel in this table, and its thread is not written in.

## Step 5 — the fix rows become the plan

`phase-execute.js` hands the writer a `planPath` and the writer reads it before anything else — a path that does not exist comes straight back as BLOCKED. So the table's fix rows are written as one file, at `<MAIN>/.scratch/pr-comments/<n>-comments.md`, creating the directory. **Not under a `plans/` subdirectory**: `/dev-loop-cleanup` reaps `.scratch/*/plans/<n>-*.md` by number, and an issue sharing a number with this pull request would take a live table with it.

Plan-shaped, and carrying the comments' own content:

```markdown
# <n> — <pull request title>

## Issue summary
<the pull request's url, and that these are review comments on it rather than an issue>

## Approach
One commit per entry below, made in the order they are listed and in one worktree — so a later one
opens a file with the earlier ones already applied.

Only the comments those entries name. Every unresolved comment was classified and shown; the rest
went to skip or unclassified and are no commit's scope.

## Hard constraints
None. A review comment supplies none, and constraints invented here would bind the writer to
something nobody asked for.

## File touchpoints
<every path the entries name, and plainly that a comment anchored to no file names none>

## Test expectations
<the profile's Full-suite command>, from the worktree.

## Commit / PR breakdown
1. `<message>` — <the row's Why clause, character for character as the table shows it>

   Satisfies **[<#>]** <author>, `<path>:<line>` — a **pre-run position** — and the entry's url.

<the body, VERBATIM and at the left margin: not summarised, not re-wrapped, not corrected, and not
indented into the entry — a `suggestion` block's own leading tabs are the code>

## The table
<Step 3's table as it stands, every row and every expansion, rendered identically — what the rest of
the pull request's comments were classified as, and none of it any commit's scope>
```

**One entry per ordinal, in ordinal order, each naming by `#` and url exactly the comment(s) it satisfies** and carrying their bodies. A shared ordinal lists both and says what makes them one change; an entry naming no comment is one whose scope nobody can bound.

**Every `<message>` in the file is unique.** The writer is handed an ordinal and a message string and reads this file for the rest, so two entries reading alike is how the third commit does the first's work.

**Every anchor here is a pre-run position and is labelled one.** GitHub numbered those lines before any of this ran, and the first commit's edit moves the second's — so the site is found by content, which is the other thing the verbatim body is for: the code it quotes and the symbols it names survive an edit above them. Where `line` is null the anchor is `originalLine`, marked *stale anchor* as the table marks it.

**A fix row's clause is not rewritten here.** The writer implements against the string the table states — the one a gated run's human approved — so a second wording of it is a second brief nobody agreed to.

Each `<message>` is a conventional-commit message — `<type>(<scope>): #<n> - <what changes>`, its type and scope taken from what that fix actually is — and the **same strings, verbatim and in this order,** are what Step 7 passes as `commits`. `#<n>` is the pull request: GitHub numbers pull requests and issues in one sequence.

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

**Three profile keys, all read from `docs/agents/dev-loop.md`**: Setup command, Full-suite command and Fix cycles. For one the file lacks, follow its own ask-then-persist rule — ask once, write the answer in, never ask again, **under `unattended` as much as under `gated`**: an invented default is a value nobody chose, persisted as though somebody had. This skill adds no key of its own, no second profile and no argument that changes what the pipeline does.

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
      "commits": [{ "ordinal": 1, "message": "<Step 5's first message, verbatim>" }, ...]
    }]
  }],
  "mode": "<gated or unattended>",
  "fixCycleThreshold": <the profile's Fix cycles>,
  "suiteCommand": "<the profile's Full-suite command>",
  "agentNamespace": "<NAMESPACE>"
}
```

**`commits` is Step 5's `## Commit / PR breakdown`, entry for entry** — one element per entry, same order, same message strings verbatim, ordinals from `1`. The writer is handed an ordinal and a message and reads the file for the rest, so an array disagreeing with the file sends it at a commit nothing describes. It is never empty; Step 4 already ended the run where no fix row was left. **One sub-lane, always** — the array is what makes those commits sequential in one worktree.

`planPath` and `worktree` are **absolute** — `.scratch` and the worktrees directory both live under MAIN. `mode` is the run's real mode, literally `gated` or `unattended` and never the `auto` token the developer typed: with no `skillDir` below it changes nothing the script does, and a record saying `gated` for an unattended run is a false record. `fixCycleThreshold` and `suiteCommand` are the profile's values passed verbatim, never literals written here — and `fixCycleThreshold` is a **number**: the script tests it with `Number.isInteger` and a quoted one silently becomes the default instead.

Four keys are left out, each deliberately:

- **`issueBody`** and **`ownedCriteria`** — there is no issue, so there is no spec axis. The script already tells the reviewer to return an empty `criterionVerdicts` and say so in its notes; that is the existing contract's degenerate case, reached by passing less rather than by editing anything.
- **`skillDir`** — the notifier's only purpose, and an absent one is that script's documented "no notifier is dispatched". Left out under **both** modes, for two reasons. The notifier's first act is a label swap on the issue it was given, and this run works a pull request somebody else opened. And it exists because a workflow script has no shell, so a lane ending mid-script would otherwise have no writer until its siblings finish — this run dispatches one lane with one sub-lane, so the call returns the moment that lane ends and this session is back.
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

**The heredoc is quoted and the body arrives on stdin.** Comment bodies, the verbatim excerpts Step 3's evidence cuts out of them, reviewer notes and findings are agent-facing prose full of backticks, dollar signs and quotes; interpolated into a shell string they are executed, and the one place this run quotes a human's words back at them is the last place to allow that. Everything it carries travels verbatim.

What it says — the commit list from git, everything else from the sub-lane record:

| Section | What it holds |
|---|---|
| what reached the branch | `<planned> planned, <made> made`, then `git -C <worktree> log --oneline <the sha from Step 6>..<headRefName>` line for line — marked **not pushed**, with why, on a path that pushed nothing |
| the comments it answers | one line per comment a commit fixed, in ordinal order — its `#`, its author and its `url`. `gh pr comment` posts at the pull request rather than in the thread, so the links are what tell a reader which comments these are; one line where a run fixed several attributes the rest to it |
| the table | Step 3's table as it stands, every row and every expansion, rendered identically. This copy is the one that outlives the run — a gated run's is a session's scrollback and the table file is deleted below |
| fixed | `fixedFindings` — reviewer findings the writer applied |
| won't-fix | `wontFix`, each with the writer's reason |
| notes | `reviewNotes` verbatim, and `reviewTrajectory` where a bound ended the review loop |
| suite | `suite.state`: `passed`, `failed` with its failing identifiers, or `not run` with why. A suite that did not run never reads as green |
| attempt log | `attempts` in order, on a run that ended — what was tried after the first thing went wrong |

**Ask git for that list, as Step 8 asks it for the count.** The record's commits are the writer's claim and the branch is the fact, so the log is read in the worktree — after the push, and before Step 11 removes it. `<planned>` counts the ordinals Step 7 dispatched, and every planned message the log does not hold is named as not made: a commit nobody wrote is the one thing a claimed list cannot show. A `wip:` commit is listed and **not** counted in `<made>` — it is abandoned work kept as evidence, and counting one reports a failure as delivery.

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

- **One push, and never more than one comment under `gated` or two under `unattended` — nothing else leaves this session.** The push goes to the branch the pull request already has; the comments are Step 4's table, posted only where the gate did not ask, and Step 10's. Every command before Step 4 is a read.
- **Append-only, and narrower than `/dev-loop`'s, because the artifacts belong to someone else.** No review thread resolved, no draft or ready state converted, no label added or removed, no issue body, pull request body or anyone's comment edited. No ending, no failure and no absent human relaxes this.
- **Never force-push, in any form** — no `--force`, no `--force-with-lease`. The push is a fast-forward by construction, so forcing is never the repair.
- **Push before you remove**, never remove the main worktree, and remove only with `git worktree remove` without `--force`, against a path under `<WORKTREES>`.
- **A leading `auto` is the only thing that suppresses the gate, and it is parsed once.** Present ⇒ unattended, absent ⇒ gated; no later step re-derives it, and no other argument and no profile key overrides it. **Suppression removes Step 4's question and nothing else**: every comment is still classified, the table is still rendered, written to Step 5's file and posted on the pull request, Step 1's refusals and Step 6's profile reads still fire, no comment is re-classified to reach a different intent, and nothing acts on a skip or an unclassified row.
- **Every fix row proceeds, and the default is one commit each.** Two share an ordinal only where they ask for the same change, with what makes them one stated; proximity never merges. One file's fixes take adjacent ordinals ascending by anchor and every commit runs in one sub-lane, never split across sub-lanes or branches. A table with no fix row at all is shown or posted and stops the run, provisioning nothing.
- **Each breakdown entry names the comment(s) it satisfies, every message in the file is unique, and Step 7's `commits` matches that breakdown verbatim** — same ordinals, same strings, same order. Anchors written into it are pre-run positions and say so.
- **The ledger's commit list is git's, never the returned one** — `git log <base>..<headRefName>`, read in the worktree before it is removed, with the planned count beside the made count, a `wip:` commit listed and not counted, and any planned commit the branch does not hold named as not made.
- **Every skip names one of Step 3's four reasons and carries its evidence.** No fifth reason is invented at run time and no free text stands in for one; a comment none of them fits, or whose evidence cannot be produced, is `unclassified`, and nothing acts on it.
- **One line per comment — an excerpt, never the body — ordered by commit ordinal, and one table definition.** Overflow goes to the keyed expansion beneath it, never into a cell, and the gate, the table file and the ledger comment each render Step 3's table rather than a summary of it.
- **A `disagreed with` row is marked `(!)` and expanded in full**, and a **fix** row's clause of intent is the one string the human approved — Step 5 hands the writer that string, not a rewording of it.
- **Change nothing under `<DEV-LOOP>`** and add no phase script here. The execute phase runs as it is.
- **Every body is carried verbatim and never interpolated into a shell string.**
- **No repository name, absolute path, label string or project fact lives in this skill.** MAIN, DEFAULT, NAMESPACE and DEV-LOOP are derived at run time, and the three profile keys come from the repo's own `docs/agents/dev-loop.md` — this skill adds none of its own.
- **`.scratch/` is working material nothing may depend on surviving.** The table file goes once the ledger has posted, and is named where it lies on a run that ended before that.
