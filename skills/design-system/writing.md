# Writing the skeleton, the reference page and the index

What each holds once written. The branch that sent you here says where its content comes from, and which of these sections it uses; this file says where the content goes. Section names in `SKILL.md` are given as it heads them.

## The skeleton

The skeleton's six files, written from the template:

- **`tokens.css`**, by One source for the tokens.
- **`skeleton.css`**: the frames; each surface's components under its frame, the web's bare; after them the layouts; and each shell's styles among the components. Name each component as its surface's kit names it, and each layout as the code names it, or for the kind of page it arranges. The components comment names each surface's kit, by its path or `none yet`.
- **`project.js`**: the personas with their keys, and a shell for each frame the signed-in screens share, with its navigation items and their routes.
- **`skeleton.html`** and **`prototype.html`**: their example screens drawn in those components, the contract comment verbatim.

Done when every token, component, layout, persona and shell the branch gave you is in the files.

## The reference page

`docs/design-system/reference.html`, written from the template:

- a `data-token` row for every colour token;
- a `data-pair` row for every text and background pair the components use;
- an example of each size and space;
- a section for each surface the skeleton frames, drawing that frame with every component of the surface inside it, in each of its variants;
- a Layouts section drawing each layout with its regions labelled;
- each shell in a `data-screen` block that names it by `data-shell` at a `data-route` marking one of its items current, so the page draws it from `project.js` and holds no copy.

Done when every token, component, layout and shell in the skeleton has an example.

## The index

`docs/design/index.html`, written from the template by the contract's Index block, linking the skeleton's files as `../design-system/…`:

- **Rows.** A section for each folder under `docs/design/` and, in it, a row for each design prototype found there: the row's name from the page's `<title>`, its route the page's `data-route`, and the section's "Start at" the screen a person reaches first, its sign-in where it has one, else its home.
- **The template's section is an example of the shape**, never written as it is: a row whose page does not exist fails `mockup`'s Check, so a project with no design prototype yet gets an index with no section.
- **The list of pages not folded yet**, as the Index block marks it up: a line for each page under `docs/design/` that is neither the index nor a design prototype, linking it where it still is.
- **An index already there** keeps its rows and their order, a second view of a page among them: only a row for a page with none is added, and a row whose page is gone removed. It keeps the list's lines the same way, less a line whose page is gone, and the list goes with its last line.

Done when every design prototype under `docs/design/` has a row, no row names a page that is not there, and every other page there but the index is on the list.
