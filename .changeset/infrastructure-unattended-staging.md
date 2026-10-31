---
"ieuanign-skills": patch
---

infrastructure, setup-infra, infra-report, infra-diagnose: nine fixes from running the skills unattended on a Compose staging ([#398](https://github.com/ieuanign/skills/issues/398)).

- Every pull request `infrastructure` opens ends with the `## Undo` section, so `check` can pass an `environment` or `first-run` pull request.
- `check` reverts every commit a rebase merge landed, not only the last, and judges each workflow's newest run at the merge commit rather than every run.
- `apply` now deploys an environment that has no successful Deployment yet, dispatching `deployment.yml` at the commit it applied and returning the run's conclusion and link.
- A change to the Compose files or the monitoring stack alone deploys every service. `changed-paths.sh` is version 2 (`changed-paths.sh <environment> [<glob>…]`) and is now an `environment` deliverable; the next `environment` or `maintain` run refreshes a shipped copy and reports an edited one.
- A contact point's numeric id, such as a Telegram chat id, is provisioned as a quoted literal, which Grafana accepts where it refuses an expanded variable.
- Each credential key names its file's form. A provider or DNS file holds the value alone, one line — a `KEY=value` line no longer works; rewrite it. The Grafana file is a `curl` config holding `header = "Authorization: Bearer <token>"`.
- `INFRA_CREDENTIAL_GITHUB` names the token's permissions: Administration write and Environments write.
- A wizard script reads the repository's name before any `cd`, so the runner's registration URL is right.
