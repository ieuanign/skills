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

Three properties worth knowing before you hand-apply or hand-remove one:

- **`in-progress` is a claim marker.** Another orchestration system refuses any issue wearing one,
  so the two get mutual exclusion for free. Removing it by hand mid-run un-claims a live lane.
- **`failed` is never a judgement about the code.** It means a stage broke, so it answers exactly
  one question: is this worth retrying? `awaiting-human` is the one that means "read this".
- **A lane that started and never cleared `in-progress`** — with no closing message — is a run
  whose session died. That pattern is the intended signal, not a bug to tidy away.
