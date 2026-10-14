/** Explicit offline operator commands. Never invoked by application startup or a model tool. */
import {execFileSync} from 'node:child_process';
import {lstatSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {acquireDataLock} from '../src/persistence/lock.js';
import {readAskProtectedFile,askApiAccountDigest} from '../src/runtime/openai-ask.js';
import {readAskConfiguration} from '../src/control/ask/operational.js';
import {AskAuthorityJournal} from '../src/control/ask/authority-journal.js';
import {AskContentStore} from '../src/persistence/ask-content-store.js';
import {canonicalHash as hash,requireContract as need} from './investment-contracts/schema.js';
import {exact,instant,type AskGrant} from '../src/domain/ask/authority.js';
import {ASK_API_POLICY as policy,ASK_API_DIGESTS} from '../src/domain/ask/api-policy.js';
const [command,dataDirectory,path,approvalPath]=process.argv.slice(2);need(path&&dataDirectory,'INVALID_SCHEMA');
const dataDir=realpathSync(dataDirectory);
const status=execFileSync('systemctl',['show','botsquad','--property=MainPID,ActiveState,SubState'],{encoding:'utf8'});
need(status.includes('MainPID=0\n')&&status.includes('ActiveState=inactive\n')&&status.includes('SubState=dead\n'),'OUTCOME_UNKNOWN');
const unlock=acquireDataLock(dataDir);let db:DatabaseSync|undefined;
try{
db=new DatabaseSync(join(dataDir,'company.sqlite'),{readOnly:true});
db.exec('PRAGMA query_only=ON; BEGIN;');
const actualHq=db.prepare('SELECT hq_id FROM client_hq WHERE singleton=1').get()?.hq_id;
need(typeof actualHq==='string','CONFLICT');
const at=new Date().toISOString();
if(command==='initialize-empty-custody'){
 const p=JSON.parse(readAskProtectedFile(path));exact(p,'hqId serviceId authorityDirectory checkpointDirectory contentDirectory excludedRoots initializationApprovalDigest');
 need(Array.isArray(p.excludedRoots)&&p.excludedRoots.every(x=>typeof x==='string'),'INVALID_SCHEMA');
 need(p.hqId===actualHq,'CONFLICT');const excluded=[dataDir,...p.excludedRoots as string[]];
 for(const suffix of ['', '-journal','-wal','-shm']){try{lstatSync(join(p.contentDirectory as string,'content.sqlite'+suffix));throw new Error('Existing raw custody cannot be initialized.');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
 const journal=AskAuthorityJournal.createProduction(p.authorityDirectory as string,p.checkpointDirectory as string,p.hqId as string,[...excluded,p.contentDirectory as string],at,p.initializationApprovalDigest as string);
 try{const raw=new AskContentStore(p.contentDirectory as string,p.serviceId as string,[...excluded,p.authorityDirectory as string,p.checkpointDirectory as string],false);raw.close();console.log(JSON.stringify({initialized:true,grants:0,models:0,at}));}finally{journal.close();}
}else if(command==='approve-api-grant'){
 need(approvalPath,'FORBIDDEN');const c=readAskConfiguration(path);need('approved' in c&&!c.enabled&&c.hqId===actualHq,'FORBIDDEN');
 // This protected record must contain the actual human decision. No default or inferred spending approval.
 const a=JSON.parse(readAskProtectedFile(approvalPath,16384));exact(a,'ownerDecisionId ownerDecisionText approvedAt expiresAt provider model serviceId hqId maxExecutions totalChargeMicros dailyChargeMicros');
 need(typeof a.ownerDecisionText==='string'&&a.ownerDecisionText.length>=20&&typeof a.ownerDecisionId==='string'&&a.ownerDecisionId.length>0
  &&a.provider==='OpenAI API'&&a.model===policy.model&&a.serviceId===c.approved.scope.serviceId&&a.hqId===c.hqId,'FORBIDDEN');
 const approvedAt=a.approvedAt as string,expiresAt=a.expiresAt as string;need(instant(approvedAt)<=instant(at)&&instant(at)<instant(expiresAt)&&instant(expiresAt)-instant(approvedAt)<=86400000&&instant(expiresAt)<=instant(c.expiresAt),'EXPIRED');
 need(Number.isSafeInteger(a.maxExecutions)&&Number(a.maxExecutions)>0&&Number(a.maxExecutions)<=15
  &&a.totalChargeMicros==='5000000'&&a.dailyChargeMicros==='5000000'&&c.approved.limits.dailyBudgetUsd==='5'
  &&c.approved.limits.approvalRecordId===a.ownerDecisionId,'FORBIDDEN');
 need(askApiAccountDigest(c.credentialFile)===c.accountDigest,'FORBIDDEN');
 const n=Number(a.maxExecutions),tokens=n*(policy.maxInputTokens+policy.maxOutputTokens);
 const g:AskGrant={id:c.grantId,hqId:c.hqId,serviceId:c.approved.scope.serviceId,generation:c.approved.scope.consumerGeneration,
  scopeDigest:hash(c.approved.scope),limitsDigest:hash(c.approved.limits),rosterDigest:hash(c.approved.roster),workerIds:c.workers.map(w=>w.publicId),
  ...ASK_API_DIGESTS,adapterId:policy.adapterId,model:policy.model,accountDigest:c.accountDigest,approvalDigest:hash(a),approvedAt:at,expiresAt,
  maxExecutions:n,dailyExecutions:n,maxInputTokens:policy.maxInputTokens,maxOutputTokens:policy.maxOutputTokens,totalTokens:tokens,dailyTokens:tokens,
  maxDurationMs:c.approved.limits.executionDeadlineSeconds*1000,maxChargeMicros:policy.maxChargeMicros,totalChargeMicros:'5000000',dailyChargeMicros:'5000000',
  monetaryMode:'verified_cap',routerExecutions:0,researchCalls:0};
 const journal=new AskAuthorityJournal(c.authorityDirectory,c.checkpointDirectory,c.hqId,[dataDir,...c.backupRoots,c.contentDirectory],'ask-production-v1');
 try{journal.ownerPause(g.serviceId,true,at);journal.approve(g,c.approved,at);console.log(JSON.stringify({grantId:g.id,approvedAt:at,expiresAt:g.expiresAt,paused:true,approvalDigest:g.approvalDigest}));}finally{journal.close();}
}else throw new Error('Use initialize-empty-custody or approve-api-grant with protected operator records.');

}finally{try{db?.close();}finally{unlock();}}
