export const meta = {
  name: 'dev-loop-execute',
  description: 'Phase B of /dev-loop — per-lane implement, review, and fix cycles',
  whenToUse: 'Invoked by the /dev-loop skill per layer; not standalone.',
  phases: [
    { title: 'Implement', detail: 'code-writer per plan commit, sequential within a lane' },
    { title: 'Review', detail: 'reviewer + fix cycles (capped)' },
    { title: 'Suite', detail: "the repo's full suite, once per sub-lane", model: 'haiku' },
    { title: 'Notify', detail: "an ended lane's label, comment and message — unattended only", model: 'haiku' },
  ],
}

// args: {
//   lanes: [{ issue, issueBody, planPath, notified?, subLanes: [{ branch, worktree, base, area?,
//             commits: [{ordinal, message}], ownedCriteria?: [{ordinal, criterion}] }] }],
//     notified: true when an EARLIER layer already dispatched the notifier for this lane. A lane's
//     ending is written once per run, not once per layer; the host carries the flag forward.
//   mode: 'gated' | 'unattended',
//   fixCycleThreshold: number,  // the profile's Fix cycles key, read as the review loop's
//                          // NO-PROGRESS THRESHOLD rather than a flat cap; absent ⇒ the
//                          // profile's default of 2. The hard ceiling is a constant below.
//   suiteCommand: string,  // the profile's Full-suite command; 'none' or absent ⇒ every suite is not-run
//   skillDir: string       // absolute path to this skill's folder; the notifier is told where
//                          // notifications.md and notify.sh are, having no way to derive it.
//                          // Absent ⇒ no notifier is dispatched: one with no specification to
//                          // read would write worse than nothing.
//   agentNamespace: string // the roster's registry namespace, read off the host's own agent list
//                          // at intake. Absent ⇒ bare names, which is the linked-agents case.
//   runHandle: string      // the identifier locating this run's own transcript, read by the host
//                          // from its environment at intake. Same class of fact as skillDir and
//                          // agentNamespace — visible to the host, invisible to a script.
//                          // notifications.md governs where it is written; absent ⇒ the notifier
//                          // is told nothing about it and writes no line, which is a supported
//                          // state and never an error.
// }
// subLanes contains only the CURRENT layer's sub-lanes; worktree is absolute.
// issueBody is the issue's body verbatim and WHOLE, which the host already fetched at intake — the
// reviewer's Spec axis reads it from its arguments rather than fetching it, keeping its
// Bash read-only and git-only. Omit it and the reviewer runs no spec axis. It is never sliced: a
// checklist line rarely reads as its own specification, so ownership is passed as ordinals into a
// body that arrives intact.
// ownedCriteria is the acceptance criteria THIS sub-lane delivers, which the host read off the
// plan's Commit / PR breakdown — the same section it built `commits` from. The falls-to-last
// default for criteria the plan left unlisted is the host's and not this script's: the args above
// carry one layer's sub-lanes with their commit lists already assembled, so nothing here can see
// which sub-lane is a lane's last. An EMPTY array means the sub-lane owns none and its spec axis
// is vacuously met; an ABSENT key means the whole checklist, which is the single-sub-lane case and
// the pre-ownership behaviour. The two differ, and only the first can be stated.
// Returns per-lane:
// { issue, mode, ending: {category, reason}|null, crashed, notified, subResults: [...] }
// EVERY requested issue gets an entry, whatever happened to it — nothing below filters this list.
// mode is the run mode the host parsed, carried out unchanged rather than re-derived — whatever
// concludes the lane reads it off the result it already holds.
// crashed is true only for a lane whose closure THREW. It is what the host reads at the
// conclusion: every other ending was already labelled mid-script, and a throw is the one that
// could not be, because a throw unwinds past the point the notifier is dispatched from.
// notified is true when the notifier wrote this lane's label mid-script, so the host leaves that
// verdict standing instead of relabelling it. False covers every other case — a clean lane, a
// gated run, a crash, and a dispatch that failed — all of which leave the label to the host.
// An ending ends its SUB-lane, so the lane's ending is a roll-up for reporting only: FAILED if
// any sub-lane ended FAILED, else HALT if any did, else null. The label decides nothing — the
// conclusion mode alone decides the push, the PR and the worktree.
// subResults: [{branch, area, ending, commits, plannedCommits, madeCommits, deviations, disputed,
//               criterionVerdicts, reviewNotes, fixedFindings, wontFix, openFindings,
//               reviewTrajectory, suite, attempts, terminal}]
// reviewTrajectory: [string] — one entry per CHANGES_REQUESTED review round, saying whether it
// brought previously-unseen findings or repeated prior ones. The findings ledger's, recorded on
// every sub-lane and rendered only on one whose review loop ended on a bound.
// suite: {state: 'passed'|'failed'|'not-run', failing: [ids], output} — always present, whatever
// ended the sub-lane. 'not-run' is a state of its own and is never reported as passed.
// attempts: [{stage, trigger, debugger, outcome}] — the ledger's attempt log, recorded on every
// sub-lane and rendered only on one that ended. A wip: commit is listed but never counted.
// terminal: {pr: 'ready'|'draft'|'none', reasons: [why it is not ready]} — the terminal-state
// table's row for this sub-lane, read under unattended mode only; under gated the human at
// Gate 2 decides and this is not consulted. The push column is absent on purpose: git alone
// decides it, and the host's ahead-of-base read overrides `pr` when the two disagree.

// The harness may deliver args as a JSON string; normalize to an object.
const input = typeof args === 'string' ? JSON.parse(args) : args

// A role is resolved, never named — contracts.md's Roles section is normative for why. The same
// definition registers bare when it is linked into a repo's `.claude/agents/` and namespaced
// `<plugin>:<name>` when the plugin is installed, and a workflow script sees neither registry, so
// the host reads the namespace off its own roster and passes it. A trailing colon is tolerated
// because writing one is a plausible reading of "namespace" and the failure it would otherwise
// cause is total: every dispatch in the phase dies on an unresolvable type, so no lane gets past
// its first commit. Absent ⇒ bare, the linked case and the pre-plugin behaviour.
//
// The suite gate is dispatched with no agentType at all and is deliberately absent below:
// contracts.md gives it no role definition, so it has no name to resolve.
const NS = String(input.agentNamespace || '').trim().replace(/:+$/, '')
const roleAgent = role => (NS ? `${NS}:${role}` : role)

