# Fold

Fold rewrites the pages it was asked for into design prototypes, one per screen, and commits nothing.

- **One batch.** It takes the folder or the list a person named, and the index's list of pages not folded yet is the record of what remains; nothing else carries it.
- **Deleting an old page is its one step that can lose a person's work.** It deletes a page only once the design prototype written from it passes `mockup`'s Check, and deletes nothing else — not a prototype folder's stylesheet or script, not `brand/`. The person's review of the uncommitted files is the guard on it.
- **It rewrites no token, and rules on no conflict**: a ruling is `mockup`'s Build or Revise, with a person.

1. **Sort.** Take the pages asked for: a folder, or a list.
   - **A prototype folder**: read its shared stylesheet and script, so that each hook of the script is known as the skeleton's attribute for it or the project hook in `project.js` it became.
   - **Each page**: its screens — one, or several `data-screen` sections — with their states, controls, links and notes; the requirement ids its own attributes and notes name, and no other; its own `<style>` and `<script>`.
   - **Each screen**: its app's folder, placed as `mockup`'s Build places a new screen, in its Inventory step, and whether a design prototype already draws it.

   Done when every page is sorted: folded whole, split into its screens, or left because its screen has a design prototype.
2. **Write.** Each screen becomes `docs/design/<folder>/<screen>.html`, built from `docs/design-system/prototype.html` to the contract comment:
   - **It keeps** every state, the page's first as the default, every control and every link.
   - **Hooks.** A hook the skeleton has is written as the skeleton's attribute, and what is the page's alone stays in its own `<script>`.
   - **Requirement ids.** `data-req` holds the ids found, and is empty where there were none: an id is found, never made up.
   - **A value the comment requires that the page lacks** is taken from the page's own name or path.
   - **Notes** go to the panel: its behaviour, its placeholders, and its `sources`, `settled` and `todo` lines where it kept any.
   - **Styles.** A rule of the page's own `<style>` moves into `skeleton.css` with an example on `reference.html`, as `mockup`'s Confirm moves an addition, in its Transform step.
   - **Links.** A link to a page folded in this batch or an earlier one points at its design prototype; one to a page not folded yet points where it still is.
   - **A screen that already has a design prototype** is never written over: the differences are a `conflicts` item on that design prototype, as the contract marks it up, naming both sides and their paths, and the old page is left as it was.

   Done when every screen sorted for folding has its page and every one left has its conflict recorded.
3. **Index.** Each design prototype written gets its row as `mockup`'s Confirm adds one, in its Transform step: under its folder's section, a new folder opening a section. The list of pages not folded yet, as the contract's Index block marks it up, holds each page asked for and left, and each page of the named folder not asked for, linking it where it still is; the line of a page folded now goes, and the list goes when it is empty. Done when every design prototype written has a row and every page known to be not folded yet is on the list.
4. **Check and delete.** Run `mockup`'s Check on each design prototype written, for the PRDs its `data-req` ids name, and for none where it is empty. Fix a fail in what Fold wrote.
   - **Every line passes**: point every link to the old page, in every design prototype, at the new one, then delete the old page — a page split into its screens once each of them passes.
   - **A fail Fold cannot fix**: the old page stays as it was, on the list, and its design prototype and its row are taken back out, so nothing is left half done.

   Done when every page asked for is folded and deleted, or left with its reason.
5. **Return** each design prototype written with the old page it replaced, each page split and into what, each page left and why — the failing line, or the conflict — each conflict recorded and on which page, each value taken from a name or path, what moved into `skeleton.css` and `project.js`, a prototype folder left holding no page, what remains on the list, and that every file, the deletions among them, waits uncommitted on the person's review.
