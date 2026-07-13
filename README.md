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

Prefer a read-only, always-current managed bundle instead? Use the plugin path:

```bash
/plugin install ieuanign-skills@ieuanign
```

## The skills

### [`/dev-loop`](./skills/dev-loop/SKILL.md) — issue-to-PR pipeline

`/dev-loop <issues>` drives one or more GitHub issues end-to-end — plan → implement → review → sign-off —
each in its own git worktree, with parallel lanes and human gates only at plan approval and push/PR.

You are the orchestrator; a bundled agent roster does the work:

| Agent | Role |
|---|---|
| `architecture-engineer` (+ `-lite`) | Turns an issue into a binding implementation plan |
| `code-writer` (+ `-lite`) | Implements one commit-scope at a time, commits locally |
| `reviewer` | Report-only, severity-ranked findings against the plan + your standards |
| `debugger` | Report-only root-cause investigator for red tests/builds |

The roster ships **inside** the skill (`skills/dev-loop/agents/`). On its first run in a repo, `dev-loop`
copies any missing roster members into that repo's `.claude/agents/` — no separate install step.
The skill is repo- and machine-agnostic; per-repo settings live in `docs/agents/dev-loop.md`
(ask-then-persist on first run).

### [`/setup-ieuanign-skills`](./skills/setup-ieuanign-skills/SKILL.md) — coding-standards rubric

Distills your repo's `CLAUDE.md` files into `docs/agents/coding-standards.md`, the review rubric the
`reviewer` agent and the `/code-review` Standards axis read instead of re-discovering conventions each
run. Run it once per repo (re-run by hand if `CLAUDE.md` changes materially).

## For maintainers

- `scripts/link-skills.sh` — symlink every skill into `~/.claude/skills` and `~/.agents/skills` to
  dogfood local edits.
- `scripts/list-skills.sh` — list every `SKILL.md`.
- Versioned with [changesets](https://github.com/changesets/changesets); see `CLAUDE.md` for the
  add-a-skill checklist.

## Acknowledgements

Built on and designed to sit alongside [**Matt Pocock's skills**](https://github.com/mattpocock/skills)
(MIT). This repo's scaffolding — the changesets setup, release workflow, and dev scripts — follows the
same conventions. Thanks, Matt.

## License

[MIT](./LICENSE) © 2026 Ieuan Ignatius
