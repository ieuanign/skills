# /dev-loop contracts — the normative state machine

This file is the single source of truth for the pipeline's role contracts, bounds, and halt conditions. Both execution modes implement it: **Mode W** (Workflow tool running `phase-plan.js` / `phase-execute.js`) and **Mode A** (direct Agent-tool orchestration). Any behavior change edits THIS file first, then both implementations in the same change. If an implementation and this file disagree, this file governs.

## Roles

| Role | Agent (lite swap only when the user said `lite`) | Product | Mutates the repo? |
|---|---|---|---|
| architect | architecture-engineer / architecture-engineer-lite | Mode 1: plan file; Mode 2: conformance sign-off | `.scratch/` only |
| writer | code-writer / code-writer-lite | Mode 1: one plan commit; Mode 2: fix commits (may DISPUTE findings) | local commits in its worktree |
| reviewer | reviewer | verified findings on a range | never |
| debugger | debugger | root cause + owner routing | never |

## Return contracts

Agents end with machine-readable leading lines; Mode W enforces the equivalent JSON schemas in the phase scripts, Mode A parses the lines. The keys are the contract — no verdict, no result.

- **architect Mode 1**: `STATUS: READY|BLOCKED` + `PLAN: <path>` + summary bullets + open questions (BLOCKED only).
- **architect Mode 2**: `VERDICT: PASS|PASS-WITH-NOTES|FAIL|ERROR` + violations (`file:line — constraint — what happened`).
- **writer**: `RESULT: COMMITTED|BLOCKED|FAILED` + `COMMITS` + `VERIFIED` + `DEVIATIONS` + `DISPUTED` (with each disputed finding restated with refuting evidence) + `DIRTY` + `WORKTREE` + `FAILING` (FAILED only).
- **reviewer**: `VERDICT: APPROVED|CHANGES_REQUESTED|ERROR` + `FINDINGS` (each: `file:line — defect — failure scenario — suggested fix`) + `CONTESTED` (disputed findings it still confirms) + `NOTES`. Zero findings ⇒ APPROVED.
- **debugger**: `ROOT-CAUSE` + `OWNER: code-writer|replan|user|retry` + `CONFIDENCE` + `REPRODUCED`; when OWNER=code-writer, a finding in the reviewer's finding shape.
- **DIED** (any role): the agent crashed or returned nothing parseable. An architect DIED is reported at Gate 1 with a re-run offer; any other DIED halts the lane. Never silently drop a requested issue.

## Per-commit implement loop — bound: 2 debug+fix attempts

For each plan commit, in order:

1. writer Mode 1 implements the commit.
2. `FAILED` → debugger diagnoses (inside the writer's reported worktree). Route by OWNER:
   - `retry` → writer Mode 1 again (transient; cite the debugger's root cause).
   - `code-writer` → writer Mode 2 with the debugger's finding; afterwards the writer completes the original commit under Mode 1 rules if it was never committed.
   - `replan` or `user` → **HALT** the lane immediately with the diagnosis.
3. At most **2** debug+fix attempts per commit, then **HALT** (human decision needed).
4. `BLOCKED` → **HALT** with the writer's reason. Anything other than `COMMITTED` after routing → **HALT**.

## Review loop — bound: maxFixCycles = 2

On the sub-lane's exact range `<base>..<branch>` (the base may itself be a stacked feature branch — never review the base's own commits):

1. reviewer runs; `ERROR` → **HALT**.
2. `CHANGES_REQUESTED` → writer Mode 2 applies the findings; it may DISPUTE findings it can refute, with evidence.
3. The re-review receives the disputes and re-verifies each:
   - retracted disputes become documented **won't-fix** entries in the lane's findings ledger;
   - still-confirmed disputes (`CONTESTED`) **HALT the lane immediately as NEEDS ARBITRATION** — no further cycle is spent on an agent stalemate; the human arbitrates at Gate 2 (uphold → targeted writer fix and resume; accept → documented won't-fix).
4. At most **2** fix cycles, then **HALT** (human decision needed).
5. A fix-cycle writer return other than `COMMITTED` → **HALT**.
6. `APPROVED` → proceed to sign-off.

## Sign-off

architect Mode 2 on `<base>..<branch>`, judging only this issue's commits. `FAIL` or `ERROR` → **HALT**. `PASS` / `PASS-WITH-NOTES` → sub-lane done.

## Halt semantics

Every loop above is bounded — nothing retries indefinitely. A halted lane never kills the batch: report its stage, the verbatim contract lines that caused the halt, and the exact resume command (`/dev-loop <n>` re-derives everything from artifacts). A lane whose base lane halted (or was held by the user) halts too, with that reason.

## Findings ledger (per lane; surfaced at Gate 2 and in the PR body)

- **fixed** — reviewer findings the writer applied.
- **won't-fix** — findings the writer disputed and the reviewer retracted, each with the writer's reason.
- **arbitrated** — contested findings the human ruled on, with the ruling.
- **reviewer NOTES** — non-blocking observations, verbatim.

## Sequencing

Lanes run in parallel. Within a lane: sub-lanes sequential, and within a sub-lane: plan commits sequential → review loop → sign-off. Waves: a sub-lane based on a branch that receives its commits in wave N runs in wave N+1; Gate 2 for a wave fires before the next wave is provisioned.

## Mode implementations

- **Mode W**: `phase-plan.js` (Phase A) and `phase-execute.js` (Phase B) run on the Workflow tool with the args documented in SKILL.md; their embedded JSON schemas mirror the return contracts above.
- **Mode A**: the orchestrator drives the Agent tool directly — one background agent per parallel unit (architects in Phase A, lanes in Phase B), sequential awaits inside a lane. Instruct each agent to end with its machine-readable leading lines exactly as its agent definition specifies, parse those as the contract keys, and enforce every bound, route, and halt in this file yourself.
