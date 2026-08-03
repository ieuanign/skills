---
name: dev-loop
description: Issue-to-PR pipeline over the custom agent roster — plans, implements, and reviews one or more GitHub issues, each in its own git worktree, with parallel lanes and human gates at plan approval and push/PR. Use when the user invokes /dev-loop with issue numbers, wants an issue worked end-to-end, says "/dev-loop auto" for an unattended run that never stops for approval, or says "/dev-loop cleanup".
---

# /dev-loop — issue-to-PR pipeline

You are the orchestrator. You stay in the MAIN worktree and never write code, plan, review, or debug yourself — the agents do (architecture-engineer, code-writer, reviewer, debugger). You do: intake, gates, worktree provisioning, push, PRs, cleanup — and, under `unattended`, the notifications at your own boundaries. The fifth roster agent, the **notifier**, is not one you dispatch: `phase-execute.js` dispatches it mid-script for a lane that ends, because you are blind while a script runs. `notifications.md` governs who writes what. All agent returns are machine-readable — trust the contract keys (`STATUS/RESULT/VERDICT/OWNER`), not vibes. The pipeline's state machine (role contracts, cycle caps, endings) is specified in `<this-skill-dir>/contracts.md` — normative for BOTH execution modes; read it before Phase B.

This skill is repo- and machine-agnostic: it hardcodes no repository name, path, or project fact. Everything it needs is derived below or read from the repo profile.

## Arguments

`/dev-loop [auto] <issues> [project:<slug>]`

- `auto` — optional leading token: run the batch **unattended**, from filed issue to pushed PR, without stopping for approval. Modes lead and dials trail — the shape `cleanup` already has — so the word deciding whether you will ever be asked for approval is the second one you type.
- `<issues>` — one or more GitHub issue numbers, comma or space separated. One issue = one lane; several = parallel lanes.
- `project:<slug>` — optional project slug passed to the architect for the plan path.
- `/dev-loop cleanup` — run Cleanup mode (bottom) instead of the pipeline.

### Run mode — `gated` or `unattended`

`auto` present ⇒ **unattended**; absent ⇒ **gated**. Act 0 parses it ONCE and carries it as a single value for the whole run — no later stage re-derives it from the arguments. It is contracts.md's **Lane conclusion** branch, and in this file it decides exactly three things:

> **Gate suppression.** Both gates raise their questions under `gated`, and neither raises any under `unattended`. This line is the only place that is decided: no argument and no profile key overrides it.

> **Notifications.** Under `unattended` you emit `notifications.md`'s host-owned events, at the three boundaries marked **⟨notify⟩** below. Under `gated` you emit none of them. This line is the only place that is decided too: each ⟨notify⟩ boundary says *what* to run and never *whether*, so the guard cannot drift apart across three sites. `notifications.md` governs what each event says, which label role it writes, and in what order — nothing about that is restated here.

> **Cost log.** Under `unattended` you write Act 4's per-lane cost log. Under `gated` you write none, and a supervised run is otherwise untouched. This line is the only place that is decided as well — Act 4 says what to write and never whether, and the transcript directories it needs are captured under both modes because remembering a string is free and a guard split across two sites is not.

**Suppression removes the questions, not the work.** Every step of both gates still runs; each question resolves to its unattended answer instead:

| Question | Its unattended answer |
|---|---|
| Gate 1 — which lanes are approved? | every lane whose plan is `READY` proceeds |
| Gate 1 — a `BLOCKED` plan's open questions | nobody can answer them, so that lane does not proceed and is reported carrying them |
| Gate 1 — stack a dependent lane, or defer it? | defer it out of the batch — deciding overlaps without a human is specified separately |
| Gate 2 — is the push/PR approved? | the sub-lane pushes and opens the PR its `terminal` names — ready, draft, or none |
| Gate 2 — open a draft PR for a sub-lane that ended? | yes, `--draft` — an ended sub-lane is never ready, and work that exists stays reviewable |
| Gate 2 — arbitrate a contested finding | nobody rules, so the ledger's **arbitrated** category stays empty and the finding rides out to the PR body |
| Between waves — authorize the next wave? | it proceeds |

