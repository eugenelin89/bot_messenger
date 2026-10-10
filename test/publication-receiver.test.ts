import test from 'node:test';
import { backup } from 'node:sqlite';
import { Store } from '../src/persistence/store.js';
import { PublicationService } from '../src/control/publication/service.js';
import assert from 'node:assert/strict';
import { mkdtempSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sha256 } from '../scripts/investment-contracts/schema.js';
import { pathToFileURL } from 'node:url';
import { publicationFixture } from './fixtures/publication/support.js';
import { FixedPublicationTransport } from '../src/control/publication/transport.js';
import type { Destination } from '../src/domain/publication/types.js';
import type { SignedMessage } from '../scripts/investment-contracts/signatures.js';
const root=process.env.INV07_RECEIVER_ROOT;
test('actual standalone receiver accepts simulator journal, exact content, lost-response GET and restart generation fencing',{skip:!root},async t=>{
 const {config}=await import(pathToFileURL(join(root!,'dist/src/config.js')).href),{createReceiver}=await import(pathToFileURL(join(root!,'dist/src/http.js')).href);
 const f=publicationFixture();t.after(f.cleanup);f.envelope.futureFinancial=true;f.complete();f.artifact({id:'private-synthetic-artifact',version:1,title:'Synthetic research derivative',createdAt:f.clock.now(),approvedAt:f.clock.now(),sourceHash:sha256(Buffer.from('Private fixture original')),bytes:Buffer.from('Synthetic evidence only. No real employee or price claim.'),contentType:'text/markdown',limitations:['Invented fixture']},Buffer.from('Private fixture original'));
 const dir=mkdtempSync(join(tmpdir(),'botsquad-inv07-receiver-'));chmodSync(dir,0o700);const cfg=config({enabled:true,dataDir:dir,authority:'127.0.0.1',port:0,minFreeBytes:1048576});
 const receiver=await createReceiver(cfg,{now:()=>Math.floor(Date.parse(f.clock.now())/1000)});t.after(async()=>{await receiver.close();rmSync(dir,{recursive:true,force:true});});cfg.authority=`127.0.0.1:${receiver.server.address().port}`;f.destination.origin=`http://${cfg.authority}`;
 const wire=new FixedPublicationTransport(),requests:SignedMessage[]=[];let lose=true;
 const transport={send:async(d:Destination,m:SignedMessage)=>{requests.push(m);const response=await wire.send(d,m);if(lose&&m.path.endsWith('/events')&&response.status===201){lose=false;throw new Error('test loss after actual receiver commit');}return response;}};
 let s=f.configured(transport);const preview=s.preview(f.envelope),{channelId}=s.consent({previewId:preview.id,digest:preview.digest}),run=preview.material.events[0]!.event;
 const scope={publisherId:f.destination.publisherId,keyId:f.destination.keyId,experimentId:run.experimentId,runId:run.runId,eventTypes:f.envelope.eventTypes,contentTypes:f.envelope.contentTypes,publicationPolicyVersion:run.publicationPolicyVersion,expiresAt:f.envelope.expiresAt,enabled:true,generation:'1',writesPerMinute:60,bytesPerDay:1048576};
 const key={publicKey:f.key.publicKey.export({type:'spki',format:'pem'}).toString(),notBefore:0,notAfter:2000000000};receiver.db.authorize(scope,key,f.clock.now());
 const emptyRestart=f.configured(transport);emptyRestart.control({channelId,action:'generation',keyId:null,generation:'2'});const emptyPreview=emptyRestart.preview(f.envelope);emptyRestart.consent({previewId:emptyPreview.id,digest:emptyPreview.digest});scope.generation='2';receiver.db.authorize(scope,key,f.clock.now());await emptyRestart.reconcile({channelId});s=emptyRestart;
 const backupPath=join(dir,'hq-backup.sqlite');let saved=false,expired=false;
 for(let i=0;i<50&&s.health(channelId).pending;i++){await s.deliver({channelId});if(!expired&&requests.some(m=>m.method==='PUT')){f.clock.set(new Date(Date.parse(f.clock.now())+90001000).toISOString());assert.equal((await receiver.storage.cleanup(Math.floor(Date.parse(f.clock.now())/1000))).removed,1);expired=true;}if(!saved&&s.health(channelId).jobs.some(j=>j.kind==='batch'&&j.state==='delivered')){await backup(f.store.db,backupPath);saved=true;}f.clock.set(new Date(Date.parse(f.clock.now())+2000).toISOString());}
 assert.equal(s.health(channelId).pending,0,JSON.stringify(s.health(channelId)));assert.equal(requests.filter(m=>m.method==='GET'&&!m.path.endsWith('/status')).length,2);assert.equal(requests.filter(m=>m.method==='PUT').length,2,'same bytes refresh expired staging');
 const prefix=`${f.destination.origin}/api/experiments/v1/experiments/${run.experimentId}/runs/${run.runId}`;
 const status=await fetch(`${prefix}/status`);assert.equal(status.status,200);const body=await status.json() as {watermark:{journalSequence:string}};assert.equal(body.watermark.journalSequence,'2');
 const artifact=preview.material.events.find(x=>x.event.type==='artifact.published')!.event;if(artifact.type!=='artifact.published')throw new Error('fixture');
 const downloaded=await fetch(`${prefix}/artifacts/${artifact.payload.artifactId}/versions/1/content`);assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),f.description.artifacts[0]!.bytes);
 const old=f.market.prices().find(e=>e.instrumentId==='ACME'&&e.field==='regular_close')!,correction=f.price('ACME','2026-03-06','regular_close','110',{sourceVersion:2,status:'verified',correctionOf:old.id});f.admitted.execute(f.config.runId,{type:'revise_valuations',correctionId:correction.id},'actual-receiver-correction');f.call({type:'control',state:'paused'});assert.ok(s.health(channelId).unstaged>0);s.capture({channelId});for(let i=0;i<5&&s.health(channelId).pending;i++)await s.deliver({channelId});assert.equal(s.health(channelId).pending,0);assert.equal(s.health(channelId).unstaged,0);
 // Receiver current-generation authority is installed only into disposable isolated state.
 const restoredStore=new Store(backupPath);try{const restored=new PublicationService(restoredStore,{sources:[f.source],destinations:[f.destination],keys:f.keys,transport,clock:f.clock});restored.control({channelId,action:'generation',keyId:null,generation:'3'});const p=restored.preview(f.envelope);restored.consent({previewId:p.id,digest:p.digest});receiver.db.authorize({...scope,generation:'3'},key,f.clock.now());await assert.rejects(restored.reconcile({channelId}),/restore_current_watermark_conflict/);assert.equal(restored.health(channelId).restoreRequired,true);}finally{restoredStore.close();}
 const restarted=f.configured(transport);await assert.rejects(restarted.deliver({channelId}),/restore_reconciliation_required/);
 restarted.control({channelId,action:'generation',keyId:null,generation:'4'});const renewed=restarted.preview(f.envelope);restarted.consent({previewId:renewed.id,digest:renewed.digest});await assert.rejects(restarted.reconcile({channelId}),/restore_receipt_required/);
 receiver.db.authorize({...scope,generation:'4'},key,f.clock.now());await restarted.reconcile({channelId});assert.equal(restarted.health(channelId).restoreRequired,false);
 restarted.heartbeat({channelId});await restarted.deliver({channelId});assert.equal(restarted.health(channelId).pending,0);
});
