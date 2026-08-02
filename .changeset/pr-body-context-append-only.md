---
"ieuanign-skills": patch
---

`dev-loop`: the plan's summary bullets reach the PR body's Context section, and the run is explicitly append-only.

The architect's summary bullets had exactly one consumer — the plan-approval gate. Suppress that gate and the orientation it produced was thrown away. Phase A is now told to keep them for the rest of the run, and Gate 2 places them in the PR body's **Context** section beside the planned-versus-made commit counts already there.

The second half fixes what the run is allowed to write, now that per-criterion verdicts exist to tempt it. Stated in `SKILL.md` and in `contracts.md` where it governs both execution modes: the run appends to issues and pull requests, adds and removes only its own workflow labels, and sets state only on artifacts it created. It never edits an issue body, never ticks an acceptance-criteria checkbox, and never converts a pull request a human opened. Verdicts are reported in the PR body, not written back to the issue's checklist — the pull request's own state already carries the aggregate verdict, and the closing keyword closes the issue on merge regardless.
