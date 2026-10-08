---
schema_version: 1
branching:
  trunk:
    value: "main"
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

<!-- expect: fail branching.trunk: mark: missing -->
