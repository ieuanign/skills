---
"ieuanign-skills": minor
---

design-system: a design prototype's floating panel docks either side, opens by the window's width, and steps aside for what it would cover. A dock switch in the panel moves it between the bottom right and the bottom left; the browser keeps the side, and the side it starts on is the project's, `dock` in `project.js`, `"left"` or `"right"`, with right the side when none is set.

A browser that has kept nothing opens the panel in a window 64rem or wider and collapsed in a narrower one; once a person toggles it, that choice holds at every width. The side and whether the panel is open are the browser's alone — neither has a key in the page's address, and neither is carried on a link.

`data-avoid` on an element of the screen the panel must not cover, such as a toast region, makes the panel move to the top of its side while that element shows in its corner, open or collapsed, and come back when it no longer does. An element on the other side leaves the panel where it is. `prototype.html` shows one: the sign-in example's signed-in toast.

The panel's state buttons are drawn under their kind, in the contract's order — default, error, empty, loading, success, dialog, first-run — with a kind that has no state left out and a kind the contract does not name last. The page's own order is unchanged, so its first button is still the default state, and a mockup section's states stay as written.

**For a project already set up:** copy the new `skeleton.js` and the "Design prototype" section of the contract comment in `skeleton.html` from `template/`, and copy the `[data-panel].docked-left`, `[data-panel].raised` and `[data-panel] .states .kind` rules from the page pieces of `template/skeleton.css` into the project's own. To start the panel on the left, add `dock: "left"` to `project.js`. Pages already drawn need no other edit; mark what the panel must not cover with `data-avoid`.
