---
"ieuanign-skills": minor
---

design-system: a new branch, **Fold**, for a project whose screens already exist as pages that are not design prototypes. It is picked when a person asks for pages to be folded in: a prototype folder's pages, or pages under `docs/design/` that are not design prototypes, such as one page per PRD. It needs `docs/design-system/prototype.html` and `docs/design/index.html`, and where either is missing it writes nothing and names the branch that writes it.

Fold rewrites each page asked for into design prototypes built from `prototype.html` to the contract comment, one per screen, so a page of several screens is split. Each keeps every state, control and link, and its notes go to the panel. A hook the skeleton has is written as the skeleton's attribute, a rule of the page's own `<style>` moves into `skeleton.css` with an example on `reference.html`, and a value the comment requires that the page lacks is taken from the page's own name or path and listed in the return. Requirement ids are found on the page, never made up: a page naming none gets an empty `data-req`.

A screen that already has a design prototype is never written over. The differences are recorded as a `conflicts` item on that design prototype, naming both sides and their paths, and the old page is left as it was. Fold rules on no conflict.

Fold deletes an old page only once the design prototype written from it passes `mockup`'s Check, after pointing every link to it at the new page. A fail it cannot fix leaves the old page as it was and takes its design prototype and row back out. It deletes nothing else — not a prototype folder's stylesheet or script, not `brand/` — rewrites no token and commits nothing: every file, the deletions among them, waits on the person's review.

The index gains a list of the pages not folded yet, under its own heading, each linking the page where it still is. The contract comment's Index block marks it up, and it is absent when empty. Fold takes one batch, the folder or the list a person named, and that list is the record of what remains. Build, Adopt and Upgrade write it too, for each page under `docs/design/` that is neither the index nor a design prototype.

mockup: Build and Check tell a design prototype from any other page under `docs/design/`. A page not folded yet marks no screen existing, is neither read nor folded by Build, and needs no row on the index. Check takes a design prototype's PRDs from its `data-req` ids, so it needs no `N`; with an empty `data-req` it reads no PRD, and each line that reads one passes.

**For a project already set up:** the contract comment changed, so run `/design-system` and it picks Upgrade, which brings the Index block in; then ask it to fold, naming the folder or the pages. Review the uncommitted files, the deletions among them, before committing them.
