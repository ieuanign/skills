---
"ieuanign-skills": minor
---

design-system: Adopt reads a prototype folder the project keeps — one page per screen, sharing a stylesheet and a script, at a path the person names — where it read a design system from code alone.

- Adopt is picked for a prototype folder as it is for a token file and a component kit, while `docs/design-system/skeleton.html` does not exist. Upgrade still does not read one.
- Review reads every page in the folder, the stylesheet and the script they share, and each page's own `<style>`, beside the code. A token or component of the folder that differs from the app's token file or kit is listed as missing.
- The shared script is sorted hook by hook, a hook being one behaviour the script gives the pages. Each is one the skeleton has, noted with the skeleton's attribute for it as the contract comment names it, or one the skeleton lacks, which becomes a project hook. None is dropped.
- The shared stylesheet's components and layouts go into `skeleton.css` under the frame of each surface they draw, and the rules of a page's own `<style>` join them.
- Each project hook goes into `PROJECT.hooks` in `project.js`, written as the contract comment's hook rule has it. The personas go into `PROJECT.personas` and the shell into `PROJECT.shells`, item for item and route for route. Nothing of the folder goes into `skeleton.js`.
- The tokens follow One source for the tokens: the app's token file where it has one, otherwise the custom properties of the folder's stylesheet, name for name and value for value.
- The folder's pages are left where they are: none is rewritten, moved or copied under `docs/design/`, and the index gets no row for one.

Adopt's return lists every hook of the script with where it went — the skeleton's attribute for it, or its name in `project.js` — beside the files written, the list of what is missing and the checklist result.
