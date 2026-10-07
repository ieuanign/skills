---
"ieuanign-skills": minor
---

grill-prd: a new skill that interviews a brief in plain words — who it is for, what each person can do and see, what goes wrong, what it replaces, what is fixed and what is left out — through `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling` (glossary terms only), fetching code facts from a sub-agent that answers as "what a person can do today". It judges a too-big brief in its first round, offers the topic to take first, and ends by calling `to-prd` once every part of the brief has a home.

to-prd: a new skill that writes, revises or checks a non-technical PRD on the issue tracker, with stable `REQ-<prd>.<n>` ids, a `Visible` mark per requirement and a seven-line checklist, and files an epic when a too-big brief was narrowed. It stops for no one, so an agent can call it alone; it creates the `prd` and `epic` labels when they are missing.
