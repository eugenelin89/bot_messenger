#!/usr/bin/python3
"""BotSquad's fixed local protocol. Root code never executes worker source or Git.

All project parsing/writes/Git run in a separate, credential-free child after UID/GID
and supplementary-group drop. Only account lifecycle and receipt handling run as root.
"""
import base64
import ctypes
import fcntl
import grp
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import resource
import signal
import socket
import stat
import struct
import subprocess
import sys
import time

STATE = Path('/var/lib/botsquad-provisioner')
HOMES = Path('/var/lib/botsquad-workers')
CODE = '/opt/botsquad-provisioner/provisioner.py'
LIMIT = 6_000_000
BUNDLE_LIMIT = 4 * 1024 * 1024
FILE_LIMIT = 128 * 1024
ID = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
KINDS = {
    'inspect_host_health': set(),
    'create_worker_identity': {'operation_id', 'worker_id'},
    'disable_worker_identity': {'operation_id', 'worker_id'},
    'prepare_worker_project_clone': {'operation_id', 'worker_id', 'allocation_id', 'repository_id', 'task_id', 'base_commit', 'default_branch', 'manifest', 'manifest_hash', 'bundle'},
    'revoke_worker_project_access': {'operation_id', 'worker_id', 'allocation_id'},
    'write_project_source': {'operation_id', 'worker_id', 'allocation_id', 'path', 'content'},
    'delete_project_source': {'operation_id', 'worker_id', 'allocation_id', 'path'},
    'commit_project': {'operation_id', 'worker_id', 'allocation_id', 'expected_head'},
}

def relative_path(value, directory=False):
    check(type(value) is str and 0 < len(value) <= 240 and re.fullmatch(r'[A-Za-z0-9_./-]+', value), 'Path outside repository scope')
    path = value[:-1] if directory and value.endswith('/') else value
    check(not path.startswith('/') and all(s and s not in ('.', '..') and s.lower() != '.git' and not s.endswith(('.', '.lock')) for s in path.split('/')), 'Path outside repository scope')
    return value

def contains(path, scope):
    return path.startswith(scope) if scope.endswith('/') else path == scope

def validate_manifest(req):
    try:
        manifest = json.loads(req['manifest'], object_pairs_hook=pairs)
    except (ValueError, TypeError):
        raise Rejected('Invalid allocation manifest') from None
    check(type(manifest) is dict and set(manifest) == {'allocation_id','worker_id','repository_id','task_id','branch_name','base_commit','write_scope','protected_paths','bounds'}, 'Unknown manifest fields')
    for key in ('allocation_id','worker_id','repository_id','task_id','base_commit'):
        check(manifest[key] == req[key], 'Manifest identity mismatch')
    check(manifest['branch_name'] == 'botsquad/task/' + req['task_id'] or re.fullmatch(r'botsquad/(calculate|format)/' + re.escape(req['task_id']), manifest['branch_name']), 'Manifest branch mismatch')
    check(re.fullmatch(r'[0-9a-f]{64}', req['manifest_hash']) and digest(canonical(manifest).encode()) == req['manifest_hash'], 'Manifest hash mismatch')
    check(type(manifest['write_scope']) is list and 0 < len(manifest['write_scope']) <= 32, 'Invalid write scope')
    check(type(manifest['protected_paths']) is list and len(manifest['protected_paths']) <= 64, 'Invalid protected paths')
    for path in manifest['write_scope'] + manifest['protected_paths']:
        relative_path(path, True)
    ceilings = dict(repository_bytes=16*1024*1024, bundle_bytes=BUNDLE_LIMIT, files=1000, file_bytes=FILE_LIMIT, diff_bytes=256*1024, changed_files=100, commits=16)
    check(type(manifest['bounds']) is dict and set(manifest['bounds']) == set(ceilings), 'Invalid bounds')
    check(all(type(manifest['bounds'][k]) is int and 0 < manifest['bounds'][k] <= v for k,v in ceilings.items()), 'Manifest bounds exceeded')
    check(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_/-]{0,99}', req['default_branch']) and not req['default_branch'].endswith('/') and '//' not in req['default_branch'], 'Invalid default branch')
    return manifest

