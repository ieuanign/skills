---
"ieuanign-skills": minor
---

`/retire-adr` retires one architecture decision record: it deletes the record and refactors everything
that pointed at it, in one gated operation.

A stale record actively misleads — someone debugging reads it as normative and hunts for behaviour
that changed years ago — and deleting the file alone makes that worse, because every doc, rule,
comment and changelog entry citing it becomes a dangling reference. So retirement is a refactor. The
human names one record; the skill derives the set of forms the repo actually cites it by (filename,
stem, title, path, and the bare identifier in whatever formats appear locally), sweeps tracked files
only for every one of them, and gives each hit one disposition from a closed set of four — **rewrite**,
**delink**, **drop**, **leave**. A changelog entry defaults to **delink**: it states what was true when
it was written, so removing the pointer keeps it honest where a rewrite would falsify it.

A decision still binding the code is relocated to the code it binds — carrying the reasoning itself and
never a pointer, since a pointer is what retirement removes. The relocation is named before anything is
written and lands before the record is deleted, so no interruption leaves the reasoning nowhere.

The gate is the whole protection: the record, each relocation and a table of every reference with its
current text, disposition and replacement are rendered, and then the run stops. Nothing is written
before the answer, and declining writes nothing at all. There is no unattended mode and no "find stale
records" scan — zero references is not evidence of staleness in a repo whose comment conventions forbid
citing a record at all. The skill commits nothing and names how to review and undo what it wrote.
