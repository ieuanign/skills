---
name: dev-loop
description: Issue-to-PR pipeline — plans, implements and reviews GitHub issues, each in its own git worktree, with gates at plan approval and push/PR. Use for `/dev-loop <issues>`, or `/dev-loop auto` for an unattended run.
---

# /dev-loop — issue-to-PR pipeline

You are the orchestrator. You stay in the MAIN worktree; the agents plan, write, review and debug (architecture-engineer, code-writer, reviewer, debugger). Yours: intake, gates, worktree provisioning and removal, push, PRs — and, under `unattended`, the notifications at your own boundaries. The fifth roster agent, the **notifier**, is dispatched by `phase-execute.js` mid-script for a lane that ends, never by you: the mid-lane endings are its writes, against its own specification, and the four ⟨notify⟩ boundaries are yours. All agent returns are machine-readable — trust the contract keys (`STATUS/RESULT/VERDICT/OWNER`). The phase scripts enforce the pipeline's state machine — every cycle cap, route and ending — and you re-enforce none of it.

## Arguments

`/dev-loop [auto] <issues> [project:<slug>]`

- `auto` — optional leading token: run the batch **unattended**, from filed issue to pushed PR, without stopping for approval.
- `<issues>` — one or more GitHub issue numbers, comma or space separated. One issue = one lane; several = parallel lanes.
- `project:<slug>` — optional project slug passed to the architect for the plan path.
- Tidying up after a run is its own skill, **`/dev-loop-cleanup`** — `/dev-loop cleanup` goes there.

## The acts — a file per act, read at its boundary

The run is a fixed sequence of acts and gates, each holding its whole contract in its own file under `<this-skill-dir>/acts/`. **Before performing an act or gate, read its file — at EVERY boundary where it fires**, so an act that runs per layer is read per layer. This spine carries only what binds between acts; the freshly read file is the current word on the act it names, whatever this conversation has been through since the last read.

Once per run, in order:

1. **Act 0 — Intake** (`acts/act-0.md`): parse the arguments and derive the run mode ONCE; compute the Derived facts below and read the repo profiles; preconditions, with the **⟨notify⟩ intake refusal**; fetch and vet the issues; stateless resume check from artifacts; the profile asks; ends on **⟨notify⟩ lane start**.
2. **Act 1 — Phase A: plans** (`acts/act-1.md`): one architect per issue through `phase-plan.js`; KEEP each summary and transcript directory for Gate 2 and Act 4; **⟨notify⟩ plan comment**.
3. **Gate 1 — plan approval** (`acts/gate-1.md`): present every lane — summaries, plan paths, open questions; touchpoint overlaps classified; lanes split into sub-lanes and layers; only approved lanes proceed.

Then per LAYER — **a layer is horizontal and a stack is vertical**, and the pipeline has both: a layer is the set of sub-lanes that run concurrently, all based on branches that already hold their commits, while a stack is a chain of branches each based on the one below, sitting on the trunk with a bottom directly on it and a top nothing is based on. **Anything based on the trunk (`origin/<DEFAULT>`) runs in layer 1; anything based on a branch that gets its commits in layer N runs in layer N+1** — this applies to stacked _lanes_ AND to dependent _sub-lanes_ within one lane, so a frontend sub-lane based on its own backend sub-lane's branch waits for the next layer. Provision a layer only after its bases completed the previous one:

4. **Act 2 — Provisioning** (`acts/act-2.md`): per sub-lane of the layer — worktree from its base, `.worktreeinclude` copies, Setup command.
5. **Act 3 — Phase B: execute** (`acts/act-3.md`): the layer through `phase-execute.js`; its layer-invariant material — the argument contract and the result shapes — is its own file, `acts/act-3-contract.md`, read once at the run's FIRST Act 3; each result carries what Gate 2 disposes of; between layers, the finished lanes' Gate 2 first, then authorization to proceed.
6. **Gate 2 — push & PR** (`acts/gate-2.md`): per layer, every sub-lane it finished — push, pull request, the worktree invariant, **⟨notify⟩ lane conclusion**; its layer-invariant material is its own file, `acts/gate-2-reference.md`, read once at the run's FIRST Gate 2; stack linking once at the batch's LAST Gate 2, whose contract is its own file, `acts/gate-2-linking.md`, read at that one boundary.

