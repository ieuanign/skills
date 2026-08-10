# ieuanign/skills

Ieuan's add-on agent skills for Claude Code: an issue-to-PR **dev-loop** over a custom agent roster, a
two-axis **code review**, and per-repo **setup**.

> **Add-on, not standalone.** Declares [Matt Pocock's skills](https://github.com/mattpocock/skills) as a
> plugin dependency — installing this one pulls his in.

## Install

```bash
/plugin marketplace add ieuanign/skills
/plugin install ieuanign-skills@ieuanign
```

Then once per repo — independent, either order:

```bash
/mattpocock-skills:setup-matt-pocock-skills   # issue tracker, triage labels, docs/agents/ layout
/setup-ieuanign-skills                        # workflow labels + your .claude/rules/ conventions
```

- **Updates** — `/plugin marketplace update ieuanign`, or turn on auto-update in `/plugin` (off by
  default for third-party marketplaces).
- **Teams** — commit this to the repo's `.claude/settings.json` and teammates are prompted on trust:
  ```json
  { "extraKnownMarketplaces": { "ieuanign": { "source": { "source": "github", "repo": "ieuanign/skills" } } } }
  ```
- **`npx skills@latest add ieuanign/skills`** copies the skill files only. The roster ships as *plugin*
  agents, so `/dev-loop` has nothing to dispatch. Prefer the plugin install.

## Skills

| Skill | What it does |
|---|---|
| [`/dev-loop`](./skills/dev-loop/SKILL.md) | GitHub issues → pull requests: plan → implement → review → full-suite gate, one git worktree per lane, lanes in parallel |
| [`/dev-loop-cleanup`](./skills/dev-loop-cleanup/SKILL.md) | Deletes the branch and plan of every **merged** lane; *lists* lingering worktrees with a reason, removing none |
| [`/pr-comments`](./skills/pr-comments/SKILL.md) | One pull request's unresolved comments, classified **fix** or **skip** for your approval; the approved fix then runs through `/dev-loop`'s execute phase and is pushed to that pull request's own branch |
| [`/code-review-mp`](./skills/code-review-mp/SKILL.md) | Reviews a diff on two parallel axes — **Standards** (`CLAUDE.md`, `.claude/rules/`, Fowler smells, your `docs/agents/smell-overrides.md`) and **Spec** (the originating issue/PRD) |
| [`/setup-ieuanign-skills`](./skills/setup-ieuanign-skills/SKILL.md) | Per-repo config in three independent parts: smell overrides, the workflow labels, `.claude/rules/` conventions. Nothing written without an explicit yes |

## `/dev-loop`

```
/dev-loop [auto] <issues> [project:<slug>]
```

**Gated** by default — humans answer at plan approval (Gate 1) and push/PR (Gate 2). `auto` runs
**unattended**: it suppresses the questions, not the work, and the run reports itself instead — labels
each issue before spending a token, comments the plan, labels and comments each lane the moment it
ends, and messages you at every lane's start and finish. It never interviews you either: a one-time
profile question takes its documented default, used for that run and persisted nowhere, or — where no
default would be honest — refuses the batch up front, naming every missing prerequisite on every issue
you named.

You are the orchestrator; the roster does the work, installed alongside the skills with no copy step:

| Agent | Role |
|---|---|
| `architecture-engineer` | Turns an issue into a binding implementation plan |
| `code-writer` | Implements one commit-scope at a time, commits locally |
| `reviewer` | Report-only, severity-ranked findings against the plan and your standards |
| `debugger` | Report-only root-cause investigator for red tests and builds |
| `notifier` | Writes an ended lane's label, comment and message from inside the phase script (unattended only) |

The skill is repo- and machine-agnostic; per-repo settings live in `docs/agents/dev-loop.md`
(ask-then-persist on first run).

### Unattended reporting

Both channels are optional and silent when absent, and neither applies to a gated run. No notification
failure ever changes a lane's outcome.

**Labels** — `/setup-ieuanign-skills` does this whole step. By hand: create three labels, then map them
under a **Workflow roles** heading in `docs/agents/triage-labels.md` so the pipeline resolves its
*roles* to your *strings*. Rename freely; an unmapped role is skipped.

```bash
gh label create in-progress    --color 1D76DB --description "An unattended /dev-loop run is working this issue"
gh label create awaiting-human --color D93F0B --description "The run reached a conclusion someone must act on"
gh label create failed         --color B60205 --description "A stage broke — a crash, not a verdict; a retry may work"
```

**Messages** — set both vars under `env` in `.claude/settings.local.json` (gitignored, so the token
stays off GitHub). `skills/dev-loop/notify.sh` sends via Telegram and exits 0 silently unless both are
set.

```json
{ "env": { "TELEGRAM_BOT_TOKEN": "123456789:AAF-eXampleT0kenFromBotFather", "TELEGRAM_CHAT_ID": "987654321" } }
```

### Cost

An unattended run writes one log per lane to `.scratch/dev-loop-cost/<issue>.txt`, whatever the ending
— nothing is posted to the issue or PR, and a gated run writes none. Re-run it by hand over any
finished run's transcripts (`cost-report.mjs` travels with the skill):

```bash
node <skill-dir>/cost-report.mjs --issues 28,30 <transcriptDir>...
```

```
#28
Cost: 641K excluding cache reads (target 608K, +5%)
  write 44% · plan 29% · review 27% · suite 0.4%
```

Pass **every** transcript directory the run produced (planning and execution are separate workflow
invocations) and the issue numbers it was asked to work, so a lane with no records reads as unmeasured
rather than zero. The 608K target is a constant — a single median measured across three repositories —
and it exists only to print a signed percentage: **nothing halts, warns or behaves differently because
of what a lane costs.**

### Further reading — a run loads none of it

- [**How a run works**](./docs/dev-loop.md) — run shapes, prerequisites, common questions, "it's working if".
- [**Internals**](./docs/dev-loop-internals.md) — what `phase-execute.js` enforces: the implement and
  review loops and their bounds, the suite gate, return contracts, endings, the terminal-state table.
- [**How to improve your `/dev-loop`**](./docs/improving-dev-loop.md) — the pipeline is fixed, so it
  improves by what your repo tells it. Five things worth declaring, in payoff order.

## `/pr-comments`

```
/pr-comments [auto] <pull request>
```

**Gated** by default — you approve the comment table before anything below it runs. `auto` suppresses
that question and resolves the `/dev-loop` profile ones itself: the table is posted on the pull request
in the gate's place, and the run's conclusion beside it — or, where a prerequisite it needs has no
honest default, one refusal comment in place of both. Either way, every review thread the table covers
is answered in that thread.

- [**How a run works**](./docs/pr-comments.md) — the table that *is* the plan, what a run
  refuses to do and why, both run shapes, common questions, "it's working if". A run loads none of it.

## For maintainers

- `npm run check` — validate the manifest, compile every phase script, confirm the `package.json` and
  `plugin.json` versions agree. Run before opening a PR.
- `scripts/link-skills.sh` symlinks the skills and roster into this repo's own `.claude/`, live here
  and nowhere else; `scripts/list-skills.sh` lists every `SKILL.md`.
- Versioned with [changesets](https://github.com/changesets/changesets); `CLAUDE.md` has the
  add-a-skill checklist.
- [`docs/dev-loop-rule-inventory.md`](./docs/dev-loop-rule-inventory.md) and
  [`docs/dev-loop-verification.md`](./docs/dev-loop-verification.md) — the 389-rule relocation ledger
  and what the compression was proven to preserve. Historical records of #121.

## Acknowledgements

Built on and designed to sit alongside [**Matt Pocock's skills**](https://github.com/mattpocock/skills)
(MIT); this repo's scaffolding follows the same conventions. Thanks, Matt.

## License

[MIT](./LICENSE) © 2026 Ieuan Ignatius
