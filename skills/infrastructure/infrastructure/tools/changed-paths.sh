#!/usr/bin/env bash
# infrastructure tool changed-paths.sh, version 1
set -euo pipefail

# Prints one service name per line: each service with a file changed under its paths since
# <environment>'s last successful Deployment, or every service when it has none.

POLICY="docs/delivery-policy.md"

usage() {
  echo "usage: changed-paths.sh <environment>" >&2
  exit 2
}
lookup_failed() {
  echo "changed-paths: $1" >&2
  exit 1
}

[ "$#" -eq 1 ] && [ -n "$1" ] || usage
environment="$1"

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

policy="$(git show "HEAD:$POLICY" 2>/dev/null | awk "$flatten")" || true
grep -q '^schema_version	' <<<"$policy" || lookup_failed "no readable policy front matter at HEAD:$POLICY"
awk -v p="environments.$environment." 'index($0, p) == 1 { f = 1 } END { exit !f }' <<<"$policy" || usage

# `<service>\t<glob>`, in policy order.
service_globs="$(sed -n 's/^services\.\([^.]*\)\.paths\.value\[\]	\(.*\)$/\1	\2/p' <<<"$policy")"
[ -n "$service_globs" ] || lookup_failed "the policy names no service paths"

deployments="$(gh api --paginate "repos/{owner}/{repo}/deployments?environment=$environment&per_page=100" |
  jq -r '.[] | "\(.id) \(.sha)"')" || lookup_failed "cannot list the $environment Deployments"

deployed=""
while read -r id sha; do
  [ -n "$id" ] || continue
  state="$(gh api "repos/{owner}/{repo}/deployments/$id/statuses?per_page=1" | jq -r '.[0].state // empty')" ||
    lookup_failed "cannot read the statuses of Deployment $id"
  if [ "$state" = "success" ]; then
    deployed="$sha"
    break
  fi
done <<<"$deployments"

if [ -z "$deployed" ]; then
  cut -f1 <<<"$service_globs" | awk '!seen[$0]++'
  exit 0
fi

changed="$(git diff --name-only --no-renames "$deployed" HEAD)" ||
  lookup_failed "cannot diff from $deployed — is the history fetched in full?"

while IFS='	' read -r service glob; do
  while IFS= read -r file; do
    # Unquoted on purpose: the policy value is the pattern, and `*` here also crosses `/`.
    if [ -n "$file" ] && [[ $file == $glob ]]; then
      echo "$service"
      break
    fi
  done <<<"$changed"
done <<<"$service_globs" | awk '!seen[$0]++'
