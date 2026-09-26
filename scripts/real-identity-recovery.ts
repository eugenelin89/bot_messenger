// Real Linux receipt recovery with a deliberately lost transport response. The fault
// exists only in this acceptance entrypoint, never in the production request path.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Company } from '../src/control/company.js';
import { Dispatcher } from '../src/control/dispatcher.js';
import { LinuxHost, type HostClient } from '../src/infrastructure/client.js';
import { Store } from '../src/persistence/store.js';
import { CodexRuntime } from '../src/runtime/codex.js';
import { createHttpServer } from '../src/http/server.js';

const data = resolve(process.env.BOT_VALIDATION_DIR!);
assert.ok(data.startsWith('/var/lib/botsquad/validation/recovery-'));
mkdirSync(data, {recursive:true,mode:0o700});
const host = new LinuxHost();
let lost: Record<string,unknown> | undefined;
const fault: HostClient = {backend:'linux',request(request) {
  const response = host.request(request);
  if (request.type === 'create_worker_identity' && !lost) { lost=response; throw new Error('Acceptance-only lost response after real host completion'); }
  return response;
}};
async function open(client: HostClient) {
  const store=new Store(join(data,'company.sqlite'));
  const company=new Company(store,data,process.cwd(),'codex-app-server',client);
  const dispatcher=new Dispatcher(company,new CodexRuntime());
  const http=createHttpServer(company,dispatcher,join(process.cwd(),'public'));
  await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${(http.server.address() as {port:number}).port}`;
  const {csrfToken}=await (await fetch(url+'/api/session')).json() as {csrfToken:string};
  async function post(path:string,body:unknown) {
    const result=await fetch(url+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-BotSquad-Token':csrfToken},body:JSON.stringify(body)});
    assert.equal(result.status,200); return result.json() as Promise<Record<string,unknown>>;
  }
  return {store,company,post,async close(){await http.close();await dispatcher.stop();store.close();}};
}
let app=await open(fault);
try {
  assert.equal(app.company.workers().length,0);
  await app.post('initialize-nix',{});
  const op=app.company.infrastructure.operations()[0]!;
  const response=await app.post('approvals/decide',{approval_id:op.approval_id,operation_id:op.operation_id,decision:'approve'});
  assert.equal(response.status,'running'); assert.ok(lost); assert.equal(lost.state,'ready');
  assert.equal(app.company.infrastructure.approvals()[0]!.status,'consumed');
  assert.equal(app.company.infrastructure.identity(op.target_worker_id).state,'unprovisioned');
  writeFileSync(join(data,'lost-response-state.json'),JSON.stringify(app.company.snapshot(),null,2));
  await app.close(); app=await open(host); app.company.recover();
  const recovered=app.company.infrastructure.operations()[0]!;
  assert.equal(recovered.status,'completed');assert.equal(app.company.infrastructure.identity(op.target_worker_id).uid,lost.uid);
  assert.equal(app.company.infrastructure.approvals().length,1);
  const request={type:op.operation_type,operation_id:op.operation_id,...JSON.parse(op.parameters)};
  assert.deepEqual(host.request(request),lost);
  assert.throws(()=>host.request({...request,type:'disable_worker_identity'}),/Operation ID payload mismatch/);
  writeFileSync(join(data,'state.json'),JSON.stringify(app.company.snapshot(),null,2));
  writeFileSync(join(data,'evidence.json'),JSON.stringify({result:'PASS',operation_id:op.operation_id,approval_id:op.approval_id,worker_id:op.target_worker_id,uid:lost.uid,real_host_completed_before_response_loss:true,consumed_approval_recovered_on_restart:true,same_receipt_replayed:true,changed_payload_rejected:true},null,2));
  console.log('PASS: real host completion, lost response, restart reconciliation and exact receipt replay');
} finally { await app.close(); }
