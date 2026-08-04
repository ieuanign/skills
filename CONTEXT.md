# CONTEXT

Domain glossary for this repository. Terms only — no implementation detail.

## Skill

A folder under `skills/` containing a `SKILL.md` (plus optional supporting files). The unit `npx skills add` installs. Each `SKILL.md` is a prompt-driven instruction set the agent follows; it is not code.

## Add-on layer

This repo is **not** self-contained. It ships only skills that are original to Ieuan and declares [`mattpocock/skills`](https://github.com/mattpocock/skills) as a plugin dependency, so installing this one pulls Matt's in. The skills here reference Matt's (`/tdd`, `/code-review`, `/to-spec`, `/to-tickets`, the issue-tracker setup) rather than duplicating them.

## dev-loop

The issue-to-PR pipeline. An **orchestrator** skill that stays in the main worktree and delegates all planning, coding, reviewing, and debugging to the **agent roster**; it owns intake, human gates, worktree provisioning, push, and PRs. Repo- and machine-agnostic: it hardcodes no repository fact.

## Layer

The **horizontal** unit of `/dev-loop`'s ordering: the set of sub-lanes that run concurrently, every one of them based on a branch that already holds its commits. Layer 1 sits directly on the trunk; a sub-lane based on a branch that gets its commits in layer N runs in layer N+1. A batch with no stacking is a single layer.

A layer is not a stack. Three independent lanes sharing a layer form no chain at all — which is why one word cannot serve for both, and why "layer 2 runs after layer 1" reads correctly where "stack 2 runs after stack 1" would assert the opposite. (Unrelated to **Add-on layer** above, which is about what this repo builds on.)

## Stack

The **vertical** unit: a chain of branches each based on the one below. Its **trunk** is the branch underneath the whole chain — the repository's default branch. Its **bottom** is the layer sitting directly on that trunk, its **top** the layer nothing is based on. The vocabulary is the tool's own (`gh stack`), adopted so that someone reading this pipeline and someone reading `gh stack --help` are speaking one language.

A stack asserts dependency: the layer above needs what the layer below creates. Two lanes that merely touch the same file are not a stack, whatever ordering they end up in.

## Agent roster

The five subagents this plugin ships from `agents/` at its root: `architecture-engineer`, `code-writer`, `reviewer`, `debugger`, and `notifier`. They install with the plugin and are dispatched by name; nothing is copied into the consuming repo. The first four are dispatched by the orchestrator or a phase script for the work they do; `notifier` alone is dispatched only from inside a running phase script, and only under an unattended run, because that is the one moment the orchestrator has no shell.

## Smell override

A recorded exception to the smell baseline: a pattern this repository uses deliberately that would otherwise be reported as a code smell. Overrides live in `docs/agents/smell-overrides.md`, read by the `reviewer` agent and the code-review Standards axis. They are written from findings a human rejected, never distilled from `CLAUDE.md` — a repository where nothing has recurred yet correctly has no file at all.

Coding standards themselves are not this. They bind whether or not this plugin is installed, so they live in `CLAUDE.md` and `.claude/rules/`, per [ADR-0001](./docs/adr/0001-config-boundary.md).
