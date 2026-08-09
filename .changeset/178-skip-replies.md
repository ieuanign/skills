---
"ieuanign-skills": minor
---

`/pr-comments` answers a skipped comment in the thread that raised it.

A skip used to be delivered only in the run's table, and both of this skill's comments post at the
foot of the pull request — so the person whose comment was skipped was notified about *the pull
request* rather than about *their comment*, and the thread they were watching stayed silent. For a
`disagreed with` skip that is the worst shape it can take: the harness overrules a human reviewer,
somewhere that reviewer has no reason to look.

Every skip whose entry carries a `threadId` now gets one reply in that thread, immediately after the
gate — its named reason and that reason's evidence, the same strings the table carries and never a
second wording, a `disagreed with` reply carrying its reasoning in full. One reply per thread however
many of its comments were skipped, since a thread is one conversation.

Immediately after the gate rather than with the ledger, because the skip rows are settled at approval
and nothing downstream depends on them: a reply held to the end never arrives on any path that ends
before it. The cost is that a reply carries no link to the table, the comment holding it not having
been posted yet.

A skip with no thread — a review body, an issue comment — has no reply primitive to use, so none is
invented for it; nothing acts on an `unclassified` row, a reply included. The ledger names both, plus
every thread the run did reply in and every reply that failed. A failed reply is reported and changes
nothing else about the run, the same way a failed notification does.

The write budget in the hard rules moves with it: one push, one comment under `gated` or two under
`unattended`, and one reply per skipped thread. Nothing else about append-only is relaxed — a thread
is replied to, never resolved, and no state, label, body or comment of anyone else's is touched.
