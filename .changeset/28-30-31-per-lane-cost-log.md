---
"ieuanign-skills": minor
---

`dev-loop`: a per-lane cost log, replacing the token ceiling that was dropped.

The whole point of this pipeline is that it is cheap enough to run on every issue, and until now there was no way to tell whether any given run was. A baseline existed — 63 completed supervised lanes, a median lane cost and a per-stage split — but it came from a one-off analysis script rather than from anything the pipeline does, so every change was argued against a number nobody could reproduce from a run, and a regression would have stayed invisible until someone re-ran the analysis by hand.

**Every agent both phase scripts dispatch now leads its prompt with `[dev-loop lane=<issue> stage=<stage>]`** (#28), so an agent's own transcript identifies it without anyone pattern-matching prose. The inferences it replaces read wording that exists to instruct an agent rather than to identify it, and any prompt edit silently broke them; planning had it worse still, running before a plan file exists and so carrying no plan path to infer a lane from — while being roughly three tenths of a lane's cost. The stage vocabulary is one named list per script, in the baseline's own words: plan, write, review, suite, notify. A recovery is charged to the stage that needed it, so a debugger on a red suite is suite cost. The marker is inert — nothing returns it and no parsing depends on it.

**`cost-report.mjs` reads those transcripts and prints what a lane cost and which stage spent it** (#30):

```
#28
Cost: 641K excluding cache reads (target 608K, +5%)
  write 44% · plan 29% · review 27% · suite 0.4%
```

The metric is input plus cache creation plus output, excluding cache reads — the baseline's metric, and the comparison is meaningless against any other. The split is the point rather than a garnish: a bare total says a lane was expensive, the split says which dial to turn. A lane with no records reports that it was **not measured**, never a total of zero, which would read as free. The target is a constant in the script; it prints a percentage and gates nothing.

**An unattended run leaves one log per lane under `.scratch/dev-loop-cost/<issue>.txt`** (#31), written after the last wave from every transcript directory the run captured — the host is the only part of the pipeline holding a shell, a workflow script having no filesystem access. One file per lane so a parallel batch does not interleave; that directory is already gitignored, so nothing accumulates in version control. Written for **every** lane, whatever its ending, because improvement data collected only on the clean path hides exactly the lanes worth looking at. Nothing goes to the issue thread or the PR body, a supervised run writes none, and a failure to produce a log changes no lane's ending and no run's conclusion.

**Nothing halts on tokens, and `contracts.md` now says so as a standing rule.** The ceiling this replaces could not work: the runner's budget total is unset unless a human typed a budget directive, so it silently never fired under exactly the unattended run it was meant to guard; its spend figure is turn-wide and shared across the host and every lane, while the measured baseline is per-lane; and it counts output tokens, which is not the baseline's metric. It was also unnecessary — a lane is already bounded in agent invocations from five directions, and the most expensive lane in the measured set was not stuck but thirteen commits of genuine work against a median of three. A token ceiling would not have caught a runaway; it would have refused a big issue.
