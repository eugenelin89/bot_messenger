/** Authored disposable production-purpose stores, not operational grants or provider acceptance. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {acquireDataLock} from '../src/persistence/lock.js';
import {generateKeyPairSync} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,realpathSync,existsSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {Store} from '../src/persistence/store.js';
import {Company} from '../src/control/company.js';
import {AskAuthorityJournal} from '../src/control/ask/authority-journal.js';
import {AskControlJournal} from '../src/control/ask/control-journal.js';
import {AskPrivateContent} from '../src/control/ask/private-content.js';
import {loadOperationalAsk,type AskOperationalConfiguration,type LoadedAsk} from '../src/control/ask/operational.js';
import {askApiAccountDigest} from '../src/runtime/openai-ask.js';
import {ASK_API_POLICY as p,ASK_API_DIGESTS} from '../src/domain/ask/api-policy.js';
import type {AskGrant} from '../src/domain/ask/authority.js';
import {canonicalHash as h} from '../scripts/investment-contracts/schema.js';
const ex=JSON.parse(readFileSync('contracts/investment/v1/responses.json','utf8')).examples;
function setup(fixtureGenesis=false){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'ask-operational-'))),dir=(n:string)=>{const path=join(root,n);mkdirSync(path,{mode:0o700});return path;};
 const hq=dir('hq'),raw=dir('raw'),authority=dir('authority'),checkpoint=dir('checkpoint'),backup=dir('backup'),workspace=dir('public-workspace');
 const file=(n:string,value:string)=>{const path=join(root,n);writeFileSync(path,value,{mode:0o600});return path;};
 const db=new Store(join(hq,'company.sqlite'));let company=new Company(db,hq,process.cwd(),'fake');const worker=company.initializeCEO(),hqId='authored-operational-hq';db.run('INSERT INTO client_hq VALUES(1,?,?)',hqId,'2026-01-05T21:32:00.000Z');
 let at='2026-01-05T21:32:00.000Z';company.mandates.clock={now:()=>Date.parse(at)};
 const approved={scope:structuredClone(ex.AskServiceScope),limits:{...structuredClone(ex.AskLimits),monetaryEnforcement:'verified_cap',dailyBudgetUsd:'5',maxRouterExecutions:0,maxInputTokens:p.maxInputTokens,maxOutputTokens:p.maxOutputTokens,dailyTokens:1612288},roster:structuredClone(ex.AskRoster)};
 const credentialFile=file('credential','sk-authored-disposable-key-not-valid'),accountDigest=askApiAccountDigest(credentialFile),key=generateKeyPairSync('ed25519');
 const config:AskOperationalConfiguration={version:1,enabled:true,hqId,grantId:'authored-api-grant',approved,
  workers:[{publicId:'fixture-author',workerId:worker.worker_id,workspace,eligibility:{workerId:'fixture-author',topics:['general','synthetic'],publicKnowledge:[],researchEnabled:false,fallbackOrder:0,enabled:true}}],
  authorityDirectory:authority,checkpointDirectory:checkpoint,contentDirectory:raw,backupRoots:[backup],credentialFile,accountDigest,
  privateKeyFile:file('signing.pem',key.privateKey.export({type:'pkcs8',format:'pem'}).toString()),signingPublicKeyDigest:h(key.publicKey.export({type:'spki',format:'pem'}).toString()),
  documentsFile:file('documents.json','[]'),channelIds:[],maxAttempts:100,expiresAt:'2026-01-06T00:00:00.000Z',privacyNoticeVersion:'fixture-privacy'};
 const g:AskGrant={id:config.grantId,hqId,serviceId:approved.scope.serviceId,generation:approved.scope.consumerGeneration,scopeDigest:h(approved.scope),limitsDigest:h(approved.limits),rosterDigest:h(approved.roster),workerIds:['fixture-author'],...ASK_API_DIGESTS,adapterId:p.adapterId,model:p.model,accountDigest,approvalDigest:h('AUTHORED TEST ONLY'),approvedAt:at,expiresAt:'2026-01-05T23:32:00.000Z',maxExecutions:4,dailyExecutions:4,maxInputTokens:p.maxInputTokens,maxOutputTokens:p.maxOutputTokens,totalTokens:1612288,dailyTokens:1612288,maxDurationMs:60000,maxChargeMicros:p.maxChargeMicros,totalChargeMicros:'5000000',dailyChargeMicros:'5000000',monetaryMode:'verified_cap',routerExecutions:0,researchCalls:0};
 const j=fixtureGenesis?AskAuthorityJournal.createFixture(authority,checkpoint,hqId,[hq,raw],at):AskAuthorityJournal.createProduction(authority,checkpoint,hqId,[hq,raw],at,h('AUTHORED EMPTY INITIALIZATION'));
 j.approve(g,approved,at);j.close();
 const ctx=()=>({scope:approved.scope,limits:approved.limits,now:at}),controls=new AskControlJournal(db,ctx),sync=controls.prepareSync();
 controls.acceptPage(sync.operation.input.syncId,{schemaVersion:'1.0',syncId:sync.operation.input.syncId,controls:[],nextCursor:null,checkedAt:at,validUntil:'2026-01-05T21:33:00.000Z'});
 const content=new AskPrivateContent(db,raw,[hq,authority,checkpoint,backup],ctx,controls);content.importQuestion(structuredClone(ex.AskClaim));content.commitAnswer(ex.AskClaim.question.questionId,structuredClone(ex.AskAnswer));content.close();
 const path=file('config.json',JSON.stringify(config));let loaded:LoadedAsk|undefined;
 function count(table:string){const q=new DatabaseSync(join(raw,'content.sqlite'),{readOnly:true});try{return Number(q.prepare(`SELECT count(*) n FROM ${table}`).get()!.n);}finally{q.close();}}
 return{root,db,config,path,count,get company(){return company;},time(v:string){at=v;},save(){writeFileSync(path,JSON.stringify(config),{mode:0o600});},
  load(){loaded=loadOperationalAsk(company,path);return loaded;},
  reopen(){company.ask?.close();loaded?.close();company=new Company(db,hq,process.cwd(),'fake');company.mandates.clock={now:()=>Date.parse(at)};loaded=loadOperationalAsk(company,path);return loaded;},
  close(){company.ask?.close();loaded?.close();db.close();rmSync(root,{recursive:true,force:true});}};
}
for(const reason of ['disabled','missing-key','expired-model','expired-wire','missing-signing-key','missing-documents'] as const)test(`retained raw cleanup survives ${reason} and restart without model or wire admission`,t=>{
 const f=setup();t.after(f.close);assert.equal(f.count('questions'),1);assert.equal(f.count('answers'),1);
 if(reason==='disabled'){f.config.enabled=false;f.save();}
 if(reason==='missing-key')rmSync(f.config.credentialFile);
 if(reason==='expired-model')f.time('2026-01-05T23:40:00.000Z');
 if(reason==='expired-wire')f.time('2026-01-06T00:01:00.000Z');
 if(reason==='missing-signing-key')rmSync(f.config.privateKeyFile);
 if(reason==='missing-documents'){f.config.enabled=false;f.save();rmSync(f.config.documentsFile);}
 const loaded=f.load();assert.equal(f.company.askOperational.state,'blocked');assert.ok(f.company.ask);assert.throws(()=>loaded.runtime!.assertAskAvailable());
 assert.throws(()=>f.company.ask!.claimNext(2),/FORBIDDEN|UNAVAILABLE/);assert.equal(f.company.paused,false);
 f.time('2026-01-13T00:00:00.000Z');f.reopen();assert.ok(f.company.ask);assert.equal(f.company.askCoordinator,undefined);f.company.ask!.maintenance();
 for(const table of ['questions','answers','outbox'])assert.equal(f.count(table),0,table);
 assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM executions')!.n,0);assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM investment_finite_reservations')!.n,0);
});
test('operational loader rejects fixture genesis and never grants or pauses investing',t=>{const f=setup(true);t.after(f.close);f.load();assert.equal(f.company.askOperational.state,'blocked');assert.equal(f.company.ask,undefined);assert.equal(f.company.paused,false);assert.equal(f.db.get<{n:number}>('SELECT count(*) n FROM executions')!.n,0);});
test('removing protected configuration with retained custody reports blocked, not safely disabled',t=>{const f=setup();t.after(f.close);loadOperationalAsk(f.company);assert.equal(f.company.askOperational.state,'blocked');writeFileSync(f.path,JSON.stringify({version:1,enabled:false}));f.load();assert.equal(f.company.askOperational.state,'blocked');assert.equal(f.company.paused,false);});

for(const boundary of ['active-service','data-lock','foreign-hq','existing-content'] as const)test(`offline Ask initialization rejects ${boundary} before custody mutation`,t=>{
 const f=setup();t.after(f.close);const bin=join(f.root,'bin');mkdirSync(bin,{mode:0o700});
 writeFileSync(join(bin,'systemctl'),'#!/bin/sh\nprintf '+(boundary==='active-service'?"'MainPID=123\\nActiveState=active\\nSubState=running\\n'":"'MainPID=0\\nActiveState=inactive\\nSubState=dead\\n'"),{mode:0o700});
 const params=join(f.root,'initialize.json'),config=f.config;
 writeFileSync(params,JSON.stringify({hqId:boundary==='foreign-hq'?'wrong-hq':config.hqId,serviceId:config.approved.scope.serviceId,authorityDirectory:config.authorityDirectory,checkpointDirectory:config.checkpointDirectory,contentDirectory:config.contentDirectory,excludedRoots:[join(f.root,'hq')],initializationApprovalDigest:h('AUTHORED TEST')}),{mode:0o600});
 const before=readFileSync(join(config.authorityDirectory,'authority.sqlite')),unlock=boundary==='data-lock'?acquireDataLock(join(f.root,'hq')):()=>{};
 try{const r=spawnSync(process.execPath,['dist/scripts/ask-operate.js','initialize-empty-custody',join(f.root,'hq'),params],{env:{...process.env,PATH:bin+':'+process.env.PATH},encoding:'utf8',timeout:10000});assert.notEqual(r.status,0);assert.match(r.stderr,boundary==='active-service'?/OUTCOME_UNKNOWN/:boundary==='data-lock'?/Another BotSquad process/:boundary==='foreign-hq'?/CONFLICT/:/Existing raw custody/);}
 finally{unlock();}
 assert.deepEqual(readFileSync(join(config.authorityDirectory,'authority.sqlite')),before);assert.equal(f.count('questions'),1);
});

test('offline operator releases HQ lock when the read-only Company database cannot open',t=>{
 const root=realpathSync(mkdtempSync(join(tmpdir(),'ask-operate-missing-db-')));t.after(()=>rmSync(root,{recursive:true,force:true}));const bin=join(root,'bin');mkdirSync(bin,{mode:0o700});
 writeFileSync(join(bin,'systemctl'),"#!/bin/sh\nprintf 'MainPID=0\\nActiveState=inactive\\nSubState=dead\\n'",{mode:0o700});
 const r=spawnSync(process.execPath,['dist/scripts/ask-operate.js','initialize-empty-custody',root,join(root,'absent.json')],{env:{...process.env,PATH:bin+':'+process.env.PATH},encoding:'utf8',timeout:10000});
 assert.notEqual(r.status,0);assert.equal(existsSync(join(root,'service.lock')),false);assert.equal(existsSync(join(root,'startup.lock')),false);
});
