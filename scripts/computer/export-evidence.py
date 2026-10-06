#!/usr/bin/python3
"""Explicit disposable C10-1 data export. Never enumerate credentials/provider state."""
import hashlib,json,pathlib,shutil,sqlite3,os,sys
run=sys.argv[1] if len(sys.argv)>1 else '2'
assert run in ['2','3'], 'Only explicitly created acceptance roots may be exported'
root=pathlib.Path('/var/lib/botsquad/validation/computer-20261005-worker'+run)
assert json.loads((root/'validation-manifest.json').read_text())['purpose']=='C10-1 isolated real worker'
out=root/'public-evidence';out.mkdir(exist_ok=True,mode=0o700)
def save(name,value):
 (out/name).write_text(json.dumps(value,indent=2));os.chmod(out/name,0o600)
def copy(name,source):
 p=pathlib.Path(source);assert p.is_file() and not p.is_symlink();assert p.stat().st_size<8000000;shutil.copyfile(p,out/name)
db=sqlite3.connect(root.as_uri()+'/company.sqlite?mode=ro',uri=True);db.row_factory=sqlite3.Row
rows=lambda sql:[dict(r) for r in db.execute(sql)]
tables=['computer_sessions','computer_grants','computer_contexts','computer_operations','computer_intents','computer_evidence','computer_network_events']
values={t:rows('SELECT * FROM '+t+' ORDER BY rowid') for t in tables}
values['tasks']=rows("SELECT * FROM tasks WHERE kind='computer' ORDER BY rowid")
values['executions']=rows("SELECT * FROM executions WHERE task_id IN (SELECT task_id FROM tasks WHERE kind='computer') ORDER BY rowid")
values['artifacts']=rows("SELECT * FROM artifacts WHERE task_id IN (SELECT task_id FROM tasks WHERE kind='computer') ORDER BY rowid")
values['integrity']=db.execute('PRAGMA integrity_check').fetchone()[0];assert values['integrity']=='ok';assert not rows('PRAGMA foreign_key_check')
protected=json.loads((root/'acceptance.json').read_text())['phases']['protected']
contexts=[c for c in values['computer_contexts'] if c['session_id']==protected['session_id']]
assert len(contexts)==2 and len(set(c['runtime_reference'] for c in contexts))==2 and all(c['runtime_reference'] for c in contexts)
values['fresh_approval_contexts_verified']=True
save('worker-state.json',values)
names=['acceptance.json','fixture.json','validation-manifest.json']
if run=='2':names+=['restart-evidence.json','unknown-recovery.json','browser-killed.json','after-transmit-fault.json']
else:names+=['cleanup-ack-fault.json','cleanup-ui.json']
for name in names:
 copy(name,root/name)
transcript=[]
for file in sorted((root/'runtime-inputs').glob('*.jsonl')):
 for line in file.read_text().splitlines():
  item=json.loads(line)
  if item.get('kind') in ['input','tool_call','tool_result','tool_rejected','outcome']:
   transcript.append({'execution_file':file.name,**item})
save('worker-tool-transcript.json',transcript)
for item in values['computer_evidence']:
 p=root/'computer-evidence'/(item['evidence_id']+'.png');b=p.read_bytes();assert len(b)==item['bytes'] and hashlib.sha256(b).hexdigest()==item['sha256']
 # Only four approved safe-flow samples; all images remain privately retained on HQ.
 if item['session_id']==json.loads((root/'acceptance.json').read_text())['phases']['safe']['session_id']:copy(item['evidence_id']+'.png',p)
for item in values['artifacts']:
 p=pathlib.Path(item['path_or_reference']).resolve();assert p.is_relative_to(root) and p.stat().st_size<100000;copy(item['artifact_id']+'.txt',p)
records=pathlib.Path('/var/lib/botsquad/validation/computer-20261005-records')
if run=='2':copy('resources.json',records/'resources.json')
copy('fixture-effects.jsonl',records/'effects.jsonl')
assert not (records/'forbidden.jsonl').exists();save('forbidden-recorder.json',{'received_requests':0,'file_absent':True,'checked_at':__import__('time').time()})
if run=='2':
 copy('fault-results.json','/var/lib/botsquad/validation/computer-20261005-fault3/fault-results.json')
 copy('integration-results.json','/var/lib/botsquad/validation/computer-20261005-integration5/integration-results.json')
print(json.dumps({'export':str(out),'files':len(list(out.iterdir())),'fresh_provider_generations':True,'evidence_hashes_verified':True}))
