---
"ieuanign-skills": minor
---

`/setup-ieuanign-skills` Part 3 offers a sixth `.claude/rules/` convention: where a review finds the
repository's standards.

Two facts a review depends on were stated only inside a review skill — that
`docs/agents/smell-overrides.md` is a standards source which only ever *subtracts* from the code-smell
baseline, and that a near-empty root `CLAUDE.md` is not a repository without conventions. A review
that does not load that skill has neither, and reports a standard the repo deliberately overrode or
concludes the repo documents nothing. `.claude/rules/*.md` arrives at launch in every session and
every sub-agent, so the rule reaches a review however it was started; a convention that holds with or
without the plugin is `.claude/rules/` territory by this skill's own uninstall test.

Fixed text, no substitutions, and deliberately no `paths` frontmatter — scoping it to file types is
exactly what would keep it out of the review that needs it. It points and never copies: no baseline,
no override entry, and the standing note that an absent overrides file is the ordinary state, never
asked for and never reported missing.
