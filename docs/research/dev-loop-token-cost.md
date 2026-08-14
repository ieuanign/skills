# Where /dev-loop's tokens go vs /implement (#236)

Measured 2026-08-14 against the working tree at commit `41cca38`, the official Claude Code skills
documentation, and the real cost logs in the main checkout's `.scratch/dev-loop-cost/`. Token
estimates use **chars/4** throughout — an approximation, stated here once; every byte figure is exact
(`wc -c`).

## The one honest metric, and the headline

There are two different costs people conflate, and the artifacts measure only one of them:

| Metric | /dev-loop | /implement | Source |
|---|---|---|---|
| **Orchestrator-context load at invocation** (rendered SKILL.md injected into the invoking session) | 61,782 B ≈ **15,400 tokens** | 433 B ≈ **110 tokens** (~143× smaller) | `wc -c skills/dev-loop/SKILL.md`; `wc -c .../mattpocock-skills/1.2.3/skills/engineering/implement/SKILL.md` |
| **Whole-run agent spend per lane** (input + cache creation + output, excluding cache reads) | median **462.5K** over 18 real lanes (range 126K–1,724K); baseline constant 608K | **unmeasured — no artifact exists** | `/home/pi/projects/skills/.scratch/dev-loop-cost/*.txt`; `skills/dev-loop/cost-report.mjs:26` |

The skill-prose load is real but small next to the run itself: on the measured lanes it is ~3% of a
median lane's spend. The place /dev-loop's tokens actually go is the agents' work — the per-lane
stage splits below put ~46–58% in `write`, ~14–34% in `plan`, ~12–27% in `review`.

## 1. Load cost of the skill prose

`skills/dev-loop/` holds 155,135 bytes across 8 files, but only **one** of them ever enters the
orchestrator's context. The SKILL.md itself states the split — each supporting file is named at the
point it is *executed* or handed to another agent, never read:

| File | Bytes | Est. tokens | Orchestrator context? | Why |
|---|---|---|---|---|
| `SKILL.md` | 61,782 | ~15,400 | **Yes — the whole body, at invocation** | skill body injection (docs, §2 below) |
| `phase-execute.js` | 44,836 | 0 | No — executed | Workflow `scriptPath`, `skills/dev-loop/SKILL.md:235` |
| `cost-report.mjs` | 14,450 | 0 | No — executed | `node <this-skill-dir>/cost-report.mjs`, `skills/dev-loop/SKILL.md:370` |
| `notifications.md` | 13,130 | 0 | No — the notifier agent's spec | "against a specification you never load and never restate", `skills/dev-loop/SKILL.md:49`; passed by path via `skillDir`, `skills/dev-loop/SKILL.md:235` |
| `stack-link.sh` | 7,477 | 0 | No — executed | `<this-skill-dir>/stack-link.sh <pr-number> ...`, `skills/dev-loop/SKILL.md:351` |
| `preconditions.mjs` | 6,180 | 0 | No — executed | `node <this-skill-dir>/preconditions.mjs`, `skills/dev-loop/SKILL.md:152` |
| `phase-plan.js` | 5,120 | 0 | No — executed | Workflow `scriptPath`, `skills/dev-loop/SKILL.md:179` |
| `notify.sh` | 2,160 | 0 | No — executed | `<this-skill-dir>/notify.sh <<'MSG'`, `skills/dev-loop/SKILL.md:75` |

So 61,782 of 155,135 bytes (39.8%) are context-bearing; the other 93,353 bytes cost ~0 orchestrator
context per run.

**The comparison.** `/home/pi/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/1.2.3/skills/engineering/implement/SKILL.md`
is 433 bytes ≈ 110 tokens — a 13-line prompt that delegates to `/tdd` and `/code-review` (whose own
bodies load only if invoked). Its folder's only other file is `agents/openai.yaml` (139 B), which
Claude Code does not load as context. On the load metric, dev-loop's prose costs **~143×** more.

**Standing frontmatter cost** (before any invocation): dev-loop's `description`
(`skills/dev-loop/SKILL.md:3`, 217 chars ≈ 54 tokens) sits in every session's skill listing.
implement sets `disable-model-invocation: true`, and per the docs' invocation table its description
is *not* in context at all ("Description not in context, full skill loads when you invoke" —
https://code.claude.com/docs/en/skills, "Control who invokes a skill").

## 2. What the official docs say about skill loading

All claims from https://code.claude.com/docs/en/skills (fetched 2026-08-14):

- **The whole body is injected on invocation, once, and persists**: "When you or Claude invoke a
  skill, the rendered `SKILL.md` content enters the conversation as a single message and stays there
  for the rest of the session. … Claude Code does not re-read the skill file on later turns." (§Skill
  content lifecycle)
