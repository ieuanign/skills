---
name: dev-loop
description: Issue-to-PR pipeline over the custom agent roster — plans, implements, reviews, and signs off one or more GitHub issues, each in its own git worktree, with parallel lanes and human gates at plan approval and push/PR. Use when the user invokes /dev-loop with issue numbers, wants an issue worked end-to-end, or says "/dev-loop cleanup".
---

# /dev-loop — issue-to-PR pipeline

You are the orchestrator. You stay in the MAIN worktree and never write code, plan, review, or debug yourself — the agents do (architecture-engineer, code-writer, reviewer, debugger, and their -lite variants). You do: intake, gates, worktree provisioning, push, PRs, cleanup. All agent returns are machine-readable — trust the contract keys (`STATUS/RESULT/VERDICT/OWNER`), not vibes. The pipeline's state machine (role contracts, cycle caps, halt conditions) is specified in `<this-skill-dir>/contracts.md` — normative for BOTH execution modes; read it before Phase B.

This skill is repo- and machine-agnostic: it hardcodes no repository name, path, or project fact. Everything it needs is derived below or read from the repo profile.

## Arguments

`/dev-loop <issues> [lite] [project:<slug>]`

- `<issues>` — one or more GitHub issue numbers, comma or space separated. One issue = one lane; several = parallel lanes.
- `lite` — swaps architecture-engineer→architecture-engineer-lite and code-writer→code-writer-lite for the whole run. Only when the user says it (bandwidth ≤25%); NEVER infer it.
- `project:<slug>` — optional project slug passed to the architect for the plan path.
- `/dev-loop cleanup` — run Cleanup mode (bottom) instead of the pipeline.

## Derived facts (compute once at Act 0 — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **REPO** — `basename` of MAIN.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<parent of MAIN>/worktree/<REPO>/`. Every lane worktree lives here; the directory slug is the branch name after its first `/` (`feat/208` → `<WORKTREES>/208`).
- **GitHub repo** — never pass `--repo`: every `gh` command runs inside a checkout of this repo (worktrees included), and gh infers the repository from the remote.
- **Fast copy** — macOS: `/bin/cp -Rc` (APFS clonefile, instant; MUST be `/bin/cp` — a GNU cp on PATH rejects `-c`); Linux: `cp -R --reflink=auto`; anywhere else: plain `cp -R`.

## Repo profile — `docs/agents/dev-loop.md` (ask-then-persist)

The per-repo config, read at Act 0. Optional: a repo without one runs on pure defaults. The rule for every non-derivable value: when a run first NEEDS it and the profile lacks it, AskUserQuestion ONCE, persist the answer into the profile (create the file if needed), and never ask again — a persisted "none" counts as an answer. Never store derivable facts there.

Profile keys:

- **Branch template** — default offered: `feat/{issue}`, sub-lanes `feat/{issue}-{area}`. Asked on the first run in a repo.
- **PR title format** — default: `<type>(<scope>): #<issue> - <title>`.
- **PR body template** — asked at the first Gate 2; whatever its shape, the core elements in Gate 2 below must survive.
- **Provisioning copy rules** — per package directory: which untracked files (env files, local config) to copy into its worktrees. Asked the first time a lane touches a package dir with no recorded rule.
- **Constraints** — free-form repo cautions (e.g. "backend tests share one database — never run two backend lanes concurrently"). Honor them when deciding lanes vs waves (Gate 1) and when provisioning (Act 2).

## Execution modes (detect at Act 0)

- **Mode W** — the Workflow tool is in your toolset: run the phase scripts exactly as Act 1 / Act 3 describe.
- **Mode A** — no Workflow tool: you drive the same state machine yourself with the Agent tool, per contracts.md. Phase A: one background architecture-engineer per issue, in parallel; collect their returns. Phase B: lanes in parallel, each lane's steps sequential (writer per commit → debugger routing on FAILED → reviewer cycles → architect sign-off), enforcing every cap and halt from contracts.md yourself. The agents already end with machine-readable leading lines — parse those as the contract keys.
- Behavior changes edit contracts.md FIRST, then both implementations (the phase scripts and Mode A) in the same change.

## Act 0 — Intake (before any agent runs)

1. Compute the Derived facts, read the repo profile (first run in a repo: ask-then-persist the branch template), detect the execution mode.
2. Roster check: architecture-engineer(-lite), code-writer(-lite), reviewer, and debugger must exist in `MAIN/.claude/agents/`. Copy any that are missing from `<this-skill-dir>/agents/` and tell the user.
3. `git fetch origin <DEFAULT>` once.
4. Per issue: `gh issue view <n> --json number,title,body,state,labels`. CLOSED → drop the lane, tell the user.
5. Parse each body's "Blocked by" section: a blocker that is still open and NOT in this batch → refuse that lane (report why); a blocker inside the batch → record the ordering (it becomes a stacked lane at Gate 1).
6. Stateless resume check per issue — derive the stage from artifacts, never from memory:
   - Plan file exists with `Status: READY` → skip Phase A for that lane (offer replan if the user asks).
   - Plan commit messages already in `git log` of the lane's branch → those commits are done.
   - Plan file has a `## Conformance sign-off` section naming a sub-lane's ref → THAT sub-lane jumps to Gate 2; other sub-lanes resume at their own derived stage (sign-offs are per sub-lane, appended to the same plan file).
   - A worktree already exists for the branch → reuse it as-is.

