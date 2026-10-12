---
"ieuanign-skills": minor
---

design-system: a screen that opens over another — a side panel, a sheet, a dialog with its own route — is drawn over it. `data-over="<page>"` on an element of the screen makes `skeleton.js` draw that page's design prototype in it, behind the rest of the screen, dimmed and inert, with no floating panel of its own. The page behind fills the screen's `.viewport`, so it is drawn at the screen's own size.

The value is a link as an `<a href>` is. It may name a state, as `data-over="orders.html?state=filtered"`, and it carries the theme, the size, the persona and every other switch, so the page behind is drawn again whenever one changes and never differs from the screen over it. `data-when` and `data-perm` choose a `data-over` element as they do any other: a state with nothing behind hides it, and two of them under their own keys give each persona the page it is really over.

A design prototype drawn inside another page draws no panel, no size and no backdrop, fills its frame, and leaves the address and what the browser keeps as they are. `reference.html` draws one live, in a "Page behind" card under "A page's own pieces".

mockup: Build names, for each screen that opens over another, the screen behind it, and the draft carries `data-over` — the draft's copy of that screen, else its design prototype, else the bare name of a screen new in the draft, which stands in by its name. Confirm writes each as the path of the page behind, and the checklist fails a `data-over` whose page does not exist.

**For a project already set up:** copy the new `skeleton.js` and the contract comment in `skeleton.html` from `template/`, and copy the `[data-over]` and `.framed` rules from the page pieces of `template/skeleton.css` into the project's own. Pages already drawn need no other edit; to draw a screen over the one it opens over, add an element with `data-over` to its `.viewport`.
