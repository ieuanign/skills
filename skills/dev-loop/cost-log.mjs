#!/usr/bin/env node
// Per-lane cost log for an unattended /dev-loop run — reporting, and never enforcement.
//
// NOTHING IN THIS PIPELINE HALTS ON TOKENS. This file only reads and writes: it is run by the
// host after a phase script returns, it changes no ending, no push, no pull request and no
// worktree, and a lane that spends ten times the target still finishes. contracts.md's **Cost
// reporting** section carries why a ceiling was dropped rather than fixed.
//
// It lives here rather than inside a phase script because a workflow script has no filesystem
// access, and the instrument that produced the baseline figure is a directory of transcripts. The
// host has a shell; the script does not. That asymmetry is the whole reason this file exists.
//
// Invocation — the request arrives on standard input as one JSON object, the same convention
// notify.sh uses in this folder:
//
//   node <skill-dir>/cost-log.mjs <<'JSON'
//   { "outDir": "/abs/.scratch/<project>/cost",
//     "runs": ["<transcriptDir>", ...],
//     "lanes": [{ "issue": 8, "planPath": "...", "ending": {"category":"HALT","reason":"..."},
//                 "subLanes": [{ "branch": "feat/8", "worktree": "/abs/..." }] }] }
//   JSON
//
// `lanes` is the array the host already passed to phase-execute.js — extra keys are ignored, so
// it is handed over rather than rebuilt. `runs` is one transcript directory per Workflow call the
// batch made (Phase A, plus each wave's Phase B), which is why the host is told to keep them.
// `outDir` is one directory for the whole batch, because the host is what knows where its own
// scratch directory is and which project slug the run used.
//
// There is deliberately NO key for the target below. SKILL.md's configuration rule refuses a
// per-run override of cost behaviour, and a target that can be passed in is one.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The measured baseline: the median lane across 63 completed supervised lanes, on the metric
// below. A MARKER, not a gate — its only job is to let the log print a percentage. It is a
// constant and not a repository profile key because it was measured as a single median across
// three repositories with no evidence it varies by one; promote it if one repository's lanes
// prove consistently larger.
export const TARGET_TOKENS = 608_000

// The baseline's metric: input + cache creation + output, EXCLUDING cache reads. The choice was
// argued where the baseline was measured and is repeated here because the number is meaningless
// without it — the all-tokens figure carries more spread, and the excess is cache reads, which
// track turn count and session layout rather than lane work. Output-only ignores context loading
// entirely. This middle metric is the least gameable of the three.
export function tokensExcludingCacheReads(usage) {
  if (!usage) return 0
  return (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.output_tokens || 0)
}

// Stage names, one per role. The four the baseline split are plan / write / review / suite; debug
// and notify are stages this pipeline has and the baseline never saw fire — the debugger fired
// zero times across all 63 supervised lanes, because a human was watching and killed trouble
// early. Unattended mode removes that observer, so they are named here rather than pooled into
// `other`, which would hide exactly the cost the first unattended runs exist to measure.
export const STAGE_OF_TYPE = {
  'architecture-engineer': 'plan',
  'code-writer': 'write',
  reviewer: 'review',
  debugger: 'debug',
  notifier: 'notify',
}

// The suite gate is the one stage contracts.md dispatches with deliberately NO agent type — a
// plain subagent, because loading a role definition to run one command is waste. So it has no
// meta entry to be named from, ever, and the prompt table below is not a fallback for it but its
// only route. `scripts/check.sh` asserts phase-execute.js still opens suitePrompt() with this
// sentence: a phase script imports nothing, so a shared constant is not available, and without
// that assertion a reworded sentence would move the gate's spend into `other` silently.
export const SUITE_OPENING = /^\s*Run this repository's full test suite once/

