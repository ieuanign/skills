---
"ieuanign-skills": minor
---

infra-report: a new skill under `skills/infrastructure/` that posts one report as a comment beginning `## Report` on the pinned "Infrastructure reports" issue — cost per environment from the provider's billing API (or `list price` from the infrastructure code), usage per host as PromQL through Grafana's datasource proxy, pipeline minutes from the Actions API, the last restore, and right-sizing suggestions measured against the delivery policy's thresholds, each a numbered block carrying query, window, current size, proposed size, monthly saving and source. Every figure names its source or reads `not available` with the reason; credentials are passed to tools by path and never read. Report writes only the issue (created and pinned when absent) and its one comment, changing no infrastructure; Check passes only when every figure in the latest report names its source, writing nothing. Model-invoked.
