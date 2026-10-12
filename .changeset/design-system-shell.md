---
"ieuanign-skills": minor
---

design-system: an app's shell — the frame every signed-in screen shares — is drawn once, by the project. A screen marks where it goes with `data-shell="<name>"` on an element in its `.viewport`, around its own content, and `skeleton.js` draws the shell of that name from `project.js` around it, so no page carries a copy of the frame. `PROJECT.shells.<name>` holds `draw`, a function given `{ persona, route, switches }` and returning the frame in the skeleton's components with a `<div data-shell-slot>` where the screen's content goes, and `switches`, each a name with its values, the first its default.

`data-route="<route>"` on a web or phone screen names its route in the app, as `/orders/{id}`. Each navigation item in a shell carries its own `data-route`, and `skeleton.js` marks one `aria-current="page"`: the item whose route is the screen's, or else the longest one the screen's sits under, as `/orders` for `/orders/{id}`.

A shell's switches are panel switches like the others: in a design prototype they sit in the floating panel below the states, and each travels in the address as `?<switch>=<value>`, left out at its default and carried on a link to another design prototype. In a mockup they sit in the section's `.head` and leave the address as it is. The frame is drawn again when the persona or a switch changes, and the screen's content is moved into it rather than written again, so its states and its own script keep working.

The template ships one shell, `app`: a navigation list, the signed-in person, and a `notifications` switch — closed, open, empty, loading, failed. Its styles sit in the components section of `skeleton.css`, with the narrow layout as an `@container` rule, and `reference.html` draws it live in a Shell section.

mockup: Build names each web or phone screen's route, and a signed-in screen sits in its app's shell rather than carrying a copy of it. A navigation item the PRD adds and `project.js` lacks is an addition: it sits in the page's `<script data-additions>` and its additions list, and Confirm writes it into the shell in `project.js`.

**For a project already set up:** copy the new `skeleton.js` and the contract comment in `skeleton.html` from `template/`, write the app's own shell into `project.js` under `shells` with its styles in the components section of `skeleton.css`, and show it on `reference.html`. A page already drawn keeps working as it is; to put one in the shell, add `data-route` to its screen and `data-shell` around its signed-in content, and delete its copy of the frame.
