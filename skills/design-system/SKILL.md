---
name: design-system
description: Sets up a project's design system as local HTML under docs/design-system/ — a reference page, the skeleton every mockup and design prototype is built from, and the client's brand/ — and the index of design prototypes at docs/design/index.html. Use to draw three directions from a PRD, to build the design system from a chosen direction, to adopt a design system already in code, to upgrade one whose skeleton is behind the template, or to check one against its checklist.
---

# design-system — set up a project's design system as local HTML

The design system is three things under `docs/design-system/`, plain files a person opens in a browser:

- **`reference.html`** shows every token and every component, in both themes.
- **The skeleton** is what every mockup and design prototype is built from, and links: `tokens.css`, the tokens for a light and a dark theme; `skeleton.css`, a frame per surface and the components, named as the project's component kit names them; `project.js`, the personas a screen can be seen as, the shells its signed-in screens share, the sizes the size switch offers, the icon sprite, what the token file keys a theme on and the project's own hooks; `skeleton.js`, the template's hooks, which no project edits — the state, persona, size and theme switches, the drawing of a shell around a screen, the page behind a screen that opens over another and a design prototype's floating panel; and the two pages built on them, `skeleton.html` for a mockup and `prototype.html` for a design prototype.
- **`brand/`** holds what the client already has: a logo, colours, fonts, or a site to match as a URL in a text file. A person puts it there; you read it as it is.

Your writes are those files, `docs/design/index.html` — the index of the project's design prototypes, and the one page under `docs/design/` you write — in Upgrade, the design prototypes under `docs/design/` it rewrites, and, in Directions, `directions.html` beside the skeleton. Variants inside the running app are `/mattpocock-skills:prototype`'s UI branch. You leave every file uncommitted, for the person to review and commit.

## The template

[`template/`](template/), at `<this-skill-dir>/template/`, holds the skeleton's six files and `reference.html` under the names they are written to, and `index.html`, written to `docs/design/index.html`; every page here starts from it. The leading comment of its `skeleton.html` is the **markup contract** every mockup and design prototype follows: how a screen, its states, its frame, its shell, the footer, the panel and the index are marked up. The contract lives in that comment alone, so that `mockup` and anything reading a page take it from the one file. 
Each file is the template's, the project's, or one written from the template around the project's content. Build, Adopt, Upgrade and Check all take the line from here:

- **The template's**, carried verbatim: the contract comment of `skeleton.html`; in `skeleton.css`, the page, mockup and design prototype pieces; and `skeleton.js`, whole, which is copied unchanged.
- **The project's**: the token names and values; in `skeleton.css`, the frames and the components; the screens around the comment in `skeleton.html`; and `project.js` whole — the sizes the size switch offers, the icon sprite, what the token file keys a theme on, the personas, the shells with their items, routes, switches and markup, the side the floating panel starts on and the project's own hooks, with the template's one shell and one hook examples to replace.
- **Written from the template, with the project's content inside**: `prototype.html`, `reference.html` and `index.html`.

Every page links the token file, `skeleton.css`, `project.js` and `skeleton.js` by relative path, as it does `brand/` assets, and loads nothing from the network but fonts.

## One source for the tokens

Where the app has its own token file, that file is the source. If a browser loads it as it stands — plain CSS custom properties for both themes, with no preprocessor or framework at-rules — every page links it in place of `tokens.css`, which is not written, and `project.js` sets whatever that file keys its dark theme on. Otherwise `tokens.css` mirrors it, name for name and value for value. With no token file in the app yet, `tokens.css` is the source, and the app's file follows it through a test the project writes.

## Pick the branch

