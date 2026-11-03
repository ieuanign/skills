---
"ieuanign-skills": minor
---

setup-ieuanign-skills: the stacked pull requests reference says what to do with a pull request a rebase empties — close it unmerged with a comment naming the pull request its change now sits in, base the one above it on the one below, then `gh stack rebase` and `gh stack push` — and why merging it, leaving it open, closing it without re-basing the one above, or `gh stack modify` are not the answer. The rule file carries the instruction in one line.
