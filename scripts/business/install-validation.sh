#!/usr/bin/env bash
# Explicit root/operator installation of one isolated real-runtime fixture HQ.
set -euo pipefail
[[ $EUID -eq 0 && $# -eq 3 && $1 =~ ^[0-9a-f]{40}$ && $2 =~ ^[a-z0-9-]{1,24}$ && $3 =~ ^431[4-9]$ ]] || { echo 'Usage: install-validation.sh PUSHED_SHA OWNED_LABEL PORT_4314_TO_4319' >&2; exit 2; }
revision=$1
validation_label=$2
validation_port=$3
source_root=/opt/botsquad-business-$validation_label
state_root=/var/lib/botsquad/validation/business-p11-$validation_label
unit=botsquad-business-$validation_label
[[ ! -e $source_root && ! -e $state_root && ! -e /etc/systemd/system/$unit.service ]] || { echo 'Existing validation retained; inspect before reuse' >&2; exit 1; }
[[ -z $(ss -H -lnt "sport = :$validation_port") ]] || { echo 'Port is occupied' >&2; exit 1; }
git clone --no-hardlinks --no-checkout /opt/botsquad "$source_root"
git -C "$source_root" remote set-url origin https://github.com/eugenelin89/bot_messenger.git
git -C "$source_root" fetch origin feature/prompt-11-business-operations
git -C "$source_root" checkout --detach "$revision"
[[ $(git -C "$source_root" rev-parse HEAD) == "$revision" ]]
cmp /opt/botsquad/package-lock.json "$source_root/package-lock.json"
ln -s /opt/botsquad/node_modules "$source_root/node_modules"
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
(cd "$source_root" && npm run build)
install -d -o botsquad -g botsquad -m 700 "$state_root"
python3 - "$state_root/validation-manifest.json" "$revision" <<'PY'
import json,sys,os
with open(sys.argv[1],'x') as f: json.dump({'purpose':'Prompt 11 real workers with SIMULATED provider','revision':sys.argv[2],'production_unchanged':True},f)
os.chmod(sys.argv[1],0o600)
PY
chown botsquad:botsquad "$state_root/validation-manifest.json"
cat > /etc/botsquad/business-$validation_label <<ENV
BOT_DATA_DIR=$state_root
PORT=$validation_port
BOT_DEPLOYED_SHA=$revision
BOT_VALIDATION_BUSINESS=1
BOTSQUAD_BUSINESS_CONFIG=
CODEX_BIN=$source_root/node_modules/.bin/codex
ENV
chmod 600 /etc/botsquad/business-$validation_label
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source_root|" \
    -e "s|^ExecStart=.*|ExecStart=/opt/botsquad-runtime/node/bin/node $source_root/dist/scripts/business/server.js|" \
    -e 's/^Restart=.*/Restart=no/' \
    -e "/^EnvironmentFile=-\/etc\/botsquad\/environment/a EnvironmentFile=/etc/botsquad/business-$validation_label" \
    /etc/systemd/system/botsquad.service > "/etc/systemd/system/$unit.service"
systemctl daemon-reload
systemctl start "$unit"
printf 'Unit: %s\nEvidence: %s\nSource: %s\n' "$unit" "$state_root" "$source_root"
