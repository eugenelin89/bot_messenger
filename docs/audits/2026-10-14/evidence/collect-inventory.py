import sqlite3,json,hashlib,datetime,os,pathlib,subprocess,urllib.request
run='observed_f78ef11e-88dd-45fe-ba47-ac6694ed184f'
c=sqlite3.connect('file:/var/lib/botsquad/company.sqlite?mode=ro',uri=True);c.row_factory=sqlite3.Row;c.execute('PRAGMA query_only=ON');c.execute('BEGIN')
def rows(q,*args):return [dict(x) for x in c.execute(q,args)]
def parse(r,keys):
 for k in keys:
  if r.get(k) is not None:r[k]=json.loads(r[k])
 return r
out={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':'read-only metadata; no provider or source requests','database':{'quickCheck':c.execute('PRAGMA quick_check').fetchone()[0],'foreignKeyFailures':len(rows('PRAGMA foreign_key_check')),'schema':rows('SELECT max(version) version FROM schema_migrations')[0]['version'],'journalMode':c.execute('PRAGMA journal_mode').fetchone()[0]}}
out['workers']=rows('SELECT worker_id,display_name,title,role,enabled,status,runtime_type,capability_profile,delegatable_capabilities FROM workers ORDER BY display_name')
out['historicalExecutionCounts']=rows('SELECT w.display_name,x.status,count(*) n,max(x.finished_at) latest FROM executions x JOIN workers w USING(worker_id) GROUP BY w.worker_id,x.status ORDER BY w.display_name,x.status')
out['currentScopes']=[parse(r,['envelope']) for r in rows('SELECT scope_id,group_id,state,envelope,created_at FROM investment_team_scopes WHERE run_id=? ORDER BY created_at',run)]
out['configuration']=[parse(r,['configuration']) for r in rows('SELECT configuration,configuration_hash,evidence_mode,created_at FROM investment_runs WHERE run_id=?',run)]
out['usage']=[parse(r,['tokens','reasons','estimate']) for r in rows('SELECT u.usage_id,u.execution_id,w.display_name,u.provider,u.model,u.service_tier,u.started_at,u.finished_at,u.status,u.completeness,u.settled,u.tokens,u.reasons,u.estimate,(SELECT count(*) FROM ai_usage_responses r WHERE r.usage_id=u.usage_id) authoritativeResponses FROM ai_usage u JOIN workers w USING(worker_id) WHERE u.run_id=? ORDER BY u.started_at',run)]
out['journal']=rows("SELECT version,transaction_id,operation_id,previous_hash,journal_hash,recorded_at,json_extract(payload,'$.command.type') command_type FROM investment_journal WHERE run_id=? ORDER BY version",run)
out['financialEvidence']=[]
for r in rows('SELECT evidence_id,instrument_id,request_hash,observation_hash,content,content_hash,qualification,retrieved_at,created_at FROM observed_financial_evidence WHERE run_id=? ORDER BY retrieved_at,instrument_id',run):
 content=r.pop('content');r['contentHashVerified']=hashlib.sha256(json.dumps(content,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==r['content_hash'];r['contentLength']=len(content);r['contentKeys']=list(json.loads(content));r['qualification']=json.loads(r['qualification']);out['financialEvidence'].append(r)
out['collections']=[parse(r,['result']) for r in rows('SELECT r.* FROM observed_collection_results r JOIN investment_team_scopes s USING(scope_id) WHERE s.run_id=? ORDER BY r.created_at',run)]
out['marketRecordCounts']=rows('SELECT kind,count(*) n FROM investment_market_records GROUP BY kind')
out['publication']=rows('SELECT kind,state,count(*) n,max(attempted_at) latest_attempt FROM investment_public_jobs GROUP BY kind,state')
out['askTableCounts']={r['name']:c.execute('SELECT count(*) FROM "'+r['name']+'"').fetchone()[0] for r in rows("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ask_%'")}
out['askUsage']=rows("SELECT activity,status,provider,model,count(*) n FROM ai_usage WHERE activity='public_question' GROUP BY activity,status,provider,model")
out['otherAuthorityCounts']={r['name']:c.execute('SELECT count(*) FROM "'+r['name']+'"').fetchone()[0] for r in rows("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('computer_sessions','computer_grants','computer_operators')")}
out['activeExecutions']=rows("SELECT execution_id,worker_id,status,started_at FROM executions WHERE status='running'")
c.rollback();c.close()
paths=['/var/lib/botsquad/company.sqlite','/var/lib/botsquad/.codex/auth.json','/etc/botsquad','/etc/botsquad-ask-launch','/etc/botsquad-ask-launch/openai-api-key','/var/lib/botsquad/.botsquad/finite-hq-custody','/var/lib/botsquad-publication-custody','/var/backups/botsquad','/opt/botsquad','/opt/botsquad-runtime/node/bin/node','/opt/botsquad-runtime/python31212/bin/python3.12']
out['permissions']=[]
for p in paths:
 try:s=os.stat(p);out['permissions'].append({'path':p,'uid':s.st_uid,'gid':s.st_gid,'mode':oct(s.st_mode&0o777),'bytes':s.st_size})
 except FileNotFoundError:out['permissions'].append({'path':p,'exists':False})
out['backups']=[{'name':p.name,'modifiedUtc':datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat()} for p in pathlib.Path('/var/backups/botsquad').iterdir() if p.is_dir()]
print(json.dumps(out,indent=2))
