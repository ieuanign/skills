---
"ieuanign-skills": minor
---

dev-loop: the `reviewer` now reads the plan's Approach and File touchpoints alongside the Hard constraints and Test expectations it already read, and reports approach drift as a named review priority — an implementation that reached the plan's outcome by a different design is visible instead of passing silently. Drift always routes to NOTES and never blocks: the architect is the only agent that could re-decide an approach and it does not run again in a lane, so a blocking drift finding would burn fix cycles on working, in-scope, tested code. Behaviour with no plan is unchanged, and the reviewer stays read-only.