A gate's `PushNotification` goes with its question — it exists to summon someone to a gate, and under `unattended` nobody is being summoned. What an unattended run does emit instead is `notifications.md`'s, governed entirely there.

### How you write a ⟨notify⟩ event — the mechanism only

Read `notifications.md` before you emit anything. It decides what each event says, which label role it takes, in what order, and what happens when a write fails — and this section adds none of that. What follows is the command for each, and nothing else.

- **A label is `gh issue edit <n> --add-label/--remove-label`.** Resolve its three roles to strings ONCE at Act 0, through the repo's own `docs/agents/triage-labels.md`, per that file's roles-never-strings rule. No label string is ever written into this skill.
- **A comment is `gh issue comment <n> --body-file -`**, with the body piped in from a **quoted** heredoc (`<<'BODY'`). Never `--body "<text>"`: the bodies carry agent-generated free text — reasons, diagnoses, stack traces — full of backticks, dollar signs and quotes, which a composed shell string mangles or executes.
- **A message is `<this-skill-dir>/notify.sh <<'MSG' … MSG`**, which reads its payload on standard input for that same reason. It implements the specification's channel contract, so an unconfigured channel is already handled inside it: never check for one, never ask about it, and never add a profile key for it.

Touchpoint intersection, sub-lane splitting, the profile's Constraints, the push and the PR itself are gate *work*, and happen identically under both modes. The one-time ask-then-persist preconditions are not gates and fire under both. What a sub-lane's *ending* means for its PR's state — ready, draft, or none — is contracts.md's **terminal-state table**, which the phase script has already applied: every sub-lane result carries a `terminal` of `{pr, push, reasons}`, so under `unattended` you open what it names rather than deciding it here.

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
9. **⟨notify⟩ Lane start.** For every lane that survived steps 6–8 — so a dropped or refused lane is never marked as being worked — add the in-progress label and send the started message, per lane. This is the LAST step of Act 0, and that position is the point: both writes land before a single token is spent, so a session that dies anywhere in Phase A still leaves the marker on the issue. The label is also a claim marker, which is a bonus rather than a design: a separate orchestration system refuses any issue wearing one, so the two get mutual exclusion for free. `notifications.md` records the hazard that comes with it — do not solve it here.

## Act 1 — Phase A: plans

Mode W: run the Workflow tool with `scriptPath: <this-skill-dir>/phase-plan.js` and `args: { issues: [{number, title, project, answers?}] }`. Mode A: the equivalent parallel architect runs per contracts.md. One architect per issue, parallel. Each returns `{status, planPath, summary, openQuestions}`. A lane returning `status: DIED` means its architect crashed — report it at Gate 1 and offer a re-run; never silently drop a requested issue.

**KEEP the transcript directory this invocation reports** (Mode W only — Mode A has none), alongside every later one. Act 4 feeds them all to the cost report, and planning is the invocation whose cost is easiest to lose: it is roughly three tenths of a lane and it lands in a different directory from execution's.

KEEP each lane's `summary` bullets for the rest of the run. They are the architect's orientation, and Gate 2 puts them in the PR body's Context section — so they must survive whether or not Gate 1 fires, and are not consumed by presenting them there.

**⟨notify⟩ Plan comment.** Per lane, comment the plan's summary bullets and the architect's open questions on the issue. **Never the plan file** — it survives on disk at tens of kilobytes, no agent ever reads this comment (the writer and the reviewer both take the plan from disk), and inlining it buries the thread to serve nobody. On the clean path this is the lane's one comment; a lane that ends later gets one more, the notifier's, and no others. Pass `planPath` in the comment so a human can open the real thing.

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

