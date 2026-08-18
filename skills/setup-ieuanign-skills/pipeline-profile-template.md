Skeleton for `docs/agents/dev-loop.md`. Substitute the agreed value into every `<...>` slot — each key
resolves against its own `## ` heading with no fallback, and any non-blank line under one answers it,
so a slot left as it is answers a key with a value nobody chose. `## Constraints` takes
`None recorded.` when there is nothing to record. `## PR body template` is the one heading deleted
outright when it is declined rather than left empty: an empty section reads as answered, and a
declined key stays `/dev-loop`'s first Gate 2 to ask. Every `##` line of a PR body shape stays inside
the fence — an unfenced one starts a new section and splits the file into sections nothing reads. What
a key means and when a run reads it is `/dev-loop`'s `acts/act-0.md`, restated neither here nor in the
file. Everything below the line goes in the file.

---

# dev-loop repo profile

Per-repo configuration for the `/dev-loop` pipeline's own artifacts — the branches it names and the
pull requests it writes; what any skill provisioning a worktree reads is `docs/agents/worktree.md`.

## Branch template

`<the agreed branch template, sub-lanes included>`

## PR title format

`<the agreed PR title format>`

## PR body template

```markdown
<the agreed body shape — its own `##` lines belong in here, which is what keeps them content>
```

## Constraints

<the repository's cautions, one per line — or `None recorded.` when there are none>