## Act 1 — Phase A: plans

Mode W: run the Workflow tool with `scriptPath: <this-skill-dir>/phase-plan.js` and `args: { issues: [{number, title, project, answers?}], lite }`. Mode A: the equivalent parallel architect runs per contracts.md. One architect per issue, parallel. Each returns `{status, planPath, summary, openQuestions}`. A lane returning `status: DIED` means its architect crashed — report it at Gate 1 and offer a re-run; never silently drop a requested issue.

## Gate 1 — plan approval (ONE batch interruption; PushNotification first)

Present every lane: summary, plan path (invite the user to edit the file before approving), open questions. Then:

- **BLOCKED plans**: relay the open questions via AskUserQuestion, re-run only those lanes' architects with `answers` filled in, re-present.
- **Touchpoint overlap**: intersect the plans' File touchpoints across lanes yourself (plain reading, no agent). Additive shared file (both append to a registry/route file) → note it, keep parallel. Real dependency (B consumes what A creates) → AskUserQuestion per case with **"stack B on A's branch" as the first/recommended option** and "defer B out of this batch" as the alternative. Post the discovery back to the dependent GitHub issue: `gh issue comment <B> --body "Discovered blocker: depends on #<A> — overlapping files: ..."`.
- **Profile Constraints**: apply them now — lanes a constraint forbids from running concurrently go into separate waves (or one is deferred), and say so.
- **Multi-PR plans**: the lane splits into sub-lanes, sequential, in the plan's order (e.g. migration → backend → frontend). First sub-lane branch from the branch template, later ones with the `-<area>` suffix, each based on the previous sub-lane's branch when the plan says the code depends on it, else `origin/<DEFAULT>`.

Only lanes the user approves proceed. Drop the rest with a note.

## Act 2 — Provisioning (you, plain Bash — no agents)

Wave logic: **anything based on origin/<DEFAULT> runs in wave 1; anything based on a branch that gets its commits in wave N runs in wave N+1** — this applies to stacked _lanes_ AND to dependent _sub-lanes_ within one lane (a frontend sub-lane based on its own backend sub-lane's branch waits for the next wave; provisioning it earlier would capture a base with zero feature commits). Provision a wave only after its bases completed the previous wave. For each sub-lane in the current wave:

1. `git worktree add <WORKTREES>/<slug> -b <branch> <base>`. Base is `origin/<DEFAULT>` or the stack/sub-lane base branch. On resume: an existing worktree is reused as-is; an existing branch WITHOUT a worktree reattaches with `git worktree add <WORKTREES>/<slug> <branch>` (no `-b` — the `-b` form errors on an existing branch).
2. `cp -R <MAIN>/.claude <wt>/` (the CLAUDE.md layer must exist in the worktree).
3. Dependencies, automatic: for each plan-touched directory that has a `package.json`, fast-copy its `node_modules` from MAIN when present there. Then apply the profile's copy rules for the touched dirs; a touched package dir with no recorded rule triggers the ask-then-persist question. Skip both for lanes that touch no package dir.
4. More than 4 lanes needing `node_modules` copies → warn about disk before proceeding.

## Act 3 — Phase B: execute

Per wave, Mode W: run the Workflow tool with `scriptPath: <this-skill-dir>/phase-execute.js` and `args: { lanes, lite, maxFixCycles: 2 }` where each lane is `{ issue, planPath (ABSOLUTE — .scratch exists only in the main tree), subLanes: [{ branch, worktree (absolute), base, area, commits: [{ordinal, message}] }] }`. Mode A: the same lanes through the same state machine per contracts.md. A lane's subLanes array contains only THIS wave's sub-lanes — later-wave sub-lanes of the same issue go into the next wave's args.

Build each sub-lane's `commits` from the plan's `## Commit / PR breakdown`: the entries belonging to that sub-lane's PR, in plan order; `ordinal` = 1-based position within the whole breakdown; `message` verbatim from the plan. Omit commits Act 0 already found in the branch's git log (resume).

Per lane (lanes parallel; sub-lanes and commits sequential): writer Mode 1 per commit → on FAILED the debugger diagnoses and routes → reviewer on the sub-lane's range → fix cycles with dispute/arbitration handling → architect Mode 2 conformance sign-off. Every loop is bounded and every bound, route, and halt condition is in contracts.md — enforce them exactly. A halted lane never kills the batch — it reports its stage and the batch continues.

Between waves: run Gate 2 for the wave's completed lanes FIRST (push/PR offers — see below), then ask authorization to proceed: "the next wave builds on <branches> — proceed, or hold while you review them yourself?" The user may inspect the finished worktrees at leisure — the loop waits, and findings they raise go to the writer's Mode 2 before any dependent wave starts. Only after authorization, provision the next wave's worktrees (Act 2) from the completed bases. A dependent lane whose base halted (or was held by the user) is halted too, with that reason.

## Gate 2 — push & PR (per wave; PushNotification first)

Gate 2 fires at the end of EVERY wave, for that wave's completed lanes — never hold a finished lane until the whole batch ends: its PR should start CI and human review immediately, and the user must get a vet point before dependent waves build on it. A batch with no stacking has one wave, and therefore exactly one Gate 2. Per completed lane, show: sign-off verdict, commit list, deviation counts, and the **findings ledger** — fixed findings / won't-fix (disputed by the writer, retracted by the reviewer, with the writer's reason) / reviewer NOTES. For lanes halted NEEDS ARBITRATION, present both sides of each contested finding and ask the user to arbitrate: uphold the finding (send it back through the writer as a targeted fix and resume the lane) or accept the dispute (record it as won't-fix, documented). AskUserQuestion: approve / hold. On approve, per sub-lane in order:

1. `git -C <worktree> push -u origin <branch>`.
2. `gh pr create --head <branch> --base <base-branch> --title "<per the profile's title format>" --body ...` — `<base-branch>` is `<DEFAULT>` for default-based lanes (NEVER `origin/<DEFAULT>` — gh rejects remote-tracking refs) or the stack base's branch name. Body: the profile's body template, which must carry these core elements — `Closes #<n>` (first sub-lane only; later sub-lanes reference the issue without closing it), the plan's summary bullets, the sign-off verdict, a **Review findings** section (count of fixed findings, each won't-fix finding with the writer's reason, and the reviewer's NOTES verbatim, so everything deliberately left untouched is visible to human PR reviewers) — then the footer:

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

