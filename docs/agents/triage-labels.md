# Triage Labels

The skills speak in terms of label **roles**; this file maps each role to the actual label string
used in this repo's issue tracker. Two families, applied by different people for different reasons.

## Triage roles — a human classifying an issue

Where an issue sits before anyone works it. From `mattpocock/skills`.

| Role              | Label in our tracker | Meaning                                  |
| ----------------- | -------------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`      | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human` | `ready-for-human`    | Requires human implementation            |
| `wontfix`         | `wontfix`            | Will not be actioned                     |

## Workflow roles — an unattended `/dev-loop` run reporting on itself

Where a **run** got to. Written and removed by the pipeline, never by hand, and specified in
`skills/dev-loop/notifications.md` — which is the source for when each is applied and why, and is
not restated here.

**These fire under `/dev-loop auto` only.** A gated run's human touchpoints are its two gates, so
it writes no label at all; seeing one of these on an issue means an unattended run put it there.

| Role             | Label in our tracker | Meaning                                                          |
| ---------------- | -------------------- | ---------------------------------------------------------------- |
| `in-progress`    | `in-progress`        | An unattended run is working this issue right now                |
| `awaiting-human` | `awaiting-human`     | The run reached a conclusion someone must act on                 |
| `failed`         | `failed`             | A stage broke — a crash, not a verdict, so a retry may well work  |

Three properties worth knowing before you hand-apply or hand-remove one:

- **`in-progress` is a claim marker.** Another orchestration system refuses any issue wearing one,
  so the two get mutual exclusion for free. Removing it by hand mid-run un-claims a live lane.
- **`failed` is never a judgement about the code.** It means a stage broke, so it answers exactly
  one question: is this worth retrying? `awaiting-human` is the one that means "read this".
- **A lane that started and never cleared `in-progress`** — with no closing message — is a run
  whose session died. That pattern is the intended signal, not a bug to tidy away.

## Notes

When a skill names a role, use the corresponding label string from the table above. Edit the
right-hand columns to match whatever vocabulary you actually use — the skills hardcode no label
string, and a role this file gives no string for is skipped silently rather than erroring.

Labels must exist in the tracker to be applied. All three workflow labels exist. `needs-triage`,
`needs-info` and `ready-for-human` are documented above but have never been created here, so
nothing can apply them today — create them with `gh label create <name>` if you start using them.