Last, once per run:

7. **Act 4 — the cost log** (`acts/act-4.md`): `unattended` only — one cost log per lane, for every lane the run was asked to work; best-effort, and last.

### Run mode — `gated` or `unattended`

`auto` present ⇒ **unattended**; absent ⇒ **gated**. Act 0 parses it ONCE and carries it as a single value for the whole run — no later stage re-derives it from the arguments. It decides exactly four things:

> **Gate suppression.** Both gates raise their questions under `gated`, and neither raises any under `unattended`.

> **Notifications.** Under `unattended` you emit your four events, at the boundaries marked **⟨notify⟩** in the act files; under `gated`, none of them. Each ⟨notify⟩ boundary says *what* to run and never *whether*, and what each event says is stated at the boundary that writes it.

> **Cost log.** Under `unattended` you write Act 4's per-lane cost log; under `gated`, none. Act 4 says what to write and never whether, and the transcript directories it needs are captured under both modes.

> **Preconditions.** The one-time ask-then-persist preconditions are not gates, so gate suppression does not reach them — this line decides them instead. Under `gated` every one asks its question exactly as it always has. Under `unattended` not one of them asks: each resolves either to a **documented default**, used for this run, reported, and written into no profile — a value persisted unattended spends the repository's one question, and the human who would have chosen it is never asked — or, where no default is honest, to a **refusal** naming every missing prerequisite at once. Each precondition site says which of the two its answer is, and never whether it fires — every site in the act files, and every one in any other skill running this pipeline's preconditions.

### How you write a ⟨notify⟩ event

You write four events — intake refusal, lane start, plan comment, lane conclusion — and this section is the whole of what they are. The mid-lane endings are the **notifier's**, written from inside the phase script against a specification you never load and never restate.

**The message shape** is the issue number, a state token, the reason where one exists, then the link — the pull request link where one exists, the issue link otherwise. Your tokens are `start` at intake, `draft` or `ready` at the conclusion, and `failed` for an intake refusal:

```
#105 start: <issue link>

#105 draft: 2 findings open, suite green
<pr link>

#105 ready:
<pr link>

failed: <the prerequisites the refusal names>
#105 <issue link>
#106 <issue link>
```

**The reason stays**, and **no message carries the run handle.** A lane with one sub-lane emits the single-line shape exactly; a lane with several emits one line per sub-lane under a shared header naming the issue once, having no single state or link of its own. A refusal is that same shared header applied to the RUN — its state and reason once, then one line per issue the arguments named — and it is one message for the whole run rather than one per lane, no lane having started.

**No notification failure changes the lane it reports.** A `gh` command that fails, a role the repository has no label string for, an unreachable channel — each is reported and then let go.

The commands:

- **A label is `gh issue edit <n> --add-label/--remove-label`.** Resolve its three roles to strings ONCE at Act 0, through the repo's own `docs/agents/triage-labels.md`, per that file's roles-never-strings rule. No label string is ever written into this skill.
- **A comment is `gh issue comment <n> --body-file -`**, with the body piped in from a **quoted** heredoc (`<<'BODY'`), whatever the body carries.
- **A message is `<this-skill-dir>/notify.sh <<'MSG' … MSG`**, which reads its payload on standard input the same way. It implements the specification's channel contract, so an unconfigured channel is already handled inside it: it needs no check, no question and no profile key.

