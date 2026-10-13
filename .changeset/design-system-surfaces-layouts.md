---
"ieuanign-skills": minor
---

design-system: the skeleton holds each surface's own components and the layouts pages share, where it held one kit, the web's, and no layout.

- `skeleton.css` heads its components with a kits comment: one entry per surface, in the contract's names, each the kit's repo path or `none yet`.
- A surface's own components sit under its frame, after the web's, which stay bare. The template ships the email's button, `.frame-email .button`: a link drawn as a button, with the email's padding and radius.
- A layouts part follows the components, each layout a class. `.page` and `.page.narrow` move there unchanged, joined by a page header with its actions (`.page-header`, `.page-actions`) and a list under its toolbar (`.list`, `.list-toolbar`).
- `reference.html` has a section per surface the skeleton frames — Web, Phone, Email, PDF, Notification — each drawing the surface's frame with its components inside, in place of one Components section and a Frames section. A Layouts section draws each layout with its regions labelled.

Adopt reads each surface's kit — the web kit, the mobile app's, the email templates, the PDF templates — and the app's pages for the arrangements two or more share, and lists as a gap a value, in code that cannot read the token file, that equals no token. Build takes each surface's components and the layouts from the chosen direction.

The skill's checklist fails a surface whose kit is named with no components drawn inside its frame on the reference page, and a layout with no example there.

**For a project already set up:** the contract comment in `skeleton.html` changed, so `/design-system` picks Upgrade. Each surface's components, the kit paths and the layouts are read from the code as Adopt steps 1 and 2 read them. Pages already drawn need no edit.
