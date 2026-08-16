# /dev-loop notifications — the normative specification both writers implement

This file is the single source of truth for what an unattended run writes to the outside world as it goes: its workflow labels, its issue comments, and its messages. Two writers emit them — the **host**, at its own boundaries, and the **notifier** subagent, from inside a running phase script — and each implements this file rather than restating it. It is normative for its subject alone: the endings and their labels are `acts/act-3.md`'s, the findings ledger is `acts/gate-2.md`'s, the append-only invariant is `SKILL.md`'s, and the role contracts are the roster agents' own, so this file names all of them without redefining any. If an implementation and this file disagree, this file governs.

**Nothing here fires in gated mode** (the supervised run, where a human concludes the lane).

## Event table

| Event | When | Writer |
|---|---|---|
| refusal: one comment per issue the run was asked to work | at intake, a prerequisite missing | host |
| message: refusal (`failed`), one for the whole run | at intake, a prerequisite missing | host |
| in-progress label added | before planning | host |
| message: started (`start`) | before planning | host |
| plan comment | after planning | host |
| halt or failed: label swap + ending comment | mid-lane | notifier |
| message: ending (`halt` or `failed`), with its one-line reason | mid-lane | notifier |
| crash: label swap **and ending comment** for a lane that threw | when the script returns | host |
| completion: label removed, PR opened | after the script | host |
| message: completion (`draft` or `ready`), with the PR link | after the script | host |

The scoping rule that produced the Writer column, recorded so it is never re-derived: **the notifier owns only what the host cannot see.** The host is blind while a phase script runs — a workflow script has no shell — so a mid-lane event has no other writer, and everything at a host boundary is a host command.

Routing every event through the notifier was rejected: it spends an agent to run one command, which the skill's Hard rules forbid in terms, and the modularity actually wanted is *one place defines the notifications*, which this file delivers either way.

## Label roles and the rule that selects one

Three roles — **in-progress**, **awaiting-human**, **failed**. Roles, never strings: each resolves through the consuming repository's triage-label documentation (`docs/agents/triage-labels.md`), so a repository keeps its own vocabulary. Giving a role a label where the repository has none is that repository's setup work, not this pipeline's — so a role that documentation names no string for is **skipped silently**: the write does not happen, nothing errors, and no string is invented, which would only create a label no other tooling knows.

One question selects the role: **did the run reach a reasoned conclusion, or did a stage break?**

| Outcome | Role applied |
|---|---|
| a conclusion needing a human — a halt carrying its diagnosis, and every draft PR from a reasoned ending | awaiting-human |
| a break — any dead agent, any unrunnable stage | failed |
| a ready PR | none |

The first two rows overlap, because a break now opens a draft pull request too. **failed wins**: a break is a break whatever it produced, and the question that role answers is the one a dead reviewer leaves open.

The in-progress role is removed in every one of the three, including the one that applies nothing. Which endings open a ready pull request rather than a draft one is the phase script's **terminal-state table**, already applied to each sub-lane before the host sees its result; it reads a sub-lane's ending — never its label, which decides nothing.

Two properties fall out of that question rather than being designed in:

- **failed is always a crash and never a verdict.** A lane that reasoned its way to an ending takes awaiting-human however bad the ending was, so failed answers exactly one question: *is this worth retrying?*
- **An ending's role is applied by the notifier, at the ending** — straight out of the scoping rule, since an ending happens mid-script. The draft pull request the host opens afterwards selects nothing *for that lane*: the ending that produced it already did, and the host leaves the notifier's verdict standing rather than writing a second one.

Two drafts have no ending behind them, and those the **host** labels awaiting-human when the script returns, because no notifier ever ran for them:

- a sub-lane that concluded **clean** and drafts on an unmet acceptance criterion alone — nothing ended, so nothing was written mid-script;
- a lane that **threw**, which takes failed rather than awaiting-human — a throw is a break, and it unwinds past the point a notifier fires from, which is the latency the event table's crash row records.

## Messages and comments

A message and a comment are different artifacts with different readers, and the split is the whole of what this section says: a **message** is one line someone triages from a phone, and **detail belongs on the issue**. What a message actually looks like is the next section's, stated there once.

**At most one comment of each kind per lane** — one plan comment after planning, and, if anything in the lane ends, one ending comment. Each is an extremely concise summary plus open questions, never a transcript: the plan file already survives on disk at tens of kilobytes, and no agent ever reads the comment (the writer and the reviewer both take the plan from disk), so inlining it buries the thread to serve nobody. The ending comment is the *last* one its lane posts, whatever the conclusion goes on to push or open. A run refused at intake posts one comment per issue and nothing else — it began no lane, and no label of any role is written for one.

## Message format — stated once, here

Every message is composed freshly by whoever writes it, so without a stated shape they drift between runs and cannot be scanned or filtered. The shape is fixed here and nowhere else.

**Five state tokens, partitioned across the message events** in the table above, so that no message ever carries two axes at once. The partition matters rather than being tidiness: an ended sub-lane opens a *draft* pull request, so a single enum spanning endings and pull-request states would force one token to say both.

