#!/usr/bin/env bash
# infrastructure tool derived-files.sh, version 1
set -euo pipefail

# Exit 0 when <base>...<head> needs no check run: every changed file is derived, or <head> exactly
# reverts trunk commits. Exit 1 when it does, 2 on bad arguments or an unreadable policy.

POLICY="docs/delivery-policy.md"

usage() {
  echo "usage: derived-files.sh <base> <head>" >&2
  exit 2
}

[ "$#" -eq 2 ] || usage
base="$(git rev-parse --verify --quiet "$1^{commit}")" || usage
head="$(git rev-parse --verify --quiet "$2^{commit}")" || usage

# Hand-rolled over the policy's block-YAML front matter: yq is absent on maintainer machines, and
# node or python3 would need a dependency for a YAML parser. Prints `<dotted.path>[\t<value>]`.
flatten='
NR == 1 { if ($0 != "---") exit; next }
$0 == "---" { exit }
/^[ \t]*(#|$)/ { next }
{
  match($0, /^ */); indent = RLENGTH; body = substr($0, indent + 1)
  if (body ~ /^- /) { print path "[]\t" unquote(substr(body, 3)); next }
  key = body; sub(/:.*/, "", key)
  value = body; sub(/^[^:]*:[ ]*/, "", value)
  while (depth > 0 && indent <= indents[depth]) depth--
  indents[++depth] = indent; keys[depth] = key
  path = keys[1]; for (i = 2; i <= depth; i++) path = path "." keys[i]
  if (value != "") print path "\t" unquote(value)
}
function unquote(v) {
  if (v ~ /^"/) { sub(/^"/, "", v); sub(/".*$/, "", v); return v }
  if (v ~ /^'\''/) { sub(/^'\''/, "", v); sub(/'\''.*$/, "", v); return v }
  sub(/[ ]+#.*$/, "", v); sub(/[ ]+$/, "", v); return v
}'

# Read from the base, so a pull request cannot widen its own exemption.
policy="$(git show "$base:$POLICY" 2>/dev/null | awk "$flatten")" || true
if ! grep -q '^schema_version	' <<<"$policy"; then
  echo "derived-files: no readable policy front matter at $1:$POLICY" >&2
  exit 2
fi
globs="$(sed -n 's/^branching\.derived_files\.value\[\]	//p' <<<"$policy")"

# -z and quotePath off: git otherwise C-quotes a non-ASCII path, and no glob matches the quotes.
# A failed diff leaves the list empty, which fails closed.
changed=()
while IFS= read -r -d '' file; do
  changed+=("$file")
done < <(git -c core.quotePath=false diff --name-only -z --no-renames "$base...$head")

derived_only() {
  [ "${#changed[@]}" -gt 0 ] || return 1
  local file glob matched
  for file in "${changed[@]}"; do
    matched=0
    while IFS= read -r glob; do
      [ -n "$glob" ] || continue
      # Unquoted on purpose: the policy value is the pattern, and `*` here also crosses `/`.
      if [[ $file == $glob ]]; then
        matched=1
        break
      fi
    done <<<"$globs"
    [ "$matched" -eq 1 ] || return 1
  done
}

exact_revert() {
  local named oldest="" sha
  named="$(git log --format=%B "$base..$head" | sed -n 's/.*This reverts commit \([0-9a-f]\{7,40\}\).*/\1/p')"
  [ -n "$named" ] || return 1
  named="$(while IFS= read -r sha; do git rev-parse --verify --quiet "$sha^{commit}" || true; done <<<"$named")"
  [ -n "$named" ] || return 1
  oldest="$(git rev-list --reverse --topo-order "$head" | grep -Fx -f <(printf '%s\n' "$named") | head -n 1)" || true
  [ -n "$oldest" ] || return 1
  git merge-base --is-ancestor "$oldest" "$base" || return 1
  [ "$(git rev-parse --verify --quiet "$oldest^1^{tree}")" = "$(git rev-parse "$head^{tree}")" ]
}

if derived_only; then
  echo "derived-files: pass — every changed file is derived"
  exit 0
fi
if exact_revert; then
  echo "derived-files: pass — an exact revert of trunk commits"
  exit 0
fi
echo "derived-files: fail — run the check"
exit 1
