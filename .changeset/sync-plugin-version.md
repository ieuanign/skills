---
"ieuanign-skills": patch
---

Maintainer tooling: `.claude-plugin/plugin.json` now tracks `package.json`'s version automatically. `changeset version` bumps only `package.json` and has no knowledge of the plugin manifest, so every release PR arrived with the two out of sync and had to be corrected by hand — and `claude plugin validate --strict` passes that state, so nothing caught it but a human remembering. The `version` script now chains `scripts/sync-plugin-version.sh`, which rewrites the version string in place (leaving the rest of the file byte-identical) and is a no-op when the two already agree. The release workflow calls `npm run version` so CI and a local run take the same path. The README's maintainer list gains it, plus `npm run check`, which was added without being documented there.
