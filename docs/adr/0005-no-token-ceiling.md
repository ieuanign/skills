# 0005 — Token spend is reported, never enforced

**Status**: accepted, and implemented — there is no ceiling anywhere in `/dev-loop`, and this record
exists so that one is not added back.

A per-lane token ceiling was specified once, as the safety stop an unattended run seemed to need:
nobody is watching, so something should be able to say *stop*. It was dropped before it shipped. Both
halves of that decision are worth recording, because the first half reads as an implementation
problem somebody might later solve, and the second half is the one that actually settles it.

## Decision

**No lane halts, warns, or changes its behaviour because of what it costs.** There is no token
ceiling, no per-lane budget and no cost-triggered ending anywhere in the pipeline, and no argument,
profile key or ending unlocks one.

What exists instead is **reporting**: a per-lane cost log the host writes at the end of an unattended
run, which reads, prints, and touches nothing. Nothing in the pipeline's behaviour turns on it.

## Why the ceiling could not work

Four reasons, each fatal on its own, all of them about the only spend figure a workflow script can
actually read:

1. **It silently never fires under the run it was meant to guard.** The runner's budget total is
   unset unless a human typed a budget directive. An unattended run is precisely the one nobody typed
   anything for — so the guard would be absent exactly where it was needed. That is the worst failure
   mode a safety stop can have: not firing wrongly, but appearing to exist and never firing at all.
2. **The figure is turn-wide and shared.** It counts the host and every lane together, where the
   measured baseline is per-lane. With parallel lanes there is nothing to attribute, and one shared
   ceiling would halt every lane in the batch at once — including the three that were nowhere near it.
3. **It counts output tokens**, which is not the metric the baseline was measured on. A ceiling
   compared against a different metric from the one that set its number is a number with no meaning.
4. **The obvious repair is unavailable from where the enforcement would live.** Reading the per-agent
   transcripts the way the baseline analysis did needs filesystem access, and a workflow script has
   none.

## Why it was unnecessary — the load-bearing half

Reason 1 alone would justify building it better. This is the half that says not to build it at all.

**A lane is already bounded in agent invocations from five independent directions:**

| Bound | What it stops |
|---|---|
| the per-commit debug-and-fix bound | a commit that will not go green |
| the review loop's fix-cycle ceiling | a review loop that will not converge |
| the suite gate's round ceiling | a suite that will not go green |
| the plan's own commit count | the amount of work a lane was ever asked to do |
| the workflow runner's agent backstop | everything, as a last resort |

Nothing in the pipeline can loop forever. Each loop's progress-sensitive threshold sits *inside* its
ceiling and can only stop it sooner, so adding one does not change the count of directions.

And the shape of the expensive case is wrong for a ceiling. **The most expensive lane in the measured
set was not stuck** — it was thirteen commits of genuine work against a median of three. A ceiling
would not have caught a runaway, because there was no runaway to catch. It would have refused a big
issue.

## Considered options

**A per-lane ceiling read from the runner's budget.** The specified design. Rejected on all four
counts above; reason 1 is sufficient alone.

**A ceiling measured from the transcripts, enforced by the host between layers.** Fixes reasons 2–4:
the host has a shell, the transcripts are per-agent, and the metric matches the baseline. Rejected
because the host's first control point is the phase call returning, by which time the layer's spend
has already happened — so it could report a lane that overran and could not stop one. That is the
cost log, which is what was built.

**A warning rather than a halt.** Rejected as strictly worse than the log: it puts a cost number in
front of a human mid-run, where the only action available is to stop a lane that a bound will stop
anyway, and it trains a reader to ignore it.

## Consequences

- The cost log is **best-effort, and last for that reason**. A failure there is reported and dropped:
  it never changes a lane's ending, never blocks the run's conclusion, and never makes a batch report
  failure. Nothing downstream reads the files.
- Improvement data is collected on **every** lane, whatever its ending, including a lane whose plan
  never came back `READY` and a lane dropped at intake before any agent ran. Data collected only on
  the clean path hides exactly the lanes worth looking at.
- The five bounds above are now load-bearing for this decision. Raising one is not free: the review
  loop's ceiling was deliberately set at 5 rather than the suite gate's 8 partly because tripling it
  would have weakened the argument on this page. [ADR-0002](./0002-review-loop-progress-sensitive-bound.md)
  records that trade in its own terms.
- The right lever for cost is the **effort tier per stage**, which changes what a lane spends without
  changing what it is allowed to finish. That is a separate axis and a separate decision.
