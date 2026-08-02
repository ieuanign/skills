---
"ieuanign-skills": minor
---

The `dev-loop` roster ships as plugin agents, and its skill preloads now resolve.

`skills:` in a subagent's frontmatter is a **preload** — it injects the skill body at agent startup, and a name that doesn't resolve is skipped with only a debug-log warning. All three roster preloads were silently dead: `code-writer`'s `tdd` and `debugger`'s `diagnosing-bugs` exist bare only on the npx path, and `reviewer`'s `code-review` pointed at the bundled skill, which sets `disable-model-invocation` and is unpreloadable by rule. None of the three has the `Skill` tool, so preload was their only channel.

What changed:

- The roster moved from `skills/dev-loop/agents/` to `agents/` at the plugin root, where it installs with the plugin. `/dev-loop`'s Act 0 no longer checks for or copies roster members into your repo.
- `code-writer` and `debugger` preload `mattpocock-skills:tdd` and `mattpocock-skills:diagnosing-bugs` — namespaced, so they resolve on the plugin path.
- `reviewer` carries no preload at all. Its Standards axis is now self-contained (standards-source discovery plus the twelve-smell baseline), and it runs on a more capable model at high reasoning effort.
- The marketplace declares `mattpocock-skills` as a cross-marketplace dependency, so installing this plugin pulls Matt's in automatically. The prerequisite is enforced rather than documented.
- `npx skills add` is now best-effort: it installs the skills but not the roster agents, and the namespaced preloads don't resolve on that path. Use the plugin install.

**Migration.** If you ran `/dev-loop` before this release, it copied the roster into your repo. Those copies are now stale and shadow nothing useful — delete them:

```bash
rm .claude/agents/{architecture-engineer,code-writer,debugger,reviewer}.md
```
