---
name: setup-ieuanign-skills
description: Configure this repo's coding-standards review rubric — distill existing CLAUDE.md files into docs/agents/coding-standards.md. Run once before first use of /code-review's Standards axis (and the reviewer agent that links it).
disable-model-invocation: true
---

# Setup Ieuan's Skills

Scaffold `docs/agents/coding-standards.md` — the repo-tailored review rubric `/code-review`'s Standards axis reads instead of rediscovering conventions from scratch each run, and the `reviewer` agent inside `/dev-loop` reads via the same skill.

This is a prompt-driven skill, not a deterministic script. Explore, draft, stress-test with the user, then write.

## Process

### 1. Explore

Find every `CLAUDE.md` in the repo — the root, and any nested ones a multi-context repo splits by area (`backend/CLAUDE.md`, `frontend/CLAUDE.md`, etc.). Read all of them. Also check for `CODING_STANDARDS.md` / `CONTRIBUTING.md`.

Check whether `docs/agents/coding-standards.md` already exists. If it does, tell the user and ask whether to regenerate (CLAUDE.md may have changed since) or leave it alone — don't overwrite silently.

### 2. Draft

Distil the CLAUDE.md content into a review rubric, one section per area (one section total for a single-context repo; one per context for a multi-context repo — mirror however the repo already splits its CLAUDE.md files). Per area:

- **Hard rules** — binding conventions the area's CLAUDE.md states as non-negotiable (e.g. "sqlmock is banned", "every form page MUST use react-hook-form"). Quote or closely paraphrase; a reviewer must be able to trace each rule back to its source file.
- **Smell-baseline overrides** — anywhere this repo's own pattern would otherwise trip one of `/code-review`'s twelve baseline smells (Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest). Name the smell and the repo pattern that suppresses it.

Use [coding-standards-template.md](./coding-standards-template.md) as the skeleton.

### 3. Stress-test

Before writing anything, run a `/grilling` session on the draft with the user — walk through each area's hard rules and smell overrides one at a time, resolve ambiguity, and cut anything that reads as a guess rather than something a CLAUDE.md actually says.

### 4. Write

Write `docs/agents/coding-standards.md`. If the repo already has a `## Agent skills` block in its `CLAUDE.md`/`AGENTS.md` (the convention `setup-matt-pocock-skills` established), add a one-line "Coding standards" entry pointing at it — otherwise leave that block alone; this skill doesn't create it on its own.

### 5. Done

Tell the user setup is complete and which skills/agents now read this file: `/code-review`'s Standards axis, and the `reviewer` agent inside `/dev-loop` (via its `code-review` skill link). Mention that CLAUDE.md stays the binding source — this doc is a derived rubric that doesn't re-sync automatically; re-run this skill by hand if CLAUDE.md changes materially.
