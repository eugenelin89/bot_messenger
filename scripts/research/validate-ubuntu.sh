#!/usr/bin/env bash
# Explicit root/operator fixture on the existing HQ; never uses retained HQ data.
set -euo pipefail
[[ $EUID -eq 0 && $# -eq 1 && $1 =~ ^[0-9a-f]{40}$ ]] || { echo 'Usage: validate-ubuntu.sh EXACT_PUSHED_SHA' >&2; exit 2; }
revision=$1
source_root=/opt/botsquad-research-validation
state_root=/var/lib/botsquad/validation/research-20261001-we01
unit=botsquad-research-validation
[[ ! -e $source_root && ! -e $state_root && ! -e /etc/systemd/system/$unit.service ]] || { echo 'Preserve and inspect the existing validation installation' >&2; exit 1; }
[[ -z $(ss -H -lnt 'sport = :4311') ]] || { echo 'Port 4311 already in use' >&2; exit 1; }
curl -fsS http://127.0.0.1:4310/api/state | python3 -c 'import json,sys; s=json.load(sys.stdin); assert not any(e["status"]=="running" for e in s["executions"])'
git clone --no-hardlinks --no-checkout /opt/botsquad "$source_root"
git -C "$source_root" remote set-url origin https://github.com/eugenelin89/bot_messenger.git
git -C "$source_root" fetch origin feature/worker-empowerment-01
git -C "$source_root" checkout --detach "$revision"
[[ $(git -C "$source_root" rev-parse HEAD) == "$revision" ]]
python3 - /opt/botsquad/package-lock.json "$source_root/package-lock.json" <<'PY'
import json,sys
a,b=[json.load(open(p)) for p in sys.argv[1:]]
for lock in [a,b]: lock['packages'][''].pop('license',None)
assert a==b, 'Install and validate changed dependency locks explicitly'
PY
ln -s /opt/botsquad/node_modules "$source_root/node_modules"
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
(cd "$source_root" && npm run build)
install -d -o botsquad -g botsquad -m 700 "$state_root"
python3 - "$state_root/validation-manifest.json" "$revision" <<'PY'
import json,sys,os
with open(sys.argv[1],'x') as f: json.dump({'purpose':'WE-01 isolated real worker research','revision':sys.argv[2],'roster':'trusted fixture; no scripted model replies','fault':'optional clearly labelled public-source outage fixture; never production'},f)
os.chmod(sys.argv[1],0o600)
PY
chown botsquad:botsquad "$state_root/validation-manifest.json"
cat > /etc/botsquad/research-validation <<ENV
BOT_DATA_DIR=$state_root
PORT=4311
BOT_DEPLOYED_SHA=$revision
BOT_VALIDATION_RESEARCH=1
CODEX_BIN=$source_root/node_modules/.bin/codex
ENV
chmod 600 /etc/botsquad/research-validation
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source_root|" \
    -e "s|^ExecStart=.*|ExecStart=/opt/botsquad-runtime/node/bin/node $source_root/dist/scripts/research/server.js|" \
    -e 's/^Restart=.*/Restart=no/' \
    -e '/^EnvironmentFile=-\/etc\/botsquad\/environment/a EnvironmentFile=/etc/botsquad/research-validation' \
    /etc/systemd/system/botsquad.service > "/etc/systemd/system/$unit.service"
# Same Unix service identity/account, provisioner and credential namespace; separate data.
systemctl daemon-reload
systemctl start "$unit"
for attempt in $(seq 1 45); do
  if curl -fsS http://127.0.0.1:4311/api/health > "$state_root/initial-health.json"; then break; fi
  sleep 1
done
python3 - "$state_root/initial-health.json" "$revision" <<'PY'
import json,sys
s=json.load(open(sys.argv[1]));assert s['alive'] and s['database'] and s['commit']==sys.argv[2]
print(json.dumps({'ready':True,'revision':s['commit'],'port':4311}))
PY
