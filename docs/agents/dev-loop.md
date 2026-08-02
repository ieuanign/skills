# dev-loop repo profile

Per-repo configuration for the `/dev-loop` pipeline. Answers persisted here are never re-asked.

## Branch template

`{type}/{issue}` — the type comes from the issue's own conventional-commit type (`feat`, `fix`,
`docs`, `chore`), so a documentation ticket lands on `docs/23` rather than `feat/23`.

Sub-lanes append the area: `{type}/{issue}-{area}`.

## PR title format

`<type>(<scope>): #<issue> - <title>` — the repo default.

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

The whole verification surface a cold worktree can run: the plugin manifest, every phase script's
syntax, and the package/plugin version sync. The `.scratch/dev-loop-checks/` state-machine checks
are deliberately not in it — they are gitignored, so a provisioned worktree does not have them.

## Constraints

None recorded.
