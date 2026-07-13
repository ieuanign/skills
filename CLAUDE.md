# CLAUDE.md

Maintainer notes for **this repo** (the skills package), not for repos that install it.

## What this is

An **add-on** collection of Claude Code skills that are original to Ieuan, layered on top of
[`mattpocock/skills`](https://github.com/mattpocock/skills). Consumers install Matt's first, then this.
See `README.md` for the consumer story and `CONTEXT.md` for the vocabulary.

## Layout

```
skills/<skill-name>/SKILL.md        # flat — one folder per skill, auto-discovered by `npx skills add`
skills/<skill-name>/...             # optional supporting files travel with the skill
.claude-plugin/plugin.json          # enumerates skill paths + version (for the /plugin install path)
.claude-plugin/marketplace.json     # marketplace metadata
```

Both distribution paths are supported: `npx skills add ieuanign/skills` (auto-discovers `SKILL.md`
folders) and `/plugin install ieuanign-skills@ieuanign` (reads `.claude-plugin/`).

## Adding or changing a skill

1. Create / edit `skills/<name>/SKILL.md` (+ any supporting files in the same folder).
2. If adding a skill, add its path to the `skills` array in `.claude-plugin/plugin.json`.
3. Link it from `README.md`.
4. Add a changeset: `npm run changeset` (describe the change; pick the bump).
5. Keep `package.json` `version` and `.claude-plugin/plugin.json` `version` in sync — a version bump
   updates both. Validate the plugin with `claude plugin validate . --strict`.

## Dogfooding

`scripts/link-skills.sh` symlinks every skill in this repo into `~/.claude/skills` and `~/.agents/skills`
so local edits are picked up live. `scripts/list-skills.sh` prints every `SKILL.md` path.

## Portability rule

Every skill here must stay repo- and machine-agnostic — no repository name, absolute path, or
project-specific fact baked into a `SKILL.md` or a bundled agent. Repo-specific config belongs in the
consuming repo's `docs/agents/` (via the setup skills), never here.
