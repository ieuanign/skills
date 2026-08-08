---
"ieuanign-skills": minor
---

`/pr-comments auto <pull request>` runs the whole harness unattended, and reports itself on
the pull request rather than into a terminal nobody is watching.

A leading `auto` — the same token in the same position `/dev-loop` takes it in — is read off the
arguments once and carried as one value: no later step re-derives it, and no other argument and no
profile key overrides it. It suppresses the approval gate and nothing else. Every comment is still
classified, the table is still rendered and still written to the file the execute phase reads, and
each of the gate's questions resolves to a stated default: every **fix** row proceeds, a **skip** stays
skipped with its reason and evidence, an **unclassified** row is reported and acted on by nothing, and
a table with no fix row at all stops the run having provisioned nothing. The preconditions are not
gates and fire under both modes, so no unattended default is invented for a profile key.

Where the gate asked, an unattended run posts the table on the pull request. Where it finishes — or
ends mid-flight — it posts one conclusion comment beside that one: the findings ledger where the
commits reached the branch, and where they did not, the step that stopped it and that step's message
verbatim, the table in full either way, the kept worktree and table file by path, and the run handle
that locates the run's transcript. Two comments per run, never a third, and the second is never an
edit to the first.

A `start` message goes out once the preconditions pass, and exactly one closing message as the run's
last act — the pull request's number, a state token, the reason, the link — through the sibling
skill's `notify.sh` with the payload on standard input. `halt` where something deliberately stopped,
`failed` where something broke, `ready` where the commits reached the branch; `draft` cannot apply
here and no sixth token is invented, which is what keeps a `start` with no close after it readable as
a dead run. No notification failure changes the run it reports.

Unchanged: the append-only discipline, narrower here than `/dev-loop`'s because the artifacts belong
to someone else — no thread resolved, no draft or ready state converted, no label on anything, no body
or comment edited — one push, no force-push in any form, and nothing under `skills/dev-loop/` touched.
No notifier is dispatched either: one lane with one sub-lane returns to a session that can write every
event itself.
