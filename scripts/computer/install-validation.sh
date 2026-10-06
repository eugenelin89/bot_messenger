#!/usr/bin/env bash
# Explicit root-owned isolated validation services, never retained HQ state.
set -euo pipefail
[[ $EUID -eq 0 && ${BOT_VALIDATION_COMPUTER:-} == 1 ]] || exit 2
source_dir=/opt/botsquad-prompt10
state_dir=/var/lib/botsquad/validation/computer-20261005-worker
records_dir=/var/lib/botsquad/validation/computer-20261005-records
[[ -f $source_dir/dist/scripts/computer/server.js && -f $source_dir/dist/src/computer/broker.js ]] || exit 1
[[ ! -e $state_dir/company.sqlite && ! -e /etc/systemd/system/botsquad-computer-validation.service ]] || { echo 'Existing validation retained; inspect before reuse' >&2; exit 1; }
[[ -z $(ss -H -lnt 'sport = :4314') && -z $(ss -H -lnt 'sport = :43991') && -z $(ss -H -lnt 'sport = :43992') ]] || exit 1
install -d -o botsquad -g botsquad -m 700 "$state_dir" "$records_dir"
printf '{"purpose":"C10-1 isolated real worker","source":"development snapshot; exact commit confirmation required"}\n' > "$state_dir/validation-manifest.json"
chown botsquad:botsquad "$state_dir/validation-manifest.json"
chmod 600 "$state_dir/validation-manifest.json"
install -d -o botsquad-browser -g botsquad -m 2750 /run/botsquad-browser
sed -e "s|/opt/botsquad/|$source_dir/|g" -e "s|^WorkingDirectory=.*|WorkingDirectory=$source_dir|" -e 's|control.sock|prompt10.sock|' "$source_dir/deploy/systemd/botsquad-browser.service" > /etc/systemd/system/botsquad-computer-browser-validation.service
cat > /etc/botsquad/computer-validation <<ENV
BOT_DATA_DIR=$state_dir
PORT=4314
BOT_VALIDATION_COMPUTER=1
BOT_DEPLOYED_SHA=unknown
BOT_COMPUTER_FIXTURES=["http://127.0.0.1:43991"]
BOT_BROWSER_SOCKET=/run/botsquad-browser/prompt10.sock
CODEX_BIN=$source_dir/node_modules/.bin/codex
ENV
chmod 600 /etc/botsquad/computer-validation
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source_dir|" -e "s|^ExecStart=.*|ExecStart=/opt/botsquad-runtime/node/bin/node $source_dir/dist/scripts/computer/server.js|" -e 's/^Restart=.*/Restart=no/' -e '/^EnvironmentFile=-\/etc\/botsquad\/environment/a EnvironmentFile=/etc/botsquad/computer-validation' /etc/systemd/system/botsquad.service > /etc/systemd/system/botsquad-computer-validation.service
cat > /etc/systemd/system/botsquad-computer-fixture.service <<UNIT
[Unit]
Description=C10-1 disposable fixture and forbidden request recorder
[Service]
User=botsquad
Group=botsquad
WorkingDirectory=$source_dir
ExecStart=/opt/botsquad-runtime/node/bin/node $source_dir/scripts/computer/fixture.mjs
Environment=BOT_VALIDATION_COMPUTER=1
Environment=BOT_COMPUTER_RECORDS=$records_dir
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ReadWritePaths=$records_dir
MemoryMax=64M
TasksMax=16
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl start botsquad-computer-browser-validation botsquad-computer-fixture
# Start HQ separately after scripted browser checks to preserve explicit evidence.
echo 'Isolated broker and fixtures ready; no production state changed.'
