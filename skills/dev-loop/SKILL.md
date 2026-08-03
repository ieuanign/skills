---
name: dev-loop
description: Issue-to-PR pipeline over the custom agent roster — plans, implements, and reviews one or more GitHub issues, each in its own git worktree, with parallel lanes and human gates at plan approval and push/PR. Use when the user invokes /dev-loop with issue numbers, wants an issue worked end-to-end, says "/dev-loop auto" for an unattended run that never stops for approval, or says "/dev-loop cleanup".
---

# /dev-loop — issue-to-PR pipeline

You are the orchestrator. You stay in the MAIN worktree and never write code, plan, review, or debug yourself — the agents do (architecture-engineer, code-writer, reviewer, debugger). You do: intake, gates, worktree provisioning, push, PRs, cleanup. All agent returns are machine-readable — trust the contract keys (`STATUS/RESULT/VERDICT/OWNER`), not vibes. The pipeline's state machine (role contracts, cycle caps, endings) is specified in `<this-skill-dir>/contracts.md` — normative for BOTH execution modes; read it before Phase B.

This skill is repo- and machine-agnostic: it hardcodes no repository name, path, or project fact. Everything it needs is derived below or read from the repo profile.

## Arguments

`/dev-loop [auto] <issues> [project:<slug>]`

- `auto` — optional leading token: run the batch **unattended**, from filed issue to pushed PR, without stopping for approval. Modes lead and dials trail — the shape `cleanup` already has — so the word deciding whether you will ever be asked for approval is the second one you type.
- `<issues>` — one or more GitHub issue numbers, comma or space separated. One issue = one lane; several = parallel lanes.
- `project:<slug>` — optional project slug passed to the architect for the plan path.
- `/dev-loop cleanup` — run Cleanup mode (bottom) instead of the pipeline.

### Run mode — `gated` or `unattended`

`auto` present ⇒ **unattended**; absent ⇒ **gated**. Act 0 parses it ONCE and carries it as a single value for the whole run — no later stage re-derives it from the arguments. It is contracts.md's **Lane conclusion** branch, and in this file it decides exactly one thing:

> **Gate suppression.** Both gates raise their questions under `gated`, and neither raises any under `unattended`. This line is the only place that is decided: no argument and no profile key overrides it.

**Suppression removes the questions, not the work.** Every step of both gates still runs; each question resolves to its unattended answer instead:

| Question | Its unattended answer |
|---|---|
| Gate 1 — which lanes are approved? | every lane whose plan is `READY` proceeds |
| Gate 1 — a `BLOCKED` plan's open questions | nobody can answer them, so that lane does not proceed and is reported carrying them |
| Gate 1 — stack a dependent lane, or defer it? | defer it out of the batch — deciding overlaps without a human is specified separately |
| Gate 2 — is the push/PR approved? | the lane pushes and opens its PR |
| Gate 2 — arbitrate a contested finding | nobody rules, so the ledger's **arbitrated** category stays empty and the finding rides out to the PR body |
| Between waves — authorize the next wave? | it proceeds |

A gate's `PushNotification` goes with its question — it exists to summon someone to a gate, and under `unattended` nobody is being summoned. What an unattended run does emit instead is `notifications.md`'s, governed entirely there.

Touchpoint intersection, sub-lane splitting, the profile's Constraints, the push and the PR itself are gate *work*, and happen identically under both modes. The one-time ask-then-persist preconditions are not gates and fire under both. What a lane's *ending* means for the PR's state — ready, draft, or none — is the terminal-state table, specified separately; until it lands, an unattended lane concludes exactly as an approved `gated` lane does.

## Derived facts (compute once at Act 0 — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **REPO** — `basename` of MAIN.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`. Every lane worktree lives here; the directory slug is the branch name after its first `/` (`feat/208` → `<WORKTREES>/208`).
- **GitHub repo** — never pass `--repo`: every `gh` command runs inside a checkout of this repo (worktrees included), and gh infers the repository from the remote.
- **Fast copy** — macOS: `/bin/cp -Rc` (APFS clonefile, instant; MUST be `/bin/cp` — a GNU cp on PATH rejects `-c`); Linux: `cp -R --reflink=auto`; anywhere else: plain `cp -R`.

