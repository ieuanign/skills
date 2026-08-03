# /dev-loop contracts — the normative state machine

This file is the single source of truth for the pipeline's role contracts, bounds, and endings. Both execution modes implement it: **Mode W** (Workflow tool running `phase-plan.js` / `phase-execute.js`) and **Mode A** (direct Agent-tool orchestration). Any behavior change edits THIS file first, then both implementations in the same change. If an implementation and this file disagree, this file governs.

## Roles

| Role | Agent | Product | Mutates the repo? |
|---|---|---|---|
| architect | architecture-engineer | Mode 1: plan file | `.scratch/` only |
| writer | code-writer | Mode 1: one plan commit; Mode 2: fix commits (may DISPUTE findings) | local commits in its worktree |
| reviewer | reviewer | verified findings on a range | never |
| debugger | debugger | root cause + owner routing | never |
| suite gate | none — a plain subagent | the repo's full-suite result for one sub-lane | never |

## Append-only invariant

What the pipeline may write outside its own worktrees and `.scratch/`. It binds the host and every agent, identically in both modes — there is no ending, no ceiling and no absent human that relaxes it.

- **Append** to issues and pull requests. Comments only.
- **Add and remove its own workflow labels**, and no others. This clause writes to an issue a human filed, and it is inside the invariant because the write is additive and reversible: a label add or remove destroys nothing a human authored, and human intent is what the invariant guards.
- **Set state only on artifacts it created** — its own branches, its own pull requests, its own plan files.

It never edits an issue body, never ticks an acceptance-criteria checkbox, and never converts a pull request a human opened. The reviewer's per-criterion verdicts are reported — in the lane's conclusion and the PR body — and never written back to the issue's checklist: the closing keyword closes the issue on merge regardless, the aggregate verdict belongs to the pull request's own state, and an issue body is the one artifact in this pipeline a human wrote by hand.

## Per-stage context contract

What each stage is handed, what it is permitted to read, and what it hands back. The pipeline passes references rather than content wherever a reference is enough, so the cost lives in the reads — which is why they are part of the contract and not left to each agent's discretion. The Returns column names the keys; the Return contracts below are normative for their exact shape.

| Stage | Receives | Reads | Returns |
|---|---|---|---|
| architect | issue number (plus a project slug and any gate answers) | the full sweep: context map → area context → the area's CLAUDE.md files → the decision records governing the area → the affected code and its manifests | `STATUS`, `PLAN`, summary bullets, open questions |
| writer | plan path, commit ordinal and message, worktree, branch | the plan, the area's CLAUDE.md files, the touched module's manifests, the touchpoint files | `RESULT`, `COMMITS`, `VERIFIED`, `DEVIATIONS`, `DISPUTED`, `DIRTY`, `WORKTREE`, `FAILING` |
| reviewer | branch, base, plan path, **the issue body verbatim**, the sub-lane's scope, the writer's disputes | the plan, the diff of the touched files, the area's CLAUDE.md files, the repo's documented coding standards | `VERDICT`, `FINDINGS`, `CONTESTED`, **`CRITERIA`**, `NOTES` |
| debugger | the writer's return, worktree, branch | its own failure reproduction, the touched code | `ROOT-CAUSE`, `OWNER`, `CONFIDENCE`, `REPRODUCED`, a finding |
| suite gate | the repo profile's full-suite command, worktree, branch | nothing — it runs that one command and reads its output | `STATE`, `FAILING`, `OUTPUT` |

The suite gate is the one stage that reads nothing: no plan, no diff, no issue. That is what makes it the cheapest stage in the pipeline.

The architect alone sweeps the context documents and decision records — neither the writer nor the reviewer opens them. So the plan's Hard constraints section is the only channel by which anything living in those documents reaches the writer, which is why the architect is told to state such a rule rather than cite its source. The writer's other sources (the area's CLAUDE.md files, the touched module's manifests) it still reads for itself.

The architect's summary bullets are lane state, not gate state: retained from Phase A, they reach the PR body's Context section beside the planned-versus-made commit counts, whatever concludes the lane.

## Return contracts

Agents end with machine-readable leading lines; Mode W enforces the equivalent JSON schemas in the phase scripts, Mode A parses the lines. The keys are the contract — no verdict, no result.

