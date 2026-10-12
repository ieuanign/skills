---
"ieuanign-skills": minor
---

design-system: a project's design prototypes are now listed on one page, `docs/design/index.html`, written from the new `template/index.html`. It holds a section for each folder under `docs/design/`, with the app's name and a "Start at" link to the screen a person reaches first, and in it a row for each view: the screen's name linking to the page, its route, and one line on what it shows. A row is keyed by its page's path in `data-page` and carries the page's `data-route`, so a person may put the rows and the sections in any order. A second row for the same page opens it in a state or as a persona. The markup is the new "Index" section of the contract comment in `skeleton.html`.

Every design prototype's floating panel now opens with a link "All pages" to the index. `skeleton.js` draws it, so no page carries it.

mockup: a design prototype's folder is the app the screen belongs to, no longer its surface. A project names its folders — a staff app and a customer site are two, both web — and one with a single app per surface keeps the surface's name, as `web`. How a screen is framed is still its `data-surface`. Build files a new screen in the folder whose pages carry its shell or link to it, and opens a folder for an app that has none.

Confirm keeps the index current: a row for each new design prototype under its folder's section, a section for each new folder, and an existing page's row left where it is with its route and its line made current. Publish stages the index with the pages.

The checklist gains three lines for the index: every design prototype has a row, every row's page exists, and every row's route is its page's.

**For a project already set up:** `mockup` now refuses, naming `/design-system`, until `docs/design/index.html` is on the default branch. Write it from `template/index.html` with a section for each folder under `docs/design/` and a row for each design prototype in it, never the template's example section as it is. Copy the new `skeleton.js`, the `.panel-body > a` rule from `template/skeleton.css`, and the "Files", "Design prototype" and "Index" sections of the contract comment in `skeleton.html`. Pages already drawn need no edit, and a folder already named for its surface keeps its name.
