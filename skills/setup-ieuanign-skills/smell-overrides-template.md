Skeleton for `docs/agents/smell-overrides.md`. Create the file with the preamble on first append;
after that only ever add bullets under the right area. Everything below the line goes in the file.

---

# Smell overrides

Exceptions to the code-smell baseline the `reviewer` agent and `/mattpocock-skills:code-review`'s
Standards axis carry: patterns this repository uses deliberately that would otherwise be reported as
smells.

**Every entry here was earned.** Each records a finding a human actually rejected, twice — once is a
one-off, not a pattern. Nothing in this file was distilled from `CLAUDE.md` or guessed in advance, and
an empty or absent file is the correct state of a repository where nothing has yet recurred.

**This file only subtracts.** The standards this repository positively states live in `CLAUDE.md` and
`.claude/rules/`, which bind whether or not these skills are installed. Nothing here restates one.

## <Area — "General", or the context name in a multi-context repo>

- **<Smell name>** — <the pattern that trips it, with a `file:line` where one exists> — <why it is
  deliberate here, in one sentence>

<!-- One "##" section per area, mirroring however the repo splits its CLAUDE.md files. A
     single-context repo has one "## General" and nothing else. Add areas only as entries need
     them; an area with no overrides has no heading. -->
