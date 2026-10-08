#!/usr/bin/env bash
# infrastructure tool restart.sh, version 1
set -euo pipefail

# Restarts <service> in <environment>, refusing a data store. Run from the checkout's root.
# compose: the project in the login directory of ssh host <environment>; kubernetes: context and namespace <environment>.

# One record line per run on stdout: `<status> action=<a> target=<environment>/<name> before=<v> after=<v> undo=<v>`.
# status is done, dry-run, refused or failed; a field with no value is `-`; undo is last and may hold spaces.

POLICY="docs/delivery-policy.md"
MARKER="infrastructure.data-store"

usage() {
  echo "usage: restart.sh [--dry-run] <environment> <service>" >&2
  exit 2
}

dry_run=0
args=()
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then dry_run=1; else args+=("$arg"); fi
done
[ "${#args[@]}" -eq 2 ] || usage
environment="${args[0]}"
service="${args[1]}"
# Both reach a remote shell through ssh, so only plain names pass.
[[ $environment =~ ^[A-Za-z0-9._-]+$ && $service =~ ^[A-Za-z0-9._-]+$ ]] || usage

before="-"
record() { echo "$1 action=restart target=$environment/$service before=$before after=$2 undo=-"; }
refuse() {
  echo "restart: $1" >&2
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
runtime="$(awk -F'\t' -v k="environments.$environment.runtime.value" '$1 == k { print $2; exit }' <<<"$policy")"

case "$runtime" in
compose)
  config="$(ssh "$environment" docker compose config --format json)" ||
    refuse "cannot read the compose project on $environment"
  jq -e --arg s "$service" '.services | has($s)' <<<"$config" >/dev/null ||
    refuse "$environment runs no service $service"
  [ "$(jq -r --arg s "$service" --arg m "$MARKER" '.services[$s].labels[$m] // empty' <<<"$config")" != "true" ] ||
    refuse "$service is a data store"
  before="running"
  [ "$dry_run" -eq 0 ] || { record dry-run restarted; exit 0; }
  ssh "$environment" docker compose restart "$service" >&2 || { record failed -; exit 1; }
  ;;
kubernetes)
  kube=(kubectl --context "$environment" --namespace "$environment")
  workloads="$("${kube[@]}" get deployment,statefulset --field-selector "metadata.name=$service" -o json)" ||
    refuse "cannot read the workloads of $environment"
  kind="$(jq -r '.items[0].kind // empty' <<<"$workloads")"
  [ -n "$kind" ] || refuse "$environment runs no service $service"
  [ "$(jq -r --arg m "$MARKER" '.items[0].metadata.labels[$m] // empty' <<<"$workloads")" != "true" ] ||
    refuse "$service is a data store"
  before="running"
  [ "$dry_run" -eq 0 ] || { record dry-run restarted; exit 0; }
  "${kube[@]}" rollout restart "$(tr '[:upper:]' '[:lower:]' <<<"$kind")/$service" >&2 || { record failed -; exit 1; }
  ;;
*)
  usage
  ;;
esac

record done restarted
