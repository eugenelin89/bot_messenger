"""Independent non-data lifetime guard. No Yahoo imports, sockets, response data or keys.

Survives JS supervisor death. An EOF or deadline kills the admitted data process group
and runs the fixed recovery command with only the remaining overall time allowance.
"""
import json
import os
import select
import signal
import subprocess
import sys
import time
import resource

resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
node, script, cleanup_json, limits_json = sys.argv[1:]
cleanup_args = json.loads(cleanup_json)
limits = json.loads(limits_json)
assert 0 < limits['processMs'] <= 180000 and 0 < limits['operationMs'] <= 120000 and 0 < limits['wireMs'] <= 10000
end = time.monotonic() + limits['processMs'] / 1000
operation_end = wire_end = None
active = None
ordinal = 0
pending = None
buffer = b''


def kill_group(pid):
    if pid:
        try:
            os.killpg(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


def gone(pid):
    try:
        os.killpg(pid, 0)
        return False
    except ProcessLookupError:
        return True


def emit(value):
    sys.stdout.write(json.dumps(value) + '\n')
    sys.stdout.flush()


try:
    emit({'ready': True})
    while True:
        now = time.monotonic()
        deadline = min(v for v in (end, operation_end, wire_end) if v is not None)
        if now >= deadline:
            break
        ready, _, _ = select.select([sys.stdin.buffer], [], [], min(deadline - now, 0.1))
        if not ready:
            continue
        data = os.read(sys.stdin.fileno(), 4096)
        if not data:
            break  # Supervisor vanished, even if data child's event loop is blocked.
        buffer += data
        if len(buffer) > 8192:
            break
        while b'\n' in buffer:
            line, buffer = buffer.split(b'\n', 1)
            item = json.loads(line)
            command, value = item['command'], item.get('value')
            if command in ('data', 'cleanup'):
                assert active is None and isinstance(value, int) and value > 1 and value != os.getpgrp()
                active = value
                operation_end = time.monotonic() + limits['operationMs'] / 1000 if command == 'data' else None
            elif command == 'wire':
                assert active and pending is None and value == ordinal + 1 and value <= 6
                ordinal = pending = value
                wire_end = time.monotonic() + limits['wireMs'] / 1000
            elif command == 'settled':
                assert pending == value
                pending = None
                wire_end = None
            elif command == 'clear':
                assert active == value and gone(active)
                active = None
                operation_end = wire_end = None
                pending = None
            elif command == 'done':
                assert active is None
                emit({'ack': item['id']})
                raise SystemExit(0)
            else:
                raise ValueError('watchdog_protocol')
            emit({'ack': item['id']})
except SystemExit:
    raise
except BaseException:
    pass  # No arbitrary exception or path text enters console/logs.

kill_group(active)
while active and not gone(active) and time.monotonic() < end:
    time.sleep(0.01)
# Recovery independently checks original PID/group and durable capsule ownership.
remaining = end - time.monotonic()
if remaining > 0 and (not active or gone(active)):
    recovery = None
    try:
        recovery = subprocess.Popen([node, script, *cleanup_args], stdin=subprocess.DEVNULL,
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                    start_new_session=True, env={'PATH': os.environ.get('PATH', '/usr/bin:/bin'), 'LANG': 'C', 'TMPDIR': '/private/tmp'})
        recovery.wait(timeout=remaining)
    except BaseException:
        if recovery:
            kill_group(recovery.pid)
            recovery.wait()
raise SystemExit(1)
