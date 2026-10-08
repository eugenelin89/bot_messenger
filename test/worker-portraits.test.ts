import {test, type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {request} from 'node:http';
import {fixture} from './helpers.js';
import {createHttpServer} from '../src/http/server.js';
const manifest=JSON.parse(readFileSync('docs/validation/evidence/personal04/portraits.json','utf8')) as {portraits:{name:string;destination:string;bytes:number;sha256:string;git_blob:string}[]};
async function setup(t:TestContext,publicDir=join(process.cwd(),'public')) {
  const f=fixture(),http=createHttpServer(f.company,f.dispatcher,publicDir);
  await new Promise<void>(r=>http.server.listen(0,'127.0.0.1',r));
  t.after(async()=>{await http.close();await f.close();});
  const port=(http.server.address() as {port:number}).port;
  return {f,port,get:(path:string)=>new Promise<{status:number;headers:any;body:Buffer}>((resolve,reject)=>{
    const req=request({hostname:'127.0.0.1',port,path},res=>{const chunks:Buffer[]=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode!,headers:res.headers,body:Buffer.concat(chunks)}));});req.on('error',reject);req.end();
  })};
}
test('all seven approved portrait routes serve exact source bytes, hashes, MIME and security headers',async t=>{
  const {get}=await setup(t);assert.equal(manifest.portraits.length,7);
  for(const p of manifest.portraits){const r=await get('/'+p.destination.slice('public/'.length));assert.equal(r.status,200,p.name);assert.equal(r.headers['content-type'],'image/webp');assert.equal(r.headers['x-content-type-options'],'nosniff');assert.match(r.headers['content-security-policy'],/img-src 'self'/);assert.doesNotMatch(r.headers['cache-control'],/immutable/);assert.equal(r.body.length,p.bytes);assert.deepEqual(r.body,readFileSync(p.destination));assert.equal(createHash('sha256').update(r.body).digest('hex'),p.sha256);assert.equal(createHash('sha1').update(`blob ${r.body.length}\0`).update(r.body).digest('hex'),p.git_blob);}
  assert.equal((await get('/worker-portraits.js')).headers['content-type'],'text/javascript; charset=utf-8');
});
test('unknown files, prototype names and raw or encoded traversal cannot escape fixed routes',async t=>{
 const {get,f}=await setup(t);
 const worker=f.company.initializeCEO();
 assert.equal((await get('/api/research/workers/%77'+worker.worker_id.slice(1))).status,200,'ordinary encoded worker ID still resolves');
 for(const path of ['/images\\workers\\..\\..\\api\\session','/%69mages/workers/../../api/session','/images/workers/nix.webp','/images/workers/unknown.webp','/images/workers/atlas.png','/images/workers/../app.js','/images/workers/../../app.js','/images/workers/../../api/state','/images/workers/%2e%2e/%2e%2e/app.js','/images/workers/%252e%252e/app.js','/images/workers/..%2f..%2fapp.js','/images%2fworkers%2fatlas.webp','/images/workers/atlas.webp%00','/images/workers//atlas.webp','/images/workers/%61tlas.webp','/images/workers/atlas.webp/','/constructor','/__proto__']) assert.equal((await get(path)).status,404,path);
});
for(const component of ['images','workers','file'])test(`portrait serving rejects a symlinked ${component} component`,async t=>{
 const f=fixture();t.after(()=>f.close());const root=join(f.dir,'public');mkdirSync(root);mkdirSync(join(f.dir,'target'));
 if(component==='images')symlinkSync(join(process.cwd(),'public/images'),join(root,'images'));
 else{mkdirSync(join(root,'images'));if(component==='workers')symlinkSync(join(process.cwd(),'public/images/workers'),join(root,'images/workers'));else{mkdirSync(join(root,'images/workers'));symlinkSync(join(process.cwd(),'public/images/workers/atlas.webp'),join(root,'images/workers/atlas.webp'));}}
 const {get}=await setup(t,root);assert.equal((await get('/images/workers/atlas.webp')).status,404);
});
