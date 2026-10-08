#!/usr/bin/env bash
# infrastructure tool restore-test.sh, version 1
set -euo pipefail

# Runs <store>'s restore-test unit in <environment>: it restores the latest backup into a database of its
# own, which is removed with it. compose: a service of profile restore-test; kubernetes: a suspended CronJob.

# One record line per run on stdout: `<status> action=<a> target=<environment>/<name> before=<v> after=<v> undo=<v>`.
# status is done, dry-run, refused or failed; a field with no value is `-`; undo is last and may hold spaces.

POLICY="docs/delivery-policy.md"
MARKER="infrastructure.data-store"
WAIT="1h"

usage() {
  echo "usage: restore-test.sh [--dry-run] <environment> <store>" >&2
  exit 2
}

dry_run=0
args=()
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then dry_run=1; else args+=("$arg"); fi
done
[ "${#args[@]}" -eq 2 ] || usage
environment="${args[0]}"
store="${args[1]}"
# Both reach a remote shell through ssh, so only plain names pass.
[[ $environment =~ ^[A-Za-z0-9._-]+$ && $store =~ ^[A-Za-z0-9._-]+$ ]] || usage
unit="$store-restore-test"

record() { echo "$1 action=restore-test target=$environment/$store before=- after=$2 undo=-"; }
refuse() {
  echo "restore-test: $1" >&2
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
  compose=(docker compose --profile restore-test)
  config="$(ssh "$environment" "${compose[@]}" config --format json)" ||
    refuse "cannot read the compose project on $environment"
  jq -e --arg s "$unit" '.services | has($s)' <<<"$config" >/dev/null ||
    refuse "$environment has no restore-test unit $unit"
  # A unit marked as a data store is live storage, which a restore must never overwrite.
  [ "$(jq -r --arg s "$unit" --arg m "$MARKER" '.services[$s].labels[$m] // empty' <<<"$config")" != "true" ] ||
    refuse "$unit is marked as a data store"
  [ "$dry_run" -eq 0 ] || { record dry-run restored; exit 0; }
  ssh "$environment" "${compose[@]}" run --rm --no-deps "$unit" >&2 || { record failed -; exit 1; }
  ;;
kubernetes)
  kube=(kubectl --context "$environment" --namespace "$environment")
  cronjob="$("${kube[@]}" get cronjob --field-selector "metadata.name=$unit" -o json)" ||
    refuse "cannot read the cronjobs of $environment"
  [ "$(jq '.items | length' <<<"$cronjob")" -eq 1 ] || refuse "$environment has no restore-test unit $unit"
  [ "$(jq -r --arg m "$MARKER" '.items[0].metadata.labels[$m] // empty' <<<"$cronjob")" != "true" ] ||
    refuse "$unit is marked as a data store"
  [ "$dry_run" -eq 0 ] || { record dry-run restored; exit 0; }
  job="$unit-$(date +%s)"
  "${kube[@]}" create job "$job" --from "cronjob/$unit" >&2 || { record failed -; exit 1; }
  status=0
  "${kube[@]}" wait --for condition=complete --timeout "$WAIT" "job/$job" >&2 || status=1
  "${kube[@]}" delete job "$job" --wait >&2 || status=1
  [ "$status" -eq 0 ] || { record failed -; exit 1; }
  ;;
*)
  usage
  ;;
esac

record done restored
