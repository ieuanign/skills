---
name: design-system
description: Sets up a project's design system as local HTML under docs/design-system/ — the reference page and the skeleton every mockup and design prototype is built from — and the index of design prototypes at docs/design/index.html. Use to draw three directions from a PRD, build from the chosen one, adopt a design system already in code or in a prototype folder, upgrade a skeleton behind the template, fold a project's existing pages into design prototypes, or check it against its checklist.
---

# design-system — set up a project's design system as local HTML

The design system is three things under `docs/design-system/`, plain files a person opens in a browser:

- **`reference.html`** shows every token and every component, in both themes.
- **The skeleton** is the six files every mockup and design prototype is built from, and links:
  - `tokens.css` — the tokens for a light and a dark theme;
  - `skeleton.css` — a frame per surface, the components, a surface's own under its frame, and the layouts the project's pages share;
  - `project.js` — what the project defines once and every page reads;
  - `skeleton.js` — the template's hooks, which no project edits;
  - `skeleton.html` and `prototype.html` — the pages a mockup and a design prototype are built from.
- **`brand/`** holds what the client already has: a logo, colours, fonts, or a site to match as a URL in a text file. A person puts it there; you read it as it is.

Three words carry the rest:

- A **hook** is one behaviour a script gives the pages: what it listens for, what it reads, what it changes.
- A **design prototype** is a page under `docs/design/` whose `<body>` is the screen.
- A **prototype folder** is one the project keeps of its own: one page per screen, sharing a stylesheet and a script, at a path the person names.

## Your writes

Your writes are the reference page, the skeleton and `docs/design/index.html` — the index of the project's design prototypes, and the one page under `docs/design/` you write. Three branches write more:

- **Directions** — `directions.html`, beside the skeleton.
- **Upgrade** — the design prototypes under `docs/design/` it rewrites.
- **Fold** — the design prototypes it writes there, and the deletion of each old page it folded.

You leave every file uncommitted, for the person to review and commit. Variants inside the running app are `/mattpocock-skills:prototype`'s UI branch.

## The template

[`template/`](template/), at `<this-skill-dir>/template/`, holds the skeleton's six files and `reference.html` under the names they are written to, and `index.html`, written to `docs/design/index.html`; every page here starts from it.

**The leading comment of its `skeleton.html` is the markup contract** every mockup and design prototype follows: what each of the skeleton's files holds, and how a screen, its states, its frame, its shell, the footer, the panel and the index are marked up. The contract lives in that comment alone, so that `mockup` and anything reading a page take it from the one file. Read it before you write or check a page.

Each file is the template's, the project's, or one written from the template around the project's content — **the line** Build, Adopt, Upgrade and Check all take from here:

- **The template's**, carried verbatim: the contract comment of `skeleton.html`; in `skeleton.css`, the page, mockup and design prototype pieces; and `skeleton.js`, whole.
- **The project's**: the token names and values; in `skeleton.css`, the frames, the components and the layouts; the screens around the comment in `skeleton.html`; and `project.js`, whole — the sizes the size switch offers, the icon sprite, what the token file keys a theme on, the personas, the shells, the side the floating panel starts on and the project's own hooks, with the template's one shell and one hook examples to replace.
- **Written from the template, with the project's content inside**: `prototype.html`, `reference.html` and `index.html`.

Every page links the token file, `skeleton.css`, `project.js` and `skeleton.js` by relative path, as it does `brand/` assets, and loads nothing from the network but fonts.

## One source for the tokens

Where the app has its own token file, that file is the source. If a browser loads it as it stands — plain CSS custom properties for both themes, with no preprocessor or framework at-rules — every page links it in place of `tokens.css`, which is not written, and `project.js` sets whatever that file keys its dark theme on. Otherwise `tokens.css` mirrors it, name for name and value for value. With no token file in the app yet, `tokens.css` is the source, and the app's file follows it through a test the project writes.

## Pick the branch

- **Check** — you were asked to check the design system. Go to [Check](#check).
- **Fold** (`branches/fold.md`) — a person asked for pages to be folded in: a prototype folder's pages, or pages under `docs/design/` that are not design prototypes, such as one page per PRD. It needs `docs/design-system/prototype.html` and `docs/design/index.html`: where the first is missing, write nothing and return a refusal naming Adopt, Build or Upgrade, and where only the index is, one naming Upgrade.
- **Adopt** (`branches/adopt.md`) — the project already has a design system in code, such as a token file and a component kit, or in a prototype folder, and `docs/design-system/skeleton.html` does not exist.
- **Upgrade** (`branches/upgrade.md`) — `docs/design-system/skeleton.html` exists and any of the [checklist](#checklist)'s three template lines fails.
- **Build** (`branches/build.md`) — a direction has been chosen from `docs/design-system/directions.html`.
- **Directions** (`branches/directions.md`) — anything else.

Done when one branch is chosen and, for Directions and Build, the PRD's number is known.

Then read the branch's file, under `<this-skill-dir>/`, before performing it: the freshly read file, with [`writing.md`](writing.md) beside this one where it names it, is that branch's whole procedure.

## Check

**Read** the template, `reference.html`, the skeleton's files and `docs/design/index.html`, then **report** every line of the [checklist](#checklist) as pass or fail, each fail naming the token, component, pair, page or file that fails it and, for a template line, what differs. Done when every line carries a verdict. The result is the return; the files are left as they were, so any caller can run Check with no side effects.

## Contrast

The contrast of two colours is `(L1 + 0.05) / (L2 + 0.05)`, where `L1` is the lighter colour's relative luminance and `L2` the darker's. A colour's relative luminance is `0.2126 R + 0.7152 G + 0.0722 B`, where each channel `c` is its 0–255 value divided by 255, then `c / 12.92` when `c ≤ 0.04045` and `((c + 0.055) / 1.055) ^ 2.4` otherwise. Compute it from the token values in each theme.

## Checklist

Build, Adopt and Upgrade end on this list, and Check reports on it.

- Every token and component has an example on the reference page.
- Every surface whose kit the components comment names has its components on the reference page, drawn inside its frame.
- Every layout has an example on the reference page, its regions labelled.
- The light and dark themes hold the same keys.
- All text reaches 4.5:1 against the backgrounds it is used on, in both themes, by [Contrast](#contrast).
- Every page links the one token file, `skeleton.css`, `project.js` and `skeleton.js`, and carries no copy of what they hold.
- Where `tokens.css` mirrors the app's token file, the two hold the same names and values.

The three **template lines**, each read against `<this-skill-dir>/template/` by the line [The template](#the-template) draws:

- The contract comment of `skeleton.html` is the template's, character for character.
- `skeleton.js` differs in nothing from the template's, and the project's sizes, sprite, theme key and hooks are in `project.js`.
- Every file the template holds is there; the app's token file linked in place of `tokens.css` is not a missing one.
