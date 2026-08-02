# /dev-loop contracts — the normative state machine

This file is the single source of truth for the pipeline's role contracts, bounds, and terminal categories. Both execution modes implement it: **Mode W** (Workflow tool running `phase-plan.js` / `phase-execute.js`) and **Mode A** (direct Agent-tool orchestration). Any behavior change edits THIS file first, then both implementations in the same change. If an implementation and this file disagree, this file governs.

## Roles

| Role | Agent | Product | Mutates the repo? |
|---|---|---|---|
| architect | architecture-engineer | Mode 1: plan file | `.scratch/` only |
| writer | code-writer | Mode 1: one plan commit; Mode 2: fix commits (may DISPUTE findings) | local commits in its worktree |
| reviewer | reviewer | verified findings on a range | never |
| debugger | debugger | root cause + owner routing | never |

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

The architect alone sweeps the context documents and decision records — neither the writer nor the reviewer opens them. So the plan's Hard constraints section is the only channel by which anything living in those documents reaches the writer, which is why the architect is told to state such a rule rather than cite its source. The writer's other sources (the area's CLAUDE.md files, the touched module's manifests) it still reads for itself.

The architect's summary bullets are lane state, not gate state: retained from Phase A, they reach the PR body's Context section beside the planned-versus-made commit counts, whatever concludes the lane.

## Return contracts

Agents end with machine-readable leading lines; Mode W enforces the equivalent JSON schemas in the phase scripts, Mode A parses the lines. The keys are the contract — no verdict, no result.

