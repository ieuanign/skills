# check

Report every line of `SKILL.md`'s [Checklist](../SKILL.md#checklist) as pass or fail, by its name. Read-only, so any caller can run it.

1. **Take the inventory**, as `SKILL.md`'s [The inventory](../SKILL.md#the-inventory) lists it, and read the five files of `docs/architecture/`. Done when both are in hand.
2. **Resolve every marker.** For each `Planned:` link in prose and each `%% Planned:` comment in a diagram: a URL resolves with `gh issue view <link> --json state,labels` as open and labelled `spec`; a relative path, read from the file holding the marker, resolves to a Spec body as `SKILL.md`'s **Spec link** defines it. Done when every marker resolves or fails, with its file and line.
3. **The Architecture lines**, each matched against step 1:
   - a line or diagram element whose marker resolved in step 2 is **planned**: it passes homes, stores, integrations and deployment without matching the code;
   - **markers** is step 2's result.

   Done when every line has a verdict, each fail naming the file, the section and what fails it.
4. **Without a Spec, return** the list. Done when it holds all ten lines.
5. **Read the Spec**, when given one: an issue by `gh issue view <Spec> --json title,body,url`, a file by its path. Its PRD is its `PRD:` line, read the same two ways, a relative path from the Spec's file. Done when the Spec's body and the PRD's requirement ids and "Left for the spec" lines are in hand.
6. **Find the Spec's lines.** For a Spec issue on a branch with changes, its diff is `git diff $(git merge-base HEAD origin/HEAD) -- docs/architecture/`, the working tree included. For a Spec file, or a Spec whose diff is empty because its changes have landed, its lines are those carrying its markers. Done when every line the Spec touches is listed by file and line.
7. **The Spec lines**, as the Checklist words them, with these readings:
   - **left for the spec**: each line of the PRD is answered in the body, by an `— answers "<line>"` ending;
   - **Spec markers**: with a diff, as the line says; with marked lines only, every gist under Changes has a marker for this Spec in its section's file, and every marker for this Spec matches a gist;
   - **deployment view**: `changed` exactly when `deployment.md` is among the Spec's lines;
   - **Assumptions**: the body's first `##` is `## Assumptions`.

   Done when all five lines have a verdict, each fail naming where.
8. **Return two lists.** The Spec's verdict: the five Spec lines, and each Architecture line as it holds on the Spec's lines. Drift: each Architecture fail elsewhere. Done when every fail sits in exactly one list.
