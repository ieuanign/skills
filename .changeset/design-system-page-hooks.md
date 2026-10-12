---
"ieuanign-skills": minor
---

design-system: `skeleton.js` gains the interactions most screens need, each one attribute documented in the contract comment in `skeleton.html`.

- `data-go` and `data-then` may name a page in place of a state: a link to another screen's design prototype, as `data-go="home.html"` or `data-then="../web/orders.html?state=empty"`. A value with `.html` in it, alone or before a `?` or a `#`, is a page; any other is a state. The page opens as a followed `<a href>` does, carrying the same switches.
- `data-go` on a checkbox: ticked, the screen moves to that state; cleared, it returns to the state it left.
- `data-value-when` and `data-checked-when` take the list `data-disabled-when` does: a field shows its `value` attribute, and a box is ticked, in the states listed, and is empty or clear in every other.
- `data-countdown="<seconds>"` with `data-wait="Resend code in {t}"` on a button: disabled when the page opens, it shows `data-wait` with the time left, then its own text at 0, and a click starts it again.
- `data-filter-scope` around a list: inside it `<button data-filter="<key>=<value>">` shows only the `data-row` elements carrying `data-<key>="<value>"`. One filter holds at a time, a second click clears it, and a state change clears them all. `<span data-count>` in a filter button holds the rows it would show, and `data-hide-empty` hides the button at 0.
- `data-rowlink` on a row or a card holding an `<a href>`: a click anywhere in it but on a control follows its first link.

`reference.html` works each one live, in a screen of its own under "A page's own pieces".

mockup: the checklist lets a `data-go` or a `data-then` name a page that exists, as well as a state.

**For a project already set up:** copy the new `skeleton.js` and the "State" section of the contract comment in `skeleton.html` from `template/`, and copy the `[data-rowlink]` rule from the page pieces of `template/skeleton.css` into the project's own. Pages already drawn need no edit.
