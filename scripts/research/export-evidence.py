#!/usr/bin/env python3
"""Export non-secret WE-01 fixture evidence, excluding source bodies and private HQ data."""
import json
from pathlib import Path
import sys

root=Path(sys.argv[1]); destination=Path(sys.argv[2])
fixture=json.loads((root/'fixture.json').read_text())
assert fixture['roster_fixture'] and fixture['data_root']=='/var/lib/botsquad/validation/research-20261001-we01'
record=json.loads((root/'browser-evidence.json').read_text())
assert record['hq_id']!='hq_1cfe3e8d-dcca-47a4-8090-b79c3470b9f9'
operations={}; sources={}
for path in root.glob('*-research.json'):
    for op in json.loads(path.read_text())['operations']:
        result=op.get('result') or {}
        operations[op['operation_id']]={k:op.get(k) for k in ['operation_id','execution_id','worker_id','origin','scope_id','grant_id','policy_version','tool','state','created_at','finished_at','output_chars','provider','unresolved']}
        operations[op['operation_id']].update({'public_request':json.loads(op['request']),'source_ids':[s['source_id'] for s in op['sources']],'error':result.get('error'),'error_code':result.get('code'),'usage':result.get('usage')})
        for s in op['sources']:
            sources[s['source_id']]={k:v for k,v in s.items() if k not in ['content','excerpt']}
exports={'fixture_only':True,'hq_id':record['hq_id'],'revisions_by_phase':record['revisions'],'phases':record['phases'],'ids':record['ids'],'idle':record.get('idle'),'attempts':record['attempts'],'worker_replies':record.get('replies',{}),'operations':list(operations.values()),'sources':list(sources.values()),'omissions':'No source bodies, snippets, provider summaries, private HQ data, account credentials or raw runtime inputs. Source hashes refer to protected retained content. Synthetic outage operations remain labeled in their errors.'}
for name in ['restart-preservation','pending-crash-recovery']:
    path=root/(name+'.json')
    if path.exists():exports[name]=json.loads(path.read_text())
destination.parent.mkdir(parents=True,exist_ok=True)
destination.write_text(json.dumps(exports,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'operations':len(operations),'sources':len(sources),'destination':str(destination)}))
