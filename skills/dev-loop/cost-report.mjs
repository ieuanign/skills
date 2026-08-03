#!/usr/bin/env node
// The /dev-loop cost report: what a lane cost, and which stage spent it.
//
//   node cost-report.mjs --issues 28,30 <transcriptDir>...
//
//   #28
//   Cost: 641K excluding cache reads (target 608K, +5%)
//     write 44% · plan 29% · review 27% · suite 0.4%
//
// It reads and it prints. Nothing here halts, warns, or changes any lane's behaviour — the token
// ceiling this replaces could not work (the budget total is unset unless a human typed a budget
// directive, so it never fired under exactly the unattended run it was meant to guard) and was
// unnecessary besides, a lane being bounded in agent invocations from five other directions.
//
// `.mjs` on purpose: this ships into arbitrary repositories, and a `.js` file's module system is
// decided by whichever package.json happens to be nearest once it is installed.

import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// The baseline. Measured as a single median across three repositories with no evidence it varies
// by repository, so it is a constant here rather than a repository profile key or a per-run
// argument. It exists only so the report can print a signed percentage — it gates nothing.
// Promote it if one repository's lanes prove consistently larger.
export const TARGET_TOKENS = 608_000

// The stage vocabulary, shared with phase-plan.js and phase-execute.js, which each carry their own
// copy — a phase script imports nothing, being compiled as one function over the runner's globals.
// Add a stage in one and add it in all three. Order is the fallback for ties in the split.
export const STAGES = ['plan', 'write', 'review', 'suite', 'notify']

// Where a marker naming a stage this list does not know lands. Named rather than dropped: a stage
// silently discarded would make the split's percentages describe a smaller run than the total does.
export const OTHER_STAGE = 'other'

// The marker phase-script prompts lead with. Deliberately not a read of the prompt's prose — that
// wording exists to instruct an agent, not to identify it, and any edit to it silently breaks a
// reader. Planning is the case that forces the issue: it runs before a plan file exists, so there
// is no plan path in the architect's prompt to infer a lane from.
export const MARKER = /\[dev-loop lane=#?(\d+) stage=([A-Za-z][\w-]*)\]/

/**
 * The metric: input + cache creation + output, excluding cache reads.
 *
 * This is what the baseline was measured on and the comparison is meaningless against any other.
 * The all-tokens figure carries more spread, and the excess is cache reads, which track turn count
 * and session layout rather than lane work; output-only ignores context loading entirely. The
 * middle metric is the least gameable.
 */
export function meteredTokens(usage) {
  if (!usage || typeof usage !== 'object') return 0
  const n = v => (Number.isFinite(v) ? v : 0)
  return n(usage.input_tokens) + n(usage.cache_creation_input_tokens) + n(usage.output_tokens)
}

// Content is a bare string on a dispatched prompt and an array of blocks once a transcript is
// under way; both shapes reach this, and only text blocks can carry a marker.
function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map(b => (b && typeof b.text === 'string' ? b.text : '')).join('\n')
}

const roleOf = rec => (rec.type === 'user' || rec.type === 'assistant' ? rec.type : rec.message?.role)

/**
 * One transcript file → the lane and stage it belongs to, and what it cost.
 *
 * Returns null for a transcript carrying no marker: an agent the host dispatched itself, a Mode A
 * prompt, or anything else outside the phase scripts. Unattributable is not the same as free, and
 * guessing a lane for it would pool costs across lanes.
 *
 * Assistant records are deduped by message id, keeping the last. A streaming log writes the same
 * assistant message several times as it grows — the sample this was built against repeated one
 * message three times with identical usage — so summing records rather than messages overcounts by
 * more than a factor of two.
 */