def project_policy(project):
    if 'manifest' in project:
        manifest = project['manifest']
        check(digest(canonical(manifest).encode()) == project['manifest_hash'], 'Persisted manifest changed')
        return manifest
    # Retained protocol-1 ledgers keep their original narrow grants.
    module = project['module']
    return dict(branch_name='botsquad/' + module + '/' + project['task_id'],
                write_scope=['src/' + module + '.mjs','test/' + module + '.extra.test.mjs'], protected_paths=[],
                bounds=dict(file_bytes=16000, repository_bytes=1_000_000, bundle_bytes=500000, files=1000, changed_files=2, commits=1, diff_bytes=64000))

def authorize_path(project, path):
    relative_path(path)
    policy = project_policy(project)
    check(any(contains(path, scope) for scope in policy['write_scope']) and not any(contains(path.lower(), scope.lower()) for scope in policy['protected_paths']) and not any(p.lower() == 'agents.md' for p in path.split('/')), 'Path outside persisted allocation scope')

class Rejected(Exception):
    pass

def check(condition, message):
    if not condition:
        raise Rejected(message)

def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def digest(value):
    return hashlib.sha256(value).hexdigest()

def pairs(items):
    result = {}
    for key, value in items:
        check(key not in result, 'Duplicate JSON field')
        result[key] = value
    return result

def parse(raw):
    check(len(raw) <= LIMIT, 'Request exceeds limit')
    try:
        req = json.loads(raw, object_pairs_hook=pairs, parse_constant=lambda _: (_ for _ in ()).throw(Rejected('Invalid number')))
    except (ValueError, UnicodeDecodeError):
        raise Rejected('Malformed JSON') from None
    check(type(req) is dict and type(req.get('type')) is str and req['type'] in KINDS, 'Unknown operation')
    expected = KINDS[req['type']]
    if req['type'] == 'prepare_worker_project_clone' and 'module' in req:
        expected = {'operation_id','worker_id','allocation_id','repository_id','task_id','module','base_commit','bundle'}
    if req['type'] == 'commit_project' and 'expected_head' not in req:
        expected = {'operation_id','worker_id','allocation_id'}  # retained exact operation retry
    check(set(req) == expected | {'type'}, 'Unknown or missing request fields')
    for key in expected:
        check(type(req[key]) is str, 'Invalid field type')
        if key.endswith('_id'):
            prefix = {'worker_id': 'worker', 'allocation_id': 'allocation', 'repository_id': 'repository', 'task_id': 'task', 'operation_id': 'operation'}[key]
            check(re.fullmatch(prefix + '_' + ID, req[key]), 'Invalid identifier')
    if req['type'] == 'prepare_worker_project_clone':
        if 'module' in req:
            check(req['module'] in ('calculate', 'format'), 'Invalid module')
        else:
            validate_manifest(req)
        check(re.fullmatch(r'[0-9a-f]{40}', req['base_commit']), 'Invalid base commit')
        bound = 500000 if 'module' in req else BUNDLE_LIMIT
        check(len(req['bundle']) <= (bound + 2) // 3 * 4, 'Bundle exceeds limit')
        try:
            check(len(base64.b64decode(req['bundle'], validate=True)) <= bound, 'Bundle exceeds limit')
        except ValueError:
            raise Rejected('Invalid bundle encoding') from None
    if 'path' in req:
        relative_path(req['path'])
        if 'content' in req:
            check('\0' not in req['content'] and len(req['content'].encode()) <= FILE_LIMIT, 'Source exceeds limit')
    if 'expected_head' in req:
        check(re.fullmatch(r'[0-9a-f]{40}', req['expected_head']), 'Invalid expected head')
    return req

def username(worker_id):
    check(re.fullmatch('worker_' + ID, worker_id), 'Invalid worker ID')
    return 'bsw-' + digest(worker_id.encode())[:24]

def atomic(path, value):
    # Only used for root-owned state, never a worker-selected path.
    temp = path.with_suffix('.new')
    fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write(canonical(value))
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)
    fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)

def load(path):
    return json.loads(path.read_text()) if path.exists() else None

def command(args):
    result = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            env={'PATH': '/usr/sbin:/usr/bin:/sbin:/bin', 'LANG': 'C'}, timeout=12, check=False)
    check(result.returncode == 0, 'Fixed host operation failed')
    return result.stdout.decode().strip()

