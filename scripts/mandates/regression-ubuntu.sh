#!/usr/bin/env bash
# Run a bounded existing regression against an exact isolated Prompt 09 installation.
set -euo pipefail
[[ $EUID -eq 0 && $# -eq 3 && $1 =~ ^[0-9a-f]{40}$ && $2 =~ ^[a-z0-9-]{1,28}$ ]] || { echo 'Usage: regression-ubuntu.sh EXACT_SHA OWNED_LABEL deterministic|prompt01|identity|projects|recovery' >&2; exit 2; }
revision=$1
validation_label=$2
mode=$3
source_root=/opt/botsquad-mandates-$validation_label
case "$mode" in
 deterministic) command='BOT_IDENTITY_BACKEND=development node --test dist/test/*.test.js' ;;
 prompt01) command='node dist/scripts/real-e2e.js' ;;
 identity) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_IDENTITY_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-engineering.js' ;;
 projects) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_PROJECT_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-projects.js' ;;
 recovery) command='node dist/scripts/real-identity-recovery.js' ;;
 *) exit 2 ;;
esac
[[ $(git -C "$source_root" rev-parse HEAD) == "$revision" ]]
unit=botsquad-p09-regression-$validation_label-$mode
[[ ! -e /run/systemd/system/$unit.service ]] || { echo 'Preserve existing regression installation' >&2; exit 1; }
stamp=$(date -u +%Y%m%dT%H%M%SZ)
report=/var/lib/botsquad/validation/$mode-prompt09-$validation_label-$stamp
runner=/run/$unit
[[ ! -e $report && ! -e $runner ]] || exit 1
install -d -o botsquad -g botsquad -m 700 "$report"
install -d -o root -g root -m 755 "$runner"
cat > "$runner/run" <<RUN
#!/usr/bin/env bash
set -euo pipefail
export BOT_VALIDATION_DIR='$report'
export BOT_VALIDATION_AI_PROFILES=1
export BOT_VALIDATION_MODEL=gpt-6-sol
unset BOT_VALIDATION_CONVERSATIONS BOT_VALIDATION_RESEARCH BOT_VALIDATION_DISCUSSIONS BOT_VALIDATION_MANDATES BOT_DATA_DIR PORT
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
sed -e "s|^ExecStart=.*|ExecStart=/bin/bash $runner/run|" -e '/^\[Install\]/,$d' \
 "/etc/systemd/system/botsquad-mandates-$validation_label.service" > "/run/systemd/system/$unit.service"
printf 'RuntimeMaxSec=30min\n' >> "/run/systemd/system/$unit.service"
systemctl daemon-reload
systemctl start "$unit"
printf 'Unit: %s\nEvidence: %s\nRevision: %s\n' "$unit" "$report" "$revision"