## Where configuration lives — a rule, not a list

Adding a value to this pipeline? The rule decides its home, so a new value never needs a debate:

> **Varies per run → argument. Varies per repository → profile. Does not vary → constant.**

| Home | Values |
|---|---|
| **Argument** | the run mode, the issue list, the optional `project:<slug>` |
| **Repository profile** (ask-then-persist, below) | every key in **Repo profile** below — branch template, suite command, **fix cycles** |
| **Phase-script constant** | per-stage effort and model tiers, the per-commit debug-and-fix bound, the suite gate's two round bounds, the stage list each mode runs |
| **Skill constant** | gate suppression under `unattended` (stated once under Run mode above), the cost reporting target |

These are **homes, not an inventory**. A value this pipeline does not have yet still has its home decided here — which is the point of a rule over a list, and why the refusals below can name things nothing has built.

**What the rule refuses**, so it does not creep back:

- **No per-repository effort tiers.** Cost behaviour stays predictable across repositories; a tier is a phase-script constant or it is nothing.
- **No per-run overrides of gates, stages, or cost behaviour.** The run mode is the only argument that changes pipeline behaviour, and all it selects is the Lane conclusion branch.
- **The cost reporting target stays a constant** — it was measured as a single median across repositories, with no evidence it varies by one. Promote it if one repository's lanes prove consistently larger.

Each refusal is a cheap promotion from constant to profile key if a repository ever actually needs one. That cheapness is the reason to refuse now rather than pre-empt.

## Repo profile — `docs/agents/dev-loop.md` (ask-then-persist)

The per-repo config, read at Act 0. Optional: a repo without one runs on pure defaults. The rule for every non-derivable value: when a run first NEEDS it and the profile lacks it, AskUserQuestion ONCE, persist the answer into the profile (create the file if needed), and never ask again — a persisted "none" counts as an answer. Never store derivable facts there.

Profile keys:

- **Branch template** — default offered: `feat/{issue}`, sub-lanes `feat/{issue}-{area}`. Asked on the first run in a repo.
- **PR title format** — default: `<type>(<scope>): #<issue> - <title>`.
- **PR body template** — asked at the first Gate 2; whatever its shape, the core elements in Gate 2 below must survive.
- **Setup command** — what a cold checkout runs before its tests pass (e.g. `npm ci`). Asked at the first provisioning.
- **Full-suite command** — the ONE command that runs the repo's whole test suite from a provisioned worktree (e.g. `npm test`, or a compound command joining a backend and a frontend suite). Asked before the first Phase B run in a repo, because the suite gate needs it. `none` is a real answer, persisted like any other: a repo with no suite, or one whose suite needs infrastructure this pipeline does not stand up, declares it and the gate reports **not run**. Configuration, never discovery — a discovered command that needs a database nobody started returns a red result that means nothing.
- **Fix cycles** — how many review fix cycles a sub-lane may spend before it ends with its findings open. Default offered: `2`. Asked before the first Phase B run in a repo, because that is where the bound first bites. A repository fact, not a constant: a repository with a flaky suite genuinely wants more cycles, and one that would rather read every finding itself can answer `0`.
- **Constraints** — free-form repo cautions (e.g. "backend tests share one database — never run two backend lanes concurrently"). Honor them when deciding lanes vs waves (Gate 1) and when provisioning (Act 2).

## Execution modes (detect at Act 0)

