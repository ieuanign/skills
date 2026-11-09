# check

Report every line of `SKILL.md`'s checklist as pass or fail. Read-only: every file and issue is left as it was, so any caller can run it.

1. **Take the inventory**, as `SKILL.md`'s [The inventory](../SKILL.md#the-inventory) lists it, and read the five files of `docs/architecture/`. Done when both are in hand.
2. **Resolve every marker.** For each `Planned:` link in prose and each `%% Planned:` comment in a diagram: a URL resolves with `gh issue view <link> --json state,labels` as open and labelled `spec`; a relative path, read from the file holding the marker, resolves to a file whose first heading is `# Spec: <name>` and which holds a `PRD:` line. Done when every marker resolves or fails, with its file and line.
3. **The Architecture lines.** Report each, matching the Architecture against step 1:
   - homes: each part's home exists, and each part of the inventory is some part's home;
   - layers: each part sits under one layer;
   - stores: `data.md` names every store and table group, and nothing else;
   - integrations: each one in the inventory is named;
   - deployment: each deployable and environment of `deployment.md` against the deployment files and `docs/delivery-policy.md`, a disagreement reading "infrastructure change owed";
   - exact values: no version, size, port, count or provider SKU, in prose or diagram;
   - decision records: each link resolves;
   - markers: step 2;
   - diagrams: each one is a fenced `mermaid` block;
   - the pointer: `docs/agents/domain.md` names `docs/architecture/`.

   Done when every line has a verdict, each fail naming the file, the section and what fails it.
4. **Without a Spec, return** the list. Done when it holds all ten lines.
5. **Read the Spec**, when given one: an issue by `gh issue view <Spec> --json title,body,url`, a file by its path. Its PRD is its `PRD:` line, read the same two ways. Done when the Spec's body and the PRD's requirement ids and "Left for the spec" lines are in hand.
6. **Find the Spec's lines.** For a Spec issue on a branch with changes, its diff is `git diff $(git merge-base HEAD origin/HEAD) -- docs/architecture/`, the working tree included. For a Spec file, or a Spec whose diff is empty because its changes have landed, its lines are those carrying its markers. Done when every line the Spec touches is listed by file and section.
7. **The Spec lines.** Report each:
   - requirements: each requirement id of the PRD is under Requirements, with a change or "none needed";
   - left for the spec: each line of the PRD is answered in the body, by an `— answers "<line>"` ending;
   - markers: with a diff, every changed line carries this Spec's marker and every marker for this Spec is in the diff; with marked lines only, every gist under Changes has a marker for this Spec in its section, and every marker for this Spec matches a gist;
   - deployment view: `changed` exactly when `deployment.md` is among the Spec's lines;
   - Assumptions: the body's first section is `## Assumptions`.

   Done when every line has a verdict, each fail naming where.
8. **Return two lists.** The Spec's verdict: the five Spec lines, and each Architecture line as it holds on the Spec's lines. Drift: each Architecture fail elsewhere. Done when every fail sits in exactly one list.
