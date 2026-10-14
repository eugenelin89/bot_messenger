#!/usr/bin/env bash
set -euo pipefail
umask 077
candidate=5691504d6ebc39f7d639ec9a4fd2d00511a1ef57
old=d262a8dff59ab82587bd6444b083e5e9b7603cf0
stage=/var/tmp/botsquad-ask-launch-20261014-hq
backup=/var/backups/botsquad/ask-upgrade-20261014T054843Z
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
cd /opt/botsquad
test "$(git rev-parse HEAD)" = "$old"
test "$(systemctl show botsquad -p MainPID --value)" = 0
test "$(systemctl show botsquad -p ActiveState --value)" = inactive
test -f "$backup/company-schema25.sqlite"
test ! -e /var/lib/botsquad-publication-custody/initialized
test ! -e /var/lib/botsquad-publication-custody/checkpoint.json
install -d -o root -g botsquad -m 750 /etc/botsquad-ask-launch
mv /etc/botsquad/ask-configuration.json /etc/botsquad-ask-launch/ask-configuration.json
mv /etc/botsquad/publication-restart.json /etc/botsquad-ask-launch/publication-restart.json
sudo -H -u botsquad test -r /etc/botsquad-ask-launch/publication-restart.json
sudo -H -u botsquad env GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=/opt/botsquad /opt/botsquad-runtime/node/bin/node "$stage/dist/scripts/publication-clean-restart.js" /etc/botsquad-ask-launch/publication-restart.json /var/lib/botsquad /opt/botsquad "$old" > "$backup/handoff-prepared.json"
# Copy the compiled artifact already validated on Linux, never invoke a model/build here.
umask 022
git checkout --detach "$candidate"
newdist=/opt/botsquad/dist-ask-launch
mkdir "$newdist"
cp -a "$stage/dist/." "$newdist/"
chown -R root:root "$newdist"
chmod -R a+rX,go-w "$newdist"
mv dist "$backup/old-dist-tree"
mv "$newdist" dist
umask 077
printf 'BOT_DEPLOYED_SHA=%s\n' "$candidate" > /etc/botsquad/deployment
cat > /etc/systemd/system/botsquad.service.d/60-ask-launch.conf <<'EOF'
[Service]
Environment=BOTSQUAD_ASK_CONFIG=/etc/botsquad-ask-launch/ask-configuration.json
Environment=BOTSQUAD_PUBLICATION_RESTART=/etc/botsquad-ask-launch/publication-restart.json
ReadWritePaths=/var/lib/botsquad-publication-custody
MemorySwapMax=0
LimitCORE=0
EOF
systemctl daemon-reload
systemctl start botsquad.service
for attempt in {1..30}; do
 if curl --fail --silent http://127.0.0.1:4310/api/health > "$backup/health.json"; then break; fi
 sleep 1
done
python3 - "$backup" "$candidate" <<'PY'
import json,sys,sqlite3,pathlib,urllib.request,subprocess,hashlib,datetime
b=pathlib.Path(sys.argv[1]);r=json.loads((b/'health.json').read_text());assert r['alive'] and r['database'] and r['dispatcher'] and r['commit']==sys.argv[2]
c=sqlite3.connect('file:/var/lib/botsquad/company.sqlite?mode=ro',uri=True);c.row_factory=sqlite3.Row
assert c.execute('SELECT max(version) FROM schema_migrations').fetchone()[0]==29
assert c.execute('PRAGMA integrity_check').fetchone()[0]=='ok';assert not c.execute('PRAGMA foreign_key_check').fetchall()
assert c.execute("SELECT count(*) FROM investment_public_controls WHERE action='clean_restart_reconciled'").fetchone()[0]==1
q=dict(c.execute("SELECT generation,reconciled_generation FROM investment_public_channels WHERE id='6790c271ea4b4246c22607c59da5ba683a9aa6777309505b'").fetchone());assert q=={'generation':'1','reconciled_generation':'1'}
assert c.execute("SELECT count(*) FROM investment_public_results WHERE detail IN ('clean_restart_receipt','clean_restart_current_watermark') AND state='delivered'").fetchone()[0]==2
with urllib.request.urlopen('http://127.0.0.1:4310/api/ask') as f:ask=json.load(f)
assert ask['state']=='disabled' and ask['installed'] is False and ask['closed'] is True
security=subprocess.check_output(['systemctl','show','botsquad','-p','MainPID,ActiveState,MemorySwapMax,LimitCORE'],text=True).splitlines()
sv=dict(x.split('=',1) for x in security);assert sv['ActiveState']=='active' and int(sv['MainPID'])>0 and sv['MemorySwapMax']=='0' and sv['LimitCORE']=='0'
permit=json.loads(pathlib.Path('/var/lib/botsquad-publication-custody/checkpoint.json').read_text());assert permit['state']=='completed'
r={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'health':r,'ask':ask,'channel':q,'restartPermitState':permit['state'],'backup':str(b),'service':security}
(b/'upgrade-result.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
PY
