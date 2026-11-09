# write

Write the Architecture, or a Spec's marked changes and its issue, from an answered question set. Every file is left uncommitted.

1. **Read the set.** `# Architecture questions` or `# Spec questions` names its kind; its header, its questions and its `## Draft` are the whole input. An empty answer box keeps the recommendation. Done when every question has its answer or its kept recommendation.
2. **Find the knock-outs.** A question is knocked out when its box is empty and a question its `Rests on:` names was answered with something other than its recommendation. Where any is, write nothing and return a follow-up set, in the set's own shape, holding:
   - the same header;
   - only the knocked-out questions, each with a fresh recommendation resting on the answers given, an empty box, and an `Asked again:` line naming the answer that knocked it out;
   - `## Settled`, every other question with its answer, verbatim;
   - the `## Draft`, as it came.

   Done when no question is knocked out, or the follow-up set is returned.
3. **Apply the answers** to the draft, each at its `Applies to:`. A `why` answer is that part's why in the prose. Done when every draft line a question decides holds its answer or its kept recommendation.
4. **Decision records.** Each choice passing the three-part test in `SKILL.md`'s Decision records rule gets a record, at the location the set's header names, numbered after the highest there, its link added to the prose and to the index's Decision records. Done when every such choice has its record and both links, or the header says none are kept.
5. **The Spec issue**, for a Spec set only; an Architecture set goes to step 7.
   - A `Spec:` URL in the header is the issue, edited in place. Else: `gh label list`, and `gh label create spec` only when `spec` is missing; then create the issue with a placeholder body, so its link exists before any marker:

     ```bash
     gh issue create --title "Spec: <PRD name>" --label spec --body-file - <<'EOF'
     Spec in progress.
     EOF
     ```

   - Link it under the PRD with its `id` — `gh api repos/{owner}/{repo}/issues/<Spec> --jq .id` — not its number: `gh api repos/{owner}/{repo}/issues/<PRD>/sub_issues -F sub_issue_id=<id>`. A link already there stands. Where the link fails, the body's `PRD:` line carries the relationship and the return says so.

   Done when the Spec's URL is known and the sub-issue link is made or its failure noted.
6. **Fill the Spec link.** Replace every `<Spec link>` in the draft with the Spec's URL. Done when none is left.
7. **Write the files**: each draft file to its path under `docs/architecture/`, creating the folder when absent. Done when every draft file is on disk.
8. **The pointer.** Where `docs/agents/domain.md` already names `docs/architecture/`, leave it as it is. Where it exists without that, append the pointer line from `SKILL.md`'s Rules as its own paragraph. Where it is absent, create it holding the line. Done when the file names `docs/architecture/`.
9. **Publish the Spec body**, for a Spec set only. Take the draft's body and fill **Assumptions** with each question whose box was empty and whose recommendation no decision record or Architecture line states. Each `left for the spec` answer goes in the body where it lands — a gist under Changes, an Assumption, or a Left out line — ending `— answers "<the PRD's line>"`. Then:

   ```bash
   gh issue edit <Spec> --body-file - <<'EOF'
   <the body>
   EOF
   ```

   Done when the issue's body holds every section of `template/spec.md`, in order.
10. **Checklist.** Run `check` on the result, for a Spec with the Spec given, by `<this-skill-dir>/branches/check.md`. Fix each fail in the files you wrote; a fail that comes from the code stays, and goes in the return. Done when every line has a verdict.
11. **Return** the files written, uncommitted; the Spec's URL and whether its sub-issue link holds or the `PRD:` line carries it; and the checklist result. For a Spec, the caller commits the files, opens a pull request naming the Spec, and runs `/to-tickets` on the Spec.
