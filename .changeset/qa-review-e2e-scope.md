---
"ieuanign-skills": minor
---

qa-review: a repository whose CI runs every end-to-end test on each pull request can say so in `docs/agents/qa.md`, `## End-to-end scope`: `prd — <job>`, naming that CI job. The `test(e2e):` pull request then runs only the tests tagged `@REQ-<PRD>.` — the PRD's own and its bugs' — marks a case whose test lacks that tag `no-test`, skips assigning older tests' failures, and its verdict reads `Older tests: run by <job>, not here`. The guards on a retired case's test and on a diff that changes an older test stay. With no profile, or `all`, nothing changes.
