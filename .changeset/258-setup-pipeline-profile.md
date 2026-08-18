---
"ieuanign-skills": minor
---

`/setup-ieuanign-skills` gains a fifth part that writes the pipeline profile
`docs/agents/dev-loop.md`.

Four keys there describe the artifacts `/dev-loop` writes — **Branch template**, **PR title format**,
**PR body template** and **Constraints** — and none of them refuses a run. Three take a documented
default for the run that needed them, reported and persisted nowhere, and nothing asks for
**Constraints** at all. A repository that only ever ran `auto` was therefore never asked for one and
never got a file: it ran on the defaults indefinitely, with nothing on disk to edit. Part 4 closed
the equivalent gap for the worktree profile, where the refusal at intake at least made itself heard.

**Part 5 supplies all four**, in the shape Parts 2 and 4 already have: check what is there → agree
the values → write. Resolution is **per key, not per file** — each key answers against its own `## `
heading with no fallback, an already-answered key is never re-asked and its section is left
byte-for-byte alone, and only missing sections are appended. That bites harder here than in Part 4:
a gated run persists the branch template into this file at Act 0, so finding the file already there
is the ordinary case rather than the edge one.

**The PR body template is presented as the optional one**, with the reason stated rather than
implied: `/dev-loop` asks for that key at the **first Gate 2**, where the user is looking at a real
pull request while they answer, so answering it up front is answering it blind. Whatever shape is
chosen, Gate 2's core elements have to survive it — the statement, never the list, which is Gate 2's
and has grown repeatedly. Declining takes no follow-up question and writes no section: a heading with
nothing under it reads to a human as an answered key, and the precondition check judges non-blank
content only, so it would report and default the key regardless. **Constraints** has nothing to
default, and `none` is a real answer there, written as a visible `None recorded.`

**`skills/setup-ieuanign-skills/pipeline-profile-template.md`** is the skeleton, shaped like the
skill's other templates: a preamble sentence and exactly those four `## ` headings with a placeholder
slot apiece. Its instructions say to substitute the agreed value into every one — any non-blank line
under a heading answers that key, so a slot left as it is answers one with a value nobody chose — and
that every `##` line of a body shape stays inside the fence, because an unfenced one starts a new
section and splits the file into sections nothing reads. The split with Part 4's template runs one
way in both directions: neither carries a heading belonging to the other, fenced or not.

`## Done` names `docs/agents/dev-loop.md` and the one skill that reads it. `/pr-comments` provisions
worktrees but writes none of this pipeline's artifacts, so it reads the worktree profile and never
this file. A declined Part 5 refuses nothing — an unattended run takes each documented default for
the run that needed it and reports it, leaving nothing behind to edit.
`skills/dev-loop/preconditions.mjs`, the act files and `skills/pr-comments/` are unchanged: Part 5 is
a shortcut in front of the ask-then-persist those already perform, not a replacement for it.
`.claude-plugin/plugin.json` needed no entry, because it lists the skill folder and the new template
ships as-is.
