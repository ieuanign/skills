---
"ieuanign-skills": patch
---

`/dev-loop`'s unattended messages now have a stated format.

The specification stated a content requirement — an ending says why in one line, so it can be triaged from a phone — and the skill stated the mechanism. Nothing stated the **shape**, so every message was composed freshly and drifted between runs.

**Five state tokens partition across the three message events** already in the event table, so no message carries two axes at once. That partition is load-bearing rather than tidy: an ended sub-lane opens a *draft* pull request, so a single enum spanning endings and pull-request states would force one token to say both.

| Message | Writer | Tokens |
|---|---|---|
| started | host, at intake | `start` |
| ending | notifier, mid-lane | `halt`, `failed` |
| completion | host, after the phase script | `draft`, `ready` |

The shape is the issue number, the state token, the reason where one exists, then the link — the pull request link where a pull request exists, the issue link otherwise:

```
#105 start: <issue link>
#105 halt: still CHANGES_REQUESTED after 2 fix cycles — 3 findings open
<issue link>
#105 draft: 2 findings open, suite green
<pr link>
#105 ready:
<pr link>
```

The reason is retained because triage from a phone is that line's whole purpose. A lane with one sub-lane — the common case — emits the single-line shape exactly; a lane with several emits one line per sub-lane under a shared header. No message carries the run handle, and the two ending tokens are the ending labels in lower case, so there is no second vocabulary to keep in step with `contracts.md`.

The format is stated in `notifications.md` and nowhere else — the skill's mechanism section still states only the command for each event. The four closing tokens being exhaustive is what makes the existing one-closing-message-per-lane property readable by inspection: a `start` with none of them after it is a run that died.