- **Check** — you were asked to check the design system. Go to [Check](#check).
- **Adopt** — the project already has a design system in code, such as a token file and a component kit, and `docs/design-system/skeleton.html` does not exist. Go to [Adopt](#adopt).
- **Upgrade** — `docs/design-system/skeleton.html` exists and any of the [checklist](#checklist)'s three template lines fails. Go to [Upgrade](#upgrade).
- **Build** — a direction has been chosen from `docs/design-system/directions.html`. Go to [Build](#build).
- **Directions** — anything else. Go to [Directions](#directions).

Done when one branch is chosen and, for Directions and Build, the PRD's number is known.

## Directions

1. **Read.** The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Fetch the PRD as that doc fetches the relevant ticket, and the epic its `Epic:` line names. Read every file in `docs/design-system/brand/`. Done when the PRD's requirements marked `Visible: yes`, the epic and the brand are in hand.
2. **Pick the screens.** Choose the PRD's screens that best show a direction: the main one, and one with a form or list. Done when two or three real screens are named, each with the requirement ids it covers.
3. **Draw three directions.** Copy the template's `skeleton.css`, `project.js` and `skeleton.js` into `docs/design-system/`, and write `directions.html` beside them from its `skeleton.html`: one section whose `data-option` buttons switch between the directions, each option panel setting its own token values for both themes in the page's own `<style>` and showing the screens from step 2 with the PRD's real copy. The directions differ in **structure** — layout, navigation, density, type scale — as well as colour. With a brand, each direction keeps its logo, colours and fonts; with an empty `brand/`, the directions are free. Done when each direction holds every screen from step 2 in both themes and passes the contrast line of the [checklist](#checklist).
4. **Return** the page's path, one line per direction saying what sets it apart, and the questions for the caller to put to a person: which direction to take, and what to change.

## Build

1. **Inputs.** Take the chosen direction from `directions.html` and the changes the person asked for, and fetch the PRD as Directions step 1 does. Done when the direction's tokens, frames and components are known, with each change applied, and the PRD's user stories are in hand.
2. **Skeleton.** Write the skeleton's six files from the template: the tokens by [One source for the tokens](#one-source-for-the-tokens), the frames and components from step 1 in `skeleton.css`, the personas in `project.js` from the PRD's user stories — one for each `###` heading that says who the stories are for, with the keys its stories grant that another's do not — a shell there for each frame the direction's signed-in screens share, its navigation items and their routes from the direction, its styles among the components in `skeleton.css`, and `skeleton.html` and `prototype.html` with their example screens drawn in those components and the contract comment verbatim. Name each component as the project's component kit names it, or by the direction where there is no kit, and name the kit's path in the components comment of `skeleton.css`. Done when every token and component the direction uses, every persona the PRD names and every shell the direction draws is in the files.
3. **Reference page and index.** Write `docs/design-system/reference.html` from the template: a `data-token` row for every colour token, a `data-pair` row for every text and background pair the components use, an example of each size and space, every component in each of its variants, and each shell in a `data-screen` block that names it by `data-shell` at a `data-route` marking one of its items current, so the page draws it from `project.js` and holds no copy. Write `docs/design/index.html` from the template, linking the skeleton's files as `../design-system/…`: a section for each folder under `docs/design/` and, in it, a row for each design prototype found there, by the contract's Index block — the row's name from the page's `<title>`, its route the page's `data-route`, and the section's "Start at" the screen a person reaches first, its sign-in where it has one, else its home. The template's section is an example of the shape and is never written as it is: a row whose page does not exist fails `mockup`'s Check, so a project with no design prototype yet gets an index with no section. An index already there keeps its rows and their order, a second view of a page among them: only a row for a page with none is added, and a row whose page is gone removed. Done when every token, component and shell in the skeleton has an example, and every design prototype under `docs/design/` has a row and no row names a page that is not there.
4. **Clear the directions.** Delete `directions.html`. Done when the folder holds the skeleton's files, `reference.html` and `brand/`.
5. **Checklist.** Run every line of the [checklist](#checklist) and fix each fail. Done when every line passes.
6. **Return** the files written and the checklist result.

## Adopt

1. **Review the code.** Read the token file and the component kit, who the code tells apart with the keys it checks for each, and the shell its signed-in screens share: its navigation items, their routes, and what it shows of the person signed in. List what is missing: a token without a value in one theme, a component without a state the app renders, text below 4.5:1 against a background it is used on. Done when every token and every component in the kit has been read and each gap is listed.
2. **Skeleton and reference page** as in Build steps 2 and 3, from the code as it is: its token names and values, its component names, its personas and their keys, its shell written into `project.js` item for item and route for route, its gaps left as they are. Done as in those steps.
3. **Checklist.** Run every line of the [checklist](#checklist). Fix a fail in the files you wrote; a fail that comes from the code stays, and goes in the return. Done when every line has a verdict.
4. **Return** the files written, the list of what is missing, and the checklist result.

## Upgrade

Upgrade rewrites in place: it deletes no file, leaves `brand/` untouched and commits nothing. Rewriting a project's pages is its one step that can lose a person's work, and their review of the uncommitted files is the guard on it.

1. **Compare.** Read the files under `docs/design-system/` against the template's, and put each difference under the one of the [checklist](#checklist)'s three template lines it fails, naming the file and what differs. Sort every page under `docs/design/`: the index; a design prototype, a page whose `<body>` is the screen; or another page. A prototype folder the project keeps elsewhere is not read. Done when every difference sits under one line and every page is sorted.
2. **Skeleton.** By the line [The template](#the-template) draws: keep what is the project's, replace what is the template's with the template's, and write each missing file from the template with the project's tokens and components in its example screens. The tokens follow [One source for the tokens](#one-source-for-the-tokens), their names and values as they were. Whatever of the project's sits in what is the template's moves to where the project's lives — personas, a shell or a hook the project added into `project.js`; its sizes, its sprite and what it keys the dark theme on into their places in the new `skeleton.js`. The furthest case is one `skeleton.html` with its styles and script inline: its tokens come from the app's token file as Adopt step 1 reads it, or with none in the app become `tokens.css`; its frames and components go into theirs in `skeleton.css`; its script is sorted the same way; and the page is left linking the files, with the template's comment and its own screens. Done when the three template lines pass and every token, frame and component the project had is in the files as it was.
3. **Pages**, where the contract comment differed. Write `reference.html` as Build step 3 does, from the project's tokens and components as they are. Rewrite each design prototype from `prototype.html` to the contract comment, keeping its screen, states, controls, links, requirement ids, behaviour and placeholders; a hook written in a form the comment no longer holds is rewritten in the one it does, and a value the comment requires that the page lacks is taken from the page's own name or path. Write the index as Build step 3 does, keeping each row a person added. Every other page is left as it is. Done when each rewritten design prototype passes `/mockup`'s Check, run for the PRD its `data-req` ids name.
4. **Checklist** as Adopt step 3: fix a fail in a file you wrote; a fail that comes from the code stays, and goes in the return. Done when every line has a verdict.
5. **Return** what differed under each of the three lines, each file written or rewritten, what moved and where to, the pages left as they were, each value taken from a name or path, the checklist result, and that the rewritten pages wait on the person's review.

## Check

**Read** the template, `reference.html`, the skeleton's files and `docs/design/index.html`, then **report** every line of the [checklist](#checklist) as pass or fail, each fail naming the token, component, pair, page or file that fails it and, for a template line, what differs. Done when every line carries a verdict. The result is the return; the files are left as they were, so any caller can run Check with no side effects.

## Contrast

The contrast of two colours is `(L1 + 0.05) / (L2 + 0.05)`, where `L1` is the lighter colour's relative luminance and `L2` the darker's. A colour's relative luminance is `0.2126 R + 0.7152 G + 0.0722 B`, where each channel `c` is its 0–255 value divided by 255, then `c / 12.92` when `c ≤ 0.04045` and `((c + 0.055) / 1.055) ^ 2.4` otherwise. Compute it from the token values in each theme.

## Checklist

The Build, Adopt and Upgrade branches end on this list, and the Check branch reports on it.

- Every token and component has an example on the reference page.
- The light and dark themes hold the same keys.
- All text reaches 4.5:1 against the backgrounds it is used on, in both themes.
- Every page links the one token file, `skeleton.css`, `project.js` and `skeleton.js`, and carries no copy of what they hold.
- `skeleton.js` is the template's, unchanged: it differs in nothing from the template's `skeleton.js`, and the project's sizes, sprite, theme key and hooks are in `project.js`.
- Where `tokens.css` mirrors the app's token file, the two hold the same names and values.

The three template lines, each read against `<this-skill-dir>/template/` by the line [The template](#the-template) draws:

- The contract comment of `skeleton.html` is the template's, character for character.
- What is the template's in `skeleton.js` is the template's, character for character.
- Every file the template holds is there; the app's token file linked in place of `tokens.css` is not a missing one.
