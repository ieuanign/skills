# ieuanign/skills

Ieuan's add-on agent skills for Claude Code — an issue-to-PR **dev-loop** over a custom agent roster,
plus a **coding-standards** setup skill.

Straight from my `.claude` directory, packaged as a plugin.

> **This is an add-on, not a standalone.** These skills lean on Matt Pocock's skills (`/tdd`,
> `/code-review`, `/to-spec`, `/to-tickets`, the issue-tracker setup). The plugin **declares
> [`mattpocock/skills`](https://github.com/mattpocock/skills) as a dependency**, so installing this
> one pulls Matt's in automatically.

---

## Install

```bash
/plugin marketplace add ieuanign/skills
/plugin install ieuanign-skills@ieuanign
```

That brings in the three skills, the five `dev-loop` roster agents, and Matt's plugin as a declared
dependency. Then configure each repo once — the two setup commands are independent, so run them in
either order:

```bash
/mattpocock-skills:setup-matt-pocock-skills   # issue tracker, triage labels, docs/agents/* layout
/setup-ieuanign-skills                        # the coding-standards rubric
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

### `npx skills add` — best effort

```bash
npx skills@latest add ieuanign/skills
```

This still copies the skill files into place and they work, but two things don't come with them.
The `dev-loop` roster agents ship as **plugin** agents, so `npx` doesn't install them — `/dev-loop`
has nothing to dispatch. And `code-writer` and `debugger` preload their skills under Matt's plugin
namespace, which only resolves on the plugin path. Use the plugin install unless you have a reason
not to.

## The skills

### [`/dev-loop`](./skills/dev-loop/SKILL.md) — issue-to-PR pipeline

`/dev-loop <issues>` drives one or more GitHub issues end-to-end — plan → implement → review → full-suite gate —
each in its own git worktree, with parallel lanes and human gates only at plan approval and push/PR.

`/dev-loop auto <issues>` runs the same pipeline **unattended**: neither gate asks, so an issue goes
from filed to pushed PR without supervision. Suppression removes the questions, not the work — and
since nobody is watching, the run reports itself instead: it labels each issue in progress before it
spends a token, comments the plan, labels and comments any lane that ends the moment it ends, and
messages you at each lane's start and finish.

#### Setting up unattended reporting

Both channels are **optional and silent when absent** — a run works without either, it just tells
you nothing. Nothing here applies to a supervised `/dev-loop`, whose touchpoints are its two gates.

**1. Three labels, so GitHub shows you where each run got to.** Create them in your tracker:

```bash
gh label create in-progress    --color 1D76DB --description "An unattended /dev-loop run is working this issue"
gh label create awaiting-human --color D93F0B --description "The run reached a conclusion someone must act on"
gh label create failed         --color B60205 --description "A stage broke — a crash, not a verdict; a retry may work"
```

Then map them in `docs/agents/triage-labels.md` under a **Workflow roles** heading, so the pipeline
can resolve its three *roles* to your *strings* — rename them freely, the skill hardcodes none.
A role you leave unmapped is skipped silently. `/mattpocock-skills:setup-matt-pocock-skills` creates
that file, but only if you also installed Matt's `triage` skill; without it, create it yourself.

**2. Two environment variables, so a halt reaches your phone.** `skills/dev-loop/notify.sh` sends
via Telegram and stays silent — exit 0, no output — unless both are set:

```bash
export TELEGRAM_BOT_TOKEN=...   # from @BotFather
export TELEGRAM_CHAT_ID=...     # the chat to send to
```

Outbound sending is safe to run concurrently with anything else using the same bot.

Without step 1 you get messages but no labels; without step 2, labels but no messages; without
either, a run that works in silence. No notification failure ever changes a lane's outcome.

#### Reading what a run cost

`skills/dev-loop/cost-report.mjs` says what a lane cost and which stage spent it, reading the
per-agent transcripts a finished run left behind:

```bash
node skills/dev-loop/cost-report.mjs --issues 28,30 <transcriptDir>...
```

```
#28
Cost: 641K excluding cache reads (target 608K, +5%)
  write 44% · plan 29% · review 27% · suite 0.4%
```

Pass every transcript directory the run produced — planning and execution are separate workflow
invocations with a directory each, and a lane's records are spread across them. Give it the issue
numbers the run was asked to work; a lane with no records says it was not measured rather than
reporting a total of zero.

The target is the median measured across 63 supervised lanes and is a constant in the script — it
exists so the report can print a signed percentage, and it gates nothing. **Nothing halts, warns,
or behaves differently because of what a lane costs.** The report reads and prints; that is all.

You are the orchestrator; the agent roster does the work:

| Agent | Role |
|---|---|
| `architecture-engineer` | Turns an issue into a binding implementation plan |
| `code-writer` | Implements one commit-scope at a time, commits locally |
| `reviewer` | Report-only, severity-ranked findings against the plan + your standards |
| `debugger` | Report-only root-cause investigator for red tests/builds |
| `notifier` | Writes an ended lane's label, comment and message from inside a running phase script (unattended only) |

The roster ships as **plugin agents** (`agents/`), installed alongside the skills — no copy step and
nothing added to your repo. The skill is repo- and machine-agnostic; per-repo settings live in
`docs/agents/dev-loop.md` (ask-then-persist on first run).

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
- `scripts/link-skills.sh` — symlink the skills and the roster into this repo's own `.claude/`, so
  local edits are live while working here and in no other project.
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
