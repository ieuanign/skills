---
"ieuanign-skills": minor
---

`/pr-comments` answers every comment in the thread that raised it, and reads a question for its
answer rather than its grammar.

#178 gave the skipped reviewer a reply in their own thread and left three holes behind it. The reply
never fired on the run most likely to need it: Step 4 ended the run where no row was a **fix**,
*above* the section that replies, so a pull request whose every comment was skipped answered nobody.
A comment that was *acted on* heard nothing at all, leaving its author to read a diff to find out.
And the mutation's JSON was hand-written by the agent, so a multi-paragraph `disagreed with` reply
was a parse error rather than an escaped string.

**Every review thread the table covers now gets exactly one reply, whatever its rows were
classified** — fix, skip and unclassified alike, under both modes. `gated` and `unattended` differ
only at the listing step, where a developer sees what will be fixed and skipped and why; that
difference no longer reaches the threads. A thread holding no fix row is answered at Step 4; one
holding a fix waits for Step 10, so its reply carries the short sha and subject of the commit that
answered it — or, where nothing was pushed, what stopped it, never a sha the remote does not hold.
Replies are one line, the strings the table already carries; `disagreed with` remains the single
exception and carries its reasoning in full. The gated gate now asks on every path that reaches it,
which is what closes the hole.

**A question is classified on what its answer implies, never on its grammar.** Answer it first, then
look at the answer: an answer naming something the code should do differently makes the row a
**fix**, and that answer is its clause of intent; an answer that stands on its own with the code
unchanged makes it `skip — question`, and that answer is its evidence and its reply. *"Why not use a
hook rather than copying this three times?"* and *"why is this constant in a utils file?"* are both
sincerely interrogative and both fixes. A comment settled by a standing convention names the
convention — the file and what it says — the way `already addressed` names a real commit.

**Every write carries its provenance**: a hidden `<!-- replied from /pr-comments -->` marker and a
visible `🤖 Generated with Claude Code` footer. `gh` authenticates as the human who invoked the run,
so without the footer every comment and reply read as written by them.

The reply mutation now passes its body through `gh` with `-F b=@-`, so multi-paragraph prose full of
backticks and quotes is serialised rather than hand-escaped. `Step 2`'s key list gains the `id` the
reader has always emitted.

`docs/pr-comments.md`, `CONTEXT.md` and `README.md` describe the behaviour that now ships — the run's
step list, the write budget, both new questions in the FAQ, and the glossary's `Fix`, `Skip`,
`Unclassified` and lane entries.

Nothing about append-only is relaxed: a thread is replied to, never resolved, and no state, label,
body or comment of anyone else's is touched. The hard rules shed the fourteen bullets that restated a
step, keeping the write budget, append-only, and the two destructive operations that stay explicit
bans; the shell and provenance rules every write shares move into one **How this run writes** section
rather than being restated at each site.
