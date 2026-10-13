# Upgrade

Read `<this-skill-dir>/writing.md` with this file, for its The reference page and The index alone. Upgrade rewrites in place: it deletes no file, leaves `brand/` untouched and commits nothing. Rewriting a project's pages is its one step that can lose a person's work, and their review of the uncommitted files is the guard on it.

1. **Compare.** Read the files under `docs/design-system/`, and `docs/design/index.html`, against the template's, and put each difference under the one of the checklist's three template lines it fails, naming the file and what differs. Sort every page under `docs/design/`: the index; a design prototype; or another page. A prototype folder the project keeps elsewhere is not read. Done when every difference sits under one line and every page is sorted.
2. **Skeleton**, by the line `SKILL.md`'s The template draws:
   - Keep what is the project's, and replace what is the template's with the template's.
   - Write each missing file from the template, with the project's tokens and components in its example screens; a missing index as `writing.md` holds it.
   - The tokens follow One source for the tokens, their names and values as they were.
   - Whatever of the project's sits in what is the template's moves into `project.js`, written from the template where the project has none: the sizes, the sprite and what an old `skeleton.js` keys the dark theme on, and any persona, shell or hook the project added there. What `project.js` already holds is kept as it is, and stands where an old `skeleton.js` holds the same thing.
   - The furthest case is one `skeleton.html` with its styles and script inline: its tokens come from the app's token file, or with none in the app become `tokens.css`; its frames and components go into theirs in `skeleton.css`; its script is sorted the same way; and the page is left linking the files, with the template's comment and its own screens.

   Done when the three template lines pass and every token, frame, component and layout the project had is in the files as it was.
3. **Pages**, where the contract comment differed:
   - Write `reference.html` as `writing.md` holds it, from the project's tokens, components and layouts as they are.
   - Rewrite each design prototype from `prototype.html` to the contract comment, keeping its screen, states, controls, links, requirement ids, behaviour and placeholders. A hook written in a form the comment no longer holds is rewritten in the one it does, and a value the comment requires that the page lacks is taken from the page's own name or path.
   - Write the index as `writing.md` holds it, keeping each row a person added.
   - Every other page is left as it is, for Fold to bring in.

   Done when each rewritten design prototype passes `mockup`'s Check, run for the PRD its `data-req` ids name.
4. **Checklist.** Run every line of `SKILL.md`'s checklist. Fix a fail in a file you wrote; a fail that comes from the code stays, and goes in the return. Done when every line has a verdict.
5. **Return** what differed under each of the three lines, each file written or rewritten, what moved and where to, the pages left as they were, which are Fold's to bring in, each value taken from a name or path, the checklist result, and that the rewritten pages wait on the person's review.
