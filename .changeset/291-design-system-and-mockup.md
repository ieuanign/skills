---
"ieuanign-skills": minor
---

design-system: a new skill that sets up a project's design system as plain HTML under `docs/design-system/` — a reference page with every token and component in both themes, the `skeleton.html` every mockup is built from, and the client's `brand/` read as it is. It draws three directions on a PRD's real screens, builds the design system from the one a person picks, adopts one already in code, or checks it against a four-line checklist. It bundles the skeleton template, whose leading comment is the one source of the markup contract a mockup follows, and commits nothing.

mockup: a new skill that mocks up every screen a PRD changes, each in all its states, as one self-contained page at `docs/design/<PRD number>-<slug>.html` built from the skeleton, and opens one pull request for it from a worktree, so the invoking checkout never moves. It revises the page from a person's reasons or a revised PRD — redoing only the sections its last Revisions line names — or checks it against a five-line checklist. Both skills are model-invoked, load nothing from the network but fonts, and their Check branches write nothing.