- **Mode W** — the Workflow tool is in your toolset: run the phase scripts exactly as Act 1 / Act 3 describe.
- **Mode A** — no Workflow tool: you drive the same state machine yourself with the Agent tool, per contracts.md. Tier-locked: the direct Agent tool has no effort parameter, so this mode cannot vary effort and any future cost dial is Mode W-only. Phase A: one background architecture-engineer per issue, in parallel; collect their returns. Phase B: lanes in parallel, each lane's steps sequential (writer per commit → debugger routing on FAILED → reviewer cycles → suite gate), enforcing every cap, route, and ending from contracts.md yourself. An ending belongs to the sub-lane it happened in: record it there, run no later stage of that sub-lane, and carry on with the lane's next one. Keep every sub-lane's attempt log as you go — each recovery attempt, what triggered it, what the debugger said, how it ended. The suite gate is a plain Agent-tool call with no agent type and no persona — it has no definition to end with leading lines, so tell it the return format in the prompt and parse `STATE`/`FAILING`/`OUTPUT` yourself; a red suite goes to the debugger before any writer, and you carry its bounded round loop like every other bound in contracts.md. Pass the reviewer the issue body Act 0 fetched between `<<<<ISSUE-BODY` / `ISSUE-BODY>>>>` markers (issue bodies are markdown and carry the same headings your prompt does), name which sub-lane it is judging, and carry its `CRITERIA` verdicts onto the sub-lane result — the last review's win. The agents already end with machine-readable leading lines — parse those as the contract keys.
- Behavior changes edit contracts.md FIRST, then both implementations (the phase scripts and Mode A) in the same change.
- Every mode difference lives in one place: contracts.md's **Lane conclusion** section. Both modes here implement its **gated** half — Gate 1, Gate 2, human arbitration — and Mode W alone implements the **unattended** half. Mode A never implements it.

## Act 0 — Intake (before any agent runs)

1. Parse the arguments: a leading `cleanup` selects Cleanup mode; a leading `auto` sets the **run mode** to `unattended`, its absence to `gated`; the rest are issue numbers and the optional `project:<slug>`. This is the ONLY place the run mode is derived — carry that one value from here. Then detect the execution mode, which is a toolset check and costs nothing.
2. **Unattended mode requires Mode W.** Run mode `unattended` with no Workflow tool in your toolset → refuse the run here, before a single agent is dispatched and before this Act asks the user anything else — a developer whose run is about to be refused should not first be asked to fill in a profile it will never use. Tell them the setting, `"enableWorkflows": true` in the per-machine settings file (`~/.claude/settings.json`), and that a **restart is required** — tool availability is fixed at session start, so writing the setting cannot rescue this run. Asked once, then never again on this machine, with the settings file itself as the persistence:

   - key **absent** → AskUserQuestion once. Yes → write `"enableWorkflows": true` into that file (create it if missing; preserve every other key). No → write `"enableWorkflows": false`, which is a real answer and is why the question does not return.
   - key **present** → do not ask. `true` means the setting is already made and the session predates it: say so and say to restart. `false` means they declined: name the file and the key so they can change their mind.

   Either way this run stops — it does not silently continue in Mode A. This is per-machine, so it persists to the per-machine settings and never to the repo profile or a setup skill: the profile is per-repository, and intake is the only place that knows unattended mode was actually requested. A `gated` run with no Workflow tool is untouched and runs Mode A exactly as before.
