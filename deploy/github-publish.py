#!/usr/bin/python3
"""One bounded smart-HTTP publication. Credentials stay in the service boundary.
The input is a prebuilt single-ref packet, already bound to a consumed approval.
No URL redirects, credential helpers, ambient proxy configuration or subprocesses.
"""
import base64
import http.client
import json
import os
import re
import stat
import sys


def packets(data):
    result, pos = [], 0
    while pos < len(data):
        if not re.fullmatch(b'[0-9a-fA-F]{4}', data[pos:pos + 4]):
            raise ValueError('invalid protocol')
        size = int(data[pos:pos + 4], 16)
        pos += 4
        if not size:
            continue
        if size < 4 or pos + size - 4 > len(data):
            raise ValueError('invalid packet length')
        result.append(data[pos:pos + size - 4])
        pos += size - 4
    return result


def main():
    identity, branch, old, new, token_path = sys.argv[1:]
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]*/[a-z0-9_.-]+', identity) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_/-]{0,99}', branch):
        raise ValueError('invalid target')
    if not all(re.fullmatch(r'[0-9a-f]{40}', sha) for sha in [old, new]) or old == new or old == '0' * 40 or new == '0' * 40:
        raise ValueError('invalid update')
    if os.path.realpath(token_path) != token_path:
        raise ValueError('credential path must be canonical')
    fd = os.open(token_path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        st = os.fstat(fd)
        if not stat.S_ISREG(st.st_mode) or st.st_uid != os.getuid() or st.st_nlink != 1 or st.st_mode & 0o077 or st.st_size > 4096:
            raise ValueError('credential file ownership or permissions')
        token = os.read(fd, 4097).strip()
        if not token or not re.fullmatch(b'[A-Za-z0-9_]+', token):
            raise ValueError('invalid credential format')
    finally:
        os.close(fd)
    payload = sys.stdin.buffer.read(4 * 1024 * 1024 + 2049)
    command = (old + ' ' + new + ' refs/heads/' + branch + '\0report-status\n').encode()
    prefix = ('%04x' % (len(command) + 4)).encode() + command + b'0000'
    if len(payload) > 4 * 1024 * 1024 + 2048 or not payload.startswith(prefix + b'PACK'):
        raise ValueError('invalid exact publication packet')
    auth = 'Basic ' + base64.b64encode(b'x-access-token:' + token).decode()
    headers = {'Authorization': auth, 'User-Agent': 'BotSquad', 'Accept': '*/*'}
    conn = http.client.HTTPSConnection('github.com', timeout=15)
    conn.request('GET', '/' + identity + '.git/info/refs?service=git-receive-pack', headers=headers)
    response = conn.getresponse()
    if response.status != 200 or response.getheader('Content-Type', '').split(';')[0] != 'application/x-git-receive-pack-advertisement':
        raise ValueError('publication discovery denied')
    advertisement = response.read(65537)
    if len(advertisement) > 65536:
        raise ValueError('advertisement too large')
    lines = packets(advertisement)
    refs = [line for line in lines if b' refs/' in line]
    if not refs or b'report-status' not in refs[0].split(b'\0', 1)[-1].split():
        raise ValueError('required protocol unavailable')
    target = [line.split(b'\0', 1)[0].strip() for line in refs if line.split(b'\0', 1)[0].strip().endswith((' refs/heads/' + branch).encode())]
    if target != [(old + ' refs/heads/' + branch).encode()]:
        raise ValueError('remote changed before publication')
    headers.update({'Content-Type': 'application/x-git-receive-pack-request', 'Accept': 'application/x-git-receive-pack-result'})
    conn.request('POST', '/' + identity + '.git/git-receive-pack', body=payload, headers=headers)
    response = conn.getresponse()
    if response.status != 200 or response.getheader('Content-Type', '').split(';')[0] != 'application/x-git-receive-pack-result':
        raise ValueError('publication response unavailable')
    result = response.read(65537)
    if len(result) > 65536:
        raise ValueError('publication response too large')
    lines = [line.strip() for line in packets(result)]
    if lines != [b'unpack ok', ('ok refs/heads/' + branch).encode()]:
        raise ValueError('publication rejected')
    print(json.dumps({'published': True}))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Never print request headers, server bodies, token material or exception repr.
        print('Trusted GitHub publication failed; inspect remote state.', file=sys.stderr)
        sys.exit(1)
