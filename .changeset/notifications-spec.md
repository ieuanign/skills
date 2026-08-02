---
"ieuanign-skills": minor
---

`dev-loop`: `notifications.md` — one normative specification for everything an unattended run writes to the outside world, implemented by both writers that emit it.

An unattended run has two of them: the host, at its own boundaries, and a notifier subagent, from inside a running phase script — and nothing kept the two in step. `contracts.md` had left the space open ("Both are specified separately; this is the section they fill"). It is now filled by a document rather than a copy: the event table with the writer owning each event, the label roles and the one question that selects one, the message and comment formats, the channel contract, the ordering guarantees, and the hazards recorded rather than solved. Nothing in it fires in gated mode, stated once and nowhere repeated.

The scoping rule behind the writer column is recorded so nobody re-derives it — the notifier owns only what the host cannot see. A workflow script has no shell, so the host is blind while one runs and a mid-lane event has no other writer; everything at a host boundary is a host command. Routing every event through the notifier was rejected: it spends an agent to run one command.

Label roles only, never label strings — each resolves through the consuming repository's triage-label documentation, so a repository keeps its own vocabulary. Two properties fall out of the selecting question rather than being designed in: failed is always a crash and never a verdict, which is what makes it answer *is this worth retrying?*, and every draft-PR case is host-applied while every halt case is notifier-applied.

`contracts.md`'s unattended paragraph now points at the new file and states which of the two documents governs what, and its append-only invariant records why writing labels to an issue a human filed is inside it: a label add or remove is additive and reversible, and human intent is what the invariant guards. No behaviour ships — every event in the table is implemented by a later change.
