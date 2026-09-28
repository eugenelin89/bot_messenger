import importlib.util
import json
import os
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
        for path in ['/etc/passwd', '../src/calculate.mjs', '.git/config', 'src/calculate.mjs;id', 'a//b', 'src/.git/x']:
            with self.assertRaises(p.Rejected): p.parse(json.dumps(dict(base, path=path)).encode())
        with self.assertRaises(p.Rejected): p.parse(json.dumps(dict(base, path='src/calculate.mjs', content='a' * (p.FILE_LIMIT+1))).encode())
        p.parse(json.dumps(dict(base, path='src/calculate.mjs')).encode())

    def test_persisted_legacy_and_generic_scope(self):
        legacy = {'module': 'calculate', 'task_id': 'task_12345678-1234-1234-1234-123456789abc'}
        p.authorize_path(legacy, 'src/calculate.mjs')
        for path in ['src/x.mjs', 'src/format.mjs', 'test/calculate.test.mjs']:
            with self.assertRaises(p.Rejected): p.authorize_path(legacy, path)
        manifest = dict(allocation_id=ALLOC,worker_id=WORKER,repository_id='repository_12345678-1234-1234-1234-123456789abc',
                        task_id=legacy['task_id'],branch_name='botsquad/task/'+legacy['task_id'],base_commit='a'*40,
                        write_scope=['src/parser/'],protected_paths=['AGENTS.md','.github/','.botsquad/','src/parser/protected/'],
                        bounds=dict(repository_bytes=16*1024*1024,bundle_bytes=p.BUNDLE_LIMIT,files=1000,file_bytes=p.FILE_LIMIT,diff_bytes=256*1024,changed_files=100,commits=16))
        request = dict(type='prepare_worker_project_clone',operation_id=OP,default_branch='trunk',bundle='YQ==',manifest=json.dumps(manifest),manifest_hash=p.digest(p.canonical(manifest).encode()),
                       **{k:manifest[k] for k in ('allocation_id','worker_id','repository_id','task_id','base_commit')})
        self.assertEqual(p.parse(json.dumps(request).encode()), request)
        project = dict(manifest=manifest,manifest_hash=request['manifest_hash'])
        for path in ['src/parser/new.mjs','src/parser/nested/test.mjs']: p.authorize_path(project,path)
        for path in ['src/other/a.mjs','src/parser/AGENTS.md','src/parser/protected/a.mjs','src/parser/.git/config']:
            with self.assertRaises(p.Rejected): p.authorize_path(project,path)
        with self.assertRaises(p.Rejected): p.parse(json.dumps(dict(request,manifest_hash='0'*64)).encode())
        with self.assertRaises(p.Rejected): p.parse(json.dumps(dict(request,worker_id='worker_aaaaaaaa-1234-1234-1234-123456789abc')).encode())
        for field in ['allocation_id', 'repository_id', 'task_id']:
            wrong = request[field].replace('12345678-', 'aaaaaaaa-', 1)
            with self.assertRaisesRegex(p.Rejected, 'identity mismatch'):
                p.parse(json.dumps(dict(request, **{field: wrong})).encode())
        for path in ['src/parser2/new.mjs', 'src/parser/agents.md', 'src/parser/PROTECTED/a.mjs']:
            with self.assertRaisesRegex(p.Rejected, 'persisted allocation scope'): p.authorize_path(project, path)
        with self.assertRaisesRegex(p.Rejected, 'Unknown or missing'):
            p.parse(json.dumps(dict(type='write_project_source',operation_id=OP,worker_id=WORKER,allocation_id=ALLOC,path='src/parser/new.mjs',content='x',manifest=request['manifest'])).encode())
        manifest['write_scope']=['src/']
        with self.assertRaises(p.Rejected): p.authorize_path(project,'src/other/a.mjs')

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
            root = Path(temporary).resolve()
            (root / 'escape').symlink_to('/etc/passwd')
            with self.assertRaisesRegex(p.Rejected, 'Nonregular project entry'): p.safe_tree(root)
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary).resolve()
            (root / 'original').write_text('unchanged')
            os.link(root / 'original', root / 'alias')
            with self.assertRaisesRegex(p.Rejected, 'hardlink'): p.safe_tree(root)

if __name__ == '__main__': unittest.main()
