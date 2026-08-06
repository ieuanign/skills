# CLAUDE.md

Maintainer notes for **this repo** (the skills package), not for repos that install it.

## What this is

An **add-on** collection of Claude Code skills that are original to Ieuan, layered on top of
[`mattpocock/skills`](https://github.com/mattpocock/skills). The plugin declares Matt's as a
dependency, so installing this one pulls it in — there is no install order for consumers to get right.
See `README.md` for the consumer story and `CONTEXT.md` for the vocabulary.

## Layout

```
skills/<skill-name>/SKILL.md        # flat — one folder per skill, auto-discovered by `npx skills add`
skills/<skill-name>/...             # optional supporting files travel with the skill
agents/<agent-name>.md              # the dev-loop roster, as plugin agents
.claude-plugin/plugin.json          # enumerates skill paths + version (for the /plugin install path)
.claude-plugin/marketplace.json     # marketplace metadata + the mattpocock-skills dependency
```

`/plugin install ieuanign-skills@ieuanign` (reads `.claude-plugin/`) is the supported path; it is the
only one that installs the roster and the only one where the agents' namespaced skill preloads
resolve. `npx skills add ieuanign/skills` still works for the skills alone — it auto-discovers
`SKILL.md` folders and nothing else.

The repo root is the plugin root (`"source": "./"`), so `agents/` is the default agent location.
Do **not** add an `agents` field to `plugin.json` — the default discovery already covers it.

## Adding or changing a skill

1. Create / edit `skills/<name>/SKILL.md` (+ any supporting files in the same folder). A roster agent
   is `agents/<name>.md` instead, and needs no manifest entry.
2. If adding a skill, add its path to the `skills` array in `.claude-plugin/plugin.json`.
3. Link it from `README.md`.
4. Add a changeset: `npm run changeset` (describe the change; pick the bump).
5. Keep `package.json` `version` and `.claude-plugin/plugin.json` `version` in sync — a version bump
   updates both. Validate the plugin with `claude plugin validate . --strict`.

## Dogfooding

`scripts/link-skills.sh` symlinks every skill into this repo's own `.claude/skills/`, and every roster
agent into `.claude/agents/`, so local edits are live here and nowhere else. `scripts/list-skills.sh`
prints every `SKILL.md` path.

Project scope on purpose. A half-finished skill under `~/.claude/skills/` would outrank the released
one in every other project on the machine — personal scope overrides project scope, so the in-progress
copy wins wherever you go. Keeping the links here confines that to the repo they belong to. Both
destinations are gitignored and every link is relative, so the checkout stays clean and movable.

## Temporary files

Every throwaway artifact goes under `.scratch/` at the repo root — scratch scripts, intermediate
output, working notes, a `/dev-loop` run's plans. Create it if missing; it is gitignored. Reach for
`.scratch/` where you would otherwise reach for `/tmp` or a system temp dir.

## Portability rule

Every skill here must stay repo- and machine-agnostic — no repository name, absolute path, or
project-specific fact baked into a `SKILL.md` or a bundled agent. Repo-specific config belongs in the
consuming repo's `docs/agents/` (via the setup skills), never here.

## Subagent returns

Be extremely concise. A return is data for its caller, not an essay — verdict first, then bullets
that each carry a concrete anchor: file:line, path, command, or exact output. Compress by cutting
sentences, never facts; keep every identifier verbatim. No preamble, no restating the task, no
closing summary. If a sentence doesn't change what the caller does next, it isn't information.

An agent whose own definition sets a return format follows that instead.

## Agent skills

Config for this repo's own use of the engineering skills. (Consistent with the portability rule above:
these are this repo's facts, kept out of `skills/`.)

### Issue tracker

Issues and PRDs live as GitHub issues in `ieuanign/skills`, managed with the `gh` CLI.
See `docs/agents/issue-tracker.md`.

### Triage labels

Two families, each label string equal to its role name: the five canonical triage roles a human
applies, and the three workflow roles an unattended `/dev-loop` run applies to report on itself.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.
