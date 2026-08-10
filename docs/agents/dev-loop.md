# dev-loop repo profile

Per-repo configuration for the `/dev-loop` pipeline's own artifacts — the branches it names and the
pull requests it writes. Answers persisted here are never re-asked; what any skill provisioning a
worktree reads is in `docs/agents/worktree.md`.

## Branch template

`{type}/{issue}` — the type comes from the issue's own conventional-commit type (`feat`, `fix`,
`docs`, `chore`), so a documentation ticket lands on `docs/23` rather than `feat/23`.

Sub-lanes append the area: `{type}/{issue}-{area}`.

## PR title format

`<type>(<scope>): #<issue> - <title>` — the repo default.

## PR body template

Prose-first, in the house style of the repo's hand-written PRs: a lead paragraph saying what was
wrong and what changed, then thematic `##` sections explaining the change, then the pipeline's
required sections. Whatever the prose, these must survive:

```markdown
Closes #<n>.                       <!-- first sub-lane only; later ones reference without closing -->
<stacked note, when the base is a feature branch>

<lead paragraph + thematic ## sections>

## Context
<the architect's summary bullets>
<n> planned, <m> made

## Acceptance criteria
- <met|partial|not-met> — <criterion> — <evidence>      <!-- verbatim from the reviewer; omit the section when it returned none -->

## Review findings
<count> fixed, <count> won't-fix (each with the writer's reason). Reviewer NOTES verbatim.
<the review trajectory, one line per round — only where the review loop ended on a bound>

## Suite
<passed | failed + failing test identifiers | not run + why>

Run handle: <the run's own transcript identifier>   <!-- ended sub-lanes only; omitted when absent -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Constraints

None recorded.
