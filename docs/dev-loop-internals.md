# `/dev-loop` internals

How the pipeline's state machine actually behaves: every loop, every bound, every route, every ending,
and the reasoning that fixed each one where it is.

**A reader wants this. The orchestrator never branches on any of it.** The phase scripts enforce all
of it mechanically, which is what makes this documentation rather than specification — with one
implementation, `phase-execute.js` is the specification of record, and this page exists so that a
human can understand it without reading 759 lines of JavaScript.

For what a run *does* — run shapes, prerequisites, common questions — see
[`dev-loop.md`](./dev-loop.md).

---

## Roles

Five roles. Four have an agent definition; one deliberately does not.

| Role | Agent | Product | Mutates the repo? |
|---|---|---|---|
| architect | `architecture-engineer` | the plan file | `.scratch/` only |
| writer | `code-writer` | Mode 1: one plan commit; Mode 2: fix commits (may dispute findings) | local commits in its worktree |
| reviewer | `reviewer` | verified findings on a range | never |
| debugger | `debugger` | root cause + owner routing | never |
| suite gate | none — a plain subagent | the repository's full-suite result for one sub-lane | never |
| notifier | `notifier` | one ended lane's label, comment and message | never |

The Agent column names each role's **definition**, not the string that dispatches it.

### Why a role is resolved rather than named

The same definition is registered under two different names depending on how it arrived: **bare**
(`code-writer`) when it is linked into a repository's own `.claude/agents/`, and **namespaced**
`<plugin>:<name>` (`ieuanign-skills:code-writer`) when the plugin is installed — which is the
supported install path, so the namespaced form is the ordinary one and the bare form is the
maintainer's.

A role is therefore always resolved against a namespace and never written as a literal. The namespace
is discovered once, at intake, by reading the roster the host already has in front of it; nothing
derives it from a path, a package name or a manifest, so renaming the plugin or the marketplace needs
no edit anywhere.

A phase script cannot do this for itself — it sees no registry — so the host passes the discovered
namespace in the phase scripts' arguments, for the same reason it passes the skill directory. **A
phase script carrying a bare literal runs only for the maintainer** and dies on its first dispatch for
everyone who installed the plugin. `npm run check` enforces the rule structurally: an agent type must
come from the script's `roleAgent()` resolver and never from a quoted string.

### Why the suite gate has no agent definition, and the notifier does

The asymmetry is deliberate, and is recorded here so nobody later "fixes" it.

The **suite gate** runs one command and reports what it did. Loading a role definition — merge-base
rules, blocking bars, dispute handling — to do that is waste, and the gate runs up to eight times per
sub-lane. It is dispatched as a plain subagent with **no agent type and no persona**, at the cheapest
model and the lowest effort. It is given a label, so it still appears by name in the progress display
and the logs. Its return shape is pinned by the phase script's schema, since there is no definition to
carry one.

The **notifier** writes to the outside world. What it writes — which label role, what the comment
says, what shape the message takes, what happens when a write fails — is a specification of real size,
and a definition is where a specification of real size belongs. It also needs rules the suite gate
does not: never compose free text into a shell string, append only, never change the lane, report what
happened rather than what was attempted.

The rule that produced both: **a role gets a definition when it has judgement to constrain.** The
suite gate has none — it runs a quoted command. One consequence follows and is worth naming: the suite
gate's effort tier lives at its dispatch site, because there is nowhere else it could live.

---

## Per-stage context contract

What each stage is handed, what it is permitted to read, and what it hands back.

| Stage | Receives | Reads | Returns |
|---|---|---|---|
| architect | issue number (plus a project slug and any gate answers) | the full sweep: context map → area context → the area's `CLAUDE.md` files → the decision records governing the area → the affected code and its manifests | `STATUS`, `PLAN`, summary bullets, open questions |
| writer | plan path, commit ordinal and message, worktree, branch | the plan, the area's `CLAUDE.md` files, the touched module's manifests, the touchpoint files | `RESULT`, `COMMITS`, `VERIFIED`, `DEVIATIONS`, `DISPUTED`, `DIRTY`, `WORKTREE`, `FAILING` |
| reviewer | branch, base, plan path, the issue body verbatim and whole, the acceptance criteria its sub-lane owns, the writer's disputes | the plan, the diff of the touched files, the area's `CLAUDE.md` files, the repository's documented coding standards | `VERDICT`, `FINDINGS`, `CONTESTED`, `CRITERIA`, `NOTES` |
| debugger | the writer's return, worktree, branch | its own failure reproduction, the touched code | `ROOT-CAUSE`, `OWNER`, `CONFIDENCE`, `REPRODUCED`, a finding |
| suite gate | the repository profile's full-suite command, worktree, branch | nothing — it runs that one command and reads its output | `STATE`, `FAILING`, `OUTPUT` |