- **architect**: `STATUS: READY|BLOCKED` + `PLAN: <path>` + summary bullets + open questions (BLOCKED only). The agent definition also carries a Mode 2 conformance sign-off; this pipeline never dispatches it.
- **writer**: `RESULT: COMMITTED|BLOCKED|FAILED` + `COMMITS` + `VERIFIED` + `DEVIATIONS` + `DISPUTED` (with each disputed finding restated with refuting evidence) + `DIRTY` + `WORKTREE` + `FAILING` (FAILED only).
- **reviewer**: `VERDICT: APPROVED|CHANGES_REQUESTED|ERROR` + `FINDINGS` (each: `file:line — defect — failure scenario — suggested fix`) + `CONTESTED` (disputed findings it still confirms) + `CRITERIA` (one `met|partial|not-met` verdict per acceptance criterion in the issue body, in the issue's order, each with its evidence; empty when no issue body was passed) + `NOTES`. Zero findings ⇒ APPROVED, whatever the criterion verdicts say.
- **debugger**: `ROOT-CAUSE` + `OWNER: code-writer|replan|user|retry` + `CONFIDENCE` + `REPRODUCED`; when OWNER=code-writer, a finding in the reviewer's finding shape.
- **DIED** (any role): the agent crashed or returned nothing parseable. An architect DIED is reported at Gate 1 with a re-run offer; any other DIED ends the lane **HALT**. Never silently drop a requested issue.

## Per-commit implement loop — bound: 2 debug+fix attempts

For each plan commit, in order:

1. writer Mode 1 implements the commit.
2. `FAILED` → debugger diagnoses (inside the writer's reported worktree). Route by OWNER:
   - `retry` → writer Mode 1 again (transient; cite the debugger's root cause).
   - `code-writer` → writer Mode 2 with the debugger's finding; afterwards the writer completes the original commit under Mode 1 rules if it was never committed.
   - `replan` or `user` → **HALT** the lane immediately with the diagnosis.
3. At most **2** debug+fix attempts per commit, then **HALT** — the commit was never produced.
4. `BLOCKED` → **HALT** with the writer's reason. Anything other than `COMMITTED` after routing → **HALT**.

## Review loop — bound: maxFixCycles = 2

On the sub-lane's exact range `<base>..<branch>` (the base may itself be a stacked feature branch — never review the base's own commits), with the issue body passed in so the reviewer runs its Spec axis:

1. reviewer runs; `ERROR` or DIED → **HALT**.
2. `CHANGES_REQUESTED` → writer Mode 2 applies the findings; it may DISPUTE findings it can refute, with evidence.
3. The re-review receives the disputes and re-verifies each:
   - retracted disputes become documented **won't-fix** entries in the lane's findings ledger;
   - still-confirmed disputes (`CONTESTED`) end the lane **UNRESOLVED** immediately — no further cycle is spent on an agent stalemate.
4. At most **2** fix cycles, then **UNRESOLVED** — the code exists and its findings are still open.
5. A fix-cycle writer return other than `COMMITTED` → **HALT**.
6. `APPROVED` → the review loop is done.

A review's range is one sub-lane, but the acceptance criteria belong to the whole issue, so the reviewer is told which sub-lane it is judging. A criterion the plan delivers in a different sub-lane is outside this range and is recorded `partial` with that stated — never `not-met`, which would make every early PR of a multi-PR plan read as a failure of work not yet due.

The `CRITERIA` verdicts pass straight through this loop untouched — the spec axis is **reported and never blocking**, by the same reasoning as the commit-breakdown check below. A criterion verdict never enters `FINDINGS`, never changes the `VERDICT`, never triggers a fix cycle and never ends the lane: a not-met criterion means the plan lost something the issue asked for, and the only agent that could re-decide the plan is the architect, which does not run again in this lane. A review with zero findings and a not-met criterion is `APPROVED`. The last review's verdicts are the sub-lane's; they land in the findings ledger, which the lane's conclusion surfaces.

## Commit-breakdown check — the host's own work, no agent

At the end of a sub-lane the host compares two lists it already holds: the plan's commit ordinals, which it passed in as arguments, and the shas and messages every writer return carried back. This is a list diff in plain code — no agent is dispatched to notice it, and none is paid to.

The result is carried as `<n> planned, <m> made`, both scoped to the ordinals this run was asked to make — on a resumed lane that is the remainder, not the plan's grand total, which still detects a split or an append. A mismatch is **reported and never blocks**: it does not halt the lane, does not trigger a fix cycle, and does not change the terminal state. Fix cycles legitimately append commits and a writer may legitimately split one, so the count is information for the human merging the PR, not a halt condition.

## Terminal categories — HALT and UNRESOLVED

Every ending above is exactly one of two categories. The distinction is **does reviewable code exist at the end**, not severity.

- **HALT** — the lane is dead. Nothing reviewable exists, so no PR is created. Six endings produce it: the debugger routing to `replan` or `user`; the per-commit debug+fix bound exhausted; the writer returning `BLOCKED`; any writer return other than `COMMITTED` after debug routing; the reviewer returning `ERROR` or dying; a fix-cycle writer returning anything other than `COMMITTED`. Any other agent DIED is the same category, by the DIED rule in Return contracts above.
- **UNRESOLVED** — the code exists and is simply not clean. The lane finishes anyway, and its conclusion decides what that means. Two endings produce it: contested findings the reviewer still confirms after re-verifying the writer's evidence; the fix-cycle bound exhausted while the reviewer still requests changes.

These are the only two. Every reason the pipeline reports names its category in these words, so a reported reason maps to a line above without translation, and the two are surfaced to the human as visibly different outcomes: HALT says the lane died and there is nothing to review, UNRESOLVED says the lane finished with findings still open.

Every loop above is bounded — nothing retries indefinitely. Neither category kills the batch: report the stage, the verbatim contract lines that produced the ending, and the exact resume command (`/dev-loop <n>` re-derives everything from artifacts). A lane whose base lane ended in either category — or was held by the user — never runs at all, so it **HALT**s with that reason: nothing reviewable exists for it either.

## Lane conclusion — the only branch point in this file

Every other section of this contract is single-version: both modes implement it identically. This section is the one place the two are described separately, and a behaviour change that differs by mode belongs here or nowhere.

**gated** — the default: a human concludes the lane.

- A clean lane reaches Gate 2 for push/PR approval. Nothing is pushed without it.
- An `UNRESOLVED` lane reaches Gate 2 too, carrying what is still open. On contested findings the human arbitrates: uphold → targeted writer fix and resume the lane; accept → documented won't-fix. Either ruling lands in the ledger's **arbitrated** category. On an exhausted fix-cycle bound the human reads the open findings and decides whether to push anyway.
- A `HALT` lane is reported with its stage, the verbatim contract lines, and its resume command. No PR.
- Gate 2 for a wave fires before the next wave is provisioned, so a dependent wave is never built on a base the human has not vetted.

**unattended** — the mode a developer asks for by typing `auto`. There is no human to conclude the lane: the gates ask nothing, so the terminal-state table governs what each ending produces, and notifications fire. Both are specified separately; this is the section they fill. Read `notifications.md` before emitting any notification: it governs every one of them, and nothing here restates it. The terminal-state table is still specified separately from both. Which questions stop and which gate work continues is SKILL.md's gate-suppression constant, stated in one place there and not restated here.

**Mode A implements the gated half only, and never the unattended half.** The unattended half therefore has exactly one implementation, which is what keeps this file's rule — a behaviour change edits the contract first, then both implementations in the same change — cheap to honour.

## Findings ledger (per lane; surfaced at the lane's conclusion and in the PR body)

- **fixed** — reviewer findings the writer applied.
- **won't-fix** — findings the writer disputed and the reviewer retracted, each with the writer's reason.
- **arbitrated** — contested findings the human ruled on, with the ruling. Always empty under unattended mode, where nobody rules — no conditional needed.
- **acceptance criteria** — the reviewer's `met|partial|not-met` verdict per criterion with its evidence, verbatim. Informational: nothing in the pipeline branches on it.
- **reviewer NOTES** — non-blocking observations, verbatim.

## Sequencing

Lanes run in parallel. Within a lane: sub-lanes sequential, and within a sub-lane: plan commits sequential → review loop → commit-breakdown check. Waves: a sub-lane based on a branch that receives its commits in wave N runs in wave N+1.

## Mode implementations

- **Mode W**: `phase-plan.js` (Phase A) and `phase-execute.js` (Phase B) run on the Workflow tool with the args documented in SKILL.md; their embedded JSON schemas mirror the return contracts above.
- **Mode A**: the orchestrator drives the Agent tool directly — one background agent per parallel unit (architects in Phase A, lanes in Phase B), sequential awaits inside a lane. Instruct each agent to end with its machine-readable leading lines exactly as its agent definition specifies, parse those as the contract keys, and enforce every bound, route, and terminal category in this file yourself.
- **Mode A is tier-locked, by construction.** Effort is settable only in an agent's frontmatter or in Mode W's per-call options, and the direct Agent tool has no effort parameter — so Mode A has no mechanism for varying effort and any future cost dial is Mode W-only. This is a property of the mode, not an oversight.
- **Unattended mode runs only under Mode W.** Intake refuses it in Mode A rather than degrading into it. Three reasons, each independently sufficient, recorded here so the rule is not re-litigated:
  1. **Per-stage effort is impossible in Mode A**, by the tier-lock above. An unattended run there would plan, write and review at exactly the tiers a supervised run uses — precisely the cost baseline it exists to beat. The effort dials *are* the cost thesis.
  2. **The notifier fires from inside the phase script**, because the host is blind while a script runs — a workflow script has no shell. Mode A's host is never blind, so the same notifications would need a second, differently shaped implementation.
  3. **Bound enforcement is mechanical in a script and merely remembered by a model otherwise.** Acceptable when a human is watching; not when nobody is.

  Mode A is kept for the supervised run, where none of the three bites. Its one real firing was a manual-recovery path — a human had driven a step by hand and the orchestrator continued in this mode, under these same contracts, to finish the lane. It is not a fallback for a missing tool.
