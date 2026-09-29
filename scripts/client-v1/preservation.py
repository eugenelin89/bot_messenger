#!/usr/bin/env python3
"""Root/operator-only Prompt 06 preservation evidence. Never reads Codex credentials.
Snapshot contains hashes of original database rows and root receipts, not their values.
Use snapshot before mutation and compare after deployment/reboot. No domain writes.
"""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys

ROOT = Path('/var/lib/botsquad')
LEDGERS = Path('/var/lib/botsquad-provisioner')


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), default=lambda x: x.hex() if isinstance(x, bytes) else str(x)).encode()).hexdigest()


def database(path, original=None):
    db = sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)
    try:
        if db.execute('PRAGMA quick_check').fetchone()[0] != 'ok' or list(db.execute('PRAGMA foreign_key_check')):
            raise RuntimeError('Database integrity check failed')
        names = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
        tables = {}
        for name in original or names:
            if name not in names:
                raise RuntimeError('Retained table missing')
            info = list(db.execute('PRAGMA table_info("' + name.replace('"', '""') + '")'))
            columns = original[name]['columns'] if original else [r[1] for r in info if not (name == 'workers' and r[1] == 'updated_at')]
            keys = original[name]['keys'] if original else [r[1] for r in sorted(info, key=lambda r: r[5]) if r[5]]
            select = ','.join('"' + c.replace('"', '""') + '"' for c in columns)
            rows = {}
            for row in db.execute('SELECT ' + select + ' FROM "' + name.replace('"', '""') + '"'):
                values = dict(zip(columns, row))
                key = digest([values[k] for k in keys]) if keys else digest(row)
                rows[key] = digest(row)
            tables[name] = {'columns': columns, 'keys': keys, 'rows': rows}
        return tables
    finally:
        db.close()


def accounts():
    result = {}
    for line in subprocess.check_output(['getent', 'passwd'], text=True).splitlines():
        values = line.split(':')
        if values[0] == 'botsquad' or values[0].startswith('bsw-'):
            result[values[0]] = digest(values)
    for line in subprocess.check_output(['getent', 'group'], text=True).splitlines():
        values = line.split(':')
        if values[0] == 'botsquad' or values[0].startswith('bsw-'):
            result['group:' + values[0]] = digest(values)
    return result


def ledgers():
    return {str(p.relative_to(LEDGERS)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(LEDGERS.rglob('*.json')) if p.is_file() and not p.is_symlink()}


def homes():
    result = {}
    for p in sorted(Path('/var/lib/botsquad-workers').iterdir()):
        if p.is_symlink() or not p.is_dir():
            continue
        stat = p.stat()
        acl = subprocess.check_output(['getfacl', '-cp', str(p)], text=True)
        result[p.name] = {'uid': stat.st_uid, 'gid': stat.st_gid, 'mode': stat.st_mode & 0o7777, 'acl_hash': digest(acl)}
    return result


def snapshot():
    return {'databases': {str(p.relative_to(ROOT)): database(p) for p in sorted(ROOT.rglob('company.sqlite')) if not p.is_symlink()}, 'accounts': accounts(), 'ledgers': ledgers(), 'homes': homes()}


def compare(before):
    checked_rows = 0
    for name, tables in before['databases'].items():
        current = database(ROOT / name, tables)
        for table, saved in tables.items():
            for key, value in saved['rows'].items():
                if current[table]['rows'].get(key) != value:
                    raise RuntimeError('Retained database row changed: ' + name + ':' + table)
                checked_rows += 1
            if table not in ['audit_events', 'schema_migrations'] and len(current[table]['rows']) != len(saved['rows']):
                raise RuntimeError('Unexpected retained domain growth: ' + name + ':' + table)
    for category, actual in [('accounts', accounts()), ('ledgers', ledgers()), ('homes', homes())]:
        for name, value in before[category].items():
            if actual.get(name) != value:
                raise RuntimeError('Retained ' + category + ' entry changed')
    return {'preserved': True, 'original_databases': len(before['databases']), 'original_rows': checked_rows, 'account_and_group_mappings': len(before['accounts']), 'root_records': len(before['ledgers']), 'worker_homes': len(before['homes']), 'only_excluded_field': 'workers.updated_at'}


if __name__ == '__main__':
    if os.geteuid() != 0 or len(sys.argv) != 3 or sys.argv[1] not in ['snapshot', 'compare']:
        raise SystemExit('Usage (root on HQ): preservation.py snapshot|compare EXACT_PRIVATE_INVENTORY_PATH')
    path = Path(sys.argv[2])
    if not path.is_absolute() or not str(path).startswith('/var/backups/botsquad/'):
        raise SystemExit('Inventory must be in the exact private BotSquad backup tree')
    if sys.argv[1] == 'snapshot':
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        if path.parent.stat().st_mode & 0o077:
            raise SystemExit('Inventory parent must be private')
        value = snapshot()
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as out:
            json.dump(value, out, sort_keys=True)
        print(json.dumps({'snapshot_saved': True, 'databases': len(value['databases']), 'root_records': len(value['ledgers']), 'worker_homes': len(value['homes'])}))
    else:
        print(json.dumps(compare(json.loads(path.read_text()))))