// Every phase-script prompt opens with one of these — the stage prefix each agent is dispatched
// with. Ordered, first match winning, because the architect and the writer share `Mode 1 —` and
// the architect's longer opening has to be tried first.
//
// This is what names a stage when the meta file is missing or carries a type nothing here knows.
// Without it a code-writer whose meta file did not land would fall into `other`, moving the
// largest share of a lane's spend to a row that means nothing — which is worse than any of the
// misreadings this file exists to prevent.
const STAGE_OF_PROMPT = [
  [SUITE_OPENING, 'suite'],
  [/^\s*Mode 1 — implementation plan for/, 'plan'],
  [/^\s*Mode [12] —/, 'write'],
  [/^\s*Review branch /, 'review'],
  [/^\s*(A code-writer returned FAILED|The repository's full test suite is red)/, 'debug'],
  [/^\s*A \/dev-loop lane just ended/, 'notify'],
]

export function stageOf(agent) {
  const named = STAGE_OF_TYPE[agent.agentType]
  if (named) return named
  const prompt = agent.prompt || ''
  for (const [opening, stage] of STAGE_OF_PROMPT) {
    if (opening.test(prompt)) return stage
  }
  return 'other'
}

// A transcript's first user record is the prompt the agent was dispatched with. Content is a bare
// string there, but the array form is handled too rather than assumed away.
function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.filter(p => p && p.type === 'text' && typeof p.text === 'string').map(p => p.text).join('\n')
}

async function typeOfAgent(dir, agentId) {
  try {
    const meta = JSON.parse(await readFile(join(dir, `agent-${agentId}.meta.json`), 'utf8'))
    return typeof meta.agentType === 'string' ? meta.agentType : ''
  } catch {
    return ''
  }
}

// One transcript directory → one record per agent that ran in it. The per-agent transcripts are
// the only place usage lives: the workflow journal records each agent's return value and carries
// no usage at all, which is worth stating because the original ticket pointed at the journal.
export async function readRun(dir) {
  let names
  try {
    names = await readdir(dir)
  } catch {
    // A run whose transcripts were pruned, or a path the host mistyped. Reporting that failed is
    // never allowed to be an error: nothing downstream of this file changes behaviour on cost.
    return []
  }
  const agents = []
  for (const name of names.filter(n => /^agent-.+\.jsonl$/.test(n)).sort()) {
    const agentId = name.slice('agent-'.length, -'.jsonl'.length)
    let raw
    try {
      raw = await readFile(join(dir, name), 'utf8')
    } catch {
      continue
    }
    let prompt = ''
    let tokens = 0
    let messages = 0
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      let rec
      try {
        rec = JSON.parse(trimmed)
      } catch {
        // A session killed mid-write leaves a half-written last line. Skipping it keeps the
        // agent's other 130 records rather than losing the whole file to its tail.
        continue
      }
      const message = rec && rec.message
      if (!message) continue
      if (rec.type === 'user' && !prompt) prompt = textOf(message.content)
      if (rec.type === 'assistant') {
        tokens += tokensExcludingCacheReads(message.usage)
        messages++
      }
    }
    agents.push({ runDir: dir, agentId, agentType: await typeOfAgent(dir, agentId), prompt, tokens, messages })
  }
  return agents
}

const escapeRegExp = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// A lane's attribution keys, grouped into tiers, strongest tier first. Every key is a literal the
// HOST already holds and passed in, so this matches against known strings rather than parsing free
// text — the same approach the baseline analysis used, made exact by the host handing over what it
// knows. The tiers are the array's own order, so adding a key means editing this function only.
//
// Each key is boundary-guarded, because the commonest collision in a repository numbering its
// branches is a prefix: `feat/8` must never match `feat/80`, `#8` must never match `#80`, and
// `.../worktrees/8` must never match `.../worktrees/80`. That one hazard is why these are regexes
// and not `includes`.
function keyTiersOf(lane) {
  const subs = lane.subLanes || []
  return [
    lane.planPath ? [new RegExp(`${escapeRegExp(lane.planPath)}(?![\\w-])`)] : [],
    subs.filter(s => s.worktree).map(s => new RegExp(`${escapeRegExp(s.worktree)}(?![\\w-])`)),
    subs.filter(s => s.branch).map(s => new RegExp(`(?<![\\w/-])${escapeRegExp(s.branch)}(?![\\w/-])`)),
    lane.issue === undefined || lane.issue === null ? [] : [new RegExp(`#${escapeRegExp(lane.issue)}(?!\\d)`)],
  ]
}

