---
"ieuanign-skills": minor
---

`/setup-ieuanign-skills` now seeds the workflow label vocabulary an unattended run needs, alongside the coding-standards rubric it already wrote.

`/dev-loop auto` resolves three label **roles** — in-progress, awaiting-human, failed — through the consuming repository's `docs/agents/triage-labels.md`, and skips silently for any role that file gives no string for. In a freshly installed repository it gives none, so an unattended run wrote no labels at all. #7 closed the discoverability half by documenting the manual steps in `README.md`; this closes the convenience half by making them one command.

**It belongs here because this is the only setup skill this plugin owns**, and because the file dev-loop resolves its roles through is frequently absent entirely: `setup-matt-pocock-skills` writes it, and per that skill only when Matt's `triage` skill is installed. So this part assumes neither ran — it creates `docs/agents/triage-labels.md` when absent, with the `# Triage Labels` heading and preamble that skill establishes and no triage table of its own, leaving room for that skill to add one above later.

**The Workflow roles section is appended, and an existing triage table is never touched.** The two families are different kinds of label and the separation is the point: a triage label is a human classifying an issue before anyone works it, a workflow label is a run reporting where it got to. Folding them into one table invites someone to hand-apply in-progress, which is a live claim marker a separate orchestration system reads. A `### Triage labels` entry is added to the `## Agent skills` block in the shape `setup-matt-pocock-skills` establishes — updated in place when present, never duplicated — and an absent block is left alone with a pointer at that skill, the same posture Part 1 already takes.

**The roles are fixed and the strings are the user's**, agreed before anything is written; a role left with no string is a real answer and stays skipped silently. **Label creation is offered, never run unprompted** — the exact `gh label create` lines for the strings the tracker does not already have, run only on an explicit yes, because creating a label mutates the user's repository. A tracker that is not GitHub gets the role names and a note to create the equivalents itself, and no `gh` command at all.

Nothing about *when* a role is applied is restated: `notifications.md` is cited as the source, in the skill and in the file it writes. The skill folder gains `workflow-labels-template.md` as the section's skeleton, matching how `coding-standards-template.md` already works, and `SKILL.md` is reorganised into two independent parts so either can run alone. `README.md`'s manual steps now point at the skill as the shortcut and stay correct for anyone doing it by hand.

**Out of scope, so it is not re-derived:** the messaging channel's two environment variables. They are per-machine, not per-repository, and this skill configures a repository; `README.md` documents them and that is the right home.
