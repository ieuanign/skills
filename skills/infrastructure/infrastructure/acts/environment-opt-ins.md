# environment opt-ins — what each opt-in adds to an environment

Each section is a deliverable of `acts/environment.md`, decided and delivered with its others, and
applies only while its opt-in is `true`. **Staging**, **production**, **the entry** and **runtime** mean
what they mean there.

## Mobile — any `services.<name>.mobile_app`

- Staging: each mobile service built by `tools.mobile_build` as an internal build, pointed at staging's
  address, on every staging deployment.
- Production: a store submission of the named commit, built by `tools.mobile_build` on
  `workflow_dispatch` and held for a person to release; the workflow submits for review and stops.
- Store credentials and signing material: secrets of the matching GitHub environment, set by the
  Repository part.

## Previews — `previews.enabled`

- One per open pull request, on staging's infrastructure as a **runtime** preview unit named
  `pr-<n>`, at `pr-<n>.<previews.domain>`.
- Wildcard DNS `*.<previews.domain>` in the infrastructure code, and TLS for it by ACME.
- Its own database, seeded as staging is.
- Built on `pull_request` opened or synchronised, skipped for a pull request from a fork, and refused
  while `previews.cap` previews already run.
- Its address posted on the pull request as one comment.
- Torn down, its database with it, on `pull_request` closed and on a daily schedule for every preview
  whose pull request has had no push for `previews.idle_days` days.
- Outside every alert rule.

## Soft release — `release.soft_release.enabled`

- One GitHub environment variable per switch the services' code reads,
  `<release.soft_release.prefix><switch>`, `on` in staging and `off` in production, set by the
  infrastructure code or the Repository part.
- The deploy step passes every variable whose name starts with `release.soft_release.prefix` through
  to the services.

## The tag — `release.tag.enabled`

- After a production deployment whose status is `success`, a tag in `release.tag.format` at the deployed
  commit.
- Its description: the pull requests merged since the last tag, grouped by the PRD or bug issue each
  closes; then, per service, the summaries of its changesets not yet consumed.

## End-to-end tests — `release.e2e_tests.enabled`

- After each staging deployment, `release.e2e_tests.command` run against staging's address.
- Its result posted as commit status `e2e/staging` on the deployed commit; `qa/verify` stays with
  `qa-verify`.
