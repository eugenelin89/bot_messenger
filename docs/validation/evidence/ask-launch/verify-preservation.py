import sqlite3,pathlib,hashlib,json,subprocess,datetime,urllib.request,sys
backup=pathlib.Path(sys.argv[1]);candidate=sys.argv[2]
def conn(p):
 c=sqlite3.connect('file:'+str(p)+'?mode=ro',uri=True);c.row_factory=sqlite3.Row;c.execute('PRAGMA query_only=ON');c.execute('BEGIN');return c
a=conn(backup/'company-schema25.sqlite');b=conn('/var/lib/botsquad/company.sqlite')
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
allowed={'schema_migrations','investment_public_channels','investment_public_attempts','investment_public_results','investment_public_controls','investment_public_jobs','workers'}
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
assert len(newtables)==13 and all(b.execute('SELECT count(*) FROM "'+t+'"').fetchone()[0]==0 for t in newtables)
fa=conn(backup/'finite-authority.sqlite');fb=conn('/var/lib/botsquad/.botsquad/finite-hq-authority/authority.sqlite')
ft=[x[0] for x in fa.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
assert all(data(fa,t)==data(fb,t) for t in ft if t!='events'),'finite metadata changed'
oldEvents,newEvents=data(fa,'events'),data(fb,'events');assert newEvents[:len(oldEvents)]==oldEvents
addedEvents=newEvents[len(oldEvents):];assert [x['kind'] for x in addedEvents]==['hold','resume']
assert json.loads(addedEvents[0]['payload'])=={'authorityId':'observed_415ad15f-ecda-4c53-8a41-4b22eee02acb','cause':'recovery','reason':'Recovery requires exact owner resume of eligible future work'}
assert json.loads(addedEvents[1]['payload'])=={'authorityId':'observed_415ad15f-ecda-4c53-8a41-4b22eee02acb'}
checkpoint=pathlib.Path('/var/lib/botsquad/.botsquad/finite-hq-custody/checkpoint.json')
priorCheckpoint=json.loads((backup/'finite-checkpoint.json').read_text());currentCheckpoint=json.loads(checkpoint.read_text());assert currentCheckpoint['epoch']==priorCheckpoint['epoch'] and currentCheckpoint['sequence']==priorCheckpoint['sequence']+2 and currentCheckpoint['digest']==addedEvents[-1]['digest'] and addedEvents[0]['previous']==priorCheckpoint['digest'] and addedEvents[1]['previous']==addedEvents[0]['digest']
sha=subprocess.check_output(['git','-C','/opt/botsquad','rev-parse','HEAD'],text=True).strip();assert sha==candidate
assert not subprocess.check_output(['git','-C','/opt/botsquad','status','--porcelain'],text=True).strip()
parts={}
for folder in ['dist','public']:
 def hashes(root):return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
 x=hashes(pathlib.Path('/opt/botsquad')/folder);y=hashes(pathlib.Path('/var/tmp/botsquad-ask-launch-20261014-hq')/folder);assert x==y,folder
 parts[folder]={'files':len(x),'matchesTestedStaging':True}
for path in ['/var/lib/botsquad-ask-private','/var/lib/botsquad-ask-authority','/var/lib/botsquad-ask-custody']:assert not pathlib.Path(path).exists(),path
r={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source':sha,'schema':29,'unchangedOldTables':same,'expectedChangedTables':changed,'newEmptyAskTables':newtables,'workerChangesOnlyStartupUpdatedAt':workerTimestampChanges,'finiteRetainedPrefixUnchanged':True,'finiteAddedEvents':addedEvents,'finiteCheckpoint':currentCheckpoint,'consumedAllowancesUnchanged':True,'compiledArtifacts':parts,'askCustodyCreated':False,'credentialsCopied':False,'selectedInvestmentTablesUnchanged':True,'noNewModelOrMarketExecution':True}
print(json.dumps(r,indent=2))