Per wave, Mode W: run the Workflow tool with `scriptPath: <this-skill-dir>/phase-execute.js` and `args: { lanes, mode, maxFixCycles, suiteCommand, skillDir }` — the lane list, the mode, the fix-cycle count, the suite command and this skill's own folder, and nothing else. `skillDir` is `<this-skill-dir>` as an ABSOLUTE path: a workflow script cannot see where it was loaded from, and the notifier it dispatches needs `notifications.md` and `notify.sh` by path. Omit it and no notifier is dispatched — one with no specification to read writes worse than nothing. `mode` is the run mode Act 0 parsed — literally `gated` or `unattended`, never the `auto` token the developer typed — passed rather than re-derived, so the script reaches a lane's conclusion knowing which half of contracts.md's branch applies; `maxFixCycles` is the profile's **Fix cycles** key and `suiteCommand` its **Full-suite command**, both ask-then-persisted before this first runs and passed verbatim — never a literal here, and a `none` or omitted `suiteCommand` makes every sub-lane's suite **not run**. Each lane is `{ issue, issueBody (the body Act 0 fetched, verbatim), planPath (ABSOLUTE — .scratch exists only in the main tree), subLanes: [{ branch, worktree (absolute), base, area, commits: [{ordinal, message}] }] }`. Mode A: the same lanes through the same state machine per contracts.md. A lane's subLanes array contains only THIS wave's sub-lanes — later-wave sub-lanes of the same issue go into the next wave's args.

Build each sub-lane's `commits` from the plan's `## Commit / PR breakdown`: the entries belonging to that sub-lane's PR, in plan order; `ordinal` = 1-based position within the whole breakdown; `message` verbatim from the plan. Omit commits Act 0 already found in the branch's git log (resume).

Per lane (lanes parallel; sub-lanes and commits sequential): writer Mode 1 per commit → on FAILED the debugger diagnoses and routes → reviewer on the sub-lane's range, with the issue body in for its Spec axis → fix cycles with dispute/arbitration handling → the suite gate on the sub-lane's worktree, a red suite diagnosed by the debugger before any writer fix and re-run under its own bounds → commit-breakdown check. The Spec axis's per-criterion verdicts are reported and never blocking — like the commit-breakdown counts, they ride out to Gate 2 and the PR body without ever triggering a fix cycle or halting a lane. Every loop is bounded and every bound, route, and ending is in contracts.md — enforce them exactly. Each sub-lane finishes clean or ends carrying one of contracts.md's two labels: **HALT** (something deliberately stopped) or **FAILED** (something broke). Report the ending in those words, with its stage and its attempt log; the label explains and **decides nothing** — Gate 2 disposes of an ended sub-lane the same way whichever label it carries. An ending ends its own sub-lane, so the lane's later sub-lanes still run and no ending kills the batch.

**KEEP each wave's transcript directory too**, exactly as Act 1 says — a lane whose sub-lanes span waves has its records spread across one directory per wave, and Act 4 wants all of them.

Mode W's per-LANE result carries two flags Gate 2's step 4 reads and nothing else does: `crashed`, true when that lane's closure threw, and `notified`, true when the notifier **applied** that lane's label at its ending — never merely attempted it. Under `gated` both are always false, nothing writing a label there. Each lane's arg accepts `notified` back, so a lane whose sub-lanes span waves is not notified twice; carry it from the previous wave's result.

Mode W's per-sub-lane result carries a `terminal` of `{pr: 'ready'|'draft'|'none', reasons}` — contracts.md's terminal-state table, already applied to that sub-lane's own inputs. Carry it to Gate 2 unchanged: under `unattended` it is what step 2 below opens, and `reasons` is what a draft PR body explains itself with. It carries no push column, because git decides that and you ask git in step 1. Mode A needs no equivalent, and neither does a `gated` run: there the human at Gate 2 decides, and the table is not read.

The commit-breakdown check is YOUR work, not an agent's: at the end of each sub-lane compare the plan's commit ordinals you passed in against the commits the writers reported making, and carry the result as `<n> planned, <m> made`. Mode W gets it back on each sub-lane result; Mode A does the same list diff in plain reading. A mismatch never halts the lane and never triggers a fix cycle — fix cycles legitimately append commits and a writer may legitimately split one.

Between waves (asks under `gated` only): run Gate 2 for the wave's finished lanes FIRST (push/PR offers — see below), then ask authorization to proceed: "the next wave builds on <branches> — proceed, or hold while you review them yourself?" The user may inspect the finished worktrees at leisure — the loop waits, and findings they raise go to the writer's Mode 2 before any dependent wave starts. Only after authorization, provision the next wave's worktrees (Act 2) from the completed bases. A dependent lane whose base ended — or was held by the user — never runs, so it ends **HALT** with that reason.

## Gate 2 — push & PR (per wave; asks under `gated` only; PushNotification first)

