#!/usr/bin/python3
"""Root/operator acceptance probes. Read harmless canaries only, never credential contents."""
import json
import os
from pathlib import Path
import pwd
import socket
import subprocess
import sys
import uuid

assert os.geteuid() == 0
state_path = Path(sys.argv[1]).resolve()
assert state_path.is_file() and str(state_path).startswith('/var/lib/botsquad/validation/')
state = json.loads(state_path.read_text())
workers = {w['display_name']: w for w in state['workers']}
identities = {i['worker_id']: i for i in state['infrastructure']['identities']}
probe = '.prompt04-canary-' + uuid.uuid4().hex
created = []

def canary(path, uid=0, gid=0):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as output: output.write('harmless isolation probe\n')
    os.chown(path, uid, gid)
    created.append(path)
    return str(path)

def run_as(identity, code, *args):
    return subprocess.run(['/usr/sbin/runuser', '-u', identity['unix_username'], '--', '/usr/bin/python3', '-I', '-c', code, *args],
                          env={'PATH': '/usr/bin:/bin'}, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)

try:
    service = pwd.getpwnam('botsquad')
    sensitive = {
        'codex_auth_canary': canary(Path('/var/lib/botsquad/.codex') / probe, service.pw_uid, service.pw_gid),
        'company_db_canary': canary(Path('/var/lib/botsquad') / probe, service.pw_uid, service.pw_gid),
        'provisioner_receipt_canary': canary(Path('/var/lib/botsquad-provisioner/receipts') / probe),
        'etc_botsquad_canary': canary(Path('/etc/botsquad') / probe),
        'botsquad_source_canary': canary(Path('/opt/botsquad') / probe),
        'canonical_product_main': str(Path(state['repositories'][0]['canonical_root']) / 'src/calculate.mjs'),
    }
    homes = {}
    for name in ['Linus', 'Ada', 'Nix', 'Grace']:
        identity = identities[workers[name]['worker_id']]
        assert identity['state'] == 'ready'
        account = pwd.getpwnam(identity['unix_username'])
        assert account.pw_uid == identity['uid'] and account.pw_gid == identity['gid'] and account.pw_shell == '/usr/sbin/nologin'
        homes[name] = canary(Path(identity['home_path']) / probe, identity['uid'], identity['gid'])
    evidence = {'result': 'PASS', 'canary_contents_recorded': False, 'workers': [], 'checks': []}
    for name in ['Linus','Ada','Nix','Grace']:
        identity = identities[workers[name]['worker_id']]
        code = 'import os,json;print(json.dumps(dict(uid=os.getuid(),gid=os.getgid(),groups=os.getgroups())))'
        result = run_as(identity, code); assert result.returncode == 0
        ids = json.loads(result.stdout); assert ids['uid'] == identity['uid'] and ids['gid'] == identity['gid'] and ids['groups'] == [identity['gid']]
        password_status = subprocess.check_output(['/usr/bin/passwd', '-S', identity['unix_username']], text=True).split()[1]
        assert password_status == 'L'
        acl = subprocess.check_output(['/usr/bin/getfacl','-cp',identity['home_path']],text=True)
        evidence['workers'].append(dict(name=name, worker_id=identity['worker_id'], unix_username=identity['unix_username'], **ids, password_locked=True, home_mode=oct(Path(identity['home_path']).stat().st_mode & 0o777), home_acl=acl))
        targets = dict(sensitive, **{'sibling_'+other: path for other,path in homes.items() if other != name})
        for scope, path in targets.items():
            for action in ['read','write']:
                code = 'import sys; f=open(sys.argv[1],sys.argv[2]); f.close()'
                # r/r+ only: no destructive write and no content read/printed.
                result = run_as(identity, code, path, 'r' if action == 'read' else 'r+')
                assert result.returncode != 0 and 'PermissionError' in result.stderr, (name, scope, action)
                evidence['checks'].append(dict(worker=name, scope=scope, action=action, denied=True))
        code = 'import socket; s=socket.socket(socket.AF_UNIX);s.connect("/run/botsquad-provisioner/control.sock")'
        result = run_as(identity, code); assert result.returncode != 0 and 'PermissionError' in result.stderr
        evidence['checks'].append(dict(worker=name,scope='provisioner_socket',denied=True))
        code = 'import os; os.setuid(0)'
        result = run_as(identity, code); assert result.returncode != 0 and 'PermissionError' in result.stderr
        evidence['checks'].append(dict(worker=name,scope='root_uid',denied=True))
        result = subprocess.run(['/usr/sbin/runuser','-u',identity['unix_username'],'--','/usr/bin/sudo','-n','/usr/bin/true'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        assert result.returncode != 0; evidence['checks'].append(dict(worker=name,scope='sudo',denied=True))
        for path, label in [('/opt/botsquad/src/main.ts','botsquad_source'),('/opt/botsquad-provisioner/provisioner.py','provisioner_code'),('/etc/passwd','etc_write')]:
            result = run_as(identity, 'import sys;open(sys.argv[1],"r+").close()',path)
            assert result.returncode != 0 and 'PermissionError' in result.stderr
            evidence['checks'].append(dict(worker=name,scope=label,action='write_open',denied=True))
        assert not (Path(identity['home_path']) / '.ssh').exists()
        assert not (Path(identity['home_path']) / '.codex').exists()
    for name, other in [('Linus','Ada'),('Ada','Linus')]:
        identity = identities[workers[name]['worker_id']]
        allocation = next(a for a in state['allocations'] if a['worker_id'] == identity['worker_id'])
        other_allocation = next(a for a in state['allocations'] if a['worker_id'] == workers[other]['worker_id'])
        target = str(Path(allocation['worktree_path']) / probe)
        result = run_as(identity, 'import os,sys,json;f=open(sys.argv[1],"x");f.write("probe");f.close();print(json.dumps(dict(uid=os.stat(sys.argv[1]).st_uid,gid=os.stat(sys.argv[1]).st_gid)));os.unlink(sys.argv[1])', target)
        assert result.returncode == 0, result.stderr
        ownership = json.loads(result.stdout); assert ownership['uid'] == identity['uid']
        evidence['checks'].append(dict(worker=name,scope='own_clone_write',allowed=True,**ownership))
        target = str(Path(other_allocation['worktree_path']) / 'src' / (other_allocation['module']+'.mjs'))
        result = run_as(identity, 'import sys;open(sys.argv[1],"r+")',target)
        assert result.returncode != 0 and 'PermissionError' in result.stderr
        evidence['checks'].append(dict(worker=name,scope='sibling_clone_write',denied=True))
    print(json.dumps(evidence,indent=2))
finally:
    for path in created: Path(path).unlink()
