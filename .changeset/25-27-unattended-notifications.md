---
"ieuanign-skills": minor
---

`dev-loop`: an unattended run now says what it is doing, at its start and at its end.

`/dev-loop auto`'s human touchpoints were its two gates, and unattended mode removes both by definition without putting anything in their place. A developer who started a batch and walked away learned that a lane halted only by opening GitHub, and a batch could finish partly halted and partly shipped at a time they did not choose. Both host boundaries are now written up.

**Lane start.** Act 0's final step adds the in-progress label and sends a started message, per lane. Its position *is* the guarantee rather than a comment about one — Act 1 is the first agent dispatch, so both writes land before a single token is spent and a session that dies during planning still leaves the marker on the issue. It fires only for lanes that survived intake, so an issue this run dropped or refused is never marked as being worked on. After planning, the architect's summary bullets and open questions are commented on the issue — never the plan file, which survives on disk at tens of kilobytes and which no agent ever reads the comment version of.

**Lane conclusion.** Gate 2 gains a fourth step, per lane and at the lane's last wave. Every lane loses its in-progress label without exception; then one rule decides what replaces it, from flags the phase-script result already carries. A lane whose closure **threw** takes the failed role — the case that previously left no trace at all. A lane the **notifier already labelled** is left standing, because a second verdict over the first is how two writers come to disagree in public. A **draft** with neither takes awaiting-human. A **ready** pull request takes nothing.

**Exactly one closing message per lane**, unconditional, carrying each pull request's link and its ready-or-draft state. Unconditional is the point: paired with the started message it is the run's dead-session signal, so a start with no close plus a stale in-progress label reads as a dead run by inspection.

The mode guard is **one line**, next to gate suppression. Each boundary is marked `⟨notify⟩` and states only *what* to run, never *whether* — three sites each testing the mode is three places for the guard to drift. A shared mechanism section says how a host write is made and nothing about what it says: free text goes in on standard input at every boundary, and label **roles** resolve to strings through the consuming repository's own triage-label documentation, resolved once at Act 0. No label string appears anywhere in the skill, and a role that repository has no string for is skipped silently — seeding labels is its setup work.

This also closes a gap in the specification. It assumed every draft came from an ending, but a clean sub-lane drafts on an unmet acceptance criterion **alone**, and no notifier ever runs for that one — so without the amendment that draft would reach a human wearing no label at all. `notifications.md` now names the two drafts with no ending behind them and gives both to the host.

The session-stopped class — a rate limit, a closed terminal, a sleeping machine — is named as uncoverable rather than quietly ignored: no code runs, so only what already reached GitHub survives. A watchdog stays out of scope; the human typed the command and can see their own terminal.

Nothing here fires under `gated`, whose human touchpoints are its two gates.