- **Before invocation, only the frontmatter description costs anything**: "In a regular session,
  skill descriptions are loaded into context so Claude knows what's available, but full skill content
  only loads when invoked." (§Control who invokes a skill, Note) The listed `description` +
  `when_to_use` text "is truncated at 1,536 characters in the skill listing to reduce context usage."
  (§Frontmatter reference)
- **Supporting files load only when read; scripts are executed, not loaded**: "Large reference docs,
  API specifications, or example collections don't need to load into context every time the skill
  runs" — the layout example labels `scripts/helper.py` "utility script - executed, not loaded".
  (§Add supporting files)
- **Every line recurs**: "Once a skill loads, its content stays in context across turns, so every
  line is a recurring token cost." (§Types of skill content)
- **Compaction cap**: after auto-compaction each re-invoked skill keeps only "the first 5,000 tokens",
  under a shared 25,000-token budget. (§Skill content lifecycle) At ~15,400 tokens, dev-loop's body
  loses roughly two-thirds of itself the first time a run compacts — the sections past Act 0 are what
  gets dropped.
- The docs' size guidance: "Keep `SKILL.md` under 500 lines." (§Add supporting files, Tip) —
  dev-loop's 397 lines are inside it; the cost is line *density*, not count.

## 3. Per-section cost, largest first

Split on `##` headings (subsections counted with their parent; heading lines included; bytes exact,
tokens = bytes/4):

| Section (`skills/dev-loop/SKILL.md`) | Bytes | Est. tokens | Share |
|---|---|---|---|
| Gate 2 — push & PR | 18,461 | ~4,615 | 29.9% |
| Act 0 — Intake | 10,588 | ~2,647 | 17.1% |
| Arguments (incl. Run mode, ⟨notify⟩ shapes) | 6,455 | ~1,614 | 10.4% |
| Act 3 — Phase B: execute | 6,383 | ~1,596 | 10.3% |
| Repo profile (ask-then-persist) | 3,855 | ~964 | 6.2% |
| Gate 1 — plan approval | 3,792 | ~948 | 6.1% |
| Hard rules | 3,417 | ~854 | 5.5% |
| Act 2 — Provisioning | 1,700 | ~425 | 2.8% |
| Where configuration lives | 1,671 | ~418 | 2.7% |
| Act 4 — the cost log | 1,622 | ~406 | 2.6% |
| Derived facts | 1,447 | ~362 | 2.3% |
| Act 1 — Phase A: plans | 1,332 | ~333 | 2.2% |
| Preamble (frontmatter + intro) | 1,059 | ~265 | 1.7% |

The top three — Gate 2, Act 0, Arguments — are 57.4% of the file, and all three are
orchestrator-owned mechanics (PR bodies and the findings ledger; intake preconditions and refusals;
run-mode/notification semantics). The four sections describing the agents' actual work (Acts 1–3,
Gate 1) total just 21.4%.

## 4. The recalled "45k vs <10k" baseline

**Unverifiable from today's artifacts — and not what any artifact measures.**

Real artifacts exist: 18 per-lane cost logs at `/home/pi/projects/skills/.scratch/dev-loop-cost/`
(issues 140–145, 154, 171, 174–176, 187–191, 219, 220), written by `skills/dev-loop/cost-report.mjs`.
Their metric is defined at `skills/dev-loop/cost-report.mjs:44-54`: **input + cache creation +
output tokens, excluding cache reads**, summed per lane across every agent transcript and split by
stage. The in-code baseline is `TARGET_TOKENS = 608_000` (`cost-report.mjs:26`), "measured as a
single median across three repositories" (`cost-report.mjs:22`), and `cost-report.mjs:46` is
explicit that "the comparison is meaningless against any other" metric.

What the 18 logs show: 126K–1,724K per lane, median **462.5K**; e.g.
`.scratch/dev-loop-cost/220.txt`: "Cost: 1724K … write 58% · review 25% · plan 14% · suite 3%";
`.scratch/dev-loop-cost/140.txt`: "Cost: 389K … write 52% · plan 30% · review 14% · suite 5%".

Why 45k-vs-<10k cannot be checked against them:

- No artifact contains a number at 45k scale, and none measures `/implement` at all — the tool keys
  every transcript on the `[dev-loop lane=#N stage=S]` marker (`cost-report.mjs:41`), which an
  `/implement` session never emits.
- If the recalled figure meant *skill-load context*, §1 above is the measurement, and the honest
  numbers are ~15.4k vs ~0.1k — not 45k vs <10k.

A verifying measurement would need: (a) an `/implement` run on a comparable issue, (b) its session
transcript summed on the same `meteredTokens` metric (input + cache creation + output, excluding
cache reads) without the lane-marker filter, and (c) a same-repo `/dev-loop` lane summed identically
— three primary numbers, none of which exists today.
