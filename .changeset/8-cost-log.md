---
"ieuanign-skills": minor
---

`dev-loop`: a per-lane cost log, replacing the token ceiling that was specified and never worked.

The pipeline's whole claim is that it is cheap enough to run on every issue, and there was no way to tell whether any given run was. A baseline existed — 63 completed supervised lanes, a median lane cost, a per-stage split — but it came from a one-off analysis script rather than from anything the pipeline does, so every later change was argued against a number nobody could reproduce from a run, and a regression would have stayed invisible until somebody re-ran the analysis by hand.

**Nothing halts on tokens.** The per-lane ceiling that was supposed to solve this is dropped rather than repaired, and three independently fatal reasons are recorded in `contracts.md` so it is not re-proposed. The budget total is unset unless a human explicitly typed a budget directive, so with nobody there to type one the guard silently never fires — the worst failure mode a safety stop can have, in the one mode it existed for. The spend figure is turn-wide and shared across the host and every lane, while the measured figure is per-lane: with lanes in parallel there is nothing to attribute, and one shared ceiling would stop every lane together. And it counts output tokens against a baseline that deliberately counts something else. The obvious repair — have the phase script read the per-agent transcripts the way the analysis did — is not available either: a workflow script has no filesystem access, so the instrument that produced the figure is unreachable from the thing meant to enforce it.

**It was also unnecessary.** A lane is already bounded in agent invocations from five directions — the per-commit debug-and-fix bound, the fix-cycle bound, the suite gate's two round bounds, a commit count fixed by the plan, and the workflow runner's own backstop on total agents. Nothing can loop forever. And the most expensive lane in the measured set was not stuck: it was thirteen commits of genuine work against a median of three. A ceiling would not have caught a runaway; it would have refused a big issue.

**Reporting replaces it**, and it belongs to the host, which has a shell. `cost-log.mjs` ships with the skill, reads its request on standard input like `notify.sh` does, and after the phase scripts return writes `.scratch/<project>/cost/<issue>.md` — one file per lane, beside that lane's own plan, in a directory already gitignored in every repository this runs against. Deliberately not the issue: the per-lane comment is specified as an extremely concise summary plus open questions, and a cost table would bury it.

Each log carries the total on the baseline's own metric — **input plus cache creation plus output, excluding cache reads** — a signed percentage against the measured median, and the **per-stage split**, which is the entire value the baseline produced: a bare total says a lane was expensive, and the split says which dial to turn.

```
Cost: 641K excluding cache reads (target 608K, +5%)
  write 44% · plan 28% · review 28% · suite 0.5%
```

**Every lane gets one**, including one that halted, one that failed and one that threw — improvement data collected only from the lanes that went well hides exactly the lanes worth reading. Attribution matches each agent's prompt against literals the host already holds, strongest first: the plan path, then the worktrees, then the branches, then the issue number, each boundary-guarded so `feat/8` never swallows `feat/80`, and two lanes matching at the same strength report as unattributed rather than being guessed onto one. Stages come from each transcript's sibling meta file; the suite gate, which `contracts.md` dispatches with deliberately no agent type, is named from its prompt's opening sentence instead.

Unattended runs only — a supervised run has a human with their own terminal, and is untouched. `npm run check` now also parses the skill's bundled ES modules, which the phase-script step could not see.