3. Compute the Derived facts and read the repo profile (first run in a repo: ask-then-persist the branch template).
4. Worktree preconditions:
   - `.claude/worktrees` not gitignored (`git check-ignore -q .claude/worktrees` fails) → append `.claude/worktrees/` to `.gitignore` and tell the user; lane worktrees are nested inside MAIN, so unignored they pollute every `git status` there.
   - `.scratch` not gitignored (`git check-ignore -q .scratch` fails) → append `.scratch/` to `.gitignore` and tell the user; plans live there.
   - `.worktreeinclude` missing — the repo-root file naming which gitignored files worktrees need (gitignore syntax; the same file Claude Code's own worktrees read) → ask-then-persist, the file itself being the persistence: offer candidates from `git ls-files -oi --exclude-standard --directory`, write the selection as a tracked file. "None" writes a comment-only file, which counts as answered. Offer only what a cold checkout cannot run without — env files and local config. Dependencies belong to the Setup command however cheap the Fast copy looks: a copied tree carries platform-specific native builds and drifts from the lockfile.
   - `.worktreeinclude`'s LAST line must be `!.claude/worktrees/**` — append or move it there (gitignore matching is last-match-wins, so only the final position shields reliably). It keeps every copy mechanism — Act 2 and Claude Code's native worktrees alike — from cloning existing worktrees into a new one.
5. `git fetch origin <DEFAULT>` once.
6. Per issue: `gh issue view <n> --json number,title,body,state,labels`. CLOSED → drop the lane, tell the user. KEEP the body: Phase B hands it to the reviewer as its Spec axis, and nothing downstream fetches it again — the reviewer's Bash is read-only and git-only.
7. Parse each body's "Blocked by" section: a blocker that is still open and NOT in this batch → refuse that lane (report why); a blocker inside the batch → record the ordering (it becomes a stacked lane at Gate 1).
8. Stateless resume check per issue — derive the stage from artifacts, never from memory:
   - Plan file exists with `Status: READY` → skip Phase A for that lane (offer replan if the user asks).
   - Plan commit messages already in `git log` of the lane's branch → those commits are done. A sub-lane whose commits are all present resumes by re-running the review — safe and idempotent, since nothing records that a review already passed.
   - A worktree already exists for the branch → reuse it as-is.

## Act 1 — Phase A: plans

Mode W: run the Workflow tool with `scriptPath: <this-skill-dir>/phase-plan.js` and `args: { issues: [{number, title, project, answers?}] }`. Mode A: the equivalent parallel architect runs per contracts.md. One architect per issue, parallel. Each returns `{status, planPath, summary, openQuestions}`. A lane returning `status: DIED` means its architect crashed — report it at Gate 1 and offer a re-run; never silently drop a requested issue.

KEEP each lane's `summary` bullets for the rest of the run. They are the architect's orientation, and Gate 2 puts them in the PR body's Context section — so they must survive whether or not Gate 1 fires, and are not consumed by presenting them there.

## Gate 1 — plan approval (asks under `gated` only; ONE batch interruption; PushNotification first)

Present every lane: summary, plan path (invite the user to edit the file before approving), open questions. Then:

- **BLOCKED plans**: relay the open questions via AskUserQuestion, re-run only those lanes' architects with `answers` filled in, re-present.
- **Touchpoint overlap**: intersect the plans' File touchpoints across lanes yourself (plain reading, no agent). Additive shared file (both append to a registry/route file) → note it, keep parallel. Real dependency (B consumes what A creates) → AskUserQuestion per case with **"stack B on A's branch" as the first/recommended option** and "defer B out of this batch" as the alternative. Post the discovery back to the dependent GitHub issue: `gh issue comment <B> --body "Discovered blocker: depends on #<A> — overlapping files: ..."`.
- **Profile Constraints**: apply them now — lanes a constraint forbids from running concurrently go into separate waves (or one is deferred), and say so.
- **Multi-PR plans**: the lane splits into sub-lanes, sequential, in the plan's order (e.g. migration → backend → frontend). First sub-lane branch from the branch template, later ones with the `-<area>` suffix, each based on the previous sub-lane's branch when the plan says the code depends on it, else `origin/<DEFAULT>`.

Only lanes the user approves proceed. Drop the rest with a note.

## Act 2 — Provisioning (you, plain Bash — no agents)

Wave logic: **anything based on origin/<DEFAULT> runs in wave 1; anything based on a branch that gets its commits in wave N runs in wave N+1** — this applies to stacked _lanes_ AND to dependent _sub-lanes_ within one lane (a frontend sub-lane based on its own backend sub-lane's branch waits for the next wave; provisioning it earlier would capture a base with zero feature commits). Provision a wave only after its bases completed the previous wave. For each sub-lane in the current wave:

1. `git worktree add <WORKTREES>/<slug> -b <branch> <base>`. Base is `origin/<DEFAULT>` or the stack/sub-lane base branch. On resume: an existing worktree is reused as-is; an existing branch WITHOUT a worktree reattaches with `git worktree add <WORKTREES>/<slug> <branch>` (no `-b` — the `-b` form errors on an existing branch).
2. `.worktreeinclude` copies: `git -C <MAIN> ls-files -oi --exclude-from=.worktreeinclude --directory` lists the matches (files, plus fully-ignored dirs collapsed to one entry). Fast-copy each from MAIN into the worktree at the same relative path, creating parent directories — but STRIP the trailing slash git puts on directory entries first: `cp -R dir/ dest/` copies the directory's contents rather than the directory itself, scattering them one level too high. Worktree contents never appear in the list — the `!.claude/worktrees/**` line Act 0 guarantees excludes them.
3. Run the profile's Setup command from inside the worktree.

## Act 3 — Phase B: execute

Per wave, Mode W: run the Workflow tool with `scriptPath: <this-skill-dir>/phase-execute.js` and `args: { lanes, mode, maxFixCycles, suiteCommand }` — the lane list, the mode, the fix-cycle count and the suite command, and nothing else. `mode` is the run mode Act 0 parsed — literally `gated` or `unattended`, never the `auto` token the developer typed — passed rather than re-derived, so the script reaches a lane's conclusion knowing which half of contracts.md's branch applies; `maxFixCycles` is the profile's **Fix cycles** key and `suiteCommand` its **Full-suite command**, both ask-then-persisted before this first runs and passed verbatim — never a literal here, and a `none` or omitted `suiteCommand` makes every sub-lane's suite **not run**. Each lane is `{ issue, issueBody (the body Act 0 fetched, verbatim), planPath (ABSOLUTE — .scratch exists only in the main tree), subLanes: [{ branch, worktree (absolute), base, area, commits: [{ordinal, message}] }] }`. Mode A: the same lanes through the same state machine per contracts.md. A lane's subLanes array contains only THIS wave's sub-lanes — later-wave sub-lanes of the same issue go into the next wave's args.

Build each sub-lane's `commits` from the plan's `## Commit / PR breakdown`: the entries belonging to that sub-lane's PR, in plan order; `ordinal` = 1-based position within the whole breakdown; `message` verbatim from the plan. Omit commits Act 0 already found in the branch's git log (resume).

Per lane (lanes parallel; sub-lanes and commits sequential): writer Mode 1 per commit → on FAILED the debugger diagnoses and routes → reviewer on the sub-lane's range, with the issue body in for its Spec axis → fix cycles with dispute/arbitration handling → the suite gate on the sub-lane's worktree, a red suite diagnosed by the debugger before any writer fix and re-run under its own bounds → commit-breakdown check. The Spec axis's per-criterion verdicts are reported and never blocking — like the commit-breakdown counts, they ride out to Gate 2 and the PR body without ever triggering a fix cycle or halting a lane. Every loop is bounded and every bound, route, and ending is in contracts.md — enforce them exactly. Each sub-lane finishes clean or ends carrying one of contracts.md's two labels: **HALT** (something deliberately stopped) or **FAILED** (something broke). Report the ending in those words, with its stage and its attempt log; the label explains and **decides nothing** — Gate 2 disposes of an ended sub-lane the same way whichever label it carries. An ending ends its own sub-lane, so the lane's later sub-lanes still run and no ending kills the batch.

The commit-breakdown check is YOUR work, not an agent's: at the end of each sub-lane compare the plan's commit ordinals you passed in against the commits the writers reported making, and carry the result as `<n> planned, <m> made`. Mode W gets it back on each sub-lane result; Mode A does the same list diff in plain reading. A mismatch never halts the lane and never triggers a fix cycle — fix cycles legitimately append commits and a writer may legitimately split one.

Between waves (asks under `gated` only): run Gate 2 for the wave's finished lanes FIRST (push/PR offers — see below), then ask authorization to proceed: "the next wave builds on <branches> — proceed, or hold while you review them yourself?" The user may inspect the finished worktrees at leisure — the loop waits, and findings they raise go to the writer's Mode 2 before any dependent wave starts. Only after authorization, provision the next wave's worktrees (Act 2) from the completed bases. A dependent lane whose base ended — or was held by the user — never runs, so it ends **HALT** with that reason.

## Gate 2 — push & PR (per wave; asks under `gated` only; PushNotification first)

Gate 2 fires at the end of EVERY wave, for every sub-lane that wave finished — clean or ended, both offered here on the same terms — never hold a finished lane until the whole batch ends: its PR should start CI and human review immediately, and the user must get a vet point before dependent waves build on it. A batch with no stacking has one wave, and therefore exactly one Gate 2. Per sub-lane, show: commit list (a `wip:` commit is abandoned work the writer committed as evidence — listed, never counted), the planned-versus-made commit counts (`<n> planned, <m> made` — informational, never a blocker), deviation counts, the **acceptance criteria** — the reviewer's `met | partial | not-met` verdict per criterion with its evidence, also informational — and the **findings ledger** — fixed findings / won't-fix (disputed by the writer, retracted by the reviewer, with the writer's reason) / reviewer NOTES / the **attempt log** on a sub-lane that ended (see below) — and the **suite result** per sub-lane: `passed`, `failed` with its failing test identifiers, or `not run` with why (never shown as passed). For sub-lanes that ended on contested findings, present both sides of each contested finding and ask the user to arbitrate: uphold the finding (send it back through the writer as a targeted fix and resume the sub-lane) or accept the dispute (record it as won't-fix, documented). AskUserQuestion: approve / hold. On approve, per sub-lane in order:

1. `git -C <worktree> rev-list --count <base>..<branch>` (`<base>` as Act 2 provisioned it), then `git -C <worktree> push -u origin <branch>` when the count is non-zero. Zero means nothing landed — not even a `wip:` commit — so there is nothing to push and no PR to open: report it and move to the next. Ask git, never the reported commit list, which is what the writers claimed rather than what the branch holds.
2. `gh pr create --head <branch> --base <base-branch> --title "<per the profile's title format>" --body ...` — `<base-branch>` is `<DEFAULT>` for default-based lanes (NEVER `origin/<DEFAULT>` — gh rejects remote-tracking refs) or the stack base's branch name. A sub-lane that ended gets no PR by default: offer "open a draft PR anyway?" and, if the user takes it, run the same command with `--draft`. Body: the profile's body template, which must carry these core elements — `Closes #<n>` (first sub-lane only; later sub-lanes reference the issue without closing it), a **Context** section carrying the plan's summary bullets (the architect's orientation, retained from Phase A whether or not Gate 1 fired) beside the planned-versus-made commit counts (`<n> planned, <m> made`), an **Acceptance criteria** section (one line per criterion — `met` / `partial` / `not-met`, the criterion, and its evidence — verbatim from the reviewer, so the human merging sees which criteria are demonstrably met rather than inferring it from the diff; omitted when the reviewer returned none), a **Review findings** section (count of fixed findings, each won't-fix finding with the writer's reason, and the reviewer's NOTES verbatim, so everything deliberately left untouched is visible to human PR reviewers), a **Suite** line (the gate's state for this sub-lane — `passed`, `failed` with its failing test identifiers, or `not run` with why; a suite that never ran says so rather than reading as green), an **Attempt log** section on a sub-lane that ended (the ledger's, in order, so a draft PR carries what the pipeline tried; omitted on a clean sub-lane) — then the footer:

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

3. After a clean sub-lane's push + PR succeed, remove its worktree immediately: `git worktree remove <WORKTREES>/<slug>` — never `--force`. A refusal means it left work behind: report `git -C <wt> status --porcelain` verbatim and keep that worktree. NEVER target MAIN: before any removal, confirm the path is NOT the first entry of `git worktree list`. The local branch and the plan file stay (`/dev-loop cleanup` reaps those once the PR merges). A sub-lane that ended keeps its worktree whether or not it was pushed — it is what a review or a resume reads — and so does a held lane. A run whose sub-lanes all finished clean and were approved ends with ONLY the main worktree remaining.

Stacked lanes: PR base is the base lane's branch; note the stack in the body ("Stacked on #<A>'s PR — rebase onto <DEFAULT> after it merges"). Removing the base lane's worktree does not affect a stacked lane — it branches from the base's _branch_, which survives worktree removal.

Ended sub-lanes: report the label (**HALT** — something deliberately stopped; **FAILED** — something broke), the stage, the reason (verbatim contract lines), the diagnosis if a debugger produced one, the attempt log in order, and the exact resume command — `/dev-loop <n>` re-derives everything. The label explains the ending and decides nothing: the two are offered the same push, the same draft-PR question and the same kept worktree.

## Cleanup mode (`/dev-loop cleanup`)

1. `git fetch origin <DEFAULT>`.
2. For every worktree under `<WORKTREES>`: if its branch's PR is merged (`gh pr view <branch> --json state,mergedAt`) or the branch is fully merged into origin/<DEFAULT>: `git worktree remove <path>`, delete the local branch, and delete the lane's plan file `.scratch/*/plans/<n>-*.md` (plans are temporary artifacts).
3. NEVER remove a worktree with uncommitted changes — list it instead.
4. NEVER touch MAIN (the first entry of `git worktree list`) — it is not a candidate under any condition; only worktrees under `<WORKTREES>` are.
5. Report a table: removed / kept / why.

## Hard rules

- Invoking `/dev-loop` IS the user's explicit opt-in to multi-agent orchestration. Enter Phase A and Phase B directly — NEVER pause to ask whether to run them; running a phase is NOT a gate. The ONLY human gates in this pipeline are Gate 1 (plan approval) and Gate 2 (push/PR), and under `unattended` neither asks anything. The one-time ask-then-persist preconditions are not gates and survive both modes: the profile's keys, `.worktreeinclude`, and the runner setting Act 0 asks about — each asked once ever, and each with somewhere durable to record the answer.
- Never proceed past a gate without explicit user approval, unless the run mode is `unattended`.
- **Append-only, whoever is watching.** The run may append to issues and pull requests (`gh issue comment`, `gh pr comment`), may add and remove its own workflow labels and no others, and may set state only on artifacts it created — its own branches, its own PRs, its own plan files. It NEVER edits an issue body, NEVER ticks an acceptance-criteria checkbox, and NEVER converts a pull request a human opened. Per-criterion verdicts are *reported*, never written back to the issue's checklist — contracts.md's **Append-only invariant** carries the reasoning.
- NEVER remove, force-modify, or `rm -rf` the main worktree (first entry of `git worktree list`). Worktree removal applies only to worktrees under `<WORKTREES>`, and only via `git worktree remove` without `--force`.
- A lane worktree is a cold checkout plus its `.worktreeinclude` files and whatever the Setup command installs. Everything else an agent needs — skills, roster, settings, permissions — it already has: it runs in a session rooted in MAIN whatever directory it works in.
- Never run agents for work you can do with one Bash command (provisioning, pushing), and never do agent work (planning, coding, reviewing) yourself.
- Plan paths passed to agents are always ABSOLUTE.
- If the session dies mid-run, `/dev-loop <same issues>` resumes from artifacts — do not keep separate state files.
- Never write a repository name, absolute path, or project-specific fact into this skill or its bundled agents — repo facts belong to the repo profile and the repo's own docs. The skill folder must stay copyable to any machine as-is.