**The pipeline passes references rather than content wherever a reference is enough**, so the run
spend lives in the reads — which is why they are part of the contract rather than left to each agent's
discretion.

**The suite gate is the one stage that reads nothing.** That is what makes it the cheapest stage in
the pipeline, and it is why its round ceiling can be 8 where the review loop's is 5.

**The architect alone sweeps the context documents and decision records.** Neither the writer nor the
reviewer opens them. So the plan's Hard constraints section is the only channel by which anything
living in those documents reaches the writer — which is why the architect is told to *state* such a
rule rather than cite its source. The writer's other sources it still reads for itself.

---

## Return contracts

Agents end with machine-readable leading lines; the phase scripts enforce the equivalent JSON schemas.
**The keys are the contract** — no verdict, no result.

- **architect** — `STATUS: READY|BLOCKED` + `PLAN: <path>` + summary bullets + open questions (BLOCKED
  only). The agent definition also carries a Mode 2 conformance sign-off; this pipeline never
  dispatches it.
- **writer** — `RESULT: COMMITTED|BLOCKED|FAILED` + `COMMITS` + `VERIFIED` + `DEVIATIONS` + `DISPUTED`
  (each disputed finding restated with refuting evidence) + `DIRTY` + `WORKTREE` + `FAILING` (FAILED
  only).
- **reviewer** — `VERDICT: APPROVED|CHANGES_REQUESTED|ERROR` + `FINDINGS` (each
  `file:line — defect — failure scenario — suggested fix`) + `CONTESTED` + `CRITERIA` (one
  `met|partial|not-met` verdict per acceptance criterion **the sub-lane owns**, in the issue's order,
  each with its evidence) + `NOTES`. **Zero findings ⇒ APPROVED**, whatever the criterion verdicts say.
- **debugger** — `ROOT-CAUSE` + `OWNER: code-writer|replan|user|retry` + `CONFIDENCE` + `REPRODUCED`;
  when `OWNER=code-writer`, a finding in the reviewer's finding shape.
- **suite gate** — `STATE: passed|failed|not-run` + `FAILING` (the runner's own identifier per failing
  test) + `OUTPUT`.

### `OWNER` carries two kinds of value

`code-writer` and `retry` are **routing** values: each names the stage that runs next. `replan` and
`user` are **reporting** values: they end the sub-lane identically and differ only in where they send
the reader — `replan` back to the plan, `user` to their own machine, credentials or CI. Same pipeline
behaviour, opposite next actions, which is why both are kept rather than collapsed into one.

### A call that came back with nothing

Any role can resolve its call to nothing — nothing at all, or nothing parseable. **Every such return
ends its sub-lane `FAILED`**, and every ending it produces says the stage returned nothing and that it
was skipped or died after the runner's retries.

The architect is the one role that runs before any sub-lane exists, so an architect that returned
nothing is **reported at Gate 1 with a re-run offer** instead. A requested issue is never silently
dropped.

The wording is careful and the label does not change, both deliberately. A skipped agent and a dead
one are indistinguishable from where the pipeline sits, so asserting a death sends a reader looking
for a crash that may never have happened, and calling it a halt would assert the one thing known not
to have happened. The ending stays `FAILED`, because that label answers exactly one question — *is
this worth retrying?*

---

## The per-commit implement loop — bound: 2 debug+fix attempts

For each plan commit, in order:

