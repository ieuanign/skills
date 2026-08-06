---
name: dev-loop
description: Issue-to-PR pipeline — plans, implements and reviews GitHub issues, each in its own git worktree, with gates at plan approval and push/PR. Use for `/dev-loop <issues>`, or `/dev-loop auto` for an unattended run.
---

# /dev-loop — issue-to-PR pipeline

You are the orchestrator. You stay in the MAIN worktree; the agents plan, write, review and debug (architecture-engineer, code-writer, reviewer, debugger). Yours: intake, gates, worktree provisioning and removal, push, PRs — and, under `unattended`, the notifications at your own boundaries. The fifth roster agent, the **notifier**, is dispatched by `phase-execute.js` mid-script for a lane that ends, never by you: the mid-lane endings are its writes, against its own specification, and the three ⟨notify⟩ boundaries below are yours. All agent returns are machine-readable — trust the contract keys (`STATUS/RESULT/VERDICT/OWNER`). The phase scripts enforce the pipeline's state machine — every cycle cap, route and ending — and you re-enforce none of it.

## Arguments

`/dev-loop [auto] <issues> [project:<slug>]`

- `auto` — optional leading token: run the batch **unattended**, from filed issue to pushed PR, without stopping for approval.
- `<issues>` — one or more GitHub issue numbers, comma or space separated. One issue = one lane; several = parallel lanes.
- `project:<slug>` — optional project slug passed to the architect for the plan path.
- Tidying up after a run is its own skill, **`/dev-loop-cleanup`** — `/dev-loop cleanup` goes there.

### Run mode — `gated` or `unattended`

`auto` present ⇒ **unattended**; absent ⇒ **gated**. Act 0 parses it ONCE and carries it as a single value for the whole run — no later stage re-derives it from the arguments. In this file it decides exactly three things:

> **Gate suppression.** Both gates raise their questions under `gated`, and neither raises any under `unattended`.

> **Notifications.** Under `unattended` you emit your three events, at the boundaries marked **⟨notify⟩** below; under `gated`, none of them. Each ⟨notify⟩ boundary says *what* to run and never *whether*, and what each event says is stated at the boundary that writes it.

> **Cost log.** Under `unattended` you write Act 4's per-lane cost log; under `gated`, none. Act 4 says what to write and never whether, and the transcript directories it needs are captured under both modes.

These three lines are the only place any of it is decided: no argument and no profile key overrides them.

**Suppression removes the questions, not the work.** Every step of both gates still runs; each question resolves to its unattended answer instead:

| Question | Its unattended answer |
|---|---|
| Gate 1 — which lanes are approved? | every lane whose plan is `READY` proceeds |
| Gate 1 — a `BLOCKED` plan's open questions | nobody can answer them, so that lane does not proceed and is reported carrying them |
| Gate 1 — stack a dependent lane, or defer it? | **stack B on A** — the option this gate already marks recommended. Defer is a human's "not this batch" and has no unattended meaning; taking it would return less work than was asked for |
| Gate 2 — is the push/PR approved? | the sub-lane pushes and opens the PR its `terminal` names — ready, draft, or none |
| Gate 2 — open a draft PR for a sub-lane that ended? | yes, `--draft` — an ended sub-lane is never ready, and work that exists stays reviewable |
| Gate 2 — arbitrate a contested finding | nobody rules, so the ledger's **arbitrated** category stays empty and the finding rides out to the PR body |
| Between layers — authorize the next layer? | it proceeds |

A gate's `PushNotification` goes with its question, so under `unattended` there is none. What an unattended run emits instead is the three ⟨notify⟩ events below.

### How you write a ⟨notify⟩ event

You write three events — lane start, plan comment, lane conclusion — and this section is the whole of what they are. The mid-lane endings are the **notifier's**, written from inside the phase script against a specification you never load and never restate.

**The message shape** is the issue number, a state token, the reason where one exists, then the link — the pull request link where one exists, the issue link otherwise. Your tokens are `start` at intake and `draft` or `ready` at the conclusion:

```
#105 start: <issue link>

#105 draft: 2 findings open, suite green
<pr link>

#105 ready:
<pr link>
```

**The reason stays**, and **no message carries the run handle.** A lane with one sub-lane emits the single-line shape exactly; a lane with several emits one line per sub-lane under a shared header naming the issue once, having no single state or link of its own.

**No notification failure changes the lane it reports.** A `gh` command that fails, a role the repository has no label string for, an unreachable channel — each is reported and then let go.

The commands:

- **A label is `gh issue edit <n> --add-label/--remove-label`.** Resolve its three roles to strings ONCE at Act 0, through the repo's own `docs/agents/triage-labels.md`, per that file's roles-never-strings rule. No label string is ever written into this skill.
- **A comment is `gh issue comment <n> --body-file -`**, with the body piped in from a **quoted** heredoc (`<<'BODY'`), whatever the body carries.
- **A message is `<this-skill-dir>/notify.sh <<'MSG' … MSG`**, which reads its payload on standard input the same way. It implements the specification's channel contract, so an unconfigured channel is already handled inside it: it needs no check, no question and no profile key.

Touchpoint intersection, sub-lane splitting, the profile's Constraints, the push and the PR itself are gate *work*, and happen identically under both modes. The one-time ask-then-persist preconditions are not gates and fire under both — including Act 0's step 9, which owns the two profile keys Phase B needs. What a sub-lane's *ending* means for its PR's state — ready, draft, or none — is the phase script's **terminal-state table**, which it has already applied: every sub-lane result carries a `terminal` of `{pr, push, reasons}`, so under `unattended` you open what it names rather than deciding it here.

