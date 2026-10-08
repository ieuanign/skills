---
"ieuanign-skills": minor
---

delivery-policy: a new skill under `skills/infrastructure/` that observes, writes and checks a repository's `docs/delivery-policy.md` — YAML front matter validated by a versioned JSON Schema bundled with the skill, plus a body saying the same for people. Observe reads the repository's workflows, rulesets, environments, deployment files and history and returns one question set, asking nobody; Write turns the answered set into the file, marking each rule `client`, `suggested` or `required`, and never commits; Check runs the bundled `check-policy.mjs` and prints pass or fail per rule, writing nothing. Model-invoked.
