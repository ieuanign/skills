# /dev-loop notifications — the normative specification both writers implement

This file is the single source of truth for what an unattended run writes to the outside world as it goes: its workflow labels, its issue comments, and its messages. Two writers emit them — the **host**, at its own boundaries, and the **notifier** subagent, from inside a running phase script — and each implements this file rather than restating it. It is normative for its subject the way `contracts.md` is normative for the state machine: the role contracts, terminal categories, findings ledger and append-only invariant are `contracts.md`'s, and this file names them without redefining them. If an implementation and this file disagree, this file governs.

**Nothing here fires in gated mode** (the supervised run, where a human concludes the lane). Stated once; no section below repeats it.

## Event table

| Event | When | Writer |
|---|---|---|
| in-progress label added | before planning | host |
| message: started | before planning | host |
| plan comment | after planning | host |
| halt: label swap + halt comment | mid-lane | notifier |
| message: halted, one-line reason | mid-lane | notifier |
| crash: label swap for a lane that threw | when the script returns | host |
| completion: label removed, PR opened | after the script | host |
| message: PR link, ready or draft | after the script | host |

The scoping rule that produced the Writer column, recorded so it is never re-derived: **the notifier owns only what the host cannot see.** The host is blind while a phase script runs — a workflow script has no shell — so a mid-lane event has no other writer, and everything at a host boundary is a host command.

Routing every event through the notifier was rejected: it spends an agent to run one command, which the skill's Hard rules forbid in terms, and the modularity actually wanted is *one place defines the notifications*, which this file delivers either way.

## Label roles and the rule that selects one

Three roles — **in-progress**, **awaiting-human**, **failed**. Roles, never strings: each resolves through the consuming repository's triage-label documentation (`docs/agents/triage-labels.md`), so a repository keeps its own vocabulary. Giving a role a label where the repository has none is that repository's setup work, not this pipeline's.

One question selects the role: **did the run reach a reasoned conclusion, or did a stage break?**

| Outcome | Role applied |
|---|---|
| a conclusion needing a human — a halt carrying its diagnosis, and every draft PR | awaiting-human |
| a break — any dead agent, any unrunnable stage | failed |
| a ready PR | none |

The in-progress role is removed in every one of the three, including the one that applies nothing. Which endings open a draft PR rather than a ready one is the terminal-state table's, specified separately over `contracts.md`'s terminal categories.

Two properties fall out of that question rather than being designed in:

- **failed is always a crash and never a verdict.** A lane that reasoned its way to an ending takes awaiting-human however bad the ending was, so failed answers exactly one question: *is this worth retrying?*
- **Every draft-PR case is host-applied and every halt case is notifier-applied** — straight out of the scoping rule, since a PR is opened at a host boundary and a halt happens mid-script.

## Messages and comments

A **halt message** says why in one line, so it can be triaged from a phone. A **completion message** carries the PR link and whether it opened ready or draft. Detail belongs on the issue, not in the message.

**At most one comment of each kind per lane** — one plan comment after planning, and, if the lane dies, one halt comment. Each is an extremely concise summary plus open questions, never a transcript: the plan file already survives on disk at tens of kilobytes, and no agent ever reads the comment (the writer and the reviewer both take the plan from disk), so inlining it buries the thread to serve nobody. A halted lane never reaches the end of a lane, so its halt comment is the *last* one it posts.

## Channel contract

The payload arrives on standard input and never enters a shell string: it is agent-generated free text, and a shell string is where free text becomes an injection. With the channel's configuration absent from the environment, the channel stays silent and does not error.

## Ordering and durability

- Labels are written before a single token is spent, so a crash still leaves the marker behind.
- Labels are crash-safe; messaging is best-effort. Neither costs tokens.
- Exactly one closing message per lane, so a start with no close plus a stale in-progress label reads as a dead run by inspection.
- A developer with no channel configured gets silence, not an error.

## Recorded hazards

Properties of the surrounding environment, recorded here and solved nowhere in this file.

- **The in-progress role incidentally restores a claim marker.** A net win: a separate orchestration system refuses any issue wearing one, so the two get mutual exclusion for free. The hazard is that same system's orphan sweep, which strips claims with no run behind them and so could reclaim an issue this pipeline is actively working.
- **Two long-polling readers on one messaging bot steal each other's updates.** Outbound sending is safe concurrently, so this cannot collide with that system's daemon. Anything inbound — replying to a notification to trigger an action — clashes, needs a second bot, and is out of scope.
