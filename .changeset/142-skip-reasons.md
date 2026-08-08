---
"ieuanign-skills": minor
---

`/pr-comments` skips are now checkable rather than taken on trust.

A skip carries one reason from a closed list of four — `question`, `already addressed`, `out of
scope for this branch`, `disagreed with` — and free text never stands where a reason goes. Each
takes its own kind of evidence: a verbatim fragment of the body for a question, the short sha and
subject of a commit **this pull request holds** for one already addressed, the separate piece of
work for one deferred, the reasoning in full for one disagreed with. A skip whose evidence cannot
be produced is not a skip: it comes back as `unclassified`, a third intent beside **fix** and
**skip**, which the run states plainly and nothing acts on. A comment fitting none of the four is
the signal to widen the vocabulary deliberately, never a licence for prose.

`already addressed` is the one reason whose evidence lives outside the comment set, so it reads
`gh pr view <n> --json commits` and names a commit that read returned. Thread metadata is not
evidence — an outdated comment is one whose code moved, which says nothing about whether anyone did
what it asked.

The table gains a reason column so the eye runs down it, and stays **one line per comment**:
anything longer than a clause goes to a keyed expansion beneath it. A `disagreed with` row is
marked `(!)` — plain ASCII, legible in a terminal and in GitHub's renderer alike — and its
expansion is mandatory, because that row is the harness overruling a human reviewer. Fix rows state
their intent in one clause, and it is that clause, character for character, that reaches the writer.

One table definition renders in all three places it appears: the approval gate, the file the execute
phase reads, and the ledger comment — the only copy that outlives the run.

Still read-only up to the gate and append-only past it. The one new call, `gh pr view <n> --json
commits`, is a read; no thread is resolved, least of all one reasoned `already addressed`.
