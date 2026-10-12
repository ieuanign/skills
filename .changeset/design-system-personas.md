---
"ieuanign-skills": minor
---

design-system: a design prototype can be viewed as each persona who uses it. The template gains a sixth file, `project.js`, which holds what the project defines once as one object, `PROJECT`; `PROJECT.personas` gives each persona its label, name, email and keys. A screen names who it opens as with `data-persona`, and `skeleton.js` draws the switch between them — in a design prototype's floating panel under "Signed in as", above that persona's name and email, and in a mockup section's `.head`.

`data-perm="<key> !<key>"` shows an element only to a persona holding every key listed and none marked `!`. An element carrying both `data-perm` and `data-when` is shown only when both allow it. A screen naming no persona, such as sign-in or an email, has no switch and holds no keys.

The persona is a panel switch like the others: `?persona=<persona>` opens a design prototype as that persona, the screen's own leaves the key out, a link to another design prototype carries it, and one `project.js` lacks opens the screen's own. A screen announces a change as a `persona` event, `personaOf(screen)` reads the persona in effect, and `setKeys(screen, keys)` sets the keys in effect apart from the persona's own.

mockup: a persona or key a draft needs and `project.js` lacks is an addition. It sits in the page's `<script data-additions>` and its additions list, and Confirm writes it into `project.js`.

**For a project already set up:** copy `project.js` and the new `skeleton.js` from `template/`, write the project's own personas into `project.js`, link it before `skeleton.js` on every page, and copy the contract comment in `skeleton.html`. Pages already drawn need no other edit.
