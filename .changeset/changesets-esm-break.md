---
"ieuanign-skills": patch
---

Repo tooling: pin `human-id` so the `changeset` CLI runs again.

`human-id@4.2.0` shipped `"type": "module"` in a **minor** bump, so every CommonJS consumer broke on install. `@changesets/write@0.4.0` `require()`s it and floats into it through `^4.1.1`, which made every `changeset` command — `status`, `version`, and the `changeset` command this repo's own contribution checklist tells maintainers to run — die with `ERR_REQUIRE_ESM` before reading a single changeset file.

An npm `overrides` entry pins it to `4.1.3`, the last CommonJS release, with the reason recorded beside it in `package.json` and a note on when to drop it. Nothing about the package's own contents changes.
