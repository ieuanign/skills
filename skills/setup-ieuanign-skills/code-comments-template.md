Skeleton for `.claude/rules/code-comments.md`. Fill the `paths` globs from the languages actually in
the repo — this is the one rule worth scoping, since a docs-only or config-only session should not
carry it. Everything below the line goes in the file, frontmatter included.

---

```
---
paths:
  - "<**/*.{ts,tsx,js,jsx}>"
---
```

# Code comments

**Two lines maximum.** A comment that needs three is describing something the code should say itself —
rename it, extract it, or split it, and the comment stops being needed.

**Say why, never what.** The code already states what it does. A comment earns its space by carrying
what the code cannot: the constraint that forced this shape, the case that looks handled and is not,
the reason the obvious version is wrong.

**Never reference an ADR, an issue, a scratch file, or a plan.** Those move, get renumbered, get
merged, get deleted — and a comment pointing at one that no longer exists is worse than no comment,
because a reader trusts it and then cannot find what it promised. Write the reason itself, in the two
lines. If it genuinely will not fit, the rationale belongs in the document and the code needs no
pointer to it.

Delete a comment the code has outgrown in the same change that outgrows it. A stale comment is read as
current by everyone who finds it.
