---
"ieuanign-skills": patch
---

`/dev-loop` now actually asks for the two repository-profile keys Phase B needs.

**Full-suite command** and **Fix cycles** were both documented as asked before a repository's first execution phase, and no step performed either ask. The obligation was asserted in passive voice in two places and implemented by none, so every repository has silently run on the defaults since the keys were introduced — including this one, whose profile carried one of the two only because somebody typed it by hand. That is why the bound which ended the motivating lane was never a number anyone chose.

**Act 0 gains step 9, and it is the only place either is asked.** It skips entirely unless the run will reach Phase B, and skips any key the profile already carries — a persisted value is an answer, and `none` and `0` are answers like any other, so the ordinary run asks nothing and a repository is asked at most once ever. It is not a gate: it raises no question about the batch's work, so gate suppression does not touch it, and it sits at intake because that is the last point at which a human who typed `auto` is reliably still watching.

The **Fix cycles** prompt describes the no-progress threshold it now is, not the flat cap it was — a higher answer buys tolerance for a repository whose reviews repeat themselves, not more cycles for one that is converging. Both prompts state the default that applies if declined, so a repository can decline and still run.

The passive assertions that a value was "ask-then-persisted before this first runs" are replaced by references to the step that now does it, and the hard rule about one-time preconditions gains the general form: **every one of them belongs to a named step that performs it**, because an obligation carried only by a key's own description is one nothing does.

This repository's own profile gains its **Fix cycles** answer.
