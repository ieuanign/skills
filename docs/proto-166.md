# Prototype fixture — /pr-comments unattended run

A throwaway file. It exists so that an unattended `/pr-comments auto` run has a real pull request
with real unresolved comments to work against, and it is deleted with the pull request it belongs to.

## What it is for

- It is a target, not a document anyone should read for its content.
- No stage of `scripts/check.sh` reads this file. The suite has no Markdown stage at all, so nothing
  here can turn it red.
- It lives under `docs/` because that is where a Markdown file goes in this repo.

## What it is not

It is not a decision record and it is not part of the plugin manifest. Nothing under
`.claude-plugin/` names it, and no skill loads it at run time.

## Removing it

Close the pull request, delete the branch, and the file goes with it. Nothing else in the repository
refers to it, so there is nothing else to unpick.
