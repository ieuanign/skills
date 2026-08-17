# `/pr-comments`

## What it does

`/pr-comments` takes one pull request's unresolved comments and produces one pushed fix. It
reads them, classifies each **fix** or **skip**, puts the table in front of you, answers every review
thread it read in that thread, and writes the approved fix rows itself, in a worktree attached to the
pull request's own head branch.

It is **one file and one context**. Nothing here dispatches an agent and nothing runs a workflow: the
classification is the orchestrator's own plain reading of each comment body, the fixes are its own work
in the worktree it attached, and the only judgement it reaches for is a single
`/mattpocock-skills:code-review` pass, in that same context — see
[One review pass](#one-review-pass-and-why). What it adds is the table.

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
| A diff you want judged rather than fixed | `/mattpocock-skills:code-review` |
| Comments on a pull request opened from a fork | nothing here — see **Prerequisites** |

One run reads one pull request; there is no batch. A pull request may be given as a number or a URL,
and a URL contributes its **number** only — one pointing at a different repository is refused rather
than quietly reinterpreted as this repository's pull request of the same number.

## Prerequisites

**`gh`, authenticated**, and a pull request that is **open**, **not from a fork**, and whose head
branch is **not** your default branch. Those three are checked before anything else, rather than left
as surprises later: a merged or closed pull request may already have had its branch deleted, a fork's
head branch lives on another remote so the one push cannot be made from this checkout at all, and a
pull request opened from the default branch would take that push to the trunk. A run stopped on one has
written nothing anywhere.

**Your worktree profile, or the supervised run that writes it.** Two keys are read from
`docs/agents/worktree.md` under that profile's own ask-then-persist rule — Setup command and Full-suite
command. That file holds what any skill provisioning a worktree needs, which is why a run here reads it
rather than `docs/agents/dev-loop.md`, the profile for a pipeline this is not. A key the file lacks is
asked once and written in by a **supervised** run, which is the only kind that asks: a default
persisted is a value nobody chose, written down as though somebody had. Under `auto` a missing key
stops the run instead, because neither key has an honest default and the alternative is pushing work
onto someone else's branch that nothing set up and nothing ran. This skill adds no key, no second
profile and no argument of its own.

Both are read where the worktree is provisioned rather than up front, so a run that stops for want of a
fix row is never asked for either — a question hoisted above that stop spends the repository's one
question on nothing.

**`.worktreeinclude` is optional.** The repo-root file naming which gitignored files a worktree needs
is copied from where it exists and asked for nowhere; a run finding none provisions without those
copies. `/dev-loop`'s Act 0 owns that question.

**Under `auto` alone, the sibling `dev-loop` skill folder** — for one file, `notify.sh`, the channel
both of that run's messages go to. It belongs to the unattended branch, so a supervised run never
resolves that folder at all, and a send that does not happen — the file missing included — is reported
and refuses nothing. The channel is how the run talks about itself, never part of what it does.

## What one run does

In order, and these are the skill file's own eight steps:

1. **The pull request, then its comments.** One `gh pr view` settles the three refusals above. Then one
   bundled normaliser prints every unresolved comment as a single JSON document, review threads, review
   bodies and issue comments in one shape. It excludes resolved threads, minimised comments and
   unsubmitted or bodyless reviews, and a non-zero exit is a **failed read** rather than an empty pull
   request — which is what lets an empty list mean only what it says. No unresolved comments ⇒ say so
   and stop.
2. **Classification.** Every unresolved comment gets a row: **fix**, **skip** with one of four reasons
   and that reason's evidence, or **unclassified**. Each fix row also gets a **commit ordinal**.
3. **The gate** — the table, and the question, asked on every path that reaches it. Under `auto` the
   table is posted on the pull request in the question's place. Then **the threads are answered**: one
   reply in each review thread the table covers, fix, skip and unclassified alike. Threads with no fix
   row are answered here; a thread holding a fix waits for step 7, so its reply can carry the commit
   that answered it.
4. **The worktree**, attached to the pull request's own head branch at the remote's tip — nothing here
   creates a branch — plus the gitignored files your `.worktreeinclude` names, plus your Setup command.
5. **The fixes, written there**: one commit per ordinal in ordinal order, each against the clause its
   row states and the bodies of the comments it covers, read whole; `/mattpocock-skills:tdd` at the
   seams the comments themselves name; the Full-suite command once at the end; then one
   `/mattpocock-skills:code-review` pass, whose findings are applied once.
6. **The push** — one `git push`, a fast-forward, to that same branch, and only where a commit was
   actually made.
7. **The fix threads, answered**, each carrying the short sha and subject of the commit that answered
   it — or, where nothing was pushed, what stopped it — and then **the conclusion**, commented back:
   what reached the branch, which comments those commits answer, every reply the run left, the table
   again, what the review found, the suite result.
8. **The worktree, removed last** — and only where the push succeeded.

**Nothing touches the pull request before the gate** — everything up to it is a read, and under `auto`
the table posted in the gate's place is the run's first write, unless the run ended at step 1, in which
case that ending's own comment is the only write there is. A supervised run you stop at the gate leaves
no trace on it at all.

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
  own; this branch is a human's pull request, and a half-applied fix landing on it is exactly the state
  change on someone else's artifact this skill exists to refuse.

## The comment table is the plan

The table's fix rows are the brief the fixes are written against. There is no separate planning stage
and no architect is dispatched — which is also why commit grouping is decided **before** the gate
rather than after it: approving those rows is what approves the commits.

**The alternative was a planning stage between the comments and the code** — hand the classified
comments to an architect, get a plan back, run that. It was not taken because the comments are already
the brief. A plan derived from them would restate what a human asked for in words that human never
saw, and the gate would then be approving a table while the work followed a paraphrase of it. So a fix
row's clause of intent is written once, at classification, and is the same string implemented against;
each comment's body is read whole where its fix is made, never the excerpt the table shows; and nothing
invents a constraint, because a review comment supplies none and anything added would bind the work to
something nobody asked for.

Two consequences worth knowing:

- **There is no acceptance-criteria section anywhere in the output.** No issue means no spec axis, so
  no criterion verdicts are asked for and the record carries none — a section that rendered nothing
  would claim something had been judged.
- **The run writes no file of its own**, working or otherwise. The table lives in the session and in
  the comments, and **the conclusion comment is the durable copy** — which is why it renders the table
  again rather than summarising it.

## One review pass, and why

The fixes end on one `/mattpocock-skills:code-review` pass, over the range the worktree started from.
Its findings are applied once, in the run's last commits, and the review is not run again over them.
**One pass is the bound**, and it is stated rather than counted — there is no loop for a number to
bound.

`/dev-loop` does loop — review, fix, review again, up to a ceiling — and it can, because its own Gate 2
stands between the last round and the push, and the branch that push lands on is the run's own. This
run has neither. What a second pass would judge is the fix made for the first pass's findings, and the
only thing between that judgement and **somebody else's pull request** is a fast-forward push.

What the bound costs is named rather than hidden: a finding raised against a fix goes unaddressed by
this run. It is reported instead — the conclusion comment carries every finding applied and every one
deliberately not, with the reason — so the person whose pull request it is decides whether it wants
another turn. That is the same person who decides whether the replies settle the comments at all.

**Fix cycles is no longer this skill's key.** The worktree profile still supplies Setup command and
Full-suite command, both of which a worktree needs whoever is writing in it; the third key belongs to
the pipeline that loops, and a run with one pass has nothing to configure.

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
still rendered, every thread is still answered, and the checks above still fire. Each of the gate's
questions resolves to its unattended answer:

| The gate's question | Its unattended answer |
|---|---|
| approve this table? | every **fix** row proceeds — that is what the run is for |
| act on a **skip** anyway? | no. It stays skipped, its reason and evidence are posted with the table, and its thread is answered |
| what about an **unclassified** row? | nobody can decide it, so it is reported as unclassified, no commit is made for it, and its thread is answered saying so |
| no **fix** row at all? | there is no code to write: post the table, answer every thread, and stop |

The table is **posted on the pull request** where the question would have been — a table nobody was
watching would otherwise be a decision that vanished with the terminal. That is the run's first write.

**And it never interviews you.** A supervised run asks for a profile key the file lacks and writes the
answer in; an unattended one asks nothing and **writes nothing** — persisting a value nobody chose
would spend the repository's one question, and the human who would have chosen it would never be asked.
So a profile missing Setup command or Full-suite command stops the unattended run where the worktree
would have been provisioned, reported on the pull request like any other stop there.

**The threads are answered under `auto` exactly as they are under a supervised run.** The two modes
differ only at the listing step, where you see what will be fixed and skipped and why; that difference
never reaches the threads, which is what puts a `disagreed with` reply in front of the reviewer it
disagrees with even when nobody is left to overrule it.

An unattended run also sends **one `start` message at intake and exactly one closing message**, through
the same notifier `/dev-loop` uses — silent when your channel is unconfigured, and no notification
failure ever changes the run it reports. The pairing is **one-directional**: every `start` is closed,
and a run stopped by the three checks that come before it sends neither, having written nothing
anywhere to report. The closing token answers one question: did something deliberately stop, or did
something break?

| Token | When |
|---|---|
| `ready` | clean, the commits pushed — with the fixed, skipped and unclassified counts |
| `halt` | nothing to do, git refused to attach the worktree, a profile key was missing, or the writing stopped deliberately |
| `failed` | the read failed, something broke while the fixes were being written, or nothing was pushed when something should have been |

`draft` never applies, because this run opens no pull request and converts nobody's state, and no
further token is invented. A closed set is what makes a dead run readable by inspection — a `start`
with no close after it.

### A run with no fix row

Every comment was a skip or unclassified. The table **is** the answer: shown, or posted under `auto`.
Every thread it covers is still answered — that run is the one whose reviewers most need to hear back
— and then it stops. No worktree is provisioned and nothing is pushed: an empty fix set has no commit
to make, and a worktree provisioned for it is a checkout set up to write nothing in.

### A run that ended

The writing stopped short, the push was rejected, or nothing was committed at all. The branch is
untouched and **the worktree is kept**: the work is in it, and it is the only copy there is. The
conclusion comment names it by path — that path is the last thing anything records, this session being
what knows it.

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

*Proximity is never sameness* is `SKILL.md`'s wording, word for word, and it is repeated here on
purpose — see [Where a rule lives](#where-a-rule-lives).

**It refused to start because my local branch was ahead of `origin`.**

Deliberate, and the check is worth understanding. The worktree attaches to the pull request's existing
head branch, whatever state your local copy of it is in. Unpushed commits sitting there would be
captured as the range the review reads, then ride out on the run's push — landing on someone else's
pull request unreviewed and absent from the ledger. A fast-forward alone does not catch it,
because git reports a branch *ahead* of the remote as already up to date, so both shas are compared and
the run stops on any difference, reporting them.

**A comment's line number moved — was the wrong place patched?**

No: every anchor the table carries is a **pre-run position, and is labelled as such**. GitHub numbered
those lines before any of this ran and the first commit's edit moves the second's, so the site is found
by content — which is the other thing reading each comment's body whole is for. The code it quotes and
the symbols it names survive an edit above them. A comment whose anchor GitHub already lost is marked
*stale anchor* rather than trusted; that its code moved says nothing about whether anyone did what it
asked, so `outdated` is never the evidence for `already addressed` — a commit is.

**Why is the conclusion's commit list read out of git?**

Because what a run believes it committed is a claim and the branch is the fact, and the two part
company exactly where it matters — a commit that failed a hook, a fix that turned out to be a no-op.
So the list comes from `git log` on the branch, read in the worktree before it is removed, with the
planned count beside the made count and every planned commit the branch does not hold named as not
made.

**Can I point it at several pull requests?**

No. One run reads one pull request, and everything the run owns is that pull request's — one worktree,
one branch, one push, one comment thread to report into.

## It's working if

- **Nothing appears on the pull request before you are asked.** Under `auto`, the first thing that
  appears is the table itself, not a fix — or, where the run ended at the read, that ending's
  explanation and nothing after it.
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
- The gate and the conclusion comment render **the same table** — never a second summary of it.
- Exactly **one push**, a fast-forward, to the pull request's own head branch — and none at all where
  the run ended.
- The conclusion comment's commit list matches `git log` on that branch, with the planned count beside
  the made count.
- **The review ran once**, and the conclusion names every finding it applied and every one it
  deliberately did not, with the reason.
- The review threads are still unresolved — the answered ones included — the draft/ready state is
  unchanged, and no body anyone wrote has been edited.
- A run that ended left its worktree standing and named it, by path, in that comment.
- Under `auto`, one `start` message is paired with exactly one closing message carrying `ready`, `halt`
  or `failed` — and a reason. A run refused at the read sends neither.

## Where a rule lives

A run loads **none of this page**. [`skills/pr-comments/SKILL.md`](../skills/pr-comments/SKILL.md) is
the whole of the **host load** — what the orchestrator carries in its own context for a whole run — so
a sentence moved from there to here is a sentence the run no longer has. **Nothing is deleted from the
skill file on the grounds that this page says it.**

What may live here alone is **the justification that survives its removal**: reasoning you can lift out
of an operative sentence and leave that sentence standing, grammatical and still binding. A "why"
welded into its operative sentence stays in `SKILL.md`, and this page says it again in its own words.

**Where a rule is stated in both files, the repetition is deliberate.** The vocabulary is fixed, so
restating a rule here in different words would make this page describe a run that does not exist. The
overlap is broad rather than incidental: roughly sixty passages of seven words or more are shared,
the longest 88 words — the gate's question-and-answer table, repeated whole. What is forbidden is the
two **disagreeing**: an edit to a rule lands in both files or in neither.

The audit that prompted this rule, as four worked examples of it:

- *"Proximity is never sameness"* — **rule**. In `SKILL.md`'s **Which commit each fix becomes** section
  and here under **Two comments on the same lines became two commits.**: the one verbatim pair the
  audit named, and it stays.
- *"Fifteen rows read as three do"* — **justification**. It left `SKILL.md`; the constraints it
  justifies — one line per entry, anything longer to an expansion — are still in that file's **The
  table** section, and the property they buy is carried here alone, under **It's working if**.
- *"a decision made in a terminal that closes"* — **justification, welded** into its operative
  sentence, so it stays in `SKILL.md`'s **`unattended`** section; **Unattended** above says it in this
  page's own words.
- *"marks its own homework"* — **justification, welded**, so it stays in `SKILL.md`'s **Step 7**
  section; **What it refuses to do** above says it in this page's own words.

This is also where #145's sixth criterion — *the skill's own file carries steps and tables only, with
rationale living in the narrative* — is **narrowed**, with the reason: a skill's file cannot cite a page
it never loads, so "rationale lives in the narrative" can only ever mean the justification that
survives its removal. Every rule stays where the run reads it.
