#!/usr/bin/env bash
# infrastructure tool prune.sh, version 1
set -euo pipefail

# Frees space in <environment>; never a volume, a data store's storage or a backup. compose: unused
# images, build cache and rotated logs on ssh host <environment>; kubernetes: finished pods in namespace <environment>.

# One record line per run on stdout: `<status> action=<a> target=<environment>/<name> before=<v> after=<v> undo=<v>`.
# status is done, dry-run, refused or failed; a field with no value is `-`; undo is last and may hold spaces.

POLICY="docs/delivery-policy.md"
# Rotated, never live: a live log is still held open by the process writing it.
ROTATED_LOGS="sudo -n find /var/log -type f \\( -name '*.gz' -o -name '*.[0-9]' \\) -delete"

usage() {
  echo "usage: prune.sh [--dry-run] <environment>" >&2
  exit 2
}

dry_run=0
args=()
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then dry_run=1; else args+=("$arg"); fi
done
[ "${#args[@]}" -eq 1 ] || usage
environment="${args[0]}"
# It reaches a remote shell through ssh, so only a plain name passes.
[[ $environment =~ ^[A-Za-z0-9._-]+$ ]] || usage

before="-"
record() { echo "$1 action=prune target=$environment/- before=$before after=$2 undo=-"; }
refuse() {
  echo "prune: $1" >&2
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
  disk_used() { ssh "$environment" df -P / | awk 'NR == 2 { print "disk-used=" $5 }'; }
  before="$(disk_used)" && [ -n "$before" ] || { before="-"; refuse "cannot read the disk use of $environment"; }
  [ "$dry_run" -eq 0 ] || { record dry-run -; exit 0; }
  {
    ssh "$environment" docker image prune --all --force &&
      ssh "$environment" docker builder prune --all --force &&
      ssh "$environment" "$ROTATED_LOGS"
  } >&2 || { record failed -; exit 1; }
  after="$(disk_used)" || after="-"
  record done "${after:--}"
  ;;
kubernetes)
  kube=(kubectl --context "$environment" --namespace "$environment")
  finished='[.items[] | select(.status.phase == "Succeeded" or .status.phase == "Failed")] | length'
  pods="$("${kube[@]}" get pods -o json)" || refuse "cannot read the pods of $environment"
  before="finished-pods=$(jq "$finished" <<<"$pods")"
  [ "$dry_run" -eq 0 ] || { record dry-run finished-pods=0; exit 0; }
  {
    "${kube[@]}" delete pods --field-selector status.phase==Succeeded &&
      "${kube[@]}" delete pods --field-selector status.phase==Failed
  } >&2 || { record failed -; exit 1; }
  record done finished-pods=0
  ;;
*)
  usage
  ;;
esac
