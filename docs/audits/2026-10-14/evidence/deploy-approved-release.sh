#!/usr/bin/env bash
set -euo pipefail
umask 077
test "$EUID" = 0
old=846d2220791a6f1d89732a458e3521341b61f9a1
# Explicit owner approval in this audit chat, 2026-10-14.
candidate=${1:?exact reviewed merged SHA required}
stage=/var/tmp/botsquad-investment-audit-20261014
export PATH=/opt/botsquad-runtime/node/bin:/usr/bin:/bin
cd /opt/botsquad
test "$(git rev-parse HEAD)" = "$old"
test -z "$(git status --porcelain)"
git fetch origin main
test "$candidate" = 0fabbbac0a1bb8e180556bcbe837076ca341f9c3
git merge-base --is-ancestor "$candidate" origin/main
git merge-base --is-ancestor "$old" "$candidate"
python3 - "$candidate" "$stage" <<'PY'
import subprocess,pathlib,sys,sqlite3,json,shutil,datetime,hashlib
sha,stage=sys.argv[1:];root=pathlib.Path(stage)
validation=json.loads((root/'validated.json').read_text());assert validation['candidate']==sha and validation['stageExitCode']==0
for folder,expected in validation['artifacts'].items():
 actual={str(p.relative_to(root/folder)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/folder).rglob('*') if p.is_file()};assert actual==expected,folder
assert shutil.disk_usage('/opt/botsquad').free>=15_000_000_000
mem=dict(x.split(':',1) for x in pathlib.Path('/proc/meminfo').read_text().splitlines());assert int(mem['MemAvailable'].split()[0])>=786432
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',sha],text=True).splitlines()
selected=[p for p in paths if p.startswith(('src/','scripts/','public/','contracts/','adapters/')) or p in ['package.json','package-lock.json','tsconfig.json']]
for p in selected:assert (root/p).read_bytes()==subprocess.check_output(['git','show',sha+':'+p]),p
c=sqlite3.connect('file:/var/lib/botsquad/company.sqlite?mode=ro',uri=True)
assert c.execute('SELECT max(version) FROM schema_migrations').fetchone()[0]==29
assert c.execute("SELECT state,generation,plan_revision FROM investment_loops WHERE loop_id='6a8ca917-3dec-414e-ad33-a31eea6cb194'").fetchone()==('active',2,2)
assert c.execute("SELECT count(*) FROM investment_team_executions WHERE scope_id='68ab0223-32b5-4a02-a7aa-a70ee9bc20dc'").fetchone()[0]==3
assert c.execute("SELECT count(*) FROM investment_team_executions te JOIN executions e USING(execution_id) JOIN ai_usage u USING(execution_id) WHERE te.scope_id='68ab0223-32b5-4a02-a7aa-a70ee9bc20dc' AND e.status='completed' AND u.settled=1 AND u.completeness='complete'").fetchone()[0]==3
assert c.execute("SELECT count(*) FROM observed_collection_results WHERE scope_id='68ab0223-32b5-4a02-a7aa-a70ee9bc20dc'").fetchone()[0]==9
assert c.execute("SELECT count(*) FROM investment_loop_occurrences WHERE loop_id='6a8ca917-3dec-414e-ad33-a31eea6cb194' AND state='pending' AND attempts=0").fetchone()[0]==8
fdb=sqlite3.connect('file:/var/lib/botsquad/.botsquad/finite-hq-authority/authority.sqlite?mode=ro',uri=True)
assert fdb.execute("SELECT count(*) FROM events WHERE kind='approve'").fetchone()[0]==2
assert fdb.execute("SELECT count(*) FROM events WHERE kind='reserve'").fetchone()[0]==7
assert fdb.execute("SELECT count(*) FROM events WHERE kind='collection_reserve'").fetchone()[0]==18

