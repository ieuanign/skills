---
"ieuanign-skills": patch
---

Three rules weakened by #130's compression are restored, and two long-standing defects in `SKILL.md`
are fixed.

Every one of the 389 entries in the rule inventory is now ticked. The 223 destined for `SKILL.md` were
checked against the pre-rewrite blob rather than against the inventory's own summary of it: 220 were
present as written, and three had lost a clause with independent scope while the rule around it
survived.

- **`S-236`** — "work one Bash command does is yours" had become a two-item enumeration. ADR-0007
  cites the general form by name as the reason per-commit push may not spend an agent on `git push`,
  so the enumeration left the next unlisted cheap task unbound.
- **`C-137`** — "and no profile key mirrors it" had gone from the overlap declaration, while the
  config-home rule still points a future implementer at the profile for exactly that per-repository
  value. Nothing forbade the derived copy ADR-0001 exists to prevent.
- **`C-128`** — the layer-is-horizontal / stack-is-vertical distinction survived only in `CONTEXT.md`,
  which does not ship in the plugin, so a consumer lost it entirely.

Two defects that predate this effort, found while verifying:

- `SKILL.md` contradicted itself on the shape of `terminal`, describing it once as `{pr, push, reasons}`
  and once as `{pr, reasons}` with "It carries no push column". `terminalState()` returns no `push`
  key, so the first was wrong and is corrected.
- The discovered-blocker comment was specified with `--body "<text>"`, which the same file's comment
  mechanism forbids in terms — agent-generated free text composed into a shell string. It now uses
  `--body-file -` like every other comment the pipeline writes.