def lookup(worker_id, ready=True):
    record = load(STATE / 'identities' / (worker_id + '.json'))
    check(record and record['worker_id'] == worker_id and record['unix_username'] == username(worker_id), 'Unknown managed identity')
    if ready:
        check(record['state'] == 'ready', 'Identity disabled or not ready')
    account = pwd.getpwnam(record['unix_username'])
    check(account.pw_uid == record['uid'] and account.pw_gid == record['gid'] and account.pw_uid >= 20000,
          'Managed UID/GID mismatch')
    check(account.pw_dir == record['home_path'] and account.pw_shell == '/usr/sbin/nologin', 'Account properties changed')
    check(os.getgrouplist(account.pw_name, account.pw_gid) == [account.pw_gid], 'Unexpected supplementary group')
    return record

def create_identity(req):
    worker_id = req['worker_id']
    name = username(worker_id)
    home = HOMES / name
    path = STATE / 'identities' / (worker_id + '.json')
    record = load(path)
    if record is None:
        try:
            pwd.getpwnam(name)
        except KeyError:
            pass
        else:
            raise Rejected('Existing username collision')
        try:
            grp.getgrnam(name)
        except KeyError:
            pass
        else:
            raise Rejected('Existing group collision')
        check(not home.exists() and not home.is_symlink(), 'Existing home collision')
        # Reserve exact UID before mutation. Never adopt another account on retry.
        used_uids = {p.pw_uid for p in pwd.getpwall()}
        used_gids = {g.gr_gid for g in grp.getgrall()}
        reserved = {r['uid'] for p in (STATE / 'identities').glob('*.json') if (r := load(p))}
        uid = next((u for u in range(20000, 60000) if u not in used_uids | used_gids | reserved), None)
        check(uid is not None, 'Managed identity capacity exhausted')
        record = dict(worker_id=worker_id, backend='linux', unix_username=name, uid=uid, gid=uid,
                      home_path=str(home), state='creating', operation_id=req['operation_id'])
        atomic(path, record)
    check(record['operation_id'] == req['operation_id'], 'Identity belongs to another operation')
    check(record['state'] != 'disabled', 'Disabled identity cannot be recreated')
    try:
        group = grp.getgrnam(name)
        check(group.gr_gid == record['gid'] and not group.gr_mem, 'Group collision')
    except KeyError:
        command(['/usr/sbin/groupadd', '--gid', str(record['gid']), name])
    try:
        account = pwd.getpwnam(name)
        check(account.pw_uid == record['uid'] and account.pw_gid == record['gid'] and account.pw_gecos == 'BotSquad ' + worker_id, 'Account collision')
    except KeyError:
        command(['/usr/sbin/useradd', '--uid', str(record['uid']), '--gid', str(record['gid']), '--no-create-home',
                 '--no-log-init', '--home-dir', str(home), '--shell', '/usr/sbin/nologin', '--password', '!',
                 '--comment', 'BotSquad ' + worker_id, name])
    if not home.exists():
        home.mkdir(mode=0o700)
    check(not home.is_symlink() and home.is_dir() and home.stat().st_uid in (0, record['uid']), 'Unsafe home')
    # Named read/traverse ACL only for trusted control plane; workers share no group.
    os.chown(home, record['uid'], record['gid'])
    os.chmod(home, 0o700)
    command(['/usr/bin/setfacl', '-m', 'u:botsquad:r-x,d:u:botsquad:r-x,d:u::rwx,d:g::---,d:o::---', str(home)])
    record['state'] = 'ready'
    atomic(path, record)
    return lookup(worker_id)

def drop_privileges():
    check(ctypes.CDLL(None, use_errno=True).prctl(38, 1, 0, 0, 0) == 0, 'Cannot prohibit privilege gain')
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_AS, (256*1024*1024, 256*1024*1024))
    resource.setrlimit(resource.RLIMIT_CPU, (15, 15))
    resource.setrlimit(resource.RLIMIT_FSIZE, (16_000_000, 16_000_000))
    resource.setrlimit(resource.RLIMIT_NOFILE, (128, 128))
    os.umask(0o077)

