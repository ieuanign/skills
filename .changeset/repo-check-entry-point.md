---
"ieuanign-skills": patch
---

Maintainer tooling: `npm run check` (`scripts/check.sh`) is now the repo's verification entry point, so the checks that catch breakage here no longer have to be remembered and typed by hand. Three checks, one readable line each, all of them run even when an earlier one fails: `claude plugin validate . --strict` (skipped with a notice, not a failure, when `claude` is not on PATH); a syntax check over every discovered `skills/**/phase-*.js`; and a `package.json` / `.claude-plugin/plugin.json` version-sync check. The phase-script check compiles each file as an async function over the Workflow globals rather than using `node --check` — the phase scripts are valid as neither CommonJS nor ESM, and `node --check` passes them even when they are broken.
