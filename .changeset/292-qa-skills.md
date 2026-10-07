---
"ieuanign-skills": minor
---

test-cases: a new skill that writes, revises or checks a PRD's test cases — one plain-words check per requirement, read from `to-prd`'s PRD and `mockup`'s mockup where there is one — and posts them as one `## Test cases` comment on the PRD's issue.

qa-review: a new skill that judges one pull request against those test cases, taking `code-review`'s Spec model with the cases as the spec, and posts a per-case verdict as a comment-only review and the `qa/review` commit status.

qa-verify: a new skill that runs the end-to-end tests against a deployed environment, or a local stack where there is none, raises a `bug` (or `flaky`) issue per failure, and sets the `qa/verify` commit status.

reproduce: a new skill that turns a reported bug into a minimised red repro against a local stack at the default branch, through `diagnosing-bugs`' first two phases, and posts it with one test case as a `## Test case` comment on the bug. All four live under `skills/qa/`, are model-invoked and ask nobody.
