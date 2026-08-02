# CONTEXT

Domain glossary for this repository. Terms only — no implementation detail.

## Skill

A folder under `skills/` containing a `SKILL.md` (plus optional supporting files). The unit `npx skills add` installs. Each `SKILL.md` is a prompt-driven instruction set the agent follows; it is not code.

## Add-on layer

This repo is **not** self-contained. It ships only skills that are original to Ieuan and assumes [`mattpocock/skills`](https://github.com/mattpocock/skills) is already installed and configured. The skills here reference Matt's (`/tdd`, `/code-review`, `/to-spec`, `/to-tickets`, the issue-tracker setup) rather than duplicating them.

## dev-loop

The issue-to-PR pipeline. An **orchestrator** skill that stays in the main worktree and delegates all planning, coding, reviewing, and debugging to the **agent roster**; it owns intake, human gates, worktree provisioning, push, and PRs. Repo- and machine-agnostic: it hardcodes no repository fact.

## Agent roster

The four subagents this plugin ships from `agents/` at its root: `architecture-engineer`, `code-writer`, `reviewer`, and `debugger`. They install with the plugin and are dispatched by name; nothing is copied into the consuming repo.

## Coding standards

`docs/agents/coding-standards.md` — a per-repo review rubric distilled from the repo's `CLAUDE.md` files by `/setup-ieuanign-skills`. The `reviewer` agent and the code-review Standards axis read it; `CLAUDE.md` stays the binding source, this file is a derived scan-time rubric.