## Derived facts (compute once at Act 0 — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **REPO** — `basename` of MAIN.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`. Every lane worktree lives here; the directory slug is the branch name after its first `/` (`feat/208` → `<WORKTREES>/208`).
- **GitHub repo** — every `gh` command runs inside a checkout of this repo (worktrees included) and gh infers the repository from the remote, so no `gh` command carries `--repo`.
- **RUN HANDLE** — the identifier that locates this run's own transcript, read once from your environment: `$CLAUDE_CODE_SESSION_ID`. Unset or empty ⇒ **there is no handle**: carry the empty string, write no line for it anywhere, ask nothing, and change nothing else about the run. It is written in exactly two places — the ending comment on the issue, and the pull request body of an ended sub-lane — and never in a message. It is a **run handle, never a resume identifier**: `/dev-loop <n>` re-deriving from artifacts remains the resume mechanism.
- **Fast copy** — macOS: `/bin/cp -Rc` (APFS clonefile, instant; MUST be `/bin/cp` — a GNU cp on PATH rejects `-c`); Linux: `cp -R --reflink=auto`; anywhere else: plain `cp -R`.

## Where configuration lives — a rule, not a list

Adding a value to this pipeline? The rule decides its home:

> **Varies per run → argument. Varies per repository → profile. Does not vary → constant.**

| Home | Values |
|---|---|
| **Argument** | the run mode, the issue list, the optional `project:<slug>` |
| **Repository profile** (ask-then-persist, below) | every key in **Repo profile** below — branch template, suite command, **fix cycles** |
| **Phase-script constant** | per-stage effort and model tiers, the per-commit debug-and-fix bound, the review loop's fix-cycle ceiling, the suite gate's two round bounds, the stage list each mode runs |
| **Skill constant** | gate suppression under `unattended` (stated once under Run mode above), the cost reporting target |

These are **homes, not an inventory**: a value this pipeline does not have yet still has its home decided here. **What the rule refuses**, so it does not creep back:

- **No per-repository effort tiers** — a tier is a phase-script constant or it is nothing.
- **No per-run overrides of gates, stages, or cost behaviour.** The run mode is the only argument that changes pipeline behaviour, and all it selects is the Lane conclusion branch.
- **The cost reporting target stays a constant.** Promote it if one repository's lanes prove consistently larger.

## Repo profile — `docs/agents/dev-loop.md` (ask-then-persist)

The per-repo config, read at Act 0. Optional: a repo without one runs on pure defaults. The rule for every non-derivable value: when a run first NEEDS it and the profile lacks it, AskUserQuestion ONCE, persist the answer into the profile (create the file if needed), and never ask again — a persisted "none" counts as an answer. Never store derivable facts there.

Profile keys:

- **Branch template** — default offered: `feat/{issue}`, sub-lanes `feat/{issue}-{area}`. Asked on the first run in a repo.
- **PR title format** — default: `<type>(<scope>): #<issue> - <title>`.
- **PR body template** — the shape this repository wants its pull request bodies in. Asked once, at the **first Gate 2**, under the same ask-then-persist rule as every key here; declined ⇒ the core elements alone, in the order Gate 2 lists them. Whatever shape it takes, **Gate 2's core elements must survive**.
- **Setup command** — what a cold checkout runs before its tests pass (e.g. `npm ci`). Asked at the first provisioning.
- **Full-suite command** — the ONE command that runs the repo's whole test suite from a provisioned worktree (e.g. `npm test`, or a compound command joining a backend and a frontend suite). Asked by **Act 0's step 9**, which is the only step that asks for it. `none` is a real answer, persisted like any other, and makes the gate report **not run**. Configuration, never discovery.
- **Fix cycles** — the review loop's **no-progress threshold**. A counter starts at 1 on the loop's first `CHANGES_REQUESTED` round, advances by one on every round that brings nothing previously unseen, and resets to 1 whenever a round brings something new; reaching this number ends the sub-lane with its findings open — so it is a position the counter reaches, not a count of tolerated rounds, and `2` ends the loop on the first round that repeats itself. Not a flat cap: a loop still surfacing new findings keeps going, under a hard ceiling the phase script holds. Default offered: `2`. Asked by **Act 0's step 9**, which is the only step that asks for it. `0` is a real answer, and spends no fix cycle at all.
- **Constraints** — free-form repo cautions (e.g. "backend tests share one database — never run two backend lanes concurrently"). Honor them when deciding lanes vs layers (Gate 1) and when provisioning (Act 2).

## Act 0 — Intake (before any agent runs)

1. Parse the arguments: a leading `auto` sets the **run mode** to `unattended`, its absence to `gated`; the rest are issue numbers and the optional `project:<slug>`. This is the ONLY place the run mode is derived — carry that one value from here.

   Then read the **agent namespace** off your own roster: find `code-writer` among your available agent types — listed bare, the namespace is the empty string; listed as `<prefix>:code-writer`, it is `<prefix>`. This is the ONLY place it is derived — carry that one value from here too, and take it from the roster rather than from a literal, a path, a package name or a manifest.
2. **The pipeline requires the Workflow tool.** Every stage is dispatched through it, so a session without it in your toolset → refuse the run here, whatever the run mode, before a single agent is dispatched and before this Act asks the user anything else. Tell them the setting, `"enableWorkflows": true` in the per-machine settings file (`~/.claude/settings.json`), and that a **restart is required**. Asked once, then never again on this machine, with the settings file itself as the persistence:

   - key **absent** → AskUserQuestion once. Yes → write `"enableWorkflows": true` into that file (create it if missing; preserve every other key). No → write `"enableWorkflows": false`, which is a real answer and is why the question does not return.
   - key **present** → do not ask. `true` means the setting is already made and the session predates it: say so and say to restart. `false` means they declined: name the file and the key so they can change their mind.

   Either way this run stops. This is per-machine, so it persists to the per-machine settings and never to the repo profile or a setup skill.