Gate 2 fires at the end of EVERY wave, for every sub-lane that wave finished — clean or ended, both offered here on the same terms — never hold a finished lane until the whole batch ends: its PR should start CI and human review immediately, and the user must get a vet point before dependent waves build on it. A batch with no stacking has one wave, and therefore exactly one Gate 2. Per sub-lane, show: commit list (a `wip:` commit is abandoned work the writer committed as evidence — listed, never counted), the planned-versus-made commit counts (`<n> planned, <m> made` — informational, never a blocker), deviation counts, the **acceptance criteria** — the reviewer's `met | partial | not-met` verdict per criterion with its evidence, also informational — and the **findings ledger** — fixed findings / won't-fix (disputed by the writer, retracted by the reviewer, with the writer's reason) / reviewer NOTES / the **attempt log** on a sub-lane that ended (see below) — and the **suite result** per sub-lane: `passed`, `failed` with its failing test identifiers, or `not run` with why (never shown as passed). For sub-lanes that ended on contested findings, present both sides of each contested finding and ask the user to arbitrate: uphold the finding (send it back through the writer as a targeted fix and resume the sub-lane) or accept the dispute (record it as won't-fix, documented). AskUserQuestion: approve / hold. On approve, run steps 1–3 per sub-lane in order, then step 4 once per lane:

1. `git -C <worktree> rev-list --count <base>..<branch>` (`<base>` as Act 2 provisioned it), then `git -C <worktree> push -u origin <branch>` when the count is non-zero — **never `--force`, never `--force-with-lease`**, in either mode. Zero means nothing landed — not even a `wip:` commit — so there is nothing to push and no PR to open: report it and move to the next, and under `unattended` `gh issue comment <n>` the ending's explanation first, because this is the one ending in the pipeline with no pull request to carry it. Ask git, never the reported commit list, which is what the writers claimed rather than what the branch holds — the count settles the push AND overrides the sub-lane's proposed PR state in step 2. This is each sub-lane's ONE push: contracts.md records why per-commit push is not implementable, so do not reach for it. A rejected push stops this sub-lane's conclusion here — report git's message verbatim as a **FAILED** ending for that sub-lane (the pipeline's own assumption broke), open no PR, keep that worktree, and move to the next.
2. `gh pr create --head <branch> --base <base-branch> --title "<per the profile's title format>" --body ...` — `<base-branch>` is `<DEFAULT>` for default-based lanes (NEVER `origin/<DEFAULT>` — gh rejects remote-tracking refs) or the stack base's branch name. Under `unattended`, **whether that command carries `--draft` is the sub-lane's `terminal.pr`**, which contracts.md's terminal-state table already decided: `ready` opens a normal PR, `draft` adds `--draft`, and `none` opens nothing — except that step 1's count is the authority, so a `none` whose count came back non-zero is a branch that is ahead after all (a resume whose commits were already in the git log) and opens `--draft`, never ready. Put `terminal.reasons` in the body so a human landing on a draft sees which trigger fired. Under `gated` **nothing here changes and the table is not read**: a sub-lane that **ended** gets no PR by default and you offer "open a draft PR anyway?", running the same command with `--draft` if the user takes it, while a sub-lane that concluded clean gets its normal PR whatever its verdicts say — the human at this gate has just been shown them and is the one deciding. You set draft state ONLY on a PR you are creating: never convert one that already exists, whoever opened it. Body: the profile's body template, which must carry these core elements — `Closes #<n>` (first sub-lane only; later sub-lanes reference the issue without closing it), a **Context** section carrying the plan's summary bullets (the architect's orientation, retained from Phase A whether or not Gate 1 fired) beside the planned-versus-made commit counts (`<n> planned, <m> made`), an **Acceptance criteria** section (one line per criterion — `met` / `partial` / `not-met`, the criterion, and its evidence — verbatim from the reviewer, so the human merging sees which criteria are demonstrably met rather than inferring it from the diff; omitted when the reviewer returned none), a **Review findings** section (count of fixed findings, each won't-fix finding with the writer's reason, and the reviewer's NOTES verbatim, so everything deliberately left untouched is visible to human PR reviewers), a **Suite** line (the gate's state for this sub-lane — `passed`, `failed` with its failing test identifiers, or `not run` with why; a suite that never ran says so rather than reading as green), an **Attempt log** section on a sub-lane that ended (the ledger's, in order, so a draft PR carries what the pipeline tried; omitted on a clean sub-lane), and — on a draft — a **Why this is a draft** line per entry in `terminal.reasons`, at the top where the merger sees it first (the sections below it carry the detail; this says which of the four triggers fired without making them hunt, and is omitted on a ready PR, which has none) — then the footer:

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

