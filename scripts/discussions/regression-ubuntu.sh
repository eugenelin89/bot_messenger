#!/usr/bin/env bash
# Proper-platform checks against the Prompt 08 checkout under inherited confinement.
set -euo pipefail
[[ $EUID -eq 0 ]] || exit 2
mode=${1:?Usage: regression-ubuntu.sh deterministic|prompt01|identity|projects|recovery}
case "$mode" in
 deterministic) command='BOT_IDENTITY_BACKEND=development node --test dist/test/*.test.js' ;;
 prompt01) command='node dist/scripts/real-e2e.js' ;;
 identity) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_IDENTITY_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-engineering.js' ;;
 projects) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_PROJECT_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-projects.js' ;;
 recovery) command='node dist/scripts/real-identity-recovery.js' ;;
 *) exit 2 ;;
esac
unit=botsquad-discussions-regression-${mode}
! systemctl is-active --quiet "$unit" || { echo 'Already active' >&2; exit 1; }
stamp=$(date -u +%Y%m%dT%H%M%SZ)
report=/var/lib/botsquad/validation/${mode}-prompt08-${stamp}
runner=/run/botsquad-discussions-regression-${mode}
[[ ! -e $report ]] || exit 1
install -d -o botsquad -g botsquad -m 700 "$report"
install -d -o root -g root -m 755 "$runner"
cat > "$runner/run" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export BOT_VALIDATION_DIR='$report'
export BOT_VALIDATION_AI_PROFILES=1
export BOT_VALIDATION_MODEL=gpt-6-sol
unset BOT_VALIDATION_CONVERSATIONS BOT_VALIDATION_RESEARCH BOT_VALIDATION_DISCUSSIONS
node dist/scripts/resource-sample.js '$report/resources.jsonl' &
sampler=\$!
trap 'kill -TERM "\$sampler" 2>/dev/null || true; wait "\$sampler" || true' EXIT
set +e
$command > '$report/console.log' 2>&1
result=\$?
printf '%s\n' "\$result" > '$report/exit-code'
exit "\$result"
EOF
chmod 755 "$runner/run"
sed -e "s|^ExecStart=.*|ExecStart=/bin/bash $runner/run|" -e '/^\[Install\]/,$d' \
 /etc/systemd/system/botsquad-discussions-validation.service > "/run/systemd/system/$unit.service"
printf 'RuntimeMaxSec=30min\n' >> "/run/systemd/system/$unit.service"
systemctl daemon-reload
systemctl start "$unit"
printf 'Unit: %s\nEvidence: %s\n' "$unit" "$report"
