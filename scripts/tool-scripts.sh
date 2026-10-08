#!/usr/bin/env bash
set -euo pipefail

# The infrastructure skill's five tool scripts, run dry over a fixture policy with one compose and one
# kubernetes environment. ssh, kubectl, gh, docker and helm are stubs answering reads from fixtures.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$REPO/skills/infrastructure/infrastructure/tools"
FIXTURES="$REPO/scripts/fixtures/tool-scripts"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# A caller's global config (signing, hooks, default branch) must not change what the fixture repo is.
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null
export GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.invalid
export GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.invalid

failed=0

ok() { echo "ok    tool scripts: $1"; }
fail() {
  echo "FAIL  tool scripts: $1" >&2
  shift
  [ "$#" -eq 0 ] || printf '      %s\n' "$@" >&2
  failed=1
}

# A stub logs every call it cannot answer from a fixture; any such call is a case reaching a live tool.
export STUB_FIXTURES="$FIXTURES" STUB_LOG="$work/live-calls"
mkdir -p "$work/bin"
live='echo "$(basename "$0") $*" >>"$STUB_LOG"; exit 64'

cat >"$work/bin/ssh" <<EOF
#!/usr/bin/env bash
shift
case "\$*" in
  "docker compose config --format json" | "docker compose --profile restore-test config --format json")
    cat "\$STUB_FIXTURES/compose-config.json"; exit 0 ;;
  "docker compose ps --quiet "*) cat "\$STUB_FIXTURES/compose-ps.txt"; exit 0 ;;
  "df -P /") cat "\$STUB_FIXTURES/df.txt"; exit 0 ;;
esac
$live
EOF

cat >"$work/bin/kubectl" <<EOF
#!/usr/bin/env bash
args=("\$@")
[ "\$1" = "--context" ] && [ "\$3" = "--namespace" ] && args=("\${@:5}")
name="\${args[3]#metadata.name=}"
case "\${args[*]}" in
  "get deployment,statefulset --field-selector metadata.name=\$name -o json")
    jq --arg n "\$name" '.items |= map(select(.metadata.name == \$n))' "\$STUB_FIXTURES/kubernetes-workloads.json"
    exit 0 ;;
  "get cronjob --field-selector metadata.name=\$name -o json")
    jq --arg n "\$name" '.items |= map(select(.metadata.name == \$n))' "\$STUB_FIXTURES/kubernetes-cronjobs.json"
    exit 0 ;;
  "get pods -o json") cat "\$STUB_FIXTURES/kubernetes-pods.json"; exit 0 ;;
esac
$live
EOF

