---
schema_version: 1
branching:
  trunk:
    value: "main"
    mark: client
  merge_method:
    value: "rebase"
    mark: suggested
  check_command:
    value: "npm run check"
    mark: client
  derived_files:
    value:
      - "package-lock.json"
      - "CHANGELOG.md"
    mark: client
paths:
  tools:
    value: "tools/"
    mark: suggested
  wizard:
    value: "tools/wizard/"
    mark: suggested
infrastructure_as_code:
  tool:
    value: "opentofu"
    mark: suggested
  path:
    value: "infra/"
    mark: suggested
services:
  api:
    paths:
      value:
        - "services/api/**"
      mark: client
    mobile_app:
      value: false
      mark: client
  web:
    paths:
      value:
        - "services/web/**"
      mark: client
    mobile_app:
      value: false
      mark: client
environments:
  staging:
    runtime:
      value: "compose"
      mark: client
    provider:
      value: "example-cloud"
      mark: client
    deployed_by:
      value: "trunk-push"
      mark: suggested
    health_check_url:
      value: "https://staging.example.com/health"
      mark: client
    monitoring:
      value: "added"
      mark: suggested
    remediation:
      enabled:
        value: false
        mark: suggested
    scale:
      min:
        value: 1
        mark: suggested
      max:
        value: 2
        mark: suggested
  production:
    runtime:
      value: "compose"
      mark: client
    provider:
      value: "example-cloud"
      mark: client
    deployed_by:
      value: "named-commit"
      mark: required
      change: "Replace the production deploy on every trunk push with a deploy of a named commit."
    health_check_url:
      value: "https://example.com/health"
      mark: client
    monitoring:
      value: "added"
      mark: suggested
    remediation:
      enabled:
        value: false
        mark: suggested
    scale:
      min:
        value: 1
        mark: suggested
      max:
        value: 2
        mark: suggested
release:
  by_rule:
    enabled:
      value: false
      mark: suggested
  e2e_tests:
    enabled:
      value: false
      mark: suggested
  tag:
    enabled:
      value: false
      mark: suggested
  soft_release:
    enabled:
      value: false
      mark: suggested
previews:
  enabled:
    value: false
    mark: suggested
right_sizing:
  down_below_percent:
    value: 40
    mark: suggested
  up_above_percent:
    value: 80
    mark: suggested
tools:
  proxy:
    value: "traefik"
    mark: suggested
  ingress:
    value: null
    mark: suggested
  certificates:
    value: "acme"
    mark: suggested
  monitoring:
    value: "prometheus-loki-grafana"
    mark: suggested
  deployment:
    value: null
    mark: suggested
  mobile_build:
    value: null
    mark: suggested
---

# Delivery policy

The front matter above is what tools read; this body says the same for people. Each rule carries its
mark: `client` (the owner's own, or observed and kept), `suggested` (the suggestion, accepted) or
`required` (a fixed rule the repository breaks today, with the change needed).

## Branching

- Trunk (`branching.trunk`): "main" — client.
- Merge method (`branching.merge_method`): "rebase" — suggested.
- Check command (`branching.check_command`): "npm run check" — client.
- Derived files (`branching.derived_files`): "package-lock.json", "CHANGELOG.md" — client.

## Paths

- Tools path (`paths.tools`): "tools/" — suggested.
- Wizard scripts path (`paths.wizard`): "tools/wizard/" — suggested.

## Infrastructure as code

- Tool (`infrastructure_as_code.tool`): "opentofu" — suggested.
- Path (`infrastructure_as_code.path`): "infra/" — suggested.

## Services

- api, built from (`services.api.paths`): "services/api/**" — client.
- api, mobile app (`services.api.mobile_app`): false — client.
- web, built from (`services.web.paths`): "services/web/**" — client.
- web, mobile app (`services.web.mobile_app`): false — client.

## Environments

- staging, runtime (`environments.staging.runtime`): "compose" — client.
- staging, provider (`environments.staging.provider`): "example-cloud" — client.
- staging, deployed by (`environments.staging.deployed_by`): "trunk-push" — suggested.
- staging, health check (`environments.staging.health_check_url`): "https://staging.example.com/health" — client.
- staging, monitoring (`environments.staging.monitoring`): "added" — suggested.
- staging, remediation (`environments.staging.remediation.enabled`): false — suggested.
- staging, scale minimum (`environments.staging.scale.min`): 1 — suggested.
- staging, scale maximum (`environments.staging.scale.max`): 2 — suggested.
- production, runtime (`environments.production.runtime`): "compose" — client.
- production, provider (`environments.production.provider`): "example-cloud" — client.
- production, deployed by (`environments.production.deployed_by`): "named-commit" — required. Change
  needed: replace the production deploy on every trunk push with a deploy of a named commit.
- production, health check (`environments.production.health_check_url`): "https://example.com/health" — client.
- production, monitoring (`environments.production.monitoring`): "added" — suggested.
- production, remediation (`environments.production.remediation.enabled`): false — suggested.
- production, scale minimum (`environments.production.scale.min`): 1 — suggested.
- production, scale maximum (`environments.production.scale.max`): 2 — suggested.

## Release

- Release by rule (`release.by_rule.enabled`): false — suggested.
- End-to-end tests in the pipeline (`release.e2e_tests.enabled`): false — suggested.
- Tag (`release.tag.enabled`): false — suggested.
- Soft release (`release.soft_release.enabled`): false — suggested.

## Previews

- Previews (`previews.enabled`): false — suggested.

## Right-sizing

- Size down below (`right_sizing.down_below_percent`): 40 — suggested.
- Size up above (`right_sizing.up_above_percent`): 80 — suggested.

## Tools

- Proxy (`tools.proxy`): "traefik" — suggested.
- Ingress (`tools.ingress`): null — suggested.
- Certificates (`tools.certificates`): "acme" — suggested.
- Monitoring (`tools.monitoring`): "prometheus-loki-grafana" — suggested.
- Deployment (`tools.deployment`): null — suggested.
- Mobile build (`tools.mobile_build`): null — suggested.