assert c.execute("SELECT state,attempts FROM investment_loop_occurrences WHERE occurrence_id='loop_84f4d0b10d284dbf02d302e84b937e23e18e0e998c8c516e69a76fee4b68a12c'").fetchone()==('complete',1)
assert c.execute("SELECT count(*) FROM investment_team_proposals WHERE scope_id='68ab0223-32b5-4a02-a7aa-a70ee9bc20dc'").fetchone()[0]==0
assert c.execute('PRAGMA quick_check').fetchone()[0]=='ok'
assert c.execute("SELECT count(*) FROM executions WHERE status='running'").fetchone()[0]==0
assert c.execute('SELECT count(*) FROM execution_runtime_attempts WHERE unresolved=1').fetchone()[0]==0
assert c.execute("SELECT count(*) FROM investment_loop_occurrences WHERE state='running'").fetchone()[0]==0
assert c.execute("SELECT count(*) FROM investment_public_jobs WHERE state!='delivered' OR needs_receipt!=0 OR lease IS NOT NULL OR receipt IS NULL").fetchone()[0]==0
assert c.execute('SELECT count(*) FROM investment_public_attempts a LEFT JOIN investment_public_results r ON r.attempt_id=a.id WHERE r.attempt_id IS NULL').fetchone()[0]==0
assert c.execute('SELECT count(*) FROM financial_attempts a LEFT JOIN financial_attempt_results r ON r.attempt_id=a.attempt_id WHERE r.attempt_id IS NULL').fetchone()[0]==0
grant=c.execute("SELECT id,envelope FROM investment_public_grants WHERE channel_id='6790c271ea4b4246c22607c59da5ba683a9aa6777309505b' AND state='active'").fetchone();assert grant
g=json.loads(grant[1]);now=datetime.datetime.now(datetime.timezone.utc);assert now.isoformat().replace('+00:00','Z')<g['expiresAt']
attempts=c.execute('SELECT attempted_at FROM investment_public_attempts WHERE grant_id=?',(grant[0],)).fetchall();assert len(attempts)+2<=g['maxAttempts']
assert sum(datetime.datetime.fromisoformat(a[0].replace('Z','+00:00'))>now-datetime.timedelta(seconds=60) for a in attempts)+2<=g['writesPerMinute']
assert c.execute("SELECT state,generation FROM investment_loops WHERE loop_id='fa172653-d755-46df-83b5-b52becaf8821'").fetchone()==('stopped',3)
head=c.execute("SELECT head_version,head_hash FROM investment_runs WHERE run_id='observed_f78ef11e-88dd-45fe-ba47-ac6694ed184f'").fetchone();assert head[0]>5
p=json.loads(pathlib.Path('/var/lib/botsquad-publication-custody/checkpoint.json').read_text());assert p['state']=='completed'
f=json.loads(pathlib.Path('/var/lib/botsquad/.botsquad/finite-hq-custody/checkpoint.json').read_text());assert f['sequence']>77
assert c.execute("SELECT count(*) FROM investment_loop_occurrences WHERE loop_id='6a8ca917-3dec-414e-ad33-a31eea6cb194' AND plan_revision=2 AND session='2026-10-14' AND stage IN ('collect_close','open','mark') AND state='complete'").fetchone()[0]==3
assert c.execute("SELECT min(due_at) FROM investment_loop_occurrences WHERE loop_id='6a8ca917-3dec-414e-ad33-a31eea6cb194' AND state='pending'").fetchone()[0]>=(now+datetime.timedelta(minutes=10)).isoformat().replace('+00:00','Z')
(root/'predeploy-baseline.json').write_text(json.dumps({'at':now.isoformat(),'runHead':head,'finiteCheckpoint':f},indent=2));(root/'predeploy-baseline.json').chmod(0o600)
assert datetime.datetime(2026,10,14,20,26,tzinfo=datetime.timezone.utc)<=now<datetime.datetime(2026,10,14,21,30,tzinfo=datetime.timezone.utc)
print('Preflight passed; matched staged production inputs:',len(selected),flush=True)
PY
backup=/var/backups/botsquad/investment-rolling-start-$(date -u +%Y%m%dT%H%M%SZ)
install -d -o root -g root -m 700 "$backup"
cp "$stage/predeploy-baseline.json" "$backup/predeploy-baseline.json"
cp /etc/botsquad/deployment "$backup/deployment"
cp /etc/botsquad-ask-launch/publication-restart.json "$backup/previous-restart-config.json"
cp /var/lib/botsquad-publication-custody/checkpoint.json "$backup/previous-publication-permit.json"
printf '%s\n' "$old" > "$backup/previous-sha"
printf '%s\n' "$candidate" > "$backup/target-sha"
# The currently reconciled live process alone arms the next one-use permit on shutdown.
python3 - "$candidate" <<'PY'
import json,pathlib,os,sys,uuid
p=pathlib.Path('/etc/botsquad-ask-launch/publication-restart.json');v=json.loads(p.read_text());assert v['targetSha']=='846d2220791a6f1d89732a458e3521341b61f9a1';v['targetSha']=sys.argv[1]
st=p.stat();tmp=p.with_name(p.name+'.'+str(uuid.uuid4()));fd=os.open(tmp,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);os.fchown(fd,st.st_uid,st.st_gid)
with os.fdopen(fd,'w') as f:json.dump(v,f);f.flush();os.fsync(f.fileno())
os.replace(tmp,p);fd=os.open(p.parent,os.O_RDONLY);os.fsync(fd);os.close(fd)
PY
systemctl stop botsquad.service
test "$(systemctl show botsquad -p MainPID --value)" = 0
test "$(systemctl show botsquad -p ActiveState --value)" = inactive
python3 - "$backup" "$candidate" <<'PY'
import sqlite3,pathlib,sys,json,hashlib,datetime
b=pathlib.Path(sys.argv[1]);p=json.loads(pathlib.Path('/var/lib/botsquad-publication-custody/checkpoint.json').read_text());assert p['state']=='ready' and p['targetSha']==sys.argv[2] and p['claimedBy'] is None
(b/'live-shutdown-permit.json').write_text(json.dumps(p,indent=2))
for source,name in [('/var/lib/botsquad/company.sqlite','company-schema29.sqlite'),('/var/lib/botsquad/.botsquad/finite-hq-authority/authority.sqlite','finite-authority.sqlite')]:
 c=sqlite3.connect('file:'+source+'?mode=ro',uri=True);out=sqlite3.connect(str(b/name));c.backup(out);out.close();c.close()