## Derived facts (compute once at Act 0 — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **REPO** — `basename` of MAIN.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`. Every lane worktree lives here; the directory slug is the branch name after its first `/` (`feat/208` → `<WORKTREES>/208`).
- **GitHub repo** — every `gh` command runs inside a checkout of this repo (worktrees included) and gh infers the repository from the remote, so no `gh` command carries `--repo`.
- **RUN HANDLE** — the identifier that locates this run's own transcript, read once from your environment: `$CLAUDE_CODE_SESSION_ID`. Unset or empty ⇒ **there is no handle**: carry the empty string, write no line for it anywhere, ask nothing, and change nothing else about the run. It is written in exactly two places — the ending comment on the issue, and the pull request body of an ended sub-lane — and never in a message. It is a **run handle, never a resume identifier**: `/dev-loop <n>` re-deriving from artifacts remains the resume mechanism.
- **Fast copy** — macOS: `/bin/cp -Rc` (APFS clonefile, instant; MUST be `/bin/cp` — a GNU cp on PATH rejects `-c`); Linux: `cp -R --reflink=auto`; anywhere else: plain `cp -R`.

## Hard rules

- Invoking `/dev-loop` IS the user's explicit opt-in to multi-agent orchestration. Enter Phase A and Phase B directly — running a phase is NOT a gate. The ONLY human gates in this pipeline are Gate 1 (plan approval) and Gate 2 (push/PR), and under `unattended` neither asks anything. The one-time ask-then-persist preconditions are not gates: the profile's keys, `.worktreeinclude`, and the runner setting Act 0 asks about are each asked once ever under `gated`, and under `unattended` none of them asks at all — the **Preconditions** rule under Run mode is what says how each resolves. **Every one of them belongs to a named step that performs it**, and the two Phase B needs — **Full-suite command** and **Fix cycles** — are Act 0's step 9's.
- Proceed past a gate only on explicit user approval, unless the run mode is `unattended`.
- **Append-only, whoever is watching.** The run may append to issues and pull requests (`gh issue comment`, `gh pr comment`), may add and remove its own workflow labels and no others, and may set state only on artifacts it created — its own branches, its own PRs, its own plan files. Issue bodies, acceptance-criteria checkboxes and pull requests a human opened are left exactly as they are; per-criterion verdicts are *reported*, never written back to the issue's checklist. **This invariant binds you and every agent** — there is no ending, no ceiling and no absent human that relaxes it.
- **Worktree removal never passes --force.** `git worktree remove` without it refuses on tracked modifications or on untracked non-ignored files, and **that refusal IS the guard**: report `git -C <wt> status --porcelain` verbatim and keep that worktree. Ignored files, such as the configuration and dependency directories provisioning copies in, do not trip it. `/dev-loop-cleanup` and `/pr-comments` state this same guardrail, deliberately — every skill that removes a worktree carries its own copy, because none of the three loads the others.
- **The main worktree is never a removal candidate.** NEVER remove, force-modify, or `rm -rf` it, and before any removal confirm the path is NOT the first entry of `git worktree list`. Worktree removal applies only to worktrees under `<WORKTREES>`, and only via `git worktree remove`.
- **Never force-push, whoever is watching.** Every push this pipeline makes is a fast-forward by construction, so forcing is never the fix. A rejected push is reported and its worktree kept, never retried harder.
- **Push before you remove.** A worktree is removed only after a push of its branch succeeded; a push that failed or never ran keeps its worktree.
- A lane worktree is a cold checkout plus its `.worktreeinclude` files and whatever the Setup command installs. Everything else an agent needs — skills, roster, settings, permissions — it already has: it runs in a session rooted in MAIN whatever directory it works in.
- **Never halt, warn, or change a lane's behaviour because of what it costs.** Token spend is reported by Act 4 and enforced nowhere. **There is no token ceiling, no per-lane budget and no cost-triggered ending anywhere in this pipeline** — every loop is already bounded without one, and no argument, profile key or ending unlocks this.
- Work that one Bash command does is yours, whatever it is — provisioning and pushing among them; planning, coding, reviewing and debugging are the agents'.
- Plan paths passed to agents are always ABSOLUTE.
- If the session dies mid-run, `/dev-loop <same issues>` resumes from artifacts — do not keep separate state files.
- Every repository name, absolute path and project-specific fact stays out of this skill and its bundled agents — repo facts belong to the repo profile and the repo's own docs, so the skill folder stays copyable to any machine as-is.