- **architect**: `STATUS: READY|BLOCKED` + `PLAN: <path>` + summary bullets + open questions (BLOCKED only). The agent definition also carries a Mode 2 conformance sign-off; this pipeline never dispatches it.
- **writer**: `RESULT: COMMITTED|BLOCKED|FAILED` + `COMMITS` + `VERIFIED` + `DEVIATIONS` + `DISPUTED` (with each disputed finding restated with refuting evidence) + `DIRTY` + `WORKTREE` + `FAILING` (FAILED only).
- **reviewer**: `VERDICT: APPROVED|CHANGES_REQUESTED|ERROR` + `FINDINGS` (each: `file:line — defect — failure scenario — suggested fix`) + `CONTESTED` (disputed findings it still confirms) + `CRITERIA` (one `met|partial|not-met` verdict per acceptance criterion in the issue body, in the issue's order, each with its evidence; empty when no issue body was passed) + `NOTES`. Zero findings ⇒ APPROVED, whatever the criterion verdicts say.
- **debugger**: `ROOT-CAUSE` + `OWNER: code-writer|replan|user|retry` + `CONFIDENCE` + `REPRODUCED`; when OWNER=code-writer, a finding in the reviewer's finding shape. `OWNER` carries **two routing values** — `code-writer` and `retry`, each naming the stage that runs next — and **two reporting values**, `replan` and `user`, which end the sub-lane identically and differ only in where they send the reader: `replan` back to the plan, `user` to their own machine, credentials or CI. Same pipeline behaviour, opposite next actions, which is why both are kept.
- **suite gate**: `STATE: passed|failed|not-run` + `FAILING` (the runner's own identifier per failing test — empty unless STATE is `failed`) + `OUTPUT` (the command's output). It is the one role with no agent definition to carry that format, so whichever mode dispatches it states the format itself — Mode W in its schema, Mode A in the prompt.
- **DIED** (any role): the agent crashed or returned nothing parseable. Every DIED ends its sub-lane **FAILED** — a death is a break, never a verdict. The architect is the one role that runs before any sub-lane exists: an architect DIED is reported at Gate 1 with a re-run offer instead. Never silently drop a requested issue.

  **A lane that throws is the same rule reaching the case it did not cover.** A terminal error can reject the call rather than return nothing, which unwinds the whole lane — so each lane's work is wrapped once, and a throw is caught and turned into a **FAILED** ending naming the issue and carrying the error message plus its stack trace where one exists. A dead agent frequently throws neither, and the reason says so rather than promising a trace that is empty. The lane's partial sub-results come back with it, attempt log included — that is the record most worth keeping from a lane that crashed mid-recovery — and each unfinished sub-lane takes the same ending, so it reaches the terminal-state table like any other. A thrown architect takes the DIED entry above for its issue. This is **mode-neutral**: a lane vanishing is a bug under `gated` too, where it shows up as a lane silently missing from the Gate 2 report. What the crashed lane's branch then *does* is Lane conclusion's, exactly as for every other ending — the label decides nothing here either, and `FAILED` answers only *is this worth retrying?*, to which a host throw is the case that most often says yes.

## Per-commit implement loop — bound: 2 debug+fix attempts

For each plan commit, in order:

1. writer Mode 1 implements the commit.
2. `FAILED` → debugger diagnoses (inside the writer's reported worktree). Route by OWNER:
   - `retry` → writer Mode 1 again (transient; cite the debugger's root cause).
   - `code-writer` → writer Mode 2 with the debugger's finding; afterwards the writer completes the original commit under Mode 1 rules if it was never committed.
   - `replan` or `user` → the sub-lane ends **HALT** immediately, carrying the diagnosis.
3. At most **2** debug+fix attempts per commit, then the sub-lane ends **HALT** — the commit was never produced.
4. `BLOCKED` → **HALT** with the writer's reason. Any other non-`COMMITTED` return after routing splits on the value it holds: `BLOCKED` is **HALT**, `FAILED` or a dead writer is **FAILED**.

The writer call of the **final permitted** debug+fix attempt, and no earlier one, carries one extra instruction: if it still cannot get green, commit what exists as `wip(<scope>): #<n> - commit <k> FAILED - <reason>` and return `FAILED` anyway. It is the only call after which the pipeline is certain to give up — on an earlier attempt the sub-lane may still succeed, and a `wip:` commit on a succeeding sub-lane would break what the rest of this file rests on: a `wip:` commit means an ended sub-lane with an incomplete commit list, which is why it is never reviewed and never gated. It is evidence, not work — listed among the sub-lane's commits so the human sees it, excluded from the made count, which would otherwise read `1 planned, 2 made` for a sub-lane that made one. The `replan`/`user` route carries no such instruction: no writer call follows it, and inventing one costs an agent call to produce a commit nobody asked for.

The instruction does not exempt that commit from the writer's own pre-commit hooks, and no mode may bypass them for it. In a repository whose hook demands a green suite the evidence commit cannot land, the writer returns `FAILED` with the work left dirty in its worktree, and the sub-lane ends exactly as it would have without the instruction — the evidence survives on the machine rather than on the branch. That is a smaller benefit, not a different ending, and it is the reason nothing downstream may assume the commit exists: the push decision asks git whether the branch is ahead of its base, never the reported commit list.

## Review loop — bound: the repo profile's fix-cycle count (default 2)

On the sub-lane's exact range `<base>..<branch>` (the base may itself be a stacked feature branch — never review the base's own commits), with the issue body passed in so the reviewer runs its Spec axis:

1. reviewer runs; `ERROR` or DIED → the sub-lane ends **FAILED** — both are returns the loop cannot use, not verdicts about the code.
2. `CHANGES_REQUESTED` → writer Mode 2 applies the findings; it may DISPUTE findings it can refute, with evidence.
3. The re-review receives the disputes and re-verifies each:
   - retracted disputes become documented **won't-fix** entries in the lane's findings ledger;
   - still-confirmed disputes (`CONTESTED`) end the sub-lane **HALT** immediately — no further cycle is spent on an agent stalemate.
4. At most the profile's **fix-cycle count** cycles, then **HALT** — the findings are still open. The count is a repository fact and reaches both implementations as a value, never as a literal: a repository with a flaky suite raises it, and one that answers `0` spends no fix cycle at all — its first `CHANGES_REQUESTED` ends the sub-lane with the findings open.
5. A fix-cycle writer return other than `COMMITTED` splits like the implement loop's: `BLOCKED` is **HALT**, `FAILED` or a dead writer is **FAILED**.
6. `APPROVED` → the review loop is done.

A review's range is one sub-lane, but the acceptance criteria belong to the whole issue, so the reviewer is told which sub-lane it is judging. A criterion the plan delivers in a different sub-lane is outside this range and is recorded `partial` with that stated — never `not-met`, which would make every early PR of a multi-PR plan read as a failure of work not yet due.

The `CRITERIA` verdicts pass straight through this loop untouched — the spec axis is **reported and never blocking**, by the same reasoning as the commit-breakdown check below. A criterion verdict never enters `FINDINGS`, never changes the `VERDICT`, never triggers a fix cycle and never ends the lane: a not-met criterion means the plan lost something the issue asked for, and the only agent that could re-decide the plan is the architect, which does not run again in this lane. A review with zero findings and a not-met criterion is `APPROVED`. The last review's verdicts are the sub-lane's; they land in the findings ledger, which the lane's conclusion surfaces.

## Suite gate — bound: 8 rounds, and 2 rounds without a previously unseen failure

The writer runs lint and tests **scoped to the module it touched**, and nothing else in this pipeline runs the repository's own suite. So once a sub-lane's review loop settles, the lane runs that suite once, inside that sub-lane's worktree, before it concludes: a commit that reddened a module it never touched is caught here or nowhere. It runs in **both** modes.

**Once per sub-lane, not once per lane.** Sub-lanes are separate branches, worktrees and pull requests and can span waves, so every PR carries its own suite result. A lane with one sub-lane — the common case — runs it exactly once.

**The command is configuration, never discovery.** It comes from the repo profile's full-suite key under the profile's ask-then-persist rule, and a persisted `none` is a real answer: a repository whose suite needs infrastructure this pipeline does not stand up would otherwise get a red result that means nothing. With no command the gate reports **not run** and dispatches nothing to say so — `not run` is a state of its own, never reported as passed, per the convention that a check which never ran must say so rather than show an empty result. A gate that finds the command unrunnable returns the same state for itself.

**The agent is a plain subagent with no persona and deliberately no agent type**, at the cheapest model and the lowest effort. Loading a role definition — merge-base rules, blocking bars, dispute handling — to run one command is waste, and the gate runs up to eight times. It is given a label, so it appears by name in the progress display and the logs; its return shape is pinned by the return contract above; and it never fixes, never commits, and never touches a file.

**Position: after the review loop, before the conclusion.** Findings and the suite both react to the writer's commits, so they are ordered rather than handled together — reviewing a diff a suite fix is about to change wastes the review. A sub-lane whose review loop already ended it never reaches the gate, by the no-later-stage rule below: it is concluding with its findings open, and a suite result would not change what happens next.

The result reaches the human in both places it is due — the lane's conclusion and the PR body — through the findings ledger below.

### A red suite is diagnosed, not handed straight to the writer

A red suite is a **failure**, not a finding: the gate observed only that the suite is red, and the breakage is usually in a module outside the writer's commit scope, so a blind fix would flail. A red result routes to the **debugger**, and the debugger's own routing decides what happens next — the per-commit implement loop's three routes, reused rather than reinvented, each landing where this stage's own position puts it:

- `retry` → run the gate again; a transient failure has nothing to fix, so there is no writer call to repeat.
- `code-writer` → writer Mode 2 against the diagnosis, then run the gate again.
- `replan` or `user` → the sub-lane ends **HALT**, carrying the diagnosis. The route reads the same here as in the implement loop, and the ending is labelled the same way — the stage a failure happens at changes what is on the branch, never what the ending is called.

Ordinary review findings still go straight to the writer: they already arrive with a failure scenario and a suggested fix, so a diagnosis adds nothing to those.

Accepted cost, recorded rather than solved: the fix commits a red suite produces land **after** the review loop has closed, so a lane's final commits are never reviewed.

### The bound is progress-sensitive, under a hard ceiling

A round is one gate run. After a red round the counter **advances by one unless a previously unseen failing identifier appeared** — a new identifier resets it to 1, because a shrinking set of the same failures is not progress. At **2** the loop stops.

```
round 1: {test_a, test_b}                       → count 1
round 2: {test_b}         subset, nothing new   → count 2 → stop

round 1: {test_a, test_b}                       → count 1
round 2: {test_b, test_c} test_c is new         → reset to 1
```

A hard ceiling of **8** rounds applies regardless of progress: a mis-parsed identifier list would look like new failures every round and reset forever, and eight rounds of the expensive debugger is a costly way to discover that. Both bounds are checked before the round's debugger is dispatched, so no agent is spent on a round that cannot run.

### The gate's endings are labelled by the same question as every other stage's

Nothing about this stage is special — the one question below selects each label, and the sub-lane ends:

- the suite still red when the counter reaches 2, or at the 8-round ceiling — a bound, so **HALT**;
- the debugger routing to `replan` or `user` — **HALT**;
- a suite-fix writer returning `BLOCKED` — **HALT**; returning `FAILED`, or dying — **FAILED**;
- the gate or the debugger dying — **FAILED**.

Every one of them leaves the plan's commits and the review's fixes on the branch, and the sub-lane finishes with the suite red and says so, carrying the failing test identifiers and any diagnosis. What that produces — a push, a draft pull request, a Gate 2 offer — is Lane conclusion's, and the label is no part of it.

## Commit-breakdown check — the host's own work, no agent

At the end of a sub-lane the host compares two lists it already holds: the plan's commit ordinals, which it passed in as arguments, and the shas and messages every writer return carried back. This is a list diff in plain code — no agent is dispatched to notice it, and none is paid to.

The result is carried as `<n> planned, <m> made`, both scoped to the ordinals this run was asked to make — on a resumed lane that is the remainder, not the plan's grand total, which still detects a split or an append. A mismatch is **reported and never blocks**: it does not halt the lane, does not trigger a fix cycle, and does not change the terminal state. Fix cycles legitimately append commits and a writer may legitimately split one, so the count is information for the human merging the PR, not a halt condition.

## HALT and FAILED — two labels that decide nothing

Every ending above carries exactly one of two labels, and one question selects it: **did something deliberately stop, or did something break?**

- **HALT** — something deliberately stopped: a bound was reached, a debugger route said stop, or an agent reported it cannot proceed.
- **FAILED** — something broke: an agent died, or returned a result the loop cannot use.

**The label decides nothing.** Nothing in this pipeline branches on it — what an ending produces is decided by the conclusion mode alone, in Lane conclusion below. The label is a word in the ending's explanation, so a reported reason maps to a line above without translation, and it is the same distinction `notifications.md` already selects its labels by: failure is always a break and never a verdict.

**An ending ends its sub-lane, not its lane.** Sub-lanes are separate branches, worktrees and pull requests, so a sub-lane already finished keeps its result and its disposition whatever a later one does, and each is disposed of on its own. The lane's own label is a roll-up for reporting only — `FAILED` if any sub-lane ended `FAILED`, else `HALT` if any ended `HALT`, else clean.

**A sub-lane runs no stage after the one that ended it**, with no exceptions to remember: an incomplete commit list means no review loop and no suite gate; a review loop that ended the sub-lane means no suite gate. The stages that certify work exist to certify *complete* work, and the review loop does not merely observe — its fix cycles commit, and those fixes would land on early commits while the work that defines their final shape is missing, leaving a human to finish the plan on top of fixes made in ignorance of it.

Every loop above is bounded — nothing retries indefinitely — and no ending kills the batch. Every ending reports its label, its stage, the verbatim contract lines that produced it, its attempt log, and the exact resume command (`/dev-loop <n>` re-derives everything from artifacts). A lane whose base lane ended — or was held by the user — never runs at all, so it ends **HALT** with that reason.

## Token spend is reported, never enforced

**No lane halts, warns, or changes its behaviour because of what it costs.** There is no token ceiling, no per-lane budget and no cost-triggered ending anywhere in this pipeline, and nothing in the sections above may gain one. This binds both modes, which is why it sits here rather than in **Lane conclusion**: it describes something neither mode does. What exists instead is reporting — a per-lane cost log the host writes, which reads and prints and touches nothing. *When* it writes one is a host concern and not this file's; nothing in the pipeline's behaviour turns on it either way.

A ceiling was specified once and dropped, because it could not work. The runner's budget total is unset unless a human typed a budget directive, so it silently never fires under exactly the unattended run it was meant to guard — the worst failure mode a safety stop can have. Its spend figure is turn-wide and shared across the host and every lane, while the measured baseline is per-lane, so with parallel lanes there is nothing to attribute and one shared ceiling would halt every lane together. And it counts output tokens, which is not the metric the baseline was measured on. The obvious repair — reading the per-agent transcripts the way the baseline analysis did — is unavailable from where the enforcement would live, a workflow script having no filesystem access.

**It was also unnecessary, and this is the load-bearing half.** A lane is already bounded in agent invocations from five directions: the per-commit debug-and-fix bound, the fix-cycle bound, the suite gate's ceiling, a commit count fixed by the plan, and the workflow runner's own backstop on total agents. Nothing here can loop forever. The most expensive lane in the measured set was not stuck — it was thirteen commits of genuine work against a median of three. A token ceiling would not have caught a runaway; it would have refused a big issue.

## Lane conclusion — the only branch point in this file

Every other section of this contract is single-version: both modes implement it identically. This section is the one place the two are described separately, and a behaviour change that differs by mode belongs here or nowhere. It is also where an ending's label stops mattering: nothing below reads it, and a sub-lane that stopped and one that broke are disposed of identically.

An ended sub-lane's disposition is decided by mode, and decided per sub-lane. The two modes are **gated** and **unattended** — `auto` is the token a developer types for the unattended one.

| | gated | unattended |
|---|---|---|
| Push | at Gate 2, on the human's approval | yes |
| Pull request | none by default — Gate 2 offers "open a draft PR anyway?" | draft |
| Explanation | the CLI response | the pull request body |

The explanation is identical in both: what stopped or what broke, its stage, the diagnosis if a debugger produced one, and the attempt log in order. Mode changes where it is written, never what it says. The worktree row this table used to carry is now one row of the worktree invariant below, which covers every sub-lane state rather than only an ended one.

**One exception, and only one.** A sub-lane where nothing landed at all — the writer stopped before changing a file, so there is not even a `wip:` commit — has no branch ahead of its base: nothing to push, and no pull request to open. Whether the branch is ahead is read from git, never inferred from a reported commit list. Under unattended its explanation is commented on the issue instead, which the append-only invariant permits. This is the only ending in the pipeline that opens no pull request.

**gated** — the default: a human concludes the lane.

- A clean sub-lane reaches Gate 2 for push/PR approval. Nothing is pushed without it, and an ended sub-lane is *offered* there rather than pushed around it. The suite result is on it, so the human approving a push sees a green suite rather than assuming one.
- An ended sub-lane carries what is still open to that gate. On contested findings the human arbitrates: uphold → targeted writer fix and resume the lane; accept → documented won't-fix. Either ruling lands in the ledger's **arbitrated** category. On an exhausted fix-cycle bound the human reads the open findings and decides whether to push anyway.
- Gate 2 for a wave fires before the next wave is provisioned, so a dependent wave is never built on a base the human has not vetted.

**unattended** — there is no human to conclude the lane, so the table above happens unprompted and notifications fire. Read `notifications.md` before emitting any notification: it governs every one of them, and nothing here restates it. Which endings open a **ready** pull request rather than a **draft** one is the terminal-state table below.

**Mode A implements the gated half only, and never the unattended half.** The unattended half therefore has exactly one implementation, which is what keeps this file's rule — a behaviour change edits the contract first, then both implementations in the same change — cheap to honour.

The three subsections that follow are not part of that branch. Push and the worktree invariant are single-version and bind both modes; the terminal-state table is read only where the unattended half sends it.

### Push — once per sub-lane, at the end of its wave

A sub-lane's branch reaches the remote exactly once, and never before its own work is finished. A sub-lane that concluded clean pushes immediately before its pull request is created; one that ended performs that same single push, and what follows it is the mode table above. A lane with one sub-lane — the common case — therefore pushes once.

**The push is guarded on the branch being ahead of its base, read from git.** A sub-lane that ended before it committed anything has nothing to push, and a push attempted anyway is an error the run does not need. This is the same read the exception above rests on, made once and used for both decisions.

**Never a force-push, in either mode.** Fix cycles append commits and a resumed lane derives its already-done commits from the git log, so every push this pipeline makes is a fast-forward. There is consequently no case in which forcing is the fix, and no ceiling, ending or absent human that unlocks it. A rejected push stops that sub-lane's conclusion where it stands: no pull request is created, the worktree is **kept**, and git's own message is reported verbatim. It is reported **FAILED** — the pipeline's own assumption broke, which is a break and not a verdict about the code. In a repository whose habit is to rebase, the commonest real cause is a human having rebased or amended inside the lane's worktree while it ran. The pipeline cannot know whether the remote history or the rewritten local one is the keeper, and the worktree it just kept is where the human resolves that — which is the whole reason a rejection reports rather than retries harder.

**Per-commit push is not implementable, and is not to be re-proposed.** The whole commit loop runs inside a single workflow call and a workflow script has no shell, so the host's first control point is that call returning. Reaching it otherwise would mean either changing the writer's contract — it never pushes — or spending an agent invocation on one git command, which the skill's hard rules forbid in terms. Nothing in this pipeline consumes an intermediate push either — the reviewer diffs local refs — so the only thing one could feed is a repository's own push-triggered CI, which gains nothing from being run against a branch the pipeline is still committing to.

**Accepted cost, recorded rather than solved.** This version is always one wave, so the end of a wave is the end of the run: a three-issue batch holds the first-finished sub-lane's pull request until the slowest one ends. Rejected: one workflow call per lane launched in the background, which buys per-lane immediacy at the cost of the host juggling several background tasks, each carrying its own concurrency cap independently.

### The worktree invariant

> A sub-lane's worktree is removed when, and only when, its work has reached the remote **and no human is expected to resume in it**.

| Sub-lane state | Remote | Worktree |
|---|---|---|
| Concluded clean | pushed, pull request opened | removed |
| Ended, unattended | pushed, draft pull request | removed |
| Ended, gated | pushed, no pull request by default | **kept** |
| Held at Gate 2 | nothing pushed | kept |
| Removal refused | pushed | kept, reported |

Two rules make this safe, and neither is negotiable.

**Push succeeds first, remove second.** After removal the remote branch is the only copy, so a push that did not succeed keeps the worktree. Nothing removes a worktree it did not just watch a push succeed for.

**A dirty worktree keeps itself.** A writer that failed may have left uncommitted work, and a push carries only commits. `git worktree remove` without `--force` already refuses on tracked modifications or on untracked non-ignored files, and that refusal *is* the guard — the pipeline never passes `--force`, so it can never talk its way past one. Ignored files, such as the configuration and dependency directories provisioning copies in, do not trip it.

The invariant's **second** condition is what keeps a `gated` ended sub-lane's worktree: a human is present and is expected to pick that branch up in that checkout, and re-provisioning a worktree that already exists on their machine buys nothing and costs them a step. Under `unattended` nobody is there to resume, so the condition is vacuous and removal proceeds. The held row falls out of the **first** condition rather than needing a rule of its own: a held sub-lane has pushed nothing, so removing it would destroy work that exists nowhere else.

**The main worktree is never a removal candidate** — not under any state above, in either mode, and not in cleanup mode either. It is the first entry of `git worktree list`, and every removal path confirms the path it is about to remove is not that entry before running anything.

A removed worktree is not lost work: a resumed lane re-provisions from the branch, which the provisioning step already documents for exactly this case.

### The terminal-state table — ready, draft, or no pull request

Under supervision a human at Gate 2 decides what a sub-lane's ending means: they read the commit list, the findings ledger and the criterion verdicts, and arbitrate anything contested. Remove that human and nothing decides it — a sub-lane with open findings, a red suite or an unmet criterion would open exactly the pull request a clean one opens. This table decides it instead, and it is read under **unattended** only: under `gated` every one of these outcomes goes in front of the human, who decides.

| A sub-lane ends | Push | Pull request |
|---|---|---|
| Clean | yes | **ready** |
| Suite not-run, no open findings, all criteria met | yes | **ready**, the ledger recording not-run |
| Open findings after the fix-cycle bound | yes | **draft** + the ledger |
| Suite still red at the gate's ceiling | yes | **draft** + the ledger |
| Any acceptance criterion `partial` or `not-met` | yes | **draft** + the verdicts |
| Ended `HALT` or `FAILED`, with commits | yes | **draft** + the ledger + the attempt log |
| Ended with nothing landed | no — nothing is ahead of the base | **none**; the explanation is commented on the issue |

**The ready predicate is one expression**: the sub-lane **concluded clean**, and its **findings are resolved**, and the **suite passed or did not run**, and **every acceptance criterion is met**. Anything else drafts.

It is written as that four-way conjunction and not reduced to the shortest expression equivalent to it today. An ending currently implies the middle two, so the reduction would be correct now and silently wrong later: a change that let a red suite through without ending the sub-lane would start producing ready pull requests, with no line to have got wrong.

**An ended sub-lane is never ready**, whatever its ledger says. The pipeline stopped before it could finish judging it, so it has nothing to be confident about.

**A `partial` criterion drafts alongside a `not-met` one.** Nobody watched the run, so "not demonstrably done" defaults to draft — exactly as the findings ledger and the suite gate already behave. A half-implemented criterion presenting as a ready pull request would reduce the signal to one line of ledger prose the merger may skim.

A draft is the honest signal that the pipeline could not finish its own job, and one rule covers all four exhaustion paths — same signal, same handling, one branch in the implementation. A human landing on a draft can see which trigger fired without opening anything else, because the pull request body already carries the findings ledger, the suite result, the per-criterion verdicts, and an ended sub-lane's explanation and attempt log.

**Work that exists stays reviewable.** Open findings, a red suite, or an ending mid-pipeline all open a draft rather than stranding the branch. Work that does not exist opens nothing — the last row, and a narrow case: the give-up path commits abandoned work as a `wip:` commit, so an ended sub-lane almost always has something ahead of its base. Only a sub-lane whose writer stopped before changing a file lands nothing.

**Every row is decided per sub-lane, from that sub-lane's own inputs.** Each is its own branch and its own pull request, so one sub-lane's draft never drafts another's.

**The pipeline sets state only on pull requests it created**, per the append-only invariant — it never converts one a human opened. The PR-comment input therefore needs no rule of its own here: with no issue there are no acceptance criteria, so no spec axis and no verdicts. It pushes, comments the ledger, and stops.

**Git is the authority on the Push column.** Whichever implementation computes a row proposes it from what the stages returned; the host then runs the ahead-of-base read above and defers to it. Nothing ahead ⇒ the last row, whatever was proposed. Something ahead of a sub-lane that reported no commits ⇒ a **draft** — only an ended sub-lane can propose the last row, and an ended sub-lane is never ready.

## Findings ledger (per lane; surfaced at the lane's conclusion and in the PR body)

- **fixed** — reviewer findings the writer applied.
- **won't-fix** — findings the writer disputed and the reviewer retracted, each with the writer's reason.
- **arbitrated** — contested findings the human ruled on, with the ruling. Always empty under unattended mode, where nobody rules — no conditional needed.
- **acceptance criteria** — the reviewer's `met|partial|not-met` verdict per criterion with its evidence, verbatim. Informational: nothing in the pipeline branches on it.
- **reviewer NOTES** — non-blocking observations, verbatim.
- **suite** — the gate's state: `passed`, `failed` with its failing test identifiers, or `not run` with why it did not. Never `passed` for a suite that did not run.
- **attempt log** — everything the pipeline did *after* something first went wrong, in order: each debug+fix attempt, each retry, each review fix cycle, each suite round, carrying what triggered it, what the debugger said, and how it ended. Stages that worked are already in the commit list and the categories above; repeating them buries the one entry that matters. Recorded on every sub-lane and rendered only on one that ended, so the loops append without branching.

## Sequencing

Lanes run in parallel. Within a lane: sub-lanes sequential, and within a sub-lane: plan commits sequential → review loop → suite gate → commit-breakdown check, then the lane conclusion. The breakdown check stays last so that it counts whatever the gate appended. Waves: a sub-lane based on a branch that receives its commits in wave N runs in wave N+1.

## Mode implementations

- **Mode W**: `phase-plan.js` (Phase A) and `phase-execute.js` (Phase B) run on the Workflow tool with the args documented in SKILL.md; their embedded JSON schemas mirror the return contracts above.
- **Mode A**: the orchestrator drives the Agent tool directly — one background agent per parallel unit (architects in Phase A, lanes in Phase B), sequential awaits inside a lane. Instruct each agent to end with its machine-readable leading lines exactly as its agent definition specifies, parse those as the contract keys, and enforce every bound, route, and ending in this file yourself.
- **Mode A is tier-locked, by construction.** Effort is settable only in an agent's frontmatter or in Mode W's per-call options, and the direct Agent tool has no effort parameter — so Mode A has no mechanism for varying effort and any future cost dial is Mode W-only. This is a property of the mode, not an oversight.
- **Unattended mode runs only under Mode W.** Intake refuses it in Mode A rather than degrading into it. Three reasons, each independently sufficient, recorded here so the rule is not re-litigated:
  1. **Per-stage effort is impossible in Mode A**, by the tier-lock above. An unattended run there would plan, write and review at exactly the tiers a supervised run uses — precisely the cost baseline it exists to beat. The effort dials *are* the cost thesis.
  2. **The notifier fires from inside the phase script**, because the host is blind while a script runs — a workflow script has no shell. Mode A's host is never blind, so the same notifications would need a second, differently shaped implementation.
  3. **Bound enforcement is mechanical in a script and merely remembered by a model otherwise.** Acceptable when a human is watching; not when nobody is.

  Mode A is kept for the supervised run, where none of the three bites. Its one real firing was a manual-recovery path — a human had driven a step by hand and the orchestrator continued in this mode, under these same contracts, to finish the lane. It is not a fallback for a missing tool.