3. Compute the Derived facts and read the repo profile (first run in a repo: ask-then-persist the branch template).
4. Worktree preconditions:
   - Both gitignore checks **probe a path underneath the directory, never the directory itself**; everything under an ignored directory is ignored, and the probe path need not exist.
   - `.claude/worktrees` not gitignored (`git check-ignore -q .claude/worktrees/probe` fails) → append `.claude/worktrees/` to `.gitignore` and tell the user.
   - `.scratch` not gitignored (`git check-ignore -q .scratch/probe` fails) → append `.scratch/` to `.gitignore` and tell the user; plans live there.
   - **Neither remedy appends a line `.gitignore` already carries** — read the file first, and where the exact line is present skip the append and report nothing.
   - `.worktreeinclude` missing — the repo-root file naming which gitignored files worktrees need (gitignore syntax) → ask-then-persist, the file itself being the persistence: offer candidates from `git ls-files -oi --exclude-standard --directory`, write the selection as a tracked file. "None" writes a comment-only file, which counts as answered. Offer only what a cold checkout cannot run without — env files and local config. Dependencies belong to the Setup command.
   - `.worktreeinclude`'s LAST line must be `!.claude/worktrees/**` — append or move it there (gitignore matching is last-match-wins). It keeps every copy mechanism — Act 2 and Claude Code's native worktrees alike — from cloning existing worktrees into a new one.
5. `git fetch origin <DEFAULT>` once.
6. Per issue: `gh issue view <n> --json number,title,body,state,labels`. CLOSED → drop the lane, tell the user. KEEP the body: Phase B hands it to the reviewer as its Spec axis, and nothing downstream fetches it again.
7. Parse each body's "Blocked by" section: a blocker that is still open and NOT in this batch → refuse that lane (report why); a blocker inside the batch → record the ordering (it becomes a stacked lane at Gate 1).
8. Stateless resume check per issue — derive the stage from artifacts, never from memory:
   - Plan file exists with `Status: READY` → skip Phase A for that lane (offer replan if the user asks).
   - Plan commit messages already in `git log` of the lane's branch → those commits are done. A sub-lane whose commits are all present resumes by re-running the review.
   - A worktree already exists for the branch → reuse it as-is.
9. **Phase B's two profile keys — the ONE place either is asked.** This step owns both asks, and nowhere else in this file asks for either.

   **Skip the whole step unless this run will reach Phase B** — no lane survived steps 6–8, and nothing is asked. Then, per key, **skip a key the profile already carries**: a persisted value is an answer and is never revisited, and `none` and `0` are persisted answers like any other, so a repository is asked at most once ever.

   It is **not a gate**: gate suppression does not touch it and it fires under both run modes.

   - **Full-suite command** — AskUserQuestion: the ONE command that runs this repository's whole test suite from a provisioned worktree. Offer plausible options and let them choose; never persist a command you discovered and nobody confirmed — **configuration, never discovery**. Offer **`none`** as a real option, which makes every sub-lane's suite report **not run**. Declined ⇒ persist `none`, and say so.
   - **Fix cycles** — AskUserQuestion: **how tolerant this repository is of a review loop that repeats itself.** State the **Fix cycles** arithmetic above rather than a phrase that rounds it off, and say what it is *not*: not a cap on cycles — a loop still surfacing new findings keeps going, under a hard ceiling the phase script holds. Offer **`2`** (the default — the loop ends on the first round that repeats itself), a higher value, and **`0`**, which spends no fix cycle at all: the first `CHANGES_REQUESTED` ends the sub-lane and a human reads every finding. Declined ⇒ the default `2` applies and is persisted.

   Persist each answer into the repo profile (`docs/agents/dev-loop.md`), creating the file if it does not exist, per the ask-then-persist rule above. Act 3 passes both values into the phase scripts.

10. **⟨notify⟩ Lane start.** For every lane that survived steps 6–8 — so a dropped or refused lane is never marked as being worked — add the in-progress label and send the started message, per lane. This is the LAST step of Act 0.

## Act 1 — Phase A: plans

Run the Workflow tool with `scriptPath: <this-skill-dir>/phase-plan.js` and `args: { issues: [{number, title, project, answers?}], agentNamespace }` — `agentNamespace` is the value Act 0 read off your roster, passed verbatim (the empty string when the roster lists the roles bare). One architect per issue, parallel. Each returns `{status, planPath, summary, openQuestions}`. A lane returning `status: DIED` means its architect came back with nothing usable — report it at Gate 1 and offer a re-run. Every such report says the stage **returned nothing — it was skipped, or it died after the runner's retries**, and never picks one.

**KEEP the transcript directory this invocation reports**, alongside every later one, **including any re-run**: Act 4 feeds them all to the cost report.

KEEP each lane's `summary` bullets for the rest of the run. Gate 2 puts them in the PR body's Context section — so they must survive whether or not Gate 1 fires, and are not consumed by presenting them there.

**⟨notify⟩ Plan comment.** Per lane, comment the plan's summary bullets and the architect's open questions on the issue. **Never the plan file** — pass `planPath` instead. On the clean path this is the lane's one comment; a lane that ends later gets one more, the notifier's, and no others.

## Gate 1 — plan approval (asks under `gated` only; ONE batch interruption; PushNotification first)

Present every lane: summary, plan path (invite the user to edit the file before approving), open questions. Then:

