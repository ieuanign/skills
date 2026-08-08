---
"ieuanign-skills": patch
---

A pull request's unresolved comments now read as one list, whatever kind each comment started as.

`skills/dev-loop-pr-comments/read-comments.mjs` returns thread-anchored review comments, review
bodies and issue comments in a single shape. Resolved threads are excluded on GraphQL's own
`isResolved` rather than on an inference — REST does not expose thread resolution, and guessing hands
back every comment a long-lived pull request ever carried. Hidden comments are excluded too, because
minimising one is a human saying it is dealt with.

Bodies are carried byte for byte and never reach a shell: `gh` is spawned with an argument array and
its stdout is parsed, which is what makes a body containing backticks, `$(...)` and quotes inert.

Every entry names the thread it sits in. Replies on one conversation share a `threadId`, which is
null on a review body and an issue comment because neither belongs to a thread — so a consumer can
answer a conversation once rather than once per reply.

Absence stays absence. An outdated comment keeps `line: null` while its stale `originalLine` anchor
travels separately, so a consumer can tell *no line* from *line moved* rather than being handed a
location the file no longer has. Every connection is paginated, and a failed read exits non-zero with
no JSON — an empty list can only ever mean no unresolved comments.

The folder holds the module and nothing else: no `SKILL.md` and no manifest entry, so nothing
installs or invokes it yet.
