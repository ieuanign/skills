---
"ieuanign-skills": minor
---

design-system: a new branch, **Upgrade**, for a project whose skeleton is behind the template. It is picked when `docs/design-system/skeleton.html` exists and any of three template lines fails: the contract comment of `skeleton.html` is not the template's, what is the template's in `skeleton.js` is not the template's, or a file the template holds is missing. The app's token file linked in place of `tokens.css` is not a missing file.

Upgrade keeps what is the project's — its token names and values, its frames and components, its screens, `project.js` — replaces what is the template's, and writes each missing file from the template with the project's tokens and components in its example screens. Whatever of the project's sits in what is the template's moves to where the project's lives. A project on one `skeleton.html` with its styles and script inline is taken the whole way: to the linked files, the template's comment and its own screens.

Where the contract comment differed, Upgrade rewrites `reference.html`, the index and every design prototype under `docs/design/` to the comment, keeping each page's screen, states, controls, links, requirement ids, behaviour and placeholders. A value the comment requires that a page lacks is taken from the page's own name or path and listed in the return. Any other page under `docs/design/` is left as it is and listed.

Upgrade deletes no file, leaves `brand/` untouched and commits nothing: the rewritten pages wait on the person's review.

"The template" now says, file by file, what is the template's, what is the project's and what is written from the template around the project's content; Build, Adopt, Upgrade and Check all take the line from there. The three template lines join the checklist, so Check reports them too — each fail naming the file and what differs — and still changes nothing.

**For a project already set up:** run `/design-system` and it picks Upgrade where the skeleton is behind; review the uncommitted files before committing them.
