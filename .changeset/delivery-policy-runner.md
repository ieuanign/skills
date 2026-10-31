---
"ieuanign-skills": minor
---

delivery-policy and infrastructure: each environment gains a `runner` rule — `github-hosted`, the recommendation, or `self-hosted` with the `runner_label` the runner registers with — and Observe reads it from an existing deploy job's `runs-on`. With `self-hosted`, `infrastructure` puts the deployment job on that runner, and the wizard's Machine part registers the runner as a service and, on a public repository, first sets the fork pull-request approval policy to `all_external_contributors`. An existing policy fails Check with `environments.<name>.runner: missing` until a later `/setup-infra` run writes it.
