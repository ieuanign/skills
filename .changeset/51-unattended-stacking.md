---
"ieuanign-skills": minor
---

`dev-loop`: an unattended run now stacks the way a supervised one does, with nobody there to be asked.

This is smaller than it sounds, because the supervised path never asked a human to *classify* an overlap. The host does the intersection and the classification itself, in plain reading, with no agent and no prompt; the human is handed only the **remedy**, and only in the dependency case, choosing between stacking B on A — already marked recommended — and deferring B out of the batch.

So the unattended path needs no new judgement stage and no extra agent. It runs the identical intersection, applies the identical three outcomes, and takes the recommended remedy. Previously the suppression table answered that question with *defer it out of the batch*, deferred to a spec that did not exist yet; it now answers **stack B on A**.

**Defer drops out, and the contract says why rather than leaving it implied.** It is a human's "not this batch" — a scheduling judgement made from context the pipeline does not hold, about work someone wants to review this afternoon. Unattended there is nobody whose afternoon it is, and taking it would silently return less work than was asked for.

The discovered-blocker comment was already a machine action and carries over unchanged, so the reason a lane was stacked is still recorded on the issue. The same-region outcome still posts nothing, exactly as under supervision. At the end, the unattended conclusion links the batch's pull requests through the same bundled script with the same absent-extension fallback — that step asks nothing, so gate suppression never touches it and it has no row in the suppression table.

**Two costs are accepted and recorded rather than engineered around**, each with the failure it produces named, so neither is later mistaken for an oversight:

- A **misclassification is unattended**: a real dependency read as additive puts both lanes in the same layer, and B's worktree never contains A's code. That surfaces as a red suite gate or a failed writer in B's lane — an attributable, bounded failure the existing debugger path already handles, not a silent bad merge.
- A **same-region co-touch read as additive still conflicts when someone merges**. The run's job ends at the pull request, so that conflict lands on the human doing the merge, exactly where it lands today.
