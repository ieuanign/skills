# dev-loop repo profile

Per-repo configuration for the `/dev-loop` pipeline. Answers persisted here are never re-asked.

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

## Suite
<passed | failed + failing test identifiers | not run + why>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Setup command

```bash
npm ci
```

The lockfile is committed and the changesets CLI lives in `devDependencies`, so a lane's
`npm run changeset` step needs `node_modules` present. `npm run check` itself needs only node and
the `claude` CLI.

## Full-suite command

```bash
npm run check
```

The whole verification surface a cold worktree can run. `scripts/check.sh` is the list of stages
and this file keeps no second copy of it — one that drifts is worse than none. Every stage is
tracked, including the state-machine harness one of them drives, so a provisioned worktree has all
of them. It needs only node and the `claude` CLI.

## Constraints

None recorded.
