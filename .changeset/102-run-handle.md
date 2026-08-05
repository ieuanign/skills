---
"ieuanign-skills": minor
---

An unattended `/dev-loop` run now carries a **run handle** — the identifier that locates its own transcript.

Endings already carried a resume command that re-derives everything from artifacts. That is correct, and it is not the same thing as being able to see what the reviewer actually said on cycle two: reconstructing that meant reading commit timestamps and inferring where one cycle ended and the next began. The evidence for the review-loop change in this same release had to be recovered exactly that way.

The host reads the session identifier from its environment at intake and passes it into the phase scripts' arguments — the same class of fact as the skill directory and the agent namespace, both of which the host can see and a script cannot. It needs no new principle, only one more argument.

**It is written in exactly two places.** The **ending comment on the issue**, by the notifier mid-lane and by the host for a lane that threw, where no notifier ever ran — which also closes a hole, because that lane was owed an ending comment nothing was writing. And the **pull request body** of an ended sub-lane, which is the only copy that outlives the run.

**It is deliberately not in the message.** That is one line for triage from a phone; a handle in it would crowd out the reason, which is the thing the line exists to carry.

**Where the environment shows no identifier the handle is omitted silently** — a missing line, never an error, never a question, and no lane's outcome changes.

**It is a run handle and not a resume identifier**, and the distinction is load-bearing: an unattended conclusion removes an ended sub-lane's worktree, so the state a session resume would restore is the state the conclusion just deleted. `/dev-loop <n>` is unchanged and remains the resume mechanism.
