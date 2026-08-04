# 0001 — Where a consuming repo's configuration lives

**Status**: accepted

A repo installing this plugin has four plausible places to put a fact about itself, and until now
nothing said which. `docs/agents/coding-standards.md` was the cost of that: a rubric distilled from
the repo's `CLAUDE.md` files, half of which was a verbatim copy of rules that already existed a
directory away, with no mechanism to re-sync. The `reviewer` agent read the same rule twice at two
different bindingness levels — `CLAUDE.md` as "binding hard rules" and the derived copy as "always a
judgement call" — so a drifted copy could silently contradict its own source.

## Decision

Four homes, discriminated by **the uninstall test**: _would this still bind if the plugin were gone?_

| Home | Holds | Examples |
|---|---|---|
| `CLAUDE.md` + `.claude/rules/*.md` | binds with the plugin uninstalled | PR separation, stacked-PR handling, comment conventions |
| `docs/agents/*.md` | per-repo, **meaningless** without the plugin, machine-independent | `dev-loop.md`, `triage-labels.md`, `smell-overrides.md` |
| the skill or a bundled agent | does not vary by repo | the twelve-smell baseline, the gate structure |
| **nowhere** | varies by **machine** — detected at runtime, never declared | is `gh-stack` installed, is the Workflow tool available |

`CLAUDE.md` and `.claude/rules/*.md` are one tier with two physical files: Claude Code loads project
rules at launch with the same priority as `.claude/CLAUDE.md`, and delivers both to every custom
subagent, so the choice between them is organisation and path-scoping — never bindingness.

Two corollaries, each of which deleted something real:

1. **No derived copies** — nothing under `docs/agents/` restates a fact stated elsewhere in the repo.
   A derived file is a cache with no invalidation, and every reader that would consult it can read
   the source instead.
2. **No machine facts in git** — nothing that varies by machine enters a committed file. A teammate
   whose machine differs must get a silent no-op, not a broken run, so tool availability is probed
   rather than declared.

This sits under `/dev-loop`'s own **argument / profile / constant** rule rather than replacing it.
That rule sorts values the pipeline consumes; this one sorts where a repo's facts live at all.

## Considered options

**Keep the derived rubric.** One file beats N nested `CLAUDE.md` reads at review time, and setup can
regenerate on demand. Rejected: nothing re-syncs it, the reviewer already reads every covering
`CLAUDE.md` for hard rules anyway, and the drift is invisible precisely because both copies read as
authoritative.

**A repository profile key for the stack convention.** `docs/agents/dev-loop.md` was the obvious home
for "this project records stacks with `gh-stack`". Rejected by the uninstall test: the stack exists on
GitHub whether or not the plugin does, and the binding consequence — rebase with `gh stack rebase`,
never `git rebase` plus a force-push — falls on anyone touching the branch. The pipeline never needed
the key either: `stack-link.sh` probes for the extension, and `/dev-loop` never rebases anything.

## Consequences

- `docs/agents/coding-standards.md` becomes `docs/agents/smell-overrides.md` and loses its Hard rules
  section to corollary 1. What survives is the half that exists nowhere else: which baseline smells
  this repo's own patterns legitimately trip.
- That file is no longer distilled up front. It is written from findings a human actually rejected,
  which is the only grounding a suppression has — a smell override guessed from a `CLAUDE.md` is the
  guess the setup skill already told its own drafter to cut.
- `/setup-ieuanign-skills` Part 1 becomes amend-only, and the skill gains a Part 3 that proposes the
  `.claude/rules/` set and writes what the user accepts.
- `.claude/rules/pr-separation.md` is read through **two** deferral hooks: the architect's, for
  splitting inside a lane, and Gate 1's, for layering across lanes.
- A missing `docs/agents/smell-overrides.md` is now the correct state of a repo where nothing has
  recurred yet, so every "run setup if this file is absent" prompt is wrong and is removed.
