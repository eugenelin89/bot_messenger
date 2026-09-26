#!/usr/bin/env bash
# Run on the bootstrapped host as root. Uses the installed service's restrictions.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as root on the Ubuntu acceptance host' >&2; exit 1; }
mode=${1:?Usage: validate-ubuntu-host.sh deterministic|prompt01|engineering}
wait_mode=${2:-}
[[ -z $wait_mode || $wait_mode == --wait ]] || exit 2
case "$mode" in
  deterministic) command='BOT_IDENTITY_BACKEND=development node --test dist/test/*.test.js' ;;
  prompt01) command='node dist/scripts/real-e2e.js' ;;
  engineering) command='node dist/scripts/real-engineering.js' ;;
  identity) command='BOT_VALIDATE_IDENTITIES=1 node dist/scripts/real-engineering.js' ;;
  *) echo 'Unknown validation mode' >&2; exit 2 ;;
esac
unit=botsquad-validation-${mode}
if systemctl is-active --quiet "$unit"; then echo 'This validation is already active' >&2; exit 1; fi
stamp=$(date -u +%Y%m%dT%H%M%SZ)
report=/var/lib/botsquad/validation/${mode}-${stamp}
runner=/run/botsquad-validation-${mode}
[[ ! -e $report ]] || { echo 'Validation directory already exists; preserve prior evidence' >&2; exit 1; }
install -d -o botsquad -g botsquad -m 700 "$report"
install -d -o root -g root -m 755 "$runner"
cat > "$runner/run" <<EOF
#!/usr/bin/env bash
set -euo pipefail
export BOT_VALIDATION_DIR='$report'
export BOT_VALIDATION_AI_PROFILES=1
export BOT_VALIDATION_MODEL=gpt-6-sol
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
# Keep all production restrictions, changing only entrypoint/restart/deadline.
sed -e "s|^ExecStart=.*|ExecStart=/bin/bash $runner/run|" \
  -e 's/^Restart=.*/Restart=no/' \
  -e '/^\[Install\]/,$d' /etc/systemd/system/botsquad.service > "/run/systemd/system/$unit.service"
printf 'RuntimeMaxSec=30min\n' >> "/run/systemd/system/$unit.service"
systemctl daemon-reload
systemctl start "$unit"
printf 'Unit: %s\nEvidence: %s\n' "$unit" "$report"
if [[ $wait_mode == --wait ]]; then
  while systemctl is-active --quiet "$unit"; do sleep 1; done
  tail -n 12 "$report/console.log"
  [[ -f $report/exit-code && $(cat "$report/exit-code") == 0 ]]
fi
