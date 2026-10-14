#!/usr/bin/env bash
set -euo pipefail
umask 077
candidate=${1:?Exact merged main required}
[[ $candidate =~ ^[0-9a-f]{40}$ && $EUID == 0 ]]
old=d262a8dff59ab82587bd6444b083e5e9b7603cf0
stage=/var/tmp/botsquad-ask-launch-20261014-hq
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
cd /opt/botsquad
test "$(git rev-parse HEAD)" = "$old"
test -z "$(git status --porcelain)"
test "$(sudo -H -u botsquad env GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=/opt/botsquad git -C /opt/botsquad rev-parse HEAD)" = "$old"
git fetch origin main
test "$(git rev-parse origin/main)" = "$candidate"
git merge-base --is-ancestor "$old" "$candidate"
python3 - "$candidate" "$stage" <<'PY'
import subprocess,pathlib,hashlib,sys,sqlite3,datetime,shutil
assert shutil.disk_usage('/opt/botsquad').free >= 15_000_000_000
mem=dict(line.split(':',1) for line in pathlib.Path('/proc/meminfo').read_text().splitlines());assert int(mem['MemAvailable'].split()[0]) >= 786432
sha,stage=sys.argv[1:];root=pathlib.Path(stage)
# Every compiled source/asset/dependency description equals the exact merged tree.
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',sha],text=True).splitlines()
selected=[p for p in paths if p.startswith(('src/','scripts/','public/','contracts/','adapters/')) or p in ['package.json','package-lock.json','tsconfig.json']]
for p in selected:
 expected=subprocess.check_output(['git','show',sha+':'+p]);assert (root/p).read_bytes()==expected,p
assert datetime.datetime.now(datetime.timezone.utc)<datetime.datetime(2026,10,14,10,45,tzinfo=datetime.timezone.utc)
c=sqlite3.connect('file:/var/lib/botsquad/company.sqlite?mode=ro',uri=True)
assert c.execute("SELECT count(*) FROM executions WHERE status='running'").fetchone()[0]==0
assert c.execute('SELECT count(*) FROM execution_runtime_attempts WHERE unresolved=1').fetchone()[0]==0
assert c.execute("SELECT count(*) FROM investment_loop_occurrences WHERE state='running'").fetchone()[0]==0
assert c.execute("SELECT count(*) FROM investment_public_jobs WHERE state<>'delivered' OR needs_receipt<>0").fetchone()[0]==0
assert c.execute('SELECT max(version) FROM schema_migrations').fetchone()[0]==25
assert c.execute('PRAGMA quick_check').fetchone()[0]=='ok'
assert not pathlib.Path('/var/lib/botsquad-publication-custody').exists()
assert not pathlib.Path('/etc/botsquad-ask-launch/ask-configuration.json').exists()
assert not pathlib.Path('/etc/botsquad-ask-launch/publication-restart.json').exists()
print('Exact merged source and quiescence preflight passed:',len(selected),'inputs')
PY
backup=/var/backups/botsquad/ask-upgrade-$(date -u +%Y%m%dT%H%M%SZ)
install -d -o root -g root -m 700 "$backup"
# Retained source/build recovery artifacts; not an automatic schema downgrade.
# After schema29 or new receipts, repair forward and retain all spent custody.
# Do not rerun this first-only script or restore old Company/custody to clear a failure.
# No provider/signing credentials are copied.
tar -cpf "$backup/old-dist.tar" dist
cp /etc/botsquad/deployment "$backup/deployment"
cp /etc/systemd/system/botsquad.service "$backup/botsquad.service"
cp -a /etc/systemd/system/botsquad.service.d "$backup/service-dropins"
printf '%s\n' "$old" > "$backup/previous-sha"
printf '%s\n' "$candidate" > "$backup/target-sha"
# A fully stopped service is required before backup or one-use handoff.
systemctl stop botsquad.service
test "$(systemctl show botsquad -p MainPID --value)" = 0
test "$(systemctl show botsquad -p ActiveState --value)" = inactive
python3 - "$backup" <<'PY'
import sqlite3,pathlib,sys,hashlib,json,datetime
b=pathlib.Path(sys.argv[1]);source=sqlite3.connect('file:/var/lib/botsquad/company.sqlite?mode=ro',uri=True)
out=sqlite3.connect(str(b/'company-schema25.sqlite'));source.backup(out);out.close();source.close()
j=sqlite3.connect('file:/var/lib/botsquad/.botsquad/finite-hq-authority/authority.sqlite?mode=ro',uri=True)
out=sqlite3.connect(str(b/'finite-authority.sqlite'));j.backup(out);out.close();j.close()
p=pathlib.Path('/var/lib/botsquad/.botsquad/finite-hq-custody/checkpoint.json');(b/'finite-checkpoint.json').write_bytes(p.read_bytes())
for p in b.iterdir():
 if p.is_file():p.chmod(0o600)
f={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in b.iterdir() if p.is_file()}
(b/'backup-manifest.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':f,'credentialsCopied':False,'restoringSpentAuthorityPermitted':False},indent=2))
PY
install -d -o botsquad -g botsquad -m 700 /var/lib/botsquad-publication-custody
install -d -o root -g botsquad -m 750 /etc/botsquad-ask-launch
python3 - "$candidate" <<'PY'
import os,json,pwd,pathlib,sys
u=pwd.getpwnam('botsquad')
values={'/etc/botsquad-ask-launch/ask-configuration.json':{'version':1,'enabled':False},'/etc/botsquad-ask-launch/publication-restart.json':{'version':1,'directory':'/var/lib/botsquad-publication-custody','channelId':'6790c271ea4b4246c22607c59da5ba683a9aa6777309505b','targetSha':sys.argv[1],'publicationConfig':'/var/lib/botsquad/.botsquad/observed-publication/configuration.json'}}
for p,v in values.items():
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w') as f:json.dump(v,f);f.flush();os.fsync(f.fileno())
 os.chown(p,u.pw_uid,u.pw_gid)
PY
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
