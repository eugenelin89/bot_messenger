#!/usr/bin/env bash
# Root/operator-only acceptance launcher. Does not change the retained HQ source/data.
set -euo pipefail
[[ $EUID -eq 0 && $# -eq 1 && $1 =~ ^[0-9a-f]{40}$ ]] || { echo 'Usage as root on HQ: validate-ubuntu.sh EXACT_PUSHED_SHA' >&2; exit 2; }
revision=$1
source_root=/opt/botsquad-client-validation
state_root=/var/lib/botsquad/validation/client-20260929-prompt06
unit=botsquad-client-validation
[[ ! -e $source_root && ! -e $state_root && ! -e /etc/systemd/system/$unit.service ]] || { echo 'Validation already exists; preserve and inspect it before continuing' >&2; exit 1; }
curl -fsS http://127.0.0.1:4310/api/state | python3 -c 'import json,sys; s=json.load(sys.stdin); assert s["paused"] and not any(e["status"]=="running" for e in s["executions"]); assert not any(a["status"]=="pending" for a in s["infrastructure"]["approvals"]+s["project_approvals"])'
git clone --no-hardlinks --no-checkout /opt/botsquad "$source_root"
git -C "$source_root" remote set-url origin https://github.com/eugenelin89/bot_messenger.git
git -C "$source_root" fetch origin feature/prompt-06-remote-client-api
git -C "$source_root" checkout --detach "$revision"
[[ $(git -C "$source_root" rev-parse HEAD) == "$revision" ]]
# Dependencies are unchanged; reuse the exact installed runtime/dependency tree.
python3 - /opt/botsquad/package-lock.json "$source_root/package-lock.json" <<'PY'
import json,sys
a,b=[json.load(open(p)) for p in sys.argv[1:]]
# The retained source predates the MIT-license metadata commit, not a dependency change.
for lock in [a,b]:
    lock['packages'][''].pop('license',None)
assert a==b, 'Dependency lock changed; install/validate its exact dependencies first'
PY
ln -s /opt/botsquad/node_modules "$source_root/node_modules"
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
(cd "$source_root" && npm run build)
install -d -o botsquad -g botsquad -m 700 "$state_root"
cat > /etc/botsquad/client-validation <<ENV
BOT_DATA_DIR=$state_root
PORT=4311
BOT_DEPLOYED_SHA=$revision
CODEX_BIN=$source_root/node_modules/.bin/codex
ENV
chmod 600 /etc/botsquad/client-validation
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source_root|" \
    -e "s|^ExecStart=.*|ExecStart=/opt/botsquad-runtime/node/bin/node $source_root/dist/src/main.js|" \
    -e '/^EnvironmentFile=-\/etc\/botsquad\/environment/a EnvironmentFile=/etc/botsquad/client-validation' \
    /etc/systemd/system/botsquad.service > "/etc/systemd/system/$unit.service"
# Existing service identity, write boundary, runtime auth and hardening are unchanged.
systemctl daemon-reload
systemctl enable --now "$unit"
for attempt in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:4311/api/health > "$state_root/initial-health.json"; then break; fi
  sleep 1
done
python3 - "$state_root/initial-health.json" "$revision" <<'PY'
import json,sys
s=json.load(open(sys.argv[1]));assert s['alive'] and s['database'] and s['commit']==sys.argv[2]
print(json.dumps({'validation_service_ready':True,'commit':s['commit'],'port':4311}))
PY
