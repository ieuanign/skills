# 0002 — The review loop's bound is progress-sensitive; the implement loop's is not

**Status**: accepted, and implemented — the ceiling is prose in `docs/dev-loop-internals.md` and a
constant in `phase-execute.js`, and `npm run check` compares them.

**Written before [#121](https://github.com/ieuanign/skills/issues/121)'s compression**, when
`skills/dev-loop/contracts.md` existed and `/dev-loop` had two execution modes. Neither does now — the
file dissolved into `SKILL.md` and `docs/dev-loop-internals.md`, and
[ADR-0004](./0004-mode-a-deleted.md) deleted Mode A. The decision below stands unchanged; only its
homes moved, and the single-version clause is satisfied trivially by there being one implementation.

`/dev-loop`'s review loop halted a lane one fix cycle before green. The evidence is a single run,
and it is unambiguous: three reviews produced three findings, at three different lines, **disjoint on
every round** — and the third was a regression introduced by the fix for the second. The flat bound of
2 fired while the loop was still converging, and the third cycle, run by hand, closed it: zero
findings open, suite green, merged.

A flat count cannot tell a loop that is stuck from one that is working. So the review loop takes the
**progress-sensitive** shape the suite gate already had: the counter advances only on a round bringing
nothing previously unseen, resets when one does, and stops at a hard ceiling regardless.

## Decision

- The repo profile's **Fix cycles** key becomes the **no-progress threshold** (default `2`), not a
  flat cap. `0` still spends no cycle.
- A **hard ceiling of 5** applies regardless of progress.
- **Finding identity** is the normalised file and defect clause, line number dropped. A round counts
  as no-progress only when *every* finding in it matches a prior round's.
- When the loop ends on either bound, the escalation **carries the trajectory** — whether each round
  brought previously-unseen findings or repeated prior ones.
- The **per-commit implement loop keeps its flat bound of 2.**
- Single-version: both execution modes implement this identically. It is not a second branch point.

## Why the two loops differ

Three independent reasons, each sufficient on its own. Recording them because the loops now look
gratuitously inconsistent, and the next reader will want to unify them.

| | identity | round cost | give-up clause |
|---|---|---|---|
| suite gate | free — the runner's own test identifiers | one cheap call running one command | none |
| review loop | prose, conservatively matched | reviewer + writer, the two dearest agents | none |
| implement loop | free — the writer's `FAILING` | debugger + writer | **yes** |

The give-up clause is the decisive one. It instructs the writer of the **final permitted** attempt, and
no earlier one, to commit abandoned work as evidence — which requires knowing at dispatch time that an
attempt is the last. A progress-sensitive counter cannot know that: firing late is impossible, because
the counter only advances after a round returns; firing early stamps abandonment on attempts that go
on to succeed, which the contract forbids in terms. The review loop was free to change because it has
no such clause — its plan commits are already on the branch.

The ceiling being **5** where the suite gate's is 8 is deliberate, and encodes the cost column above: a
review round costs roughly ten times a suite round.

## Considered options

**Raise the profile value to 3 and change nothing else.** Fixes the observed case; fails the next run
needing 4. It is a guess at a number rather than a rule, and the number was never chosen by anyone —
the ask that should have offered it was specified in two places and implemented by no step, so every
repository silently ran on the default.

**Port the suite gate verbatim, ceiling 8.** Rejected on cost: worst case 9 reviewers + 8 writers
against today's 5 calls. [ADR-0005](./0005-no-token-ceiling.md) rests its decision to have *no token
ceiling at all* on a lane being bounded from five directions, one of them this bound; tripling it
weakens an argument that was load-bearing.

**Unbounded, exiting only when an agent says it is stuck.** Rejected. The runner's 1000-agent backstop
means it terminates, but it takes the whole batch with it, since a layer's lanes share one workflow
call. Two agent-judgement exits already exist — a writer's `BLOCKED` and a re-confirmed dispute — and
neither fired on the motivating run, because nobody *was* stuck. Removing the count removes the only
thing that stops a loop when every agent is confident and correct. Bound enforcement is mechanical in a
script and merely remembered by a model otherwise, which is acceptable when a human is watching and not
when nobody is.

## Consequences

- **On most runs this behaves as a flat bound of 5**, because independent reviewer invocations rarely
  word the same defect identically, so the threshold rarely fires. That is expected, not a defect:
  the threshold exists to catch the *stuck* case early, and the ceiling does the ordinary bounding.
  Nobody should later "fix" the counter for not advancing.
- Findings are compared by the host in plain code, dispatching no agent — consistent with the
  commit-breakdown check and the touchpoint intersection.
- The reviewer's return contract is unchanged. No new key, no extra call.
