#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 && ${BOT_VALIDATION_COMPUTER:-} == 1 ]] || exit 2
state=/var/lib/botsquad/validation/mandates-p09-prompt10
source=/opt/botsquad-prompt10
unit=botsquad-computer-regression
[[ ! -e $state && ! -e /etc/systemd/system/$unit.service && -z $(ss -H -lnt 'sport = :4318') ]] || exit 1
install -d -o botsquad -g botsquad -m 700 "$state"
printf '{"purpose":"Prompt 09 isolated real company operating loop","regression":"Prompt 10 development snapshot"}\n' > "$state/validation-manifest.json"
chown botsquad:botsquad "$state/validation-manifest.json"
chmod 600 "$state/validation-manifest.json"
cat > /etc/botsquad/computer-regression <<ENV
BOT_DATA_DIR=$state
PORT=4318
BOT_VALIDATION_MANDATES=1
BOT_DEPLOYED_SHA=unknown
CODEX_BIN=$source/node_modules/.bin/codex
ENV
chmod 600 /etc/botsquad/computer-regression
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source|" -e "s|^ExecStart=.*|ExecStart=/opt/botsquad-runtime/node/bin/node $source/dist/scripts/mandates/server.js|" -e 's/^Restart=.*/Restart=no/' -e '/^EnvironmentFile=-\/etc\/botsquad\/environment/a EnvironmentFile=/etc/botsquad/computer-regression' /etc/systemd/system/botsquad.service > /etc/systemd/system/$unit.service
systemctl daemon-reload
systemctl start "$unit"
