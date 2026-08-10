---
name: retire-adr
description: Retires one architecture decision record a human names — sweeps every reference to it, relocates any reasoning still binding the code, then rewrites the references and deletes the record. Use for /retire-adr, or when asked to retire or remove a stale decision record.
---

# /retire-adr — delete a record and every pointer to it

Retirement is a **refactor**, not a delete: a record removed on its own turns every doc, rule, comment and changelog entry that pointed at it into a dangling reference. The human names one record; you derive how this repo cites it, show what goes and what changes, gate, and only then write. Dispatch no agent — this is your own plain Bash and file edits from start to finish.

## Derived facts (compute once — never hardcode)

- **RECORD** — the record's path, resolved in step 1 from what the human named. Nothing about where records live is known before that.
- **DIR** — `dirname RECORD`. Its index and its sibling records live here.
- **CITES** — every string this repo refers to RECORD by. Build the candidates from RECORD itself: the filename, the stem, the path with and without extension, the title, and the bare identifier in each form that appears locally (`0003`, `ADR-3`, `ADR 0003`, `adr/0003`). **Deriving this set is the load-bearing part of the skill** — one grep on the filename misses most citations, and a missed citation is the exact dangling reference this exists to prevent.

## Steps

1. **Resolve the record.** The human names it: a path, or an identifier you resolve by reading what is in DIR. **Nothing matched, or more than one matched, is a question or a refusal — never a guess.** Never propose a record and never scan for stale ones: zero references is not evidence of staleness, because a repo whose comment conventions forbid citing a record makes every record unreferenced by construction.

2. **Sweep, over tracked files only** — `git grep -n` and `git ls-files`, for every form in CITES. Cover DIR itself (its index, and siblings citing this one as superseding or superseded), documentation, agent and rule files, code comments and strings, and the changelog or release notes. Tracked-only excludes dependencies, build output and vendored trees by construction, and leaves every path you touch one git can restore.

3. **Decide, and it is two different questions.**

   **Per record — is any of this decision still binding the code?** Where it is, its reasoning gets a destination named now, before anything is written: the site in the code it constrains, or a test asserting the invariant. It travels as the reasoning itself and **never as a pointer** to the record, an issue or a plan — a pointer is precisely what retirement removes, and a new one dangles the moment anything moves. Where it will not fit as a short comment (two lines, saying *why* rather than *what*), prefer the test, or the document nearest the code. The repo's own comment conventions decide this where it has them — its `CLAUDE.md` and `.claude/rules/` are already in your context — and the two-line shape is only the fallback where it has none.

   **Per reference — one disposition from four.** **rewrite** (the sentence keeps its point and states the reason instead of pointing at the record), **delink** (the words stand, the link or path goes), **drop** (the reference *is* the sentence or list item, so it goes with it — an index row is the common case), **leave** (reported, untouched). **A changelog or release-note entry defaults to delink**: it states what was true when it was written, so removing the pointer keeps it honest where a rewrite would falsify it. All four are defaults, shown at the gate and overridable there.

4. **Gate.** Render the record to be deleted, each relocation with the sentence going to it and where it lands, and a table of every reference — file:line, its current text, its disposition, its replacement. Then **stop and ask**. Nothing has been written when this prints, and declining writes nothing at all.

5. **Write, in this fixed order**: relocations, then reference dispositions, then RECORD's deletion last — plain `rm`, never `git rm`: staging the deletion hides it from step 6's `git diff` and puts the path beyond `git restore`. Interrupted anywhere, the reasoning still exists somewhere.

6. **Report** what changed, what was left, and the commands to review and undo it (`git status`, `git diff`, `git restore`). Re-run step 2's sweep first: what it returns now should be exactly the references deliberately left.

## Hard rules

- **Nothing is written before the human's answer.** Every read is free, the first write follows the gate, and a declined gate leaves the tree byte-identical.
- **Deletion is scoped to the one record named.** No directory removal, no `rm -rf`, no second record inferred as also-stale, and no file touched that the approved table does not name.
- **Relocations land before the deletion, never after.** Step 5's order is the whole protection against an interruption leaving the reasoning nowhere.
- **Commit nothing, push nothing, create no branch.** Leave reviewable working-tree changes and name how to review and undo them — commit conventions vary per repo, and a multi-file destructive edit is the human's to commit.