3. Worktrees, per contracts.md's **worktree invariant** — removed when, and only when, the work reached the remote AND no human is expected to resume in it. Removal is `git worktree remove <WORKTREES>/<slug>` and is never `--force`, and it runs **only after that push succeeded**: after removal the remote branch is the only copy, so a push that failed or never ran keeps its worktree. A refusal means work was left behind — report `git -C <wt> status --porcelain` verbatim and keep that worktree; that refusal IS the dirty-work guard, so never argue with it. NEVER target MAIN: before any removal, confirm the path is NOT the first entry of `git worktree list`. The local branch and the plan file stay (`/dev-loop cleanup` reaps those once the PR merges). Which worktrees go:

   - a sub-lane that concluded **clean**, in both modes — removed once its push and PR succeeded;
   - a sub-lane that **ended**, under `unattended` — removed once its push succeeded, nobody being there to resume in it;
   - a sub-lane that **ended**, under `gated` — **kept**: the human is here and is expected to pick that branch up in this checkout;
   - a **held** sub-lane, or one whose push failed or found nothing to push — kept, having sent nothing to the remote.

   So an `unattended` run ends with ONLY the main worktree remaining unless a removal was refused or a push failed, and a `gated` run additionally keeps every worktree its human was offered and did not take.

4. **⟨notify⟩ Lane conclusion.** Once every sub-lane of a lane has been through steps 1–3, close that lane. Per lane, not per sub-lane — the label is per issue — and at the lane's LAST wave, so a lane whose sub-lanes span waves closes once rather than once a wave.

   **Remove the in-progress label, without exception**: finished, ended or thrown, the lane is no longer in progress. What replaces it — if anything — is `notifications.md`'s label rule, which is stated there and not here. Your job is to know which of its cases this lane is in, and the phase-script result already says, so nothing is inferred from prose:

   | The result says | Which case you are in |
   |---|---|
   | `notified: true` | the notifier already applied this lane's label at its ending. **Write nothing else** — a second verdict over the first is how two writers come to disagree in public. It is true only when a label actually landed, so `false` on an ended lane means the write did not happen and the case below applies. |
   | `crashed: true` | the lane's closure threw. Its attributed ending names the issue and carries the error, so the rule's break arm has something to point at. |
   | neither, and any sub-lane's `terminal.pr` was `draft` | a draft with no ending behind it — the rule names this one explicitly, and it is the host's precisely because no notifier ran. |
   | neither, and every PR opened ready | the rule's no-label case. |

   Then **send exactly one closing message**, carrying each PR's link and whether it opened ready or draft. Unconditional, including for a lane with no PR at all: paired with Act 0's started message it is the run's dead-session signal, since a start with no close — plus an issue still wearing in-progress — is a run that died where no code could catch it. A message that says nothing interesting still says the lane is over.

   A lane whose sub-lanes span waves reaches this step once, at its last. Carry its `notified` forward into the next wave's args so its ending is written once per run rather than once per wave.

   **What this cannot cover** is the session itself stopping: a rate limit, a closed terminal, a sleeping machine. No code runs, so nothing is caught, and only what already reached GitHub survives — which is why Act 0 writes the label before it spends a token. A watchdog is deliberately out of scope; the human typed this command and can see their own terminal.

Stacked lanes: PR base is the base lane's branch; note the stack in the body ("Stacked on #<A>'s PR — rebase onto <DEFAULT> after it merges"). Removing the base lane's worktree does not affect a stacked lane — it branches from the base's _branch_, which survives worktree removal.

Ended sub-lanes: report the label (**HALT** — something deliberately stopped; **FAILED** — something broke), the stage, the reason (verbatim contract lines), the diagnosis if a debugger produced one, the attempt log in order, and the exact resume command — `/dev-loop <n>` re-derives everything. The label explains the ending and decides nothing: under `gated` the two are offered the same push, the same draft-PR question and the same kept worktree, and under `unattended` both reach the terminal-state table as the same row.

