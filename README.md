# ieuanign/skills

Ieuan's add-on agent skills for Claude Code — an issue-to-PR **dev-loop** over a custom agent roster,
plus a **coding-standards** setup skill.

Straight from my `.claude` directory, packaged so you can install them the same way you install
[Matt Pocock's skills](https://github.com/mattpocock/skills):

```bash
npx skills@latest add ieuanign/skills
```

> **This is an add-on, not a standalone.** These skills lean on Matt Pocock's skills (`/tdd`,
> `/code-review`, `/to-spec`, `/to-tickets`, the issue-tracker setup). **Install and configure
> [`mattpocock/skills`](https://github.com/mattpocock/skills) first** — see below.

---

## Prerequisite — install `mattpocock/skills` first

```bash
# 1. Install Matt's skills, selecting /setup-matt-pocock-skills among them.
npx skills@latest add mattpocock/skills

# 2. In your agent, configure them once per repo.
/setup-matt-pocock-skills
```

That sets up your issue tracker, triage labels, and doc layout (`docs/agents/*`) — the config these
add-on skills also read.

## Install these skills

```bash
npx skills@latest add ieuanign/skills
```

Pick the skills you want and which agents to install them on. Then configure the coding-standards rubric
once per repo:

```bash
/setup-ieuanign-skills
```

### Or install as a plugin (stays up to date)

`npx skills add` copies the skill files into place and never touches them again. The plugin path
installs a managed bundle instead — install once, and new releases of this repo reach you as updates:

```bash
# In your agent, one-time:
/plugin marketplace add ieuanign/skills
/plugin install ieuanign-skills@ieuanign
```

To pick up new releases, either run `/plugin marketplace update ieuanign` when you want them, or turn
on auto-update for the `ieuanign` marketplace in the `/plugin` menu (third-party marketplaces have it
off by default) — then updates land on their own shortly after each session starts.

For teams: commit this to your repo's `.claude/settings.json` and teammates get prompted to install
automatically when they trust the repo:

```json
{
  "extraKnownMarketplaces": {
    "ieuanign": {
      "source": { "source": "github", "repo": "ieuanign/skills" }
    }
  }
}
```

Either way, still run `/setup-ieuanign-skills` once per repo afterwards.

## The skills

### [`/dev-loop`](./skills/dev-loop/SKILL.md) — issue-to-PR pipeline

`/dev-loop <issues>` drives one or more GitHub issues end-to-end — plan → implement → review —
each in its own git worktree, with parallel lanes and human gates only at plan approval and push/PR.

You are the orchestrator; a bundled agent roster does the work:

| Agent | Role |
|---|---|
| `architecture-engineer` | Turns an issue into a binding implementation plan |
| `code-writer` | Implements one commit-scope at a time, commits locally |
| `reviewer` | Report-only, severity-ranked findings against the plan + your standards |
| `debugger` | Report-only root-cause investigator for red tests/builds |

The roster ships **inside** the skill (`skills/dev-loop/agents/`). On its first run in a repo, `dev-loop`
copies any missing roster members into that repo's `.claude/agents/` — no separate install step.
The skill is repo- and machine-agnostic; per-repo settings live in `docs/agents/dev-loop.md`
(ask-then-persist on first run).

### [`/code-review-mp`](./skills/code-review-mp/SKILL.md) — two-axis diff review

Reviews the diff since a fixed point along two independent axes reported side by side:
**Standards** (does the code follow this repo's documented coding standards + a Fowler smell baseline?)
and **Spec** (does it match the originating issue/PRD?). Each axis runs in its own parallel sub-agent so
they don't pollute each other's context.

Coexists with Matt's `/code-review` — this is the Standards-aware variant that reads
`docs/agents/coding-standards.md` (produced by `/setup-ieuanign-skills`). Run `/setup-matt-pocock-skills`
and `/setup-ieuanign-skills` first so it has the issue tracker and coding-standards rubric to draw on.

### [`/setup-ieuanign-skills`](./skills/setup-ieuanign-skills/SKILL.md) — coding-standards rubric

Distills your repo's `CLAUDE.md` files into `docs/agents/coding-standards.md`, the review rubric the
`reviewer` agent and the `/code-review` Standards axis read instead of re-discovering conventions each
run. Run it once per repo (re-run by hand if `CLAUDE.md` changes materially).

## For maintainers

- `npm run check` (`scripts/check.sh`) — validate the plugin manifest, compile every phase script, and
  confirm `package.json` and `plugin.json` versions agree. Run it before opening a PR.
- `scripts/link-skills.sh` — symlink every skill into `~/.claude/skills` and `~/.agents/skills` to
  dogfood local edits.
- `scripts/list-skills.sh` — list every `SKILL.md`.
- `scripts/sync-plugin-version.sh` — copies `package.json`'s version into `plugin.json`. Runs
  automatically as part of `npm run version`; you should never need it by hand.
- Versioned with [changesets](https://github.com/changesets/changesets); see `CLAUDE.md` for the
  add-a-skill checklist.

## Acknowledgements

Built on and designed to sit alongside [**Matt Pocock's skills**](https://github.com/mattpocock/skills)
(MIT). This repo's scaffolding — the changesets setup, release workflow, and dev scripts — follows the
same conventions. Thanks, Matt.

## License

[MIT](./LICENSE) © 2026 Ieuan Ignatius
