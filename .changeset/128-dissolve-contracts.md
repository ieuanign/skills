---
"ieuanign-skills": minor
---

`contracts.md` is deleted, and the half the orchestrator actually evaluates now lives in `SKILL.md`.

With one implementation left, the phase script **is** the specification. Roughly half of `contracts.md`
documented what `phase-execute.js` already enforces mechanically and the orchestrator never branched
on any of it; that half is in `docs/dev-loop-internals.md` for a human, and the rules the script
enforces now carry their own reasoning as comments at the sites that enforce them.

What the orchestrator does evaluate became four tables in `SKILL.md`:

- **touchpoint overlap → layer assignment** — the three outcomes, plus the repository's
  `Overlapping changes` declaration and where each value puts the line;
- **the worktree invariant** — the five sub-lane states, plus push-succeeds-first and
  dirty-keeps-itself;
- **the findings ledger** — the eight categories a conclusion and a pull request body surface;
- **stack linking** — when it fires, how chains are derived, and what a gap in a chain means.

The terminal-state table deliberately did **not** move: the phase script returns each sub-lane's
`terminal` pre-applied, so the orchestrator obeys a value rather than re-deriving a table.

The roster agents already carried their own return contracts, so nothing under `agents/` needed to
change. `docs/adr/0008-append-only-invariant.md` records why the label clause sits inside the
append-only invariant and why a per-criterion verdict never reaches the issue's checklist.

`scripts/check.sh` had a hard dependency on `contracts.md` — it greps the review-loop ceiling out of
its prose to compare against `REVIEW_CEILING`. That check now reads `docs/dev-loop-internals.md`, and
still passes.
