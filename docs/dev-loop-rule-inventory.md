# /dev-loop rule inventory

Every normative statement in `skills/dev-loop/SKILL.md` and `skills/dev-loop/contracts.md` as they
stood before the host-load compression, each with exactly one destination in the structure that
replaces them.

This is the prefactor for [#121](https://github.com/ieuanign/skills/issues/121). It exists so that
the effort's "pure relocation" claim is **checkable rather than trusted**: without it nobody can tell
a rule that was deliberately deleted from one that was quietly lost. Every ticket below #132 is
mechanical once this file exists, and each ticks the entries it lands.

It is a hand-written checklist, reviewed by hand. Parsing prose into rules mechanically would be its
own project, and is explicitly out of scope in #121.

## How to read an entry

| Column | What it holds |
|---|---|
| **ID** | `S-n` for a rule from `SKILL.md`, `C-n` for one from `contracts.md`. Stable — later tickets tick by ID. |
| **Rule** | Enough of the original wording to be recognisable after the source file changes. Not a quotation of the whole sentence; the identifying clause. |
| **→** | The one destination. Drawn from #121's Destinations table, plus `deleted`. |
| **By** | The ticket that lands it. |
| **✓** | Ticked when that ticket has landed the rule at its destination. |

A ☑ says the rule **landed**, not that it still binds — a later ticket may retire one. Where that
has happened the cell carries `superseded #<n>`, and the section's own supersession block says what
went.

A rule with two audiences is **two entries**, not one entry with two destinations — the instruction
and the reasoning behind it are different statements and move to different places.

## Destinations

The vocabulary is #121's Destinations table verbatim, plus `deleted`. Nothing is invented here.

| Token | What lands there |
|---|---|
| `SKILL.md` | `skills/dev-loop/SKILL.md` — steps in order, plus the four tables the orchestrator evaluates |
| `cleanup` | `skills/dev-loop-cleanup/SKILL.md` — post-merge reaping |
| `notifications.md` | `skills/dev-loop/notifications.md` — the notifier's specification, reached by its own agent definition |
| `agents/` | `agents/*.md` — the per-stage context contract; the notifier's tier in frontmatter |
| `script` | `phase-execute.js` comments — the state machine, which with one implementation is the specification of record |
| `docs/dev-loop.md` | the narrative a human reads: run shapes, prerequisites, common questions, "it's working if" |
| `internals` | `docs/dev-loop-internals.md` — the script-enforced half of `contracts.md`, as mechanism documentation |
| `ADR` | `docs/adr/` — a decision record |
| `profile` | `docs/agents/dev-loop.md` — the consuming repository's own profile |
| `deleted` | the rule stops applying. Every such entry names its ticket and says why. |

**ADR numbering is reserved, not sequential by landing order.** #121 and #126 both name
`docs/adr/0004-*.md` as the home for deleting Mode A, and #125 lands first. So **0004 was reserved for
Mode A** and #125's rationale ADRs took **0005–0007**; #126 has since filled the reservation. Recorded
here because a reader who sees 0005 land before 0004 would otherwise read it as a mistake.

Three ADRs rather than the four #125 names, because one of the four decisions **already had a record**:
the implement loop keeping a flat bound where the review loop is progress-sensitive is
[ADR-0002](./adr/0002-review-loop-progress-sensitive-bound.md)'s "Why the two loops differ" section,
written when the review loop's bound changed. `C-34`, `C-43` and `C-44` are ticked against it rather
than duplicated into a fourth file — a derived copy with no invalidation is exactly what ADR-0001's
first corollary forbids. The three that were genuinely unrecorded are 0005 (no token ceiling), 0006
(empty returns stay `FAILED`) and 0007 (per-commit push is not implementable).

## Ticket key

| Ticket | What it does |
|---|---|
| [#132](https://github.com/ieuanign/skills/issues/132) | this file. Modifies no skill, agent or script. |
| [#125](https://github.com/ieuanign/skills/issues/125) | extract rationale to `docs/` and ADRs — additive only |
| [#126](https://github.com/ieuanign/skills/issues/126) | delete Mode A |
| [#127](https://github.com/ieuanign/skills/issues/127) | extract `dev-loop-cleanup` |
| [#128](https://github.com/ieuanign/skills/issues/128) | dissolve `contracts.md` |
| [#129](https://github.com/ieuanign/skills/issues/129) | relocate the notifications spec and the pull request body |
| [#130](https://github.com/ieuanign/skills/issues/130) | compress `SKILL.md` |
| [#131](https://github.com/ieuanign/skills/issues/131) | integrate and verify |

A row whose destination is `SKILL.md` and whose ticket is **#130** is one that stays where it is and
is only rewritten — positives, no-op removal, leading words. A row with no ticket but a `SKILL.md`
destination stays untouched by this effort entirely.

---

# A. `skills/dev-loop/SKILL.md`

## A0. Frontmatter

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-1 | The `description` is the skill's discovery cost — carried in every session on the machine, not only on runs that invoke it. One line, one trigger per branch, no synonyms. | `SKILL.md` | #130 | ☑ |
| S-2 | `"…or says `/dev-loop cleanup`"` — the cleanup trigger in the description | `cleanup` | #127 | ☑ |

## A1. Preamble

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-3 | "You are the orchestrator. You stay in the MAIN worktree and never write code, plan, review, or debug yourself" | `SKILL.md` | — | ☑ |
| S-4 | The orchestrator owns "intake, gates, worktree provisioning, push, PRs, cleanup — and, under `unattended`, the notifications at your own boundaries" | `SKILL.md` | — | ☑ |
| S-5 | "the **notifier**, is not one you dispatch: `phase-execute.js` dispatches it mid-script … because you are blind while a script runs" | `script` | #129 | ☑ phase-execute.js |
| S-6 | "`notifications.md` governs who writes what" — the pointer to the notifications specification | `agents/` | #129 | ☑ agents/notifier.md |
| S-7 | "All agent returns are machine-readable — trust the contract keys (`STATUS/RESULT/VERDICT/OWNER`), not vibes" | `script` | #128 | ☑ phase-execute.js |
| S-8 | "The pipeline's state machine … is specified in `<this-skill-dir>/contracts.md` — normative for BOTH execution modes; read it before Phase B." | `deleted` | #128 | ☑ |
| S-9 | "This skill is repo- and machine-agnostic: it hardcodes no repository name, path, or project fact." | `SKILL.md` | — | ☑ |

`S-8` is deleted because `contracts.md` ceases to exist: with one implementation the phase script is
the specification, and the half the orchestrator evaluates moves into `SKILL.md` as tables.

## A2. Arguments

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-10 | The grammar `/dev-loop [auto] <issues> [project:<slug>]` | `SKILL.md` | — | ☑ |
| S-11 | "`auto` — optional leading token … Modes lead and dials trail" | `SKILL.md` | — | ☑ |
| S-12 | "One issue = one lane; several = parallel lanes." | `SKILL.md` | — | ☑ |
| S-13 | "`project:<slug>` — optional project slug passed to the architect for the plan path" | `SKILL.md` | — | ☑ |
| S-14 | "`/dev-loop cleanup` — run Cleanup mode (bottom) instead of the pipeline." | `cleanup` | #127 | ☑ |

## A3. Run mode — `gated` or `unattended`

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-15 | "`auto` present ⇒ **unattended**; absent ⇒ **gated**. Act 0 parses it ONCE and carries it as a single value for the whole run — no later stage re-derives it" | `SKILL.md` | — | ☑ |
| S-16 | "It is contracts.md's **Lane conclusion** branch" — the framing of the run mode as a contract branch point | `deleted` | #126 | ☑ |
| S-17 | **Gate suppression.** "Both gates raise their questions under `gated`, and neither raises any under `unattended`. This line is the only place that is decided: no argument and no profile key overrides it." | `SKILL.md` | — | ☑ |
| S-18 | **Notifications.** "Under `unattended` you emit … the host-owned events, at the three boundaries marked **⟨notify⟩** … each ⟨notify⟩ boundary says *what* to run and never *whether*" | `SKILL.md` | — | ☑ |
| S-19 | "`notifications.md` governs what each event says, which label role it writes, and in what order" — the specification itself | `agents/` | #129 | ☑ agents/notifier.md |
| S-20 | The format of the orchestrator's own three events — lane start, plan comment, lane conclusion — stated inline at the boundaries that write them | `SKILL.md` | #129 | ☑ |
| S-21 | **Cost log.** "Under `unattended` you write Act 4's per-lane cost log. Under `gated` you write none … the transcript directories it needs are captured under both modes" | `SKILL.md` | — | ☑ |
| S-22 | "**Suppression removes the questions, not the work.** Every step of both gates still runs; each question resolves to its unattended answer instead" | `SKILL.md` | — | ☑ |
| S-23 | The seven-row suppression table — Gate 1 approvals, a `BLOCKED` plan's open questions, stack-or-defer, Gate 2 push/PR, a draft for an ended sub-lane, arbitration, between-layers authorization | `SKILL.md` | — | ☑ |
| S-24 | "A gate's `PushNotification` goes with its question — it exists to summon someone to a gate, and under `unattended` nobody is being summoned." | `SKILL.md` | — | ☑ |
| S-25 | "Touchpoint intersection, sub-lane splitting, the profile's Constraints, the push and the PR itself are gate *work*, and happen identically under both modes." | `SKILL.md` | — | ☑ |
| S-26 | "The one-time ask-then-persist preconditions are not gates and fire under both — including Act 0's step 9" | `SKILL.md` | — | ☑ |
| S-27 | "every sub-lane result carries a `terminal` of `{pr, push, reasons}`, so under `unattended` you open what it names rather than deciding it here" — the orchestrator obeys the value and does not re-derive draft-versus-ready | `SKILL.md` | — | ☑ |
| S-28 | The terminal-state table's own derivation — how a `terminal` row is computed | `internals` | #125 | ☑ |

## A4. How you write a ⟨notify⟩ event — the mechanism only

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-29 | "Read `notifications.md` before you emit anything." — the orchestrator loading the specification | `deleted` | #129 | ☑ |
| S-30 | "**A label is `gh issue edit <n> --add-label/--remove-label`.** Resolve its three roles to strings ONCE at Act 0, through the repo's own `docs/agents/triage-labels.md` … No label string is ever written into this skill." | `SKILL.md` | — | ☑ |
| S-31 | "**A comment is `gh issue comment <n> --body-file -`**, with the body piped in from a **quoted** heredoc … Never `--body "<text>"`" | `SKILL.md` | — | ☑ |
| S-32 | "**A message is `<this-skill-dir>/notify.sh <<'MSG' … MSG`**, which reads its payload on standard input … never check for [a channel], never ask about it, and never add a profile key for it." | `SKILL.md` | — | ☑ |

`S-29` is deleted rather than moved: after #129 the orchestrator writes three events whose format is
stated inline, and the notifier reads the specification itself. Loading it twice was the second
payment #121 names.

## A5. Derived facts

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-33 | "**MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it." | `SKILL.md` | — | ☑ |
| S-34 | "**REPO** — `basename` of MAIN." | `SKILL.md` | — | ☑ |
| S-35 | "**DEFAULT** — … `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`." | `SKILL.md` | — | ☑ |
| S-36 | "**WORKTREES** — `<MAIN>/.claude/worktrees/`. … the directory slug is the branch name after its first `/`" | `SKILL.md` | — | ☑ |
| S-37 | "**GitHub repo** — never pass `--repo`: … gh infers the repository from the remote." | `SKILL.md` | — | ☑ |
| S-38 | "**RUN HANDLE** — … read once from your environment: `$CLAUDE_CODE_SESSION_ID`. Unset or empty ⇒ **there is no handle**: carry the empty string, write no line for it anywhere, ask nothing" | `SKILL.md` | — | ☑ |
| S-39 | "It is a **run handle, never a resume identifier**" and why — an unattended conclusion deletes the state a session resume would restore | `notifications.md` | #129 | ☑ |
| S-40 | "**Fast copy** — macOS: `/bin/cp -Rc` … MUST be `/bin/cp`; Linux: `cp -R --reflink=auto`; anywhere else: plain `cp -R`." | `SKILL.md` | — | ☑ |

## A6. Where configuration lives — a rule, not a list

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-41 | "**Varies per run → argument. Varies per repository → profile. Does not vary → constant.**" | `SKILL.md` | — | ☑ |
| S-42 | The four-home table — argument, repository profile, phase-script constant, skill constant | `SKILL.md` | — | ☑ |
| S-43 | "These are **homes, not an inventory** … which is the point of a rule over a list" | `docs/dev-loop.md` | #125 | ☑ |
| S-44 | "**No per-repository effort tiers.** … a tier is a phase-script constant or it is nothing." | `docs/dev-loop.md` | #125 | ☑ |
| S-45 | "**No per-run overrides of gates, stages, or cost behaviour.**" | `docs/dev-loop.md` | #125 | ☑ |
| S-46 | "**The cost reporting target stays a constant** — it was measured as a single median across repositories" | `docs/dev-loop.md` | #125 | ☑ |
| S-47 | "Each refusal is a cheap promotion from constant to profile key if a repository ever actually needs one." | `docs/dev-loop.md` | #125 | ☑ |

`S-43`–`S-47` bind a **maintainer**, not a run. The orchestrator never evaluates them, so they are
reader load whatever file they are in today.

## A7. Repo profile — `docs/agents/dev-loop.md` (ask-then-persist)

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-48 | "The per-repo config, read at Act 0. Optional: a repo without one runs on pure defaults." | `SKILL.md` | — | ☑ |
| S-49 | "when a run first NEEDS it and the profile lacks it, AskUserQuestion ONCE, persist the answer into the profile (create the file if needed), and never ask again — a persisted 'none' counts as an answer" | `SKILL.md` | — | ☑ |
| S-50 | "Never store derivable facts there." | `SKILL.md` | — | ☑ |
| S-51 | **Branch template** key — default `feat/{issue}`, sub-lanes `feat/{issue}-{area}`, asked on the first run in a repo | `SKILL.md` | — | ☑ |
| S-52 | **PR title format** key — default `<type>(<scope>): #<issue> - <title>` | `SKILL.md` | — | ☑ |
| S-53 | **PR body template** key — "asked at the first Gate 2; whatever its shape, the core elements in Gate 2 below must survive" | `profile` | #129 | ☑ |
| S-54 | **Setup command** key — "what a cold checkout runs before its tests pass … Asked at the first provisioning." | `SKILL.md` | — | ☑ |
| S-55 | **Full-suite command** key — "the ONE command that runs the repo's whole test suite from a provisioned worktree … `none` is a real answer … Configuration, never discovery" | `SKILL.md` | — | ☑ |
| S-56 | **Fix cycles** key — the review loop's no-progress threshold, default `2`, asked by Act 0's step 9 and nowhere else | `SKILL.md` | — | ☑ |
| S-57 | The Fix cycles counter's arithmetic — "starts at 1 … advances by one on every round that brings nothing previously unseen … resets to 1 whenever a round brings something new … a position the counter reaches rather than a count of tolerated rounds" | `internals` | #125 | ☑ |
| S-58 | **Constraints** key — "free-form repo cautions … Honor them when deciding lanes vs layers (Gate 1) and when provisioning (Act 2)." | `SKILL.md` | — | ☑ |

## A8. Execution modes

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-59 | "**Mode W** — the Workflow tool is in your toolset: run the phase scripts exactly as Act 1 / Act 3 describe." | `SKILL.md` | #126 | ☑ |
| S-60 | "**Mode A** — no Workflow tool: you drive the same state machine yourself with the Agent tool" — the whole Agent-tool orchestration path | `deleted` | #126 | ☑ |
| S-61 | "Behavior changes edit contracts.md FIRST, then both implementations (the phase scripts and Mode A) in the same change." | `deleted` | #126 | ☑ |
| S-62 | "Every mode difference lives in one place: contracts.md's **Lane conclusion** section … Mode A never implements it." | `deleted` | #126 | ☑ |
| S-63 | "**Push, pull requests and stack linking are the host's** … a phase script never pushes, never opens a pull request and never links a stack, having no shell." | `SKILL.md` | #126 | ☑ |
| S-64 | Mode A's tier-lock — "the direct Agent tool has no effort parameter, so this mode cannot vary effort" | `ADR` | #126 | ☑ ADR-0004 |

`S-59` survives as a **precondition** rather than a mode: after #126 the Workflow tool is required for
any run, and there is no second branch to name. `S-63` survives with its "in both modes" framing
dropped.

## A9. Act 0 — Intake

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-65 | Step 1 — "Parse the arguments … This is the ONLY place the run mode is derived — carry that one value from here." | `SKILL.md` | — | ☑ |
| S-66 | Step 1 — "Then detect the execution mode, which is a toolset check and costs nothing." | `deleted` | #126 | ☑ |
| S-67 | Step 1 — "read the **agent namespace** off your own roster … find `code-writer` among your available agent types — listed bare, the namespace is the empty string; listed as `<prefix>:code-writer`, it is `<prefix>` … This is the ONLY place it is derived … Never write it as a literal and never derive it from a path, a package name or a manifest" | `SKILL.md` | — | ☑ |
| S-68 | Why a role is resolved rather than named — the same definition registers bare when linked and namespaced when the plugin is installed | `internals` | #125 | ☑ |
| S-69 | Step 2 — a session with no Workflow tool is refused; tell them `"enableWorkflows": true` in `~/.claude/settings.json` and that **a restart is required** | `SKILL.md` | #126 | ☑ |
| S-70 | Step 2 — the ask-then-persist arms: key absent ⇒ ask once, Yes writes `true`, No writes `false`; key present ⇒ do not ask, `true` means restart, `false` means name the file and key | `SKILL.md` | #126 | ☑ |
| S-71 | Step 2 — "This is per-machine, so it persists to the per-machine settings and never to the repo profile or a setup skill" | `SKILL.md` | #126 | ☑ |
| S-72 | Step 2 — refuse "before a single agent is dispatched and before this Act asks the user anything else" | `SKILL.md` | #126 | ☑ |
| S-73 | Step 2 — "A `gated` run with no Workflow tool is untouched and runs Mode A exactly as before." | `deleted` | #126 | ☑ |
| S-74 | Step 3 — "Compute the Derived facts and read the repo profile (first run in a repo: ask-then-persist the branch template)." | `SKILL.md` | — | ☑ |
| S-75 | Step 4 — "Both gitignore checks **probe a path underneath the directory, never the directory itself**." | `SKILL.md` | — | ☑ |
| S-76 | Step 4 — why the probe must be a child: `git check-ignore` cannot classify a bare path as a directory unless it exists on disk, so a correctly-configured repo reports as unignored | `docs/dev-loop.md` | #125 | ☑ |
| S-77 | Step 4 — "`.claude/worktrees` not gitignored … → append `.claude/worktrees/` to `.gitignore` and tell the user" | `SKILL.md` | — | ☑ |
| S-78 | Step 4 — "`.scratch` not gitignored … → append `.scratch/` … plans live there" | `SKILL.md` | — | ☑ |
| S-79 | Step 4 — "**Neither remedy appends a line `.gitignore` already carries** — read the file first" | `SKILL.md` | — | ☑ |
| S-80 | Step 4 — "`.worktreeinclude` missing … → ask-then-persist, the file itself being the persistence: offer candidates from `git ls-files -oi --exclude-standard --directory` … 'None' writes a comment-only file" | `SKILL.md` | — | ☑ |
| S-81 | Step 4 — "Offer only what a cold checkout cannot run without … Dependencies belong to the Setup command however cheap the Fast copy looks" | `SKILL.md` | — | ☑ |
| S-82 | Step 4 — "`.worktreeinclude`'s LAST line must be `!.claude/worktrees/**` … gitignore matching is last-match-wins" | `SKILL.md` | — | ☑ |
| S-83 | Step 5 — "`git fetch origin <DEFAULT>` once." | `SKILL.md` | — | ☑ |
| S-84 | Step 6 — "`gh issue view <n> --json number,title,body,state,labels`. CLOSED → drop the lane … KEEP the body: Phase B hands it to the reviewer as its Spec axis" | `SKILL.md` | — | ☑ |
| S-85 | Step 7 — "a blocker that is still open and NOT in this batch → refuse that lane …; a blocker inside the batch → record the ordering" | `SKILL.md` | — | ☑ |
| S-86 | Step 8 — "Stateless resume check per issue — derive the stage from artifacts, never from memory": plan `READY` skips Phase A; commits already in the log are done; an existing worktree is reused as-is | `SKILL.md` | — | ☑ |
| S-87 | Step 9 — "**Phase B's two profile keys — the ONE place either is asked.**" | `SKILL.md` | — | ☑ |
| S-88 | Step 9 — "**Skip the whole step unless this run will reach Phase B** … Then, per key, **skip a key the profile already carries**" | `SKILL.md` | — | ☑ |
| S-89 | Step 9 — "It is **not a gate**. It raises no question about this batch's work … It sits here, at intake, because it is the last point at which a human who typed `auto` is reliably still watching." | `SKILL.md` | — | ☑ |
| S-90 | Step 9 — the Full-suite ask's shape: offer plausible options, never persist a discovered command, offer `none` as a real option, declined ⇒ persist `none` | `SKILL.md` | — | ☑ |
| S-91 | Step 9 — the Fix cycles ask's shape: state the arithmetic, say what it is *not*, offer `2` / a higher value / `0`, declined ⇒ `2` persisted | `SKILL.md` | — | ☑ |
| S-92 | Step 9 — "**This step is host work in both execution modes** — Act 3 passes the two values into the phase scripts under Mode W and Mode A reads the same two off the same profile" | `deleted` | #126 | ☑ |
| S-93 | Step 10 — "**⟨notify⟩ Lane start.** For every lane that survived steps 6–8 … add the in-progress label and send the started message, per lane. This is the LAST step of Act 0, and that position is the point" | `SKILL.md` | — | ☑ |
| S-94 | Step 10 — "The label is also a claim marker … `notifications.md` records the hazard that comes with it — do not solve it here." | `notifications.md` | #129 | ☑ |

## A10. Act 1 — Phase A: plans

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-95 | "run the Workflow tool with `scriptPath: <this-skill-dir>/phase-plan.js` and `args: { issues: [{number, title, project, answers?}], agentNamespace }` — … passed verbatim (the empty string when the roster lists the roles bare)" | `SKILL.md` | — | ☑ |
| S-96 | "One architect per issue, parallel. Each returns `{status, planPath, summary, openQuestions}`." | `SKILL.md` | — | ☑ |
| S-97 | "A lane returning `status: DIED` … report it at Gate 1 and offer a re-run; never silently drop a requested issue." | `SKILL.md` | — | ☑ |
| S-98 | "**Report it as what it is and never as a crash**: from here a skipped agent and a dead one are indistinguishable" | `internals` | #125 | ☑ |
| S-99 | "**KEEP the transcript directory this invocation reports** … alongside every later one, **including any re-run**" | `SKILL.md` | — | ☑ |
| S-100 | "planning … is roughly three tenths of a lane and it lands in a different directory from execution's" | `docs/dev-loop.md` | #125 | ☑ |
| S-101 | "KEEP each lane's `summary` bullets for the rest of the run … Gate 2 puts them in the PR body's Context section — so they must survive whether or not Gate 1 fires" | `SKILL.md` | — | ☑ |
| S-102 | "**⟨notify⟩ Plan comment.** Per lane, comment the plan's summary bullets and the architect's open questions on the issue … Pass `planPath` in the comment" | `SKILL.md` | — | ☑ |
| S-103 | "**Never the plan file** — it survives on disk at tens of kilobytes, no agent ever reads this comment … and inlining it buries the thread to serve nobody." | `notifications.md` | #129 | ☑ |

## A11. Gate 1 — plan approval

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-104 | "Present every lane: summary, plan path (invite the user to edit the file before approving), open questions." | `SKILL.md` | — | ☑ |
| S-105 | "**BLOCKED plans**: relay the open questions via AskUserQuestion, re-run only those lanes' architects with `answers` filled in, re-present." | `SKILL.md` | — | ☑ |
| S-106 | "**Touchpoint overlap**: intersect the plans' File touchpoints across lanes yourself (plain reading, no agent …)" | `SKILL.md` | — | ☑ |
| S-107 | The three-outcome table — additive co-touch / same-region co-touch / real dependency, with layer, base, and dependency claimed | `SKILL.md` | #128 | ☑ |
| S-108 | "where the repo declares an `Overlapping changes` policy, that policy decides the line between the first two … read it off your own context rather than fetching a file, and treat its absence as the default. It moves that one line and nothing else — outcome 3 is not declarable" | `SKILL.md` | #128 | ☑ |
| S-109 | Outcome 1 — "**additive co-touch** … Note it, keep both in the same layer, accept the trivial rebase." | `SKILL.md` | — | ☑ |
| S-110 | Outcome 2 — "**same-region co-touch** … Drop the later lane into the next layer … **Claim no dependency**: post no discovered-blocker comment, and say plainly … it was *sequenced to avoid a textual conflict, not because one lane needs the other*" | `SKILL.md` | — | ☑ |
| S-111 | Outcome 3 — "**real dependency** … Post the discovery back to the dependent GitHub issue … **Unconditionally, and before the remedy is chosen**" | `SKILL.md` | — | ☑ |
| S-112 | Outcome 3 — "AskUserQuestion per case, with **'stack B on A's branch' as the first/recommended option** and 'defer B out of this batch' as the alternative" | `SKILL.md` | — | ☑ |
| S-113 | "Outcomes 2 and 3 produce the same branch shape … and differ only in what is asserted about it. Only 3 posts the comment, and only 3 asks anything." | `SKILL.md` | — | ☑ |
| S-114 | "**The classification itself is identical under both modes** … Only outcome 3's question is suppressed under `unattended` … the comment is a machine action and is posted the same in both." | `SKILL.md` | — | ☑ |
| S-115 | Why the classification is the host's — one architect runs per issue and none can see another lane's plan, so no agent in this pipeline holds the inputs | `internals` | #125 | ☑ |
| S-116 | "**Profile Constraints**: apply them now — lanes a constraint forbids from running concurrently go into separate layers (or one is deferred), and say so." | `SKILL.md` | — | ☑ |
| S-117 | "**Multi-PR plans**: the lane splits into sub-lanes, sequential, in the plan's order … First sub-lane branch from the branch template, later ones with the `-<area>` suffix, each based on the previous sub-lane's branch when the plan says the code depends on it, else `origin/<DEFAULT>`." | `SKILL.md` | — | ☑ |
| S-118 | "Only lanes the user approves proceed. Drop the rest with a note." | `SKILL.md` | — | ☑ |

## A12. Act 2 — Provisioning

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-119 | "**anything based on the trunk (`origin/<DEFAULT>`) runs in layer 1; anything based on a branch that gets its commits in layer N runs in layer N+1** — this applies to stacked _lanes_ AND to dependent _sub-lanes_ within one lane" | `SKILL.md` | — | ☑ |
| S-120 | "A layer is the horizontal set that runs concurrently; the stack it belongs to is the vertical chain from the trunk at the bottom up to the top." | `SKILL.md` | — | ☑ |
| S-121 | "Provision a layer only after its bases completed the previous layer." | `SKILL.md` | — | ☑ |
| S-122 | "`git worktree add <WORKTREES>/<slug> -b <branch> <base>` … On resume: an existing worktree is reused as-is; an existing branch WITHOUT a worktree reattaches … (no `-b` — the `-b` form errors on an existing branch)" | `SKILL.md` | — | ☑ |
| S-123 | "`git -C <MAIN> ls-files -oi --exclude-from=.worktreeinclude --directory` lists the matches … Fast-copy each … but STRIP the trailing slash git puts on directory entries first" | `SKILL.md` | — | ☑ |
| S-124 | "Worktree contents never appear in the list — the `!.claude/worktrees/**` line Act 0 guarantees excludes them." | `SKILL.md` | — | ☑ |
| S-125 | "Run the profile's Setup command from inside the worktree." | `SKILL.md` | — | ☑ |

## A13. Act 3 — Phase B: execute

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-126 | "run the Workflow tool with `scriptPath: <this-skill-dir>/phase-execute.js` and `args: { lanes, mode, fixCycleThreshold, suiteCommand, skillDir, agentNamespace, runHandle }` … and nothing else" | `SKILL.md` | — | ☑ |
| S-127 | "`skillDir` is `<this-skill-dir>` as an ABSOLUTE path … the notifier it dispatches needs `notifications.md` and `notify.sh` by path. Omit it and no notifier is dispatched" | `SKILL.md` | #129 | ☑ |
| S-128 | "`agentNamespace` … omitting it where the roster IS namespaced fails every dispatch in the phase rather than one stage of it" | `SKILL.md` | — | ☑ |
| S-129 | "`mode` is the run mode Act 0 parsed — literally `gated` or `unattended`, never the `auto` token the developer typed — passed rather than re-derived" | `SKILL.md` | — | ☑ |
| S-130 | "`fixCycleThreshold` is the profile's **Fix cycles** key … the loop's hard ceiling is a phase-script constant and is not passed" | `SKILL.md` | — | ☑ |
| S-131 | "`suiteCommand` is its **Full-suite command** … a `none` or omitted `suiteCommand` makes every sub-lane's suite **not run**" | `SKILL.md` | — | ☑ |
| S-132 | "`runHandle` is the **RUN HANDLE** derived fact, passed verbatim … an empty or omitted one is a missing line and never an error" | `SKILL.md` | — | ☑ |
| S-133 | The lane shape — `{ issue, issueBody (verbatim and whole), planPath (ABSOLUTE), subLanes: [{ branch, worktree, base, area, commits, ownedCriteria }] }` | `SKILL.md` | — | ☑ |
| S-134 | "A lane's subLanes array contains only THIS layer's sub-lanes — later-layer sub-lanes of the same issue go into the next layer's args." | `SKILL.md` | — | ☑ |
| S-135 | "Build each sub-lane's `commits` from the plan's `## Commit / PR breakdown` … `ordinal` = 1-based position within the whole breakdown; `message` verbatim … Omit commits Act 0 already found in the branch's git log" | `SKILL.md` | — | ☑ |
| S-136 | "Build each sub-lane's `ownedCriteria` from that SAME section … **Anything the plan left unlisted falls to the LAST sub-lane in plan order**" | `SKILL.md` | — | ☑ |
| S-137 | "**This is yours in both modes, and it is decided ONCE per run, here, where lanes are built.**" and why a phase script cannot hold it | `ADR` | — | ☑ ADR-0003 |
| S-138 | The per-lane stage order — "writer Mode 1 per commit → on FAILED the debugger diagnoses and routes → reviewer on the sub-lane's range … → fix cycles … → the suite gate … → commit-breakdown check" | `internals` | #125 | ☑ |
| S-139 | "The Spec axis's per-criterion verdicts are reported and never blocking … under `unattended` they are read once more at the conclusion, where the terminal-state table drafts a pull request on any verdict that is not `met`." | `internals` | #125 | ☑ |
| S-140 | "Every loop is bounded and every bound, route, and ending is in contracts.md — enforce them exactly." | `deleted` | #128 | ☑ |
| S-141 | "Each sub-lane finishes clean or ends carrying one of … two labels: **HALT** … or **FAILED** … the label explains and **decides nothing**" | `SKILL.md` | — | ☑ |
| S-142 | "An ending ends its own sub-lane, so the lane's later sub-lanes still run and no ending kills the batch." | `internals` | #125 | ☑ |
| S-143 | "**KEEP each layer's transcript directory too** … a lane whose sub-lanes span layers has its records spread across one directory per layer" | `SKILL.md` | — | ☑ |
| S-144 | "per-LANE result carries two flags Gate 2's step 4 reads and nothing else does: `crashed` … and `notified` … Each lane's arg accepts `notified` back" | `SKILL.md` | — | ☑ |
| S-145 | "per-sub-lane result carries a `terminal` of `{pr: 'ready'\|'draft'\|'none', reasons}` … Carry it to Gate 2 unchanged … It carries no push column, because git decides that" | `SKILL.md` | — | ☑ |
| S-146 | "Mode A needs no equivalent, and neither does a `gated` run" | `deleted` | #126 | ☑ |
| S-147 | "The commit-breakdown check is YOUR work, not an agent's … carry the result as `<n> planned, <m> made` … A mismatch never halts the lane and never triggers a fix cycle" | `SKILL.md` | — | ☑ |
| S-148 | Why a mismatch is never a halt — "fix cycles legitimately append commits and a writer may legitimately split one" | `internals` | #125 | ☑ |
| S-149 | "Between layers …: run Gate 2 for the layer's finished lanes FIRST … then ask authorization to proceed" | `SKILL.md` | — | ☑ |
| S-150 | "The user may inspect the finished worktrees at leisure — the loop waits, and findings they raise go to the writer's Mode 2 before any dependent layer starts." | `SKILL.md` | — | ☑ |
| S-151 | "Only after authorization, provision the next layer's worktrees (Act 2) from the completed bases." | `SKILL.md` | — | ☑ |
| S-152 | "A dependent lane whose base ended — or was held by the user — never runs, so it ends **HALT** with that reason." | `SKILL.md` | — | ☑ |

## A14. Gate 2 — push & PR

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-153 | "Gate 2 fires at the end of EVERY layer, for every sub-lane that layer finished — clean or ended, both offered here on the same terms — never hold a finished lane until the whole batch ends" | `SKILL.md` | — | ☑ |
| S-154 | "A batch with no stacking has one layer, and therefore exactly one Gate 2." | `SKILL.md` | — | ☑ |
| S-155 | Per sub-lane, show: commit list (a `wip:` commit "listed, never counted"), planned-versus-made counts, deviation counts, the acceptance criteria that sub-lane **owns**, the findings ledger, the suite result | `SKILL.md` | — | ☑ |
| S-156 | "For sub-lanes that ended on contested findings, present both sides … uphold the finding … or accept the dispute (record it as won't-fix, documented)." | `SKILL.md` | — | ☑ |
| S-157 | "AskUserQuestion: approve / hold. On approve, run steps 1–3 per sub-lane in order, then step 4 once per lane, then step 5 once for the whole batch" | `SKILL.md` | — | ☑ |
| S-158 | Step 1 — "`git -C <worktree> rev-list --count <base>..<branch>` … then `git -C <worktree> push -u origin <branch>` when the count is non-zero — **never `--force`, never `--force-with-lease`**" | `SKILL.md` | — | ☑ |
| S-159 | Step 1 — "Zero means nothing landed … so there is nothing to push and no PR to open … under `unattended` `gh issue comment <n>` the ending's explanation first, because this is the one ending in the pipeline with no pull request to carry it." | `SKILL.md` | — | ☑ |
| S-160 | Step 1 — "Ask git, never the reported commit list … the count settles the push AND overrides the sub-lane's proposed PR state in step 2." | `SKILL.md` | — | ☑ |
| S-161 | Step 1 — "This is each sub-lane's ONE push: … why per-commit push is not implementable, so do not reach for it." | `ADR` | #125 | ☑ ADR-0007 |
| S-162 | Step 1 — "A rejected push stops this sub-lane's conclusion here — report git's message verbatim as a **FAILED** ending … open no PR, keep that worktree, and move to the next." | `SKILL.md` | — | ☑ |
| S-163 | Step 2 — "`gh pr create --head <branch> --base <base-branch> --title … --body …` — `<base-branch>` is `<DEFAULT>` for default-based lanes (NEVER `origin/<DEFAULT>` — gh rejects remote-tracking refs) or the stack base's branch name" | `SKILL.md` | — | ☑ |
| S-164 | Step 2 — "Under `unattended`, **whether that command carries `--draft` is the sub-lane's `terminal.pr`** … a `none` whose count came back non-zero … opens `--draft`, never ready." | `SKILL.md` | — | ☑ |
| S-165 | Step 2 — "Put `terminal.reasons` in the body so a human landing on a draft sees which trigger fired." | `SKILL.md` | — | ☑ |
| S-166 | Step 2 — "Under `gated` **nothing here changes and the table is not read**: a sub-lane that **ended** gets no PR by default and you offer 'open a draft PR anyway?' … a sub-lane that concluded clean gets its normal PR whatever its verdicts say" | `SKILL.md` | — | ☑ |
| S-167 | Step 2 — "You set draft state ONLY on a PR you are creating: never convert one that already exists, whoever opened it." | `SKILL.md` | — | ☑ |
| S-168 | Step 2 — the pull request body's core elements: `Closes #<n>` on the first sub-lane only, Context, Acceptance criteria, Whole-issue roll-up on the last sub-lane, Review findings, Suite, Attempt log, Run handle, Local-only artifacts, Why this is a draft | `profile` | #129 | ☑ |
| S-169 | Step 2 — the footer "🤖 Generated with [Claude Code](https://claude.com/claude-code)" | `profile` | #129 | ☑ |
| S-170 | Step 3 — worktrees "removed when, and only when, the work reached the remote AND no human is expected to resume in it … `git worktree remove <WORKTREES>/<slug>` and is never `--force`, and it runs **only after that push succeeded**" | `SKILL.md` | — | ☑ |
| S-171 | Step 3 — "A refusal means work was left behind — report `git -C <wt> status --porcelain` verbatim and keep that worktree; that refusal IS the dirty-work guard, so never argue with it." | `SKILL.md` | — | ☑ |
| S-172 | Step 3 — "NEVER target MAIN: before any removal, confirm the path is NOT the first entry of `git worktree list`." | `SKILL.md` | — | ☑ |
| S-173 | Step 3 — "The local branch and the plan file stay" | `SKILL.md` | — | ☑ |
| S-174 | Step 3 — "(`/dev-loop cleanup` reaps those once the PR merges)" | `cleanup` | #127 | ☑ |
| S-175 | Step 3 — the four worktree rows: clean ⇒ removed after push and PR; ended under `unattended` ⇒ removed after push; ended under `gated` ⇒ **kept**; held or push-failed ⇒ kept | `SKILL.md` | #128 | ☑ |
| S-176 | Step 3 — "So an `unattended` run ends with ONLY the main worktree remaining unless a removal was refused or a push failed" | `docs/dev-loop.md` | #125 | ☑ |
| S-177 | Step 3 — "**Name what the removal destroys, then remove.** … read the plan's **File touchpoints** and report every one that `git -C <wt> check-ignore -q <path>` calls ignored and that exists in the worktree" | `SKILL.md` | — | ☑ |
| S-178 | Step 3 — "That same list is step 2's **Local-only artifacts** section" | `SKILL.md` | — | ☑ |
| S-179 | Step 3 — "nothing is copied out and nothing is kept, because a path that must outlive its sub-lane has to be committed" | `internals` | #125 | ☑ |
| S-180 | Step 3 — "Never `--ignored=matching` — its every line would be the dependencies and copied-in config that provisioning put there on purpose." | `SKILL.md` | — | ☑ |
| S-181 | Step 4 — "**⟨notify⟩ Lane conclusion.** … Per lane, not per sub-lane … and at the lane's LAST layer" | `SKILL.md` | — | ☑ |
| S-182 | Step 4 — "**Remove the in-progress label, without exception**: finished, ended or thrown, the lane is no longer in progress." | `SKILL.md` | — | ☑ |
| S-183 | Step 4 — the four-case table: `notified: true` ⇒ write nothing else; `crashed: true` ⇒ label it and post the ending comment plus the run handle; a draft with no ending ⇒ the host's; every PR ready ⇒ no label | `SKILL.md` | — | ☑ |
| S-184 | Step 4 — "What replaces it — if anything — is `notifications.md`'s label rule, which is stated there and not here." | `agents/` | #129 | ☑ agents/notifier.md |
| S-185 | Step 4 — "Then **send exactly one closing message** … Unconditional, including for a lane with no PR at all" | `SKILL.md` | — | ☑ |
| S-186 | Step 4 — "paired with Act 0's started message it is the run's dead-session signal" | `notifications.md` | #129 | ☑ |
| S-187 | Step 4 — "A lane whose sub-lanes span layers reaches this step once, at its last. Carry its `notified` forward into the next layer's args" | `SKILL.md` | — | ☑ |
| S-188 | Step 4 — "**What this cannot cover** is the session itself stopping … A watchdog is deliberately out of scope" | `docs/dev-loop.md` | #125 | ☑ |
| S-189 | Step 5 — "**Stack linking.** Once per BATCH, at its LAST Gate 2." | `SKILL.md` | — | ☑ |
| S-190 | Step 5 — "**This step is identical under both modes and asks nothing**, so gate suppression does not touch it … It has no row in the suppression table because it has no question to suppress." | `SKILL.md` | — | ☑ |
| S-191 | Step 5 — "Keep each sub-lane's PR number from step 2 as you go — the number, not the URL … read it back with `gh pr view <branch> --json number -q .number`" | `SKILL.md` | — | ☑ |
| S-192 | Step 5 — "walk the base relation you provisioned in Act 2 and collect each **maximal chain**" | `SKILL.md` | — | ☑ |
| S-193 | Step 5 — "**Break every chain at a sub-lane that opened no pull request** … and never join across the hole … you report the gap naming that sub-lane." | `SKILL.md` | — | ☑ |
| S-194 | Step 5 — "Per chain, bottom to top: `<this-skill-dir>/stack-link.sh <pr-number> <pr-number> [...]`" | `SKILL.md` | — | ☑ |
| S-195 | Step 5 — "A batch with no stacking is every chain of length one, and the script makes no call for any of them" | `SKILL.md` | — | ☑ |
| S-196 | Step 5 — "Report the script's one `STACK:` line per chain … `linked` records the stack, `skipped` is the machine having no extension and is not a problem to raise, and `failed` is reported with its message and then left alone." | `SKILL.md` | — | ☑ |
| S-197 | Step 5 — "**A `failed` is never fatal and never retried**" | `SKILL.md` | — | ☑ |
| S-198 | Step 5 — "Never pass a branch name and never pass the ready-for-review flag" | `SKILL.md` | — | ☑ |
| S-199 | Step 5 — why numbers rather than branch names, and why ready-for-review is never requested | `internals` | #125 | ☑ |
| S-200 | "Stacked lanes: a lane in the bottom layer bases its PR on the trunk (`<DEFAULT>`); every layer above bases its PR on the branch of the layer below. Note the stack in the body" | `SKILL.md` | — | ☑ |
| S-201 | "Removing a lower layer's worktree does not affect the layer above it — that layer branches from the base's _branch_, which survives worktree removal." | `internals` | #125 | ☑ |
| S-202 | "Ended sub-lanes: report the label …, the stage, the reason (verbatim contract lines), the diagnosis …, the attempt log in order, and the exact resume command — `/dev-loop <n>` re-derives everything." | `SKILL.md` | — | ☑ |

## A15. Act 4 — the cost log

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-203 | "Once the LAST layer's Gate 2 is done and the run has nothing left to do, write one cost log per lane. Here and not per layer" | `SKILL.md` | — | ☑ |
| S-204 | The command — `mkdir -p <MAIN>/.scratch/dev-loop-cost` then `node <this-skill-dir>/cost-report.mjs --issues <n> <transcriptDir>... > … \|\| rm -f …` | `SKILL.md` | — | ☑ |
| S-205 | "`\|\| rm` because a redirect creates its file before the command runs: without it a failure leaves a zero-byte log, which reads as measured-and-free rather than unmeasured." | `SKILL.md` | — | ☑ |
| S-206 | "**One file per lane, keyed by the issue number** … `.scratch/` is gitignored" | `SKILL.md` | — | ☑ |
| S-207 | "**Every transcript directory the run captured**, planning and every layer, in one command." | `SKILL.md` | — | ☑ |
| S-208 | "**Every lane, whatever its ending** … A lane dropped at intake before any agent ran gets one too, saying it was not measured" | `SKILL.md` | — | ☑ |
| S-209 | "**Nothing goes to the issue thread or the PR body.**" | `SKILL.md` | — | ☑ |
| S-210 | "**Best-effort, and last for that reason.** A failure here … is reported and dropped. It never changes a lane's ending" | `SKILL.md` | — | ☑ |
| S-211 | "Then tell the user where the logs are. `cost-report.mjs` … measures on the metric the baseline was measured on" | `SKILL.md` | — | ☑ |

## A16. Cleanup mode

Every rule in this section moves whole to the new skill. None is deleted and none is reworded. That
records #127's landing; [#187](https://github.com/ieuanign/skills/issues/187) has since rewritten
the skill, and the **supersession block** after the table says which of these entries it retired.

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-212 | "Cleanup reaps what has an exact done-signal and **lists** what does not. It is safe to run at any time, including while another batch is mid-layer" | `cleanup` | #127 | ☑ superseded #187 |
| S-213 | "**It removes no worktree.** … a worktree still standing is one nothing proved done." | `cleanup` | #127 | ☑ superseded #187 |
| S-214 | Why the old merged-based scan was wrong — "a branch merges the moment its PR lands, which says nothing about whether the run holding that checkout has finished with it" | `docs/dev-loop.md` | #127 | ☑ |
| S-215 | "`git fetch origin <DEFAULT>`." | `cleanup` | #127 | ☑ |
| S-216 | "**Reap, by the exact signal.** A lane is done when its PR is merged (`gh pr view <branch> --json state,mergedAt`) or its branch is fully merged into `origin/<DEFAULT>`. **The `gh` arm is the load-bearing one, and the git arm is the fallback**" | `cleanup` | #127 | ☑ superseded #187 |
| S-217 | Why the git arm alone is not enough — squash and rebase replay the work under new shas, so the branch's commits are never ancestors of the default branch | `cleanup` | #127 | ☑ superseded #187 |
| S-218 | "For each done lane: delete the local branch, and delete the lane's plan file `.scratch/*/plans/<n>-*.md`" | `cleanup` | #127 | ☑ superseded #187 |
| S-219 | "Delete with `git branch -d` … Only when `-d` refuses AND the merged check above passed, re-run it as `git branch -D` … Never reach for `-D` in any other situation" | `cleanup` | #127 | ☑ |
| S-220 | "**A branch checked out in a surviving worktree cannot be deleted** … List it alongside that worktree instead of working around it; the plan file still goes." | `cleanup` | #127 | ☑ superseded #187 |
| S-221 | "**List every worktree under `<WORKTREES>`; remove none.** Per worktree, say why it is still here" — uncommitted work, nothing on the remote, or pushed with its PR still open | `cleanup` | #127 | ☑ superseded #187 |
| S-222 | "give them the `git worktree remove <path>` line to run if they agree, and never run it for them" | `cleanup` | #127 | ☑ superseded #187 |
| S-223 | "NEVER touch MAIN (the first entry of `git worktree list`) — it is not a candidate under any condition" | `cleanup` | #127 | ☑ |
| S-224 | "Report the two apart … **reaped** (branch, plan file) and **needs attention** (worktree, why it is lingering, the removal command). An empty second table is the good outcome." | `cleanup` | #127 | ☑ superseded #187 |

`S-214` is **re-destined from `cleanup` to `docs/dev-loop.md`**. It is the only entry in this group that
is pure rationale — why the *previous* implementation's merged-based worktree scan was unsafe — and a
skill is not where a superseded design is argued with. It already reads verbatim at
`docs/dev-loop.md`'s **Cleanup** section, so the re-destination records where it actually landed rather
than moving anything. The rule it justifies, `S-213`, stays in the skill with its operative clause
attached: *a worktree still standing is one nothing proved done.*

### Superseded by #187

[#187](https://github.com/ieuanign/skills/issues/187) rewrote the skill as **propose, then reap**:
one table lists every candidate a lane left behind, and only the rows a human picks are deleted.
#127 did land every entry above at its destination, so no ✓ is withdrawn, nothing is re-destined,
and the Coverage and Progress tables stand — a marked row records what the skill said, and the
marker says the entry stopped binding. `S-215`, `S-219` and `S-223` are unmarked because the rewrite
leaves them in force, and so is `S-214`, which now reads at `docs/dev-loop.md`'s **Cleanup** section
reframed rather than verbatim: why the merged signal alone is insufficient, which is what the
clean-worktree half and the pick answer.

| Entry | What the rewrite retired | What stands in its place |
|---|---|---|
| `S-212` | the reap-versus-list split — the skill no longer decides for itself which candidates it acts on | every candidate is listed and the pick decides; the safe-to-run-mid-layer clause survives verbatim |
| `S-213` | **reversed** — a picked worktree is removed | the gate replaces the prohibition: `remove` is recommended only where the pull request merged and the worktree is clean, and only a pick deletes it |
| `S-216` | the git fallback arm (a branch fully merged into `origin/<DEFAULT>`), and merged-alone as enough to act on | `gh pr view` merged **and** an empty `git status --porcelain`, both halves, and only as a recommendation |
| `S-217` | the reasoning for the `gh` arm being load-bearing, retired with the fallback it argued against | nothing replaces the entry; the squash-and-rebase fact it turns on resurfaces as why a picked row's `git branch -d` escalates to `-D` |
| `S-218` | plan files only (`.scratch/*/plans/<n>-*.md`), and "each done lane" as the trigger | every `.scratch/**/<n>-*.md` in any folder, for a picked lane, once no row of that lane is left standing |
| `S-220` | listing an undeletable branch instead of deleting it, and letting its plan file go regardless | the reap order — a picked row's worktree first — frees its branch, and its scratch waits for the lane's last row |
| `S-221` | **reversed** — the worktree list became a proposal, and a picked worktree is removed | the per-worktree reason became the table's **Why**, which names the half that failed on every `keep` row |
| `S-222` | retired outright — the skill runs `git worktree remove` itself, on a picked row | the pick is the authorisation the printed command used to stand in for; `--force` is still never passed and MAIN is still never a candidate (`S-223`) |
| `S-224` | the reaped / needs-attention split, and an empty second table as the good outcome | one proposal table, `Lane \| PR \| Worktree \| Branch \| Scratch \| Recommend \| Why`, before anything happens — then one confirmation line per picked row reaped |

**What the rewrite introduces**, as prose and with no IDs, because nothing later ticks these:
candidates come from three observable sources unioned by lane number — worktree directories under
`<WORKTREES>`, local branches, and `.scratch/**/<n>-*.md` — so each sub-lane contributes its own
row; the command line is the whole of the scope, and a lane discussed earlier in the session is not
a candidate; the table prints under both modes and the run stops at it for a plain-text answer,
since `AskUserQuestion`'s four options cannot hold an arbitrary number of rows; that answer is what
authorises a deletion, and `none`, silence or an answer that cannot be read all end the run on the
proposal; a lane whose worktree is already gone is the ordinary case to report rather than a
condition that failed; and a picked row's refused `git worktree remove` is reported with that
worktree's `git status --porcelain` verbatim and kept.

## A17. Hard rules

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| S-225 | "Invoking `/dev-loop` IS the user's explicit opt-in to multi-agent orchestration. Enter Phase A and Phase B directly … The ONLY human gates in this pipeline are Gate 1 … and Gate 2" | `SKILL.md` | — | ☑ |
| S-226 | "The one-time ask-then-persist preconditions are not gates … **Every one of them belongs to a named step that performs it**" | `SKILL.md` | — | ☑ |
| S-227 | "Never proceed past a gate without explicit user approval, unless the run mode is `unattended`." | `SKILL.md` | — | ☑ |
| S-228 | "**Append-only, whoever is watching.** … may append to issues and pull requests …, may add and remove its own workflow labels and no others, and may set state only on artifacts it created … NEVER edits an issue body, NEVER ticks an acceptance-criteria checkbox, and NEVER converts a pull request a human opened." | `SKILL.md` | — | ☑ |
| S-229 | "contracts.md's **Append-only invariant** carries the reasoning." | `ADR` | #128 | ☑ ADR-0008 |
| S-230 | "NEVER remove, force-modify, or `rm -rf` the main worktree … Worktree removal applies only to worktrees under `<WORKTREES>`, and only via `git worktree remove` without `--force`." | `SKILL.md` | — | ☑ |
| S-231 | "**Never force-push, whoever is watching.** Every push this pipeline makes is a fast-forward by construction … A rejected push is reported, never retried harder." | `SKILL.md` | — | ☑ |
| S-232 | "**Push before you remove.** A worktree is removed only after a push of its branch succeeded" | `SKILL.md` | — | ☑ |
| S-233 | "A lane worktree is a cold checkout plus its `.worktreeinclude` files and whatever the Setup command installs. Everything else an agent needs … it already has" | `SKILL.md` | — | ☑ |
| S-234 | "**Never halt, warn, or change a lane's behaviour because of what it costs.** … No argument, profile key or ending unlocks this." | `SKILL.md` | — | ☑ |
| S-235 | "contracts.md carries why a ceiling could not work and why a lane is already bounded without one" | `ADR` | #125 | ☑ ADR-0005 |
| S-236 | "Never run agents for work you can do with one Bash command (provisioning, pushing), and never do agent work (planning, coding, reviewing) yourself." | `SKILL.md` | — | ☑ |
| S-237 | "Plan paths passed to agents are always ABSOLUTE." | `SKILL.md` | — | ☑ |
| S-238 | "If the session dies mid-run, `/dev-loop <same issues>` resumes from artifacts — do not keep separate state files." | `SKILL.md` | — | ☑ |
| S-239 | "Never write a repository name, absolute path, or project-specific fact into this skill or its bundled agents" | `SKILL.md` | — | ☑ |

`S-230` and `S-231` are two of the **three destructive operations** #130 exempts from the
positive-phrasing rule; they keep an explicit ban paired with the positive. The third is `--force` on
worktree removal, carried inside `S-170` and `S-230`.

---

# B. `skills/dev-loop/contracts.md`

## B0. Header

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-1 | "This file is the single source of truth for the pipeline's role contracts, bounds, and endings." | `deleted` | #128 | ☑ |
| C-2 | "Both execution modes implement it: **Mode W** … and **Mode A**" | `deleted` | #126 | ☑ |
| C-3 | "Any behavior change edits THIS file first, then both implementations in the same change." | `deleted` | #126 | ☑ |
| C-4 | "If an implementation and this file disagree, this file governs." | `deleted` | #128 | ☑ |

`C-1` and `C-4` go because with one implementation the phase script *is* the specification: a prose
contract that can disagree with it is the drift `#121` names.

## B1. Roles

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-5 | The five-row roles table — architect, writer, reviewer, debugger, suite gate — with each role's product and whether it mutates the repo | `internals` | #125 | ☑ |
| C-6 | "**The Agent column names each role's definition, not the string that dispatches it.**" — bare when linked, namespaced when the plugin is installed | `internals` | #125 | ☑ |
| C-7 | "**A role is therefore always resolved against a namespace and never written as a literal.**" | `SKILL.md` | — | ☑ |
| C-8 | "The namespace is discovered once, at intake, by reading the roster the host already has in front of it" | `SKILL.md` | — | ☑ |
| C-9 | "Mode A resolves it implicitly … Mode W cannot: a workflow script sees no registry." | `deleted` | #126 | ☑ |
| C-10 | "A phase script carrying a bare literal **runs only for the maintainer** and dies on its first dispatch for everyone who installed the plugin." | `script` | #128 | ☑ phase-execute.js + phase-plan.js |

## B2. Append-only invariant

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-11 | The three permissions — append to issues and pull requests; add and remove its own workflow labels and no others; set state only on artifacts it created | `SKILL.md` | #128 | ☑ |
| C-12 | "It binds the host and every agent, identically in both modes — there is no ending, no ceiling and no absent human that relaxes it." | `SKILL.md` | #128 | ☑ |
| C-13 | Why the label clause sits inside the invariant — "a label add or remove destroys nothing a human authored, and human intent is what the invariant guards" | `ADR` | #128 | ☑ ADR-0008 |
| C-14 | Why per-criterion verdicts are never written back to the issue's checklist — the closing keyword closes the issue on merge, the aggregate belongs to the pull request's state, and an issue body is the one artifact a human wrote by hand | `ADR` | #128 | ☑ ADR-0008 |

`C-11` and `C-12` are the duplicate #121 names: `SKILL.md`'s copy (`S-228`) stays, `contracts.md`'s
goes, and the reasoning (`C-13`, `C-14`) lands in an ADR.

## B3. Per-stage context contract

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-15 | The five-row Receives / Reads / Returns table | `agents/` | #128 | ☑ agents/ — one row per role |
| C-16 | "The pipeline passes references rather than content wherever a reference is enough, so the cost lives in the reads" | `internals` | #125 | ☑ |
| C-17 | "The suite gate is the one stage that reads nothing … That is what makes it the cheapest stage in the pipeline." | `internals` | #125 | ☑ |
| C-18 | "The architect alone sweeps the context documents and decision records … the plan's Hard constraints section is the only channel by which anything living in those documents reaches the writer" | `agents/` | #128 | ☑ agents/architecture-engineer.md |
| C-19 | "The architect's summary bullets are lane state, not gate state" | `SKILL.md` | — | ☑ |

## B4. Return contracts

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-20 | **architect** — `STATUS: READY\|BLOCKED` + `PLAN: <path>` + summary bullets + open questions | `agents/` | #128 | ☑ agents/architecture-engineer.md |
| C-21 | **writer** — `RESULT: COMMITTED\|BLOCKED\|FAILED` + `COMMITS` + `VERIFIED` + `DEVIATIONS` + `DISPUTED` + `DIRTY` + `WORKTREE` + `FAILING` | `agents/` | #128 | ☑ agents/code-writer.md |
| C-22 | **reviewer** — `VERDICT` + `FINDINGS` + `CONTESTED` + `CRITERIA` (one verdict per criterion **the sub-lane owns**) + `NOTES`; "Zero findings ⇒ APPROVED, whatever the criterion verdicts say." | `agents/` | #128 | ☑ agents/reviewer.md |
| C-23 | **debugger** — `ROOT-CAUSE` + `OWNER: code-writer\|replan\|user\|retry` + `CONFIDENCE` + `REPRODUCED`; two routing values and two reporting values | `agents/` | #128 | ☑ agents/debugger.md |
| C-24 | **suite gate** — `STATE` + `FAILING` + `OUTPUT`; "It is the one role with no agent definition to carry that format, so whichever mode dispatches it states the format itself" | `script` | #128 | ☑ phase-execute.js |
| C-25 | **DIED** — "the call came back with nothing usable … Every DIED ends its sub-lane **FAILED** … an architect DIED is reported at Gate 1 with a re-run offer instead." | `internals` | #125 | ☑ |
| C-26 | "**A stage that returned nothing is reported as exactly that, and never as an agent that died.**" | `script` | #128 | ☑ phase-execute.js + phase-plan.js |
| C-27 | "**The ending label is unchanged, and reclassifying a transient break is not to be re-proposed.** It stays **FAILED**, because that label answers exactly one question — *is this worth retrying?*" | `ADR` | #125 | ☑ ADR-0006 |
| C-28 | "**A lane that throws is the same rule reaching the case it did not cover.** … each lane's work is wrapped once, and a throw is caught and turned into a **FAILED** ending naming the issue" | `script` | #128 | ☑ phase-execute.js |
| C-29 | "This is **mode-neutral**: a lane vanishing is a bug under `gated` too" | `deleted` | #126 | ☑ |

## B5. Per-commit implement loop

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-30 | "**bound: 2 debug+fix attempts**" and the four numbered steps, including the OWNER routing (`retry` / `code-writer` / `replan` or `user`) | `internals` | #125 | ☑ |
| C-31 | "The writer call of the **final permitted** debug+fix attempt, and no earlier one, carries one extra instruction: … commit what exists as `wip(<scope>): #<n> - commit <k> FAILED - <reason>` and return `FAILED` anyway." | `internals` | #125 | ☑ |
| C-32 | "It is evidence, not work — listed among the sub-lane's commits so the human sees it, excluded from the made count" | `internals` | #125 | ☑ |
| C-33 | "The instruction does not exempt that commit from the writer's own pre-commit hooks … nothing downstream may assume the commit exists: the push decision asks git whether the branch is ahead of its base" | `internals` | #125 | ☑ |
| C-34 | Why the implement loop keeps a flat bound where the review loop is progress-sensitive — the give-up clause must know at dispatch time that an attempt is the last | `ADR` | #125 | ☑ ADR-0002 |

## B6. Review loop

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-35 | "**bound: progress-sensitive, under a hard ceiling of 5 fix cycles**" and the six numbered steps | `internals` | #125 | ☑ |
| C-36 | "On the sub-lane's exact range `<base>..<branch>` (the base may itself be a stacked feature branch — never review the base's own commits)" | `internals` | #125 | ☑ |
| C-37 | "**Which criteria a sub-lane owns is a fact the plan states and the host applies**, never a judgement the reviewer makes at review time … Criteria the plan left unlisted fall to the **last sub-lane in plan order**" | `ADR` | — | ☑ ADR-0003 |
| C-38 | "The reviewer judges every criterion it owns against its own range … an owned criterion it cannot find is **`not-met`**. It receives the issue body verbatim and whole regardless" | `agents/` | #128 | ☑ agents/reviewer.md |
| C-39 | "the counter **advances by one unless a previously unseen finding appeared** — a new finding resets it to 1. At the repository profile's **Fix cycles** value the loop stops." | `internals` | #125 | ☑ |
| C-40 | The two worked traces — the stuck case stopping at count 2, and the three-productive-cycles case resetting | `internals` | #125 | ☑ |
| C-41 | "**The counter starts at 1, not 0** … So the threshold is a **position the counter reaches** … It follows that `1` behaves as `0` does" | `internals` | #125 | ☑ |
| C-42 | "A hard ceiling of 5 fix cycles applies regardless of progress … It is stated here and held as a constant in the phase script, and the two are compared by a drift check" | `internals` | #125 | ☑ |
| C-43 | "**Expect this to behave as a flat bound of 5 on most runs.** … so that nobody later 'fixes' the counter for not advancing." | `ADR` | #125 | ☑ ADR-0002 |
| C-44 | "The ceiling being 5 where the suite gate's is 8 encodes cost: a review cycle dispatches the two dearest agents in the pipeline" | `ADR` | #125 | ☑ ADR-0002 |
| C-45 | "Two findings match when their **file and defect clause** match once normalised, **with the line number dropped** … Nothing else in a finding is compared" | `internals` | #125 | ☑ |
| C-46 | "The comparison is deliberately conservative. Declaring two findings the same is what ends the loop early" | `internals` | #125 | ☑ |
| C-47 | "**It is the host's own arithmetic, in plain code, and no agent is dispatched to do it** … The reviewer's return contract is unchanged" | `script` | #128 | ☑ phase-execute.js |
| C-48 | "When the loop ends on either bound, the ending reason names **which bound fired** and states, per round, whether it brought previously-unseen findings or repeated prior ones." | `internals` | #125 | ☑ |
| C-49 | "The `CRITERIA` verdicts pass straight through this loop untouched — the spec axis is **reported and never blocking** … and, under `unattended`, in the terminal-state table, which is the one place a verdict decides anything at all." | `internals` | #125 | ☑ |

## B7. Suite gate

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-50 | "**bound: 8 rounds, and 2 rounds without a previously unseen failure**" | `internals` | #125 | ☑ |
| C-51 | "**Once per sub-lane, not once per lane.** … every PR carries its own suite result." | `internals` | #125 | ☑ |
| C-52 | "**The command is configuration, never discovery.** … With no command the gate reports **not run** and dispatches nothing to say so" | `internals` | #125 | ☑ |
| C-53 | "**The agent is a plain subagent with no persona and deliberately no agent type**, at the cheapest model and the lowest effort … It is given a label, so it appears by name in the progress display" | `script` | #128 | ☑ phase-execute.js |
| C-54 | Why the suite gate has **no agent definition** while the notifier has one — the asymmetry, recorded so it is not later "fixed" | `internals` | #125 | ☑ |
| C-55 | "**Position: after the review loop, before the conclusion.** … A sub-lane whose review loop already ended it never reaches the gate" | `internals` | #125 | ☑ |
| C-56 | "**A red suite is diagnosed, not handed straight to the writer** … A red result routes to the **debugger**" and the three reused routes | `internals` | #125 | ☑ |
| C-57 | "Ordinary review findings still go straight to the writer: they already arrive with a failure scenario and a suggested fix" | `internals` | #125 | ☑ |
| C-58 | "Accepted cost, recorded rather than solved: the fix commits a red suite produces land **after** the review loop has closed, so a lane's final commits are never reviewed." | `internals` | #125 | ☑ |
| C-59 | The round counter and its two traces, plus "A hard ceiling of **8** rounds applies regardless of progress … Both bounds are checked before the round's debugger is dispatched" | `internals` | #125 | ☑ |
| C-60 | The gate's four endings and their labels — counter at 2 or the 8-round ceiling ⇒ HALT; `replan`/`user` ⇒ HALT; a writer `BLOCKED` ⇒ HALT, `FAILED` or nothing ⇒ FAILED; the gate or debugger returning nothing ⇒ FAILED | `internals` | #125 | ☑ |

## B8. Commit-breakdown check

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-61 | "the host compares two lists it already holds … This is a list diff in plain code — no agent is dispatched to notice it, and none is paid to." | `internals` | #125 | ☑ |
| C-62 | "The result is carried as `<n> planned, <m> made`, both scoped to the ordinals this run was asked to make … A mismatch is **reported and never blocks**" | `SKILL.md` | — | ☑ |

## B9. HALT and FAILED

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-63 | "one question selects it: **did something deliberately stop, or did something break?**" — HALT and FAILED defined | `SKILL.md` | #128 | ☑ |
| C-64 | "**The label decides nothing.** Nothing in this pipeline branches on it" | `SKILL.md` | #128 | ☑ |
| C-65 | "**An ending ends its sub-lane, not its lane.** … The lane's own label is a roll-up for reporting only — `FAILED` if any sub-lane ended `FAILED`, else `HALT` if any ended `HALT`, else clean." | `internals` | #125 | ☑ |
| C-66 | "**A sub-lane runs no stage after the one that ended it**, with no exceptions to remember" | `internals` | #125 | ☑ |
| C-67 | "Every loop above is bounded — nothing retries indefinitely — and no ending kills the batch. Every ending reports its label, its stage, the verbatim contract lines that produced it, its attempt log, and the exact resume command" | `SKILL.md` | — | ☑ |
| C-68 | "A lane whose base lane ended — or was held by the user — never runs at all, so it ends **HALT** with that reason." | `SKILL.md` | — | ☑ |

## B10. Token spend is reported, never enforced

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-69 | "**No lane halts, warns, or changes its behaviour because of what it costs.** There is no token ceiling, no per-lane budget and no cost-triggered ending anywhere in this pipeline" | `SKILL.md` | #128 | ☑ |
| C-70 | "A ceiling was specified once and dropped, because it could not work." — the budget total is unset unless a human typed a directive; the spend figure is turn-wide; it counts output tokens; the transcripts are unreachable from a workflow script | `ADR` | #125 | ☑ ADR-0005 |
| C-71 | "**It was also unnecessary, and this is the load-bearing half.** A lane is already bounded in agent invocations from five directions" | `ADR` | #125 | ☑ ADR-0005 |

`C-69` is the second duplicate #121 names: `SKILL.md`'s copy (`S-234`) stays and this one goes, with
the reasoning to an ADR.

## B11. Lane conclusion

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-72 | "**the only branch point in this file** … Every other section of this contract is single-version" | `deleted` | #126 | ☑ |
| C-73 | The gated / unattended table — Push, Pull request, Explanation | `internals` | #125 | ☑ |
| C-74 | "The explanation is identical in both: what stopped or what broke, its stage, the diagnosis …, and the attempt log in order. Mode changes where it is written, never what it says." | `internals` | #125 | ☑ |
| C-75 | "**One exception, and only one.** A sub-lane where nothing landed at all … has no branch ahead of its base … This is the only ending in the pipeline that opens no pull request." | `SKILL.md` | — | ☑ |
| C-76 | **gated** — "A clean sub-lane reaches Gate 2 for push/PR approval … an ended sub-lane is *offered* there rather than pushed around it" and the human's arbitration of contested findings | `SKILL.md` | — | ☑ |
| C-77 | "Gate 2 for a layer fires before the next layer is provisioned, so a dependent layer is never built on a base the human has not vetted." | `SKILL.md` | — | ☑ |
| C-78 | **unattended** — "there is no human to conclude the lane, so the table above happens unprompted and notifications fire" | `SKILL.md` | — | ☑ |
| C-79 | "**Mode A implements the gated half only, and never the unattended half.**" | `deleted` | #126 | ☑ |

## B12. Push

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-80 | "A sub-lane's branch reaches the remote exactly once, and never before its own work is finished." | `SKILL.md` | — | ☑ |
| C-81 | "**The push is guarded on the branch being ahead of its base, read from git.**" | `SKILL.md` | — | ☑ |
| C-82 | "**Never a force-push, in either mode.** … A rejected push stops that sub-lane's conclusion where it stands: no pull request is created, the worktree is **kept**, and git's own message is reported verbatim. It is reported **FAILED**" | `SKILL.md` | — | ☑ |
| C-83 | "In a repository whose habit is to rebase, the commonest real cause is a human having rebased or amended inside the lane's worktree while it ran." | `internals` | #125 | ☑ |
| C-84 | "**Per-commit push is not implementable, and is not to be re-proposed.**" — the whole commit loop runs inside one workflow call and a workflow script has no shell | `ADR` | #125 | ☑ ADR-0007 |
| C-85 | "**Accepted cost, recorded rather than solved.** This version is always one layer, so the end of a layer is the end of the run" | `internals` | #125 | ☑ |

## B13. Stack linking

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-86 | "**The call fires at the very end of the batch** — after every sub-lane of every lane has pushed and opened its pull request, and never per layer." | `SKILL.md` | #128 | ☑ |
| C-87 | "**One call per chain, not one per batch.** … the host walks each maximal chain of the base relation and links that chain. A chain of **fewer than two** pull requests is not a stack and is skipped" | `SKILL.md` | #128 | ☑ |
| C-88 | "**A gap in a chain is shown, never closed up.** … the walk **stops at a sub-lane with no pull request**" | `SKILL.md` | #128 | ☑ |
| C-89 | "**The pull requests are identified by number, bottom to top.** Never by branch name." | `SKILL.md` | #128 | ☑ |
| C-90 | Why branch names would make the tool a second, competing author — it would push, open its own pull requests, and overwrite the title, body and `Closes #<n>` | `internals` | #125 | ☑ |
| C-91 | "**Ready-for-review is never requested.** … a batch-wide flag applied at link time would override every one of those decisions from the wrong place" | `SKILL.md` | #128 | ☑ |
| C-92 | "**No local state, in either direction.** … Linked worktrees share one common git directory, so any command that *did* keep local stack state would have every concurrent lane racing over the same files" | `internals` | #125 | ☑ |
| C-93 | "**A machine without the tool behaves exactly as it does today.** … No gate checks for it, no precondition asks about it, no run fails or prompts for want of it" | `SKILL.md` | #128 | ☑ |
| C-94 | "**A failed link is reported and costs nothing else.** … Losing the stack never costs the run the work." | `SKILL.md` | #128 | ☑ |
| C-95 | "Neither mode is exempt and neither differs: this subsection is single-version" | `deleted` | #126 | ☑ |

## B14. The worktree invariant

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-96 | "A sub-lane's worktree is removed when, and only when, its work has reached the remote **and no human is expected to resume in it**." | `SKILL.md` | #128 | ☑ |
| C-97 | The five-row state table — concluded clean, ended unattended, ended gated, held at Gate 2, removal refused | `SKILL.md` | #128 | ☑ |
| C-98 | "**Push succeeds first, remove second.** … Nothing removes a worktree it did not just watch a push succeed for." | `SKILL.md` | #128 | ☑ |
| C-99 | "**A dirty worktree keeps itself.** … that refusal *is* the guard — the pipeline never passes `--force`, so it can never talk its way past one." | `SKILL.md` | #128 | ☑ |
| C-100 | "The invariant's **second** condition is what keeps a `gated` ended sub-lane's worktree" | `internals` | #125 | ☑ |
| C-101 | "The held row falls out of the **first** condition rather than needing a rule of its own" | `internals` | #125 | ☑ |
| C-102 | "**The main worktree is never a removal candidate** — not under any state above, in either mode, and not in cleanup mode either." | `SKILL.md` | #128 | ☑ |
| C-103 | "A removed worktree is not lost work **for anything tracked**: a resumed lane re-provisions from the branch" | `internals` | #125 | ☑ |
| C-104 | "**Removal destroys the worktree's ignored files, deliberately — and says which ones first.**" | `SKILL.md` | #128 | ☑ |
| C-105 | The rejected alternatives — keeping the worktree strands one per sub-lane, and copying the files back writes throwaway output into the main checkout | `internals` | #125 | ☑ |
| C-106 | "A path that must outlive its sub-lane is committed. Being tracked is what makes it survive, and it is also what takes it off this list." | `internals` | #125 | ☑ |
| C-107 | "An architect writing a plan applies the same rule in advance — a gitignored touchpoint is named as work the sub-lane does, never as a deliverable" | `agents/` | #128 | ☑ agents/architecture-engineer.md |

## B15. The terminal-state table

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-108 | The seven-row table — clean; suite not-run with nothing open; open findings; suite still red; a criterion not met; ended with commits; ended with nothing landed | `internals` | #125 | ☑ |
| C-109 | "**The ready predicate is one expression**: the sub-lane **concluded clean**, and its **findings are resolved**, and the **suite passed or did not run**, and **every acceptance criterion the sub-lane owns is met**." | `internals` | #125 | ☑ |
| C-110 | "It is written as that four-way conjunction and not reduced to the shortest expression equivalent to it today." | `internals` | #125 | ☑ |
| C-111 | "**An ended sub-lane is never ready**, whatever its ledger says." | `internals` | #125 | ☑ |
| C-112 | "**A `partial` criterion drafts alongside a `not-met` one.** Nobody watched the run, so 'not demonstrably done' defaults to draft" | `internals` | #125 | ☑ |
| C-113 | "A draft is the honest signal that the pipeline could not finish its own job, and one rule covers all four exhaustion paths" | `internals` | #125 | ☑ |
| C-114 | "**Work that exists stays reviewable.** … Work that does not exist opens nothing — the last row, and a narrow case" | `internals` | #125 | ☑ |
| C-115 | "**Every row is decided per sub-lane, from that sub-lane's own inputs.** … one sub-lane's draft never drafts another's." | `script` | #128 | ☑ phase-execute.js |
| C-116 | "**The pipeline sets state only on pull requests it created** … The PR-comment input therefore needs no rule of its own here" | `SKILL.md` | — | ☑ |
| C-117 | "**Git is the authority on the Push column.** … Nothing ahead ⇒ the last row, whatever was proposed." | `SKILL.md` | — | ☑ |

## B16. Findings ledger

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-118 | The ledger's categories — fixed, won't-fix, arbitrated, acceptance criteria, reviewer NOTES, review trajectory, suite, attempt log | `SKILL.md` | #128 | ☑ |
| C-119 | "**arbitrated** … Always empty under unattended mode, where nobody rules — no conditional needed." | `SKILL.md` | #128 | ☑ |
| C-120 | "**attempt log** — everything the pipeline did *after* something first went wrong, in order … Stages that worked are already in the commit list … Recorded on every sub-lane and rendered only on one that ended" | `internals` | #125 | ☑ |
| C-121 | "**review trajectory** … Recorded on every sub-lane and rendered only where a bound ended one, like the attempt log." | `internals` | #125 | ☑ |

## B17. The whole-issue roll-up

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-122 | "The **last sub-lane of a lane** therefore carries, in its pull request body beneath its own criteria section, every acceptance criterion of the issue with its verdict and the sub-lane that judged it." | `profile` | #129 | ☑ |
| C-123 | "**The host assembles it from sub-lane records it already holds**, so no agent is dispatched and no stage is added to any loop." | `SKILL.md` | — | ☑ |
| C-124 | "**It is reporting only.** It feeds no predicate, changes no terminal-state row, and decides nothing" | `internals` | #125 | ☑ |
| C-125 | "**Omitted on a lane with a single sub-lane**, where the whole issue is that sub-lane's and the roll-up would repeat the section above it verbatim." | `profile` | #129 | ☑ |
| C-126 | "Single-version: both execution modes compose it identically, because the pull request body is the host's in both." | `deleted` | #126 | ☑ |

## B18. Sequencing

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-127 | "Lanes run in parallel. Within a lane: sub-lanes sequential, and within a sub-lane: plan commits sequential → review loop → suite gate → commit-breakdown check … The breakdown check stays last so that it counts whatever the gate appended." | `internals` | #125 | ☑ |
| C-128 | "**Layers and stacks are different shapes, and the pipeline has both.**" — a layer is horizontal, a stack vertical, with a trunk, a bottom and a top | `SKILL.md` | — | ☑ |
| C-129 | "**The layer rule**: anything based on the trunk runs in **layer 1**; anything based on a branch that receives its commits in **layer N** runs in **layer N+1**." | `SKILL.md` | — | ☑ |

## B19. Touchpoint overlap

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-130 | The three-outcome table with its Outcome / What it is / Layer / Based on / Dependency claimed columns | `SKILL.md` | #128 | ☑ |
| C-131 | "**The classification is the host's own work, in plain reading, and no agent is dispatched to do it.**" | `SKILL.md` | #128 | ☑ |
| C-132 | "**Additive co-touch stays parallel and accepts the rebase.** … Serialising them would cost a whole layer of wall-clock to avoid that." | `internals` | #125 | ☑ |
| C-133 | "**The line between the first two outcomes is the repository's to move, and only that line** … in the **Overlapping changes** section of its `.claude/rules/pr-separation.md`" | `SKILL.md` | #128 | ☑ |
| C-134 | The declaration table — `additive` (the default), `strict`, `parallel`, and where each puts the line | `SKILL.md` | #128 | ☑ |
| C-135 | "**A real dependency is never declarable and never moves.** … the alternative is a pull request that does not build against its base." | `SKILL.md` | #128 | ☑ |
| C-136 | "`parallel` is the one value that ships a known conflict rather than avoiding one … it is not the default for the same reason it is not free." | `internals` | #125 | ☑ |
| C-137 | "The declaration reaches the host ambiently: project rules load at launch, so no step fetches this file and no profile key mirrors it." | `SKILL.md` | #128 | ☑ |
| C-138 | "**The last two outcomes are physically identical and differ in what they claim.**" | `SKILL.md` | #128 | ☑ |
| C-139 | "That distinction is the point of having three outcomes rather than two." — collapsing either way loses something real | `internals` | #125 | ☑ |
| C-140 | "**A same-region co-touch says so where a human can see it.** … sequenced to avoid a textual conflict, not because one lane needs the other" | `SKILL.md` | #128 | ☑ |
| C-141 | "Sequencing a same-region co-touch is what *avoids* the conflict rather than merely deferring it" | `internals` | #125 | ☑ |
| C-142 | "an unattended run performs the same intersection over the same File touchpoints, applies the same three outcomes, and reaches the same layer assignment … **The dependency case takes the option the supervised path already marks recommended: B is stacked on A.**" | `SKILL.md` | #128 | ☑ |
| C-143 | "**The defer remedy is absent, and this is the reason rather than an oversight.** … deferring a lane the developer explicitly asked for would silently return less work than was requested." | `internals` | #125 | ☑ |
| C-144 | "**The discovered-blocker comment is posted identically.** … The same-region outcome still posts nothing" | `SKILL.md` | #128 | ☑ |
| C-145 | "**Two accepted costs, recorded rather than solved.**" — a misclassified dependency surfaces as a red suite or failed writer in B's lane; a same-region co-touch read as additive conflicts at merge time | `internals` | #125 | ☑ |

## B20. Mode implementations

| ID | Rule | → | By | ✓ |
|---|---|---|---|---|
| C-146 | "**Mode W**: `phase-plan.js` (Phase A) and `phase-execute.js` (Phase B) run on the Workflow tool with the args documented in SKILL.md; their embedded JSON schemas mirror the return contracts above." | `SKILL.md` | #126 | ☑ |
| C-147 | "**Mode A**: the orchestrator drives the Agent tool directly — one background agent per parallel unit …, sequential awaits inside a lane." | `deleted` | #126 | ☑ |
| C-148 | "**Mode A is tier-locked, by construction.** … This is a property of the mode, not an oversight." | `ADR` | #126 | ☑ ADR-0004 |
| C-149 | "**Unattended mode runs only under Mode W.**" and the three independently sufficient reasons — per-stage effort is impossible; the notifier fires from inside the phase script; "**Bound enforcement is mechanical in a script and merely remembered by a model otherwise.**" | `ADR` | #126 | ☑ ADR-0004 |
| C-150 | "Mode A is kept for the supervised run, where none of the three bites. Its one real firing was a manual-recovery path … It is not a fallback for a missing tool." | `ADR` | #126 | ☑ ADR-0004 |

---

# C. Coverage

| Destination | Entries |
|---|---|
| `SKILL.md` | 223 |
| `internals` | 72 |
| `deleted` | 22 |
| `ADR` | 18 |
| `cleanup` | 15 |
| `agents/` | 11 |
| `docs/dev-loop.md` | 10 |
| `script` | 9 |
| `profile` | 5 |
| `notifications.md` | 4 |
| **total** | **389** |

`S-1`–`S-239` are `SKILL.md`'s, `C-1`–`C-150` are `contracts.md`'s. The two ranges are independent and
no ID is reused.

The `SKILL.md` column is large and that is expected: most of it is **steps**, which are host load by
definition and are staying. The compression comes from the other nine rows — 166 entries leaving the
orchestrator's window — plus #130's rewriting of what remains.

## What "deleted" covers

Twenty-two entries, every one of them in one of three groups:

1. **Mode A and its vocabulary** (#126) — `S-16`, `S-60`, `S-61`, `S-62`, `S-66`, `S-73`, `S-92`,
   `S-146`, `C-2`, `C-3`, `C-9`, `C-29`, `C-72`, `C-79`, `C-95`, `C-126`, `C-147`. Seventeen entries,
   the one behaviour change in #121, recorded in ADR-0004. What is lost is recorded there rather than
   here.
2. **`contracts.md`'s own normativity** (#128) — `S-8`, `S-140`, `C-1`, `C-4`. The file stops
   existing, so its claims about being the file that governs stop applying. Every rule it *held* has
   a destination above; only the claims about the file itself go.
3. **The orchestrator's second read of the notifications specification** (#129) — `S-29`. The
   notifier reads it; the orchestrator states its own three events inline, so nothing is unwritten —
   only unloaded.

No rule that binds a run's behaviour is deleted except by group 1, and group 1 is one recorded
decision.

## Ticking

A ticket ticks an entry when the rule is present at its destination in that ticket's commit. #131
verifies that every entry is ticked, or explicitly marked dropped with a reason.

**Where a ticked entry landed** is the destination token, plus one convention: `docs/dev-loop.md` and
`docs/dev-loop-internals.md` are organised under headings that mirror this file's own section names,
so an entry from `B7. Suite gate` landed under the internals doc's *The suite gate* heading. Where a
token names a class rather than a file — `ADR`, `agents/` — the tick cell names the specific file.

### Progress

| Ticket | Entries it lands | Ticked |
|---|---|---|
| #132 | this file | n/a |
| #125 | 72 `internals` + 9 `docs/dev-loop.md` + 9 `ADR`, plus the 2 already carried by ADR-0003 | **92 / 92** |
| #126 | 17 `deleted` + 4 `ADR` (0004) | **21 / 21** |
| #127 | 15 `cleanup` + 1 `docs/dev-loop.md` (`S-214`, re-destined — see below) | **16 / 16** |
| #128 | 8 `agents/` + 8 `script` + 4 `deleted` + 3 `ADR` | **23 / 23** |
| #129 | 5 `profile` + 4 `notifications.md` + 3 `agents/` + 1 `script` + 1 `deleted` | **14 / 14** |
| #130 | rewrites what stays in `SKILL.md`; ticks nothing new | n/a |
| #131 | verifies the 223 `SKILL.md` entries survived that rewrite | **223 / 223** |
| **Total** | | **389 / 389** |

The 223 `SKILL.md` entries move nowhere: they are the steps, and they stay. #131 ticks them by
verifying they are still **present** after #130's rewrite, which is a different claim from the one
every other tick makes — those say a rule reached its new home, these say a rule never left.

**Every one of the 389 entries is now ticked. Nothing was dropped**, so the "or explicitly marked
dropped with a reason" arm of #131's criterion has no occupants.

How the 223 were checked: each row was compared against the pre-rewrite blob
(`git show fa97fe8^:skills/dev-loop/SKILL.md`, 68,820 bytes) rather than against this file's own
summary of it, and every deletion was traced to a surviving binding site. 220 were present as
written. Three had been **weakened** — a clause with independent scope had gone while the rule around
it survived — and all three were restored before ticking:

| Entry | What the rewrite dropped | Why it mattered |
|---|---|---|
| `S-236` | the open-ended form of "work one Bash command does is yours", left as a two-item enumeration | ADR-0007 cites the general rule by name as the reason per-commit push may not spend an agent on `git push`; an enumeration does not bind the next cheap task nobody listed |
| `C-137` | "and no profile key mirrors it" | the config-home rule points a future implementer at the profile for exactly this per-repository value, so without the clause nothing forbade the derived copy ADR-0001 exists to prevent |
| `C-128` | the explicit layer-is-horizontal / stack-is-vertical statement | it survived only in `CONTEXT.md`, which does not ship in the plugin, so a consumer lost the distinction entirely |
