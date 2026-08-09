---
"ieuanign-skills": patch
---

A bundled module invoked through a symlinked skill directory now runs, instead of exiting 0 having
done nothing.

`read-comments.mjs` and `cost-report.mjs` are invoked by path, and on a checkout that links its
skills into `.claude/skills/` that path runs through a symlink. Node resolves a module's own path
through symlinks when it sets `import.meta.url` but leaves `process.argv[1]` exactly as the caller
typed it, so a main-module guard comparing the two unresolved was false there and `main()` never ran.

The failure had the worst shape available to it: exit 0, no output, nothing on stderr. A silent
success reads as an empty result, so `read-comments.mjs` reported every pull request as having no
unresolved comments and `cost-report.mjs` reported every run as having cost nothing. Both now
resolve the invoked path before comparing.

`npm run check` gained the check that would have caught it: every bundled module with a `main` entry
is invoked through a symlinked parent with no arguments and must answer with its usage and a
non-zero exit. Neither module reaches the network before parsing an argument, so it stays offline.
