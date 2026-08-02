#!/usr/bin/env bash
set -euo pipefail

# Dev-only helper for maintainers of this repo — not a supported installer.
# Links this repo's components into its OWN project-scope directories, so local
# edits are live while working in this repo and nowhere else:
#   - .claude/skills  — project skills ("this project only")
#   - .claude/agents  — the dev-loop roster
# Deliberately project-scope, not ~/.claude: dogfooding an in-progress skill
# should not put it in front of every other project on the machine.
# Both destinations are gitignored, and every entry is a RELATIVE symlink into
# this repo, so the links survive moving or re-cloning the checkout.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_DEST="$REPO/.claude/skills"
AGENT_DEST="$REPO/.claude/agents"

# Writing through a symlinked destination would scatter links somewhere we did
# not intend — most damagingly back into the repo's own source trees.
guard_dest() {
  local dest="$1"
  if [ -L "$dest" ]; then
    echo "error: $dest is a symlink ($(readlink "$dest"))." >&2
    echo "Remove it (rm \"$dest\") and re-run; the script will recreate it as a real dir." >&2
    exit 1
  fi
}

# Replace whatever is at the target with a relative symlink to src.
# $1 source path (absolute, inside the repo), $2 destination directory.
# Both destinations sit two levels down (.claude/<kind>), so every link climbs
# back to the repo root the same way.
link_entry() {
  local src="$1" dest="$2"
  local target="$dest/$(basename "$src")"
  local rel="../../${src#"$REPO"/}"

  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi

  ln -sfn "$rel" "$target"
  echo "linked ${target#"$REPO"/} -> $rel"
}

# --- skills: one symlink per SKILL.md folder ---------------------------------
guard_dest "$SKILL_DEST"
mkdir -p "$SKILL_DEST"
while IFS= read -r -d '' skill_md; do
  link_entry "$(dirname "$skill_md")" "$SKILL_DEST"
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' -not -path '*/deprecated/*' -print0)

# --- agents: one symlink per roster definition -------------------------------
# The roster lives at the plugin root, not under skills/, so the skill walk
# above never sees it.
guard_dest "$AGENT_DEST"
mkdir -p "$AGENT_DEST"
while IFS= read -r -d '' agent_md; do
  link_entry "$agent_md" "$AGENT_DEST"
done < <(find "$REPO/agents" -maxdepth 1 -name '*.md' -print0)
