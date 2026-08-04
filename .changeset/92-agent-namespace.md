---
"ieuanign-skills": patch
---

`/dev-loop` Mode W now resolves its roster agents against the registry namespace the host discovers, instead of naming them with bare literals that only ever worked for a maintainer.

The same agent definition is registered under two different names depending on how it arrived: bare — `code-writer` — when it is linked into a repository's own `.claude/agents/`, and namespaced `<plugin>:<name>` — `ieuanign-skills:code-writer` — when the plugin is installed. `/plugin install` is the supported install path, so the namespaced form is the ordinary one and the bare form is the maintainer's, which is exactly backwards from what the phase scripts assumed. Both carried bare literals — `phase-plan.js` for the architect, `phase-execute.js` for the writer, reviewer, debugger and notifier — so **every dispatch in an installed plugin died on an unresolvable agent type**: Phase A returned DIED for every lane and Phase B never got a lane past its first commit.

**The namespace is discovered, never derived.** Act 0 reads it off the host's own agent roster — find `code-writer` among the available types, take the prefix or the empty string — at the one place the run mode and the execution mode are already settled, and carries that single value to both phase scripts in their args. The roster is the registry's own answer, so nothing infers it from a path, a package name or a manifest, and renaming the plugin or the marketplace needs no edit. A trailing colon is tolerated on the way in, because writing one is a plausible reading of "namespace" and the failure it would otherwise cause is total rather than partial.

**Mode A needed no change and got none.** Its host dispatches by the name its own roster lists, which is already correct; only a workflow script is blind to the registry. This is the same class of fact as `skillDir`, which the host already passes for the same reason, and contracts.md's Roles section now states the rule normatively — the Agent column names each role's *definition*, not the string that dispatches it.

**`npm run check` gained a structural guard**, because nothing in the suite could see this: the syntax check compiles a bare literal happily, and no check runs a phase script, since running one dispatches agents. An agent type in a phase script must now come from the script's `roleAgent()` resolver and never from a quoted string — verified red against the pre-fix files, where it catches all six sites.
