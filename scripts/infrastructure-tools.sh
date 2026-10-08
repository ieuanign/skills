#!/usr/bin/env bash
set -euo pipefail

# The infrastructure skill's bundled tools, driven over throwaway git repositories and fixture
# policies, with `gh` stubbed on PATH so nothing reaches the network.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$REPO/skills/infrastructure/infrastructure/tools"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# A caller's global config (signing, hooks, default branch) must not change what a fixture repo is.
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null
export GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.invalid
export GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.invalid

failed=0
n=0

ok() { echo "ok    infrastructure tools: $1"; }
fail() {
  echo "FAIL  infrastructure tools: $1" >&2
  shift
  [ "$#" -eq 0 ] || printf '      %s\n' "$@" >&2
  failed=1
}

# expect <scenario> <want-exit> <want-stdout|-> <command...>
expect() {
  local scenario="$1" want_rc="$2" want_out="$3" out rc
  shift 3
  out="$("$@" 2>"$work/stderr")" && rc=0 || rc=$?
  if [ "$rc" -ne "$want_rc" ]; then
    fail "$scenario" "exit $rc, expected $want_rc" "stdout: $out" "stderr: $(cat "$work/stderr")"
  elif [ "$want_out" != "-" ] && [ "$out" != "$want_out" ]; then
    fail "$scenario" "stdout: $(printf '%q' "$out")" "expected: $(printf '%q' "$want_out")"
  else
    ok "$scenario"
  fi
}

write_policy() {
  mkdir -p docs
  cat >docs/delivery-policy.md <<'EOF'
---
schema_version: 1
branching:
  trunk:
    value: "main"
    mark: client
  derived_files:
    value:
      - "package-lock.json"
      - 'CHANGELOG.md'
      - generated/**  # every file under it
    mark: client
services:
  api:
    paths:
      value:
        - "services/api/**"
      mark: client
    mobile_app:
      value: false
      mark: client
  web:
    paths:
      value:
        - "services/web/**"
        - "shared/**"
      mark: client
    mobile_app:
      value: false
      mark: client
environments:
  staging:
    deployed_by:
      value: "trunk-push"
      mark: suggested
---

# Delivery policy
EOF
}

# A fresh repository whose trunk holds a policy and one file per service; cwd moves into it.
new_repo() {
  n=$((n + 1))
  local dir="$work/repo-$n"
  mkdir -p "$dir"
  cd "$dir"
  git init -q -b main
  write_policy
  mkdir -p services/api services/web generated
  echo api >services/api/main.txt
  echo web >services/web/main.txt
  echo '{}' >package-lock.json
  git add -A
  git commit -q -m "initial"
}

commit_file() {
  mkdir -p "$(dirname "$1")"
  echo "$2" >>"$1"
  git add -A
  git commit -q -m "change $1"
}

# --- derived-files.sh ---------------------------------------------------------
derived="$TOOLS/derived-files.sh"

new_repo
base="$(git rev-parse HEAD)"
git checkout -q -b pr
commit_file package-lock.json '{"a":1}'
commit_file generated/deep/client.ts 'export {}'
expect "derived-files: every changed file derived passes" 0 - "$derived" "$base" HEAD

new_repo
base="$(git rev-parse HEAD)"
git checkout -q -b pr
commit_file package-lock.json '{"a":1}'
commit_file services/api/main.txt 'more'
expect "derived-files: one non-derived file fails" 1 - "$derived" "$base" HEAD

new_repo
base="$(git rev-parse HEAD)"
git checkout -q -b pr
git commit -q --allow-empty -m "nothing"
expect "derived-files: an empty diff fails" 1 - "$derived" "$base" HEAD

new_repo
commit_file services/api/main.txt 'bad change'
bad="$(git rev-parse HEAD)"
base="$bad"
git checkout -q -b pr
git revert --no-edit "$bad" >/dev/null
expect "derived-files: an exact revert passes" 0 - "$derived" "$base" HEAD

new_repo
commit_file services/api/main.txt 'bad change'
bad="$(git rev-parse HEAD)"
base="$bad"
git checkout -q -b pr
git revert --no-edit "$bad" >/dev/null
commit_file services/web/main.txt 'further'
expect "derived-files: a revert plus a further change fails" 1 - "$derived" "$base" HEAD

# git C-quotes a non-ASCII path by default, which no glob matches.
new_repo
base="$(git rev-parse HEAD)"
git checkout -q -b pr
commit_file 'generated/café.ts' 'export {}'
expect "derived-files: a derived non-ASCII path passes" 0 - "$derived" "$base" HEAD

new_repo
expect "derived-files: a missing argument exits 2" 2 - "$derived" HEAD

new_repo
base="$(git rev-parse HEAD)"
git rm -q docs/delivery-policy.md
git commit -q -m "no policy"
nopolicy="$(git rev-parse HEAD)"
expect "derived-files: an unreadable policy exits 2" 2 - "$derived" "$nopolicy" "$base"

# --- changed-paths.sh ---------------------------------------------------------
changed_paths="$TOOLS/changed-paths.sh"

# The stub answers `gh api <endpoint>` from $GH_STUB: deployments.json, statuses-<id>.json.
mkdir -p "$work/bin"
cat >"$work/bin/gh" <<'EOF'
#!/usr/bin/env bash
[ "$1" = "api" ] || { echo "gh stub: only api is stubbed" >&2; exit 64; }
for arg in "$@"; do
  case "$arg" in
    repos/\{owner\}/\{repo\}/deployments/*/statuses*)
      id="${arg#*/deployments/}"; id="${id%%/*}"
      cat "$GH_STUB/statuses-$id.json" 2>/dev/null || echo '[]'; exit 0 ;;
    repos/\{owner\}/\{repo\}/deployments*)
      cat "$GH_STUB/deployments.json" 2>/dev/null || echo '[]'; exit 0 ;;
  esac
