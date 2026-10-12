---
"ieuanign-skills": minor
---

design-system: every switch in a design prototype's floating panel now travels in the page's address. The state, the size and the theme each have a key in the query — `?state=<state>`, `?size=<size>` (its label in lower case, as `phone`), `?theme=dark` — so one link names the whole view. A switch at its default leaves its key out, and switching rewrites the address without a reload and without a history entry.

A link to another design prototype, when followed, carries every switch but the state, and a key the link sets itself wins; a link that is only a `#…` fragment, or that leaves the page's origin, is left as written. `?theme=` is read on every page that links `skeleton.js` — the skeleton and the reference too — ahead of the theme the browser kept, and is never saved as kept.

`#<state>` still opens a design prototype in that state, so links already written keep working, but it is no longer written and has left the contract comment in `skeleton.html`: write `?state=<state>`.

**For a project already set up:** copy the new `skeleton.js` and the "Design prototype" section of the contract comment in `skeleton.html` from `template/`. Pages already drawn need no edit.