## Act 4 — the cost log (per the Run mode guard: `unattended` only)

Once the LAST wave's Gate 2 is done and the run has nothing left to do, write one cost log per lane. Here and not per wave: a lane's records are spread across every invocation it touched, so a per-wave log would report a fraction of a lane and call it the total.

Per issue **the run was asked to work** — the list Act 0 parsed, before anything dropped or refused a lane:

```bash
mkdir -p <MAIN>/.scratch/dev-loop-cost
node <this-skill-dir>/cost-report.mjs --issues <n> <transcriptDir>... \
  > <MAIN>/.scratch/dev-loop-cost/<n>.txt \
  || rm -f <MAIN>/.scratch/dev-loop-cost/<n>.txt
```

The `rm` is the point of the `||`: a redirect creates its file before the command runs, so a failure without it leaves a zero-byte log — which reads as a lane that was measured and found to cost nothing, the one conclusion this whole exercise exists to prevent. No file at all is the honest outcome of a report that did not run.

- **One file per lane, keyed by the issue number**, so a parallel batch does not interleave into one unreadable file. `.scratch/` is gitignored — Act 0's preconditions guarantee it — so the run adds nothing to version control.
- **Every transcript directory the run captured**, planning and every wave, in one command. A lane's planning cost lands in a different directory from its execution cost and is roughly three tenths of the lane.
- **Whatever the lane's ending.** A lane that ended HALT, one that ended FAILED, one that finished with findings still open, one whose plan never came back READY, one that crashed — every one gets a log. Improvement data collected only on the clean path hides exactly the lanes worth looking at. A lane dropped at intake before any agent ran gets a log too, which will say it was not measured — accurate, and cheaper than a rule about which lanes qualify.
- **Nothing goes to the issue thread or the PR body.** The lane's one unattended comment is a concise summary plus open questions, and a cost table would bury it.
- **Best-effort, and last for that reason.** A failure here — the script missing, a directory unreadable, no transcript directory captured at all — is reported and dropped. It never changes a lane's ending, never blocks the run's conclusion, and never makes a batch report failure. Nothing downstream reads these files.

Then tell the user where the logs are. What the report contains, the metric it uses and why the target is a constant are in `cost-report.mjs` — do not restate them here, and do not read the transcripts yourself: **no lane halts, warns, or changes its behaviour on token spend**, which contracts.md records as a standing rule rather than an implementation detail of this Act.

## Cleanup mode (`/dev-loop cleanup`)

Cleanup reaps what has an exact done-signal and **lists** what does not. It is safe to run at any time, including while another batch is mid-wave, and that is the property to preserve.