| Message | Writer | Tokens |
|---|---|---|
| refusal | host, at intake | `failed` |
| started | host, at intake | `start` |
| ending | notifier, mid-lane | `halt`, `failed` |
| completion | host, after the phase script | `draft`, `ready` |

The two ending tokens are `acts/act-3.md`'s two ending labels in lower case, so there is no second vocabulary to keep in step with it. `failed` is the one token with two writers, and that is the axis holding rather than leaking: a break is a break whether a phase script hit it or the run never got past intake, and inventing a sixth token would split one question — *is this worth retrying?* — across two vocabularies.

**The shape is the issue number, the state token, the reason where one exists, then the link** — the pull request link where a pull request exists, the issue link otherwise:

```
#105 start: <issue link>

#105 halt: still CHANGES_REQUESTED after 2 fix cycles — 3 findings open
<issue link>

#105 draft: 2 findings open, suite green
<pr link>

#105 ready:
<pr link>
```

**The reason stays.** Triage from a phone is that line's whole purpose, and a message carrying only a state and a link would mean opening the tracker to learn anything at all.

**A lane with one sub-lane — the common case — emits the single-line shape exactly.** A lane with several emits one line per sub-lane under a shared header naming the issue once: the state and the link are per sub-lane, and such a lane has no single one of either. A refusal is that header applied to the run rather than to a lane — its state and reason once, then one line per issue the run was asked to work, that run having no single issue and no lane at all.

**No message carries the run handle**, per the section below.

**The four closing tokens are exhaustive**, which is what makes *Ordering and durability*'s one-closing-message-per-lane property readable by inspection: a `start` with no `halt`, `failed`, `draft` or `ready` after it is a run that died. **That pairing is one-directional** — every `start` is closed, and a close with no `start` before it is a run that never began, which is what a refusal is.

**The wording is composed by the notifier and the host from this file.** Nothing asserts the finished string: the format is a specification concern, and the state-machine harness can check only that a writer was handed the inputs the format needs.

## The run handle

An unattended run left no way to read its own record. The resume command every ending carries re-derives from artifacts, which is correct and is not the same thing as being able to see what the reviewer actually said on cycle two — reconstructing that meant reading commit timestamps and inferring where one cycle ended and the next began.

So every unattended ending carries a **run handle**: the identifier that locates the run's own transcript. The host reads it from its environment once, at intake, and passes it into the phase scripts' arguments — the same class of fact as the skill directory and the agent namespace, both of which the host can see and a script cannot, and it needs no new principle, only one more argument.

**It is written in exactly two places**, each reaching a different reader:

| Where | Written by | Why there |
|---|---|---|
| the **ending comment** on the issue | the notifier, mid-lane — and the host for a lane that threw, where no notifier ever ran | the thread already explains the ending, so the handle sits with it |
| the **pull request body** of an ended sub-lane | the host, at the conclusion | the only copy that outlives the run |

**It is deliberately not carried in the message.** That line is one line for triage from a phone, and detail belongs on the issue. A handle in it would crowd out the reason, which is the thing the line exists to carry.

**Where the environment shows no identifier, the handle is omitted silently** — a missing line, never an error, never a question, and no lane's outcome changes. A teammate whose environment differs gets a shorter comment, not a broken run.

**It is a run handle and not a resume identifier**, and the distinction is load-bearing rather than pedantic: an unattended conclusion removes an ended sub-lane's worktree, so the state a session resume would restore is the state the conclusion just deleted. The resume command is unchanged and remains the resume mechanism. The handle sits beside it, for reading the record rather than continuing the work, and nothing anywhere calls it a resume identifier.

## Channel contract

The payload arrives on standard input and never enters a shell string: it is agent-generated free text, and a shell string is where free text becomes an injection. With the channel's configuration absent from the environment, the channel stays silent and does not error.

## Ordering and durability

- Labels are written before a single token is spent, so a crash still leaves the marker behind.
- Labels are crash-safe; messaging is best-effort. Neither costs tokens.
- **No notification failure changes the lane it is reporting.** A `gh` command that fails, a role with no label string, a label string naming a label the tracker does not have, an unreachable channel — each is reported and then let go. The lane's ending, its push, its pull request and its worktree are what they would have been had the write succeeded. A run whose reporting is broken still does the work; a run that stopped because its reporting broke would be strictly worse than one that never reported.
- Exactly one closing message per lane, so a start with no close plus a stale in-progress label reads as a dead run by inspection. **The rule binds in that direction only**: a refusal closes a run that claimed no lane, so it carries no `start` before it and no label behind it, and reading it as a dead run would be reading a run that never began.
- An unconfigured channel is silent, per the channel contract above — opting out is a supported state, not a fault.

## Recorded hazards

Properties of the surrounding environment, recorded here and solved nowhere in this file.

- **The in-progress role incidentally restores a claim marker.** A net win: a separate orchestration system refuses any issue wearing one, so the two get mutual exclusion for free. The hazard is that same system's orphan sweep, which strips claims with no run behind them and so could reclaim an issue this pipeline is actively working.
- **Two long-polling readers on one messaging bot steal each other's updates.** Outbound sending is safe concurrently, so this cannot collide with that system's daemon. Anything inbound — replying to a notification to trigger an action — clashes, needs a second bot, and is out of scope.
