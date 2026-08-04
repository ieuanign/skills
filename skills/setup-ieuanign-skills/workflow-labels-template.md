Skeleton for the **Workflow roles** section of `docs/agents/triage-labels.md`. Append it as its own
section; substitute the agreed strings into the middle column and leave a role's cell empty if the
user wants no label for it. Everything below the line goes in the file.

---

## Workflow roles — an unattended `/dev-loop` run reporting on itself

Where a **run** got to. Written and removed by the pipeline, never by hand, and specified in
`/dev-loop`'s `notifications.md` — which is the source for when each is applied and why, and is
not restated here.

**These fire under `/dev-loop auto` only.** A gated run's human touchpoints are its two gates, so
it writes no label at all; seeing one of these on an issue means an unattended run put it there.

| Role             | Label in our tracker | Meaning                                                          |
| ---------------- | -------------------- | ---------------------------------------------------------------- |
| `in-progress`    | `in-progress`        | An unattended run is working this issue right now                |
| `awaiting-human` | `awaiting-human`     | The run reached a conclusion someone must act on                 |
| `failed`         | `failed`             | A stage broke — a crash, not a verdict, so a retry may well work  |

The roles are fixed — the pipeline names them. The strings are yours: rename them freely, and a role
left with no string is skipped silently rather than erroring, which is a supported way to opt out of
one. Labels must exist in the tracker to be applied.

**Before hand-applying or hand-removing one, read `notifications.md`.** These are pipeline state, and
each of the three carries a consequence for touching it by hand — what one means, what reads it, and
what a run does next. That is specified there and deliberately not copied here: a copy in this file
would be frozen at the version of the pipeline that wrote it and would never re-sync.
