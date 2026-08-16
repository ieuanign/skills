# Act 1 — Phase A: plans

Run the Workflow tool with `scriptPath: <this-skill-dir>/phase-plan.js` and `args: { issues: [{number, title, project, answers?}], agentNamespace }` — `agentNamespace` is the value Act 0 read off your roster, passed verbatim (the empty string when the roster lists the roles bare). One architect per issue, parallel. Each returns `{status, planPath, summary, openQuestions}`. A lane returning `status: DIED` means its architect came back with nothing usable — report it at Gate 1 and offer a re-run. Every such report says the stage **returned nothing — it was skipped, or it died after the runner's retries**, and never picks one.

**KEEP the transcript directory this invocation reports**, alongside every later one, **including any re-run**: Act 4 feeds them all to the cost report.

KEEP each lane's `summary` bullets for the rest of the run. Gate 2 puts them in the PR body's Context section — so they must survive whether or not Gate 1 fires, and are not consumed by presenting them there.

**⟨notify⟩ Plan comment.** Per lane, comment the plan's summary bullets and the architect's open questions on the issue. **Never the plan file** — pass `planPath` instead. On the clean path this is the lane's one comment; a lane that ends later gets one more, the notifier's, and no others.
