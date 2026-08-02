#!/usr/bin/env bash
set -euo pipefail

# Dev-only helper for maintainers of this repo — not a supported installer.
# Links this repo's components into the local directories each agent harness
# reads, so local edits are picked up without reinstalling:
#   - ~/.claude/skills  — Claude Code
#   - ~/.agents/skills  — Codex and other Agent Skills-compatible harnesses
#   - ~/.claude/agents  — the dev-loop roster. Claude Code only: these carry
#     Claude Code agent frontmatter (model, effort, tools) and mean nothing to
#     the Agent Skills harnesses.
# Each entry is a symlink into this repo, so a `git pull` keeps them current.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_DESTS=("$HOME/.claude/skills" "$HOME/.agents/skills")
AGENT_DESTS=("$HOME/.claude/agents")

# If a destination is a symlink that resolves into this repo, we'd end up
# writing the per-entry symlinks back into the repo's own tree. Detect and bail
# out instead of polluting the working copy.
guard_dest() {
  local dest="$1" resolved
  if [ -L "$dest" ]; then
    resolved="$(readlink -f "$dest")"
    case "$resolved" in
      "$REPO"|"$REPO"/*)
        echo "error: $dest is a symlink into this repo ($resolved)." >&2
        echo "Remove it (rm \"$dest\") and re-run; the script will recreate it as a real dir." >&2
        exit 1
        ;;
    esac
  fi
}

# Replace whatever is at the target with a symlink to src.
link_entry() {
  local src="$1" target="$2" dest="$3"

  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi

  ln -sfn "$src" "$target"
  echo "linked $(basename "$target") -> $src ($dest)"
}

# --- skills: one symlink per SKILL.md folder ---------------------------------
skill_srcs=()
while IFS= read -r -d '' skill_md; do
  skill_srcs+=("$(dirname "$skill_md")")
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' -not -path '*/deprecated/*' -print0)

for DEST in "${SKILL_DESTS[@]}"; do
  guard_dest "$DEST"
  mkdir -p "$DEST"
  for src in "${skill_srcs[@]}"; do
    link_entry "$src" "$DEST/$(basename "$src")" "$DEST"
  done
done

# --- agents: one symlink per roster definition -------------------------------
# The roster lives at the plugin root, not under skills/, so the skill walk
# above never sees it. Without this the roster is only dogfoodable by hand-
# copying it into a repo's .claude/agents/ — which is what the plugin move
# deliberately stopped doing.
agent_srcs=()
while IFS= read -r -d '' agent_md; do
  agent_srcs+=("$agent_md")
done < <(find "$REPO/agents" -maxdepth 1 -name '*.md' -print0)

for DEST in "${AGENT_DESTS[@]}"; do
  guard_dest "$DEST"
  mkdir -p "$DEST"
  for src in "${agent_srcs[@]}"; do
    link_entry "$src" "$DEST/$(basename "$src")" "$DEST"
  done
done