# GH_STUB names the directory of deployments-<environment>.json and statuses-<id>.json to answer from.
cat >"$work/bin/gh" <<EOF
#!/usr/bin/env bash
if [ "\$1" = "api" ]; then
  for arg in "\$@"; do
    case "\$arg" in
      repos/\{owner\}/\{repo\}/deployments/*/statuses*)
        id="\${arg#*/deployments/}"; id="\${id%%/*}"
        cat "\$GH_STUB/statuses-\$id.json" 2>/dev/null || echo '[]'; exit 0 ;;
      repos/\{owner\}/\{repo\}/deployments\?environment=*)
        env="\${arg#*environment=}"; env="\${env%%&*}"
        cat "\$GH_STUB/deployments-\$env.json" 2>/dev/null || echo '[]'; exit 0 ;;
    esac
  done
fi
$live
EOF

for tool in docker helm; do
  printf '#!/usr/bin/env bash\n%s\n' "$live" >"$work/bin/$tool"
done
chmod +x "$work/bin/"*
export PATH="$work/bin:$PATH"

# The scripts read the policy from HEAD of the checkout they run in.
mkdir -p "$work/repo/docs"
cp "$FIXTURES/delivery-policy.md" "$work/repo/docs/delivery-policy.md"
cd "$work/repo"
git init -q -b main
git add -A
git commit -q -m "fixture"
head="$(git rev-parse HEAD)"

if out="$(node "$REPO/skills/infrastructure/delivery-policy/check-policy.mjs" docs/delivery-policy.md 2>&1)"; then
  ok "the fixture policy passes the schema"
else
  fail "the fixture policy passes the schema" "$(grep -v '^pass ' <<<"$out")"
fi

export GH_STUB="$FIXTURES"

# expect <scenario> <want-exit> <want-stdout> <script> <args...>; every case runs with --dry-run.
expect() {
  local scenario="$1" want_rc="$2" want_out="$3" script="$4" out rc
  shift 4
  : >"$STUB_LOG"
  out="$("$TOOLS/$script" --dry-run "$@" 2>"$work/stderr")" && rc=0 || rc=$?
  if [ -s "$STUB_LOG" ]; then
    fail "$scenario" "reached a live tool:" "$(cat "$STUB_LOG")"
  elif [ "$rc" -ne "$want_rc" ]; then
    fail "$scenario" "exit $rc, expected $want_rc" "stdout: $out" "stderr: $(cat "$work/stderr")"
  elif [ "$out" != "$want_out" ]; then
    fail "$scenario" "stdout: $(printf '%q' "$out")" "expected: $(printf '%q' "$want_out")"
  else
    ok "$scenario"
  fi
}

refused() { echo "refused action=$1 target=$2 before=- after=- undo=-"; }

# --- compose: staging -----------------------------------------------------------
expect "rollback (compose): the previous successful Deployment" 0 \
  "dry-run action=rollback target=staging/api before=2222222222222222222222222222222222222222 after=1111111111111111111111111111111111111111 undo=rollback.sh staging api 2222222222222222222222222222222222222222" \
  rollback.sh staging api
GH_STUB="$work" expect "rollback (compose): a named commit with no Deployment" 0 \
  "dry-run action=rollback target=staging/api before=- after=$head undo=-" \
  rollback.sh staging api HEAD
GH_STUB="$work" expect "rollback (compose): no Deployment and no commit is refused" 1 \
  "$(refused rollback staging/api)" rollback.sh staging api
expect "restart (compose): a service" 0 \
  "dry-run action=restart target=staging/api before=running after=restarted undo=-" restart.sh staging api
expect "restart (compose): a data store is refused" 1 "$(refused restart staging/db)" restart.sh staging db
expect "scale (compose): within bounds" 0 \
  "dry-run action=scale target=staging/api before=2 after=1 undo=scale.sh staging api 2" scale.sh staging api 1
expect "scale (compose): above the bounds is refused" 1 "$(refused scale staging/api)" scale.sh staging api 3
expect "scale (compose): a service without bounds is refused" 1 "$(refused scale staging/worker)" \
  scale.sh staging worker 1
expect "scale (compose): a data store is refused" 1 "$(refused scale staging/db)" scale.sh staging db 1
expect "prune (compose): the host" 0 \
  "dry-run action=prune target=staging/- before=disk-used=85% after=- undo=-" prune.sh staging
expect "restore-test (compose): a store" 0 \
  "dry-run action=restore-test target=staging/db before=- after=restored undo=-" restore-test.sh staging db

# --- kubernetes: production -----------------------------------------------------
expect "rollback (kubernetes): the previous successful Deployment" 0 \
  "dry-run action=rollback target=production/api before=5555555555555555555555555555555555555555 after=4444444444444444444444444444444444444444 undo=rollback.sh production api 5555555555555555555555555555555555555555" \
  rollback.sh production api
GH_STUB="$work" expect "rollback (kubernetes): a named commit with no Deployment" 0 \
  "dry-run action=rollback target=production/api before=- after=$head undo=-" \
  rollback.sh production api HEAD
GH_STUB="$work" expect "rollback (kubernetes): no Deployment and no commit is refused" 1 \
  "$(refused rollback production/api)" rollback.sh production api
expect "restart (kubernetes): a service" 0 \
  "dry-run action=restart target=production/api before=running after=restarted undo=-" restart.sh production api
expect "restart (kubernetes): a data store is refused" 1 "$(refused restart production/db)" \
  restart.sh production db
expect "scale (kubernetes): within bounds" 0 \
  "dry-run action=scale target=production/api before=3 after=4 undo=scale.sh production api 3" \
  scale.sh production api 4
expect "scale (kubernetes): below the bounds is refused" 1 "$(refused scale production/api)" \
  scale.sh production api 1
expect "scale (kubernetes): a service without bounds is refused" 1 "$(refused scale production/worker)" \
  scale.sh production worker 2
expect "scale (kubernetes): a data store is refused" 1 "$(refused scale production/db)" \
  scale.sh production db 2
expect "prune (kubernetes): the namespace" 0 \
  "dry-run action=prune target=production/- before=finished-pods=2 after=finished-pods=0 undo=-" prune.sh production
expect "restore-test (kubernetes): a store" 0 \
  "dry-run action=restore-test target=production/db before=- after=restored undo=-" restore-test.sh production db

# --- version header -------------------------------------------------------------
for name in rollback.sh restart.sh scale.sh prune.sh restore-test.sh; do
  if sed -n 2p "$TOOLS/$name" 2>/dev/null | grep -Eq "^# infrastructure tool $name, version [0-9]+$"; then
    ok "$name carries the version header"
  else
    fail "$name carries the version header" "line 2 must read: # infrastructure tool $name, version <n>"
  fi
done

exit "$failed"
