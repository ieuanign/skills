# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists — it points at one `CONTEXT.md` per context. Read each one relevant to the topic.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms actually get resolved.

## File structure

Single-context repo (most repos):

```
/
├── CONTEXT.md
└── src/
```

Multi-context repo (presence of `CONTEXT-MAP.md` at the root):

```
/
├── CONTEXT-MAP.md
└── src/
    ├── ordering/
    │   └── CONTEXT.md
    └── billing/
        └── CONTEXT.md
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Decisions live with the code they bind

This repo keeps **no architecture decision records** — no `docs/adr/`, and none to create. A decision record is a snapshot that reads as normative long after the code has moved on, and the pointers to it become the maintenance burden.

What survives of a decision is its **rejected alternative** — the thing the code cannot show, because code carries only what exists. Write that where someone would re-litigate it: a sentence at the bound, the loop, or the guard it constrains, so the same edit that invalidates the reasoning has it on screen. Prefer a test where the decision is an invariant.

So: record the decision inline at its site, and never create a file under `docs/adr/`.
