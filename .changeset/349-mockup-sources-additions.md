---
"ieuanign-skills": minor
---

mockup: a draft is drawn from the reference page, and everything it adds is listed, where a page's own `<style>` or an inline `style` could redraw anything without counting as an addition.

- Build reads `reference.html` and `skeleton.css` for each surface the screens use, then looks each pattern up by the screen's surface: that surface's design prototypes first, then its kit at the path the components comment names.
- Every screen carries a `sources` list in the design record: one line per pattern, naming the path where it is already built, from the repository root. Confirm carries it into the design prototype's panel with `settled`, `todo` and `choices`, and the panel draws it as its own section.
- `<style data-additions>` is the one way a draft adds. Every rule in it is on the footer's additions list, and an addition is new, never a restyle: a rule whose selector `skeleton.css` already defines is a conflict.
- A page has no inline `style` but a custom property carrying a value a component takes, and a design prototype has no `<style>` at all.
- The template's `prototype.html` follows it: its toast's rule moves into `skeleton.css` as `.toast`, and its panel carries a `sources` list.

The skill's checklist fails a class defined neither in `skeleton.css` nor in the page's `<style data-additions>`, a `sources` line naming a path that does not exist, an inline `style` that is no custom property, a `<style>` that is not `<style data-additions>`, a rule of `<style data-additions>` missing from the additions list or written on a selector `skeleton.css` defines, and any `<style>` on a design prototype.

**For a project already set up:** copy the contract comment from the template's `skeleton.html` into the project's. A design prototype with a `<style>` of its own moves its rules into `skeleton.css`, with an example on `reference.html`, and drops the block. A page gets its `sources` list the next time a PRD's Confirm writes it; no check fails a design prototype from before this change for carrying none.