// The strongest tier that matches anything wins. Two lanes matching at the same tier is ambiguous,
// and ambiguity reports rather than picks: a record on the wrong lane is worse than one on
// neither, because it corrupts both figures instead of shrinking one.
export function laneOf(prompt, lanes) {
  const text = prompt || ''
  const keyed = lanes.map(lane => ({ lane, tiers: keyTiersOf(lane) }))
  const depth = Math.max(0, ...keyed.map(({ tiers }) => tiers.length))
  for (let tier = 0; tier < depth; tier++) {
    const hits = keyed.filter(({ tiers }) => (tiers[tier] || []).some(re => re.test(text)))
    if (hits.length === 1) return hits[0].lane
    if (hits.length > 1) return null
  }
  return null
}

// Every requested lane gets an entry whatever was found for it, so improvement data cannot end up
// collected only on the lanes that went well.
export function tally(agents, lanes) {
  const byIssue = new Map(lanes.map(lane => [lane.issue, { lane, total: 0, agents: 0, byStage: new Map() }]))
  const unattributed = { agents: 0, tokens: 0 }

  for (const agent of agents) {
    const lane = laneOf(agent.prompt, lanes)
    if (!lane) {
      unattributed.agents++
      unattributed.tokens += agent.tokens
      continue
    }
    const entry = byIssue.get(lane.issue)
    entry.total += agent.tokens
    entry.agents++
    const stage = stageOf(agent)
    entry.byStage.set(stage, (entry.byStage.get(stage) || 0) + agent.tokens)
  }

  return {
    lanes: [...byIssue.values()].map(entry => ({
      issue: entry.lane.issue,
      lane: entry.lane,
      total: entry.total,
      agents: entry.agents,
      // Records found, not tokens counted. A lane with no records is UNMEASURED, and a total of
      // zero would read as free — which is the one wrong thing this log could say.
      measured: entry.agents > 0,
      stages: [...entry.byStage.entries()]
        .map(([stage, tokens]) => ({ stage, tokens, share: entry.total ? (tokens / entry.total) * 100 : 0 }))
        .sort((a, b) => b.tokens - a.tokens || a.stage.localeCompare(b.stage)),
    })),
    unattributed,
  }
}

