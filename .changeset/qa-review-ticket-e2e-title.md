---
"ieuanign-skills": minor
---

qa-review: a title starting `test(e2e): #<n>` is reviewed as a PRD's `test(e2e):` pull request only when issue `#<n>` carries a comment headed `## Test cases`. A ticket's own end-to-end pull request, which carries the same title shape, is now reviewed as a ticket's pull request instead of stopping for want of test cases. A PRD with no `## Test cases` comment still stops the review, writing nothing.