(b/'finite-checkpoint.json').write_bytes(pathlib.Path('/var/lib/botsquad/.botsquad/finite-hq-custody/checkpoint.json').read_bytes())
for p in b.iterdir():p.chmod(0o600)
(b/'backup-manifest.json').write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in b.iterdir() if p.is_file()},'credentialsCopied':False,'restoringSpentAuthorityPermitted':False},indent=2))
print('Live shutdown handoff and stopped backup:',str(b),flush=True)
PY
# Reuse the reviewed, tested compiled stage. Do not run the first-only restart helper.
umask 022
git checkout --detach "$candidate"
newdist=/opt/botsquad/dist-investment-rolling-start
test ! -e "$newdist"
mkdir "$newdist"
cp -a "$stage/dist/." "$newdist/"
chown -R root:root "$newdist"
chmod -R a+rX,go-w "$newdist"
mv dist "$backup/old-dist-tree"
mv "$newdist" dist
umask 077
printf 'BOT_DEPLOYED_SHA=%s\n' "$candidate" > /etc/botsquad/deployment
systemctl start botsquad.service
for attempt in {1..90}; do
 if curl --max-time 3 --fail --silent http://127.0.0.1:4310/api/health > "$backup/health.json" && python3 -c 'import json,sys; h=json.load(open(sys.argv[1]));sys.exit(0 if h.get("runtime")=="ready" else 1)' "$backup/health.json"; then break; fi
 sleep 1