def worker_action(req, record, project=None):
    payload = {'request': req, 'identity': record, 'project': project}
    try:
        result = subprocess.run(['/usr/bin/python3', '-I', CODE, '--worker'], input=canonical(payload).encode(),
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=18,
                                cwd='/', env={'PATH': '/usr/bin:/bin', 'LANG': 'C', 'HOME': record['home_path']},
                                user=record['uid'], group=record['gid'], extra_groups=[],
                                start_new_session=True)
    except (OSError, subprocess.SubprocessError) as error:
        raise Rejected('Worker launch failed (' + type(error).__name__ + ')') from None
    check(len(result.stdout) <= LIMIT, 'Worker response exceeds limit')
    response = json.loads(result.stdout) if result.stdout else {}
    check(result.returncode == 0, response.get('error', 'Bounded worker action failed'))
    check(response['uid'] == record['uid'] and response['gid'] == record['gid'], 'Worker execution UID mismatch')
    return response

def disable_identity(req):
    record = lookup(req['worker_id'], ready=False)
    record['state'] = 'disabled'
    atomic(STATE / 'identities' / (req['worker_id'] + '.json'), record)  # block all new helper actions first
    command(['/usr/sbin/usermod', '--lock', '--expiredate', '1970-01-02', '--shell', '/usr/sbin/nologin', record['unix_username']])
    # UID is bound in root-owned state. pidfds avoid PID-reuse signaling races.
    killed = 0
    for entry in Path('/proc').iterdir():
        if not entry.name.isdigit():
            continue
        fd = None
        try:
            fd = os.pidfd_open(int(entry.name))
            if entry.stat().st_uid == record['uid']:
                signal.pidfd_send_signal(fd, signal.SIGKILL)
                killed += 1
        except (FileNotFoundError, ProcessLookupError):
            pass
        finally:
            if fd is not None:
                os.close(fd)
    # Root owns home entry after revocation; data retained, cannot chmod itself back.
    home = Path(record['home_path'])
    check(not home.is_symlink() and home.resolve() == home, 'Unsafe retired home')
    os.chown(home, 0, 0)
    command(['/usr/bin/setfacl', '-b', str(home)])
    os.chmod(home, 0o700)
    for p in (STATE / 'projects').glob('*.json'):
        project = load(p)
        if project['worker_id'] == req['worker_id']:
            project['state'] = 'revoked'
            atomic(p, project)
    return dict(record, processes_signalled=killed, home_preserved=True)

