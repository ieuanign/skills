---
"ieuanign-skills": minor
---

`/setup-ieuanign-skills` gains a fourth part that writes the worktree profile and
`.worktreeinclude`.

The first three parts write smell overrides, the workflow labels and six `.claude/rules/` files, and
touch neither repo profile. A repository where this skill was the only setup that ran therefore
still had no `docs/agents/worktree.md` and no `.worktreeinclude`, and `/dev-loop auto` and
`/pr-comments auto` both refused at intake naming three missing preconditions — the **Setup
command** and **Full-suite command** keys and the file. Supplying them meant a supervised run of one
of those pipelines, which is a long way round for three answers.

**Part 4 supplies exactly those three, plus Fix cycles**, in the shape Part 2 already has: check
what is there → agree the values → write → say what still will not work. Resolution is **per key,
not per file** — each key answers against its own `## ` heading with no fallback, an
already-answered key is never re-asked and its section is left byte-for-byte alone, and only missing
sections are appended. An existing `.worktreeinclude` is reported as it stands and not rewritten;
`/dev-loop`'s Act 0 guarantees its guard line's position on every run of its own accord.

**Configuration, never discovery.** Candidates are read from the repository and offered — a
committed lockfile's clean-install command, a `test` or `check` script, a Makefile target, the CI
config — but nothing is persisted that the user did not choose, because a discovered-and-unconfirmed
Full-suite command hands every later run a green-looking batch nothing tested. `none` and `0` are
persisted answers like any other, each offered with what it costs. `.worktreeinclude`'s candidates
come from `git ls-files -oi --exclude-standard --directory`, narrowed to what a cold checkout cannot
run without — env files and local config, never dependencies — and whatever is chosen, the file's
**last** line is `!.claude/worktrees/**`: gitignore matching is last-match-wins, so only the final
position reliably stops a copy mechanism cloning existing worktrees into a new one.

**`skills/setup-ieuanign-skills/worktree-profile-template.md`** is the skeleton, shaped like the
skill's other templates. It carries a preamble sentence and the three `## ` headings with a
placeholder slot apiece, and its instructions say to substitute the agreed value into every one: the
precondition check judges presence and not value, so a slot left as it is would silence a
prerequisite with a value nobody chose. What a key means and when a run reads it stays in
`/dev-loop`'s `acts/act-0.md`, cited as the source by both the skill and the file it writes rather
than copied into either.

`## Done` names what Part 4 wrote and the two skills that read it, and closes with what a declined
Part 4 leaves behind — `/dev-loop auto` and `/pr-comments auto` refusing at intake on **Setup
command**, **Full-suite command** or `.worktreeinclude` until a gated run supplies each by hand. An
unanswered **Fix cycles** refuses nothing: an unattended run takes `2` for that run and persists it
nowhere. `skills/dev-loop/preconditions.mjs`, the act files and `skills/pr-comments/` are
unchanged — Part 4 is a shortcut in front of the ask-then-persist those already perform, not a
replacement for it. `.claude-plugin/plugin.json` needed no entry: it lists the skill folder, so the
new template ships as-is.
