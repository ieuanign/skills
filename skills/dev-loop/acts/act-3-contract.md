# Act 3 — contract (read ONCE, at the run's FIRST Act 3)

Act 3's invariant material — the argument contract, the lane shape and the result shapes, none of which varies between layers. Read at the run's FIRST Act 3 and not re-read; `acts/act-3.md` holds what each layer performs, is read afresh at every layer, and points here.

## The arguments

`skillDir` is `<this-skill-dir>` as an ABSOLUTE path: the notifier it dispatches needs `notify.sh`, the send mechanism, and its own specification `notifications.md` by path; omit it and no notifier is dispatched. `agentNamespace` is the value Act 0 read off your roster, passed verbatim (the empty string when the roster lists the roles bare) — omit it where the roster IS namespaced and every dispatch in the phase fails. `mode` is the run mode Act 0 parsed — literally `gated` or `unattended`, never the `auto` token the developer typed; `fixCycleThreshold` is the profile's **Fix cycles** key — the review loop's **no-progress threshold**, not a flat cap; the loop's hard ceiling is a phase-script constant and is not passed — and `suiteCommand` is its **Full-suite command**, both answered at Act 0's step 9 and passed verbatim — never a literal here, and a `none` or omitted `suiteCommand` makes every sub-lane's suite **not run**. `runHandle` is the **RUN HANDLE** derived fact, passed verbatim; the notifier writes it on the ending comment, and an empty or omitted one is a missing line and never an error.

Each lane in `lanes` is `{ issue, issueBody (the body Act 0 fetched, verbatim and whole), planPath (ABSOLUTE — .scratch exists only in the main tree), subLanes: [{ branch, worktree (absolute), base, area, commits: [{ordinal, message}], ownedCriteria: [{ordinal, criterion}] }] }`.

Build each sub-lane's `commits` from the plan's `## Commit / PR breakdown`: the entries belonging to that sub-lane's PR, in plan order; `ordinal` = 1-based position within the whole breakdown; `message` verbatim from the plan. Omit commits Act 0 already found in the branch's git log (resume).

Build each sub-lane's `ownedCriteria` from that SAME section, which you are already parsing: the acceptance criteria that sub-lane's PR entry names, as `{ordinal, criterion}` — the ordinal into the issue's `- [ ]` checklist and the criterion's text from the issue body Act 0 fetched. A plan holding two or more PRs states them per PR; a single-PR plan states nothing. **Anything the plan left unlisted falls to the LAST sub-lane in plan order** — last in the PLAN, never the top of the chain and never the last of a layer.

**This is yours, and it is decided ONCE per run, where lanes are built.** Pass the list on every sub-lane, including the single-sub-lane case; the phase script treats an absent key as the whole checklist, which is a fallback and not a second way to say it.

## The results

Per lane, `phase-execute.js` drives the whole pipeline — writer per commit, debugger on failure, review loop, suite gate — and holds every bound, route and ending: you enforce none of them. Each sub-lane finishes clean or ends carrying one of two labels: **HALT** (something deliberately stopped) or **FAILED** (something broke). Report an ending in those words, with its stage and its attempt log; the label explains and **decides nothing** — Gate 2 disposes of an ended sub-lane the same way whichever label it carries, and an ending ends its own sub-lane, never the batch.

The per-LANE result carries two flags Gate 2's step 4 reads and nothing else does: `crashed`, true when that lane's closure threw, and `notified`, true when the notifier **applied** that lane's label at its ending — never merely attempted it. Under `gated` both are always false, nothing writing a label there. Each lane's arg accepts `notified` back, so a lane whose sub-lanes span layers is not notified twice; carry it from the previous layer's result.

The per-sub-lane result carries a `terminal` of `{pr: 'ready'|'draft'|'none', reasons}` — the phase script's terminal-state table, already applied to that sub-lane's own inputs. **Obey it; never re-derive it.** Carry it to Gate 2 unchanged: under `unattended` it is what that gate's step 2 opens, and `reasons` is what a draft PR body explains itself with.

The commit-breakdown check is YOUR work, not an agent's: at the end of each sub-lane compare the plan's commit ordinals you passed in against the commits the writers reported making, and carry the result as `<n> planned, <m> made`. You get it back on each sub-lane result. A mismatch never halts the lane and never triggers a fix cycle.
