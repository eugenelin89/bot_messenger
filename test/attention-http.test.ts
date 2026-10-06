import {test} from 'node:test';
import assert from 'node:assert/strict';
import {request as nodeRequest} from 'node:http';
import {join} from 'node:path';
import {rmSync} from 'node:fs';
import {fixture} from './helpers.js';
import {createHttpServer} from '../src/http/server.js';
import {databaseImage,task,device} from './attention-helpers.js';

test('Attention HTTP is SELECT-only, sanitized, bounded and uses existing browser boundaries',async t=>{
 const f=fixture();task(f,'failed','SECRET private document /hidden/path');device(f);f.company.initializeNix();
 const http=createHttpServer(f.company,f.dispatcher,join(process.cwd(),'public'));await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await http.close();await f.close();rmSync(f.dir,{recursive:true,force:true});});
 const url=`http://127.0.0.1:${(http.server.address() as {port:number}).port}`,before=databaseImage(f);
 for(let i=0;i<3;i++){const response=await fetch(url+'/api/attention');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const body=await response.json() as any;assert.equal(body.total,3);assert.doesNotMatch(JSON.stringify(body),/SECRET|hidden\/path|private document|secret_hash|capabilities|SHA256:|parameters|workspace_path/);}
 assert.deepEqual(databaseImage(f),before);assert.equal(f.runtime.calls.length,0);
 for(const headers of ([{Origin:'https://attacker.example'},{'Sec-Fetch-Site':'cross-site'},{Authorization:'Bearer device-token'}] as Record<string,string>[]))assert.equal((await fetch(url+'/api/attention',{headers})).status,403);
 const host=await new Promise<number>(resolve=>{const r=nodeRequest(url+'/api/attention',{headers:{Host:'attacker.example'}},s=>{s.resume();resolve(s.statusCode!);});r.end();});assert.equal(host,403);
 const {csrfToken}=await (await fetch(url+'/api/session')).json() as {csrfToken:string};
 assert.equal((await fetch(url+'/api/attention',{method:'POST',headers:{'Content-Type':'application/json','X-BotSquad-Token':csrfToken},body:'{}'})).status,404);
 assert.notEqual((await fetch(url+'/api/v1/attention')).status,200);
});