const writerType = roleAgent('code-writer')

// The review loop's no-progress threshold — the position the counter below must REACH for the
// loop to be judged stuck, not a count of no-progress rounds tolerated. The counter is 1 the
// moment the first CHANGES_REQUESTED round returns, so 2 ends the loop on the first round that
// repeats itself. A repository fact, not a constant: one with a flaky suite wants more, and one
// that would rather read every finding itself answers 0, which spends no fix cycle at all. The
// host passes the profile's value; the 2 below is the profile's own default, reached only when a
// host passed no number. `|| 2` would be wrong — it turns a deliberate 0 back into two cycles.
const NO_PROGRESS_THRESHOLD = Number.isInteger(input.fixCycleThreshold) && input.fixCycleThreshold >= 0 ? input.fixCycleThreshold : 2

// The review loop's hard ceiling, in fix cycles, applied whatever the trajectory says: a
// mis-compared finding list would look new every round and reset the threshold forever. It is
// STATED IN contracts.md TOO, and `npm run check` compares the two — the same drift hazard the
// cost-stage vocabulary is checked for. Five rather than the suite gate's eight because a review
// cycle dispatches the two dearest agents in the pipeline where a suite round is one cheap call.
const REVIEW_CEILING = 5

// Passed in, never re-derived. Nothing here branches on it yet — the notifier and the unattended
// conclusion will. Anything but 'unattended' is gated, so an unknown mode never suppresses a gate.
const MODE = input.mode === 'unattended' ? 'unattended' : 'gated'

// Configuration, never discovery: a discovered command that needs infrastructure this pipeline
// does not stand up returns a red result that means nothing. 'none' is a real, persisted answer.
const suiteCommand = String(input.suiteCommand || '').trim()
const suiteConfigured = Boolean(suiteCommand) && suiteCommand.toLowerCase() !== 'none'
const SUITE_CEILING = 8

// The notifier's two paths. Both live in this skill's folder, which a workflow script cannot see
// from the inside — so the host passes it, and with nothing passed nothing is dispatched.
const skillDir = String(input.skillDir || '').trim()

// The run handle, passed through untouched to the one writer that puts it on the issue.
// notifications.md is normative for where it goes and why it is absent from the message. Empty is
// a supported state and produces no line in the prompt below: a machine that shows its session no
// identifier gets a shorter ending comment, never a failed lane.
const runHandle = String(input.runHandle || '').trim()

// notifications.md states the rule that selects a label role, and contracts.md records that its
// own two ending labels are selected by that same question — so this table is where those two
// statements meet, and neither is restated here. Keeping it in the script rather than the prompt
// is what makes the mapping mechanical: the notifier is told which role to write, never asked.
const ROLE_OF = { HALT: 'awaiting-human', FAILED: 'failed' }

// The lane-and-stage marker every dispatched prompt leads with. It says which lane (the issue
// number) and which stage an agent belongs to, so its own transcript identifies it without anyone
// pattern-matching the English of a prompt that gets reworded. Inert to the agent: nothing is
// asked to return it and no parsing of a return depends on it — only the cost report, reading the
// transcripts afterwards, cares.
//
// The stage is the workflow phase the call is dispatched under, named in the cost baseline's own
// vocabulary: Implement is `write`, Review is `review`, Suite is `suite`, Notify is `notify`.
// These are COST stages, deliberately coarser than the Per-stage context contract's, which names
// each role's turn: a recovery is charged to the stage that needed it, so a debugger called on a
// red suite is suite cost rather than a stage of its own. The split exists to say which dial to
// turn, and the dial for a red suite is the suite gate's.
//
// The vocabulary is shared with phase-plan.js and with cost-report.mjs, and each copy is written
// out in full: a phase script imports nothing, being compiled as one function over the runner's
// globals. Add a stage in one and add it in all three — `npm run check` compares them.
const STAGE = { PLAN: 'plan', WRITE: 'write', REVIEW: 'review', SUITE: 'suite', NOTIFY: 'notify' }
const mark = (issue, stage) => `[dev-loop lane=${issue} stage=${stage}]\n`