3. After the lane's push + PR succeed, remove its worktrees immediately: `git worktree remove <WORKTREES>/<slug>` per sub-lane — never `--force`; if it refuses over stray non-ignored files, report them and keep the worktree. NEVER target MAIN: before any removal, confirm the path is NOT the first entry of `git worktree list`. The local branch and the plan file stay (`/dev-loop cleanup` reaps those once the PR merges). Held and halted lanes KEEP their worktrees for review/resume. A fully approved run ends with ONLY the main worktree remaining.

Stacked lanes: PR base is the base lane's branch; note the stack in the body ("Stacked on #<A>'s PR — rebase onto <DEFAULT> after it merges"). Removing the base lane's worktree does not affect a stacked lane — it branches from the base's _branch_, which survives worktree removal.

Halted lanes: report the stage, the reason (verbatim contract lines), and the exact resume command — `/dev-loop <n>` re-derives everything.

## Cleanup mode (`/dev-loop cleanup`)

1. `git fetch origin <DEFAULT>`.
2. For every worktree under `<WORKTREES>`: if its branch's PR is merged (`gh pr view <branch> --json state,mergedAt`) or the branch is fully merged into origin/<DEFAULT>: `git worktree remove <path>`, delete the local branch, and delete the lane's plan file `.scratch/*/plans/<n>-*.md` (plans are temporary artifacts).
3. NEVER remove a worktree with uncommitted changes — list it instead.
4. NEVER touch MAIN (the first entry of `git worktree list`) — it is not a candidate under any condition; only worktrees under `<WORKTREES>` are.
5. Report a table: removed / kept / why.

## Hard rules

- Invoking `/dev-loop` IS the user's explicit opt-in to multi-agent orchestration. Enter Phase A and Phase B directly — NEVER pause to ask whether to run them; running a phase is NOT a gate. The ONLY human gates in this pipeline are Gate 1 (plan approval), Gate 2 (push/PR), and the profile's one-time ask-then-persist questions.
- Never proceed past a gate without explicit user approval.
- NEVER remove, force-modify, or `rm -rf` the main worktree (first entry of `git worktree list`). Worktree removal applies only to worktrees under `<WORKTREES>`, and only via `git worktree remove` without `--force`.
- Never run agents for work you can do with one Bash command (provisioning, pushing), and never do agent work (planning, coding, reviewing) yourself.
- `lite` only on explicit request — never infer bandwidth.
- Plan paths passed to agents are always ABSOLUTE.
- If the session dies mid-run, `/dev-loop <same issues>` resumes from artifacts — do not keep separate state files.
- Never write a repository name, absolute path, or project-specific fact into this skill or its bundled agents — repo facts belong to the repo profile and the repo's own docs. The skill folder must stay copyable to any machine as-is.
