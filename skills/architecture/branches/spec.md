# spec

Draft one PRD's changes to the Architecture and return them with the Spec question set. Read-only.

1. **Read the PRD**: `gh issue view <PRD> --json number,title,body,url`. Done when its name (from `# PRD: <name>`, else the title), every requirement id, every "Left for the spec" line and every constraint are in hand.
2. **Find its Spec.** The one the caller names; else the PRD's sub-issue labelled `spec`, from `gh api repos/{owner}/{repo}/issues/<PRD>/sub_issues`. Read an existing Spec's body: the draft revises it. Done when the Spec is known, or known to be new.
3. **Read the Architecture and the code** the requirements touch: `docs/architecture/`, its decision records, `docs/delivery-policy.md` where there is one, and each part's home a requirement reaches. Done when every requirement is matched to the parts it touches, or to none.
4. **Draft the changes.** For each requirement, the lines it adds, changes or removes in the Architecture, under `SKILL.md`'s Rules. Each changed line and each changed diagram node or edge carries its marker, with the literal `<Spec link>` for the link; `write` fills it in. A removed line or element stays, in the removal's marker form. Done when every requirement is covered by a change or has "none needed" and why, and every changed line is marked.
5. **Draft the Spec body** from `<this-skill-dir>/template/spec.md`:
   - **Requirements**: each requirement id with the change that covers it, or "none needed" and why.
   - **Changes**: a gist per change, under its section, each saying that the pull request building it removes its marker.
   - **Deployment view**: `changed` when `deployment.md` has a change, listing the planned changes that need the new deployment; else `unchanged`.
   - **Test seams**: the seams the work is tested at — an existing seam wherever one serves; a new one only where none does, placed at the highest point it can sit; as few as possible, ideally one.
   - **Left out**: what the Spec leaves out, and why.

   **Assumptions** stays empty: `write` fills it from the answers. Done when every section but Assumptions is filled.
6. **Build the question set** in the shape below, one question per:
   - `left for the spec` — a "Left for the spec" line of the PRD, quoted;
   - `choice` — a choice the draft made that the Architecture and its decision records do not already force;
   - `deployment view` — always exactly one, on whether the deployment view changes, its recommendation the draft's.

   Done when every such line and choice is a question, each with its recommendation, `Rests on:` and `Applies to:`.
7. **Return** the question set. Done when it holds every question from step 6 and the whole draft.

## The Spec question set

`write` reads this document back with the answers filled in.

`````markdown
# Spec questions

PRD: <PRD issue URL>
PRD name: <name>
Spec: <the existing Spec's URL, or "new">
Decision records: <the location, or "none kept">

## 1. "Which store holds uploaded files?" — left for the spec

Found: the Architecture names one relational store and no object store
Recommendation: a new object store, owned by the API part — files stay out of the relational store's backups
Rests on: none
Applies to: data.md, Database; blueprint.md, Database; deployment.md, Database
Answer:
```text
```

## 2. Does the deployment view change? — deployment view

Found: the draft adds an object store to deployment.md
Recommendation: changed — the new store is a deployable in every environment
Rests on: 1
Applies to: Spec body, Deployment view
Answer:
```text
```

## Draft

### docs/architecture/data.md

````markdown
<the file, whole, with its markers>
````

<one `###` and fenced block per changed file>

### Spec body

````markdown
<the body, Assumptions empty>
````
`````
