#!/usr/bin/env node
// The PR-comment read's normaliser, driven over fixtures with NOTHING spawned: importing the module
// runs no fetch, so every exclusion and every carried field is checkable for the price of a node process.

import assert from 'node:assert/strict'
import { normalise, ORIGINS } from '../skills/dev-loop-pr-comments/read-comments.mjs'

// --- fixture builders --------------------------------------------------------

const comment = (id, over = {}) => ({
  id,
  body: `body of ${id}`,
  url: `https://github.com/o/r/pull/1#discussion_r${id}`,
  createdAt: '2026-08-01T10:00:00Z',
  path: 'src/a.ts',
  line: 12,
  originalLine: 12,
  isMinimized: false,
  author: { login: 'someone' },
  ...over,
})

const thread = (id, comments, over = {}) => ({
  id,
  isResolved: false,
  isOutdated: false,
  comments: { totalCount: comments.length, nodes: comments },
  ...over,
})

const review = (id, over = {}) => ({
  id,
  state: 'COMMENTED',
  body: `verdict of ${id}`,
  url: `https://github.com/o/r/pull/1#pullrequestreview-${id}`,
  createdAt: '2026-08-01T11:00:00Z',
  isMinimized: false,
  author: { login: 'someone' },
  ...over,
})

const issueComment = (id, over = {}) => ({
  id,
  body: `note ${id}`,
  url: `https://github.com/o/r/pull/1#issuecomment-${id}`,
  createdAt: '2026-08-01T12:00:00Z',
  isMinimized: false,
  author: { login: 'someone' },
  ...over,
})

// --- the scenario registry ---------------------------------------------------

const scenarios = []
const scenario = (name, fn) => scenarios.push({ name, fn })

const ids = entries => entries.map(e => e.id)

// --- exclusions --------------------------------------------------------------

scenario('a resolved thread is excluded whole, and an unresolved one is kept whole', () => {
  const entries = normalise({
    threads: [
      thread('t-resolved', [comment('c-resolved-1'), comment('c-resolved-2')], { isResolved: true }),
      thread('t-open', [comment('c-open-1'), comment('c-open-2')]),
    ],
  })
  assert.deepEqual(ids(entries), ['c-open-1', 'c-open-2'])
})

scenario('all three origins arrive in one list, and only the reviews that are comments', () => {
  const entries = normalise({
    threads: [thread('t1', [comment('c-inline')])],
    reviews: [
      review('r-said-something', { state: 'CHANGES_REQUESTED', body: 'the guard is missing' }),
      // The envelope around c-inline above: a verdict, not a second copy of the comment.
      review('r-envelope', { state: 'COMMENTED', body: '' }),
      review('r-whitespace', { state: 'APPROVED', body: '\n  \n' }),
      review('r-unsubmitted', { state: 'PENDING', body: 'a draft nobody has sent' }),
    ],
    issueComments: [issueComment('i1', { body: 'a note on the pull request itself' })],
  })
  assert.deepEqual(ids(entries), ['c-inline', 'r-said-something', 'i1'])
  assert.deepEqual(entries.map(e => e.origin), [
    ORIGINS.reviewThread,
    ORIGINS.reviewBody,
    ORIGINS.issueComment,
  ])
  assert.deepEqual(entries.map(e => e.reviewState), [null, 'CHANGES_REQUESTED', null])
})

scenario('a minimised comment is excluded at every origin', () => {
  const entries = normalise({
    threads: [thread('t1', [comment('c-hidden', { isMinimized: true }), comment('c-shown')])],
    reviews: [review('r-hidden', { isMinimized: true }), review('r-shown')],
    issueComments: [issueComment('i-hidden', { isMinimized: true }), issueComment('i-shown')],
  })
  assert.deepEqual(ids(entries), ['c-shown', 'r-shown', 'i-shown'])
})

// --- what each entry carries -------------------------------------------------

scenario('an outdated comment keeps line null and its stale anchor separate', () => {
  const [moved, live] = normalise({
    threads: [
      thread('t-outdated', [comment('c-moved', { line: null, originalLine: 431 })], { isOutdated: true }),
      thread('t-current', [comment('c-live', { line: 12, originalLine: 9 })]),
    ],
  })
  assert.deepEqual(
    { path: moved.path, line: moved.line, originalLine: moved.originalLine, outdated: moved.outdated },
    { path: 'src/a.ts', line: null, originalLine: 431, outdated: true },
  )
  assert.deepEqual(
    { line: live.line, originalLine: live.originalLine, outdated: live.outdated },
    { line: 12, originalLine: 9, outdated: false },
  )
})

// Every metacharacter a body could carry into a shell, plus the newline that would end a command.
// Kept as one string literal so a broken assertion prints the exact bytes that failed to survive.
const HOSTILE = 'run `git log` first\nthen $(rm -rf /) and "quoted" \'single\' \\backslash | ; & > $HOME'

scenario('a body arrives byte for byte, through the JSON the reader prints', () => {
  const entries = normalise({
    threads: [thread('t1', [comment('c1', { body: HOSTILE })])],
    reviews: [review('r1', { body: HOSTILE })],
    issueComments: [issueComment('i1', { body: HOSTILE })],
  })
  assert.deepEqual(entries.map(e => e.body), [HOSTILE, HOSTILE, HOSTILE])
  const printed = JSON.parse(JSON.stringify({ pullRequest: 1, comments: entries }))
  for (const e of printed.comments) assert.equal(e.body, HOSTILE)
})

scenario('every entry carries the same keys, and an absent author stays null', () => {
  const entries = normalise({
    threads: [thread('t1', [comment('c1', { author: null })])],
    reviews: [review('r1')],
    issueComments: [issueComment('i1')],
  })
  const keys = ['origin', 'id', 'author', 'body', 'url', 'createdAt', 'path', 'line', 'originalLine', 'outdated', 'reviewState']
  for (const e of entries) assert.deepEqual(Object.keys(e).sort(), [...keys].sort(), `entry ${e.id}`)
  assert.deepEqual(entries.map(e => e.author), [null, 'someone', 'someone'])
  // A review body and an issue comment have no location, and none is invented for them.
  assert.deepEqual(entries.slice(1).map(e => [e.path, e.line, e.originalLine, e.outdated]), [
    [null, null, null, null],
    [null, null, null, null],
  ])
})

scenario('nothing on the pull request is an empty list, not a failure', () => {
  assert.deepEqual(normalise({ threads: [], reviews: [], issueComments: [] }), [])
  assert.deepEqual(normalise({}), [])
})

// --- the runner --------------------------------------------------------------

let failed = 0
for (const { name, fn } of scenarios) {
  try {
    await fn()
    console.log(`ok    pr comments: ${name}`)
  } catch (err) {
    console.error(`FAIL  pr comments: ${name}`)
    console.error(String((err && err.stack) || err).replace(/^/gm, '      '))
    failed = 1
  }
}
process.exit(failed)
