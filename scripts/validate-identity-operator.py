#!/usr/bin/python3
"""Operator companion for identity acceptance; no approval or company DB mutation."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time

assert os.geteuid() == 0
report = Path(sys.argv[1]).resolve()
assert report.is_dir() and str(report).startswith('/var/lib/botsquad/validation/identity-')
deadline = time.monotonic() + 1200
while not (report / 'operator-probes-ready').exists():
    assert time.monotonic() < deadline and not (report / 'exit-code').exists(), 'Validation stopped before probes'
    time.sleep(1)
state = json.loads((report / 'workflow-state.json').read_text())
result = subprocess.run(['/usr/bin/python3', '/opt/botsquad/scripts/validate-worker-isolation.py', str(report / 'workflow-state.json')], capture_output=True, text=True, timeout=90)
assert result.returncode == 0, result.stderr
isolation = json.loads(result.stdout)
(report / 'isolation.json').write_text(json.dumps(isolation, indent=2))
grace = next(w for w in state['workers'] if w['display_name'] == 'Grace')
identity = next(i for i in state['infrastructure']['identities'] if i['worker_id'] == grace['worker_id'])
process = subprocess.Popen(['/usr/bin/sleep', '240'], user=identity['uid'], group=identity['gid'], extra_groups=[], env={'PATH':'/usr/bin:/bin'}, cwd='/', stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    assert Path('/proc/' + str(process.pid)).stat().st_uid == identity['uid']
    (report / 'operator-probes-complete').write_text('Harmless canaries passed; retirement process started\n')
    deadline = time.monotonic() + 180
    while not (report / 'retired-state.json').exists():
        assert time.monotonic() < deadline and not (report / 'exit-code').exists(), 'Retirement did not complete'
        time.sleep(0.5)
    assert process.wait(timeout=5) == -9, 'Provisioner did not terminate the retired UID process'
    retired = json.loads((report / 'retired-state.json').read_text())
    operation = next(o for o in retired['infrastructure']['operations'] if o['operation_type'] == 'disable_worker_identity')
    assert json.loads(operation['result'])['processes_signalled'] >= 1
    evidence = dict(result='PASS',worker_id=grace['worker_id'],uid=identity['uid'],probe_pid=process.pid,exit_signal=9,operation_id=operation['operation_id'],history_preserved=True)
    (report / 'retirement-process.json').write_text(json.dumps(evidence, indent=2))
    print(json.dumps(dict(result='PASS',isolation_checks=len(isolation['checks']),retirement=evidence)))
finally:
    if process.poll() is None:
        process.kill()
        process.wait()
