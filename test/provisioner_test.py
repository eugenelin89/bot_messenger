import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('provisioner', Path(__file__).resolve().parents[1] / 'deploy/provisioner/provisioner.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
WORKER = 'worker_12345678-1234-1234-1234-123456789abc'
OP = 'operation_12345678-1234-1234-1234-123456789abc'
ALLOC = 'allocation_12345678-1234-1234-1234-123456789abc'

class Protocol(unittest.TestCase):
    def request(self, **fields):
        return dict(type='create_worker_identity', operation_id=OP, worker_id=WORKER, **fields)

    def test_known_operation(self):
        self.assertEqual(p.parse(json.dumps(self.request()).encode()), self.request())

    def test_unknown_fields_and_operations(self):
        for request in [self.request(username='root'), self.request(path='/etc/passwd'), self.request(command='id'),
                        {'type': 'exec', 'command': 'id'}, {'type': 'restart_service', 'service': 'ssh'}]:
            with self.assertRaises(p.Rejected): p.parse(json.dumps(request).encode())

    def test_duplicate_keys_and_bounds(self):
        for raw in [b'{"type":"inspect_host_health","type":"exec"}', b' ' * (p.LIMIT + 1), b'[]', b'null', b'{', b'{"type":NaN}']:
            with self.assertRaises(p.Rejected): p.parse(raw)

    def test_identifiers_and_metacharacters(self):
        for worker in ['root', '../root', WORKER + ';id', WORKER + '\n', 'worker_中文', WORKER.upper()]:
            with self.assertRaises(p.Rejected): p.parse(json.dumps(dict(self.request(), worker_id=worker)).encode())

    def test_write_scope(self):
        base = dict(type='write_project_source', operation_id=OP, worker_id=WORKER, allocation_id=ALLOC, content='x')
        for path in ['/etc/passwd', '../src/calculate.mjs', '.git/config', 'src/x.mjs', 'src/calculate.mjs;id']:
            with self.assertRaises(p.Rejected): p.parse(json.dumps(dict(base, path=path)).encode())
        with self.assertRaises(p.Rejected): p.parse(json.dumps(dict(base, path='src/calculate.mjs', content='a' * 16001)).encode())
        p.parse(json.dumps(dict(base, path='src/calculate.mjs')).encode())

    def test_receipt_replay_and_payload_mismatch(self):
        with tempfile.TemporaryDirectory() as temporary, patch.object(p, 'STATE', Path(temporary)):
            (Path(temporary) / 'receipts').mkdir()
            with patch.object(p, 'perform', return_value={'ok': 'receipt'}) as perform:
                self.assertEqual(p.handle(self.request()), {'ok': 'receipt'})
                self.assertEqual(p.handle(self.request()), {'ok': 'receipt'})
                self.assertEqual(perform.call_count, 1)
                with self.assertRaises(p.Rejected): p.handle(dict(self.request(), type='disable_worker_identity'))
                self.assertEqual(perform.call_count, 1)

    def test_started_receipt_survives_failure_and_reopens(self):
        with tempfile.TemporaryDirectory() as temporary, patch.object(p, 'STATE', Path(temporary)):
            (Path(temporary) / 'receipts').mkdir()
            with patch.object(p, 'perform', side_effect=RuntimeError('lost host response')):
                with self.assertRaises(RuntimeError): p.handle(self.request())
            receipt = p.load(Path(temporary) / 'receipts' / (OP + '.json'))
            self.assertEqual(receipt['state'], 'started')
            with patch.object(p, 'perform', return_value={'recovered': True}):
                self.assertEqual(p.handle(self.request()), {'recovered': True})

    def test_no_symlink_or_hardlink_tree(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'escape').symlink_to('/etc/passwd')
            with self.assertRaises(p.Rejected): p.safe_tree(root)

if __name__ == '__main__': unittest.main()
