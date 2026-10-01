#!/usr/bin/env bash
# Fresh bounded assignment acceptance; never repairs or reuses the fenced first fixture.
set -euo pipefail
[[ $EUID -eq 0 && $# -ge 1 && $# -le 2 && $1 =~ ^[0-9a-f]{40}$ ]] || exit 2
revision=$1
case ${2:-assignment} in
 assignment) suffix=confirmation; port=4312 ;;
 research) suffix=research-confirmation; port=4313 ;;
 *) exit 2 ;;
esac
source_root=/opt/botsquad-discussions-$suffix
state_root=/var/lib/botsquad/validation/discussions-20261001-p08-$suffix
unit=botsquad-discussions-$suffix
[[ ! -e $source_root && ! -e $state_root && ! -e /etc/systemd/system/$unit.service ]] || { echo 'Preserve existing confirmation installation' >&2; exit 1; }
[[ -z $(ss -H -lnt "sport = :$port") ]]
for existing_port in 4310 4311 4312; do
  [[ $existing_port != "$port" ]] || continue
  curl -fsS "http://127.0.0.1:$existing_port/api/state" | python3 -c 'import json,sys;s=json.load(sys.stdin);assert not any(e["status"]=="running" for e in s["executions"])'
done
git clone --no-hardlinks --no-checkout /opt/botsquad-discussions-validation "$source_root"
git -C "$source_root" remote set-url origin https://github.com/eugenelin89/bot_messenger.git
git -C "$source_root" fetch origin feature/prompt-08-working-groups
git -C "$source_root" checkout --detach "$revision"
cmp /opt/botsquad-discussions-validation/package-lock.json "$source_root/package-lock.json"
ln -s /opt/botsquad/node_modules "$source_root/node_modules"
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
(cd "$source_root" && npm run build)
install -d -o botsquad -g botsquad -m 700 "$state_root"
python3 - "$state_root/validation-manifest.json" "$revision" <<'PY'
import json,sys,os
with open(sys.argv[1],'x') as f: json.dump({'purpose':'Prompt 08 isolated real worker deliberation','revision':sys.argv[2],'reason':'Separate bounded acceptance after reviewed correction. Earlier fixtures, failures and unknown worker fences retained.','roster':'Trusted setup; actual model outputs required'},f)
os.chmod(sys.argv[1],0o600)
PY
chown botsquad:botsquad "$state_root/validation-manifest.json"
cat > /etc/botsquad/discussions-$suffix <<ENV
BOT_DATA_DIR=$state_root
PORT=$port
BOT_DEPLOYED_SHA=$revision
BOT_VALIDATION_DISCUSSIONS=1
CODEX_BIN=$source_root/node_modules/.bin/codex
ENV
chmod 600 /etc/botsquad/discussions-$suffix
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source_root|" \
    -e "s|^ExecStart=.*|ExecStart=/opt/botsquad-runtime/node/bin/node $source_root/dist/scripts/discussions/server.js|" \
    -e 's/^Restart=.*/Restart=no/' \
    -e "/^EnvironmentFile=-\\/etc\\/botsquad\\/environment/a EnvironmentFile=/etc/botsquad/discussions-$suffix" \
    /etc/systemd/system/botsquad.service > "/etc/systemd/system/$unit.service"
systemctl daemon-reload
systemctl start "$unit"
