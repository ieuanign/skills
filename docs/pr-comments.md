# `/pr-comments`

## What it does

`/pr-comments` takes one pull request's unresolved comments and produces one pushed fix. It reads
them, classifies each **fix** or **skip**, puts the table in front of you, answers every review thread
it read in that thread, and makes the approved fixes in a worktree attached to the pull request's own
head branch.

It does that work **in its own session**. Nothing here dispatches an agent, runs a workflow or loads a
second specification: the classification is its own plain reading of each comment body, the fixes are
written the way that session writes anything, and the review over them is one
`/mattpocock-skills:code-review` pass. What it adds is the table.

Reach for [`/dev-loop`](./dev-loop.md) when the input is an issue. Reach for this when the input is a
review someone already left on a pull request that exists.

## The vocabulary you need first

Three words, and the rest of this page reads.

| Word | What it means |
|---|---|
| **comment table** | one row per unresolved comment — the run's whole proposal, and the thing you approve |
| **fix** | the comment asks for a change to the code on this pull request, and says enough for someone to make it |
| **skip** | everything else. The row says why, and carries the evidence that reason rests on |

The table is not a report of the run. It **is** the brief — see
[below](#the-comment-table-is-the-brief). [`CONTEXT.md`](../CONTEXT.md) carries the full glossary.

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
branch is **not** your default branch. Those three come off the run's first read, before anything is
shown, because each makes the promise — the fixes, pushed to this pull request's own branch —
impossible to keep: a merged or closed pull request may already have had its branch deleted, a fork's
head branch lives on another remote so the one push cannot be made from this checkout at all, and a
pull request opened from the default branch would take that push to the trunk.

**And nothing else.** No setting to enable, no profile key to fill in, no sibling skill installed
alongside. The run loads one file of its own — `read-comments.mjs`, beside `SKILL.md` — and nothing
else on disk decides what it does, which is why an unattended run has nobody to interview and no
default to invent. The worktree is made runnable and the suite is found the way any session in that
repository works them out.

## What one run does

In order:

1. **One metadata read of the pull request.** `gh pr view` once for the three prerequisites above; the
   one other `gh pr view` a run makes is the commits read a skip's evidence may name. A run refused
   there has written nothing anywhere and spent one API call.
2. **The read.** One bundled normaliser prints every unresolved comment as a single JSON document,
   review threads, review bodies and issue comments in one shape. It excludes resolved threads,
   minimised comments, unsubmitted or bodyless reviews, and **everything a previous run of this skill
   already answered**; a non-zero exit is a **failed read** rather than an empty pull request, which is
   what lets an empty list mean only what it says. No unresolved comments ⇒ say so and stop.
3. **Classification.** Every unresolved comment gets a row: **fix**, or **skip** with why and the
   evidence that rests on.
4. **The gate** — the table, and the question, asked on every path that reaches it. Under `unattended`
   the table is posted on the pull request in the question's place.
5. **The threads with nothing left to wait for, answered.** Every review thread the table covers whose
   rows are all skips gets its one reply here; a thread holding a fix waits for step 9, so its reply
   can carry the commit that answered it.
6. **The worktree**, attached to the pull request's own head branch at the remote's tip — nothing here
   creates a branch — and checked to be sitting exactly there before anything is written.
7. **The fixes.** One commit per fix row, in the table's order, each row's Action the brief and the
   comment's body verbatim what it is against; then the suite; then one `/mattpocock-skills:code-review`
   pass whose findings are applied.
8. **The push** — one `git push`, a fast-forward, to that same branch, and only where git says a commit
   was actually made.
9. **The fix threads, answered**, each carrying the short sha and subject of the commit that answered
   it — or, where nothing was pushed, what stopped it. Rows with no thread to reply in — a review
   body, a top-level comment — share one comment, posted only where there are any.
10. **The report**, in the session and never on the pull request: what reached the branch, the suite's
    result, what the review pass changed and what it declined, and any worktree kept.
11. **The worktree, removed last** — and only where the push succeeded.

**Nothing touches the pull request before the gate** — everything up to it is a read, and under
`unattended` the table posted in the gate's place is the run's first write, unless something stopped
the run earlier, in which case that stop's own comment is the only write there is. A `gated` run you
stop at the gate leaves no trace on the pull request at all.

## What it refuses to do

The whole run writes **one push**, **one reply in each review thread its table covers**, and **one
comment for the rows with no thread to reply in**, only where there are any — plus the table itself
under `unattended`, where it is posted in the gate's place. There is no conclusion comment: every
comment is answered where it was raised, and the run's own account of what it did stays in the
session. Nothing else leaves it.

It is append-only against everything a human authored, and deliberately narrower than a pipeline
working a branch of its own, because here every artifact in sight belongs to somebody else:

- **No review thread is resolved**, the ones it replied in included. Replying to a thread is
  append-only; resolving it is not. Whether an answer settles a comment is its author's call, and a
  run that closed its own work would be marking its own homework.
- **No draft or ready conversion, and no label** — on the pull request or the issue behind it. This run
  opens no pull request, so it has no state of its own to set.
- **No edit to any body somebody wrote** — the pull request's, the issue's, or anyone's comment. Everything
  it writes is a **new** reply or comment, never an edit to one.
- **No comment is re-classified to reach a different intent.** Under `unattended` that would be this
  skill overruling a reviewer with nobody left to overrule it back.
- **Never a force push, in any form.** The push is a fast-forward by construction, so forcing is never
  the repair — a rejection means somebody else pushed to the pull request while the fix was being
  written, and that is reported rather than beaten.
- **Never `--force` on the worktree removal either**, and never the main worktree. A refusal is the
  dirty-work guard doing its job, and there is no flag anywhere in the skill to talk past it.
- **A run that stopped part-way pushes nothing.** A half-applied fix landing on someone else's pull
  request is exactly the state change this skill exists to refuse; the work stays in the worktree,
  which is kept and named.

## The comment table is the brief

The table's fix rows are what the fixes are made from. There is no planning stage between the comments
and the code, no architect is dispatched, and no plan document is written anywhere — approving those
rows is what approves the commits.

**The alternative was a planning stage.** Hand the classified comments to a planner, get a plan back,
work from that. It was not taken because the comments are already the brief. A plan derived from them
would restate what a human asked for in words that human never saw, and the gate would then be
approving a table while the fixes were made from a paraphrase of it. So a fix row's Action is written
once, at classification, and is the same string the work is done against; the comment bodies travel
into the worktree verbatim; and nothing invents a constraint, because a review comment supplies none
and anything added would bind the work to something nobody asked for.

Two consequences worth knowing:

- **There is no acceptance-criteria section anywhere in the output.** No issue means no spec axis, so
  nothing is asked for criterion verdicts and the record carries none — a section that rendered nothing
  would claim something had been judged.
- **The run writes nothing to disk outside its worktree.** The table lives in the session and in the
  comment it is posted or repeated in, and **that comment is the durable copy** — there is no file to
  go looking for afterwards.

## One review pass, and no pipeline

The fixes used to run through a bundled phase script — a writer, a review loop bounded by a cycle
count, and a suite gate, dispatched as agents. That is gone. The work happens in the session you
invoked, and the review over it is **one `/mattpocock-skills:code-review` pass, applied once, then
stop**, whatever a second pass might have said.

**One pass is a bound nothing has to keep in step.** A loop needs a number, that number needs writing
down in the prose and holding as a constant in the script, and a check to compare the two so it cannot
disagree with itself. One pass needs none of that: it is stated in words, in the one file the run
loads, and there is no second place for it to drift from.

**And a second pass would be the same reader re-reading its own work.** In a pipeline the reviewer is a
separate agent with a separate context, so a second round genuinely brings a second opinion; here the
pass and the fixes are the same session, and re-running it mostly re-derives what it already decided.
What one pass declines to fix is **reported back in the session** rather than argued with, which puts
it in front of the human who ran it.

The rest of the pipeline went with it. No preconditions script, no agents to check the preloads of, no
notification channel, no profile keys, and no second copy of `/dev-loop`'s execute phase to keep in
step with the original. The whole of what a run does is one file, in front of you, at the size of a
page you can read before invoking it.

## Run shapes

### Gated

`/pr-comments 128`. The table is shown and you are asked once: approve, or stop. You may correct any
row's status or action first — **the corrected table is the one that counts**, and everything
downstream renders that one. Anything short of approval ends the run with nothing written.

### Unattended

`/pr-comments auto 128`. `auto` leads, for the same reason it leads in `/dev-loop`: the word deciding
whether you will ever be asked should be the second one you type. It assumes a permission mode that
approves tool calls on its own, and it asks nothing at all on that path.

**Suppression removes the question, not the work.** Every comment is still classified, the table is
still rendered, every thread is still answered, and the fixes are still made. The gate's questions
resolve to their unattended answers:

| The gate's question | Its unattended answer |
|---|---|
| approve this table? | every **fix** row proceeds — that is what the run is for |
| act on a **skip** anyway? | no. It stays skipped, its reason and evidence are posted with the table, and its thread is answered |
| no **fix** row at all? | there is no code to write: post the table, answer every thread, and stop |

The table is **posted on the pull request** where the question would have been — a table nobody was
watching would otherwise be a decision that vanished with the terminal. That is the run's first write,
and the only other comment it can post is the one answering rows with no thread to reply in.

**Nothing else resolves, because nothing else was ever asked.** There is no profile key to default and
no value to persist, so an unattended run has no interview to suppress. A run that stops before the
table spends its one comment saying why.

**The threads are answered under `unattended` exactly as they are under `gated`.** The two modes differ
only at the gate, where you see what will be fixed and skipped and why; that difference never reaches
the threads, which is what puts a disagreement in front of the reviewer it disagrees with even when
nobody is left to overrule it.

### A run with no fix row

Every comment was a skip. The table **is** the answer: shown, or posted under `unattended`. Every
thread it covers is still answered — that run is the one whose reviewers most need to hear back — and
then it stops. No worktree is provisioned and nothing is pushed: an empty fix set has no commit to
make, and provisioning one anyway would point a review pass at an empty diff.

### A run that ended

Something stopped part-way, the push was rejected, or no commit was made at all. The branch is
untouched and **the worktree is kept**: the work is in it, and it is the only copy there is. The run's
report names it by path and repeats verbatim whatever git said, and the threads that were waiting on a
commit are answered by saying what stopped it instead.

## Common questions

**It classified a comment as a skip when I clearly asked for a change.**

By design, and it is the half worth reading. A skip is not "we did not understand you": the row says
what is happening instead and shows its evidence — the commit that already did it, by short sha and
subject; the file and line of the convention it rests on; the answer to the question, where the answer
stands on its own. **Evidence a reader cannot open is no evidence.** A skip that disagrees with you
says so in full, in as many sentences as it takes, beneath the table rather than squeezed into a cell,
because that row is this skill overruling a human. Under `gated` you overrule it back at the gate;
under `unattended` the reasoning is posted on the pull request precisely so the person who wrote the
comment can.

A comment the run genuinely cannot decide is a skip too, and its row says it is being left for a human
and what it appeared to ask. That is the honest outcome rather than a gap — a fix invented from a
comment nobody understood is the failure worth avoiding.

**I asked a question and it made a code change.**

Because the answer to it was a change. A question is read for **what its answer implies, never for its
grammar** — answer it first, then look at the answer. An answer naming something the code should do
differently makes the row a **fix**, and that answer is the Action you see in the table. An answer that
stands on its own with the code unchanged makes it a skip, and that answer is the evidence and the
reply.

*"Why not use a hook rather than copying this three times?"* and *"why is this constant in a utils
file?"* are both sincerely interrogative and both fixes; *"what does this flag do?"* is the same shape
and a skip, because its answer is an answer. Nothing in the wording separates them. Where a standing
convention in the repository settles it — a `CLAUDE.md`, an `AGENTS.md`, a rules file — the row names
that convention and what it says: evidence you can open, rather than an assertion that a rule exists.

This is also why the answer is written down either way. You are reading the reasoning that produced the
classification at the gate, rather than inferring it from the verdict.

**Why did it reply in a thread I had already stopped watching?**

Because your comment got an outcome and the thread is where you would look for it. A comment at the
foot of the pull request notifies its author about *the pull request*, not about *their comment*.
**Every review thread the table covers gets exactly one reply**, whatever its rows were classified,
under both modes. A thread is one conversation, so several of its comments share one reply that names
each.

Replies are extremely concise, to the point, and in simple terms: a fix carries its Action and the
short sha and subject of the commit that answered it, a skip carries its reason and that reason's
evidence, and a disagreement gives its reason in plain words — the full reasoning stays beneath the
table.

Every comment and reply the run writes ends with a hidden `<!-- replied from /pr-comments -->` marker
and nothing visible after it. The marker is what a **later** run reads: it excludes every comment
carrying one, every thread holding one, and every comment a previous run named by id — so running the
skill twice on the same pull request classifies what is new rather than answering the same review
again.

A comment with no thread to reply in — a review body, a top-level issue comment — has no reply
primitive on GitHub, so none is invented for it. Those rows share one comment on the pull request,
posted only where there are any, whose marker names them by id.

**Two comments on the same lines became two commits.**

**Proximity is never sameness.** Two rows share a commit only where they ask for the *same* change —
two reviewers wanting one rename — and touching the same lines is not asking for the same thing. Silent
merging is what the table exists to prevent. The rows run in the table's order in one worktree, so a
later fix opens a file with the earlier one already applied.

**It refused to start because my local branch was ahead of `origin`.**

Deliberate, and the check is worth understanding. The worktree attaches to the pull request's existing
head branch, whatever state your local copy of it is in. Unpushed commits sitting there would be
captured as the range the review pass reads, then ride out on the run's push — landing on someone
else's pull request unreviewed and absent from the record. A fast-forward alone does not catch it,
because git reports a branch *ahead* of the remote as already up to date, so both shas are compared and
the run stops on any difference, reporting them.

**A comment's line number moved, so did it patch the wrong place?**

No: GitHub numbered those lines before any of this ran, and the first commit's edit moves the second's,
so the site is found by content — which is the other thing the verbatim comment body is for. The code
it quotes and the symbols it names survive an edit above them. A comment whose anchor GitHub already
lost is classified on what it says rather than on what its metadata suggests: that its code moved says
nothing about whether anyone did what it asked, so `outdated` is never the evidence for a skip — a
commit is.

**Why does the sha a reply cites disagree with what the run said it did?**

It cannot, because it is not that account. The commits are read from `git log` on the branch, in the
worktree, after the push and before the worktree is removed. What the run believes it committed is a
claim; the branch is the fact, and the same rule decides the push itself — git's count of what the
branch actually gained, never the session's own account of it.

**Can I point it at several pull requests?**

No. One run reads one pull request, and everything the run owns is that pull request's — one worktree,
one branch, one push, one comment thread to report into.

## It's working if

- **Nothing appears on the pull request before you are asked.** Under `unattended`, the first thing
  that appears is the table itself, not a fix — or, where something stopped the run first, that stop
  and nothing after it.
- **Every unresolved comment has a row**, skips included — a table showing only the work is one nobody
  can check.
- Each skip says what is happening instead and shows evidence you can open; each disagreement carries
  its reasoning in full, beneath the table.
- **Every review thread the table covers has exactly one reply in it** — whatever its rows were
  classified, and whether or not a single row was a fix.
- Each reply is short and plain, carrying the strings the table already carries, and ends with the
  hidden marker and nothing visible after it.
- Fifteen rows read as easily as three, because every row is one line and everything longer lives
  beneath the table.
- Under `unattended`, the table posted is **the table** — never a summary of it — and no conclusion
  comment follows it.
- Exactly **one push**, a fast-forward, to the pull request's own head branch — and none at all where
  the run ended.
- Every sha a reply cites is on that branch.
- The review threads are still unresolved — the answered ones included — the draft/ready state is
  unchanged, and no body anyone wrote has been edited.
- A run that ended left its worktree standing and named it, by path, in its report.
- A second run on the same pull request has nothing to say about the comments the first one answered.

## Where a rule lives

A run loads **none of this page**. [`skills/pr-comments/SKILL.md`](../skills/pr-comments/SKILL.md) is
the whole of the **host load** — what the session carries in its own context for a whole run — so a
sentence moved from there to here is a sentence the run no longer has. **Nothing is deleted from the
skill file on the grounds that this page says it.**

What may live here alone is **the justification that survives its removal**: reasoning you can lift out
of an operative sentence and leave that sentence standing, grammatical and still binding. A "why"
welded into its operative sentence stays in `SKILL.md`, and this page says it again in its own words.

**Where a rule is stated in both files, the repetition is deliberate.** The vocabulary is fixed, so
restating a rule here in different words would make this page describe a run that does not exist. What
is forbidden is the two **disagreeing**: an edit to a rule lands in both files or in neither.

This is also where #145's sixth criterion — *the skill's own file carries steps and tables only, with
rationale living in the narrative* — is **narrowed**, with the reason: a skill's file cannot cite a page
it never loads, so "rationale lives in the narrative" can only ever mean the justification that
survives its removal. Every rule stays where the run reads it.
