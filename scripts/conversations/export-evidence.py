#!/usr/bin/env python3
"""Read only this synthetic validation root; no credentials or production records."""
import hashlib
import json
from pathlib import Path
import sqlite3
import sys

root = Path(sys.argv[1]).resolve()
assert str(root).startswith('/var/lib/botsquad/validation/conversations-')
fixture = json.loads((root / 'fixture.json').read_text())
assert fixture['roster_fixture'] is True
db = sqlite3.connect(f'file:{root}/company.sqlite?mode=ro', uri=True)
db.row_factory = sqlite3.Row
rows = lambda query: [dict(r) for r in db.execute(query)]
executions = rows('SELECT * FROM executions ORDER BY rowid')
sessions = rows('SELECT * FROM conversation_sessions ORDER BY rowid')
for session in sessions:
    assert hashlib.sha256(session['handoff'].encode()).hexdigest() == session['handoff_hash']
    session['handoff'] = json.loads(session['handoff'])
inputs = []
for path in sorted((root / 'runtime-inputs').glob('*.json')):
    assert not path.is_symlink()
    value = json.loads(path.read_text())
    context = json.dumps(value['context'])
    assert 'PRIVATE_ADA_ONLY_P07' not in context
    if value['mode'] == 'conversation':
        assert 'TASK_SCOPE_SENTINEL_P07' not in context
        assert set(value['tools']) == {'read_conversation', 'read_message', 'remember_context', 'ask_peer', 'submit_reply'}
    else:
        assert not set(value['tools']) & {'read_conversation', 'read_message', 'remember_context', 'ask_peer', 'submit_reply'}
    inputs.append({'execution_id': value['execution']['execution_id'], 'mode': value['mode'],
                   'tools': value['tools'], 'input_sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                   'binding_reference': (value['binding'] or {}).get('runtime_reference')})
assert len({s['runtime_reference'] for s in sessions if s['runtime_reference']}) == len([s for s in sessions if s['runtime_reference']])
assert all(e['task_id'] is None and e['request_id'] for e in executions if e['origin'] == 'conversation')
responses = rows('SELECT response_to,count(*) n FROM conversation_messages WHERE response_to IS NOT NULL GROUP BY response_to')
assert all(r['n'] == 1 for r in responses)
maya = [s for s in sessions if s['worker_id'] == fixture['maya']]
assert any(s['generation'] == 2 and len(s['handoff']['obligations']) >= 2 for s in maya)
assert any(s['generation'] == 3 and s['state'] == 'blocked' and s['runtime_reference'] for s in maya)
assert any(s['generation'] >= 4 and s['state'] == 'active' for s in maya)
events = rows("SELECT * FROM audit_events WHERE type LIKE '%runtime_usage' OR type LIKE '%runtime_turn_start%' ORDER BY rowid")
for event in events:
    event['detail'] = json.loads(event['detail'])
assert not rows('SELECT * FROM execution_runtime_attempts WHERE unresolved=1')
result = {
    'source_revisions': 'See browser phase records; final negative recovery fixes have separate deterministic evidence',
    'hq_id': rows('SELECT hq_id FROM client_hq')[0]['hq_id'],
    'fixture': fixture,
    'assertions': {'same_worker_conversation_new_provider_contexts': True, 'all_handoff_hashes_match': True,
                   'pending_obligation_in_generation_2': True, 'prepared_generation_3_retained_blocked': True,
                   'generation_4_continuation': True, 'private_and_task_context_sentinels_excluded': True,
                   'tool_modes_separate': True, 'unique_response_per_request': True, 'no_unresolved_provider_after_run': True},
    'counts': {'tasks': len(rows('SELECT task_id FROM tasks')), 'conversations': len(rows('SELECT conversation_id FROM conversations')),
               'recorded_runtime_inputs': len(inputs), 'conversation_executions': len([e for e in executions if e['origin'] == 'conversation'])},
    'executions': executions, 'sessions': sessions, 'runtime_inputs': inputs, 'usage_and_turn_events': events,
    'conversations': rows('SELECT * FROM conversations ORDER BY rowid'),
    'requests': rows('SELECT * FROM conversation_requests ORDER BY rowid'),
    'messages': rows('SELECT * FROM conversation_messages ORDER BY rowid'),
    'source_bookmarks': rows('SELECT * FROM conversation_notes ORDER BY rowid'),
    'causal_budgets': rows('SELECT * FROM conversation_chains ORDER BY rowid'),
    'legacy_task_bindings': rows('SELECT * FROM runtime_bindings'),
    'prepared_crash': json.loads((root / 'prepared-crash-evidence.json').read_text()),
    'cost': 'unknown; provider token notifications are retained as reported, not converted to billing',
}
print(json.dumps(result, indent=2))
