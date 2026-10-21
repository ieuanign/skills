---
"ieuanign-skills": minor
---

test-cases: the `## Test cases` comment opens with a summary a person can scan when approving the cases — a line counting the positive and negative cases, then a table of the comment's cases (case, what it checks, requirement, kind, priority, surface) built only from each case's heading and `Requirement:` line. The Assumptions fold into a `<details>` whose `<summary>` carries their count; Retires stays open, and the cases follow unchanged after a `---`. Revise keeps the table and the counts in step, the checklist gains a line that the table matches the cases, and a continuation comment carries a table of its own cases. A reader that found the Assumptions by their `**Assumptions**` line reads the `<summary>` instead.
