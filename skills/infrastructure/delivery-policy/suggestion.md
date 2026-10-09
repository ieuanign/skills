# The suggestion

What `delivery-policy` recommends for a **gap** — a rule nothing in the repository settles — and the
recommendation every question carries. Each entry names the rule it answers by its path in
`delivery-policy.schema.json`; the schema, not this file, holds the keys, their types and which are
required. A recommendation the owner keeps is marked `suggested`; any other answer is `client`.

Every opt-in is off: `enabled: false` for remediation, previews, the tag, soft release, end-to-end tests
in the pipeline and release by rule. The suggestion never turns one on; only the owner or a caller's
fixed rule does, and the values recommended under it apply only then.

## Branching

- `branching.trunk` — `"main"`. One trunk, protected: a pull request is required and nobody pushes to
  it directly.
- `branching.merge_method` — `"rebase"`. The trunk stays linear, so an exact revert is one commit and
  changed paths read commit by commit.
- `branching.check_command` — the command the repository's pull-request workflow already runs; with
  none, the check or test script its manifest declares.
- `branching.derived_files` — the files only a tool writes: lock files, generated changelogs, files
  `.gitattributes` marks `linguist-generated`. A pull request holding only these, or an exact revert,
  passes the check at once through one shared script.

## Paths

- `paths.tools` — `"tools/"`.
- `paths.wizard` — `"tools/wizard/"`.

## Infrastructure as code

- `infrastructure_as_code.tool` — `"opentofu"`.
- `infrastructure_as_code.path` — `"infra/"`, one folder per environment beneath it.

## Services

- `services.<name>.paths` — a `<folder>/**` glob per folder the service's build reads (its Dockerfile's
  context, its chart's sources). What deploys is decided by changed paths, so a path left out never deploys.
- `services.<name>.mobile_app` — `true` only for a service that builds an iOS or Android app.

## Environments

With no environment observed, recommend two: `staging` and `production`.

- `environments.<name>.runtime` — `"compose"`; `"kubernetes"` where the owner already runs a cluster.
- `environments.<name>.provider` — the provider the deployment files already name. Where none does, the
  question carries no value: the owner names the provider.
- `environments.<name>.deployed_by` — `"trunk-push"` for staging: every push to the trunk deploys it.
  `"named-commit"` for production: it deploys a commit a person names.
- `environments.<name>.health_check_url` — the service's existing health endpoint on the environment's
  domain.
- `environments.<name>.monitoring` — `"added"`; `"own"` where the owner already runs monitoring this
  environment reports to.
- `environments.<name>.remediation.enabled` — `false`. Once on, `allowlist` `["restart", "rollback"]`:
  the two actions that leave the environment's size and disk as they were.
- `environments.<name>.scale.min` — `1`; `scale.max` — `2`.

## Release

- `release.by_rule.enabled` — `false`: a person holds each production release. Once on, `statuses`
  `["qa/verify"]`: production releases after a green verification on staging.
- `release.e2e_tests.enabled` — `false`. Once on, `command` is the project's own end-to-end command.
- `release.tag.enabled` — `false`. Once on, `format` `"release-{date}"`, the date of the production
  deployment it marks.
- `release.soft_release.enabled` — `false`. Once on, `prefix` `"FEATURE_"`.

## Previews

- `previews.enabled` — `false`. Once on, `domain` a subdomain of staging's (`"preview.example.com"`
  where staging is `staging.example.com`), `cap` `5`, `idle_days` `3`.

## Right-sizing

Read over p95 CPU and memory for 30 days.

- `right_sizing.down_below_percent` — `40`.
- `right_sizing.up_above_percent` — `80`.

## Tools

- `tools.proxy` — `"traefik"`.
- `tools.ingress` — `"traefik"` where an environment runs `kubernetes`; otherwise `null`.
- `tools.certificates` — ACME either way: `"acme"` where no environment runs `kubernetes`, issued by
  the proxy on `compose` and by the platform on `paas`; `"cert-manager"` where an environment runs
  `kubernetes`.
- `tools.monitoring` — `"prometheus-loki-grafana"`: Prometheus with node-exporter and cAdvisor, Loki
  with Grafana Alloy, and Grafana.
- `tools.deployment` — `"helm"` where an environment runs `kubernetes`; otherwise `null`.
- `tools.mobile_build` — `"fastlane"` where a service is a mobile app; otherwise `null`.
