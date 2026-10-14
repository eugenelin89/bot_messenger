/** Explicit protected configuration only. This loader never initializes custody or grants. */
import {createPrivateKey,createPublicKey} from 'node:crypto';
import {join} from 'node:path';
import {lstatSync,realpathSync} from 'node:fs';
import {canonicalHash as hash,parseJson,requireContract as need} from '../../../scripts/investment-contracts/schema.js';
import {exact,configuration,type AskGrantConfiguration} from '../../domain/ask/authority.js';
import {ASK_API_POLICY,ASK_API_DIGESTS} from '../../domain/ask/api-policy.js';
import {OpenAiAskRuntime,readAskProtectedFile} from '../../runtime/openai-ask.js';
import type {Company} from '../company.js';
import {ServiceKeyRing} from '../publication/transport.js';
import {AskAuthorityJournal} from './authority-journal.js';
import {AskControlJournal} from './control-journal.js';
import {AskPrivateContent} from './private-content.js';
import {installAskApiCustody,type InstallAskOptions} from './composition.js';
import type {ApprovedAskDocument} from './public-context.js';

export interface AskOperationalConfiguration {
 version:1;enabled:boolean;hqId:string;grantId:string;approved:AskGrantConfiguration;
 workers:InstallAskOptions['workers'];authorityDirectory:string;checkpointDirectory:string;
 contentDirectory:string;backupRoots:string[];credentialFile:string;accountDigest:string;
 privateKeyFile:string;signingPublicKeyDigest:string;documentsFile:string;channelIds:string[];
 maxAttempts:number;expiresAt:string;privacyNoticeVersion:string;
}
export interface AskOperationalState {state:'disabled'|'blocked'|'installed';reason:string}
export interface LoadedAsk {runtime?:OpenAiAskRuntime;close():void}
export function readAskConfiguration(path:string):AskOperationalConfiguration|{version:1;enabled:false} {
 const value=parseJson(Buffer.from(readAskProtectedFile(path),'utf8')) as Record<string,unknown>;
 need(value.version===1&&typeof value.enabled==='boolean','INVALID_SCHEMA');
 if(!value.enabled&&Object.keys(value).length===2){exact(value,'version enabled');return{version:1,enabled:false};}
 exact(value,'version enabled hqId grantId approved workers authorityDirectory checkpointDirectory contentDirectory backupRoots credentialFile accountDigest privateKeyFile signingPublicKeyDigest documentsFile channelIds maxAttempts expiresAt privacyNoticeVersion');
 return value as unknown as AskOperationalConfiguration;
}
export function loadOperationalAsk(company:Company,path?:string):LoadedAsk {
 const none={close(){}};company.askOperational={state:'disabled',reason:'Ask is disabled; no backend authority loaded'};
 if(!path){if(company.store.get('SELECT 1 FROM ask_content_services'))company.askOperational={state:'blocked',reason:'Retained Ask custody requires its full protected configuration for cleanup'};return none;}
 let authority:AskAuthorityJournal|undefined,content:AskPrivateContent|undefined;
 try{
  const config=readAskConfiguration(path);if(!('approved' in config)){
   need(!company.store.get('SELECT 1 FROM ask_content_services'),'OUTCOME_UNKNOWN');return none;
  }
  const configDigest=hash(config),now=()=>new Date(company.mandates.clock.now()).toISOString();
  need(company.store.get<{hq_id:string}>('SELECT hq_id FROM client_hq WHERE singleton=1')?.hq_id===config.hqId,'FORBIDDEN');
  const excluded=[realpathSync(company.dataDir),realpathSync(company.engineering.sourceRoot),...config.backupRoots.map(p=>realpathSync(p))];
  need(new Set([config.authorityDirectory,config.checkpointDirectory,config.contentDirectory]).size===3,'FORBIDDEN');
  authority=new AskAuthorityJournal(config.authorityDirectory,config.checkpointDirectory,config.hqId,[...excluded,config.contentDirectory],'ask-production-v1');
  const journal=authority,approved=structuredClone(config.approved);
  const grant=journal.inspect().grants.find(g=>g.id===config.grantId);need(grant,'FORBIDDEN');configuration(grant,approved);
  need(grant.hqId===config.hqId&&grant.adapterId===ASK_API_POLICY.adapterId&&grant.accountDigest===config.accountDigest
   &&grant.model===ASK_API_POLICY.model&&grant.monetaryMode==='verified_cap'&&grant.expiresAt<=config.expiresAt
   &&grant.maxInputTokens===ASK_API_POLICY.maxInputTokens&&grant.maxOutputTokens===ASK_API_POLICY.maxOutputTokens
   &&grant.maxChargeMicros===ASK_API_POLICY.maxChargeMicros,'FORBIDDEN');
  for(const k of Object.keys(ASK_API_DIGESTS) as (keyof typeof ASK_API_DIGESTS)[])need(grant[k]===ASK_API_DIGESTS[k],'FORBIDDEN');
  let wireAvailable=false;
  const assertReady=()=>{
   need(wireAvailable&&config.enabled&&hash(readAskConfiguration(path))===configDigest&&now()<grant.expiresAt,'FORBIDDEN');
   need(hash(journal.inspect().grants.find(g=>g.id===config.grantId))===hash(grant),'CONFLICT');
  };
  const runtime=new OpenAiAskRuntime({credentialFile:config.credentialFile,accountDigest:config.accountDigest,assertReady});
  let keys=new ServiceKeyRing(new Map());
  try{
   const key=createPrivateKey(readAskProtectedFile(config.privateKeyFile,16384));
   need(key.asymmetricKeyType==='ed25519'&&hash(createPublicKey(key).export({type:'spki',format:'pem'}).toString())===config.signingPublicKeyDigest,'FORBIDDEN');
   keys=new ServiceKeyRing(new Map([[approved.scope.keyId,{key,notBefore:Date.parse(grant.approvedAt)/1000,notAfter:Date.parse(config.expiresAt)/1000,enabled:true}]]));
   wireAvailable=now()<config.expiresAt&&keys.has(approved.scope.keyId,Date.parse(now())/1000);
  }catch{/* Signing unavailability closes all wire activity; retained local cleanup continues. */}
  const current=()=>({scope:structuredClone(approved.scope),limits:structuredClone(approved.limits),now:now()});
  // Deployment must provision this separate empty/private store explicitly beforehand.
  const contentFile=join(config.contentDirectory,'content.sqlite');need(lstatSync(contentFile).isFile(),'OUTCOME_UNKNOWN');
  const documents=():ApprovedAskDocument[]=>{const value=parseJson(Buffer.from(readAskProtectedFile(config.documentsFile),'utf8'));need(Array.isArray(value)&&value.length<=20,'INVALID_SCHEMA');return value as ApprovedAskDocument[];};
  const controls=new AskControlJournal(company.store,current);
  content=new AskPrivateContent(company.store,config.contentDirectory,[...excluded,config.authorityDirectory,config.checkpointDirectory],current,controls);
  installAskApiCustody(company,runtime,{current,approved,grantId:grant.id,workers:config.workers,authority:journal,controls,content,keys,assertOperational:assertReady,
   maxAttempts:config.maxAttempts,expiresAt:config.expiresAt,privacyNoticeVersion:config.privacyNoticeVersion,
   projection:{channelIds:config.channelIds,documents,assertChannelCurrent:id=>need(!company.publication.health(id).deliveryBlocked,'OUTCOME_UNKNOWN')}},wireAvailable);
  try{runtime.assertAskAvailable();company.askOperational={state:'installed',reason:'Explicit API custody loaded; admission requires current signed receiver state and independent grant'};}
  catch{company.askOperational={state:'blocked',reason:'Retained custody and privacy cleanup active; model route disabled, expired or unavailable'};}
  return{runtime,close(){content?.close();authority?.close();}};
 }catch{
  company.ask?.close();company.ask=undefined;company.askCoordinator=undefined;content?.close();authority?.close();
  company.askOperational={state:'blocked',reason:'Ask configuration, credentials or independent authority require operator review'};
  return none;
 }
}