**It removes no worktree.** Every normal path now removes its own the moment its work reaches the remote (contracts.md's **worktree invariant**), so a worktree still standing is one nothing proved done. The old scan proved it with "the branch is merged", which is not the same claim: a branch merges the moment its PR lands, which says nothing about whether the run holding that checkout has finished with it — so the scan could delete an active worktree out from under a run still in flight, and would look like it was working correctly while doing it.

1. `git fetch origin <DEFAULT>`.
2. **Reap, by the exact signal.** A lane is done when its PR is merged (`gh pr view <branch> --json state,mergedAt`) or its branch is fully merged into `origin/<DEFAULT>`. **The `gh` arm is the load-bearing one, and the git arm is the fallback** — not the other way round. A repository that merges by **squash** or by **rebase** replays the work under new shas, so the branch's own commits are never ancestors of the default branch and `git branch --merged origin/<DEFAULT>` never lists it; the git arm silently never fires there, and only the merged-PR check sees the truth. Keep it anyway for plain merge commits and for a branch that never had a PR. For each done lane: delete the local branch, and delete the lane's plan file `.scratch/*/plans/<n>-*.md` (plans are temporary artifacts). Reaping these is why cleanup exists.

   Delete with `git branch -d`, which succeeds whenever the branch is merged into the default branch **or** still matches its upstream — the ordinary case, since every branch that got a PR was pushed. It refuses one combination, and **squash and rebase both produce it**: a merge that rewrote the commits, whose remote branch was then deleted (GitHub's default on merge). The rewrite means the commits are not ancestors of the default branch, and the deletion takes away the remote-tracking ref that was carrying the proof instead. Only when `-d` refuses AND the merged check above passed, re-run it as `git branch -D`: that check is the proof git can no longer see for itself, and without this fallback cleanup would reap nothing at all in either of the two commonest GitHub configurations. Never reach for `-D` in any other situation — not on a branch the merged check did not pass, and not to get past any other refusal.
3. **A branch checked out in a surviving worktree cannot be deleted**, and git refuses — correctly, since something still holds it. List it alongside that worktree instead of working around it; the plan file still goes.
4. **List every worktree under `<WORKTREES>`; remove none.** Per worktree, say why it is still here, from what you can observe: uncommitted or untracked work (`git -C <wt> status --porcelain` non-empty — a removal that was refused), nothing on the remote (no upstream, or `git -C <wt> rev-list --count @{u}..HEAD` unreadable — held at a gate, or a session that died mid-run), or pushed with its PR still open. None of these has an exact done-signal and none distinguishes a live run's worktree from an abandoned one, so the human decides — give them the `git worktree remove <path>` line to run if they agree, and never run it for them.
5. NEVER touch MAIN (the first entry of `git worktree list`) — it is not a candidate under any condition, and only worktrees under `<WORKTREES>` are listed at all.
6. Report the two apart, so the difference is visible: **reaped** (branch, plan file) and **needs attention** (worktree, why it is lingering, the removal command). An empty second table is the good outcome.

## Hard rules

- Invoking `/dev-loop` IS the user's explicit opt-in to multi-agent orchestration. Enter Phase A and Phase B directly — NEVER pause to ask whether to run them; running a phase is NOT a gate. The ONLY human gates in this pipeline are Gate 1 (plan approval) and Gate 2 (push/PR), and under `unattended` neither asks anything. The one-time ask-then-persist preconditions are not gates and survive both modes: the profile's keys, `.worktreeinclude`, and the runner setting Act 0 asks about — each asked once ever, and each with somewhere durable to record the answer.
- Never proceed past a gate without explicit user approval, unless the run mode is `unattended`.
- **Append-only, whoever is watching.** The run may append to issues and pull requests (`gh issue comment`, `gh pr comment`), may add and remove its own workflow labels and no others, and may set state only on artifacts it created — its own branches, its own PRs, its own plan files. It NEVER edits an issue body, NEVER ticks an acceptance-criteria checkbox, and NEVER converts a pull request a human opened. Per-criterion verdicts are *reported*, never written back to the issue's checklist — contracts.md's **Append-only invariant** carries the reasoning.
- NEVER remove, force-modify, or `rm -rf` the main worktree (first entry of `git worktree list`). Worktree removal applies only to worktrees under `<WORKTREES>`, and only via `git worktree remove` without `--force`.
- **Never force-push, whoever is watching.** Every push this pipeline makes is a fast-forward by construction, so forcing is never the fix — and an unattended run that forced one would destroy history with nobody there to notice. A rejected push is reported, never retried harder.
- **Push before you remove.** A worktree is removed only after a push of its branch succeeded, because after removal the remote branch is the only copy of that work.
- A lane worktree is a cold checkout plus its `.worktreeinclude` files and whatever the Setup command installs. Everything else an agent needs — skills, roster, settings, permissions — it already has: it runs in a session rooted in MAIN whatever directory it works in.
- **Never halt, warn, or change a lane's behaviour because of what it costs.** Token spend is reported by Act 4 and enforced nowhere — contracts.md carries why a ceiling could not work and why a lane is already bounded without one. No argument, profile key or ending unlocks this.
- Never run agents for work you can do with one Bash command (provisioning, pushing), and never do agent work (planning, coding, reviewing) yourself.
- Plan paths passed to agents are always ABSOLUTE.
- If the session dies mid-run, `/dev-loop <same issues>` resumes from artifacts — do not keep separate state files.
- Never write a repository name, absolute path, or project-specific fact into this skill or its bundled agents — repo facts belong to the repo profile and the repo's own docs. The skill folder must stay copyable to any machine as-is.
