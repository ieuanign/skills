---
"ieuanign-skills": patch
---

`npm run check` gains a **per-layer read budget** stage: the act files `skills/dev-loop/SKILL.md`
lists under **Then per LAYER** are summed and fail the check over **9,000 bytes**.

`/dev-loop`'s orchestrator re-reads that set at every layer of every stacked run, and nothing held its
size. It was 21,953 bytes on `main`; #268, #269 and #270 cut it to 8,412 by moving read-once material
out, and the next paragraph appended to one of the three would have put the cost straight back —
showing up only as a slightly larger context on a run nobody measures. The budget is not the achieved
figure: #269 caps `acts/gate-2.md` at 6,000 and #270 caps `acts/act-2.md` and `acts/act-3.md` at 2,500
between them, so 9,000 clears the worst base those tickets permit with headroom. A clarifying clause
passes; a new paragraph does not.

**The set is derived, never listed.** No act filename appears in the stage. It reads the spine's own
lead-ins — the numbered items between `Then per LAYER` and `Last, once per run:` — and takes the
`acts/…` path from each item's **title parenthetical only**. That is what excludes the read-once
siblings named mid-prose inside the same items, `acts/gate-2-linking.md`, `acts/gate-2-reference.md`
and `acts/act-3-contract.md`: measuring one of them would put once-per-run bytes into a per-layer
budget and make the number meaningless. An act file that later becomes per-layer is covered the moment
it moves into that block, with no edit to the stage. Bytes, not tokens — a tokenizer is a heavier
dependency than the `shellcheck` this script has already refused, and bytes track the guarded thing
closely enough to catch a regression.

**Half a parse is a FAIL, never a skip and never a pass**, in the shape #257's stage already has:
missing lead-ins fail naming which anchor was found, a numbered item whose title parenthetical yields
no path fails naming that line and the shape that was expected, an extracted path absent from
`skills/dev-loop/` fails naming it, and zero files or zero bytes fails on its own — a stage that passed
on nothing measured is indistinguishable from the protection existing. Every `grep` feeding one of
those guards ends `|| true`, because under `pipefail` a no-match would end the run before the guard
could name anything.

`CLAUDE.md` states the rule where an act file gets edited, under § Adding or changing a skill: prose
added to a per-layer act file is paid at every layer, the same prose in a read-once one is paid once,
and the stage is what says the current total and the budget. It holds no second copy of the number, so
there is nothing to drift. Nothing under `skills/` changes and no existing stage was touched.
