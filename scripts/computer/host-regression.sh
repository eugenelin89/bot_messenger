#!/usr/bin/env bash
# Existing Linux acceptance runners under the exact HQ confinement, isolated state.
set -euo pipefail
[[ $EUID -eq 0 && ${BOT_VALIDATION_COMPUTER:-} == 1 && $# -eq 1 ]] || exit 2
mode=$1
case "$mode" in
 deterministic) command='BOT_IDENTITY_BACKEND=development node --test dist/test/*.test.js';;
 identity) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_IDENTITY_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-engineering.js';;
 projects) command='BOT_VALIDATE_IDENTITIES=1 BOT_VALIDATE_PROJECT_PROBES=1 BOT_VALIDATION_ENGINEERING_BARRIER=1 node dist/scripts/real-projects.js';;
 recovery) command='node dist/scripts/real-identity-recovery.js';;
 *) exit 2;;
esac
unit=botsquad-computer-regression-$mode
source=/opt/botsquad-prompt10
report=/var/lib/botsquad/validation/computer-20261005-regression-$mode
[[ $mode == deterministic ]] || report=/var/lib/botsquad/validation/$mode-prompt10-20261005
run=${BOT_COMPUTER_REGRESSION_RUN:-}
if [[ -n $run ]]; then
  [[ $run =~ ^[2-9][0-9]*$ ]] || exit 2
  unit=$unit-$run
  report=$report-$run
fi
runner=/run/$unit
[[ ! -e $report && ! -e $runner && -f $source/dist/src/main.js ]] || exit 1
install -d -o botsquad -g botsquad -m 700 "$report"
install -d -o root -g root -m 755 "$runner"
git -C "$source" rev-parse HEAD > "$report/source-revision"
chmod 644 "$report/source-revision"
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
sed -e "s|^WorkingDirectory=.*|WorkingDirectory=$source|" -e "s|^ExecStart=.*|ExecStart=/bin/bash $runner/run|" -e 's/^Restart=.*/Restart=no/' -e '/^\[Install\]/,$d' /etc/systemd/system/botsquad.service > /run/systemd/system/$unit.service
printf 'RuntimeMaxSec=30min\n' >> /run/systemd/system/$unit.service
systemctl daemon-reload
systemctl start "$unit"
if [[ $mode == identity || $mode == projects ]]; then
 companion=validate-identity-operator.py
 [[ $mode != projects ]] || companion=validate-projects-operator.py
 systemd-run --quiet --unit="$unit-operator" --property=Type=exec --property=RuntimeMaxSec=30min --property="StandardOutput=append:$report/operator-console.log" --property="StandardError=append:$report/operator-console.log" /usr/bin/python3 "$source/scripts/$companion" "$report"
fi
printf 'Unit: %s\nEvidence: %s\n' "$unit" "$report"