- **BLOCKED plans**: relay the open questions via AskUserQuestion, re-run only those lanes' architects with `answers` filled in, re-present.
- **Touchpoint overlap**: intersect the plans' File touchpoints across lanes yourself. **The classification is your own work, in plain reading, and no agent is dispatched to do it.** Sort each overlap into exactly one of three outcomes:

  | Outcome | What it is | Layer | Based on | Dependency claimed |
  |---|---|---|---|---|
  | **additive co-touch** | both lanes append to the same registry, route table or barrel file, at different places in it | same layer — both stay parallel | the trunk | no |
  | **same-region co-touch** | both lanes edit the same *region* of the same file | the later lane drops to the next layer | the earlier lane's branch | **no** |
  | **real dependency** | B consumes what A creates | B drops to the next layer | A's branch | **yes** |

  **Additive co-touch stays parallel and accepts the rebase.**

  **The last two outcomes are physically identical** — same layer drop, same base — **and differ only in what they claim:**

  - **real dependency** — post the discovery back to the dependent GitHub issue: `gh issue comment <B> --body "Discovered blocker: depends on #<A> — overlapping files: ..."`. **Unconditionally, and before the remedy is chosen**, so a deferred lane still leaves with its blocker documented. Then AskUserQuestion per case, with **"stack B on A's branch" as the first/recommended option** and "defer B out of this batch" as the alternative.
  - **same-region co-touch** — post nothing and ask nothing, and say plainly in this gate's presentation that it was *sequenced to avoid a textual conflict, not because one lane needs the other*.

  **The line between the first two outcomes is the repository's to move, and only that line.** It declares which in the **Overlapping changes** section of its `.claude/rules/pr-separation.md` — project rules load at launch, so read it off your own context rather than fetching the file:

  | Declared | Where the line sits |
  |---|---|
  | `additive` (the default, and what an absent declaration means) | co-touch at different places in a file stays in one layer; same-region drops a layer |
  | `strict` | any co-touch at all drops a layer, without classifying the region |
  | `parallel` | no co-touch drops a layer; the conflict is left for whoever merges |

  **A real dependency is never declarable and never moves.** B consuming what A creates puts B in the next layer whatever the repository says. A declaration that reads as covering it covers the first two outcomes only: it changes which outcome an overlap sorts into, never who does the sorting.

  Under `unattended` the classification is unchanged. Only outcome 3's question is suppressed, resolving to its recommended answer per the table above; the comment is a machine action and is posted the same either way.
- **Profile Constraints**: apply them now — lanes a constraint forbids from running concurrently go into separate layers (or one is deferred), and say so.
- **Multi-PR plans**: the lane splits into sub-lanes, sequential, in the plan's order (e.g. migration → backend → frontend). First sub-lane branch from the branch template, later ones with the `-<area>` suffix, each based on the previous sub-lane's branch when the plan says the code depends on it, else `origin/<DEFAULT>`.

Only lanes the user approves proceed. Drop the rest with a note.

## Act 2 — Provisioning (you, plain Bash — no agents)

Layer logic: **anything based on the trunk (`origin/<DEFAULT>`) runs in layer 1; anything based on a branch that gets its commits in layer N runs in layer N+1** — this applies to stacked _lanes_ AND to dependent _sub-lanes_ within one lane, so a frontend sub-lane based on its own backend sub-lane's branch waits for the next layer. Provision a layer only after its bases completed the previous layer. For each sub-lane in the current layer:

1. `git worktree add <WORKTREES>/<slug> -b <branch> <base>`. Base is `origin/<DEFAULT>` or the stack/sub-lane base branch. On resume: an existing worktree is reused as-is; an existing branch WITHOUT a worktree reattaches with `git worktree add <WORKTREES>/<slug> <branch>` (no `-b` — the `-b` form errors on an existing branch).
2. `.worktreeinclude` copies: `git -C <MAIN> ls-files -oi --exclude-from=.worktreeinclude --directory` lists the matches (files, plus fully-ignored dirs collapsed to one entry). Fast-copy each from MAIN into the worktree at the same relative path, creating parent directories — but STRIP the trailing slash git puts on directory entries first. Worktree contents never appear in the list — the `!.claude/worktrees/**` line Act 0 guarantees excludes them.
3. Run the profile's Setup command from inside the worktree.

## Act 3 — Phase B: execute

Per layer, run the Workflow tool with `scriptPath: <this-skill-dir>/phase-execute.js` and `args: { lanes, mode, fixCycleThreshold, suiteCommand, skillDir, agentNamespace, runHandle }`, and nothing else. `skillDir` is `<this-skill-dir>` as an ABSOLUTE path: the notifier it dispatches needs `notify.sh`, the send mechanism, and its own specification `notifications.md` by path; omit it and no notifier is dispatched. `agentNamespace` is the value Act 0 read off your roster, passed verbatim (the empty string when the roster lists the roles bare) — omit it where the roster IS namespaced and every dispatch in the phase fails. `mode` is the run mode Act 0 parsed — literally `gated` or `unattended`, never the `auto` token the developer typed; `fixCycleThreshold` is the profile's **Fix cycles** key — the review loop's **no-progress threshold**, not a flat cap; the loop's hard ceiling is a phase-script constant and is not passed — and `suiteCommand` is its **Full-suite command**, both answered at Act 0's step 9 and passed verbatim — never a literal here, and a `none` or omitted `suiteCommand` makes every sub-lane's suite **not run**. `runHandle` is the **RUN HANDLE** derived fact, passed verbatim; the notifier writes it on the ending comment, and an empty or omitted one is a missing line and never an error. Each lane is `{ issue, issueBody (the body Act 0 fetched, verbatim and whole), planPath (ABSOLUTE — .scratch exists only in the main tree), subLanes: [{ branch, worktree (absolute), base, area, commits: [{ordinal, message}], ownedCriteria: [{ordinal, criterion}] }] }`. A lane's subLanes array contains only THIS layer's sub-lanes — later-layer sub-lanes of the same issue go into the next layer's args.

Build each sub-lane's `commits` from the plan's `## Commit / PR breakdown`: the entries belonging to that sub-lane's PR, in plan order; `ordinal` = 1-based position within the whole breakdown; `message` verbatim from the plan. Omit commits Act 0 already found in the branch's git log (resume).

