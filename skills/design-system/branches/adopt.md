# Adopt

Read `<this-skill-dir>/writing.md` with this file: it says what each file holds, and the steps here say where that comes from. The design system is in the project's code, in a prototype folder, or in both, and steps 1 and 2 take each in turn.

1. **Review.**
   - **The code.** Read the token file; each surface's kit — the web kit, the mobile app's, the email templates, the PDF templates; the app's pages, for the arrangements two or more share; who the code tells apart, with the keys it checks for each; and the shell its signed-in screens share: its navigation items, their routes, and what it shows of the person signed in.
   - **A prototype folder**, read beside the code: every page in it, the stylesheet and the script they share, and each page's own `<style>`; who the script tells apart, as personas with their keys; and the frame its signed-in pages share, the shell, whether the script draws it or the pages repeat it in their markup. Sort the script hook by hook. Each hook is one the skeleton has, noted with the skeleton's attribute for it as the contract comment names it, or one the skeleton lacks, which becomes a project hook. None is dropped: a hook that is the same as one of the skeleton's is noted as that one.
   - **What is missing**, listed: a token without a value in one theme; a component without a state the app renders; text below 4.5:1 against a background it is used on; a value, in code that cannot read the token file, that equals no token; a token or component of the prototype folder that differs from the app's token file or kit.

   Done when every token, every component in each kit and every page has been read, every hook of a prototype folder's script is sorted, and each gap is listed.
2. **Skeleton, reference page and index**, as `writing.md` holds them.
   - **From the code**, as it is: its token names and values; its component names; each surface's components under its frame, each value the token it equals; its layouts, named as the code names them; its personas and their keys; its shell, written into `project.js` item for item and route for route; its gaps, left as they are.
   - **From a prototype folder:**
     - The components and layouts of its shared stylesheet go into `skeleton.css` under the frame of each surface they draw, named as they are, or as that surface's kit names them where the code has one. The rules of a page's own `<style>` join them, a design prototype carrying none.
     - Each project hook goes into `PROJECT.hooks` in `project.js`, listed in its header and written as the contract comment's hook rule has it, drawing from what the screen shows, rather than with the script's listeners carried over.
     - The personas go into `PROJECT.personas` and the shell into `PROJECT.shells`, item for item and route for route. Nothing of the folder goes into `skeleton.js`.
     - The tokens follow One source for the tokens: where the app has no token file, the custom properties of the folder's stylesheet become `tokens.css`, name for name and value for value.
     - The folder's pages are left where they are: no file under the folder is written, no page is rewritten, moved or copied under `docs/design/`, and the index gets no row for one.

   Done as `writing.md` says, with every project hook, persona and shell of a prototype folder in `project.js` and the folder as it was.
3. **Checklist.** Run every line of `SKILL.md`'s checklist. Fix a fail in the files you wrote; a fail that comes from the code stays, and goes in the return. Done when every line has a verdict.
4. **Return** the files written, every hook of a prototype folder's script with where it went — the skeleton's attribute for it, or its name in `project.js` — the list of what is missing, and the checklist result.
