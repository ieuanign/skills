---
"ieuanign-skills": minor
---

mockup, design-system: a mockup is now a throwaway draft, and what lasts is a **design prototype** per screen. `/mockup` drafts a PRD's screens under `.scratch/mockups/<N>-<slug>/` with no branch and no pull request; once the person confirms the design, its new Confirm branch turns each screen into one interactive page at `docs/design/<folder>/<screen>.html` — `web`, `mobile`, `email`, `pdf` or `notification` — and opens one pull request, `Design: <name>`. A screen has one page however many PRDs touch it: a later PRD drafts from a copy of the page an earlier one left. Before drawing, Build follows the patterns the design prototypes and the code components already use, and a conflict between them is raised, ruled on and fixed first.

A design prototype carries a floating, collapsible panel with every state, a size switch (web: 360, 768, 1024 and the full window; mobile: a 360 × 800 phone and a 768 × 1024 tablet), the theme switch, its requirement ids, its Behaviour list and its placeholders. Controls move the page between states through `data-go` and `data-then`; `data-when` shows an element in the states it names, and replaces `data-state-panel`.

The skeleton is no longer one inline page. `/design-system` writes `tokens.css`, `skeleton.css`, `skeleton.js`, `skeleton.html` and `prototype.html` from `template/`, and every page links them by relative path, so a token added later reaches every page already drawn. Where the app's own token file is plain CSS a browser loads as it stands, pages link that instead; otherwise `tokens.css` mirrors it. `reference.html` has a template too, and reads its colour and contrast tables from the linked tokens. `test-cases` and `reproduce` find a PRD's design prototypes by the ids in `data-req`.

**Breaking for a project already set up:** an inline `skeleton.html` and pages at `docs/design/<N>-<slug>.html` are not read any more. Split the skeleton into the linked files and move each screen to its own page before running `/mockup` again; `/mockup` refuses until `docs/design-system/prototype.html` is on the default branch.
