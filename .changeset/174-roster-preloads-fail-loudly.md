---
"ieuanign-skills": minor
---

A roster agent whose preloaded skill does not resolve now stops the run, rather than quietly weakening
it.

`code-writer` preloads `mattpocock-skills:tdd` and `debugger` preloads
`mattpocock-skills:diagnosing-bugs`, each through its `skills:` frontmatter and each from the plugin's
declared dependency. An entry that does not resolve is dropped silently: that agent launches without
the method it was written around and returns less, which is indistinguishable from clean code. It
resolves for the maintainer, whose dependency is installed and enabled, and dies for the consumer whose
install lacks it, has disabled it, or carries a version that renamed the skill.

**`npm run check` gains a `roster skill preloads` stage.** Every `<plugin>:<skill>` in an `agents/*.md`
frontmatter is resolved against `claude plugin details <plugin>`, and every shape that does not resolve
is a FAIL naming the agent and the entry — a `skills:` line the stage cannot read, an entry that is not
`<plugin>:<skill>`, a plugin that lists no skills, a roster that declares none at all. Never a skip: a
silent skip is the failure the stage exists to catch. It stands down only where `claude` is off PATH,
as the plugin-manifest stage beside it already does. That stage catches none of this — `claude plugin
validate --strict` passes on a wholly invented plugin and skill.

**`/dev-loop` refuses at intake.** Act 0's session-capability step gains a second check beside the
Workflow tool one: the orchestrator looks for each preloaded entry among its own available skills,
because only the session knows what actually resolved for the agents it is about to dispatch, where a
manifest, a path or a subprocess knows only what is on disk. Under `gated` the run stops there naming
the agent and the entry; under `unattended` those same names join the ⟨notify⟩ Intake refusal, whose
source list goes from two to three. Nothing is asked under either mode and no profile key is added —
this is not an answer a human can supply to the run.

`docs/dev-loop.md` records it beside the prerequisites it sits with. No agent definition was edited.
