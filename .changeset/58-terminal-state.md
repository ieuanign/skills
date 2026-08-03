---
"ieuanign-skills": minor
---

`dev-loop`: a sub-lane's ending decides whether its pull request opens ready, draft, or not at all.

Under supervision a human at Gate 2 decides what a sub-lane's ending means: they read the commit list, the findings ledger and the criterion verdicts, and arbitrate anything contested. Remove that human and nothing decided it — a sub-lane with open findings, a red suite or an unmet acceptance criterion would open exactly the pull request a clean one opens. One table in `contracts.md`'s **Lane conclusion** decides it instead, read under `unattended` only: under `gated` every one of these outcomes still goes in front of the human.

**The ready predicate is one expression**: the sub-lane concluded clean, and its findings are resolved, and the suite passed or did not run, and every acceptance criterion is met. Anything else drafts. It is written as that four-way conjunction and deliberately not reduced to the shortest expression equivalent to it today — an ending already implies the middle two, so the reduction would be correct now and silently wrong after any change that let a red suite through without ending the sub-lane, with no line to have got wrong.

A **partial** criterion drafts alongside a **not-met** one. Nobody watched the run, so "not demonstrably done" defaults to draft, exactly as the findings ledger and the suite gate already behave; a half-implemented criterion presenting as a ready pull request would reduce the signal to one line of ledger prose the merger may skim. An **ended** sub-lane is never ready whatever its ledger says, because the pipeline stopped before it could finish judging it.

Work that exists stays reviewable: open findings, a red suite, or an ending mid-pipeline all open a **draft** rather than stranding the branch, and the body carries a **Why this is a draft** line naming which of the four triggers fired. Work that does not exist opens nothing — a narrow case now that the give-up path commits abandoned work as a `wip:` commit, leaving only the sub-lane whose writer stopped before changing a file.

Every row is decided **per sub-lane**, from that sub-lane's own inputs: each is its own branch and its own pull request, so one sub-lane's draft never drafts another's. Mode W's per-sub-lane result carries a `terminal` of `{pr, push, reasons}`, and Gate 2 opens what it names rather than deciding again. **Git is the authority on the push column** — the row is a proposal, and the host's ahead-of-base read settles it, which is what lets a resumed sub-lane whose commits were already in the log still be owed a real pull request. The pipeline sets draft state only on pull requests it created and never converts one a human opened, per the append-only invariant.

Two collection bugs fell out of building it, both in `phase-execute.js`. A writer that committed and *then* returned `BLOCKED` dropped its commits from the sub-lane record, which the table's last two rows would have read as "nothing landed"; the commits a fix cycle or a suite fix landed before stopping were lost the same way. Absorption now happens before the result is read, on every path.
