---
"ieuanign-skills": minor
---

`/dev-loop-pr-comments` gets the written record: a narrative a human reads and no run loads, and the
glossary entries that make it readable.

**`docs/dev-loop-pr-comments.md`** is modelled section-for-section on `docs/dev-loop.md`. What it does,
the four words you need before the rest reads, when to reach for it over `/dev-loop` or
`/code-review-mp`, prerequisites, what one run does in order, both run shapes end to end, the questions
people actually ask — each answered with the reason rather than the rule — and an "it's working if"
list of observable signals. It is in `docs/` rather than the skill because every byte of a `SKILL.md`
is loaded by every run of that skill, and a file no orchestrator opens costs a run nothing. The review
loop's bound is linked to `docs/dev-loop-internals.md`, not restated: `npm run check` cross-checks that
number against the pipeline, and a second prose home for it is drift waiting to happen.

It states the refusals plainly and gives the reason behind each: no review thread resolved, no draft or
ready conversion, no label, no body or comment edited, no comment re-classified to reach a different
intent, and a push that is never forced. The discipline is deliberately narrower than `/dev-loop`'s
because every artifact in sight belongs to somebody else — this run opens no pull request, so it has no
state of its own to set.

**`CONTEXT.md`** gains **comment table**, **fix**, **skip**, **unclassified** and the **pull
request-comment lane**. The last defines itself rather than leaning on "lane", which the glossary does
not carry, and names what it lacks: no architect-authored plan, because the table's fix rows *are* the
plan the execute phase runs on; no acceptance criteria, and so no spec axis and no criterion verdicts;
and no pull request created, because it pushes to one that already exists.

**No decision record accompanies any of this, and that is the call rather than an omission.** This
repository keeps none — `docs/agents/domain.md` says so outright, and `1653f05` deleted the eight it
had. The comment-table-is-the-plan decision is written into the narrative instead, with the
alternative it beat (a planning stage between the comments and the writer) and the reason it lost: the
comments are already the brief, and a derived plan would have the gate approving a table while the
writer worked from a paraphrase of it.

`README.md` links the narrative. Nothing under `skills/` or `agents/` changes, and a run behaves
byte-identically before and after.
