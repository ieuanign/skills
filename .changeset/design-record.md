---
"ieuanign-skills": minor
---

design-system: a design prototype keeps its design record. The contract gains four optional lists, in a mockup's footer and in a design prototype's panel: `conflicts`, every conflict still open, with both sides and their paths; `settled`, every conflict ruled on, with the date and the ruling; `todo`, the code a ruling leaves to change and the issue filed for it; and `choices`, what the page chose that no requirement did.

`skeleton.js` draws every `data-list` the panel holds — these four, the placeholders and any list a project adds alike — after Behaviour and in the page's order, as a section headed by the list's name and its count, as "Settled (1)". The heading is the list's `aria-label` where it carries one, else its name with each hyphen a space and its first letter a capital. A list that is empty or absent draws nothing. The collapsed panel shows a badge counting the open conflicts, and none when there are none. `prototype.html` shows a `settled` and a `choices` line on the sign-in example.

mockup: a conflict is recorded where it is found, on its screen's `conflicts` list. With a person in the session it is grilled to a ruling as before; with nobody to ask, its screen is drawn as the design prototypes have it and the conflict stays open on the draft, where Build used to write nothing. A ruling moves the item to `settled`; the issue filed for the code side is named in a `todo` line, and a design-fix pull request carries the ruling on each design prototype it changes. A copy of an existing screen keeps its panel's lists, less each `todo` whose issue is closed. Revise moves a named option into `choices`. Confirm refuses while a conflict is open and carries each screen's lists into its panel. The checklist fails a `todo` that names no issue or a closed one, and an open conflict on a design prototype.

**For a project already set up:** copy the new `skeleton.js` and the contract comment in `skeleton.html` from `template/`, and copy the `.panel-toggle .badge` rule from the page pieces of `template/skeleton.css` into the project's own. Pages already drawn need no other edit: their placeholders are now headed with their count.
