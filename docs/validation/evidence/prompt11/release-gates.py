#!/usr/bin/python3
"""Read-only production Prompt 11 release gate. Prints bounded non-secret facts."""
import hashlib,json,os,pathlib,pwd,sqlite3,subprocess,sys,time,urllib.request
assert os.geteuid()==0
expected=sys.argv[1];assert len(expected)==40 and all(x in '0123456789abcdef' for x in expected)
def run(*args):return subprocess.check_output(args,text=True).strip()
root=pathlib.Path('/opt/botsquad');sha=run('git','-C',str(root),'rev-parse','HEAD');assert sha==expected
assert not run('git','-C',str(root),'status','--porcelain','--untracked-files=no')
db=sqlite3.connect('file:/var/lib/botsquad/company.sqlite?mode=ro',uri=True);db.row_factory=sqlite3.Row
assert db.execute('pragma integrity_check').fetchone()[0]=='ok';assert not list(db.execute('pragma foreign_key_check'))
names=['workers','tasks','executions','standing_grants','worker_os_identities','mandates','operating_cycles','review_schedules','review_occurrences','computer_sessions','computer_grants','computer_contexts','computer_intents','computer_evidence','business_grants','business_evidence','business_snapshots','external_actions','business_approvals','business_attempts','business_receipts','business_reads','business_controls','business_reconciliations']
counts={n:db.execute('SELECT count(*) FROM '+n).fetchone()[0] for n in names}
assert db.execute('SELECT max(version) FROM schema_migrations').fetchone()[0]==14
assert counts['workers']==8 and counts['tasks']==48 and counts['executions']==65
assert counts['standing_grants']==1 and counts['worker_os_identities']==7
assert all(counts[n]==0 for n in names[6:])
assert db.execute("SELECT count(*) FROM workers WHERE role='computer_operator'").fetchone()[0]==0
assert db.execute("SELECT count(*) FROM executions WHERE status='running'").fetchone()[0]==0
assert db.execute("SELECT count(*) FROM tasks WHERE status IN ('queued','assigned','running','working')").fetchone()[0]==0
pause=db.execute("SELECT value FROM settings WHERE key='paused'").fetchone()[0];assert pause=='false'
workers=[dict(r) for r in db.execute('SELECT worker_id,display_name,role,status,enabled FROM workers ORDER BY rowid')];assert all(w['enabled']==1 and w['status']=='idle' for w in workers)
grants=[dict(r) for r in db.execute('SELECT worker_id,capability,modes,revoked_at FROM standing_grants')];assert grants[0]['capability']=='public_research' and grants[0]['revoked_at'] is None
with urllib.request.urlopen('http://127.0.0.1:4310/api/health',timeout=5) as r:health=json.load(r)
assert health['commit']==expected and health['runtime']=='ready' and health['alive'] and health['database'] and health['dispatcher']
assert run('systemctl','is-active','botsquad.service')=='active'
assert run('systemctl','is-active','botsquad-browser.service')=='active'
pid=int(run('systemctl','show','botsquad','-p','MainPID','--value'))
process_env=pathlib.Path('/proc')
environment=(process_env/str(pid)/'environ').read_bytes().split(b'\0')
assert not any(e.startswith(b'BOTSQUAD_BUSINESS_CONFIG=') and e.split(b'=',1)[1] for e in environment)
assert not any(e.startswith(b'BOT_VALIDATION_') and e.split(b'=',1)[1] for e in environment)
assert os.readlink(process_env/str(pid)/'exe')==str(pathlib.Path('/opt/botsquad-runtime/node/bin/node').resolve())
listener=run('ss','-H','-lnt','sport = :4310');assert [line.split()[3] for line in listener.splitlines()]==['127.0.0.1:4310'],listener
browser_uid=pwd.getpwnam('botsquad-browser').pw_uid;processes=[]
for p in pathlib.Path('/proc').iterdir():
 if not p.name.isdigit():continue
 try:
  if p.stat().st_uid!=browser_uid:continue
  exe=os.readlink(p/'exe');processes.append({'pid':int(p.name),'executable':exe})
 except (FileNotFoundError,PermissionError):pass
assert len(processes)==1 and processes[0]['executable']==str(pathlib.Path('/opt/botsquad-runtime/node/bin/node').resolve()),processes
manifest={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for d in ['dist','public'] for p in sorted((root/d).rglob('*')) if p.is_file()}
manifest_hash=hashlib.sha256(json.dumps(manifest,sort_keys=True,separators=(',',':')).encode()).hexdigest()
print(json.dumps({'at':time.time(),'source_revision':sha,'schema':14,'business_provider_configured':False,'validation_mode':False,'health':health,'counts':counts,'workers':workers,'pause':pause,'research_grants':grants,'computer_operators':0,'integrity':'ok','foreign_keys':'ok','listener':listener,'service_main_pid':int(run('systemctl','show','botsquad','-p','MainPID','--value')),'browser_uid_processes':processes,'chromium_processes':0,'build_files':len(manifest),'build_manifest_sha256':manifest_hash,'browser_unit_sha256':hashlib.sha256(pathlib.Path('/etc/systemd/system/botsquad-browser.service').read_bytes()).hexdigest(),'hq_unit_sha256':hashlib.sha256(pathlib.Path('/etc/systemd/system/botsquad.service').read_bytes()).hexdigest()},indent=2))
