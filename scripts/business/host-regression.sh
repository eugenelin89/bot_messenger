#!/usr/bin/env bash
# Explicit isolated regressions under retained HQ service confinement.
set -euo pipefail
[[ $EUID -eq 0 && $# -eq 2 && $1 =~ ^[a-z0-9-]{1,24}$ ]] || exit 2
validation_label=$1
mode=$2
case "$mode" in
 deterministic) command='BOT_IDENTITY_BACKEND=development node --test dist/test/*.test.js';;
 identity) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_IDENTITY_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-engineering.js';;
 projects) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_PROJECT_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-projects.js';;
 recovery) command='node dist/scripts/real-identity-recovery.js';;
 *) exit 2;;
esac
unit=botsquad-business-$validation_label-$mode
source_root=/opt/botsquad-business-$validation_label
report=/var/lib/botsquad/validation/business-p11-$validation_label-$mode
runner=/run/$unit
[[ ! -e $report && ! -e $runner && -f $source_root/dist/src/main.js ]] || exit 1
install -d -o botsquad -g botsquad -m 700 "$report"
install -d -o root -g root -m 755 "$runner"
git -C "$source_root" rev-parse HEAD > "$report/source-revision"
chmod 644 "$report/source-revision"
cat > "$runner/run" <<RUN
#!/usr/bin/env bash
set -euo pipefail
export BOT_VALIDATION_DIR='$report'
export BOT_BUSINESS_CREDENTIAL_TEST_ROOT='$report'
export BOT_VALIDATION_AI_PROFILES=1
unset BOT_VALIDATION_CONVERSATIONS BOT_VALIDATION_RESEARCH BOT_VALIDATION_DISCUSSIONS BOT_VALIDATION_MANDATES BOT_VALIDATION_COMPUTER BOT_VALIDATION_BUSINESS BOTSQUAD_BUSINESS_CONFIG BOT_DATA_DIR PORT
node dist/scripts/resource-sample.js '$report/resources.jsonl' &
sampler=\$!
trap 'kill -TERM "\$sampler" 2>/dev/null || true; wait "\$sampler" || true' EXIT
set +e
$command > '$report/console.log' 2>&1
result=\$?
printf '%s\n' "\$result" > '$report/exit-code'
exit "\$result"
RUN
chmod 755 "$runner/run"
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source_root|" -e "s|^ExecStart=.*|ExecStart=/bin/bash $runner/run|" -e 's/^Restart=.*/Restart=no/' -e '/^\[Install\]/,$d' /etc/systemd/system/botsquad.service > /run/systemd/system/$unit.service
printf 'RuntimeMaxSec=30min\n' >> /run/systemd/system/$unit.service
systemctl daemon-reload
systemctl start "$unit"
if [[ $mode == identity || $mode == projects ]]; then
 companion=validate-identity-operator.py
 [[ $mode != projects ]] || companion=validate-projects-operator.py
 systemd-run --quiet --unit="$unit-operator" --property=Type=exec --property=RuntimeMaxSec=30min --property="StandardOutput=append:$report/operator-console.log" --property="StandardError=append:$report/operator-console.log" /usr/bin/python3 "$source_root/scripts/$companion" "$report"
fi
printf 'Unit: %s\nEvidence: %s\n' "$unit" "$report"