done
echo "gh stub: unexpected call: $*" >&2
exit 64
EOF
chmod +x "$work/bin/gh"
export PATH="$work/bin:$PATH"

stub_deployments() {
  export GH_STUB="$work/gh-$n"
  mkdir -p "$GH_STUB"
  printf '%s\n' "$1" >"$GH_STUB/deployments.json"
}
stub_statuses() { printf '%s\n' "$2" >"$GH_STUB/statuses-$1.json"; }

new_repo
deployed="$(git rev-parse HEAD)"
commit_file services/api/main.txt 'changed'
stub_deployments "[{\"id\": 7, \"sha\": \"$deployed\"}]"
stub_statuses 7 '[{"state": "success"}, {"state": "in_progress"}]'
expect "changed-paths: the changed service is listed, the unchanged one is not" 0 "api" \
  "$changed_paths" staging

new_repo
commit_file services/api/main.txt 'changed'
stub_deployments '[]'
expect "changed-paths: no Deployment lists every service" 0 "$(printf 'api\nweb')" \
  "$changed_paths" staging

new_repo
good="$(git rev-parse HEAD)"
commit_file shared/lib.txt 'changed'
failed_sha="$(git rev-parse HEAD)"
commit_file services/api/main.txt 'changed'
stub_deployments "[{\"id\": 9, \"sha\": \"$failed_sha\"}, {\"id\": 8, \"sha\": \"$good\"}]"
stub_statuses 9 '[{"state": "failure"}, {"state": "success"}]'
stub_statuses 8 '[{"state": "success"}]'
expect "changed-paths: the last success is chosen over a newer failed Deployment" 0 \
  "$(printf 'api\nweb')" "$changed_paths" staging

new_repo
deployed="$(git rev-parse HEAD)"
commit_file 'services/web/café.txt' 'changed'
stub_deployments "[{\"id\": 7, \"sha\": \"$deployed\"}]"
stub_statuses 7 '[{"state": "success"}]'
expect "changed-paths: a non-ASCII path lists its service" 0 "web" "$changed_paths" staging

new_repo
expect "changed-paths: a missing environment exits 2 with usage" 2 - "$changed_paths"
if ! grep -q '^usage: ' "$work/stderr"; then
  fail "changed-paths: a missing environment prints usage" "stderr: $(cat "$work/stderr")"
fi

# --- version header -----------------------------------------------------------
# The copied file must carry its version, so a later compare can tell shipped from stale.
for name in derived-files.sh changed-paths.sh; do
  if sed -n 2p "$TOOLS/$name" 2>/dev/null | grep -Eq "^# infrastructure tool $name, version [0-9]+$"; then
    ok "$name carries the version header"
  else
    fail "$name carries the version header" "line 2 must read: # infrastructure tool $name, version <n>"
  fi
done

exit "$failed"
