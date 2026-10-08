#!/usr/bin/env bash
# infrastructure tool scale.sh, version 1
set -euo pipefail

# Sets <service> in <environment> to <count> replicas, within the policy's scale bounds for it.
# compose: the project in the login directory of ssh host <environment>; kubernetes: context and namespace <environment>.

# One record line per run on stdout: `<status> action=<a> target=<environment>/<name> before=<v> after=<v> undo=<v>`.
# status is done, dry-run, refused or failed; a field with no value is `-`; undo is last and may hold spaces.

POLICY="docs/delivery-policy.md"

usage() {
  echo "usage: scale.sh [--dry-run] <environment> <service> <count>" >&2
  exit 2
}

dry_run=0
args=()
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then dry_run=1; else args+=("$arg"); fi
done
[ "${#args[@]}" -eq 3 ] || usage
environment="${args[0]}"
service="${args[1]}"
count="${args[2]}"
# Both reach a remote shell through ssh, so only plain names pass.
[[ $environment =~ ^[A-Za-z0-9._-]+$ && $service =~ ^[A-Za-z0-9._-]+$ && $count =~ ^[0-9]+$ ]] || usage
count=$((10#$count))

before="-"
record() {
  local undo="-"
  [ "$before" = "-" ] || undo="scale.sh $environment $service $before"
  echo "$1 action=scale target=$environment/$service before=$before after=$2 undo=$undo"
}
refuse() {
  echo "scale: $1" >&2
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
[ "$runtime" = compose ] || [ "$runtime" = kubernetes ] || usage

# The bounds are the environment's, and only a service the policy names has them.
awk -v p="services.$service." 'index($0, p) == 1 { f = 1 } END { exit !f }' <<<"$policy" ||
  refuse "the policy gives $service no bounds"
min="$(rule "environments.$environment.scale.min.value")"
max="$(rule "environments.$environment.scale.max.value")"
[[ $min =~ ^[0-9]+$ && $max =~ ^[0-9]+$ ]] || refuse "the policy gives $environment no scale bounds"
[ "$count" -ge "$min" ] && [ "$count" -le "$max" ] ||
  refuse "$count is outside $environment's bounds, $min to $max"

case "$runtime" in
compose)
  config="$(ssh "$environment" docker compose config --format json)" ||
    refuse "cannot read the compose project on $environment"
  jq -e --arg s "$service" '.services | has($s)' <<<"$config" >/dev/null ||
    refuse "$environment runs no service $service"
  running="$(ssh "$environment" docker compose ps --quiet "$service")" ||
    refuse "cannot read $service's containers on $environment"
  before="$(grep -c . <<<"$running" || true)"
  [ "$dry_run" -eq 0 ] || { record dry-run "$count"; exit 0; }
  ssh "$environment" docker compose up --detach --no-deps --no-recreate --scale "$service=$count" "$service" >&2 ||
    { record failed -; exit 1; }
  ;;
kubernetes)
  kube=(kubectl --context "$environment" --namespace "$environment")
  workloads="$("${kube[@]}" get deployment,statefulset --field-selector "metadata.name=$service" -o json)" ||
    refuse "cannot read the workloads of $environment"
  kind="$(jq -r '.items[0].kind // empty' <<<"$workloads")"
  [ -n "$kind" ] || refuse "$environment runs no service $service"
  before="$(jq -r '.items[0].spec.replicas // 1' <<<"$workloads")"
  [ "$dry_run" -eq 0 ] || { record dry-run "$count"; exit 0; }
  "${kube[@]}" scale "$(tr '[:upper:]' '[:lower:]' <<<"$kind")/$service" --replicas "$count" >&2 ||
    { record failed -; exit 1; }
  ;;
esac

record done "$count"