def perform(req):
    kind = req['type']
    if kind == 'create_worker_identity':
        return create_identity(req)
    if kind == 'disable_worker_identity':
        return disable_identity(req)
    record = lookup(req['worker_id'])
    path = STATE / 'projects' / (req['allocation_id'] + '.json')
    project = load(path)
    if kind == 'prepare_worker_project_clone':
        if project is None:
            project = {key: req[key] for key in ('allocation_id', 'worker_id', 'repository_id', 'task_id', 'base_commit')}
            if 'module' in req:
                project['module'] = req['module']
            else:
                project.update(manifest=validate_manifest(req), manifest_hash=req['manifest_hash'], default_branch=req['default_branch'])
            project.update(path=str(Path(record['home_path']) / 'projects' / req['allocation_id']), state='preparing', operation_id=req['operation_id'])
            atomic(path, project)
        check(project['operation_id'] == req['operation_id'] and project['state'] in ('preparing', 'ready'), 'Project already allocated')
        if 'manifest' in req:
            check(project.get('manifest_hash') == req['manifest_hash'] and project.get('manifest') == validate_manifest(req), 'Changed persisted manifest')
        result = worker_action(req, record, project)
        project['state'] = 'ready'
        atomic(path, project)
        return dict(project, execution_uid=result['uid'], execution_gid=result['gid'])
    check(project and project['worker_id'] == req['worker_id'], 'Project binding unavailable')
    if kind == 'revoke_worker_project_access':
        if project['state'] != 'ready':
            check(project.get('revoke_operation_id') == req['operation_id'], 'Project already revoked')
        project['state'] = 'revoking'
        project['revoke_operation_id'] = req['operation_id']
        atomic(path, project)
        # Every untrusted path component is opened without following symlinks. All names derive from IDs.
        home_fd = os.open(record['home_path'], os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            parent = os.open('projects', os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=home_fd)
            try:
                target = os.open(req['allocation_id'], os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
                try:
                    os.fchown(target, 0, 0)
                    os.fchmod(target, 0o700)
                finally:
                    os.close(target)
            finally:
                os.close(parent)
        finally:
            os.close(home_fd)
        project['state'] = 'revoked'
        atomic(path, project)
        return project
    check(project['state'] == 'ready', 'Project access revoked')
    return worker_action(req, record, project)

def handle(req):
    if req['type'] == 'inspect_host_health':
        return dict(ready=True, backend='linux', protocol=2, network=False)
    receipt_path = STATE / 'receipts' / (req['operation_id'] + '.json')
    request_hash = digest(canonical(req).encode())
    previous = load(receipt_path)
    if previous:
        check(previous['request_hash'] == request_hash, 'Operation ID payload mismatch')
        if previous['state'] == 'completed':
            return previous['result']
    else:
        atomic(receipt_path, dict(request_hash=request_hash, type=req['type'], worker_id=req['worker_id'], state='started'))
    result = perform(req)
    atomic(receipt_path, dict(request_hash=request_hash, type=req['type'], worker_id=req['worker_id'], state='completed', result=result))
    print(canonical(dict(operation_id=req['operation_id'], type=req['type'], worker_id=req['worker_id'], result='completed', timestamp=int(time.time()))), file=sys.stderr, flush=True)
    return result

# Everything below executes as the worker for project actions. No user-selected argv.
def safe_tree(root):
    check(root.is_dir() and not root.is_symlink() and root.resolve() == root, 'Unsafe project root')
    count = 0
    total = 0
    for directory, dirs, files in os.walk(root):
        for name in dirs + files:
            path = Path(directory) / name
            info = path.lstat()
            check(not stat.S_ISLNK(info.st_mode) and (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)), 'Nonregular project entry')
            check(info.st_uid == os.getuid() and (stat.S_ISDIR(info.st_mode) or info.st_nlink == 1), 'Project ownership/hardlink mismatch')
            count += 1
            total += info.st_size if stat.S_ISREG(info.st_mode) else 0
            check(count < 15000 and info.st_size <= 16*1024*1024 and total <= 48*1024*1024, 'Project bounds exceeded')
    config = (root / '.git/config').read_text()
    check(all(line.strip() == '[core]' or re.fullmatch(r'(repositoryformatversion|filemode|bare|logallrefupdates|ignorecase|precomposeunicode) = (0|true|false)', line.strip()) for line in config.splitlines() if line.strip()), 'Untrusted Git configuration')
    for name in ('objects/info/alternates', 'objects/info/http-alternates', 'info/grafts', 'info/attributes', 'shallow', 'refs/replace', 'config.worktree'):
        check(not (root / '.git' / name).exists(), 'Untrusted Git indirection')
    check(all(p.name.endswith('.sample') for p in (root / '.git/hooks').iterdir()), 'Active hooks denied')

def checked_source(root, path, create=False):
    relative_path(path)
    target = root / path
    current = root
    for part in Path(path).parts[:-1]:
        current = current / part
        if create and not current.exists() and not current.is_symlink():
            current.mkdir(mode=0o700)
            subprocess.run(['/usr/bin/setfacl','-m','u:botsquad:r-x',str(current)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        check(current.is_dir() and not current.is_symlink() and current.resolve() == current and current.stat().st_uid == os.getuid(), 'Source parent escaped')
    if target.exists() or target.is_symlink():
        info = target.lstat()
        check(stat.S_ISREG(info.st_mode) and info.st_nlink == 1 and info.st_uid == os.getuid(), 'Source link/non-file denied')
    return target

def content_bounds(root, project, replacing=None, size=0):
    bounds = project_policy(project)['bounds']
    files, total = 0, 0
    for directory, dirs, names in os.walk(root):
        if Path(directory) == root:
            dirs[:] = [d for d in dirs if d != '.git']
        for name in names:
            path = Path(directory) / name
            info = path.lstat()
            check(stat.S_ISREG(info.st_mode) and info.st_nlink == 1 and info.st_uid == os.getuid(), 'Unsafe source entry')
            if path == replacing:
                continue
            relative_path(str(path.relative_to(root)))
            files += 1
            total += info.st_size
            check(info.st_size <= bounds['file_bytes'], 'Source file limit exceeded')
    if replacing is not None:
        files += 1
        total += size
    check(files <= bounds['files'] and total <= bounds['repository_bytes'], 'Repository content limit exceeded')


def check_git_tree(root, project, head):
    bounds = project_policy(project)['bounds']
    rows = list(filter(None, git(root, ['ls-tree', '-rlz', head]).split('\0')))
    check(len(rows) <= bounds['files'], 'Repository file limit exceeded')
    total, seen = 0, set()
    for row in rows:
        match = re.fullmatch(r'(100644|100755) blob [0-9a-f]{40}\s+(\d+)\t(.+)', row)
        check(match, 'Unsupported repository symlink/submodule')
        path = relative_path(match[3])
        check(path.lower() not in seen and Path(path).name not in ('.gitmodules', '.gitattributes'), 'Unsupported repository paths')
        seen.add(path.lower())
        total += int(match[2])
        check(int(match[2]) <= bounds['file_bytes'] and total <= bounds['repository_bytes'], 'Repository object limits exceeded')


def check_range(root, project, head):
    policy = project_policy(project)
    git(root, ['merge-base','--is-ancestor',project['base_commit'],head])
    commits = git(root, ['rev-list','--reverse',project['base_commit']+'..'+head]).splitlines()
    check(len(commits) <= policy['bounds']['commits'], 'Commit count exceeded')
    for commit in commits:
        parents = git(root,['rev-list','--parents','-n','1',commit]).split()
        check(len(parents) == 2, 'Merge commits denied')
        check_git_tree(root,project,commit)
        for path in filter(None,git(root,['diff','--name-only','-z','--no-ext-diff','--no-renames',parents[1],commit]).split('\0')):
            authorize_path(project,path)
    check(len(git(root,['diff','--no-ext-diff','--no-renames',project['base_commit'],head]).encode()) <= policy['bounds']['diff_bytes'], 'Diff limit exceeded')
    return commits

def git(root, args):
    result = subprocess.run(['/usr/bin/git', '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false',
                             '-c', 'commit.gpgsign=false', '-c', 'core.attributesFile=/dev/null', '-c', 'diff.external=',
                             '-c', 'user.name=BotSquad', '-c', 'user.email=botsquad@localhost', *args],
                            cwd=root, env={'PATH': '/usr/bin:/bin', 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null',
                                           'GIT_TERMINAL_PROMPT': '0', 'GIT_NO_REPLACE_OBJECTS': '1', 'LANG': 'C'},
                            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
    check(result.returncode == 0 and len(result.stdout) <= LIMIT, 'Fixed worker Git operation failed')
    return result.stdout.decode().strip()

def worker_main():
    # UID/GID and supplementary groups were dropped by exec's fixed subprocess
    # credentials. Apply additional restrictions after exec, before reading input.
    drop_privileges()
    status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
    check(os.getuid() >= 20000 and int(status['CapEff'], 16) == 0 and int(status['CapPrm'], 16) == 0 and status['NoNewPrivs'].strip() == '1', 'Worker process retains authority')
    payload = json.loads(sys.stdin.buffer.read(LIMIT + 10000))
    req, record, project = payload['request'], payload['identity'], payload['project']
    check(os.getuid() == record['uid'] and os.getgid() == record['gid'] and not os.getgroups(), 'Worker credentials not dropped')
    home = Path(record['home_path'])
    check(home.resolve() == home and home.stat().st_uid == os.getuid(), 'Worker home mismatch')
    root = home / 'projects' / project['allocation_id']
    check(str(root) == project['path'], 'Project path mismatch')
    policy = project_policy(project)
    branch = policy['branch_name']
    default_branch = project.get('default_branch','main')
    if req['type'] == 'prepare_worker_project_clone':
        projects = home / 'projects'
        projects.mkdir(mode=0o700, exist_ok=True)
        check(projects.resolve() == projects and projects.stat().st_uid == os.getuid(), 'Unsafe project parent')
        # mkdir(0700) masks inherited named ACL entries; explicitly restore only
        # trusted service traversal before reporting any child clone as ready.
        subprocess.run(['/usr/bin/setfacl', '-m', 'u:botsquad:r-x', str(projects)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        bundle = home / ('seed-' + req['operation_id'] + '.bundle')
        data = base64.b64decode(req['bundle'], validate=True)
        if not bundle.exists():
            fd = os.open(bundle, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
        check(bundle.is_file() and not bundle.is_symlink() and bundle.stat().st_nlink == 1 and bundle.read_bytes() == data, 'Seed bundle changed')
        if not root.exists():
            git(home, ['clone', '--no-hardlinks', '--no-checkout', '--branch', default_branch, '--', str(bundle), str(root)])
        config_path = root / '.git/config'
        check(config_path.is_file() and not config_path.is_symlink() and config_path.stat().st_nlink == 1, 'Unsafe clone config')
        config = config_path.read_text()
        if '[remote "origin"]' in config:
            expected_origin = '[remote "origin"]\n\turl = ' + str(bundle) + '\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n'
            check(expected_origin in config, 'Unexpected seed remote')
            # Remove only exact generated origin/branch config text, before any Git command reads it.
            config = config.replace(expected_origin, '')
            config = config.replace('[branch "'+default_branch+'"]\n\tremote = origin\n\tmerge = refs/heads/'+default_branch+'\n', '')
            config_path.write_text(config)
        safe_tree(root)
        check_git_tree(root,project,project['base_commit'])
        if git(root, ['branch', '--show-current']) != branch:
            check(git(root, ['rev-parse', 'HEAD']) == project['base_commit'], 'Unexpected clone base')
            git(root, ['checkout', '-b', branch, project['base_commit']])
        check(git(root, ['rev-parse', 'HEAD']) == project['base_commit'] and not git(root, ['status', '--porcelain']), 'Clone state mismatch')
        safe_tree(root)
        content_bounds(root,project)
        # Preserve read-only ACL for service on every project entry, including 0600 Git objects.
        subprocess.run(['/usr/bin/setfacl', '-R', '-m', 'u:botsquad:r-X', str(root)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return dict(uid=os.getuid(), gid=os.getgid())
    safe_tree(root)
    check(git(root, ['branch', '--show-current']) == branch and not git(root, ['remote']), 'Project branch or remote mismatch')
    if req['type'] == 'revoke_worker_project_access':
        return dict(uid=os.getuid(), gid=os.getgid())
    marker = home / ('action-' + req['operation_id'] + '.json')
    if marker.exists():
        check(marker.is_file() and not marker.is_symlink() and marker.stat().st_nlink == 1, 'Unsafe action marker')
        return json.loads(marker.read_text())
    result = dict(uid=os.getuid(), gid=os.getgid())
    if req['type'] in ('write_project_source','delete_project_source'):
        authorize_path(project,req['path'])
        check_range(root,project,git(root,['rev-parse','HEAD']))
        if 'manifest' not in project:
            check(git(root,['rev-parse','HEAD']) == project['base_commit'], 'Legacy source frozen')
        path = checked_source(root,req['path'],create=req['type']=='write_project_source')
        if req['type'] == 'delete_project_source':
            check(path.is_file(), 'Source missing')
            path.unlink()
            result.update(path=req['path'],deleted=True)
        else:
            check(len(req['content'].encode()) <= policy['bounds']['file_bytes'], 'Source exceeds allocation limit')
            content_bounds(root,project,path,len(req['content'].encode()))
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
            with os.fdopen(fd, 'w') as stream:
                stream.write(req['content'])
                stream.flush()
                os.fsync(stream.fileno())
            subprocess.run(['/usr/bin/setfacl', '-m', 'u:botsquad:r--', str(path)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            result.update(path=req['path'], bytes=len(req['content'].encode()))
    elif req['type'] == 'commit_project':
        head = git(root, ['rev-parse', 'HEAD'])
        check('expected_head' in req or 'manifest' not in project, 'Expected head required')
        expected = req.get('expected_head',project['base_commit'])
        check_range(root,project,head)
        if head == expected:
            content_bounds(root,project)
            paths = set(filter(None, (git(root, ['diff', '--name-only', '-z', '--no-ext-diff', head]) + '\0' + git(root, ['ls-files', '--others', '--exclude-standard','-z'])).split('\0')))
            check(0 < len(paths) <= policy['bounds']['changed_files'], 'Changed-file bounds exceeded')
            for path in paths:
                authorize_path(project,path)
                check(Path(path).name not in ('.gitmodules','.gitattributes'), 'Unsupported Git feature')
                target = checked_source(root,path)
                check(not target.exists() or target.stat().st_size <= policy['bounds']['file_bytes'], 'Source too large')
            git(root, ['add', '--', *sorted(paths)])
            git(root, ['commit', '-m', 'BotSquad operation ' + req['operation_id']])
        else:
            check(git(root,['rev-parse',head+'^']) == expected and git(root,['log','-1','--format=%s']) == 'BotSquad operation '+req['operation_id'], 'Unexpected commit after lost response')
        commit = git(root, ['rev-parse', 'HEAD'])
        check_range(root,project,commit)
        check(not git(root, ['status', '--porcelain']), 'Submitted history mismatch')
        output = home / ('submit-' + req['operation_id'] + '.bundle')
        if not output.exists():
            git(root, ['bundle', 'create', str(output), branch])
        check(not output.is_symlink() and output.stat().st_nlink == 1 and output.stat().st_size <= policy['bounds']['bundle_bytes'], 'Unsafe submission bundle')
        result.update(commit=commit, bundle=base64.b64encode(output.read_bytes()).decode())
        subprocess.run(['/usr/bin/setfacl', '-R', '-m', 'u:botsquad:r-X', str(root)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        raise Rejected('Unknown worker action')
    # Child marker prevents duplicate commit in a root-receipt crash window. Root receipt is authoritative.
    fd = os.open(marker, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write(canonical(result)); stream.flush(); os.fsync(stream.fileno())
    return result

def serve():
    check(os.geteuid() == 0, 'Provisioner must run as root')
    status = dict(line.split(':', 1) for line in Path('/proc/self/status').read_text().splitlines() if ':' in line)
    check(int(status['CapEff'], 16) & (1 << 7) and status['NoNewPrivs'].strip() == '1', 'Provisioner requires bounded UID-drop capability and NoNewPrivileges')
    service_uid = pwd.getpwnam('botsquad').pw_uid
    for name in ('receipts', 'identities', 'projects'):
        (STATE / name).mkdir(mode=0o700, parents=True, exist_ok=True)
    lock = os.open(STATE / 'lock', os.O_WRONLY | os.O_CREAT | os.O_NOFOLLOW, 0o600)
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    check(os.environ.get('LISTEN_PID') == str(os.getpid()) and os.environ.get('LISTEN_FDS') == '1', 'Requires systemd Unix socket activation')
    listener = socket.socket(fileno=3)
    check(listener.family == socket.AF_UNIX, 'Only Unix sockets are accepted')
    while True:
        connection, _ = listener.accept()
        with connection:
            connection.settimeout(5)
            try:
                _, uid, _ = struct.unpack('3i', connection.getsockopt(socket.SOL_SOCKET, socket.SO_PEERCRED, 12))
                check(uid in (0, service_uid), 'Peer identity denied')
                chunks, size = [], 0
                while True:
                    part = connection.recv(65536)
                    if not part:
                        break
                    size += len(part)
                    check(size <= LIMIT, 'Request exceeds limit')
                    chunks.append(part)
                result = handle(parse(b''.join(chunks)))
                response = {'ok': True, 'result': result}
            except Exception as error:
                # Never log raw input, paths, command output or traceback from privileged code.
                response = {'ok': False, 'error': str(error) if isinstance(error, Rejected) else 'Provisioner operation failed closed (' + type(error).__name__ + ')'}
            try:
                connection.sendall(canonical(response).encode())
            except (BrokenPipeError, TimeoutError):
                pass

if __name__ == '__main__':
    if sys.argv[1:] == ['--worker']:
        try:
            print(canonical(worker_main()))
        except Exception as error:
            print(canonical({'error': str(error) if isinstance(error, Rejected) else 'Worker operation failed closed (' + type(error).__name__ + ')'}))
            raise SystemExit(1) from None
    elif sys.argv[1:]:
        raise SystemExit('Unknown provisioner mode')
    else:
        serve()