Build each sub-lane's `ownedCriteria` from that SAME section, which you are already parsing: the acceptance criteria that sub-lane's PR entry names, as `{ordinal, criterion}` — the ordinal into the issue's `- [ ]` checklist and the criterion's text from the issue body Act 0 fetched. A plan holding two or more PRs states them per PR; a single-PR plan states nothing. **Anything the plan left unlisted falls to the LAST sub-lane in plan order** — last in the PLAN, never the top of the chain and never the last of a layer. An issue with no acceptance criteria gives every sub-lane an empty list, which behaves exactly as passing no issue body does.

**This is yours, and it is decided ONCE per run, here, where lanes are built.** Pass the list on every sub-lane, including the single-sub-lane case; the phase script treats an absent key as the whole checklist, which is a fallback and not a second way to say it.

Per lane (lanes parallel; sub-lanes and commits sequential): writer Mode 1 per commit → on FAILED the debugger diagnoses and routes → reviewer on the sub-lane's range, with the issue body in whole and the sub-lane's owned criteria naming what its Spec axis judges → fix cycles with dispute/arbitration handling → the suite gate on the sub-lane's worktree, a red suite diagnosed by the debugger before any writer fix and re-run under its own bounds → commit-breakdown check. The Spec axis's per-criterion verdicts are reported and never blocking — they ride out to Gate 2 and the PR body without ever triggering a fix cycle or halting a lane, and under `unattended` they are read once more at the conclusion, where the terminal-state table drafts a pull request on any verdict that is not `met`. Every loop is bounded, and the phase script holds every bound, route and ending — you enforce none of them. Each sub-lane finishes clean or ends carrying one of two labels: **HALT** (something deliberately stopped) or **FAILED** (something broke). Report the ending in those words, with its stage and its attempt log; the label explains and **decides nothing** — Gate 2 disposes of an ended sub-lane the same way whichever label it carries. An ending ends its own sub-lane, so the lane's later sub-lanes still run and no ending kills the batch.

**KEEP each layer's transcript directory too**, exactly as Act 1 says — a lane whose sub-lanes span layers has its records spread across one directory per layer, and Act 4 wants all of them.

The per-LANE result carries two flags Gate 2's step 4 reads and nothing else does: `crashed`, true when that lane's closure threw, and `notified`, true when the notifier **applied** that lane's label at its ending — never merely attempted it. Under `gated` both are always false, nothing writing a label there. Each lane's arg accepts `notified` back, so a lane whose sub-lanes span layers is not notified twice; carry it from the previous layer's result.

The per-sub-lane result carries a `terminal` of `{pr: 'ready'|'draft'|'none', reasons}` — the phase script's terminal-state table, already applied to that sub-lane's own inputs. **Obey it; never re-derive it.** Carry it to Gate 2 unchanged: under `unattended` it is what step 2 below opens, and `reasons` is what a draft PR body explains itself with. It carries no push column, because git decides that and you ask git in step 1.

The commit-breakdown check is YOUR work, not an agent's: at the end of each sub-lane compare the plan's commit ordinals you passed in against the commits the writers reported making, and carry the result as `<n> planned, <m> made`. You get it back on each sub-lane result. A mismatch never halts the lane and never triggers a fix cycle.

Between layers (asks under `gated` only): run Gate 2 for the layer's finished lanes FIRST (push/PR offers — see below), then ask authorization to proceed: "the next layer builds on <branches> — proceed, or hold while you review them yourself?" The user may inspect the finished worktrees at leisure — the loop waits, and findings they raise go to the writer's Mode 2 before any dependent layer starts. Only after authorization, provision the next layer's worktrees (Act 2) from the completed bases. A dependent lane whose base ended — or was held by the user — never runs, so it ends **HALT** with that reason.

## Gate 2 — push & PR (per layer; asks under `gated` only; PushNotification first)

**Push, pull requests and stack linking are the host's**, so every step below is yours: a phase script never pushes, never opens a pull request and never links a stack, having no shell.

**The findings ledger** is per lane, and is what this gate and the pull request body both surface. Its categories:

| Category | What it holds |
|---|---|
| **fixed** | reviewer findings the writer applied |
| **won't-fix** | findings the writer disputed and the reviewer retracted, each with the writer's reason |
| **arbitrated** | contested findings the human ruled on, with the ruling. Always empty under `unattended`, where nobody rules — no conditional needed |
| **acceptance criteria** | the reviewer's `met` / `partial` / `not-met` verdict per criterion **the sub-lane owns**, with its evidence, verbatim. Reported rather than inert: no review, fix cycle or ending turns on a verdict, but under `unattended` the terminal-state table drafts the pull request on any verdict that is not `met` |
| **reviewer NOTES** | non-blocking observations, verbatim |
| **review trajectory** | on a sub-lane whose review loop ended on either of its bounds: one entry per round saying whether it brought previously-unseen findings or repeated prior ones. Recorded on every sub-lane and rendered only where a bound ended one, like the attempt log. It answers what a bare count leaves open — *was this loop converging?* — before anyone opens the diff |
| **suite** | the gate's state: `passed`, `failed` with its failing test identifiers, or `not run` with why it did not. Never `passed` for a suite that did not run |
| **attempt log** | everything the pipeline did *after* something first went wrong, in order: each debug+fix attempt, retry, review fix cycle and suite round, carrying what triggered it, what the debugger said, and how it ended. Stages that worked are already in the commit list and the categories above, and repeating them buries the one entry that matters. Recorded on every sub-lane and rendered only on one that ended, so the loops append without branching |

Gate 2 fires at the end of EVERY layer, for every sub-lane that layer finished — clean or ended, both offered here on the same terms, and never held back until the whole batch ends. A batch with no stacking has one layer, and therefore exactly one Gate 2.

