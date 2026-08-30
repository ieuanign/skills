---
"ieuanign-skills": patch
---

`/dev-loop`'s spine defines `<this-skill-dir>` and `<STAGED>` among its derived facts, so an
orchestrator that no longer holds the act file still composes a correct `scriptPath`.

#279 moved the phase scripts out of the skill directory and into `<MAIN>/.scratch/dev-loop-scripts/`,
but stated that exception only inside `acts/act-1.md` and `acts/act-3.md`. The spine teaches the
opposite pattern thirteen times over — `<this-skill-dir>/<asset>` for every bundled asset — and never
defined `<this-skill-dir>` at all. An act file is read at its boundary and dropped; the spine's
Derived facts stay in context for the whole run. So an orchestrator that compacted, or re-entered at
Act 3, composed `<this-skill-dir>/phase-plan.js` and the Workflow tool rejected it. Both facts are now
Derived facts: `<this-skill-dir>` carries the exclusion that makes it **never a `scriptPath`**, and
`STAGED` sits directly under it because that exclusion is its whole reason to exist. The two act files
now say `<STAGED>` at all six staging sites; `<this-skill-dir>` stays as the `cp` source, and
`skillDir` still names the real skill directory.

`npm run check` gains an **act placeholders are defined in the spine** stage: it parses the bolded
heads of the spine's `## Derived facts` list, collects placeholder references from
`skills/dev-loop/acts/*.md`, and fails on any reference no fact covers, naming file, line, token and
remedy. It sits beside the `scriptPath is a working-tree path` stage — same failure family, a
placeholder that resolves for whoever wrote it and for nobody else.

The stage discriminates by **shape**, not by a list of known names: an all-caps token of two or more
characters, plus the literal `<this-skill-dir>`. A named exception list was rejected as a maintenance
burden that grows with every prose stand-in — `<n>`, `<slug>`, `<branch>`, `<base>`, `<wt>` — while the
two-character floor excludes the `<A>`/`<B>` labels mechanically, and a single-letter derived fact is
not plausible. The spine itself is not scanned: it is the definition source, and excluding its own
definitions would buy nothing.
