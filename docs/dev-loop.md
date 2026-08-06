# `/dev-loop`

## What it does

`/dev-loop` takes GitHub issues and produces pull requests. It plans each issue, implements it commit
by commit, reviews the result, runs your suite against it, pushes, and opens the pull request — each
issue in its own git worktree, several issues at once, with two human gates.

It is an **orchestrator**. The skill itself never writes code, plans, reviews or debugs: it does
intake, gates, worktree provisioning and removal, push and pull requests, and delegates everything else
to a roster of agents that ship with the plugin. That division is the whole design. The orchestrator
stays cheap and stays in the main worktree; the expensive work happens in subagents with their own
context windows, in checkouts that cannot collide.

`/implement` in [`mattpocock/skills`](https://github.com/mattpocock/skills) is the skill this is
adjacent to, and the comparison is the fastest way to see the shape. `/implement` commits to the
branch you are on, one ticket at a time, in your checkout. `/dev-loop` owns worktrees, parallel lanes,
layering, gates and bounded loops — all of which `/implement` explicitly declines. If you want one
ticket built on the branch you are standing on, reach for `/implement`. If you want three issues
worked at once and three pull requests at the end, reach for this.

## The vocabulary you need first

Four words, and the rest of this page reads.

| Word | What it means |
|---|---|
| **lane** | one issue's run, end to end |
| **sub-lane** | one pull request's worth of a lane, when the plan splits an issue across several |
| **layer** | the **horizontal** set of sub-lanes that run concurrently, all based on branches that already hold their commits |
| **stack** | the **vertical** chain of branches each based on the one below, sitting on the trunk |

A layer is not a stack. Three independent lanes sharing a layer form no chain at all — which is why
one word cannot serve for both, and why "layer 2 runs after layer 1" reads correctly where "stack 2
runs after stack 1" would assert the opposite. `CONTEXT.md` carries the full glossary.

## When to reach for it

You invoke this by typing `/dev-loop`. It is not something an agent reaches for on its own, and
invoking it **is** your explicit opt-in to multi-agent orchestration — the skill will not stop to ask
whether it should run the phases you just asked for.

| The work is… | Reach for |
|---|---|
| One or more issues on the tracker, already specified | `/dev-loop 41 42 43` |
| The same, and you will not be at the keyboard | `/dev-loop auto 41 42 43` |
| One ticket, on the branch you are standing on | `/implement` |
| Not written down as an issue yet | `/to-spec` then `/to-tickets`, then come back |
| Already built, and you want it checked | `/code-review` |
| Merged work you want reaped | `/dev-loop-cleanup` |

## Prerequisites

**The Workflow tool.** `/dev-loop` dispatches every stage through it. A session without it is refused
at intake, told the setting — `"enableWorkflows": true` in `~/.claude/settings.json` — and told that a
**restart is required**, because tool availability is fixed at session start. You are asked once per
machine and the answer is persisted in that settings file; a persisted refusal is honoured without
asking again.

**The plugin, installed rather than linked.** `/plugin install ieuanign-skills@ieuanign` is what
installs the agent roster. `npx skills add` picks up the skills alone, and a lane with no roster has
nothing to dispatch.

**`gh`, authenticated.** Every `gh` command runs inside a checkout of your repository, so the
repository is inferred from the remote and never passed.

**Nothing else is required.** Everything the pipeline needs about *your* repository it either derives
at intake or asks you once and writes down. There is no configuration step to do first.

## What one run does

Six acts, in order.

1. **Act 0 — intake.** Parse the arguments, derive the facts, read the repository profile, check the
   gitignore preconditions, fetch the issues, refuse lanes whose blockers are open, work out what a
   resumed run already has, ask for anything the profile is missing, then label each surviving issue
   in-progress.
2. **Act 1 — Phase A.** One architect per issue, in parallel. Each produces a plan file and summary
   bullets, and comments those bullets on the issue.
3. **Gate 1 — plan approval.** Every lane presented at once: summary, plan path, open questions. This
   is where you edit a plan file before approving it, and where lanes that touch the same files get
   sorted into layers.
4. **Act 2 — provisioning.** A worktree per sub-lane of the current layer, plus the gitignored files
   your `.worktreeinclude` names, plus your Setup command.
5. **Act 3 — Phase B.** Per lane: a writer per plan commit, a debugger when one fails, a reviewer over
   the sub-lane's range, fix cycles, then your full suite. Every loop bounded.
6. **Gate 2 — push and pull request.** Per layer, per sub-lane: push, open the pull request, remove
   the worktree, close the lane. Then, once per batch, record the stack on GitHub.

An unattended run adds a seventh: **Act 4**, a per-lane cost log under `.scratch/dev-loop-cost/`.

## Run shapes

### One lane

`/dev-loop 42`. One architect, one plan, one worktree, one branch, one pull request. One layer, and
therefore exactly one Gate 2. This is the shape everything else is a variation on.

### Parallel lanes

`/dev-loop 41 42 43`. Three architects at once, three worktrees, three branches, three pull requests,
all based on the trunk and all in layer 1. They finish together, because a layer's Gate 2 fires when
the layer ends — so the first lane to finish waits for the slowest. That is
[an accepted cost](./adr/0007-per-commit-push-is-not-implementable.md), not a bug.

Gate 1 is **one** interruption for the whole batch, not one per lane.

### Stacked lanes

Also `/dev-loop 41 42 43` — you do not ask for a stack, Gate 1 works out that you need one. Two things
put a lane in a layer above the bottom:

- **a real dependency** — B consumes what A creates. The pipeline posts a discovered-blocker comment
  on B's issue and asks you whether to stack B on A or defer it out of the batch.
- **a same-region co-touch** — both lanes edit the same region of the same file. B drops a layer too,
  and the pipeline says plainly that it was *sequenced to avoid a textual conflict, not because one
  lane needs the other*. No comment is posted, because there is no dependency to record.

Layer 2 is provisioned only after layer 1's Gate 2, from the completed branches. Each pull request is
based on the branch below it, and at the batch's last Gate 2 the chain is recorded on GitHub as a
stack — where the extension for that is installed. Where it is not, nothing fails and nothing prompts;
the bases are still chained and the body still carries the stacked note.

### A split issue

Some issues are one issue and several pull requests. The architect decides that in the plan's
`Commit / PR breakdown`, and the lane splits into **sub-lanes** — sequential, in the plan's order, each
its own branch, worktree, review, suite run and pull request.

Two things follow that surprise people:

- **A sub-lane whose code depends on the previous one waits for the next layer.** Provisioning it
  earlier would capture a base with zero feature commits.
- **Each sub-lane is judged only on the acceptance criteria it owns.** The plan states which; anything
  the plan left unlisted falls to the last sub-lane in plan order. The last sub-lane's pull request
  additionally carries a whole-issue roll-up, so whoever merges the top of a chain can see whether the
  issue as a whole was delivered. [ADR-0003](./adr/0003-criterion-ownership.md) is why.

### An unattended run

`/dev-loop auto 41 42 43`. `auto` leads, because the word deciding whether you will ever be asked for
approval should be the second one you type.

**Suppression removes the questions, not the work.** Every step of both gates still runs; each question
resolves to its unattended answer. Lanes with a `READY` plan proceed; a dependent lane is stacked
rather than deferred; each sub-lane pushes and opens the pull request its terminal state names — ready,
draft, or none.

Three things an unattended run does that a supervised one does not: it writes workflow labels and
issue comments as it goes, it sends a one-line message per lane at start and close, and it writes the
cost log. All three are reporting; none of them changes what a lane does.

**An unattended run ends with only the main worktree remaining**, unless a removal was refused or a
push failed. A supervised run additionally keeps every worktree its human was offered and did not take.

### A resumed run

`/dev-loop 42` again. There are no state files — the pipeline re-derives the stage from artifacts:

- a plan file with `Status: READY` skips Phase A;
- plan commits already in the branch's git log are done, and a sub-lane whose commits are all present
  resumes by re-running the review, which is safe and idempotent;
- a worktree that already exists is reused as-is; a branch without a worktree is reattached.

This is also the answer to "the session died". Type the same command again.

### Cleanup

`/dev-loop-cleanup` is its own skill, so reaping does not load the pipeline. It reaps what has an exact
done-signal — the local branch and the plan file, once the pull request is **merged** — and **lists**
what does not. It removes no worktree. It is safe to run at
any time, including while another batch is mid-layer, and that property is deliberate: a worktree still
standing is one nothing proved done, and a merge tells you nothing about whether the run holding that
checkout has finished with it.

## Configuration

There is one rule, and it decides where a new value goes without a debate:

> **Varies per run → argument. Varies per repository → profile. Does not vary → constant.**

Your repository's own answers live in `docs/agents/dev-loop.md`, written by the pipeline itself under
**ask-then-persist**: the first time a run genuinely needs a value it asks once, writes the answer
down, and never asks again. A persisted `none` counts as an answer. A repository with no profile at
all runs on pure defaults — the interview is a convenience, not a precondition.

**What the rule refuses**, so it does not creep back:

- **No per-repository effort tiers.** Cost behaviour stays predictable across repositories; a tier is
  a phase-script constant or it is nothing.
- **No per-run overrides of gates, stages, or cost behaviour.** The run mode is the only argument that
  changes pipeline behaviour.
- **The cost reporting target stays a constant** — it was measured as a single median across
  repositories, with no evidence it varies by one.

Each refusal is a cheap promotion from constant to profile key if a repository ever actually needs
one. That cheapness is the reason to refuse now rather than pre-empt. These are **homes, not an
inventory**: a value the pipeline does not have yet still has its home decided, which is the point of
a rule over a list.

Everything that makes `/dev-loop` fit *your* repository better is covered in
[improving-dev-loop.md](./improving-dev-loop.md).

## Common questions

**It appended `.claude/worktrees/` to my `.gitignore`, and the line was already there.**

It should not, and does not: the remedy reads the file first and skips an append where the exact line
is present. What it *does* do is probe **a path underneath** the directory rather than the directory
itself — `git check-ignore -q .claude/worktrees/probe`, never `.claude/worktrees`. `git check-ignore`
cannot classify a bare path as a directory unless that directory exists on disk, so a trailing-slash
pattern reports a correctly-configured repository as *unignored* right up until the first run creates
the directory — which is exactly when the check runs. A child answers the same question without
needing the classification: everything under an ignored directory is ignored, so the probe agrees with
the entry however it is written, and the probe path need not exist.

**A lane opened a draft pull request and I do not know why.**

Look at the top of the body. A draft carries a **Why this is a draft** line per trigger that fired, and
there are exactly four: open reviewer findings after the fix-cycle bound, a red suite at the gate's
ceiling, an acceptance criterion the sub-lane owns that is `partial` or `not-met`, or the sub-lane
ending mid-pipeline. The sections below it carry the detail. A draft is the honest signal that the
pipeline could not finish its own job.

**A lane finished and its issue still shows unticked checkboxes.**

Expected. The pipeline is **append-only** on anything a human authored: it comments, it adds and
removes its own workflow labels, and it sets state only on artifacts it created. It never edits an
issue body and never ticks a checkbox. The per-criterion verdicts are *reported* — in the pull request
body and in the lane's conclusion — because the closing keyword closes the issue on merge anyway, and
an issue body is the one artifact in the pipeline a human wrote by hand.

**Why does planning look so expensive in the cost log?**

Because it is: planning is roughly three tenths of a lane, and it lands in a **different transcript
directory** from execution's. A cost report that missed it would understate a lane by a third, which is
why the run keeps every transcript directory it touches — planning, every layer, and any Gate 1 re-run
of a blocked lane's architect.

**Can I set a token budget per lane?**

No, and this is deliberate rather than unbuilt. **Token spend is reported and enforced nowhere.**
[ADR-0005](./adr/0005-no-token-ceiling.md) records the four reasons a ceiling could not work and the
load-bearing reason it was unnecessary: a lane is already bounded from five directions, and the most
expensive lane in the measured set was not stuck — it was thirteen commits of genuine work against a
median of three. A ceiling would not have caught a runaway; it would have refused a big issue.

**The suite gate says `not run`.**

That is a state of its own and is never reported as passed. Either your profile's Full-suite command
is `none` — a real, persisted answer for a repository whose suite needs infrastructure the pipeline
does not stand up — or the gate found the command unrunnable. Either way the pull request body says
so, rather than showing an empty result that reads as green.

**A sub-lane ended and its worktree is still there.**

Under `gated` that is the design: you are here, and you are expected to pick that branch up in that
checkout. Under `unattended` it means one of two things — the push did not succeed, or
`git worktree remove` refused. A refusal means work was left behind, and the refusal **is** the
dirty-work guard: the pipeline never passes `--force`, so it can never talk its way past one. The run
reports `git status --porcelain` verbatim so you can see what.

**My session died mid-run. Is there a watchdog?**

No, deliberately. When the session stops — a rate limit, a closed terminal, a sleeping machine — no
code runs, so nothing is caught, and only what already reached GitHub survives. That is why the
in-progress label is written **before a single token is spent**: a start with no close, plus an issue
still wearing in-progress, reads as a dead run by inspection. You typed the command and can see your
own terminal; a watchdog is out of scope.

**Two lanes touched the same file and I got a merge conflict anyway.**

Possible, and bounded. The pipeline sorts overlaps into three outcomes and only serialises two of
them; an additive co-touch stays parallel and accepts the trivial rebase, because serialising it would
cost a whole layer of wall-clock. If a same-region overlap was read as additive, the conflict lands on
whoever merges — exactly where it lands today. You can move that line for your repository, in the
**Overlapping changes** section of `.claude/rules/pr-separation.md`.

## It's working if

- Gate 1 arrives **once** for the whole batch, with every lane's summary and plan path in it — not
  once per issue.
- The plan files exist on disk under `.scratch/`, at tens of kilobytes, and the issue comment carries
  the summary bullets and the path rather than the plan itself.
- Each lane's worktree appears under `.claude/worktrees/` while it runs, and is gone once its pull
  request opens.
- Every pull request body carries a Suite line that says `passed`, `failed` with identifiers, or
  `not run` with a reason — never a blank.
- A batch that stacked shows its pull requests chained by base, and each body carries the stacked note
  whether or not the stack extension is installed.
- An ended sub-lane's report names its label, its stage, the verbatim contract lines that produced it,
  its attempt log in order, and `/dev-loop <n>` as the resume command.
- Nothing in the run ever force-pushes, converts a pull request it did not open, or edits an issue
  body.
