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

**The Agent column names each role's definition, not the string that dispatches it.** The same definition is registered under two different names depending on how it arrived: bare (`code-writer`) when it is linked into a repo's own `.claude/agents/`, and namespaced `<plugin>:<name>` (`ieuanign-skills:code-writer`) when the plugin is installed — which is the supported install path, so the namespaced form is the ordinary one and the bare form is the maintainer's. **A role is therefore always resolved against a namespace and never written as a literal.** The namespace is discovered once, at intake, by reading the roster the host already has in front of it; nothing derives it from a path, a package name or a manifest, so renaming the plugin or the marketplace needs no edit here.

Mode A resolves it implicitly — the host dispatches by the name its own roster lists, which is already correct, and there is nothing to pass. Mode W cannot: a workflow script sees no registry. The host passes the discovered namespace in the phase scripts' args, for the same reason it passes `skillDir` — both are facts the host can see and a script cannot. A phase script carrying a bare literal **runs only for the maintainer** and dies on its first dispatch for everyone who installed the plugin.

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
| reviewer | branch, base, plan path, **the issue body verbatim and whole**, **the acceptance criteria its sub-lane owns**, the writer's disputes | the plan, the diff of the touched files, the area's CLAUDE.md files, the repo's documented coding standards | `VERDICT`, `FINDINGS`, `CONTESTED`, **`CRITERIA`**, `NOTES` |
| debugger | the writer's return, worktree, branch | its own failure reproduction, the touched code | `ROOT-CAUSE`, `OWNER`, `CONFIDENCE`, `REPRODUCED`, a finding |
| suite gate | the repo profile's full-suite command, worktree, branch | nothing — it runs that one command and reads its output | `STATE`, `FAILING`, `OUTPUT` |

The suite gate is the one stage that reads nothing: no plan, no diff, no issue. That is what makes it the cheapest stage in the pipeline.

The architect alone sweeps the context documents and decision records — neither the writer nor the reviewer opens them. So the plan's Hard constraints section is the only channel by which anything living in those documents reaches the writer, which is why the architect is told to state such a rule rather than cite its source. The writer's other sources (the area's CLAUDE.md files, the touched module's manifests) it still reads for itself.

The architect's summary bullets are lane state, not gate state: retained from Phase A, they reach the PR body's Context section beside the planned-versus-made commit counts, whatever concludes the lane.

## Return contracts

Agents end with machine-readable leading lines; Mode W enforces the equivalent JSON schemas in the phase scripts, Mode A parses the lines. The keys are the contract — no verdict, no result.

