Skeleton for `.claude/rules/stacked-prs.md`. Offer it only where `gh stack --help` exits 0; a machine
without the extension has nothing to obey. No `paths` frontmatter — any branch may turn out to be
stacked. It is the instruction alone, since every session carries it; `stacked-prs-reference.md` is
the rule in full. Everything below the line goes in the file.

---

# Stacked pull requests

Pull requests here may be **stacked**: a chain where each branch is based on the one below rather than
on the default branch, recorded on GitHub with the `gh-stack` extension.

**A stacked branch is rebased with `gh stack rebase`, brought up to date with the default branch with
`gh stack sync`, and merged with `gh stack merge`** — never `git rebase` followed by a force-push. A
branch that is not part of a stack rebases normally.

What a plain rebase or a merge by hand does to a chain: `.claude/reference/stacked-prs.md`.
