---
"ieuanign-skills": minor
---

architecture: a new skill that keeps a project's Architecture in `docs/architecture/` — an index plus blueprint, data, behavior and deployment sections, each saying what and why per layer with a mermaid diagram — and plans each PRD against it as a Spec, an issue under the PRD listing its changes to the Architecture, which `/to-tickets` then cuts into tickets. Observe drafts the Architecture from the code and Spec drafts a PRD's changes against it, each returning one question set and asking nobody; Write turns an answered set into the Architecture or the Spec, adds the agents' pointer in `docs/agents/domain.md` only where missing, and never commits; Check reports every checklist line and drift against the code, writing nothing. Bundles a template and a worked example that passes its own Check. Model-invoked.
