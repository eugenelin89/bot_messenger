#!/usr/bin/python3
"""Private control-plane transport; never accepts a caller-selected endpoint."""
import json
import socket
import sys

LIMIT = 1_000_000
request = sys.stdin.buffer.read(LIMIT + 1)
if len(request) > LIMIT:
    raise SystemExit('Request exceeds limit')
with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as connection:
    connection.settimeout(22)
    connection.connect('/run/botsquad-provisioner/control.sock')
    connection.sendall(request)
    connection.shutdown(socket.SHUT_WR)
    chunks = []
    count = 0
    while True:
        chunk = connection.recv(65536)
        if not chunk:
            break
        count += len(chunk)
        if count > LIMIT:
            raise SystemExit('Response exceeds limit')
        chunks.append(chunk)
    sys.stdout.buffer.write(b''.join(chunks))