export function formatTokens(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function formatShare(p) {
  if (p > 0 && p < 0.05) return '<0.1%'
  return p < 10 ? `${p.toFixed(1)}%` : `${Math.round(p)}%`
}

// The sign comes from the UNROUNDED delta and the magnitude from the rounded one, which is the
// whole subtlety here: rounding first collapses everything inside half a percent to zero, and
// `-0 >= 0` is true in JavaScript, so a lane comfortably under target would print `+0%` and read
// as a regression. Every lane is signed either way, so `-0%` is a real and wanted output.
export function formatDelta(total) {
  const delta = ((total - TARGET_TOKENS) / TARGET_TOKENS) * 100
  return `${delta < 0 ? '-' : '+'}${Math.round(Math.abs(delta))}%`
}

// The two lines the ticket specified, verbatim in shape: the total against the target, then the
// per-stage split. The split is the entire value the baseline produced — a bare total says a lane
// was expensive, the split says which dial to turn.
export function summaryLine(laneTally) {
  if (!laneTally.measured) {
    return 'Cost: not measured — no agent transcripts were found for this lane.'
  }
  const split = laneTally.stages.map(s => `${s.stage} ${formatShare(s.share)}`).join(' · ')
  return `Cost: ${formatTokens(laneTally.total)} excluding cache reads (target ${formatTokens(TARGET_TOKENS)}, ${formatDelta(laneTally.total)})\n  ${split}`
}

export function renderLane(laneTally, { runs = [], unattributed } = {}) {
  const lane = laneTally.lane
  const lines = [`# Cost — issue #${laneTally.issue}`, '', '```', summaryLine(laneTally), '```', '']

  if (lane.ending) {
    lines.push(`Lane ending: **${lane.ending.category}** — ${lane.ending.reason}`, '')
  }

  if (laneTally.measured) {
    lines.push('| Stage | Tokens | Share |', '| --- | ---: | ---: |')
    for (const s of laneTally.stages) {
      lines.push(`| ${s.stage} | ${formatTokens(s.tokens)} | ${formatShare(s.share)} |`)
    }
    lines.push(`| **total** | **${formatTokens(laneTally.total)}** | **100%** |`, '')
    lines.push(`${laneTally.agents} agent transcript(s) across ${runs.length} workflow run(s).`, '')
  } else {
    lines.push(
      `Nothing was found to measure. ${runs.length} workflow run(s) were read and no agent`,
      'transcript in them named this lane — its plan path, its worktrees, its branches or its',
      'issue number. Either the lane never dispatched an agent, or the transcript directories it',
      'ran in were not passed here.',
      '',
    )
  }

  if (unattributed && unattributed.agents) {
    lines.push(
      `Caveat: ${unattributed.agents} agent transcript(s) totalling ${formatTokens(unattributed.tokens)} could`,
      'not be attributed to any lane in this batch, so they are in no lane\'s total. Reported rather',
      'than spread, which would put an unknown cost on lanes that did not incur it.',
      '',
    )
  }

  lines.push(
    'Metric: input + cache creation + output, **excluding cache reads** — the metric the baseline',
    'was measured on, and the only one the target compares against.',
    '',
    'Reporting only. Nothing in the pipeline halts, warns, or changes behaviour on cost, and this',
    'file describes ONE run — the next run over this issue overwrites it.',
    '',
  )
  return lines.join('\n')
}

// One directory for the whole batch. The host passes it, because the host is what knows where its
// own scratch directory is and which project slug the run used — the same `.scratch/<project>` the
// plans live in, already gitignored in every repository this runs against, which is the whole
// reason the log is on disk rather than on the issue, where a cost table would bury a thread
// specified to be an extremely concise summary plus open questions.
//
// A host that omits it gets it derived from the first lane carrying a plan, since the plans are in
// that same directory. A batch where no lane got as far as a plan has nothing to derive from, and
// this returns nothing rather than inventing a project slug — a log written where nobody looks is
// indistinguishable from no log, and costs a stray directory as well.
export function outDirOf(request) {
  if (request.outDir) return request.outDir
  const planned = (request.lanes || []).find(lane => lane.planPath)
  return planned ? join(dirname(dirname(planned.planPath)), 'cost') : ''
}

export async function writeCostLogs(request) {
  const lanes = Array.isArray(request.lanes) ? request.lanes : []
  const runs = Array.isArray(request.runs) ? request.runs : []

  const agents = (await Promise.all(runs.map(readRun))).flat()
  const tallied = tally(agents, lanes)

  const dir = outDirOf(request)
  if (!dir) {
    return {
      written: [],
      unattributed: tallied.unattributed,
      skipped: 'no output directory: the request named none, and no lane carries a plan path to derive one from',
    }
  }

  const written = []
  await mkdir(dir, { recursive: true })
  for (const laneTally of tallied.lanes) {
    const file = join(dir, `${laneTally.issue}.md`)
    await writeFile(file, renderLane(laneTally, { runs, unattributed: tallied.unattributed }))
    written.push({ issue: laneTally.issue, file, summary: summaryLine(laneTally) })
  }
  return { written, unattributed: tallied.unattributed }
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const raw = (await readStdin()).trim()
  if (!raw) {
    process.stderr.write('cost-log: nothing on standard input — expected a JSON request\n')
    process.exitCode = 1
    return
  }
  const { written, unattributed, skipped } = await writeCostLogs(JSON.parse(raw))
  for (const w of written) process.stdout.write(`#${w.issue} → ${w.file}\n${w.summary}\n\n`)
  if (unattributed.agents) {
    process.stdout.write(`${unattributed.agents} agent transcript(s) were attributed to no lane.\n`)
  }
  if (skipped) {
    // Non-zero so the host notices and can say so; its own rule is to report this and carry on,
    // reporting never being allowed to change what a run did.
    process.stderr.write(`cost-log: wrote nothing — ${skipped}\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