export function readTranscript(text) {
  let lane = null
  let stage = null
  let dispatched = false // the first assistant record: everything after it is the agent's own work
  const byMessage = new Map()

  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let rec
    // A tail line half-written when the process was killed is a real shape, and one unparseable
    // line must not cost the whole transcript.
    try { rec = JSON.parse(trimmed) } catch { continue }
    if (!rec || typeof rec !== 'object') continue

    const role = roleOf(rec)
    // Only the records BEFORE the first assistant reply — the dispatched prompt and whatever was
    // injected with it. A tool result is a user record too, so an unbounded scan would attribute
    // any agent that happened to READ a marker: this repository's own agents open the phase
    // scripts and the cost logs routinely, and one of those would land on a lane it never worked.
    // First match inside that window wins, which also settles the reviewer's prompt — it embeds an
    // issue body verbatim, and an issue discussing this feature can quote a marker of its own.
    if (role === 'user' && !dispatched && lane === null) {
      const m = MARKER.exec(textOf(rec.message?.content))
      if (m) { lane = Number(m[1]); stage = m[2].toLowerCase() }
      continue
    }
    if (role !== 'assistant') continue
    dispatched = true
    const message = rec.message
    if (!message || !message.usage) continue
    // A record with no id cannot be deduped against anything, so it keys on itself.
    const key = typeof message.id === 'string' ? message.id : byMessage.size
    byMessage.set(key, meteredTokens(message.usage))
  }

  if (lane === null) return null
  let tokens = 0
  for (const v of byMessage.values()) tokens += v
  return { lane, stage, tokens }
}

/**
 * Every `.jsonl` under the given paths, read. Directories are walked recursively, so a transcript
 * directory holding its agents directly and one nesting them under a subdirectory both work. A
 * path that is itself a transcript file is taken as given.
 *
 * Deliberately not `agent-*.jsonl`, though that is what the runner names them today: **the marker
 * is the filter**, so a file without one costs a parse and is then skipped, while a filename this
 * script guessed wrong costs every lane in the run. That failure mode is invisible — a report
 * reading `not measured` for all of them looks exactly like a run whose markers were missing —
 * which is also why a path contributing nothing says so.
 *
 * Symlinked directories are not followed — `Dirent.isDirectory()` is false for a symlink — which
 * is what keeps a walk over an unknown directory from looping.
 *
 * A path that cannot be read is reported and skipped rather than thrown: this runs after a run has
 * already concluded, and a missing directory is not worth losing the lanes that do have one.
 */
export function collect(paths, onWarn = () => {}) {
  const found = []
  const seenFiles = new Set()

  const readOne = raw => {
    // By real path, so overlapping arguments — a directory and one nested inside it — do not read
    // the same transcript twice and double a lane's total.
    let file
    try { file = realpathSync(raw) } catch { file = raw }
    if (seenFiles.has(file)) return
    seenFiles.add(file)
    let text
    try { text = readFileSync(file, 'utf8') } catch (err) { return onWarn(`cannot read ${file}: ${err.message}`) }
    const rec = readTranscript(text)
    if (rec) found.push({ ...rec, file })
  }

  const walk = dir => {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch (err) { return onWarn(`cannot read ${dir}: ${err.message}`) }
    for (const e of entries) {
      if (e.isDirectory()) walk(join(dir, e.name))
      else if (e.isFile() && e.name.endsWith('.jsonl')) readOne(join(dir, e.name))
    }
  }

  for (const p of paths) {
    let st
    try { st = statSync(p) } catch (err) { onWarn(`cannot read ${p}: ${err.message}`); continue }
    const before = found.length
    if (st.isDirectory()) walk(p)
    else readOne(p)
    // Said out loud, because the alternative is a report that quietly calls every lane unmeasured.
    // A run whose transcripts moved and a run whose lanes were not the ones asked about produce
    // the same report otherwise, and only one of them is a bug worth chasing.
    if (found.length === before) onWarn(`no marked transcripts under ${p}`)
  }
  return found
}

/**
 * The requested issues, each with its own total and split. Records are attributed by the lane in
 * their marker, so a batch of several lanes never pools into one figure, and a record belonging to
 * a lane nobody asked about is simply not part of any report.
 *
 * A lane with nothing to measure is `measured: false` rather than a total of zero — zero reads as
 * free rather than as unmeasured, and those are opposite conclusions. Transcripts that carried the
 * marker but recorded no usage are the same conclusion by a different route, and say which.
 */
