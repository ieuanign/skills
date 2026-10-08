#!/usr/bin/env bash
# infrastructure tool rollback.sh, version 1
set -euo pipefail

# Dispatches the deployment workflow to redeploy <service> in <environment> at <commit>, else at the
# service's previous successful Deployment; never deploys by itself. Run from the checkout's root.

# One record line per run on stdout: `<status> action=<a> target=<environment>/<name> before=<v> after=<v> undo=<v>`.
# status is done, dry-run, refused or failed; a field with no value is `-`; undo is last and may hold spaces.

POLICY="docs/delivery-policy.md"
# The deployment workflow takes these three inputs, and records each Deployment's services in its payload.
WORKFLOW="deployment.yml"

usage() {
  echo "usage: rollback.sh [--dry-run] <environment> <service> [commit]" >&2
  exit 2
}

dry_run=0
args=()
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then dry_run=1; else args+=("$arg"); fi
done
[ "${#args[@]}" -eq 2 ] || [ "${#args[@]}" -eq 3 ] || usage
environment="${args[0]}"
service="${args[1]}"
named="${args[2]:-}"
# Both reach a remote shell through ssh, so only plain names pass.
[[ $environment =~ ^[A-Za-z0-9._-]+$ && $service =~ ^[A-Za-z0-9._-]+$ ]] || usage

before="-"
record() {
  local undo="-"
  [ "$before" = "-" ] || undo="rollback.sh $environment $service $before"
  echo "$1 action=rollback target=$environment/$service before=$before after=$2 undo=$undo"
}
refuse() {
  echo "rollback: $1" >&2
  before="-"
  record refused -
  exit 1
}

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
grep -q '^schema_version	' <<<"$policy" || refuse "no readable policy front matter at HEAD:$POLICY"
rule() { awk -F'\t' -v k="$1" '$1 == k { print $2; exit }' <<<"$policy"; }
runtime="$(rule "environments.$environment.runtime.value")"
trunk="$(rule branching.trunk.value)"
[ -n "$trunk" ] || refuse "the policy names no trunk"

case "$runtime" in
compose)
  config="$(ssh "$environment" docker compose config --format json)" ||
    refuse "cannot read the compose project on $environment"
  jq -e --arg s "$service" '.services | has($s)' <<<"$config" >/dev/null ||
    refuse "$environment runs no service $service"
  ;;
kubernetes)
  workloads="$(kubectl --context "$environment" --namespace "$environment" \
    get deployment,statefulset --field-selector "metadata.name=$service" -o json)" ||
    refuse "cannot read the workloads of $environment"
  [ -n "$(jq -r '.items[0].kind // empty' <<<"$workloads")" ] || refuse "$environment runs no service $service"
  ;;
*)
  usage
  ;;
esac

if [ -n "$named" ]; then
  commit="$(git rev-parse --verify --quiet "$named^{commit}")" || refuse "no commit $named in this checkout"
  named="$commit"
fi

# GitHub stores a payload sent as a string as that string, so both shapes are read.
services='(.payload | if type == "string" then (fromjson? // {}) else . end) | .services // []'
deployments="$(gh api --paginate "repos/{owner}/{repo}/deployments?environment=$environment&per_page=100" |
  jq -r --arg s "$service" ".[] | select($services | index(\$s)) | \"\(.id) \(.sha)\"")" ||
  refuse "cannot list the $environment Deployments"

successful=()
while read -r id sha; do
  [ -n "$id" ] || continue
  state="$(gh api "repos/{owner}/{repo}/deployments/$id/statuses?per_page=1" | jq -r '.[0].state // empty')" ||
    refuse "cannot read the statuses of Deployment $id"
  [ "$state" != "success" ] || successful+=("$sha")
  [ "${#successful[@]}" -lt 2 ] || break
done <<<"$deployments"

[ "${#successful[@]}" -eq 0 ] || before="${successful[0]}"
target="${named:-${successful[1]:-}}"
[ -n "$target" ] || refuse "no previous successful $environment Deployment of $service, and no commit named"

[ "$dry_run" -eq 0 ] || { record dry-run "$target"; exit 0; }
gh workflow run "$WORKFLOW" --ref "$trunk" \
  -f "environment=$environment" -f "service=$service" -f "commit=$target" >&2 || { record failed -; exit 1; }
record done "$target"
