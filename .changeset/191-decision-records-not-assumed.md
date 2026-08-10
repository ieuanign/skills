---
"ieuanign-skills": minor
---

The architecture engineer reads decision records where the repo says it keeps them, instead of
listing `docs/adr/` on every run.

A decision-record directory is not a fixture of every repository. Baking one path in means the
orienting step points at nothing in a repo that keeps no records, and at the wrong place in a repo
that keeps them somewhere else — while the repo's own `docs/agents/` layer already states the answer,
exactly as it does for the reviewer's smell overrides and the notifier's label vocabulary. So the
sweep is now a read of that configuration rather than a directory listing: where it names locations,
the same limiter applies and only the records governing the area are opened; where it names none, or
is itself absent, that is the ordinary state — proceed silently, never report it missing, never ask,
and never guess at a directory to make up for it. A repo that keeps no records gets none planned into
a plan's touchpoints.

The respect clause generalises with it: the decisions a repo records bind the plan wherever it keeps
them, including the ones written inline at the code they bind, which is the shape a repo with no
directory uses. And because the architect now sweeps agent configuration too, the Hard-constraints
section's "only channel" sentence widens to cover it — the Code Writer does not open that file either,
so a rule living there still reaches the writer only by being stated outright.