done
python3 - "$backup" "$candidate" <<'PY'
import json,pathlib,sys,sqlite3,subprocess,datetime
b=pathlib.Path(sys.argv[1]);h=json.loads((b/'health.json').read_text());assert h['commit']==sys.argv[2] and h['alive'] and h['database'] and h['dispatcher'] and h['runtime']=='ready'
p=json.loads(pathlib.Path('/var/lib/botsquad-publication-custody/checkpoint.json').read_text());assert p['state']=='completed' and p['targetSha']==sys.argv[2]
assert p['id']==json.loads((b/'live-shutdown-permit.json').read_text())['id']
c=sqlite3.connect('file:/var/lib/botsquad/company.sqlite?mode=ro',uri=True)
assert c.execute("SELECT count(*) FROM investment_public_controls WHERE action='clean_restart_reconciled' AND json_extract(detail,'$.permitId')=?",(p['id'],)).fetchone()[0]==1
assert c.execute("SELECT state,generation FROM investment_loops WHERE loop_id='fa172653-d755-46df-83b5-b52becaf8821'").fetchone()==('stopped',3)
assert c.execute("SELECT generation,reconciled_generation FROM investment_public_channels WHERE id='6790c271ea4b4246c22607c59da5ba683a9aa6777309505b'").fetchone()==('1','1')
assert c.execute("SELECT state,generation,plan_revision FROM investment_loops WHERE loop_id='6a8ca917-3dec-414e-ad33-a31eea6cb194'").fetchone()==('active',2,2)
baseline=json.loads((b/'predeploy-baseline.json').read_text());assert list(c.execute("SELECT head_version,head_hash FROM investment_runs WHERE run_id='observed_f78ef11e-88dd-45fe-ba47-ac6694ed184f'").fetchone())==baseline['runHead']
assert c.execute("SELECT count(*) FROM investment_team_executions WHERE scope_id='68ab0223-32b5-4a02-a7aa-a70ee9bc20dc'").fetchone()[0]==3
assert c.execute("SELECT state,attempts FROM investment_loop_occurrences WHERE occurrence_id='loop_84f4d0b10d284dbf02d302e84b937e23e18e0e998c8c516e69a76fee4b68a12c'").fetchone()==('complete',1)
fdb=sqlite3.connect('file:/var/lib/botsquad/.botsquad/finite-hq-authority/authority.sqlite?mode=ro',uri=True)
assert fdb.execute("SELECT count(*) FROM events WHERE kind='reserve'").fetchone()[0]==7
assert fdb.execute("SELECT count(*) FROM events WHERE kind='collection_reserve'").fetchone()[0]==18
r={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'health':h,'backup':str(b),'publicationPermitCompleted':True,'oldLoopStoppedSuccessorRetainedActive':True,'service':subprocess.check_output(['systemctl','show','botsquad','-p','MainPID,ActiveState,MemorySwapMax,LimitCORE'],text=True).splitlines()}
(b/'deployment-result.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
PY

# After shutdown, any failed gate requires inspection of current one-use state.
# Backups are evidence; never blindly restore custody/config/DB or restart an old SHA.
# Mandatory final preservation gate. On failure retain current state and inspect; never rewind custody.
python3 - "$backup" "$candidate" /var/lib/botsquad/investment-recovery-revised-20261014-close > "$backup/preservation-result.json" <<'PY'
import sqlite3,pathlib,hashlib,json,subprocess,datetime,urllib.request,sys
backup=pathlib.Path(sys.argv[1]);candidate=sys.argv[2];approved=json.loads(pathlib.Path(sys.argv[3],'approved.json').read_text())
def conn(p):
 c=sqlite3.connect('file:'+str(p)+'?mode=ro',uri=True);c.row_factory=sqlite3.Row;c.execute('PRAGMA query_only=ON');c.execute('BEGIN');return c
a=conn(backup/'company-schema29.sqlite');b=conn('/var/lib/botsquad/company.sqlite')
def enc(v):
 if isinstance(v,bytes):return {'binary':v.hex()}
 if isinstance(v,list):return [enc(x) for x in v]
 if isinstance(v,dict):return {k:enc(x) for k,x in v.items()}
 return v
def data(c,t):return enc([dict(x) for x in c.execute('SELECT rowid AS _rowid_,* FROM "'+t+'" ORDER BY rowid')])
def digest(v):return hashlib.sha256(json.dumps(v,sort_keys=True,separators=(',',':')).encode()).hexdigest()
tables=[x[0] for x in a.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
changed={};same=0
for t in tables:
 before,after=data(a,t),data(b,t)
 if before==after:same+=1
 else:changed[t]={'beforeRows':len(before),'afterRows':len(after),'beforeDigest':digest(before),'afterDigest':digest(after)}
# Startup schema stamps and receipt/publisher evidence are allowed; retained investment and authority are not.
allowed={'investment_public_channels','investment_public_attempts','investment_public_results','investment_public_controls','investment_public_jobs','workers'}
assert set(changed)<=allowed,changed
wa,wb=data(a,'workers'),data(b,'workers')
workerTimestampChanges=[]
for x,y in zip(wa,wb):
 workerTimestampChanges.append({'before':x['updated_at'],'after':y['updated_at']});x.pop('updated_at');y.pop('updated_at')
assert wa==wb,'worker fields other than status refresh timestamp changed'
for t in ['investment_runs','investment_journal','investment_loops','investment_loop_occurrences','investment_team_scopes','investment_team_executions','observed_investment_runs','observed_collection_results','observed_financial_evidence']:
 assert data(a,t)==data(b,t),t
oldchannels=data(a,'investment_public_channels');newchannels=data(b,'investment_public_channels')
for r in oldchannels:r.pop('publisher_instance')
for r in newchannels:r.pop('publisher_instance')
assert oldchannels==newchannels
for t in ['investment_public_attempts','investment_public_results','investment_public_controls','investment_public_jobs']:
 old,new=data(a,t),data(b,t);assert new[:len(old)]==old,t+' retained prefix changed'
newtables=[x[0] for x in b.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name") if x[0] not in tables]
assert not newtables
asktables=[t for t in tables if t.startswith('ask_')];assert all(b.execute('SELECT count(*) FROM "'+t+'"').fetchone()[0]==0 for t in asktables)
fa=conn(backup/'finite-authority.sqlite');fb=conn('/var/lib/botsquad/.botsquad/finite-hq-authority/authority.sqlite')
ft=[x[0] for x in fa.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
assert all(data(fa,t)==data(fb,t) for t in ft if t!='events'),'finite metadata changed'
oldEvents,newEvents=data(fa,'events'),data(fb,'events');assert newEvents[:len(oldEvents)]==oldEvents
addedEvents=newEvents[len(oldEvents):];assert [x['kind'] for x in addedEvents]==['hold','resume']
assert json.loads(addedEvents[0]['payload'])=={'authorityId':approved['authorityId'],'cause':'recovery','reason':'Recovery requires exact owner resume of eligible future work'}
assert json.loads(addedEvents[1]['payload'])=={'authorityId':approved['authorityId']}

checkpoint=pathlib.Path('/var/lib/botsquad/.botsquad/finite-hq-custody/checkpoint.json')
priorCheckpoint=json.loads((backup/'finite-checkpoint.json').read_text());currentCheckpoint=json.loads(checkpoint.read_text());assert currentCheckpoint['epoch']==priorCheckpoint['epoch'] and currentCheckpoint['sequence']==priorCheckpoint['sequence']+2 and currentCheckpoint['digest']==addedEvents[-1]['digest'] and addedEvents[0]['previous']==priorCheckpoint['digest']
assert b.execute('SELECT max(version) FROM schema_migrations').fetchone()[0]==29
permit=json.loads(pathlib.Path('/var/lib/botsquad-publication-custody/checkpoint.json').read_text());armed=json.loads((backup/'live-shutdown-permit.json').read_text());assert permit['id']==armed['id'] and permit['state']=='completed' and permit['targetSha']==candidate
control=b.execute("SELECT detail FROM investment_public_controls WHERE action='clean_restart_reconciled' AND json_extract(detail,'$.permitId')=?",(permit['id'],)).fetchone();assert control and digest(json.loads(control[0]))==permit['receiptDigest']
sha=subprocess.check_output(['git','-C','/opt/botsquad','rev-parse','HEAD'],text=True).strip();assert sha==candidate
assert not subprocess.check_output(['git','-C','/opt/botsquad','status','--porcelain'],text=True).strip()
parts={}
for folder in ['dist','public']:
 def hashes(root):return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
 x=hashes(pathlib.Path('/opt/botsquad')/folder);y=hashes(pathlib.Path('/var/tmp/botsquad-investment-audit-20261014')/folder);assert x==y,folder
 parts[folder]={'files':len(x),'matchesTestedStaging':True}
for path in ['/var/lib/botsquad-ask-private','/var/lib/botsquad-ask-authority','/var/lib/botsquad-ask-custody']:assert not pathlib.Path(path).exists(),path
r={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':sha,'schema':29,'unchangedOldTables':same,'expectedChangedTables':changed,'emptyAskTables':asktables,'workerChangesOnlyStartupUpdatedAt':workerTimestampChanges,'finiteRetainedPrefixUnchanged':True,'finiteAddedEvents':addedEvents,'finiteCheckpoint':currentCheckpoint,'consumedAllowancesUnchanged':True,'compiledArtifacts':parts,'askCustodyCreated':False,'credentialsCopied':False,'selectedInvestmentTablesUnchanged':True,'noNewModelOrMarketExecution':True}
print(json.dumps(r,indent=2))

PY
cat "$backup/preservation-result.json"
