---
"ieuanign-skills": minor
---

`dev-loop`: a **notifier** joins the roster, writing a lane's ending from inside the running phase script.

The host is blind while a phase script runs — a workflow script has no shell — so a lane that ended mid-script had no writer able to tell anyone. A run of several lanes can have one end at minute three while the rest run for another forty, and the developer should learn about it at minute three rather than when the wave returns.

The notifier is the fifth roster agent, at the cheapest model and the lowest effort: it exists to run two or three commands in a context the host cannot reach, not to reason. Per ending it swaps the issue's label, comments the ending with its stack trace where one exists, and sends the one-line message. Its definition points at `notifications.md` for every rule it implements and restates none of them; what it adds is *how* to execute safely — free text goes in on standard input (`--body-file -`, a quoted heredoc, `printf | notify.sh`) and never into a composed shell string.

It is dispatched **once per lane at the crash wrapper**, not once per ending site: the label is per issue, so a lane with two ended sub-lanes still writes once, and the dispatch fires as that lane returns rather than when the wave does. The role is chosen by the script rather than the agent — `notifications.md` states the question that selects a role and `contracts.md` records that its two ending labels answer that same question, so **HALT** maps to awaiting-human and **FAILED** to failed. That keeps the mapping mechanical instead of a judgement made at the cheapest tier.

**Neither write can change what the lane returned.** A notifier that dies, throws, or finds no label string for its role leaves the ending, the sub-results and the terminal state exactly as they were, and a dispatch that failed does not claim the label was written — the host relabels that lane instead. A lane that *threw* is the host's too: a throw unwinds past the dispatch point, which is the latency the specification already accepts.

Nothing fires under `gated`, where both gates already put every one of these outcomes in front of a human.
