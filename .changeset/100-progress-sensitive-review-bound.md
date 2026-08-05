---
"ieuanign-skills": minor
---

`/dev-loop`'s review loop stops abandoning lanes that are still converging.

Its bound was a flat count, so it could not tell a loop that is stuck from one that is working. On the run that prompted this, three reviews produced three findings at three different lines, disjoint on every round, the third a regression created by the fix for the second — every cycle doing real work — and the bound fired anyway. The developer ran the next cycle by hand and it went green.

**The loop takes the progress-sensitive shape the suite gate already had.** After a `CHANGES_REQUESTED` review the counter advances by one unless a previously unseen finding appeared, and a new finding resets it to 1. At the repository profile's **Fix cycles** value the loop stops — that key is now the **no-progress threshold** rather than a flat cap, default `2`, and `0` still spends no fix cycle at all.

```
cycle 1: {A, B, C}   all unseen                    → count 1
cycle 2: {A, B}      subset, nothing new           → count 2 → stop

cycle 1: {A}                                       → count 1
cycle 2: {B}         B unseen                      → reset to 1
cycle 3: {C}         C unseen (regression from B)  → reset to 1
cycle 4: {}          approved                      → done
```

The first trace is the stuck case, and note it now stops **earlier** than the flat bound it replaces: the threshold catches a loop repeating itself, and a hard ceiling of **5 fix cycles** does the ordinary bounding. Both are checked before a cycle's writer is dispatched, so nothing is spent on a cycle that cannot run.

**Finding identity** is the normalised file and defect clause, with the line number dropped as the volatile part — a fix shifts lines, and a shifted line is not a new defect. A round counts as no-progress only when *every* finding in it matches a prior round's. It is deliberately conservative, because declaring sameness is what ends the loop early, and it is host arithmetic in plain code: no agent is dispatched to decide it and the reviewer's return contract is unchanged.

**The escalation carries the trajectory.** An ending on either bound names which bound fired and states, per round, whether it brought previously-unseen findings or repeated prior ones — in the ending reason, in the findings ledger, and in the attempt log. That is what tells a reader whether one more cycle was worth running before they read a line of the diff.

**Expect this to behave as a flat bound of 5 on most runs.** Independent reviewer invocations rarely word the same defect identically, so the threshold fires rarely. That is the design, recorded in [ADR-0002](docs/adr/0002-review-loop-progress-sensitive-bound.md) so nobody later "fixes" the counter for not advancing.

**The per-commit implement loop is deliberately unchanged.** Its give-up clause instructs the writer of the final permitted attempt, and no earlier one, to commit abandoned work as evidence — which needs the last attempt known at dispatch time, and a progress-sensitive counter cannot supply that. `contracts.md` records the divergence so it is not tidied away.

The contract was edited first and both execution modes in the same change. The ceiling is stated in the contract's prose and held as a phase-script constant, and `npm run check` compares them — the same drift check the cost-stage vocabulary already gets. Eight harness scenarios cover the motivating case, the stuck case, the ceiling, a threshold of `0`, a raised threshold, the trajectory, and that a re-confirmed dispute still ends a sub-lane immediately.
