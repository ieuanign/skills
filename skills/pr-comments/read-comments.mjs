#!/usr/bin/env node
// A pull request's unresolved comments, in one shape, whatever kind each started as.
//
// `.mjs` on purpose: this ships into arbitrary repositories, and a `.js` file's module system is
// decided by whichever package.json happens to be nearest once it is installed.

import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// The three kinds of thing a human writes on a pull request. Declared once so a consumer switches
// on these rather than on the shape of the entry.
export const ORIGINS = {
  reviewThread: 'review-thread',
  reviewBody: 'review-body',
  issueComment: 'issue-comment',
}

const login = author => (author && typeof author.login === 'string' ? author.login : null)

// Every entry carries every key, so a consumer reads one shape. Fields that cannot apply to an
// origin are null rather than absent or invented.
const entry = (origin, node, extra) => ({
  origin,
  id: node.id,
  author: login(node.author),
  body: node.body,
  url: node.url,
  createdAt: node.createdAt,
  path: null,
  line: null,
  originalLine: null,
  outdated: null,
  threadId: null,
  reviewState: null,
  ...extra,
})

// Hiding a comment is a human saying it is dealt with — an explicit signal of its own, not an
// inference from thread resolution, which is why it excludes at every origin.
const hidden = node => Boolean(node.isMinimized)

/** GraphQL nodes → one flat entry list. Pure: no fetch, no clock, no environment. */
export function normalise({ threads = [], reviews = [], issueComments = [] } = {}) {
  const entries = []

  for (const thread of threads) {
    // GraphQL's own flag, never an inference: REST does not expose thread resolution, and guessing
    // returns every comment a long-lived pull request ever carried.
    if (thread.isResolved) continue
    for (const c of thread.comments?.nodes ?? []) {
      if (hidden(c)) continue
      entries.push(entry(ORIGINS.reviewThread, c, {
        // Verbatim, never substituted: an outdated comment has `line: null` while `originalLine`
        // still holds the stale anchor, so copying one into the other invents a location.
        path: c.path ?? null,
        line: c.line ?? null,
        originalLine: c.originalLine ?? null,
        outdated: Boolean(thread.isOutdated),
        // The conversation a comment sits in. Nothing on the comment recovers it, so a consumer
        // that answers a thread once rather than per reply has to be handed it here.
        threadId: thread.id ?? null,
      }))
    }
  }

  for (const r of reviews) {
    // A review is a verdict, not necessarily a comment: PENDING is unsubmitted, and a review with
    // no prose is the envelope around inline comments already collected above.
    if (r.state === 'PENDING' || !r.body?.trim() || hidden(r)) continue
    entries.push(entry(ORIGINS.reviewBody, r, { reviewState: r.state ?? null }))
  }

  for (const c of issueComments) {
    if (hidden(c)) continue
    entries.push(entry(ORIGINS.issueComment, c))
  }

  return entries
}

const PAGE = 100
const COMMENT_FIELDS = 'id body url createdAt path line originalLine isMinimized author { login }'

// One pageInfo per document, deliberately: `gh --paginate` follows the first one it finds anywhere
// in the response, so a nested second would hijack the outer cursor. `totalCount` stands in for it.
const THREADS_QUERY = `query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) { pullRequest(number: $number) {
    reviewThreads(first: ${PAGE}, after: $endCursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id isResolved isOutdated
        comments(first: ${PAGE}) { totalCount nodes { ${COMMENT_FIELDS} } }
      }
    }
  } }
}`

const THREAD_COMMENTS_QUERY = `query($id: ID!, $endCursor: String) {
  node(id: $id) { ... on PullRequestReviewThread {
    comments(first: ${PAGE}, after: $endCursor) {
      pageInfo { hasNextPage endCursor }
      nodes { ${COMMENT_FIELDS} }
    }
  } }
}`

const REVIEWS_QUERY = `query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) { pullRequest(number: $number) {
    reviews(first: ${PAGE}, after: $endCursor) {
      pageInfo { hasNextPage endCursor }
      nodes { id state body url createdAt isMinimized author { login } }
    }
  } }
}`

const ISSUE_COMMENTS_QUERY = `query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
  repository(owner: $owner, name: $name) { pullRequest(number: $number) {
    comments(first: ${PAGE}, after: $endCursor) {
      pageInfo { hasNextPage endCursor }
      nodes { id body url createdAt isMinimized author { login } }
    }
  } }
}`

