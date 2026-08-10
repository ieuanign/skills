Skeleton for `.claude/rules/code-review.md`. No substitutions — it names one path, and that path is
the same in every repository. No `paths` frontmatter: it has to arrive at launch, before a review
knows which files it is looking at. Everything below the line goes in the file.

---

# Code review

**A near-empty root `CLAUDE.md` is not a repository without conventions** — these rule files are
conventions too, so read them before concluding it documents nothing, and read
`docs/agents/smell-overrides.md` with them: it is a standards source that only ever *subtracts*,
recording the patterns this repository uses deliberately that a code-smell baseline would otherwise
flag. Both travel to whatever reviews on your behalf.

**An absent overrides file is the ordinary state.** An entry is written only from a finding a human
actually rejected, so never ask for the file and never report it missing.