export function aggregate(issues, records) {
  return issues.map(issue => {
    const mine = records.filter(r => r.lane === issue)
    const total = mine.reduce((sum, r) => sum + r.tokens, 0)
    if (!mine.length || total === 0) {
      const reason = mine.length
        ? `${mine.length} transcript(s) carried this lane's marker, none recording token usage`
        : "no agent transcript carried this lane's marker"
      return { issue, measured: false, reason, total: 0, split: [], deltaPercent: null }
    }

    const byStage = new Map()
    for (const r of mine) {
      const stage = STAGES.includes(r.stage) ? r.stage : OTHER_STAGE
      byStage.set(stage, (byStage.get(stage) || 0) + r.tokens)
    }
    // Only stages that spent something appear, so a stage the pipeline does not yet have
    // contributes nothing rather than erroring or printing a 0% the reader has to discount.
    // Biggest first: the split exists to say which dial to turn.
    const order = [...STAGES, OTHER_STAGE]
    const split = [...byStage.entries()]
      .filter(([, tokens]) => tokens > 0)
      .sort((a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([stage, tokens]) => ({ stage, tokens, percent: total ? (tokens / total) * 100 : 0 }))

    return {
      issue,
      measured: true,
      total,
      split,
      deltaPercent: ((total - TARGET_TOKENS) / TARGET_TOKENS) * 100,
    }
  })
}

const thousands = n => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
// A stage under one percent is still worth a digit — the baseline's suite stage was 0.4% — and one
// above it is not: nobody tunes on a decimal place of 44. A stage that spent something never
// renders as 0%, which would read as a stage that did not run.
//
// Rounded BEFORE the branch is chosen, not after: 0.999% belongs to the whole-number case it
// rounds into, and testing the raw value first sends it down the decimal path to print `1.0%` —
// a decimal place on the one row whose whole reason for a decimal place is being under one.
const percent = p => {
  const whole = Math.round(p)
  if (whole >= 1) return `${whole}%`
  if (p < 0.05) return '<0.1%'
  return `${p.toFixed(1)}%`
}
// `on target` rather than a signed zero: `-0%` is a sign claiming a direction the number does not
// have, and `+0%` reads as a rounding artefact rather than as the good outcome it is.
const signed = p => {
  const whole = Math.round(p)
  if (whole === 0) return 'on target'
  return `${whole > 0 ? '+' : '-'}${Math.abs(whole)}%`
}

/** One lane's report, as the text a developer reads. */
export function render(lane) {
  if (!lane.measured) return `#${lane.issue}\nCost: not measured — ${lane.reason}`
  const head = `Cost: ${thousands(lane.total)} excluding cache reads (target ${thousands(TARGET_TOKENS)}, ${signed(lane.deltaPercent)})`
  const split = lane.split.map(s => `${s.stage} ${percent(s.percent)}`).join(' · ')
  return `#${lane.issue}\n${head}\n  ${split}`
}

const USAGE = 'usage: cost-report.mjs --issues <n>[,<n>...] <transcriptDir>...'

export function parseArgs(argv) {
  const issues = []
  const paths = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--issues') {
      const next = argv[++i]
      if (next === undefined) throw new Error('--issues needs a value')
      for (const tok of next.split(/[,\s]+/).filter(Boolean)) {
        // Digits only, so `-5` and `1e3` are rejected rather than accepted as issues 5 and 1000 —
        // both of which `Number.isInteger` waves through, and both of which then report a
        // perfectly well-formed "not measured" for a lane nobody asked about.
        const digits = tok.replace(/^#/, '')
        if (!/^\d+$/.test(digits) || Number(digits) === 0) throw new Error(`not an issue number: ${tok}`)
        const n = Number(digits)
        if (!issues.includes(n)) issues.push(n)
      }
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      throw new Error(USAGE)
    } else {
      paths.push(argv[i])
    }
  }
  if (!issues.length) throw new Error('no issues given')
  if (!paths.length) throw new Error('no transcript directories given')
  return { issues, paths }
}

function main(argv) {
  let parsed
  try {
    parsed = parseArgs(argv)
  } catch (err) {
    process.stderr.write(`${err.message}\n${USAGE}\n`)
    return 2
  }
  const records = collect(parsed.paths, w => process.stderr.write(`cost-report: ${w}\n`))
  const lanes = aggregate(parsed.issues, records)
  process.stdout.write(`${lanes.map(render).join('\n\n')}\n`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
