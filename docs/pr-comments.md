# `/pr-comments`

## What it does

`/pr-comments` takes one pull request's unresolved comments and produces one pushed fix. It
reads them, classifies each **fix** or **skip**, puts the table in front of you, answers every review
thread it read in that thread, and drives the approved fix rows through `/dev-loop`'s execute phase —
writer, review loop and suite gate, unchanged — in a worktree attached to the pull request's own head
branch.

It is an **orchestrator** and it stays in the main worktree. It writes no code and dispatches no
planner: the classification is its own plain reading of each comment body, and everything after the
gate is the pipeline [`/dev-loop`](./dev-loop.md) already has. What it adds is the table.

Reach for `/dev-loop` when the input is an issue. Reach for this when the input is a review someone
already left on a pull request that exists.

## The vocabulary you need first

Four words, and the rest of this page reads.

| Word | What it means |
|---|---|
| **comment table** | one row per unresolved comment — the run's whole proposal, and the thing you approve |
| **fix** | the comment asks for a change to the code on this pull request, and says enough for someone to make it |
| **skip** | the change is not being made — for one of four named reasons, each carrying its evidence |
| **unclassified** | no reason fits, or the evidence its reason takes cannot be produced. No commit is made for one |

The table is not a report of the run. It **is** the plan — see [below](#the-comment-table-is-the-plan).
[`CONTEXT.md`](../CONTEXT.md) carries the full glossary.

## When to reach for it

| The work is… | Reach for |
|---|---|
| Unresolved comments on one open pull request | `/pr-comments 128` |
| The same, and you will not be at the keyboard | `/pr-comments auto 128` |
| An issue rather than a pull request | `/dev-loop` |
| A diff you want judged rather than fixed | `/code-review-mp` |
| Comments on a pull request opened from a fork | nothing here — see **Prerequisites** |

One run reads one pull request; there is no batch. A pull request may be given as a number or a URL,
and a URL contributes its **number** only — one pointing at a different repository is refused rather
than quietly reinterpreted as this repository's pull request of the same number.

## Prerequisites

**The Workflow tool.** The execute phase is dispatched through it, so a session without it stops the
run at the first precondition — which names the setting, `"enableWorkflows": true` in
`~/.claude/settings.json`, and says a **restart is required**. It asks nothing and writes nothing: a
supervised `/dev-loop` run owns that question and asks it once per machine, and a second asker is a
second question.

**The sibling `dev-loop` skill folder.** `phase-execute.js` travels with it and is what runs the fix.
The two install together, and nothing here reimplements it.

**`gh`, authenticated**, and a pull request that is **open**, **not from a fork**, and whose head
branch is **not** your default branch. Those three are preconditions rather than surprises later: a
merged or closed pull request may already have had its branch deleted, a fork's head branch lives on
another remote so the one push cannot be made from this checkout at all, and a pull request opened from
the default branch would take that push to the trunk.

**Your `/dev-loop` profile, or the supervised run that writes it.** Three keys are read from
`docs/agents/dev-loop.md` under that profile's own ask-then-persist rule — Setup command, Full-suite
command, Fix cycles. A key the file lacks is asked once and written in by a **supervised** run, which
is the only kind that asks: a default persisted is a value nobody chose, written down as though
somebody had. This skill adds no key, no second profile and no argument of its own.

**Under `auto`, three prerequisites have no default honest enough to take.** **Setup command**,
**Full-suite command**, and `.worktreeinclude` — the repo-root file naming which gitignored files a
worktree needs, which no run here ever asks for, and whose absence costs a supervised run only those
copies. Until one supervised run has supplied all three — a `/dev-loop` run, for the file — `auto`
refuses and names every one that is missing. **Fix cycles** is the key that defaults: `2`, used for
that run and written into no profile.

## What one run does

In order:

1. **Preconditions** — the five above under both modes, plus, under `auto` alone, the check for what
   that run has nobody to ask for. A run refused on the first five has written nothing anywhere; the
   sixth is the one refusal that writes.
2. **The read.** One bundled normaliser prints every unresolved comment as a single JSON document,
   review threads, review bodies and issue comments in one shape. It excludes resolved threads,
   minimised comments and unsubmitted or bodyless reviews, and a non-zero exit is a **failed read**
   rather than an empty pull request — which is what lets an empty list mean only what it says. No
   unresolved comments ⇒ say so and stop.
3. **Classification.** Every unresolved comment gets a row: **fix**, **skip** with one of four reasons
   and that reason's evidence, or **unclassified**. Each fix row also gets a **commit ordinal**.
4. **The gate** — the table, and the question, asked on every path that reaches it. Under `auto` the
   table is posted on the pull request in the question's place.
5. **The threads, answered.** Every review thread the table covers gets one reply in that thread —
   fix, skip and unclassified alike. Threads with no fix row are answered here; a thread holding a fix
   waits for step 10, so its reply can carry the commit that answered it.
6. **The plan.** The approved table's fix rows become the file the execute phase runs on, each entry
   naming the comments it satisfies and carrying their bodies verbatim.
7. **The worktree**, attached to the pull request's own head branch at the remote's tip — nothing here
   creates a branch — plus the gitignored files your `.worktreeinclude` names, plus your Setup command.
8. **The execute phase**, dispatched as `/dev-loop` dispatches it: one lane, one sub-lane, one commit
   per ordinal in ordinal order. Its loops, bounds and endings are the pipeline's and are documented in
   [internals](./dev-loop-internals.md).
9. **The push** — one `git push`, a fast-forward, to that same branch, and only where a commit was
   actually made.
10. **The fix threads, answered**, each carrying the short sha and subject of the commit that answered
    it — or, where nothing was pushed, what stopped it.
11. **The conclusion**, commented back: what reached the branch, which comments those commits answer,
    every reply the run left, the table again, the reviewer's findings and notes, the suite result.
12. **The worktree, removed last** — and only where the push succeeded.

**Nothing touches the pull request before the gate** — everything up to it is a read, and under `auto`
the table posted in the gate's place is the run's first write, unless the sixth precondition refused
first, in which case its report is the only write there is. A supervised run you stop at the gate
leaves no trace on it at all.

## What it refuses to do

The whole run writes **one push**, **one comment** — two under `auto`, where the table is posted in
the gate's place — and **one reply in each review thread its table covers**. Nothing else leaves the
session.

It is append-only against everything a human authored, and deliberately narrower than `/dev-loop`'s
version of that rule, because here every artifact in sight belongs to somebody else:

- **No review thread is resolved**, the ones it replied in included. Replying to a thread is
  append-only; resolving it is not. Whether an answer settles a comment is its author's call, and a
  run that closed its own work would be marking its own homework.
- **No draft or ready conversion, and no label** — on the pull request or the issue behind it. This run
  opens no pull request, so it has no state of its own to set.
- **No edit to any body somebody wrote** — the pull request's, the issue's, or anyone's comment. Its
  conclusion is a **second comment** beside the table, never an edit to it.
- **No comment is re-classified to reach a different intent.** Under `auto` that would be this skill
  overruling a reviewer with nobody left to overrule it back.
- **Never a force push, in any form.** The push is a fast-forward by construction, so forcing is never
  the repair — a rejection means somebody else pushed to the pull request while the fix was being
  written, and that is reported rather than beaten.
- **Never `--force` on the worktree removal either**, and never the main worktree. A refusal is the
  dirty-work guard doing its job, and there is no flag anywhere in the skill to talk past it.
- **A run that ended pushes nothing.** `/dev-loop` pushes an ended sub-lane because the branch is its
  own; this branch is a human's pull request, and a half-applied fix or a `wip:` commit landing on it
  is exactly the state change on someone else's artifact this skill exists to refuse.

## The comment table is the plan

The table's fix rows are written out as the plan file the execute phase runs on. There is no separate
planning stage and no architect is dispatched — which is also why commit grouping is decided **before**
the gate rather than after it: approving those rows is what approves the commits.

**The alternative was a planning stage between the comments and the writer** — hand the classified
comments to an architect, get a plan back, run that. It was not taken because the comments are already
the brief. A plan derived from them would restate what a human asked for in words that human never
saw, and the gate would then be approving a table while the writer worked from a paraphrase of it. So
a fix row's clause of intent is written once, at classification, and is the same string the writer is
handed; the comment bodies travel into the file verbatim; and the file carries no invented
constraints, because a review comment supplies none and anything added there would bind the writer to
something nobody asked for.

Two consequences worth knowing:

- **There is no acceptance-criteria section anywhere in the output.** No issue means no spec axis, so
  the reviewer's criterion verdicts come back empty by the existing contract and a section that
  rendered nothing would claim something had been judged.
- **The run's plan file is working material under `.scratch/`, not an artifact.** Its content is what
  the conclusion comment carries, and **that comment is the durable copy** — the file is gitignored and
  goes with the worktree that held it.

## Run shapes

### Supervised

`/pr-comments 128`. The table and its expansions are shown, and you are asked once: approve,
or stop. You may correct any row's intent, reason, clause or grouping first — **the corrected table is
the one that counts**, and everything downstream renders that one. Anything short of approval ends the
run with nothing written.

### Unattended

`/pr-comments auto 128`. `auto` leads, for the same reason it leads in `/dev-loop`: the word
deciding whether you will ever be asked should be the second one you type.

**Suppression removes the question, not the work.** Every comment is still classified, the table is
still rendered and still becomes the plan file, and the preconditions still fire. Each of the gate's
questions resolves to its unattended answer:

| The gate's question | Its unattended answer |
|---|---|
| approve this table? | every **fix** row proceeds — that is what the run is for |
| act on a **skip** anyway? | no. It stays skipped, its reason and evidence are posted with the table, and its thread is answered |
| what about an **unclassified** row? | nobody can decide it, so it is reported as unclassified, no commit is made for it, and its thread is answered saying so |
| no **fix** row at all? | there is no code to write: post the table, answer every thread, and stop |

The table is **posted on the pull request** where the question would have been — a table nobody was
watching would otherwise be a decision that vanished with the terminal. That is the run's first write.

**And it never interviews you.** The preconditions are not gates, so suppression is not what governs
them; they resolve on a rule of their own, `/dev-loop`'s. **Fix cycles** takes its documented `2` for
that run and is written into no profile — persisting a value nobody chose would spend the repository's
one question, and the human who would have chosen it would never be asked — and the conclusion comment
names the default the work ran on. The three with no honest default refuse the run instead, before it
has read a comment: one report naming every missing one, posted on the pull request in place of both
the table and the conclusion, and sent as a single `failed` message.

**The threads are answered under `auto` exactly as they are under a supervised run.** The two modes
differ only at the listing step, where you see what will be fixed and skipped and why; that difference
never reaches the threads, which is what puts a `disagreed with` reply in front of the reviewer it
disagrees with even when nobody is left to overrule it.

An unattended run also sends **one `start` message at intake and exactly one closing message**, through
the same notifier `/dev-loop` uses — silent when your channel is unconfigured, and no notification
failure ever changes the run it reports. The pairing is **one-directional**: every `start` is closed,
and the refusal above is a close with no `start` before it, which reads as the run that never began.
The closing token answers one question: did something deliberately stop, or did something break?

| Token | When |
|---|---|
| `ready` | clean, the commits pushed — with the fixed, skipped and unclassified counts |
| `halt` | nothing to do, git refused to attach the worktree, or the lane stopped deliberately |
| `failed` | a prerequisite refused the run, the read failed, the lane broke, or nothing was pushed when something should have been |

`draft` never applies, because this run opens no pull request and converts nobody's state, and no
further token is invented. A closed set is what makes a dead run readable by inspection — a `start`
with no close after it.

### A run with no fix row

Every comment was a skip or unclassified. The table **is** the answer: shown, or posted under `auto`.
Every thread it covers is still answered — that run is the one whose reviewers most need to hear back
— and then it stops. No worktree is provisioned and nothing is pushed: an empty fix set has no commit
to make, and dispatching the phase anyway would point the review loop at an empty diff.

### A run that ended

The lane halted or failed, the push was rejected, or the phase made no commit at all. The branch is
untouched and **the worktree is kept**: the work is in it, and it is the only copy there is. The
conclusion comment names it by path, names the plan file kept beside it, and — where the environment
gave one — the run handle, which is what locates this run's transcript once the session is gone.

## Common questions

**It classified a comment as a skip when I clearly asked for a change.**

By design, and it is the half worth reading. Three of the four skip reasons cover a change that *was*
asked for and is still not being made — `already addressed`, `out of scope for this branch`,
`disagreed with` — so where both intents fit, a reason that fits settles it. A `disagreed with` row is
marked `(!)` and its reasoning is expanded **in full** beneath the table, never compressed into the
cell. Under a supervised run you overrule it at the gate; under `auto` that reasoning is posted on the
pull request precisely so the person who wrote the comment can.

**I asked a question and it made a code change.**

Because the answer to it was a change. A question is read for **what its answer implies, never for its
grammar** — answer it first, then look at the answer. An answer naming something the code should do
differently makes the row a **fix**, and that answer is the clause of intent you see in the table. An
answer that stands on its own with the code unchanged makes it `skip — question`, and that answer is
the evidence and the reply.

*"Why not use a hook rather than copying this three times?"* and *"why is this constant in a utils
file?"* are both sincerely interrogative and both fixes; *"what does this flag do?"* is the same shape
and a skip, because its answer is an answer. Nothing in the wording separates them. Where a standing
convention in the repository settles it — a `CLAUDE.md`, an `AGENTS.md`, a rules file — the row names
that convention and what it says, the way `already addressed` names a real commit: evidence you can
open, rather than an assertion that a rule exists.

This is also why the answer is written down either way. You are reading the reasoning that produced the
classification at the gate, rather than inferring it from the verdict.

**Why did it reply in a thread I had already stopped watching?**

Because your comment got an outcome and the thread is where you would look for it. **Every review
thread the table covers gets exactly one reply**, whatever its rows were classified — fix, skip and
unclassified alike, under both modes. A thread is one conversation, so several of its comments share
one reply that names each.

Replies are one line: a fix carries its clause and the short sha and subject of the commit that
answered it, a skip carries its named reason and that reason's evidence, an unclassified row says the
run did not classify it. `disagreed with` is the single exception and carries its reasoning in full,
because that is the reply that overrules a human.

Every comment and reply the run writes ends with a hidden `<!-- replied from /pr-comments -->` marker
and a visible `🤖 Generated with Claude Code` footer. `gh` authenticates as you, so without the footer
all of it would read as written by you.

A comment with no thread to reply in — a review body, a top-level issue comment — has no reply
primitive on GitHub, so none is invented for it. Its reason travels in the table, and the conclusion
comment names which those were.

**A row says `unclassified` and nothing happened to it.**

That is the honest outcome, not a gap. The four skip reasons are a closed list — no fifth is invented
at run time, and free text never stands where a reason goes — and each takes evidence: the answer to a
question, a commit this pull request actually holds, the separate piece of work a deferral names, or
the reasoning in full. A comment none of them fits, or one whose evidence cannot be produced, is
reported as unclassified with what it appeared to ask, and its thread is told as much. It is the signal
that the vocabulary needs widening, which is a deliberate change and never a run's decision.

**Two comments on the same lines became two commits.**

**Proximity is never sameness.** Two rows share a commit ordinal only where they ask for the *same*
change — two reviewers wanting one rename — and a shared ordinal has to say what makes them one.
Touching the same lines is not asking for the same thing, and silent merging is what the table exists
to prevent. Within a file the ordinals run ascending by anchor, so a later fix opens a file with the
earlier one already applied; comments anchored to no file come last.

**It refused to start because my local branch was ahead of `origin`.**

Deliberate, and the check is worth understanding. The worktree attaches to the pull request's existing
head branch, whatever state your local copy of it is in. Unpushed commits sitting there would be
captured as the range the reviewer diffs against, then ride out on the run's push — landing on someone
else's pull request unreviewed and absent from the ledger. A fast-forward alone does not catch it,
because git reports a branch *ahead* of the remote as already up to date, so both shas are compared and
the run stops on any difference, reporting them.

**A comment's line number moved, so did the writer patch the wrong place?**

No: the anchors written into the plan are **pre-run positions and are labelled as such**. GitHub
numbered those lines before any of this ran and the first commit's edit moves the second's, so the site
is found by content — which is the other thing the verbatim comment body is for. The code it quotes and
the symbols it names survive an edit above them. A comment whose anchor GitHub already lost is marked
*stale anchor* rather than trusted; that its code moved says nothing about whether anyone did what it
asked, so `outdated` is never the evidence for `already addressed` — a commit is.

**Why does the conclusion's commit list disagree with what the phase reported?**

It cannot, because it is not that list. The commits are read from `git log` on the branch, in the
worktree, before it is removed: the phase's report is the writer's claim and the branch is the fact.
The planned count sits beside the made count, any planned commit the branch does not hold is named as
not made, and a `wip:` commit is listed but **not** counted — it is abandoned work kept as evidence,
and counting one would report a failure as delivery.

**How many fix cycles does the review loop get?**

Whatever your profile's Fix cycles key says, under the pipeline's own ceiling — or `2`, where an
unattended run found the key absent and took the default rather than asking. This skill changes
nothing under `/dev-loop`: the loops, their bounds and every ending belong to `phase-execute.js` and
are documented in [internals](./dev-loop-internals.md), which is the only place their numbers are
written down.

**Can I point it at several pull requests?**

No. One run reads one pull request, and everything the run owns is that pull request's — one worktree,
one branch, one push, one comment thread to report into.

## It's working if

- **Nothing appears on the pull request before you are asked.** Under `auto`, the first thing that
  appears is the table itself, not a fix — or, where a prerequisite refused the run, that refusal and
  nothing after it.
- **Every unresolved comment has a row**, skips included — a table showing only the work is one nobody
  can check.
- Each skip names **one of four reasons** and shows its evidence; each `disagreed with` carries `(!)`
  and an expansion in full.
- **Every review thread the table covers has exactly one reply in it** — whatever its rows were
  classified, and whether or not a single row was a fix.
- Each reply is a line, carrying the strings the table already carries, and ends with the Claude Code
  footer. Only `disagreed with` runs longer.
- Fifteen rows read as easily as three, because every row is one line and everything longer lives
  beneath the table.
- The gate, the plan file and the conclusion comment all render **the same table** — never a second
  summary of it.
- Exactly **one push**, a fast-forward, to the pull request's own head branch — and none at all where
  the run ended.
- The conclusion comment's commit list matches `git log` on that branch, with the planned count beside
  the made count.
- The review threads are still unresolved — the answered ones included — the draft/ready state is
  unchanged, and no body anyone wrote has been edited.
- A run that ended left its worktree standing and named it, by path, in that comment.
- Under `auto`, one `start` message is paired with exactly one closing message carrying `ready`, `halt`
  or `failed` — and a reason. A refused run sends that closing message alone.