1. **writer Mode 1** implements the commit.
2. **`FAILED` → the debugger diagnoses** (inside the writer's reported worktree) and routes by
   `OWNER`:
   - `retry` → writer Mode 1 again, citing the debugger's root cause. A transient failure has nothing
     to fix.
   - `code-writer` → writer Mode 2 with the debugger's finding; afterwards the writer completes the
     original commit under Mode 1 rules if it was never committed.
   - `replan` or `user` → the sub-lane ends **HALT** immediately, carrying the diagnosis.
3. **At most 2 debug+fix attempts per commit**, then the sub-lane ends **HALT** — the commit was never
   produced.
4. **`BLOCKED` → HALT** with the writer's reason. Any other non-`COMMITTED` return after routing
   splits on the value it holds: `BLOCKED` is HALT, `FAILED` or a writer that returned nothing is
   FAILED.

### The give-up clause

The writer call of the **final permitted** attempt, and no earlier one, carries one extra instruction:
if it still cannot get green, commit what exists as `wip(<scope>): #<n> - commit <k> FAILED - <reason>`
and return `FAILED` anyway.

Only the final call, because it is the only one after which the pipeline is certain to give up. On an
earlier attempt the sub-lane may still succeed, and a `wip:` commit on a succeeding sub-lane would
break what the rest of the pipeline rests on: **a `wip:` commit means an ended sub-lane with an
incomplete commit list**, which is why such a commit is never reviewed and never gated.

It is **evidence, not work** — listed among the sub-lane's commits so the human sees it, excluded from
the made count, which would otherwise read `1 planned, 2 made` for a sub-lane that made one.

The `replan`/`user` route carries no such instruction: no writer call follows it, and inventing one
costs an agent call to produce a commit nobody asked for.

**The instruction does not exempt that commit from the writer's own pre-commit hooks**, and nothing
may bypass them for it. In a repository whose hook demands a green suite, the evidence commit cannot
land: the writer returns `FAILED` with the work left dirty in its worktree, and the sub-lane ends
exactly as it would have without the instruction. The evidence survives on the machine rather than on
the branch. That is a smaller benefit, not a different ending — and it is the reason **nothing
downstream may assume the commit exists**. The push decision asks git whether the branch is ahead of
its base, never the reported commit list.

### Why this loop keeps a flat bound

The review loop below is progress-sensitive; this one is not, and that is deliberate rather than an
inconsistency to tidy away. The give-up clause requires knowing **at dispatch time** that an attempt
is the last, and a progress-sensitive counter cannot supply that: firing late is impossible, because
the counter only advances after a round returns, and firing early stamps abandonment on attempts that
go on to succeed.

---

## The review loop — bound: progress-sensitive, under a hard ceiling of 5 fix cycles

On the sub-lane's exact range `<base>..<branch>` — the base may itself be a stacked feature branch, so
**never review the base's own commits** — with the issue body passed in so the reviewer runs its Spec
axis:

1. The reviewer runs. `ERROR` or a return of nothing → the sub-lane ends **FAILED**. Both are returns
   the loop cannot use, not verdicts about the code.
2. `CHANGES_REQUESTED` → writer Mode 2 applies the findings; it may **dispute** findings it can
   refute, with evidence.
3. The re-review receives the disputes and re-verifies each:
   - retracted disputes become documented **won't-fix** entries in the findings ledger;
   - still-confirmed disputes (`CONTESTED`) end the sub-lane **HALT** immediately — no further cycle
     is spent on an agent stalemate.
4. Either bound firing ends the sub-lane **HALT**, with the findings still open. Both are checked
   after a `CHANGES_REQUESTED` review and **before that cycle's writer is dispatched**, so nothing is
   spent on a cycle that cannot run.
5. A fix-cycle writer return other than `COMMITTED` splits like the implement loop's: `BLOCKED` is
   HALT, `FAILED` or a writer that returned nothing is FAILED.
6. `APPROVED` → the review loop is done.

### The counter

After a `CHANGES_REQUESTED` review the counter **advances by one unless a previously unseen finding
appeared** — a new finding resets it to 1. At the repository profile's **Fix cycles** value the loop
stops.

```
cycle 1: {A, B, C}   all unseen                    → count 1
cycle 2: {A, B}      subset, nothing new           → count 2 → stop

cycle 1: {A}                                       → count 1
cycle 2: {B}         B unseen                      → reset to 1
cycle 3: {C}         C unseen (regression from B)  → reset to 1
cycle 4: {}          approved                      → done
```

The second trace is the motivating case: three cycles of genuine work, the third finding a regression
the second's fix introduced. The first is the stuck case the threshold exists to cut — and note that
it stops **earlier** than the flat bound it replaced. That is the division of labour: the threshold
catches a loop repeating itself, and the ceiling does the ordinary bounding.

**The counter starts at 1, not 0.** The first `CHANGES_REQUESTED` round sets it whether or not that
round brought anything new, exactly as the suite gate's does. So the profile's value is a **position
the counter reaches**, not a count of no-progress rounds tolerated: `2` ends the loop on the first
round that repeats itself after a productive one. It follows that `1` behaves as `0` does — the
counter is 1 the moment the first round returns, so the first `CHANGES_REQUESTED` ends the sub-lane
and no fix cycle is spent. Both are supported answers; `0` is the one the intake ask offers for that
intent.

### The ceiling

**A hard ceiling of 5 fix cycles applies regardless of progress**, because a mis-compared finding list
would look new every round and reset the counter forever.

It is stated in this document **and** held as a constant in `phase-execute.js`, and `npm run check`
compares the two — the same drift check the cost-stage vocabulary gets, and for the same reason: a
number written twice is a number that can disagree with itself.

**Expect the loop to behave as a flat bound of 5 on most runs.** Independent reviewer invocations
rarely word the same defect identically, so the threshold fires rarely. That is the design rather than
a defect, and it is recorded so that nobody later "fixes" the counter for not advancing.

The ceiling being 5 where the suite gate's is 8 encodes run spend: a review cycle dispatches the two
dearest agents in the pipeline, where a suite round is one cheap call running one command. There is
no token ceiling anywhere in the pipeline, and that decision rests on a lane being bounded from five
directions, one of them this one — so raising it is not free.

### Finding identity — what makes two findings the same finding

A round counts as no-progress only when **every** finding in it matches a prior round's.

Two findings match when their **file and defect clause** match once normalised, **with the line number
dropped**: a fix shifts lines, and a shifted line is not a new defect. Nothing else is compared — the
failure scenario and the suggested fix are the reviewer's prose about a defect the first two clauses
already name. Case and whitespace are normalised and nothing else is. A finding carrying no em-dash at
all has no clause to isolate, so the whole of it stands as its own identity, which can only make two
findings look *more* different — the safe direction.

**The comparison is deliberately conservative.** Declaring two findings the same is what ends the loop
early, so it is declared only on near-repetition; a reworded defect reads as new, and the cycle that
costs is one the ceiling still bounds.

**It is the host's own arithmetic, in plain code, and no agent is dispatched to do it** — the same
standing as the commit-breakdown check and the touchpoint intersection. The reviewer's return contract
is unchanged: no new key, no finding identifier emitted by an agent, and nothing asked to classify its
own findings as new or recurring.

### The escalation carries the trajectory

When the loop ends on either bound, the ending reason names **which bound fired** and states, per
round, whether it brought previously-unseen findings or repeated prior ones. The same trajectory
reaches the findings ledger and the attempt log.

It costs nothing beyond recording what the counter already computed, and it is what lets a reader
judge whether one more cycle was worth running before reading a line of the diff.

### The spec axis passes straight through

The `CRITERIA` verdicts pass through this loop untouched. A criterion verdict never enters `FINDINGS`,
never changes the `VERDICT`, never triggers a fix cycle and never ends the lane: a not-met criterion
means the plan lost something the issue asked for, and the only agent that could re-decide the plan is
the architect, which does not run again in this lane. **A review with zero findings and a not-met
criterion is `APPROVED`.**

The last review's verdicts are the sub-lane's. They land in the findings ledger, and — under
`unattended` — in the terminal-state table, which is the one place a criterion verdict decides
anything at all. Which criteria a sub-lane owns is a fact the plan states and the host applies, never
a judgement the reviewer makes at review time.

---

## The suite gate — bound: 8 rounds, and 2 rounds without a previously unseen failure

The writer runs lint and tests **scoped to the module it touched**, and nothing else in the pipeline
runs the repository's own suite. So once a sub-lane's review loop settles, the lane runs that suite
once, inside that sub-lane's worktree, before it concludes: **a commit that reddened a module it never
touched is caught here or nowhere.**

**Once per sub-lane, not once per lane.** Sub-lanes are separate branches, worktrees and pull requests
and can span layers, so every pull request carries its own suite result. A lane with one sub-lane —
the common case — runs it exactly once.

**The command is configuration, never discovery.** It comes from the repository profile's full-suite
key under the ask-then-persist rule, and a persisted `none` is a real answer: a repository whose suite
needs infrastructure this pipeline does not stand up would otherwise get a red result that means
nothing. With no command the gate reports **not run** and dispatches nothing to say so — `not run` is
a state of its own, never reported as passed. A gate that finds the command unrunnable returns the
same state for itself.

**Position: after the review loop, before the conclusion.** Findings and the suite both react to the
writer's commits, so they are ordered rather than handled together — reviewing a diff a suite fix is
about to change wastes the review. A sub-lane whose review loop already ended it never reaches the
gate, by the no-later-stage rule below: it is concluding with its findings open, and a suite result
would not change what happens next.

### A red suite is diagnosed, not handed straight to the writer

A red suite is a **failure, not a finding**: the gate observed only that the suite is red, and the
breakage is usually in a module outside the writer's commit scope, so a blind fix would flail.

A red result routes to the **debugger**, and the debugger's own routing decides what happens next —
the implement loop's three routes, reused rather than reinvented:

- `retry` → run the gate again. A transient failure has nothing to fix, so there is no writer call to
  repeat.
- `code-writer` → writer Mode 2 against the diagnosis, then run the gate again.
- `replan` or `user` → the sub-lane ends **HALT**, carrying the diagnosis.

Ordinary review findings still go straight to the writer: they already arrive with a failure scenario
and a suggested fix, so a diagnosis adds nothing to those.

**Accepted cost, recorded rather than solved**: the fix commits a red suite produces land *after* the
review loop has closed, so a lane's final commits are never reviewed.

### The round counter

A round is one gate run. After a red round the counter **advances by one unless a previously unseen
failing identifier appeared** — a new identifier resets it to 1, because a shrinking set of the same
failures is not progress. At **2** the loop stops.

```
round 1: {test_a, test_b}                       → count 1
round 2: {test_b}         subset, nothing new   → count 2 → stop

round 1: {test_a, test_b}                       → count 1
round 2: {test_b, test_c} test_c is new         → reset to 1
```

A hard ceiling of **8** rounds applies regardless of progress: a mis-parsed identifier list would look
like new failures every round and reset forever, and eight rounds of the expensive debugger is a
costly way to discover that. **Both bounds are checked before the round's debugger is dispatched**, so
no agent is spent on a round that cannot run.

The gate's identity comparison is free where the review loop's is not: a test runner supplies stable
identifiers, where a reviewer supplies prose.

### The gate's endings

Nothing about this stage is special — the one question below selects each label:

- the suite still red when the counter reaches 2, or at the 8-round ceiling — a bound, so **HALT**;
- the debugger routing to `replan` or `user` — **HALT**;
- a suite-fix writer returning `BLOCKED` — **HALT**; returning `FAILED`, or returning nothing —
  **FAILED**;
- the gate or the debugger returning nothing — **FAILED**.

Every one of them leaves the plan's commits and the review's fixes on the branch, and the sub-lane
finishes with the suite red and says so, carrying the failing test identifiers and any diagnosis.

---

## The commit-breakdown check

At the end of a sub-lane the host compares two lists it already holds: the plan's commit ordinals,
which it passed in as arguments, and the shas and messages every writer return carried back. **This is
a list diff in plain code** — no agent is dispatched to notice it, and none is paid to.

The result is carried as `<n> planned, <m> made`, both scoped to the ordinals *this run* was asked to
make. On a resumed lane that is the remainder rather than the plan's grand total, which still detects
a split or an append.

**A mismatch is reported and never blocks**: it does not halt the lane, does not trigger a fix cycle,
and does not change the terminal state. Fix cycles legitimately append commits and a writer may
legitimately split one, so the count is information for the human merging the pull request, not a halt
condition.

It stays **last** in the sub-lane's sequence so that it counts whatever the suite gate appended.

---

## Endings

Every ending carries exactly one of two labels, and one question selects it: **did something
deliberately stop, or did something break?**

- **HALT** — something deliberately stopped: a bound was reached, a debugger route said stop, or an
  agent reported it cannot proceed.
- **FAILED** — something broke: an agent died, or returned a result the loop cannot use.

**The label decides nothing.** Nothing in the pipeline branches on it. What an ending produces is
decided by the conclusion mode and the terminal-state table, neither of which reads it. The label is a
word in the ending's explanation, so a reported reason maps to a line above without translation.

### An ending ends its sub-lane, not its lane

Sub-lanes are separate branches, worktrees and pull requests, so a sub-lane already finished keeps its
result and its disposition whatever a later one does, and each is disposed of on its own.

The lane's own label is a **roll-up for reporting only** — `FAILED` if any sub-lane ended `FAILED`,
else `HALT` if any ended `HALT`, else clean.

### A sub-lane runs no stage after the one that ended it

With no exceptions to remember. An incomplete commit list means no review loop and no suite gate; a
review loop that ended the sub-lane means no suite gate.

The stages that certify work exist to certify **complete** work, and the review loop does not merely
observe — its fix cycles commit, and those fixes would land on early commits while the work that
defines their final shape is missing, leaving a human to finish the plan on top of fixes made in
ignorance of it.

Every loop is bounded — nothing retries indefinitely — and **no ending kills the batch**.

---

## The lane conclusion

An ended sub-lane's disposition is decided **per sub-lane**, by run mode.

| | gated | unattended |
|---|---|---|
| Push | at Gate 2, on the human's approval | yes |
| Pull request | none by default — Gate 2 offers "open a draft PR anyway?" | draft |
| Explanation | the CLI response | the pull request body |

**The explanation is identical in both**: what stopped or what broke, its stage, the diagnosis if a
debugger produced one, and the attempt log in order. The mode changes where it is written, never what
it says.

Under `gated` a human concludes the lane: a clean sub-lane reaches Gate 2 for push/PR approval, an
ended one is *offered* there rather than pushed around it, and on contested findings the human
arbitrates. Gate 2 for a layer fires before the next layer is provisioned, so a dependent layer is
never built on a base the human has not vetted.

### Push

A sub-lane's branch reaches the remote **exactly once**, at its layer's Gate 2, guarded on the branch
being ahead of its base as read from git. **Per-commit push is not implementable, and is not to be
re-proposed**: the whole commit loop runs inside one workflow call, a workflow script has no shell,
and no stage in the pipeline consumes an intermediate push anyway.

**Never a force-push.** Fix cycles append commits and a resumed lane derives its already-done commits
from the git log, so every push the pipeline makes is a fast-forward by construction. There is
consequently no case in which forcing is the fix, and no ceiling, ending or absent human that unlocks
it.

A rejected push stops that sub-lane's conclusion where it stands: no pull request, the worktree
**kept**, git's own message reported verbatim, and the ending reported **FAILED** — the pipeline's own
assumption broke, which is a break and not a verdict about the code. In a repository whose habit is to
rebase, the commonest real cause is **a human having rebased or amended inside the lane's worktree
while it ran**. The pipeline cannot know whether the remote history or the rewritten local one is the
keeper, and the worktree it just kept is where the human resolves that — which is the whole reason a
rejection reports rather than retries harder.

**Accepted cost, recorded rather than solved**: a layer's end is the run's end, so a three-issue batch
holds the first-finished sub-lane's pull request until the slowest one ends. Rejected alternative: one
workflow call per lane launched in the background, which buys per-lane immediacy at the cost of the
host juggling several background tasks, each carrying its own concurrency cap independently.

### Stack linking

Why the pull requests are identified **by number** and never by branch name: given branch names the
tool pushes them and opens pull requests of its own, with its own titles and bodies — which would
fight the profile's title format, overwrite the body template, and cost the run the `Closes #<n>`, the
summary bullets and the findings ledger it just composed. Given numbers it adopts the pull requests
that already exist and adds nothing. **This is the difference between the feature being additive and
the feature being a second, competing author.**

Why **ready-for-review is never requested**: the tool can mark the pull requests in a stack ready, and
draft-versus-ready is decided by the terminal-state table from each sub-lane's own inputs. A
batch-wide flag applied at link time would override every one of those decisions from the wrong place,
promoting a draft the pipeline drafted deliberately.

Why **no local state, in either direction**: the link writes no local tracking state and changes no
branch, which is what makes it safe to run while lane worktrees still hold those branches checked out.
Linked worktrees share one common git directory, so any command that *did* keep local stack state
would have every concurrent lane racing over the same files. Nothing here may be swapped for a command
that does.

**Removing a lower layer's worktree does not affect the layer above it** — that layer branches from
the base's *branch*, which survives worktree removal.

### The worktree invariant

> A sub-lane's worktree is removed when, and only when, its work has reached the remote **and no human
> is expected to resume in it**.

**The second condition is what keeps a `gated` ended sub-lane's worktree**: a human is present and is
expected to pick that branch up in that checkout, and re-provisioning a worktree that already exists
on their machine buys nothing and costs them a step. Under `unattended` nobody is there to resume, so
the condition is vacuous and removal proceeds.

**The held row falls out of the first condition** rather than needing a rule of its own: a held
sub-lane has pushed nothing, so removing it would destroy work that exists nowhere else.

A removed worktree is **not lost work for anything tracked**: a resumed lane re-provisions from the
branch. Its **ignored** files are another matter, and this is the whole of what the invariant says
about them.

`git worktree remove` deletes ignored files without complaint, and `git status --porcelain` — the
signal every refusal path reads — does not list them either. So a sub-lane's gitignored output —
scratch checks, generated fixtures, captured logs, coverage — is destroyed the moment its branch is
pushed, and **that is the intent rather than an oversight**. It is working material. Cleaning it up is
a reason to remove the worktree, not a cost of doing so.

Two alternatives were weighed and rejected: **keeping the worktree** strands one per sub-lane that
writes anything, and `/dev-loop-cleanup` removes none of them; **copying the files back** writes throwaway
output into the main checkout, where nothing ever reaps it.

What was wrong was only that the loss was **silent** — including when the plan's own acceptance
criteria asked for the artifact, so the pipeline could require a file at a path it was about to
delete, then report the lane clean. So the conclusion names what it destroys before destroying it,
from the plan's File touchpoints, in the run's report **and** in the pull request body. Both, because
they reach different people: an unattended run has nobody reading the first, and the worktree the
report describes is gone moments later.

The durable-artifact rule follows from that report rather than from any mechanism:

> A path that must outlive its sub-lane is committed. Being tracked is what makes it survive, and it
> is also what takes it off this list.

An architect writing a plan applies the same rule in advance: a gitignored touchpoint is named as work
the sub-lane does, never as a deliverable something later expects to find.

### The terminal-state table

Under supervision a human at Gate 2 decides what a sub-lane's ending means. Remove that human and
nothing decides it — a sub-lane with open findings, a red suite or an unmet criterion would open
exactly the pull request a clean one opens. This table decides it instead, and it is read under
**unattended** only.

| A sub-lane ends | Push | Pull request |
|---|---|---|
| Clean | yes | **ready** |
| Suite not-run, no open findings, all owned criteria met | yes | **ready**, the ledger recording not-run |
| Open findings after the fix-cycle bound | yes | **draft** + the ledger |
| Suite still red at the gate's ceiling | yes | **draft** + the ledger |
| Any acceptance criterion the sub-lane **owns** is `partial` or `not-met` | yes | **draft** + the verdicts |
| Ended `HALT` or `FAILED`, with commits | yes | **draft** + the ledger + the attempt log |
| Ended with nothing landed | no — nothing is ahead of the base | **none**; the explanation is commented on the issue |

**The ready predicate is one expression**: the sub-lane **concluded clean**, and its **findings are
resolved**, and the **suite passed or did not run**, and **every acceptance criterion the sub-lane
owns is met**. Anything else drafts.

The predicate does no filtering and gained no clause when criterion ownership arrived: it sees only
the criteria the sub-lane owns because those are the only ones its reviewer was ever asked about. A
sub-lane that did its whole job cleanly therefore opens a **ready** pull request even where the issue
was split.

It is written as that four-way conjunction and **not reduced** to the shortest expression equivalent
to it today. An ending currently implies the middle two, so the reduction would be correct now and
silently wrong later: a change that let a red suite through without ending the sub-lane would start
producing ready pull requests, with no line to have got wrong.

**An ended sub-lane is never ready**, whatever its ledger says. The pipeline stopped before it could
finish judging it, so it has nothing to be confident about.

**A `partial` criterion drafts alongside a `not-met` one.** Nobody watched the run, so "not
demonstrably done" defaults to draft — exactly as the findings ledger and the suite gate already
behave. A half-implemented criterion presenting as a ready pull request would reduce the signal to one
line of ledger prose the merger may skim.

A draft is the honest signal that the pipeline could not finish its own job, and **one rule covers all
four exhaustion paths** — same signal, same handling, one branch in the implementation. A human
landing on a draft can see which trigger fired without opening anything else, because the body already
carries the findings ledger, the suite result, the per-criterion verdicts, and an ended sub-lane's
explanation and attempt log.

**Work that exists stays reviewable.** Open findings, a red suite, or an ending mid-pipeline all open
a draft rather than stranding the branch. Work that does not exist opens nothing — the last row, and a
narrow case: the give-up path commits abandoned work as a `wip:` commit, so an ended sub-lane almost
always has something ahead of its base. Only a sub-lane whose writer stopped before changing a file
lands nothing.

**Every row is decided per sub-lane, from that sub-lane's own inputs**, so one sub-lane's draft never
drafts another's. And **git is the authority on the Push column**: the phase script proposes a row
from what the stages returned, and the host's ahead-of-base read overrides it. Nothing ahead ⇒ the
last row, whatever was proposed. Something ahead of a sub-lane that reported no commits ⇒ a **draft**,
because only an ended sub-lane can propose the last row and an ended sub-lane is never ready.

---

## The findings ledger

The **attempt log** records everything the pipeline did *after* something first went wrong, in order:
each debug+fix attempt, each retry, each review fix cycle, each suite round, carrying what triggered
it, what the debugger said, and how it ended. Stages that worked are already in the commit list and
the ledger's other categories; repeating them buries the one entry that matters. It is recorded on
**every** sub-lane and rendered only on one that ended, so the loops append without branching.

The **review trajectory** works the same way — recorded on every sub-lane, rendered only where a bound
ended one. It answers the question a bare count leaves open, *was this loop converging?*, before
anyone opens the diff.

The **whole-issue roll-up** on the last sub-lane's pull request is **reporting only**. It feeds no
predicate, changes no terminal-state row, and decides nothing: every row stays decided per sub-lane
from that sub-lane's own inputs, and a sibling's unmet criterion never drafts another sub-lane's pull
request — the sub-lane that owns the gap has already drafted for it. Letting the roll-up decide the
last pull request's state was considered and rejected on exactly those two counts.

---

## Sequencing

Lanes run in **parallel**. Within a lane, sub-lanes are **sequential**. Within a sub-lane: plan
commits sequential → review loop → suite gate → commit-breakdown check, then the lane conclusion.

### Touchpoint overlap — three outcomes, and only one of them is a dependency

**The classification is the host's own work, in plain reading, and no agent is dispatched to do it.**
One architect runs per issue, in parallel, and none can see another lane's plan — so the intersection
is inherently cross-lane and inherently the host's. This is not a cost decision that could be revisited
by paying for a better agent; **there is no agent in this pipeline that holds the inputs.**

**Additive co-touch stays parallel and accepts the rebase.** Two lanes appending to the same registry
do not conflict semantically and usually do not conflict textually; where they do, it is the trivial
kind git resolves or a human fixes in a minute. Serialising them would cost a whole layer of
wall-clock to avoid that.

**Why three outcomes rather than two.** Collapsing same-region into dependency would tell a reviewer
that B builds on A when it does not, and would leave a permanent, wrong comment on B's issue.
Collapsing it into additive would send two lanes at the same lines concurrently and hand someone a
conflict the pipeline could have avoided for free.

**Sequencing a same-region co-touch avoids the conflict rather than merely deferring it**: the later
lane branches from the earlier one, so its writer opens the file with the earlier edit already in it
and edits the text as it will actually land. A later layer based on the trunk instead would hit the
same conflict at merge time, one layer later.

**`parallel` is the one declared value that ships a known conflict rather than avoiding one.** It is
offered because the cost is bounded and lands where a merge conflict always lands, and it is not the
default for the same reason it is not free.

**The defer remedy is absent from an unattended run**, and this is the reason rather than an oversight:
"defer B out of this batch" is a human's *not this batch* — a scheduling judgement about what they
want to review this afternoon, made from context the pipeline does not hold. Unattended there is
nobody whose afternoon it is, and deferring a lane the developer explicitly asked for would silently
return less work than was requested.

**Two accepted costs, recorded rather than solved.** Both are real, both are bounded, and neither is
worth an engineering answer:

- **A misclassification is unattended.** If a real dependency is read as additive, the two lanes run
  in the same layer and B's worktree never contains A's code. That surfaces as a **red suite gate or a
  failed writer in B's lane** — an attributable, bounded failure the existing debugger path already
  handles. It is not a silent bad merge, which is the failure worth engineering against.
- **A same-region co-touch read as additive still conflicts when someone merges.** The unattended
  run's job ends at the pull request, so that conflict lands on the human doing the merge — exactly
  where it lands today, and exactly where it would land under supervision if the human accepted the
  same reading.

Neither cost is unique to an unattended run; what is unique is that nobody is watching when it
happens, which is why both are named rather than left to be discovered.

---

## Where each stage's effort tier lives

| Tier | Where it is set | Why there |
|---|---|---|
| the notifier's | its own agent definition's frontmatter | the tier travels with the definition it describes |
| the suite gate's | its dispatch site in `phase-execute.js` | it has no definition by design — see the asymmetry above |
| every other stage's | its dispatch site in the phase scripts | a phase-script constant, per the pipeline's configuration rule |

**No per-repository effort tiers.** Cost behaviour stays predictable across repositories; a tier is a
phase-script constant or it is nothing.
