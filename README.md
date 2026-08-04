# ieuanign/skills

Ieuan's add-on agent skills for Claude Code — an issue-to-PR **dev-loop** over a custom agent roster, a
two-axis **code review**, and a **coding-standards** setup skill. Straight from my `.claude` directory,
packaged as a plugin.

> **Add-on, not standalone.** These lean on [Matt Pocock's skills](https://github.com/mattpocock/skills)
> (`/tdd`, `/code-review`, `/to-spec`, `/to-tickets`, the issue-tracker setup), declared as a plugin
> dependency — installing this one pulls his in.

---

## Install

```bash
/plugin marketplace add ieuanign/skills
/plugin install ieuanign-skills@ieuanign
```

Then configure each repo once — independent, so either order:

```bash
/mattpocock-skills:setup-matt-pocock-skills   # issue tracker, triage labels, docs/agents/* layout
/setup-ieuanign-skills                        # the coding-standards rubric + the workflow labels
```

- **Updates** — run `/plugin marketplace update ieuanign`, or turn on auto-update for the `ieuanign`
  marketplace in `/plugin` (off by default for third-party marketplaces).
- **Teams** — commit this to the repo's `.claude/settings.json` and teammates are prompted to install
  when they trust the repo:

```json
{
  "extraKnownMarketplaces": {
    "ieuanign": { "source": { "source": "github", "repo": "ieuanign/skills" } }
  }
}
```

### `npx skills add` — best effort

```bash
npx skills@latest add ieuanign/skills
```

Copies the skill files and they work, but two things don't come along — use the plugin install unless
you have a reason not to.

- The roster ships as **plugin** agents, which `npx` doesn't install, so `/dev-loop` has nothing to dispatch.
- `code-writer` and `debugger` preload skills under Matt's plugin namespace, which only resolves on the plugin path.

## The skills

### [`/dev-loop`](./skills/dev-loop/SKILL.md) — issue-to-PR pipeline

`/dev-loop <issues>` drives GitHub issues end-to-end — plan → implement → review → full-suite gate —
each in its own git worktree, parallel lanes, human gates only at plan approval and push/PR.
`/dev-loop auto <issues>` runs the same pipeline **unattended**: neither gate asks, and since nobody is
watching, the run reports itself — labels each issue before it spends a token, comments the plan,
labels and comments any lane the moment it ends, and messages you at each lane's start and finish.

#### Setting up unattended reporting

Both channels are optional and silent when absent; none of this applies to a supervised `/dev-loop`,
whose touchpoints are its two gates.

**1. Three labels, so GitHub shows where each run got to.**
[`/setup-ieuanign-skills`](./skills/setup-ieuanign-skills/SKILL.md) does this whole step for you — it
agrees the strings, writes the mapping, and offers the `gh` commands. By hand instead, create them in
your tracker:

```bash
gh label create in-progress    --color 1D76DB --description "An unattended /dev-loop run is working this issue"
gh label create awaiting-human --color D93F0B --description "The run reached a conclusion someone must act on"
gh label create failed         --color B60205 --description "A stage broke — a crash, not a verdict; a retry may work"
```

Then map them under a **Workflow roles** heading in `docs/agents/triage-labels.md` so the pipeline
resolves its three *roles* to your *strings*; rename them freely, an unmapped role is skipped silently.
That file comes from `/mattpocock-skills:setup-matt-pocock-skills` if you installed Matt's `triage`
skill, from `/setup-ieuanign-skills` otherwise, or write it yourself.

**2. Two environment variables, so a halt reaches your phone.** Add them under `env` in the project's
`.claude/settings.local.json` (local and gitignored, so the token stays off GitHub) —
`skills/dev-loop/notify.sh` sends via Telegram and stays silent (exit 0, no output) unless both are set:

```json
{
  "env": {
    "TELEGRAM_BOT_TOKEN": "123456789:AAF-eXampleT0kenFromBotFather",
    "TELEGRAM_CHAT_ID": "987654321"
  }
}
```

- `TELEGRAM_BOT_TOKEN` — the sending bot's token, from [@BotFather](https://t.me/BotFather).
- `TELEGRAM_CHAT_ID` — the chat to send to.
- Without step 1 you get messages but no labels; without step 2, labels but no messages; without
  either, a run that works in silence. No notification failure ever changes a lane's outcome.

#### Reading what a run cost

An unattended run leaves one cost log per lane at `.scratch/dev-loop-cost/<issue>.txt`, for every lane
whatever its ending — nothing is posted to the issue or PR, and a supervised run writes none. The same
report runs by hand over any finished run's transcripts; `cost-report.mjs` travels with the skill, so
it's in `skills/dev-loop/` in a checkout and in the plugin's installed copy under `~/.claude/plugins/`
otherwise:

```bash
node <skill-dir>/cost-report.mjs --issues 28,30 <transcriptDir>...
```

```
#28
Cost: 641K excluding cache reads (target 608K, +5%)
  write 44% · plan 29% · review 27% · suite 0.4%
```

- Pass **every** transcript directory the run produced — planning and execution are separate workflow
  invocations, and a lane's records are spread across both.
- Pass the issue numbers the run was asked to work, so a lane with no records reads as unmeasured
  rather than as a total of zero.
- The target is the median of 63 supervised lanes and a constant in the script. It gates nothing —
  **nothing halts, warns, or behaves differently because of what a lane costs.**

You are the orchestrator; the agent roster does the work:

| Agent | Role |
|---|---|
| `architecture-engineer` | Turns an issue into a binding implementation plan |
| `code-writer` | Implements one commit-scope at a time, commits locally |
| `reviewer` | Report-only, severity-ranked findings against the plan + your standards |
| `debugger` | Report-only root-cause investigator for red tests/builds |
| `notifier` | Writes an ended lane's label, comment and message from inside a running phase script (unattended only) |

The roster ships as **plugin agents** (`agents/`), installed alongside the skills — no copy step,
nothing added to your repo. The skill is repo- and machine-agnostic; per-repo settings live in
`docs/agents/dev-loop.md` (ask-then-persist on first run).

### [`/code-review-mp`](./skills/code-review-mp/SKILL.md) — two-axis diff review

Reviews the diff since a fixed point along two axes, each in its own parallel sub-agent so they don't
pollute each other's context, reported side by side.

- **Standards** — does the code follow this repo's documented coding standards + a Fowler smell baseline?
- **Spec** — does it match the originating issue/PRD?

Coexists with Matt's `/code-review`; this is the Standards-aware variant reading
`docs/agents/coding-standards.md`, so run both setup skills first.

### [`/setup-ieuanign-skills`](./skills/setup-ieuanign-skills/SKILL.md) — per-repo config

Two independent parts; run either or both, once per repo.

- **The coding-standards rubric** — distills your repo's `CLAUDE.md` files into
  `docs/agents/coding-standards.md`, the rubric the `reviewer` agent and the `/code-review` Standards
  axis read instead of re-discovering conventions each run. Re-run by hand if `CLAUDE.md` changes materially.
- **The workflow label vocabulary** — writes the **Workflow roles** section of
  `docs/agents/triage-labels.md`, step 1 above done for you: it agrees the three strings first, leaves
  any existing triage table alone, creates the file when `setup-matt-pocock-skills` didn't, and offers
  the `gh label create` commands rather than running them unasked.

Neither matters to a supervised `/dev-loop`, which writes no labels at all.

## For maintainers

- `npm run check` (`scripts/check.sh`) — validate the manifest, compile every phase script, confirm
  `package.json` and `plugin.json` versions agree. Run before opening a PR.
- `scripts/link-skills.sh` — symlink the skills and roster into this repo's own `.claude/`, live here
  and in no other project.
- `scripts/list-skills.sh` — list every `SKILL.md`.
- `scripts/sync-plugin-version.sh` — copies `package.json`'s version into `plugin.json`; runs as part of
  `npm run version`, never needed by hand.
- Versioned with [changesets](https://github.com/changesets/changesets); see `CLAUDE.md` for the
  add-a-skill checklist.

## Acknowledgements

Built on and designed to sit alongside [**Matt Pocock's skills**](https://github.com/mattpocock/skills)
(MIT); this repo's scaffolding follows the same conventions. Thanks, Matt.

## License

[MIT](./LICENSE) © 2026 Ieuan Ignatius