Per sub-lane, show: the commit list (a `wip:` commit is abandoned work the writer committed as evidence — listed, never counted), the planned-versus-made commit counts (`<n> planned, <m> made`), deviation counts, the **acceptance criteria** — the reviewer's `met | partial | not-met` verdict per criterion that sub-lane OWNS, with its evidence — the **findings ledger** as its table above lists it, including the **review trajectory** where a bound ended the review loop and the **attempt log** where the sub-lane ended, and the **suite** result. The counts and the criteria are informational at this gate — neither blocks.

For sub-lanes that ended on contested findings, present both sides of each contested finding and ask the user to arbitrate: uphold the finding (send it back through the writer as a targeted fix and resume the sub-lane) or accept the dispute (record it as won't-fix, documented). AskUserQuestion: approve / hold. On approve, run steps 1–3 per sub-lane in order, then step 4 once per lane, then step 5 once for the whole batch:

1. `git -C <worktree> rev-list --count <base>..<branch>` (`<base>` as Act 2 provisioned it), then `git -C <worktree> push -u origin <branch>` when the count is non-zero — **never `--force`, never `--force-with-lease`**, in either mode. Zero means nothing landed — not even a `wip:` commit — so there is nothing to push and no PR to open: report it and move to the next, and under `unattended` `gh issue comment <n>` the ending's explanation first, this being the one ending with no pull request to carry it. Ask git, never the reported commit list: the count settles the push AND overrides the sub-lane's proposed PR state in step 2. This is each sub-lane's ONE push. A rejected push stops this sub-lane's conclusion here — report git's message verbatim as a **FAILED** ending for that sub-lane, open no PR, keep that worktree, and move to the next.
2. `gh pr create --head <branch> --base <base-branch> --title "<per the profile's title format>" --body ...` — `<base-branch>` is `<DEFAULT>` for default-based lanes (NEVER `origin/<DEFAULT>` — gh rejects remote-tracking refs) or the stack base's branch name. Under `unattended`, **whether that command carries `--draft` is the sub-lane's `terminal.pr`**, which the phase script's terminal-state table already decided: `ready` opens a normal PR, `draft` adds `--draft`, and `none` opens nothing — except that step 1's count is the authority, so a `none` whose count came back non-zero is a branch that is ahead after all and opens `--draft`, never ready. Put `terminal.reasons` in the body. Under `gated` **nothing here changes and the table is not read**: a sub-lane that **ended** gets no PR by default and you offer "open a draft PR anyway?", running the same command with `--draft` if the user takes it, while a sub-lane that concluded clean gets its normal PR whatever its verdicts say. You set draft state ONLY on a PR you are creating, and leave an existing one as its opener made it. Body: **the profile's PR body template**, asked once at the first Gate 2 under the ask-then-persist rule and persisted like every other profile key. Whatever shape a repository gives it, these core elements must survive:

   | Element | Where it appears |
   |---|---|
   | `Closes #<n>` | the FIRST sub-lane only; later sub-lanes reference the issue without closing it |
   | **Context** | the plan's summary bullets — the architect's orientation, retained from Phase A whether or not Gate 1 fired — beside `<n> planned, <m> made` |
   | **Acceptance criteria** | one line per criterion THIS sub-lane owns: `met` / `partial` / `not-met`, the criterion, and its evidence, verbatim from the reviewer. Only the criteria it owns, so nobody reads a verdict about code that is not in the diff. Omitted when the reviewer returned none |
   | **Whole-issue roll-up** | the LAST sub-lane of a lane and no other, directly beneath that criteria section: every acceptance criterion of the issue, its verdict, and which sub-lane produced it, so whoever merges the end of a chain sees whether the issue was delivered without opening every PR under it. Assembled from sub-lane results you already hold — no agent, no extra stage. **Reporting only**: it feeds no predicate, and a sibling's unmet criterion never drafts THIS pull request. Omitted on a single-sub-lane lane, where it would repeat the section above it verbatim, and where no reviewer returned a criterion at all |
   | **Review findings** | the count of fixed findings, each won't-fix with the writer's reason, the reviewer's NOTES verbatim, and — where the review loop ended on one of its bounds — the `reviewTrajectory`, one line per round. Omitted otherwise |
   | **Suite** | this sub-lane's gate state: `passed`, `failed` with its failing test identifiers, or `not run` with why. A suite that never ran says so rather than reading as green |
   | **Attempt log** | on a sub-lane that ended — the ledger's, in order, so a draft PR carries what the pipeline tried. Omitted on a clean sub-lane |
   | **Run handle** | on a sub-lane that ended — the **RUN HANDLE** derived fact, this body being the only copy that outlives the run. Omitted where Act 0 found no identifier, and on a clean sub-lane |
   | **Local-only artifacts** | every File touchpoint the plan named that this repo gitignores and this sub-lane's worktree has, per step 3's check — saying they are in no commit and so exist on no machine once that worktree goes. Omitted when the plan named none, which is the ordinary case. The pull request is the ONLY durable place this reaches anyone |
   | **Why this is a draft** | one line per entry in `terminal.reasons`, at the TOP where the merger sees it first — which trigger fired, without making them hunt. Omitted on a ready PR, which has none |

   **A repository with no profile still opens a pull request carrying every element above**, in that order. Then the footer:

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

3. **The worktree invariant.** A sub-lane's worktree is removed when, and only when, its work has reached the remote **and no human is expected to resume in it**.

   | Sub-lane state | Remote | Worktree |
   |---|---|---|
   | Concluded clean | pushed, pull request opened | removed |
   | Ended, `unattended` | pushed, draft pull request | removed |
   | Ended, `gated` | pushed, no pull request by default | **kept** |
   | Held at Gate 2 | nothing pushed | kept |
   | Removal refused | pushed | kept, reported |

   Removal is `git worktree remove <WORKTREES>/<slug>`, never `--force`. Two rules make that safe:

   - **Push succeeds first, remove second.** After removal the remote branch is the only copy, so a push that failed or never ran keeps its worktree.
   - **A dirty worktree keeps itself.** `git worktree remove` without `--force` already refuses on tracked modifications or on untracked non-ignored files, and **that refusal IS the guard** — the pipeline never passes `--force`, so it can never talk its way past one. Report `git -C <wt> status --porcelain` verbatim and keep that worktree. Ignored files, such as the configuration and dependency directories provisioning copies in, do not trip it.

   **The main worktree is never a removal candidate** — not under any state above and not under either run mode. Before any removal, confirm the path is NOT the first entry of `git worktree list`. The local branch and the plan file stay (`/dev-loop-cleanup` reaps those once the PR merges).

   **Name what the removal destroys, then remove.** The refusal above guards tracked modifications and untracked non-ignored files; **ignored** files `git worktree remove` deletes without a word, so a sub-lane's gitignored working material goes with its worktree, which is the intent. Before removing, read the plan's **File touchpoints** and report every one that `git -C <wt> check-ignore -q <path>` calls ignored and that exists in the worktree, as paths going with the removal. That same list is step 2's **Local-only artifacts** section. Then remove: nothing is copied out and nothing is kept — a path that must outlive its sub-lane has to be committed. Report nothing when the plan named no such path, which is the ordinary case. The list comes from the plan's touchpoints, never from `--ignored=matching`, whose every line would be the dependencies and copied-in config provisioning put there on purpose.

4. **⟨notify⟩ Lane conclusion.** Once every sub-lane of a lane has been through steps 1–3, close that lane. Per lane, not per sub-lane — the label is per issue — and at the lane's LAST layer, so a lane whose sub-lanes span layers closes once rather than once a layer; carry its `notified` forward into the next layer's args.

   **Remove the in-progress label, without exception**: finished, ended or thrown, the lane is no longer in progress. What replaces it — if anything — is decided by one question: **did the run reach a reasoned conclusion, or did a stage break?** A conclusion needing a human takes **awaiting-human**; a break takes **failed**; a ready pull request takes neither. Where both read true **failed wins**. Roles, never strings: resolve them through the repo's own `docs/agents/triage-labels.md`, and **a role that documentation names no string for is skipped silently** — no error, and never a string you invented. Which case this lane is in, the phase-script result already says:

   | The result says | Which case you are in |
   |---|---|
   | `notified: true` | the notifier already applied this lane's label at its ending. **Write nothing else** — a second verdict over the first is how two writers come to disagree in public. It is true only when a label actually landed, so `false` on an ended lane means the write did not happen and the case below applies. |
   | `crashed: true` | the lane's closure threw. Its attributed ending names the issue and carries the error, so the rule's break arm has something to point at. **You also owe this lane its ending comment** — a throw unwound past the point the notifier fires from, so no other writer can post one, and every ended lane gets exactly one ending comment. Post the attributed ending and the **RUN HANDLE**. |
   | neither, and any sub-lane's `terminal.pr` was `draft` | a draft with no ending behind it — nothing ended, so no notifier ever ran, and this one is yours. Apply **awaiting-human**. |
   | neither, and every PR opened ready | the no-label case. Apply nothing. |

   Then **send exactly one closing message**, in the shape stated above — `draft` or `ready`, its reason, and the pull request link. Unconditional, including for a lane with no PR at all: paired with Act 0's started message it is the run's dead-session signal.

5. **Stack linking.** Once per BATCH, at its LAST Gate 2: a batch whose sub-lanes stack finishes by telling GitHub they form a stack. Linking is **additive** — the base chaining, the bodies and the stacked note are unchanged — and six rules keep it that way:

   | Rule | Why |
   |---|---|
   | **Fires at the very end of the batch**, once every sub-lane of every lane has pushed and opened its pull request — never per layer | a stack is a property of the finished batch, and a half-linked stack is worse than none: it shows a reviewer a chain that stops short of the work |
   | **One call per chain, not one per batch.** Walk the base relation and link each **maximal chain**; a chain of **fewer than two** pull requests is not a stack and is skipped | a batch is not necessarily one stack, and handing every pull request to a single call would assert that an independent lane is what the top layer builds on |
   | **A gap in a chain is shown, never closed up.** The walk stops at a sub-lane that opened no pull request; the runs either side are separate chains, each linked on its own, and the gap is reported naming that sub-lane | joining across the hole would tell a reviewer the upper pull request is stacked on the lower one — a claim the pipeline never made and a reviewer has no way to disbelieve |
   | **Pull requests are identified by number, bottom to top.** Never by branch name | given branch names the tool opens pull requests of its own, fighting the profile's title format and overwriting the body — costing the run the `Closes #<n>`, the summary bullets and the findings ledger it just composed. Given numbers it adopts what exists and adds nothing |
   | **Ready-for-review is never requested** | draft-versus-ready was decided per sub-lane from its own inputs, and a batch-wide flag applied at link time would override every one of those decisions from the wrong place |
   | **No local state, in either direction** | linked worktrees share one common git directory, so any command that kept local stack state would have every concurrent lane racing over the same files |

   **A machine without the tool needs nothing.** The linking sits behind one bundled script which detects the tool's absence and exits having called nothing: no gate checks for it, no precondition asks about it, and no run fails or prompts for want of it.

   **A failed link is reported and costs nothing else.** It leaves every pull request exactly as the run created it — title, body, draft state and base. No sub-lane's ending changes, no worktree decision changes, and nothing is retried.

   **This step is identical under both run modes and asks nothing**, so gate suppression does not touch it.

   Keep each sub-lane's PR number from step 2 as you go — the number, not the URL, and `gh pr create` prints the URL, so read it back with `gh pr view <branch> --json number -q .number` if you did not capture it. Then walk the base relation you provisioned in Act 2: a sub-lane whose base is the trunk starts a chain, and a sub-lane based on another sub-lane's branch extends it. Per chain, bottom to top:

   ```
   <this-skill-dir>/stack-link.sh <pr-number> <pr-number> [...]
   ```

   A batch with no stacking is every chain of length one, and the script makes no call for any of them — so the ordinary run calls nothing and says nothing. Report the script's one `STACK:` line per chain as it comes: `linked` records the stack, `skipped` is the machine having no extension and is not a problem to raise, and `failed` is reported with its message and then left alone. **A `failed` is never fatal and never retried.** Pass pull request numbers only; the script refuses a branch name and never sends the ready-for-review flag, either of which would let this step overwrite what steps 1–4 decided.

Stacked lanes: a lane in the bottom layer bases its PR on the trunk (`<DEFAULT>`); every layer above bases its PR on the branch of the layer below. Note the stack in the body ("Stacked on #<A>'s PR — rebase onto <DEFAULT> after it merges"). Removing a lower layer's worktree does not affect the layer above it — that layer branches from the base's _branch_, which survives worktree removal. Step 5 above then records the chain on GitHub itself; the note stays regardless.

Ended sub-lanes: report the label (**HALT** — something deliberately stopped; **FAILED** — something broke), the stage, the reason (verbatim contract lines), the diagnosis if a debugger produced one, the attempt log in order, and the exact resume command — `/dev-loop <n>` re-derives everything. The label explains the ending and decides nothing: under `gated` the two are offered the same push, the same draft-PR question and the same kept worktree, and under `unattended` both reach the terminal-state table as the same row.

## Act 4 — the cost log (per the Run mode guard: `unattended` only)

Once the LAST layer's Gate 2 is done and the run has nothing left to do, write one cost log per lane — per lane and not per layer.

Per issue **the run was asked to work** — the list Act 0 parsed, before anything dropped or refused a lane:

```bash
mkdir -p <MAIN>/.scratch/dev-loop-cost
# `|| rm` because a redirect creates its file before the command runs: without it a
# failure leaves a zero-byte log, which reads as measured-and-free rather than unmeasured.
node <this-skill-dir>/cost-report.mjs --issues <n> <transcriptDir>... \
  > <MAIN>/.scratch/dev-loop-cost/<n>.txt \
  || rm -f <MAIN>/.scratch/dev-loop-cost/<n>.txt
```

- **One file per lane, keyed by the issue number.** `.scratch/` is gitignored — Act 0's preconditions guarantee it.
- **Every transcript directory the run captured**, planning and every layer, in one command.
- **Every lane, whatever its ending** — and a lane whose plan never came back READY, which has no ending to speak of. A lane dropped at intake before any agent ran gets one too, saying it was not measured.
- **Nothing goes to the issue thread or the PR body.**
- **Best-effort, and last.** A failure here — the script missing, a directory unreadable, no transcript directory captured at all — is reported and dropped. It never changes a lane's ending, never blocks the run's conclusion, and never makes a batch report failure.

Then tell the user where the logs are. `cost-report.mjs` measures on the metric the baseline was measured on, and a comparison against any other metric is meaningless.

## Hard rules

- Invoking `/dev-loop` IS the user's explicit opt-in to multi-agent orchestration. Enter Phase A and Phase B directly — running a phase is NOT a gate. The ONLY human gates in this pipeline are Gate 1 (plan approval) and Gate 2 (push/PR), and under `unattended` neither asks anything. The one-time ask-then-persist preconditions are not gates and survive both modes: the profile's keys, `.worktreeinclude`, and the runner setting Act 0 asks about, each asked once ever. **Every one of them belongs to a named step that performs it**, and the two Phase B needs — **Full-suite command** and **Fix cycles** — are Act 0's step 9's.
- Proceed past a gate only on explicit user approval, unless the run mode is `unattended`.
- **Append-only, whoever is watching.** The run may append to issues and pull requests (`gh issue comment`, `gh pr comment`), may add and remove its own workflow labels and no others, and may set state only on artifacts it created — its own branches, its own PRs, its own plan files. Issue bodies, acceptance-criteria checkboxes and pull requests a human opened are left exactly as they are; per-criterion verdicts are *reported*, never written back to the issue's checklist. **This invariant binds you and every agent** — there is no ending, no ceiling and no absent human that relaxes it.
- NEVER remove, force-modify, or `rm -rf` the main worktree (first entry of `git worktree list`). Worktree removal applies only to worktrees under `<WORKTREES>`, and only via `git worktree remove` without `--force`.
- **Never force-push, whoever is watching.** Every push this pipeline makes is a fast-forward by construction, so forcing is never the fix. A rejected push is reported and its worktree kept, never retried harder.
- **Push before you remove.** A worktree is removed only after a push of its branch succeeded.
- A lane worktree is a cold checkout plus its `.worktreeinclude` files and whatever the Setup command installs. Everything else an agent needs — skills, roster, settings, permissions — it already has: it runs in a session rooted in MAIN whatever directory it works in.
- **Never halt, warn, or change a lane's behaviour because of what it costs.** Token spend is reported by Act 4 and enforced nowhere. **There is no token ceiling, no per-lane budget and no cost-triggered ending anywhere in this pipeline** — every loop is already bounded without one, and no argument, profile key or ending unlocks this.
- Provisioning and pushing are one Bash command each and are yours; planning, coding and reviewing are the agents'.
- Plan paths passed to agents are always ABSOLUTE.
- If the session dies mid-run, `/dev-loop <same issues>` resumes from artifacts — do not keep separate state files.
- Every repository name, absolute path and project-specific fact stays out of this skill and its bundled agents — repo facts belong to the repo profile and the repo's own docs, so the skill folder stays copyable to any machine as-is.
