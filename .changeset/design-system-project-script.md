---
"ieuanign-skills": minor
---

design-system: everything a project owns in the skeleton's script is in `project.js`, and `skeleton.js` is the template's file, which no project edits.

`PROJECT` gains four keys beside `dock`, `personas` and `shells`, each documented in the contract comment in `skeleton.html`:

- `PROJECT.sizes`: the sizes the size switch offers each kind of screen, and the one each opens at.
- `PROJECT.sprite`: the icons' symbols.
- `PROJECT.theme`: a function that applies a theme name to an element, the one place that knows what the token file keys a theme on. The template's sets `data-theme`.
- `PROJECT.hooks`: the project's own hooks. Each is given the screen, and `skeleton.js` runs them for every screen after its own hooks and again when the screen's state, persona or keys change. Each is listed in `project.js`'s header.

`skeleton.js` reads each of these from `PROJECT` and holds no default for any: a page linking no project file has no size switch, no sprite and no hook, its theme switch applies nothing, and its states still run.

The template ships one hook as an example, a password field's strength marked beside the field, and `reference.html` shows it live with the other hooks under "A page's own pieces". `reference.html` reads its token values in both themes through `PROJECT.theme`.

The skill's checklist fails a `skeleton.js` that differs from the template's.

**For a project already set up:** move the sizes, the sprite, the theme key and any hook of its own from `skeleton.js` into `project.js`, then copy the new `skeleton.js` whole and the contract comment in `skeleton.html` from `template/`. Pages already drawn need no edit.
