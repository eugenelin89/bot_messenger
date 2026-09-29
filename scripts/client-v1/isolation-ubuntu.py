#!/usr/bin/env python3
"""Read-only authority probes using harmless canaries in retained HQ boundaries.
Root operator only. Never read real credential contents or alter retained domain state.
"""
import json
import os
from pathlib import Path
import pwd
import subprocess
import urllib.request
import uuid

assert os.geteuid() == 0
with urllib.request.urlopen('http://127.0.0.1:4310/api/state', timeout=10) as response:
    state = json.load(response)
assert state['paused'] and not any(e['status'] == 'running' for e in state['executions'])
identities = [i for i in state['infrastructure']['identities'] if i['state'] == 'ready']
assert len(identities) >= 4
name = '.client-validation-canary-' + uuid.uuid4().hex
created = []

def canary(directory, uid, gid):
    path = Path(directory) / name
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as output:
        output.write('harmless authority canary\n')
    os.chown(path, uid, gid)
    created.append(path)
    return str(path)

def run(identity, code, *args):
    return subprocess.run(['/usr/sbin/runuser', '-u', identity['unix_username'], '--', '/usr/bin/python3', '-I', '-c', code, *args],
                          env={'PATH': '/usr/bin:/bin'}, capture_output=True, text=True, timeout=10)

try:
    service = pwd.getpwnam('botsquad')
    protected = [canary(p, service.pw_uid, service.pw_gid) for p in ['/var/lib/botsquad/.codex', '/var/lib/botsquad']]
    protected += [canary(p, 0, 0) for p in ['/var/lib/botsquad-provisioner/receipts', '/etc/botsquad', '/opt/botsquad']]
    homes = {i['worker_id']: canary(i['home_path'], i['uid'], i['gid']) for i in identities}
    denied = 0
    for identity in identities:
        account = pwd.getpwnam(identity['unix_username'])
        assert account.pw_uid == identity['uid'] and account.pw_gid == identity['gid'] and account.pw_shell == '/usr/sbin/nologin'
        result = run(identity, 'import os,json;print(json.dumps([os.getuid(),os.getgid(),os.getgroups()]))')
        assert result.returncode == 0 and json.loads(result.stdout) == [identity['uid'], identity['gid'], [identity['gid']]]
        assert subprocess.check_output(['passwd', '-S', identity['unix_username']], text=True).split()[1] == 'L'
        targets = protected + [p for worker, p in homes.items() if worker != identity['worker_id']]
        for path in targets:
            for mode in ['r', 'r+']:
                result = run(identity, 'import sys;open(sys.argv[1],sys.argv[2]).close()', path, mode)
                assert result.returncode != 0 and 'PermissionError' in result.stderr
                denied += 1
        for code in ['import os;os.setuid(0)', 'import socket;s=socket.socket(socket.AF_UNIX);s.connect("/run/botsquad-provisioner/control.sock")']:
            result = run(identity, code)
            assert result.returncode != 0 and 'PermissionError' in result.stderr
            denied += 1
        for path in ['/opt/botsquad/src/main.ts', '/opt/botsquad-provisioner/provisioner.py', '/etc/passwd']:
            result = run(identity, 'import sys;open(sys.argv[1],"r+").close()', path)
            assert result.returncode != 0 and 'PermissionError' in result.stderr
            denied += 1
        assert not (Path(identity['home_path']) / '.codex').exists()
    print(json.dumps({'result': 'passed', 'ready_retained_workers': len(identities), 'denied_probes': denied,
                      'account_group_shell_lock_checks': True, 'central_auth_not_copied': True,
                      'credential_contents_read': False, 'probe_canaries_removed_in_finally': True}))
finally:
    for path in created:
        path.unlink()