const WRITER_SCHEMA = {
  type: 'object',
  properties: {
    result: { type: 'string', enum: ['COMMITTED', 'BLOCKED', 'FAILED'] },
    commits: { type: 'array', items: { type: 'string' }, description: 'sha + message per commit made' },
    verified: { type: 'string' },
    deviations: { type: 'number' },
    disputed: { type: 'number' },
    disputedFindings: { type: 'array', items: { type: 'string' }, description: 'each finding you refused to apply, restated with your refuting evidence — length matches disputed' },
    dirty: { type: 'string' },
    worktree: { type: 'string' },
    failing: { type: 'string', description: 'exact red command — FAILED only' },
    notes: { type: 'string' },
  },
  required: ['result'],
}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['APPROVED', 'CHANGES_REQUESTED', 'ERROR'] },
    findings: { type: 'array', items: { type: 'string' }, description: 'file:line — defect — failure scenario — suggested fix' },
    contestedFindings: { type: 'array', items: { type: 'string' }, description: 'disputed findings you STILL confirm after re-verifying against the writer\'s evidence — empty unless disputes were given' },
    criterionVerdicts: {
      type: 'array',
      description: 'Spec axis: one entry per acceptance criterion this sub-lane OWNS, in the issue\'s order — the prompt names them; empty when no issue body was passed or the sub-lane owns none. Never blocking: these change neither verdict nor findings.',
      items: {
        type: 'object',
        properties: {
          criterion: { type: 'string', description: 'the criterion, quoted or trimmed to its first clause' },
          verdict: { type: 'string', enum: ['met', 'partial', 'not-met'] },
          evidence: { type: 'string', description: 'file:line, the test that shows it, or what you looked for and did not find' },
        },
        required: ['criterion', 'verdict', 'evidence'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['verdict', 'findings'],
}
const SUITE_SCHEMA = {
  type: 'object',
  properties: {
    state: { type: 'string', enum: ['passed', 'failed', 'not-run'] },
    failing: { type: 'array', items: { type: 'string' }, description: "the runner's own identifier per failing test — empty unless state is failed" },
    output: { type: 'string', description: "the command's output, trimmed to the failing portion if it is long" },
  },
  required: ['state', 'failing', 'output'],
}
// Mirrors the notifier's return contract. `label` is the only key anything reads: the host's
// conclusion leaves a label standing ONLY when one was actually applied, so a notifier that
// failed — or that skipped, the repository having no string for that role — must not be able to
// report success. Getting this wrong removes in-progress and replaces it with nothing.
const NOTIFY_SCHEMA = {
  type: 'object',
  properties: {
    label: { type: 'string', enum: ['applied', 'skipped', 'failed'], description: 'skipped = the repository documents no label string for this role' },
    comment: { type: 'string', enum: ['posted', 'failed'] },
    message: { type: 'string', enum: ['sent', 'silent', 'failed'], description: 'silent = the channel is not configured, which is a supported state' },
    detail: { type: 'string', description: 'the label string applied, or what went wrong' },
  },
  required: ['label'],
}
const DEBUG_SCHEMA = {
  type: 'object',
  properties: {
    rootCause: { type: 'string' },
    owner: { type: 'string', enum: ['code-writer', 'replan', 'user', 'retry'] },
    confidence: { type: 'string' },
    reproduced: { type: 'string' },
    finding: { type: 'string', description: 'when owner=code-writer: file:line — defect — failure scenario' },
  },
  required: ['rootCause', 'owner'],
}

function writerPrompt(lane, sub, instruction) {
  return `${instruction}\nPlan: ${lane.planPath} (absolute path — .scratch exists only in the main worktree).\nWork in the checkout at ${sub.worktree} on branch ${sub.branch} — cd there first, verify \`git branch --show-current\` prints ${sub.branch} (return BLOCKED if not), and work only inside that checkout.`
}

// The FINAL permitted attempt only: it is the only call after which the pipeline is certain to
// give up, and a wip: commit on a sub-lane that then succeeds would stop meaning "ended".
function giveUpClause(lane, c, tries) {
  if (tries < 2) return ''
  return `\nThis is the FINAL permitted attempt — nothing runs after it. If you still cannot get green, do not leave the work uncommitted: commit what exists as \`wip(<scope>): #${lane.issue} - commit ${c.ordinal} FAILED - <reason>\` and return FAILED anyway. That commit is evidence for the human, not work.`
}

// The body is fenced rather than interpolated bare: issue bodies are markdown and routinely
// contain the same headings and checklists the surrounding prompt uses.
//
// The owned list is what makes a multi-PR plan work: the range is one sub-lane, so the criteria
// it is asked about are one sub-lane's too. Told which are its own, the reviewer never spends
// judgement deciding whether something is in its range — and a sub-lane that delivered everything
// it owns opens a ready pull request instead of the draft every early PR used to get. The body
// still goes in whole beneath it: the prose around a checklist is what says what a checkbox means.
function specClause(lane, sub) {
  if (!lane.issueBody) {
    return `\n\nNo issue body was passed, so there is no spec axis this run — return an empty criterionVerdicts and say so in notes.`
  }
  // Absent ⇒ the whole checklist, the single-sub-lane case and the shape of a plan written before
  // ownership existed. Present-and-empty ⇒ this sub-lane owns none, which is a different fact and
  // the one a split plan states: a sibling delivers every criterion, so there is nothing to judge.
  const owned = sub.ownedCriteria
  if (Array.isArray(owned) && !owned.length) {
    return `\n\nThis sub-lane owns none of issue #${lane.issue}'s acceptance criteria — either the issue lists none, or the plan delivers every one of them in another sub-lane whose reviewer judges them. Either way there is nothing here for your spec axis: return an empty criterionVerdicts and say so in notes.`
  }
  const scope = Array.isArray(owned) && owned.length
    ? `Judge ONLY the criteria below. They are the ones this sub-lane${sub.area ? ` (area: ${sub.area})` : ''} delivers, taken from the plan's Commit / PR breakdown before you ran, so which are yours is not yours to decide — return one entry for each, in this order, and none for any other criterion in the body. One you own and cannot find in the diff is 'not-met'.\n${owned.map(c => `${c.ordinal}. ${c.criterion}`).join('\n')}`
    : `Judge every acceptance criterion in the body: this plan delivers the whole issue in one pull request, so all of them are this sub-lane's. Return one entry per criterion, in the issue's order. One you cannot find in the diff is 'not-met'.`
  return `\n\nSpec axis — ${scope}\n\nIssue #${lane.issue}'s body follows verbatim and whole, between the markers. Read all of it for the framing a checklist line does not carry, and judge the diff against your criteria. These verdicts NEVER block: they stay out of findings, do not change the verdict, and trigger no fix cycle.\n<<<<ISSUE-BODY\n${lane.issueBody}\nISSUE-BODY>>>>`
}

// No agent type and no persona: loading a role definition — merge-base rules, blocking bars,
// dispute handling — to run one command is waste. The command is quoted, never described.
function suitePrompt(sub) {
  return `Run this repository's full test suite once and report what it did. Nothing else: fix nothing, commit nothing, modify no file.\ncd ${sub.worktree} (branch ${sub.branch}) and run exactly this command:\n${suiteCommand}\nReturn state 'passed' when it exits 0, 'failed' when it does not, and 'not-run' when the command cannot run at all (no such script, no such runner) — never 'passed' for a suite you did not actually run. When it failed, put every failing test in failing using the runner's own identifier for it (file path plus test name), and the command's output in output.`
}

// The give-up path's abandoned work: evidence, not work. Listed so the human sees it, never
// counted — counting it would report `1 planned, 2 made` for a sub-lane that made one.
// A commit line is free text the writer composed to the schema's "sha + message" description, so
// the sha and whatever separator it chose are stripped before the prefix is read: `ddd1234 - wip(…)`
// is the same commit as `ddd1234 wip(…)`, and a miscount here is the one thing the exclusion exists
// to prevent.
const isWip = line => /^\W*(?:[0-9a-f]{7,40}\b\W*)?wip[(:]/i.test(line)

// Finding identity — contracts.md's "Finding identity" subsection is normative. A finding is
// `file:line — defect — failure scenario — suggested fix`, and only the first two clauses identify
// it: the line number is dropped because a fix shifts lines and a shifted line is not a new
// defect, and the last two clauses are the reviewer's prose about a defect the first two name.
//
// Case and whitespace are normalised and NOTHING ELSE is. Declaring two findings the same is what
// ends the review loop early, so sameness is declared only on near-repetition; a reworded defect
// reads as new, and the cycle that costs is one the ceiling still bounds. Host arithmetic in
// plain code — no agent is dispatched to decide it, and the reviewer's return contract is
// untouched.
//
// A finding carrying no em-dash at all has no clause to isolate, so the whole of it stands as its
// own identity. That can only make two findings look MORE different, which is the safe direction.
const squash = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim()
const findingIdentity = finding => {
  const parts = String(finding).split(/\s+[—–]\s+/)
  const where = squash(parts[0] || '').replace(/:\d+(:\d+)?$/, '') // file:line, file:line:col
  // NUL separator: nothing a reviewer writes can forge a collision across the two clauses.
  return `${where}\u0000${parts.length > 1 ? squash(parts[1]) : ''}`
}

function absorb(rec, writerResult) {
  rec.commits.push(...(writerResult.commits || []))
  rec.madeCommits = rec.commits.filter(l => !isWip(l)).length // kept live so a sub-lane that ends early still reports its counts
  rec.deviations += writerResult.deviations || 0
  rec.disputed += writerResult.disputed || 0
}

// Opened when a recovery starts and closed when its outcome is known, so the log is appended
// without any loop asking whether the sub-lane will end.
const attemptOf = (rec, stage, trigger) => {
  const a = { stage, trigger, debugger: '', outcome: '' }
  rec.attempts.push(a)
  return a
}

// An ending is recorded on the sub-lane's own record, and returning from the sub-lane body is
// what stops every later stage of THAT sub-lane and nothing else — sub-lanes are separate
// branches, worktrees and pull requests, so the lane keeps going.
const end = (rec, category, reason, payload) => {
  rec.ending = { category, reason }
  if (payload) Object.assign(rec, payload)
  // An attempt still open when the sub-lane ends: the ending is its outcome.
  const open = rec.attempts[rec.attempts.length - 1]
  if (open && !open.outcome) open.outcome = reason
  // The ledger has no rendering for an absent suite state, so a sub-lane that never reached the
  // gate names the ending that stopped it rather than reading as green.
  if (rec.suite.state === 'not-run' && !rec.suite.output) {
    rec.suite.output = `the sub-lane ended before the suite gate ran: ${reason}`
  }
}
const halt = (rec, reason, payload) => end(rec, 'HALT', reason, payload)
const failed = (rec, reason, payload) => end(rec, 'FAILED', reason, payload)

// The terminal-state table: what a sub-lane's ending makes of its pull request.
//
// The ready predicate is the four-way conjunction the contract states — concluded clean, AND
// findings resolved, AND the suite passed or did not run, AND every criterion met — written out
// rather than reduced to the shortest expression equivalent to it today. An ending already
// implies the middle two, so the reduction would be correct now and silently wrong after any
// change that let a red suite through without ending the sub-lane: ready pull requests would
// start appearing with no line here to have got wrong.
//
// Each trigger names itself, because the draft IS the signal and a human landing on one should
// see which of the four fired without opening anything else.
function terminalState(rec) {
  const reasons = []
  if (rec.ending) reasons.push(`ended ${rec.ending.category} — ${rec.ending.reason}`)
  if (rec.openFindings.length) {
    reasons.push(`${rec.openFindings.length} reviewer finding(s) still open: ${rec.openFindings.join('; ')}`)
  }
  if (rec.suite.state === 'failed') {
    reasons.push(`the repository's full suite is red: ${rec.suite.failing.join(', ') || 'see the suite output'}`)
  }
  // Empty when no issue body was passed, so a run with no issue is vacuously met — which is
  // exactly what the PR-comment input needs, and why it costs no code of its own.
  const unmet = rec.criterionVerdicts.filter(v => v.verdict !== 'met')
  if (unmet.length) {
    // partial and not-met both land here: nobody watched, so "not demonstrably done" drafts.
    reasons.push(`${unmet.length} acceptance criterion(s) not met — ${unmet.map(v => `${v.verdict}: ${v.criterion}`).join('; ')}`)
  }
  if (!reasons.length) return { pr: 'ready', reasons }
  // Only an ENDED sub-lane can propose the no-PR row. A clean sub-lane that reported no commits
  // is a resume whose commits were already in the log, so its branch is ahead of its base and it
  // is owed a real pull request. The push column is not proposed at all: git alone decides it,
  // and the host's ahead-of-base read overrides this row when the two disagree.
  if (rec.ending && !rec.commits.length) return { pr: 'none', reasons }
  return { pr: 'draft', reasons }
}

// A stage that returned nothing, said honestly — contracts.md's DIED entry is normative for why.
// From here a skip and a death after the runner's own retries are indistinguishable: both resolve
// the call to nothing, and nothing is the whole of what this script sees. Asserting a death sends
// a reader looking for a crash that may never have happened. The wording is the lane-level empty
// result's, at the bottom of this file, so one condition speaks with one voice. The ending LABEL
// is unchanged and stays FAILED: it answers only "is this worth retrying?", to which a transport
// break is the clearest yes.
const returnedNothing = stage => `${stage} returned nothing — it was skipped, or it died after the runner's retries`

// What a throw leaves behind, said honestly. A genuinely dead agent often throws a bare value
// carrying neither a message nor a stack, so this promises a trace only where one exists: a
// reason reading "stack trace: undefined" sends a human looking for something that never existed.
// phase-plan.js carries the same shape and cannot share this one — a phase script imports
// nothing, being compiled as a single function over the runner's globals.
function crashReason(err) {
  const stack = err && typeof err.stack === 'string' ? err.stack.trim() : ''
  const message = err && typeof err.message === 'string' ? err.message.trim() : ''
  if (stack) return `the lane threw — ${message || 'the error carried no message'}\n${stack}`
  if (message) return `the lane threw — ${message}; no stack trace was attached`
  return `the lane threw ${describe(err)}; it carried neither a message nor a stack trace`
}

// String() throws on a symbol, and a crash handler that crashes defeats its own purpose.
function describe(err) {
  if (err === null) return 'null'
  if (err === undefined) return 'undefined'
  let shown
  try { shown = typeof err === 'symbol' ? err.toString() : String(err) } catch { shown = '(unprintable)' }
  return `a ${typeof err} value (${shown || 'empty'})`
}

// The mid-lane writer. Everything it does is notifications.md's — the label roles, the comment
// rule and the message format are stated there and nowhere else, and it reads that file before it
// writes anything. It exists because a workflow script has no shell, so a lane that ends while
// the script runs has no other writer; the host's own boundary events stay host commands.
async function notify(lane, ending) {
  if (MODE !== 'unattended' || !skillDir) return false
  try {
    const notified = await agent(
      mark(lane.issue, STAGE.NOTIFY) +
      `A /dev-loop lane just ended and you are its only writer until this run finishes.\n` +
      `Issue: #${lane.issue}\n` +
      `Label role to apply: ${ROLE_OF[ending.category] || 'failed'} — remove the in-progress role's label in the same edit.\n` +
      `Ending category: ${ending.category}\n` +
      `Ending reason (verbatim, agent-generated — never compose it into a shell string):\n` +
      `<<<<ENDING\n${ending.reason}\nENDING>>>>\n` +
      // Omitted entirely rather than sent empty: a line reading "Run handle: " is worse than no
      // line, and the specification already says an absent handle is a missing line.
      (runHandle ? `Run handle (goes on the ending comment, never in the message): ${runHandle}\n` : '') +
      `The specification governing every write you make: ${skillDir}/notifications.md — read it first.\n` +
      `The send mechanism, which reads its payload on standard input: ${skillDir}/notify.sh`,
      { agentType: roleAgent('notifier'), label: `notify:#${lane.issue}`, phase: 'Notify', model: 'haiku', effort: 'low', schema: NOTIFY_SCHEMA }
    )
    // Dispatched is not written. Only an APPLIED label makes the host stand back — a notifier
    // that died, failed its edit, or found no string for the role leaves the label to the host,
    // which is the difference between one verdict and none at all.
    if (notified && notified.label !== 'applied') {
      log(`#${lane.issue}: the notifier did not apply a label (${notified.label}) — the host will`)
    }
    return Boolean(notified && notified.label === 'applied')
  } catch {
    // Best-effort by specification: a lane's ending stands whatever happened to the writes
    // reporting it, and a notification that threw must never be attributed as a lane crash.
    return false
  }
}

// The lane body. Its own endings are recorded on the sub-lane records it pushes into subResults,
// which the caller holds — so whatever this throws, what it managed survives outside it.
const runLane = async (lane, subResults) => {

  const runSubLane = async (sub, rec) => {
    const tag = `#${lane.issue}${sub.area ? ':' + sub.area : ''}`

    // 1. Implement each plan commit sequentially
    for (const c of sub.commits) {
      let res = await agent(
        mark(lane.issue, STAGE.WRITE) +
        writerPrompt(lane, sub, `Mode 1 — implement commit ${c.ordinal} ("${c.message}") from the plan's Commit / PR breakdown.`),
        { agentType: writerType, label: `write:#${lane.issue}:c${c.ordinal}`, phase: 'Implement', schema: WRITER_SCHEMA }
      )
      let tries = 0
      while (res && res.result === 'FAILED' && tries < 2) {
        tries++
        const attempt = attemptOf(rec, 'Implement', `commit ${c.ordinal} returned FAILED (debug+fix attempt ${tries} of 2)`)
        const diag = await agent(
          mark(lane.issue, STAGE.WRITE) +
          `A code-writer returned FAILED while implementing commit ${c.ordinal} ("${c.message}") of plan ${lane.planPath}. This is debug+fix attempt ${tries} of 2 — after 2 the sub-lane ends.\nIts return: ${JSON.stringify(res)}\nReproduce inside the checkout at ${sub.worktree} (branch ${sub.branch}) and diagnose. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
          { agentType: roleAgent('debugger'), label: `debug:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: DEBUG_SCHEMA }
        )
        if (!diag) return failed(rec, returnedNothing(`the debugger on FAILED commit ${c.ordinal}`))
        attempt.debugger = `${diag.owner}: ${diag.rootCause}`
        if (diag.owner === 'retry') {
          res = await agent(
            mark(lane.issue, STAGE.WRITE) +
            writerPrompt(lane, sub, `Mode 1 — implement commit ${c.ordinal} ("${c.message}"). A previous attempt failed transiently (debugger: ${diag.rootCause}); retry attempt ${tries} of 2.${giveUpClause(lane, c, tries)}`),
            { agentType: writerType, label: `retry:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
          )
          attempt.outcome = `the retry returned ${res ? res.result : 'nothing'}`
        } else if (diag.owner === 'code-writer') {
          res = await agent(
            mark(lane.issue, STAGE.WRITE) +
            writerPrompt(lane, sub, `Mode 2 — fix this debugger-diagnosed defect (commit the fix as fix(<scope>): #<issue> - ...). Fix attempt ${tries} of 2.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nThen check git log: if plan commit ${c.ordinal} ("${c.message}") was never committed, complete it afterward under Mode 1 rules as its own commit with the plan's exact message.${giveUpClause(lane, c, tries)}`),
            { agentType: writerType, label: `debugfix:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
          )
          attempt.outcome = `the fix returned ${res ? res.result : 'nothing'}`
        } else {
          return halt(rec, `debugger routed to ${diag.owner}: ${diag.rootCause}`, { diag })
        }
      }
      if (!res) return failed(rec, returnedNothing(`the writer on commit ${c.ordinal}`))
      // Absorbed before the result is read, so a writer that committed and THEN stopped still
      // reports what it landed: the terminal-state table's last two rows split on whether
      // anything exists, and a BLOCKED return that dropped its commits would misreport as
      // "nothing landed". The FAILED path's evidence commit arrives the same way.
      absorb(rec, res)
      if (res.result === 'FAILED') {
        return halt(rec, `commit ${c.ordinal} still FAILED after 2 debug+fix attempts — the commit was never produced`)
      }
      if (res.result === 'BLOCKED') return halt(rec, `writer BLOCKED on commit ${c.ordinal}: ${res.notes || ''}`)
      if (res.result !== 'COMMITTED') return failed(rec, `commit ${c.ordinal} still ${res.result} after debug routing`)
      log(`#${lane.issue}: commit ${c.ordinal}/${sub.commits.length} of ${sub.branch} done`)
    }

    // 2. Review → fix cycles (writer may dispute; contested disputes end the sub-lane)
    //
    // The bound is PROGRESS-SENSITIVE under a hard ceiling, exactly as the suite gate's is —
    // contracts.md's "The bound is progress-sensitive, under a hard ceiling" is normative. A flat
    // count cannot tell a loop that is stuck from one that is working, and the flat count this
    // replaces abandoned a lane one cycle from green.
    let cycles = 0                  // fix cycles spent — what the hard ceiling bounds
    let noProgressRounds = 0        // consecutive rounds that brought nothing previously unseen
    const seenFindings = new Set()  // every finding identity this sub-lane's review loop has shown
    let disputes = []
    while (true) {
      const disputeClause = disputes.length
        ? `\nThe code-writer DISPUTED these findings with the evidence below — re-verify each against that evidence. Retract any where the evidence holds (record retractions in notes); list any you STILL confirm in contestedFindings — those end the sub-lane with the stalemate unbroken, so contest only what you can re-confirm with a concrete failure scenario:\n${disputes.join('\n')}`
        : ''
      const review = await agent(
        mark(lane.issue, STAGE.REVIEW) +
        `Review branch ${sub.branch} against the plan at ${lane.planPath} (absolute path; read it with the Read tool).\nDiff exactly the range ${sub.base}..${sub.branch} — the base may itself be a stacked feature branch; never review the base's own commits.${disputeClause}${specClause(lane, sub)}`,
        { agentType: roleAgent('reviewer'), label: `review:${tag}${cycles ? ':r' + cycles : ''}`, phase: 'Review', schema: REVIEW_SCHEMA }
      )
      // Both are returns the loop cannot use, not verdicts about the code.
      if (!review) return failed(rec, returnedNothing('the reviewer'))
      if (review.verdict === 'ERROR') return failed(rec, `reviewer ERROR: ${review.notes || ''}`)
      rec.reviewNotes = review.notes || ''
      // Recorded before every ending below so an ended sub-lane still carries them; the
      // last review's verdicts win. Nothing in this loop branches on them — the spec axis is
      // reported and blocks no review — but terminalState() reads them at the conclusion, where
      // any verdict that is not `met` drafts the pull request. They are one sub-lane's own
      // criteria, so that draft answers for this sub-lane's work and never a sibling's.
      rec.criterionVerdicts = review.criterionVerdicts || []
      const contested = review.contestedFindings || []
      // Everything this review leaves open, recorded the moment it is known rather than at each
      // ending that reads it. One assignment per review, so an exit added to this loop later
      // cannot forget to record it and quietly report the findings as resolved.
      rec.openFindings = contested.length ? contested
        : review.verdict === 'APPROVED' ? [] : (review.findings || [])
      if (contested.length) {
        return halt(rec, `contested findings — reviewer still confirms ${contested.length} finding(s) the writer disputed`,
          { contested, disputes })
      }
      if (disputes.length) rec.wontFix.push(...disputes) // reviewer retracted them — documented won't-fix
      disputes = []
      if (review.verdict === 'APPROVED') break

      // The counter, and the trajectory the escalation carries. Computed here, before either
      // bound is read, so an ending reports the round that produced it as well as the ones before.
      const identities = (review.findings || []).map(findingIdentity)
      const fresh = identities.filter(id => !seenFindings.has(id))
      identities.forEach(id => seenFindings.add(id))
      // A round is no-progress only when EVERY finding in it matched a prior round's. One new
      // finding is progress, and resets — a shrinking set of the same findings is not. The counter
      // is 1 after the FIRST round whether or not that round brought anything new, exactly as the
      // suite gate's is, so the threshold is a position it reaches and not a count of tolerated
      // no-progress rounds. Said once here, and stated in contracts.md, because the arithmetic is
      // easy to describe wrongly.
      noProgressRounds = fresh.length ? 1 : noProgressRounds + 1
      // One phrase, two readers — the trajectory and the attempt trigger below. Written once so
      // the ledger and the attempt log cannot describe the same round differently.
      const freshness = fresh.length ? `${fresh.length} previously unseen` : 'none previously unseen'
      rec.reviewTrajectory.push(`round ${rec.reviewTrajectory.length + 1}: ${review.findings.length} finding(s), ${freshness}`)
      // The trajectory IS the per-round account the escalation is required to carry, so the reason
      // below states only which bound fired and lets this say what each round actually brought.
      // A reason that also summarised the rounds could contradict it, and did.
      const trajectory = `Trajectory — ${rec.reviewTrajectory.join('; ')}.`

      // BOTH bounds are checked here, before this cycle's writer is dispatched, so nothing is
      // spent on a cycle that cannot run. The threshold is read first: where both would fire it
      // is the more specific finding, and it is the one that says the loop was repeating itself.
      if (noProgressRounds >= NO_PROGRESS_THRESHOLD) {
        const why = NO_PROGRESS_THRESHOLD === 0
          ? 'this repository spends no fix cycle at all (its Fix cycles answer is 0)'
          : `the no-progress counter reached this repository's no-progress threshold of ${NO_PROGRESS_THRESHOLD}`
        return halt(rec, `still CHANGES_REQUESTED and the review loop is not progressing — ${why}. The findings are still open. ${trajectory}`, { review })
      }
      if (cycles >= REVIEW_CEILING) {
        return halt(rec, `still CHANGES_REQUESTED at the ${REVIEW_CEILING}-fix-cycle ceiling — the findings are still open. ${trajectory}`, { review })
      }

      cycles++
      const attempt = attemptOf(rec, 'Review',
        `CHANGES_REQUESTED — ${review.findings.length} finding(s), ${freshness} — ` +
        `fix cycle ${cycles} of at most ${REVIEW_CEILING} (no-progress threshold ${NO_PROGRESS_THRESHOLD})`)
      const fix = await agent(
        mark(lane.issue, STAGE.REVIEW) +
        writerPrompt(lane, sub, `Mode 2 — apply these reviewer findings (dispute any you can refute, with evidence):\n${review.findings.join('\n')}`),
        { agentType: writerType, label: `fix:#${lane.issue}:r${cycles}`, phase: 'Review', schema: WRITER_SCHEMA }
      )
      attempt.outcome = `the fix returned ${fix ? fix.result : 'nothing'}`
      if (!fix || fix.result !== 'COMMITTED') {
        if (fix) absorb(rec, fix) // it may have committed some of them before stopping
        const reason = fix
          ? `fix cycle ${cycles} returned ${fix.result}${fix.disputed ? ` (DISPUTED: ${fix.disputed})` : ''}`
          : returnedNothing(`fix cycle ${cycles}'s writer`)
        const stopped = fix && fix.result === 'BLOCKED' // a reasoned refusal, not a break
        return (stopped ? halt : failed)(rec, reason, { review, fix })
      }
      absorb(rec, fix)
      disputes = fix.disputedFindings || []
      rec.fixedFindings.push(...review.findings.filter(f => !disputes.includes(f)))
      log(`#${lane.issue}: fix cycle ${cycles} committed${disputes.length ? ` (${disputes.length} disputed)` : ''}, re-reviewing`)
    }

    // 3. Suite gate — the repo's own full suite, once per sub-lane, after the findings settle.
    // Nothing about this stage is special: the same question labels its endings as every other's.
    if (!suiteConfigured) {
      // A declared 'none' is answered, not unanswered — so no agent is spent to run nothing.
      rec.suite = { state: 'not-run', failing: [], output: 'no full-suite command is configured for this repository' }
      log(`#${lane.issue}: ${sub.branch} suite not run — no full-suite command configured`)
    } else {
      const seen = new Set()          // every failing identifier this sub-lane has ever shown
      let roundsWithoutNewFailure = 0 // consecutive red rounds that brought nothing previously unseen
      let round = 0
      while (true) {
        round++
        const suffix = round > 1 ? `:r${round}` : ''
        const suite = await agent(mark(lane.issue, STAGE.SUITE) + suitePrompt(sub), {
          label: `suite:${tag}${suffix}`, phase: 'Suite', model: 'haiku', effort: 'low', schema: SUITE_SCHEMA,
        })
        if (!suite) {
          rec.suite = { state: 'not-run', failing: [], output: returnedNothing('the suite gate') }
          return failed(rec, `${returnedNothing(`the suite gate on ${sub.branch}`)}; the suite never ran`)
        }
        rec.suite = { state: suite.state, failing: suite.failing || [], output: suite.output || '' }
        log(`#${lane.issue}: ${sub.branch} suite ${rec.suite.state}${round > 1 ? ` (round ${round})` : ''}`)
        if (rec.suite.state !== 'failed') break

        // Progress-sensitive, not a flat cap: a shrinking set of the same failures is not progress.
        const fresh = rec.suite.failing.filter(id => !seen.has(id))
        rec.suite.failing.forEach(id => seen.add(id))
        roundsWithoutNewFailure = fresh.length ? 1 : roundsWithoutNewFailure + 1
        const redReason = `suite red on ${sub.branch} — ${rec.suite.failing.length} failing test(s): ${rec.suite.failing.join(', ')}`
        const attempt = attemptOf(rec, 'Suite', `${redReason} (round ${round} of at most ${SUITE_CEILING})`)
        if (roundsWithoutNewFailure >= 2) return halt(rec, `${redReason} — 2 rounds brought no previously unseen failure`)
        // Checked before the debugger, so no agent is spent on a round that cannot run. A
        // mis-parsed identifier list looks new every round and would reset the counter forever.
        if (round >= SUITE_CEILING) return halt(rec, `${redReason} — the ${SUITE_CEILING}-round ceiling`)

        // A red suite is a failure, not a finding: the gate observed only that it is red, and the
        // breakage is usually outside the writer's commit scope. Same routing as a FAILED commit.
        const diag = await agent(
          mark(lane.issue, STAGE.SUITE) +
          `The repository's full test suite is red on branch ${sub.branch}, after its review loop settled. This is round ${round} of at most ${SUITE_CEILING} for this sub-lane.\nThe suite gate ran \`${suiteCommand}\` inside ${sub.worktree} and returned: ${JSON.stringify(rec.suite)}\nReproduce inside that checkout and diagnose. The breakage is often outside the commit scope of the work on this branch — say so if it is. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
          { agentType: roleAgent('debugger'), label: `suitedebug:${tag}:r${round}`, phase: 'Suite', schema: DEBUG_SCHEMA }
        )
        if (!diag) return failed(rec, `${returnedNothing(`the debugger on a red suite on ${sub.branch}`)}; ${redReason}`)
        attempt.debugger = `${diag.owner}: ${diag.rootCause}`
        if (diag.owner === 'code-writer') {
          const fix = await agent(
            mark(lane.issue, STAGE.SUITE) +
            writerPrompt(lane, sub, `Mode 2 — the repository's full suite is red and a debugger diagnosed it. Fix it and commit as fix(<scope>): #${lane.issue} - ... . Suite round ${round}.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nFailing: ${rec.suite.failing.join(', ')}`),
            { agentType: writerType, label: `suitefix:${tag}:r${round}`, phase: 'Suite', schema: WRITER_SCHEMA }
          )
          attempt.outcome = `the fix returned ${fix ? fix.result : 'nothing'}`
          if (!fix || fix.result !== 'COMMITTED') {
            if (fix) absorb(rec, fix) // whatever it landed before stopping is on the branch
            const reason = fix
              ? `suite fix round ${round} returned ${fix.result} — ${redReason}`
              : `${returnedNothing(`suite fix round ${round}'s writer`)}; ${redReason}`
            const stopped = fix && fix.result === 'BLOCKED'
            return (stopped ? halt : failed)(rec, reason)
          }
          absorb(rec, fix)
        } else if (diag.owner === 'retry') {
          attempt.outcome = 'a retry — the gate runs again, with nothing to fix'
        } else {
          // replan | user — the route reads the same here as in the implement loop.
          return halt(rec, `debugger routed a red suite to ${diag.owner}: ${diag.rootCause} — ${redReason}`, { diag })
        }
      }
    }

    // 4. Commit-breakdown check — plain list diff, reported and never blocking
    log(`#${lane.issue}: ${sub.branch} done (${rec.plannedCommits} planned, ${rec.madeCommits} made)`)
  }

  for (const sub of lane.subLanes) {
    const rec = {
      branch: sub.branch, area: sub.area || null, ending: null,
      // Both counts are scoped to THIS run: on resume sub.commits is the remainder, so the
      // pair still detects a split or an append, it just isn't the plan's grand total.
      commits: [], plannedCommits: sub.commits.length, madeCommits: 0,
      deviations: 0, disputed: 0, criterionVerdicts: [], reviewNotes: '',
      // openFindings: reviewer findings the sub-lane finished without applying or retracting —
      // the predicate's "findings are resolved" conjunct, filled in only where one is left open.
      fixedFindings: [], wontFix: [], openFindings: [], attempts: [],
      // One entry per CHANGES_REQUESTED review round — whether it brought previously-unseen
      // findings or repeated prior ones. Appended by the review loop and read by whatever renders
      // an ended sub-lane, so the loop appends without asking whether the sub-lane will end.
      reviewTrajectory: [],
      // Never absent: the ledger renders passed / failed / not-run-and-why, and has no rendering
      // for a missing value. A sub-lane an ending stops never reaches the gate, and must still
      // say so — end() fills the why in, since only it knows what stopped it.
      suite: { state: 'not-run', failing: [], output: '' },
    }
    subResults.push(rec)
    await runSubLane(sub, rec)
    // Computed per sub-lane, from that sub-lane's own inputs: each is its own branch and its
    // own pull request, so one sub-lane's draft never drafts another's.
    rec.terminal = terminalState(rec)
  }

  // Reporting only, and FAILED wins — the same precedence notifications.md applies to the
  // per-issue label. Each sub-lane's own ending is what decides its disposition, since each
  // sub-lane is its own pull request.
  const ended = subResults.filter(r => r.ending)
  const rollUp = ended.find(r => r.ending.category === 'FAILED') || ended[0]
  return { issue: lane.issue, mode: MODE, ending: rollUp ? { ...rollUp.ending } : null, crashed: false, notified: false, subResults }
}

// THE single wrapper every lane goes through, and the reason the lane body above is a named
// function rather than the closure it used to be. A throw at any of the body's ending sites used
// to resolve the lane to nothing, and the filter below then dropped it — so the issue vanished
// with no label, no comment and no record of which one it was. One catch here covers every site,
// and it is also the one place an ending-time dispatch hooks into: threading either through
// seventeen ending sites is how they drift apart.
const laneThunk = lane => async () => {
  const subResults = []
  try {
    const result = await runLane(lane, subResults)
    // Here, and not at any of the ending sites above: one dispatch per lane, because the label is
    // per issue. It fires as THIS lane returns, so a lane that ends at minute three is written up
    // then rather than waiting on a sibling that runs for another forty.
    //
    // Once per RUN, not once per layer. A lane whose sub-lanes span layers reaches this script
    // again in the next layer; without lane.notified it would post a second ending comment,
    // against the specification's one-comment-per-kind rule, and would then report notified:false
    // to a host that had already been told true — earning the ended lane a second, contradicting
    // label. The host carries the flag forward between layers; this honours it.
    if (result.ending && !lane.notified) result.notified = await notify(lane, result.ending)
    else if (lane.notified) result.notified = true
    return result
  } catch (err) {
    const reason = crashReason(err)
    // The sub-lane in flight when the throw happened is the one that crashed; sub-lanes already
    // finished keep their own ending and their own terminal state. Everything unfinished takes
    // the crash and reaches the terminal-state table, so the host can dispose of it like any
    // other row rather than meeting a record with no `terminal` at Gate 2.
    for (const rec of subResults) {
      if (rec.terminal) continue
      if (!rec.ending) failed(rec, reason)
      rec.terminal = terminalState(rec)
    }
    log(`#${lane.issue}: the lane threw — returning it attributed rather than losing it`)
    // No dispatch: a throw unwound past the point one fires from, so the host labels this lane
    // when the script returns. Accepted latency — it is rare, and nobody can act faster anyway.
    return { issue: lane.issue, mode: MODE, ending: { category: 'FAILED', reason }, crashed: true, notified: false, subResults }
  }
}

const laneResults = await parallel(input.lanes.map(laneThunk))

// No filter: a requested issue leaves this script with an entry whatever happened to it. The
// thunks above cannot throw, so a null here is the runner itself dropping a lane, which is exactly
// as unattributable as the throw used to be — and is the same observation every stage above
// reports through returnedNothing(), so it uses that helper rather than a second wording of it.
const done = laneResults.map((lane, i) => lane || {
  issue: input.lanes[i].issue,
  mode: MODE,
  ending: { category: 'FAILED', reason: returnedNothing('the workflow runner for this lane') },
  crashed: true,
  notified: false,
  subResults: [],
})
const count = c => done.filter(l => l.ending && l.ending.category === c).length
log(`${done.filter(l => !l.ending).length} lane(s) completed, ${count('HALT')} HALT, ${count('FAILED')} FAILED`)
return done
