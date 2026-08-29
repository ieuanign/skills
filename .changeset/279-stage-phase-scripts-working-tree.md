---
"ieuanign-skills": patch
---

`/dev-loop` stages its phase scripts into the working tree before handing them to the Workflow tool,
so a run works on the supported `/plugin install` path.

The Workflow tool gates `scriptPath` against a narrower allowlist than `Read`: a path it returned
itself, the working directory, or an `/add-dir` directory. Acts 1 and 3 both passed
`<this-skill-dir>/phase-*.js`, which lands inside the checkout only while `scripts/link-skills.sh`
has dogfood-symlinked the skill into `.claude/skills/` — so the maintainer's own links were what hid
it, and `/dev-loop` had never run anywhere else. Both call sites now `mkdir -p` and `cp -f` their
script into `<MAIN>/.scratch/dev-loop-scripts/` immediately before the call and point `scriptPath` at
that copy. `<MAIN>` is already a spine derived fact; `mkdir -p` because Act 0 guarantees `.scratch/`
is gitignored, not that it exists. Only `scriptPath` moves — `skillDir` still names the real skill
directory, which is where the notifier resolves `notify.sh` and `notifications.md` from, and
`acts/act-3-contract.md` now says so, so the next reader who notices the two paths disagree does not
"fix" it.

**Re-staging before every use is what keeps the copy disposable.** No act file reads a copy it did not
just write, so nothing depends on the directory surviving — which is what lets `/dev-loop-cleanup`
offer it under the fixed key `staged-scripts`, `remove` unconditionally, with no lane to check and no
risk to a run in flight. That row is repo-keyed rather than lane-keyed: gathered only in an unscoped
run, a Scratch cell alone, and reaped as exactly that one directory path, never a glob.

`npm run check` gains a **scriptPath is a working-tree path** stage that fails on any `scriptPath:`
in `skills/**/*.md` whose value starts with `<this-skill-dir>`, naming the file, the line and the
remedy. It sits beside the agent-types stage, which exists to catch the same class of defect: a
placeholder that resolves for whoever wrote it and for nobody else. It anchors on `scriptPath:` so
that `<this-skill-dir>` as the `cp` *source* is not flagged, scans `skills/` only so the frozen #121
quotes in `docs/dev-loop-rule-inventory.md` stay verbatim, and fails when it measured nothing at all.