- **architect**: `STATUS: READY|BLOCKED` + `PLAN: <path>` + summary bullets + open questions (BLOCKED only). The agent definition also carries a Mode 2 conformance sign-off; this pipeline never dispatches it.
- **writer**: `RESULT: COMMITTED|BLOCKED|FAILED` + `COMMITS` + `VERIFIED` + `DEVIATIONS` + `DISPUTED` (with each disputed finding restated with refuting evidence) + `DIRTY` + `WORKTREE` + `FAILING` (FAILED only).
- **reviewer**: `VERDICT: APPROVED|CHANGES_REQUESTED|ERROR` + `FINDINGS` (each: `file:line — defect — failure scenario — suggested fix`) + `CONTESTED` (disputed findings it still confirms) + `CRITERIA` (one `met|partial|not-met` verdict per acceptance criterion **the sub-lane owns**, in the issue's order, each with its evidence; empty when no issue body was passed, or when the sub-lane owns none) + `NOTES`. Zero findings ⇒ APPROVED, whatever the criterion verdicts say.
- **debugger**: `ROOT-CAUSE` + `OWNER: code-writer|replan|user|retry` + `CONFIDENCE` + `REPRODUCED`; when OWNER=code-writer, a finding in the reviewer's finding shape. `OWNER` carries **two routing values** — `code-writer` and `retry`, each naming the stage that runs next — and **two reporting values**, `replan` and `user`, which end the sub-lane identically and differ only in where they send the reader: `replan` back to the plan, `user` to their own machine, credentials or CI. Same pipeline behaviour, opposite next actions, which is why both are kept.
- **suite gate**: `STATE: passed|failed|not-run` + `FAILING` (the runner's own identifier per failing test — empty unless STATE is `failed`) + `OUTPUT` (the command's output). It is the one role with no agent definition to carry that format, so whichever mode dispatches it states the format itself — Mode W in its schema, Mode A in the prompt.
- **DIED** (any role): the call came back with nothing usable — nothing at all, or nothing parseable. Every DIED ends its sub-lane **FAILED** — a break, never a verdict. The architect is the one role that runs before any sub-lane exists: an architect DIED is reported at Gate 1 with a re-run offer instead. Never silently drop a requested issue.

  **A stage that returned nothing is reported as exactly that, and never as an agent that died.** From where the pipeline sits the two are indistinguishable: an agent skipped mid-run and an agent dead after the runner's own retries both resolve the call to nothing, and nothing is the whole of what the pipeline sees. So every ending produced by an empty return says the stage returned nothing and that it was skipped or died after the runner's retries — the same wording a lane whose result came back empty already carries, so one condition speaks with one voice. Asserting a death instead sends the reader looking for a crash that may never have happened, and it is the same restraint the crash handler already shows when it declines to promise a stack trace it does not hold.

  **The ending label is unchanged, and reclassifying a transient break is not to be re-proposed.** It stays **FAILED**, because that label answers exactly one question — *is this worth retrying?* — and a transport timeout is its clearest affirmative. There is no new label, no classification stage, and no agent dispatched to adjudicate a transport failure it could not reproduce. Calling it a halt would assert that something deliberately stopped, which is the one thing here known not to have happened.

  **A lane that throws is the same rule reaching the case it did not cover.** A terminal error can reject the call rather than return nothing, which unwinds the whole lane — so each lane's work is wrapped once, and a throw is caught and turned into a **FAILED** ending naming the issue and carrying the error message plus its stack trace where one exists. A dead agent frequently throws neither, and the reason says so rather than promising a trace that is empty. The lane's partial sub-results come back with it, attempt log included — that is the record most worth keeping from a lane that crashed mid-recovery — and each unfinished sub-lane takes the same ending, so it reaches the terminal-state table like any other. A thrown architect takes the DIED entry above for its issue. This is **mode-neutral**: a lane vanishing is a bug under `gated` too, where it shows up as a lane silently missing from the Gate 2 report. What the crashed lane's branch then *does* is Lane conclusion's, exactly as for every other ending — the label decides nothing here either, and `FAILED` answers only *is this worth retrying?*, to which a host throw is the case that most often says yes.

## Per-commit implement loop — bound: 2 debug+fix attempts

For each plan commit, in order:

1. writer Mode 1 implements the commit.
2. `FAILED` → debugger diagnoses (inside the writer's reported worktree). Route by OWNER:
   - `retry` → writer Mode 1 again (transient; cite the debugger's root cause).
   - `code-writer` → writer Mode 2 with the debugger's finding; afterwards the writer completes the original commit under Mode 1 rules if it was never committed.
   - `replan` or `user` → the sub-lane ends **HALT** immediately, carrying the diagnosis.
3. At most **2** debug+fix attempts per commit, then the sub-lane ends **HALT** — the commit was never produced.
4. `BLOCKED` → **HALT** with the writer's reason. Any other non-`COMMITTED` return after routing splits on the value it holds: `BLOCKED` is **HALT**, `FAILED` or a writer that returned nothing is **FAILED**.

The writer call of the **final permitted** debug+fix attempt, and no earlier one, carries one extra instruction: if it still cannot get green, commit what exists as `wip(<scope>): #<n> - commit <k> FAILED - <reason>` and return `FAILED` anyway. It is the only call after which the pipeline is certain to give up — on an earlier attempt the sub-lane may still succeed, and a `wip:` commit on a succeeding sub-lane would break what the rest of this file rests on: a `wip:` commit means an ended sub-lane with an incomplete commit list, which is why it is never reviewed and never gated. It is evidence, not work — listed among the sub-lane's commits so the human sees it, excluded from the made count, which would otherwise read `1 planned, 2 made` for a sub-lane that made one. The `replan`/`user` route carries no such instruction: no writer call follows it, and inventing one costs an agent call to produce a commit nobody asked for.

The instruction does not exempt that commit from the writer's own pre-commit hooks, and no mode may bypass them for it. In a repository whose hook demands a green suite the evidence commit cannot land, the writer returns `FAILED` with the work left dirty in its worktree, and the sub-lane ends exactly as it would have without the instruction — the evidence survives on the machine rather than on the branch. That is a smaller benefit, not a different ending, and it is the reason nothing downstream may assume the commit exists: the push decision asks git whether the branch is ahead of its base, never the reported commit list.

## Review loop — bound: progress-sensitive, under a hard ceiling of 5 fix cycles

On the sub-lane's exact range `<base>..<branch>` (the base may itself be a stacked feature branch — never review the base's own commits), with the issue body passed in so the reviewer runs its Spec axis:

1. reviewer runs; `ERROR` or DIED → the sub-lane ends **FAILED** — both are returns the loop cannot use, not verdicts about the code.
2. `CHANGES_REQUESTED` → writer Mode 2 applies the findings; it may DISPUTE findings it can refute, with evidence.
3. The re-review receives the disputes and re-verifies each:
   - retracted disputes become documented **won't-fix** entries in the lane's findings ledger;
   - still-confirmed disputes (`CONTESTED`) end the sub-lane **HALT** immediately — no further cycle is spent on an agent stalemate.
4. Either bound below firing ends the sub-lane **HALT** — the findings are still open. Both are checked after a `CHANGES_REQUESTED` review and **before that cycle's writer is dispatched**, so nothing is spent on a cycle that cannot run.
5. A fix-cycle writer return other than `COMMITTED` splits like the implement loop's: `BLOCKED` is **HALT**, `FAILED` or a writer that returned nothing is **FAILED**.
6. `APPROVED` → the review loop is done.

A review's range is one sub-lane, and so are the acceptance criteria it is handed. **Which criteria a sub-lane owns is a fact the plan states and the host applies**, never a judgement the reviewer makes at review time: on a plan holding two or more pull requests the architect names, on each pull request entry, the criteria that pull request delivers, and the host reads those off the section it already parses for commits and passes each reviewer only its own. Ownership is therefore decided once per run rather than re-derived on every review and every fix cycle. Criteria the plan left unlisted fall to the **last sub-lane in plan order** — last in the plan, never "the top of the chain", since a lane's sub-lanes are sequential but not necessarily stacked. That default is also what makes a plan written before ownership existed run unchanged.

The reviewer judges every criterion it owns against its own range — one range, one rule — and an owned criterion it cannot find is **`not-met`**. It receives the issue body verbatim and whole regardless: a checklist line rarely reads as its own specification, and the pipeline does not rewrite what a human wrote. A sub-lane owning no criteria returns an empty list and is vacuously met, which is the path the no-issue-body case already takes.

### The bound is progress-sensitive, under a hard ceiling

A flat count cannot tell a loop that is stuck from one that is working, and the flat count this replaces abandoned a lane one cycle from green. So the loop takes the shape the suite gate already has.

After a `CHANGES_REQUESTED` review the counter **advances by one unless a previously unseen finding appeared** — a new finding resets it to 1. At the repository profile's **Fix cycles** value the loop stops. That key is the **no-progress threshold**, not a flat cap; its default is `2`, and `0` still spends no fix cycle at all — its first `CHANGES_REQUESTED` ends the sub-lane with the findings open. It is a repository fact and reaches both implementations as a value, never as a literal.

```
cycle 1: {A, B, C}   all unseen                    → count 1
cycle 2: {A, B}      subset, nothing new           → count 2 → stop

cycle 1: {A}                                       → count 1
cycle 2: {B}         B unseen                      → reset to 1
cycle 3: {C}         C unseen (regression from B)  → reset to 1
cycle 4: {}          approved                      → done
```

The second trace is the motivating case: three cycles of genuine work, the third finding a regression the second's fix introduced. The first is the stuck case the threshold exists to cut — and note that it stops **earlier** than the flat bound it replaces. That is the division of labour: the threshold catches a loop repeating itself, and the ceiling does the ordinary bounding.

**The counter starts at 1, not 0** — the first `CHANGES_REQUESTED` round sets it whether or not that round brought anything new, exactly as the suite gate's does. So the threshold is a **position the counter reaches**, not a count of no-progress rounds tolerated: `2` ends the loop on the first round that repeats itself after a productive one. It follows that `1` behaves as `0` does — the counter is 1 the moment the first round returns, so the first `CHANGES_REQUESTED` ends the sub-lane and no fix cycle is spent. Both are supported answers; `0` is the one the ask offers for that intent.

A hard ceiling of 5 fix cycles applies regardless of progress, because a mis-compared finding list would look new every round and reset the counter forever. It is stated here and held as a constant in the phase script, and the two are compared by a drift check — the same hazard the cost-stage vocabulary is already checked for.

**Expect this to behave as a flat bound of 5 on most runs.** Independent reviewer invocations rarely word the same defect identically, so the threshold fires rarely. That is the design rather than a defect, and it is recorded here so that nobody later "fixes" the counter for not advancing.

The ceiling being 5 where the suite gate's is 8 encodes cost: a review cycle dispatches the two dearest agents in the pipeline, where a suite round is one cheap call running one command. **Token spend is reported, never enforced** below rests on a lane being bounded from five directions, one of them this one — a ceiling of 8 here would have weakened an argument that is load-bearing.

### Finding identity — what makes two findings the same finding

A round counts as no-progress only when **every** finding in it matches a prior round's. Two findings match when their **file and defect clause** match once normalised, **with the line number dropped**: a fix shifts lines, and a shifted line is not a new defect. Nothing else in a finding is compared — the failure scenario and the suggested fix are the reviewer's prose about a defect the first two clauses already name.

The comparison is deliberately conservative. Declaring two findings the same is what ends the loop early, so it is declared only on near-repetition; a reworded defect reads as new, and the cycle that costs is one the ceiling still bounds.

**It is the host's own arithmetic, in plain code, and no agent is dispatched to do it** — the same standing as the commit-breakdown check and the touchpoint intersection. The reviewer's return contract is unchanged: no new key, no finding identifier emitted by an agent, and nothing asked to classify its own findings as new or recurring.

### The escalation carries the trajectory

When the loop ends on either bound, the ending reason names **which bound fired** and states, per round, whether it brought previously-unseen findings or repeated prior ones. The same trajectory reaches the findings ledger and the attempt log. It costs nothing beyond recording what the counter already computed, and it is what lets a reader judge whether one more cycle was worth running before reading a line of the diff.

### This loop and the per-commit implement loop legitimately diverge

The implement loop keeps its flat bound of **2**, and that is deliberate rather than an inconsistency to tidy away. Its **give-up clause** instructs the writer of the final permitted attempt, and no earlier one, to commit abandoned work as evidence — which requires knowing at dispatch time that an attempt is the last. A progress-sensitive counter cannot supply that: firing late is impossible, because the counter only advances after a round returns, and firing early stamps abandonment on attempts that go on to succeed, which this file forbids in terms. Two lesser reasons point the same way — the implement loop's identity is free, being the writer's own `FAILING`, where a reviewer supplies prose; and its round is the cheaper of the two.

The `CRITERIA` verdicts pass straight through this loop untouched — the spec axis is **reported and never blocking**. A criterion verdict never enters `FINDINGS`, never changes the `VERDICT`, never triggers a fix cycle and never ends the lane: a not-met criterion means the plan lost something the issue asked for, and the only agent that could re-decide the plan is the architect, which does not run again in this lane. A review with zero findings and a not-met criterion is `APPROVED`. The last review's verdicts are the sub-lane's; they land in the findings ledger, which the lane's conclusion surfaces — and, under `unattended`, in the terminal-state table, which is the one place a verdict decides anything at all.

## Suite gate — bound: 8 rounds, and 2 rounds without a previously unseen failure

The writer runs lint and tests **scoped to the module it touched**, and nothing else in this pipeline runs the repository's own suite. So once a sub-lane's review loop settles, the lane runs that suite once, inside that sub-lane's worktree, before it concludes: a commit that reddened a module it never touched is caught here or nowhere. It runs in **both** modes.

**Once per sub-lane, not once per lane.** Sub-lanes are separate branches, worktrees and pull requests and can span layers, so every PR carries its own suite result. A lane with one sub-lane — the common case — runs it exactly once.

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
- a suite-fix writer returning `BLOCKED` — **HALT**; returning `FAILED`, or returning nothing — **FAILED**;
- the gate or the debugger returning nothing — **FAILED**.

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

**It was also unnecessary, and this is the load-bearing half.** A lane is already bounded in agent invocations from five directions: the per-commit debug-and-fix bound, the review loop's fix-cycle ceiling, the suite gate's ceiling, a commit count fixed by the plan, and the workflow runner's own backstop on total agents. Each loop's progress-sensitive threshold sits *inside* its ceiling and can only stop it sooner, so the count of directions is unchanged by one being added. Nothing here can loop forever. The most expensive lane in the measured set was not stuck — it was thirteen commits of genuine work against a median of three. A token ceiling would not have caught a runaway; it would have refused a big issue.

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
- Gate 2 for a layer fires before the next layer is provisioned, so a dependent layer is never built on a base the human has not vetted.

**unattended** — there is no human to conclude the lane, so the table above happens unprompted and notifications fire. Read `notifications.md` before emitting any notification: it governs every one of them, and nothing here restates it. Which endings open a **ready** pull request rather than a **draft** one is the terminal-state table below.

**Mode A implements the gated half only, and never the unattended half.** The unattended half therefore has exactly one implementation, which is what keeps this file's rule — a behaviour change edits the contract first, then both implementations in the same change — cheap to honour.

The four subsections that follow are not part of that branch. Push, stack linking and the worktree invariant are single-version and bind both modes; the terminal-state table is read only where the unattended half sends it.

### Push — once per sub-lane, at the end of its layer

A sub-lane's branch reaches the remote exactly once, and never before its own work is finished. A sub-lane that concluded clean pushes immediately before its pull request is created; one that ended performs that same single push, and what follows it is the mode table above. A lane with one sub-lane — the common case — therefore pushes once.

**The push is guarded on the branch being ahead of its base, read from git.** A sub-lane that ended before it committed anything has nothing to push, and a push attempted anyway is an error the run does not need. This is the same read the exception above rests on, made once and used for both decisions.

**Never a force-push, in either mode.** Fix cycles append commits and a resumed lane derives its already-done commits from the git log, so every push this pipeline makes is a fast-forward. There is consequently no case in which forcing is the fix, and no ceiling, ending or absent human that unlocks it. A rejected push stops that sub-lane's conclusion where it stands: no pull request is created, the worktree is **kept**, and git's own message is reported verbatim. It is reported **FAILED** — the pipeline's own assumption broke, which is a break and not a verdict about the code. In a repository whose habit is to rebase, the commonest real cause is a human having rebased or amended inside the lane's worktree while it ran. The pipeline cannot know whether the remote history or the rewritten local one is the keeper, and the worktree it just kept is where the human resolves that — which is the whole reason a rejection reports rather than retries harder.

**Per-commit push is not implementable, and is not to be re-proposed.** The whole commit loop runs inside a single workflow call and a workflow script has no shell, so the host's first control point is that call returning. Reaching it otherwise would mean either changing the writer's contract — it never pushes — or spending an agent invocation on one git command, which the skill's hard rules forbid in terms. Nothing in this pipeline consumes an intermediate push either — the reviewer diffs local refs — so the only thing one could feed is a repository's own push-triggered CI, which gains nothing from being run against a branch the pipeline is still committing to.

**Accepted cost, recorded rather than solved.** This version is always one layer, so the end of a layer is the end of the run: a three-issue batch holds the first-finished sub-lane's pull request until the slowest one ends. Rejected: one workflow call per lane launched in the background, which buys per-lane immediacy at the cost of the host juggling several background tasks, each carrying its own concurrency cap independently.

### Stack linking — once per batch, after every pull request exists

A batch whose sub-lanes stack finishes by telling GitHub they form a stack, so that the ordering is data the platform holds rather than a sentence in a pull request body. The base chaining, the bodies and the stacked note are unchanged and still carry the run: linking is **additive**, and everything below is what keeps it that way.

**The call fires at the very end of the batch** — after every sub-lane of every lane has pushed and opened its pull request, and never per layer. A stack is a property of the finished batch, and a half-linked stack is worse than none: it would show a reviewer a chain that stops short of the work. Gate 2 runs once per layer, so a stacked batch reaches it more than once; only the **last** of those does this.

**One call per chain, not one per batch.** The arguments are a single stack, bottom to top — and a batch is not necessarily one stack. A batch whose layer 1 holds two independent lanes and whose layer 2 holds a sub-lane stacked on one of them contains one chain of two and one chain of one; handing all three pull requests to a single call would assert that the independent lane is what the top layer builds on, which is a claim the pipeline never made and a reviewer would have no way to disbelieve. So the host walks each maximal chain of the base relation and links that chain. A chain of **fewer than two** pull requests is not a stack and is skipped, which is why the ordinary unstacked batch — every lane on the trunk, every chain of length one — makes no call at all.

**A gap in a chain is shown, never closed up.** A sub-lane that ended with nothing ahead of its base opens no pull request at all — the terminal-state table's last row — while the sub-lane above it is still based on its branch. Walking the base relation naively would then hand the link the two pull requests either side of that hole and assert that the upper one is stacked on the lower, which is a claim the pipeline never made and a reviewer has no way to disbelieve. So the walk **stops at a sub-lane with no pull request**: the contiguous run below the gap is one chain, the contiguous run above it is another, each is linked on its own if it holds two or more, and the gap is reported alongside them naming the sub-lane that produced no pull request. A shorter chain than the batch planned is a fact about the run, and it is reported as one.

**The pull requests are identified by number, bottom to top.** Never by branch name. Given branch names the tool pushes them and opens pull requests of its own, with its own titles and bodies — which would fight the profile's title format, overwrite the body template, and cost the run the `Closes #<n>`, the summary bullets and the findings ledger it just composed. Given numbers it adopts the pull requests that already exist and adds nothing. This is the difference between the feature being additive and the feature being a second, competing author.

**Ready-for-review is never requested.** The tool can mark the pull requests in a stack ready; the run must never ask it to. Draft-versus-ready is decided by the terminal-state table from each sub-lane's own inputs, and a batch-wide flag applied at link time would override every one of those decisions from the wrong place — promoting a draft the pipeline drafted deliberately.

**No local state, in either direction.** The link writes no local tracking state and changes no branch, which is what makes it safe to run while lane worktrees still hold those branches checked out. Linked worktrees share one common git directory, so any command that *did* keep local stack state would have every concurrent lane racing over the same files; this one does not, and nothing here may be swapped for a command that does.

**A machine without the tool behaves exactly as it does today.** The linking sits behind one bundled script, which detects the tool's absence and exits having called nothing. No gate checks for it, no precondition asks about it, no run fails or prompts for want of it, and the batch concludes with its bases chained by branch name and the stack noted in the body — which is the whole of today's behaviour. The pipeline stays copyable to any machine, and the stack is a bonus where it is available.

**A failed link is reported and costs nothing else.** It leaves every pull request exactly as the run created it — title, body, draft state and base — because the tool either records the stack or does not, and never half-edits the pull requests to get there. The failure is reported with the tool's own message verbatim; no sub-lane's ending changes, no worktree decision changes, and nothing is retried. Losing the stack never costs the run the work.

Neither mode is exempt and neither differs: this subsection is single-version, and the two conclusions call the same script with the same arguments.

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

A removed worktree is not lost work **for anything tracked**: a resumed lane re-provisions from the branch, which the provisioning step already documents for exactly this case. Its ignored files are another matter, and the next rule is the whole of what this invariant says about them.

**Removal destroys the worktree's ignored files, deliberately — and says which ones first.** The dirty-worktree rule above is a guard against losing *tracked* work, and it has nothing to say here: `git worktree remove` deletes ignored files without complaint and `git status --porcelain`, the signal every refusal path reads, does not list them either. So a sub-lane's gitignored output — scratch checks, generated fixtures, captured logs, coverage — is destroyed the moment its branch is pushed, and that is the intent rather than an oversight. It is working material. Cleaning it up is a reason to remove the worktree, not a cost of doing so, and the alternatives were weighed and rejected: keeping the worktree strands one per sub-lane that writes anything and cleanup mode removes none of them, and copying the files back writes throwaway output into the main checkout, where nothing ever reaps it.

What was wrong was only that the loss was **silent**, including when the plan's own acceptance criteria asked for the artifact — the pipeline could require a file at a path it was about to delete, then report the lane clean. So the conclusion **names what it destroys before destroying it**, from the plan's File touchpoints, in the run's report and in the pull request body. Both, because they reach different people: an unattended run has nobody reading the first, and the worktree the report describes is gone moments later, so the pull request is the only copy that outlives the run. The durable-artifact rule then follows from that report rather than from any mechanism:

> A path that must outlive its sub-lane is committed. Being tracked is what makes it survive, and it is also what takes it off this list.

An architect writing a plan applies the same rule in advance — a gitignored touchpoint is named as work the sub-lane does, never as a deliverable something later expects to find.

### The terminal-state table — ready, draft, or no pull request

Under supervision a human at Gate 2 decides what a sub-lane's ending means: they read the commit list, the findings ledger and the criterion verdicts, and arbitrate anything contested. Remove that human and nothing decides it — a sub-lane with open findings, a red suite or an unmet criterion would open exactly the pull request a clean one opens. This table decides it instead, and it is read under **unattended** only: under `gated` every one of these outcomes goes in front of the human, who decides.

| A sub-lane ends | Push | Pull request |
|---|---|---|
| Clean | yes | **ready** |
| Suite not-run, no open findings, all owned criteria met | yes | **ready**, the ledger recording not-run |
| Open findings after the fix-cycle bound | yes | **draft** + the ledger |
| Suite still red at the gate's ceiling | yes | **draft** + the ledger |
| Any acceptance criterion the sub-lane **owns** is `partial` or `not-met` | yes | **draft** + the verdicts |
| Ended `HALT` or `FAILED`, with commits | yes | **draft** + the ledger + the attempt log |
| Ended with nothing landed | no — nothing is ahead of the base | **none**; the explanation is commented on the issue |

**The ready predicate is one expression**: the sub-lane **concluded clean**, and its **findings are resolved**, and the **suite passed or did not run**, and **every acceptance criterion the sub-lane owns is met**. Anything else drafts.

The predicate itself does no filtering and gained no clause when ownership arrived: it sees only the criteria the sub-lane owns because those are the only ones its reviewer was ever asked about. A sub-lane that did its whole job cleanly therefore opens a **ready** pull request even where the issue was split — which, before ownership, no sub-lane of a split issue could.

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
- **acceptance criteria** — the reviewer's `met|partial|not-met` verdict per criterion **the sub-lane owns**, with its evidence, verbatim. Reported rather than inert: no review, fix cycle or ending turns on a verdict, but under `unattended` the terminal-state table drafts the pull request on any verdict that is not `met`.
- **reviewer NOTES** — non-blocking observations, verbatim.
- **review trajectory** — on a sub-lane whose review loop ended on either of its bounds: one entry per review round saying whether it brought previously-unseen findings or repeated prior ones. Recorded on every sub-lane and rendered only where a bound ended one, like the attempt log. It answers the question a bare count leaves open — *was this loop converging?* — before anyone opens the diff.
- **suite** — the gate's state: `passed`, `failed` with its failing test identifiers, or `not run` with why it did not. Never `passed` for a suite that did not run.
- **attempt log** — everything the pipeline did *after* something first went wrong, in order: each debug+fix attempt, each retry, each review fix cycle, each suite round, carrying what triggered it, what the debugger said, and how it ended. Stages that worked are already in the commit list and the categories above; repeating them buries the one entry that matters. Recorded on every sub-lane and rendered only on one that ended, so the loops append without branching.

## Sequencing

Lanes run in parallel. Within a lane: sub-lanes sequential, and within a sub-lane: plan commits sequential → review loop → suite gate → commit-breakdown check, then the lane conclusion. The breakdown check stays last so that it counts whatever the gate appended.

**Layers and stacks are different shapes, and the pipeline has both.** A **layer** is horizontal: the set of sub-lanes that run concurrently, all of them based on branches that already hold their commits. A **stack** is vertical: a chain of branches each based on the one below, sitting on a **trunk** — the default branch — with a **bottom** layer directly on that trunk and a **top** layer nothing is based on. A layer holding three independent sub-lanes is not a stack at all, which is why one word cannot serve for both: "layer 2 runs after layer 1" says two levels of one stack, where "stack 2 runs after stack 1" would say the opposite.

**The layer rule**: anything based on the trunk runs in **layer 1**; anything based on a branch that receives its commits in **layer N** runs in **layer N+1**.

### Touchpoint overlap — three outcomes, and only one of them is a dependency

What puts a sub-lane in a layer above the bottom is this classification, so it belongs here. The host intersects the plans' File touchpoints across lanes and sorts each overlap into exactly one of three outcomes:

| Outcome | What it is | Layer | Based on | Dependency claimed |
|---|---|---|---|---|
| **additive co-touch** | both lanes append to the same registry, route table or barrel file, at different places in it | same layer — both stay parallel | the trunk | no |
| **same-region co-touch** | both lanes edit the same *region* of the same file | the later lane drops to the next layer | the earlier lane's branch | **no** |
| **real dependency** | B consumes what A creates | B drops to the next layer | A's branch | **yes** |

**The classification is the host's own work, in plain reading, and no agent is dispatched to do it.** One architect runs per issue, in parallel, and none can see another lane's plan — so the intersection is inherently cross-lane and inherently the host's. This is not a cost decision that could be revisited by paying for a better agent; there is no agent in this pipeline that holds the inputs.

**Additive co-touch stays parallel and accepts the rebase.** Two lanes appending to the same registry do not conflict semantically and usually do not conflict textually; where they do, it is the trivial kind git resolves or a human fixes in a minute. Serialising them would cost a whole layer of wall-clock to avoid that.

**The line between the first two outcomes is the repository's to move, and only that line.** A repository whose shared registry files churn constantly serialises lanes it did not need to; one whose overlaps are always semantically real wants the opposite. Both are facts about a repository's file topology, so the repository declares them, in the **Overlapping changes** section of its `.claude/rules/pr-separation.md`:

| Declared | Where the line sits |
|---|---|
| `additive` (the default, and what an absent declaration means) | co-touch at different places in a file stays in one layer; same-region drops a layer |
| `strict` | any co-touch at all drops a layer, without classifying the region |
| `parallel` | no co-touch drops a layer; the conflict is left for whoever merges |

**A real dependency is never declarable and never moves.** B consuming what A creates puts B in the next layer whatever the repository says, because the alternative is a pull request that does not build against its base. A declaration that reads as covering it is read as covering the first two outcomes only.

`parallel` is the one value that ships a known conflict rather than avoiding one — the same cost this file already accepts under **Two accepted costs** for a misclassified overlap, chosen deliberately there instead of discovered. It is offered because the cost is bounded and lands where a merge conflict always lands, and it is not the default for the same reason it is not free.

The declaration reaches the host ambiently: project rules load at launch, so no step fetches this file and no profile key mirrors it. **The classification stays single-version across both execution modes** — it is the host's plain reading either way, and the declaration changes which outcome an overlap sorts into, never who does the sorting.

**The last two outcomes are physically identical and differ in what they claim.** Both put the later lane in the next layer, based on the branch below, so both produce the same branch shape and the same pull request base — and both therefore reach the same stack. What separates them is the assertion: a **real dependency** posts the discovered-blocker comment to the dependent issue, recording *why* the lane was stacked where the work is tracked; a **same-region co-touch** posts nothing, because there is no blocker to discover. B does not need A. It merely cannot edit the same lines at the same time.

That distinction is the point of having three outcomes rather than two. Collapsing same-region into dependency would tell a reviewer that B builds on A when it does not, and would leave a permanent, wrong comment on B's issue. Collapsing it into additive would send two lanes at the same lines concurrently and hand someone a conflict the pipeline could have avoided for free.

**A same-region co-touch says so where a human can see it.** The reason it was sequenced is stated at Gate 1 alongside the layer assignment — sequenced to avoid a textual conflict, not because one lane needs the other — so nobody reading the batch's shape infers a dependency the pipeline never found.

Sequencing a same-region co-touch is what *avoids* the conflict rather than merely deferring it: the later lane branches from the earlier one, so its writer opens the file with the earlier edit already in it and edits the text as it will actually land. A later layer based on the trunk instead would hit the same conflict at merge time, one layer later.

#### Unattended runs classify identically, and take the recommended remedy

This is smaller than it looks, because the supervised path never asked a human to *classify* an overlap. The host does the intersection and the classification itself, with no agent and no prompt, and the human is handed only the **remedy**, and only in the dependency case. So there is no new judgement stage here and no extra agent: an unattended run performs the same intersection over the same File touchpoints, applies the same three outcomes, and reaches the same layer assignment.

**The dependency case takes the option the supervised path already marks recommended: B is stacked on A.** Not a new decision — the same one, with its default taken rather than confirmed.

**The defer remedy is absent, and this is the reason rather than an oversight.** "Defer B out of this batch" is a human's *not this batch* — a scheduling judgement about what they want to review this afternoon, made from context the pipeline does not hold. Unattended there is nobody whose afternoon it is, and deferring a lane the developer explicitly asked for would silently return less work than was requested. So it drops out, and the recommended remedy is the only one.

**The discovered-blocker comment is posted identically.** It was already a machine action under supervision, and it carries over unchanged — so the reason a lane was stacked is recorded where the work is tracked, on a run nobody watched. The same-region outcome still posts nothing, for the same reason it posts nothing under supervision.

The batch's conclusion then links the stack through the same script, with the same absent-extension fallback, per **Stack linking** above — that subsection is single-version and neither mode is exempt from it.

**Two accepted costs, recorded rather than solved.** Both are real, both are bounded, and neither is worth an engineering answer:

- **A misclassification is unattended.** If a real dependency is read as additive, the two lanes run in the same layer and B's worktree never contains A's code. That surfaces as a **red suite gate or a failed writer in B's lane** — an attributable, bounded failure the existing debugger path already handles, ending that sub-lane with its diagnosis and its attempt log. It is not a silent bad merge, which is the failure worth engineering against.
- **A same-region co-touch read as additive still conflicts when someone merges.** The unattended run's job ends at the pull request, so that conflict lands on the human doing the merge — **exactly where it lands today**, and exactly where it would land under supervision if the human accepted the same reading.

Neither cost is unique to unattended mode; what is unique is that nobody is watching when it happens, which is why both are named here rather than left to be discovered.

## Mode implementations

- **Mode W**: `phase-plan.js` (Phase A) and `phase-execute.js` (Phase B) run on the Workflow tool with the args documented in SKILL.md; their embedded JSON schemas mirror the return contracts above.
- **Mode A**: the orchestrator drives the Agent tool directly — one background agent per parallel unit (architects in Phase A, lanes in Phase B), sequential awaits inside a lane. Instruct each agent to end with its machine-readable leading lines exactly as its agent definition specifies, parse those as the contract keys, and enforce every bound, route, and ending in this file yourself.
- **Mode A is tier-locked, by construction.** Effort is settable only in an agent's frontmatter or in Mode W's per-call options, and the direct Agent tool has no effort parameter — so Mode A has no mechanism for varying effort and any future cost dial is Mode W-only. This is a property of the mode, not an oversight.
- **Unattended mode runs only under Mode W.** Intake refuses it in Mode A rather than degrading into it. Three reasons, each independently sufficient, recorded here so the rule is not re-litigated:
  1. **Per-stage effort is impossible in Mode A**, by the tier-lock above. An unattended run there would plan, write and review at exactly the tiers a supervised run uses — precisely the cost baseline it exists to beat. The effort dials *are* the cost thesis.
  2. **The notifier fires from inside the phase script**, because the host is blind while a script runs — a workflow script has no shell. Mode A's host is never blind, so the same notifications would need a second, differently shaped implementation.
  3. **Bound enforcement is mechanical in a script and merely remembered by a model otherwise.** Acceptable when a human is watching; not when nobody is.

  Mode A is kept for the supervised run, where none of the three bites. Its one real firing was a manual-recovery path — a human had driven a step by hand and the orchestrator continued in this mode, under these same contracts, to finish the lane. It is not a fallback for a missing tool.
