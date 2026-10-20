---
"ieuanign-skills": minor
---

qa-review: the `test(e2e):` pull request runs every end-to-end test on the branch, not only the PRD's own, and the verdict records the run's duration. An older test that fails twice is run alone at the trunk fork point — failing there too it is `fails on <trunk> too` and fails nothing — or else bisected up the stack to the lowest pull request whose head fails it, which answers for it as `not-met` (`not-met — assigned to #<n>` on the e2e pull request) or, where the older case and this PRD's requirement cannot both hold, as a `conflicts` line that fails the status and faults the test cases or the PRD. A retired case's test still on the branch is `not-met`, and a diff that changes or deletes another older case's test is `not-met` on the pull request whose diff does it.
