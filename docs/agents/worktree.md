# worktree repo profile

Repository facts any skill provisioning a worktree reads — `/dev-loop` and `/pr-comments` alike; answers persisted here are never re-asked.

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

## Fix cycles

`2`

The default, kept deliberately rather than by omission. This repository's reviewer findings are
prose about prose, so two independent invocations rarely word one defect identically: the threshold
will fire rarely here and the pipeline's hard ceiling will do the ordinary bounding, which is the
shape the pipeline intends. Raise it only if reviews here start genuinely repeating themselves.
