---
"ieuanign-skills": minor
---

qa-review: a failing case is also an inline comment on the line that fails it. A `not-met` or `no-test` case whose evidence is a `file:line` on the head side of the pull request's diff is posted as an inline comment at that line, in the same comment-only review as the verdict — one review, body and comments together, on every verdict the skill posts. A case with no such line stays in the body alone. A later run resolves the thread of a case that is now `met`, and no other thread — not a person's, not one whose case is `untested`, not run or out of scope — and a case that already has an open thread gets no second one. The verdict body and the `qa/review` status are unchanged, so `/pr-comments` reads each failing case as its own fix-or-skip row beside the one row for the body.
