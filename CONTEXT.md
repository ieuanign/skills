# CONTEXT

Domain glossary for this repository. Terms only — no implementation detail.

## Skill

A folder under `skills/` containing a `SKILL.md` (plus optional supporting files). The unit `npx skills add` installs. Each `SKILL.md` is a prompt-driven instruction set the agent follows; it is not code.

## Add-on layer

This repo is **not** self-contained. It ships only skills that are original to Ieuan and declares [`mattpocock/skills`](https://github.com/mattpocock/skills) as a plugin dependency, so installing this one pulls Matt's in. The skills here reference Matt's (`/tdd`, `/code-review`, `/to-spec`, `/to-tickets`, the issue-tracker setup) rather than duplicating them.

## dev-loop

The issue-to-PR pipeline. An **orchestrator** skill that stays in the main worktree and delegates all planning, coding, reviewing, and debugging to the **agent roster**; it owns intake, human gates, worktree provisioning, push, and PRs. Repo- and machine-agnostic: it hardcodes no repository fact.

## Layer

The **horizontal** unit of `/dev-loop`'s ordering: the set of sub-lanes that run concurrently, every one of them based on a branch that already holds its commits. Layer 1 sits directly on the trunk; a sub-lane based on a branch that gets its commits in layer N runs in layer N+1. A batch with no stacking is a single layer.

A layer is not a stack. Three independent lanes sharing a layer form no chain at all — which is why one word cannot serve for both, and why "layer 2 runs after layer 1" reads correctly where "stack 2 runs after stack 1" would assert the opposite. (Unrelated to **Add-on layer** above, which is about what this repo builds on.)

## Stack

The **vertical** unit: a chain of branches each based on the one below. Its **trunk** is the branch underneath the whole chain — the repository's default branch. Its **bottom** is the layer sitting directly on that trunk, its **top** the layer nothing is based on. The vocabulary is the tool's own (`gh stack`), adopted so that someone reading this pipeline and someone reading `gh stack --help` are speaking one language.

A stack asserts dependency: the layer above needs what the layer below creates. Two lanes that merely touch the same file are not a stack, whatever ordering they end up in.

## Fix cycle

One round of `/dev-loop`'s review loop: a reviewer verdict, the writer applying its findings, and the
re-review that judges the result. The unit the review loop's bound counts.

Not the per-commit implement loop's unit, which is a **debug+fix attempt** — a debugger diagnosis plus
one writer call, bounded separately and differently.

## Ending label

The single word every `/dev-loop` ending carries — `HALT` or `FAILED` — selected by one question: did
something deliberately stop, or did something break? It decides nothing. What an ending *produces* is
decided by the conclusion mode and the terminal-state table, neither of which reads it.

`FAILED` is narrower than "bad": it answers only *is this worth retrying?*, which is why a transient
break takes it and a reasoned refusal does not.

_Avoid_: status, terminal category, severity.

## Attempt reason

Why one attempt inside a bounded loop failed — a failing test identifier, a reviewer finding, a
debugger's root cause. It recurs, so it can be compared across rounds and counted.

Distinct from an **ending label**, which is terminal and names nothing about the cause. "The halted
reason" collapses the two and is the phrase this vocabulary exists to replace.

## Progress-sensitive bound

A loop bound that advances only on a round bringing nothing previously unseen, resets when one does,
and sits under a hard ceiling that applies regardless. It ends a loop that is stuck rather than one
that is merely slow.

The suite gate and the review loop have one; the per-commit implement loop deliberately does not,
because its give-up clause must know in advance which attempt is the last.

_Avoid_: max retries, retry limit — both name a flat count, which is the thing this replaces.

## Finding identity

What makes two reviewer findings the same finding: the file and the defect clause, normalised, with
the line number dropped as the volatile part. Deliberately conservative — it declares sameness only
on near-repetition, because sameness is what ends the review loop early.

Its counterpart in the suite gate is free: a test runner supplies stable identifiers, where a
reviewer supplies prose.

## Criterion ownership

Which sub-lane an acceptance criterion belongs to: the one whose pull request delivers it, named on
that pull request's entry in the plan's Commit / PR breakdown. A fact the architect states and the
host applies — never a judgement the reviewer makes, which holds one range and the whole issue and so
cannot tell work that is missing from work that is not yet due.

A criterion the plan left unassigned **falls to the last sub-lane in plan order** — last in the plan,
never the top of the stack, since a lane's sub-lanes are sequential but not necessarily stacked. A
single-pull-request plan names nothing and owns everything by that default, which is why it carries
none of this.

_Avoid_: criterion scope — **scope** already names the sub-lane's own diff range, which is the other
half of what a reviewer is told and the half it never has to decide.

## Run handle

The identifier that locates a finished run's own transcript, carried on the ending comment and in the
pull request body so a run that nobody watched can still be read afterwards.

Not a way to resume anything. An unattended run removes its worktrees as it concludes, so the state a
session resume would restore is the state the conclusion just deleted; `/dev-loop <n>` re-derives from
artifacts and is the resume mechanism.

_Avoid_: session resume id, run id.

## Agent roster

The five subagents this plugin ships from `agents/` at its root: `architecture-engineer`, `code-writer`, `reviewer`, `debugger`, and `notifier`. They install with the plugin and are dispatched by name; nothing is copied into the consuming repo. The first four are dispatched by the orchestrator or a phase script for the work they do; `notifier` alone is dispatched only from inside a running phase script, and only under an unattended run, because that is the one moment the orchestrator has no shell.

## Discovery cost

What a skill costs a session that never invokes it: its `name` and `description`, loaded from every
installed skill so the model can decide whether to reach for one. Paid in every session on the machine,
which is what makes a skill's description its most expensive line.

_Avoid_: install cost, overhead.

## Host load

What the orchestrator carries for a whole run: the files it loads into its own context, measured with
`wc -c` over exactly those files. `SKILL.md` is the whole of it — a file the orchestrator does not load
is not host load however normative it is, which is why relocating a rule to `docs/` or to an agent
definition reduces it and rewriting a rule in place does not.

_Avoid_: skill size, context cost.

## Agent load

What one dispatched subagent carries: its own definition, plus whatever its prompt hands it. Paid once
per dispatch rather than once per run, and paid by the subagent's context rather than the
orchestrator's — so moving a rule from host load to agent load is free to the run that never dispatches
that agent.

_Avoid_: prompt size.

## Run spend

The tokens a run actually consumes end to end, across the orchestrator and every agent it dispatches,
reported per lane by the cost log. The only one of these four measured after the fact rather than
before; the other three are properties of the files, and this one is a property of the run.

_Avoid_: **cost** or **token count** used bare as a synonym for this — both are ambiguous across the
four terms above. Compounds are not this rule's target: **discovery cost** is one of the four, and the
**cost log**, the **cost report** and the **cost reporting target** name the artefacts that measure run
spend rather than the quantity itself.

## Smell override

A recorded exception to the smell baseline: a pattern this repository uses deliberately that would otherwise be reported as a code smell. Overrides live in `docs/agents/smell-overrides.md`, read by the `reviewer` agent and the code-review Standards axis. They are written from findings a human rejected, never distilled from `CLAUDE.md` — a repository where nothing has recurred yet correctly has no file at all.

Coding standards themselves are not this. They bind whether or not this plugin is installed, so they live in `CLAUDE.md` and `.claude/rules/`, per [ADR-0001](./docs/adr/0001-config-boundary.md).