// Node's 1 MB default is well inside what a busy pull request's bodies weigh, and an overflow
// truncates the JSON rather than failing — so it is raised here and ENOBUFS is fatal below.
const MAX_OUTPUT = 64 * 1024 * 1024

// Argument array and no shell: bodies carry backticks, `$(...)` and quotes, and this boundary is
// the only place they could ever execute. Query documents only — never a mutation.
function ghPages(args) {
  const r = spawnSync('gh', ['api', 'graphql', '--paginate', '--slurp', ...args], {
    encoding: 'utf8',
    shell: false,
    maxBuffer: MAX_OUTPUT,
  })
  if (r.error) {
    const why = r.error.code === 'ENOENT' ? 'gh is not installed or not on PATH' : r.error.message
    throw new Error(why)
  }
  if (r.status !== 0) throw new Error(r.stderr.trim() || `gh exited ${r.status}`)
  return JSON.parse(r.stdout).map(page => page.data)
}

// A null connection is an unknown or invisible pull request, which GitHub can answer with data
// rather than an error — it is never a pull request that simply has nothing on it.
function nodesOf(pages, pick, what) {
  return pages.flatMap(data => {
    const conn = pick(data)
    if (!conn) throw new Error(`no ${what} in the response for that pull request`)
    return conn.nodes
  })
}

// The repository is gh's to resolve — the checkout's remote, or GH_REPO. This adds no flag of its
// own, so it cannot disagree with the rest of the pipeline about which repository it is reading.
const prVars = number => ['-F', 'owner={owner}', '-F', 'name={repo}', '-F', `number=${number}`]

function readPullRequest(number) {
  const vars = prVars(number)
  const pr = data => data.repository?.pullRequest

  const threads = nodesOf(
    ghPages(['-f', `query=${THREADS_QUERY}`, ...vars]),
    d => pr(d)?.reviewThreads,
    'review threads',
  )
  for (const t of threads) {
    // The one connection `--paginate` cannot follow, per the query above — a short list is spotted
    // by count and refetched, so a long thread is never silently cut off at a page.
    if (t.comments.totalCount <= t.comments.nodes.length) continue
    t.comments.nodes = nodesOf(
      ghPages(['-f', `query=${THREAD_COMMENTS_QUERY}`, '-F', `id=${t.id}`]),
      d => d.node?.comments,
      'thread comments',
    )
  }

  return {
    threads,
    reviews: nodesOf(ghPages(['-f', `query=${REVIEWS_QUERY}`, ...vars]), d => pr(d)?.reviews, 'reviews'),
    issueComments: nodesOf(ghPages(['-f', `query=${ISSUE_COMMENTS_QUERY}`, ...vars]), d => pr(d)?.comments, 'comments'),
  }
}

const USAGE = `usage: read-comments.mjs <pull-request-number>

Prints the pull request's unresolved comments as one JSON document on stdout: thread-anchored
review comments on unresolved threads, review bodies, and issue comments. The repository is the
one gh resolves — this checkout's remote, or GH_REPO=<owner>/<name>.`

function main(argv) {
  const raw = (argv[0] ?? '').replace(/^#/, '')
  if (argv.length !== 1 || !/^\d+$/.test(raw) || Number(raw) === 0) {
    process.stderr.write(`${USAGE}\n`)
    return 2
  }
  const number = Number(raw)
  let payload
  try {
    payload = readPullRequest(number)
  } catch (err) {
    // No JSON on a failed read, ever: an empty list has to mean "no unresolved comments" and
    // nothing else, or every consumer downstream reads a broken fetch as a clean pull request.
    process.stderr.write(`read-comments: ${err.message}\n`)
    return 1
  }
  const doc = { pullRequest: number, comments: normalise(payload) }
  process.stdout.write(`${JSON.stringify(doc, null, 2)}\n`)
  return 0
}

// Node resolves a module's own path through symlinks and leaves argv[1] as the caller typed it, so a
// skill folder reached through one makes these differ — and an unresolved compare skips main() silently.
const invokedDirectly = invoked => {
  if (!invoked) return false
  if (import.meta.url === pathToFileURL(invoked).href) return true
  try {
    return import.meta.url === pathToFileURL(realpathSync(invoked)).href
  } catch {
    return false
  }
}

if (invokedDirectly(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2))
}
