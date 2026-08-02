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

## Review loop — bound: maxFixCycles = 2

On the sub-lane's exact range `<base>..<branch>` (the base may itself be a stacked feature branch — never review the base's own commits), with the issue body passed in so the reviewer runs its Spec axis:

1. reviewer runs; `ERROR` or DIED → the sub-lane ends **FAILED** — both are returns the loop cannot use, not verdicts about the code.
2. `CHANGES_REQUESTED` → writer Mode 2 applies the findings; it may DISPUTE findings it can refute, with evidence.
3. The re-review receives the disputes and re-verifies each:
   - retracted disputes become documented **won't-fix** entries in the lane's findings ledger;
   - still-confirmed disputes (`CONTESTED`) end the sub-lane **HALT** immediately — no further cycle is spent on an agent stalemate.
4. At most **2** fix cycles, then **HALT** — the findings are still open.
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

## Lane conclusion — the only branch point in this file

Every other section of this contract is single-version: both modes implement it identically. This section is the one place the two are described separately, and a behaviour change that differs by mode belongs here or nowhere. It is also where an ending's label stops mattering: nothing below reads it, and a sub-lane that stopped and one that broke are disposed of identically.

An ended sub-lane's disposition is decided by mode, and decided per sub-lane. The two modes are **gated** and **unattended** — `auto` is the token a developer types for the unattended one.

| | gated | unattended |
|---|---|---|
| Push | at Gate 2, on the human's approval | yes |
| Pull request | none by default — Gate 2 offers "open a draft PR anyway?" | draft |
| Worktree | kept, for review or resume | removed |
| Explanation | the CLI response | the pull request body |

The explanation is identical in both: what stopped or what broke, its stage, the diagnosis if a debugger produced one, and the attempt log in order. Mode changes where it is written, never what it says.

**One exception, and only one.** A sub-lane where nothing landed at all — the writer stopped before changing a file, so there is not even a `wip:` commit — has no branch ahead of its base: nothing to push, and no pull request to open. Whether the branch is ahead is read from git, never inferred from a reported commit list. Under unattended its explanation is commented on the issue instead, which the append-only invariant permits. This is the only ending in the pipeline that opens no pull request.

**gated** — a human concludes the lane.

- A clean sub-lane reaches Gate 2 for push/PR approval. Nothing is pushed without it, and an ended sub-lane is *offered* there rather than pushed around it. The suite result is on it, so the human approving a push sees a green suite rather than assuming one.
- An ended sub-lane carries what is still open to that gate. On contested findings the human arbitrates: uphold → targeted writer fix and resume the lane; accept → documented won't-fix. Either ruling lands in the ledger's **arbitrated** category. On an exhausted fix-cycle bound the human reads the open findings and decides whether to push anyway.
- Gate 2 for a wave fires before the next wave is provisioned, so a dependent wave is never built on a base the human has not vetted.

**unattended** — there is no human to conclude the lane, so the table above happens unprompted and notifications fire. Read `notifications.md` before emitting any notification: it governs every one of them, and nothing here restates it. Which endings open a ready pull request rather than a draft one is the terminal-state table's, specified separately.

**Mode A implements the gated half only, and never the unattended half.** The unattended half therefore has exactly one implementation, which is what keeps this file's rule — a behaviour change edits the contract first, then both implementations in the same change — cheap to honour.

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
