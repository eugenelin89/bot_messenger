#!/usr/bin/python3
"""Root/operator companion: harmless real UID probes and archived-clone denial."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time

assert os.geteuid() == 0
report = Path(sys.argv[1]).resolve()
assert report.is_dir() and str(report).startswith('/var/lib/botsquad/validation/projects-')

def wait_for(name, seconds):
    deadline = time.monotonic() + seconds
    while not (report / name).exists():
        assert time.monotonic() < deadline and not (report / 'exit-code').exists(), 'Validation stopped before ' + name
        time.sleep(0.5)

wait_for('operator-probes-ready', 1500)
result = subprocess.run(['/usr/bin/python3', '/opt/botsquad/scripts/validate-worker-isolation.py', str(report / 'workflow-state.json')], capture_output=True, text=True, timeout=90)
assert result.returncode == 0, result.stderr
isolation = json.loads(result.stdout)
(report / 'isolation.json').write_text(json.dumps(isolation, indent=2))
(report / 'operator-probes-complete').write_text('Harmless real UID isolation probes passed\n')
wait_for('archived-state.json', 180)
state = json.loads((report / 'archived-state.json').read_text())
checks = []
for allocation in state['allocations']:
    identity = next(i for i in state['infrastructure']['identities'] if i['worker_id'] == allocation['worker_id'])
    clone = Path(allocation['worktree_path'])
    assert clone.is_dir() and clone.stat().st_uid == 0
    assert identity['state'] == 'ready', 'Archive must not retire reusable worker identity'
    for action in ['read', 'write']:
        code = 'import sys;open(sys.argv[1],sys.argv[2]).close()'
        denied = subprocess.run(['/usr/sbin/runuser','-u',identity['unix_username'],'--','/usr/bin/python3','-I','-c',code,str(clone / 'README.md'),'r' if action == 'read' else 'r+'],capture_output=True,text=True,timeout=10)
        assert denied.returncode != 0 and 'PermissionError' in denied.stderr
        checks.append(dict(worker_id=identity['worker_id'],allocation_id=allocation['allocation_id'],uid=identity['uid'],action=action,denied=True,clone_preserved=True))
(report / 'archive-isolation.json').write_text(json.dumps(dict(result='PASS',checks=checks),indent=2))
(report / 'archive-probes-complete').write_text('Archive retained clones and revoked worker access\n')
print(json.dumps(dict(result='PASS',isolation_checks=len(isolation['checks']),archive_checks=len(checks))))
