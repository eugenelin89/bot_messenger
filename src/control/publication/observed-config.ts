import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {createPrivateKey} from 'node:crypto';
import {isAbsolute} from 'node:path';
import type {Store} from '../../persistence/store.js';
import type {Configuration} from '../../domain/investment/types.js';
import {strictObject,requireThat} from '../../domain/model.js';
import {ObservedTeamPublicationSource} from './observed-source.js';
import {ServiceKeyRing,FixedPublicationTransport} from './transport.js';
import type {PublicationOptions} from './service.js';
import type {PublicationDescription} from './simulator-source.js';
function privateFile(path:string,max:number){requireThat(typeof path==='string'&&isAbsolute(path)&&realpathSync(path)===path,'Canonical publication configuration required');const stat=lstatSync(path);requireThat(stat.isFile()&&stat.nlink===1&&[0,process.getuid?.()].includes(stat.uid)&&(stat.mode&0o077)===0&&stat.size<=max,'Private publication service file required');return readFileSync(path,'utf8');}
const configurationFields=['runId','sourceId','destinationId','publisherId','keyId','generation','privateKeyPath','notBefore','notAfter','methodologyUrl'] as const;
const keyFields=['keyId','privateKeyPath','notBefore','notAfter'] as const;
/** At most two operator-owned keys may overlap during rotation; no worker or HTTP input reaches this loader. */
export function readObservedPublicationConfiguration(path:string){
 const config=strictObject(JSON.parse(privateFile(path,32768)),[...configurationFields,'additionalKey']);
 requireThat(configurationFields.every(k=>typeof config[k]==='string'&&(config[k] as string).length>0),'Publication configuration fields required');
 const x=config as Record<string,string>,entries=[x];
 if(config.additionalKey!==undefined){const extra=strictObject(config.additionalKey,keyFields);requireThat(keyFields.every(k=>typeof extra[k]==='string'&&(extra[k] as string).length>0),'Publication key fields required');requireThat(extra.keyId!==x.keyId,'Duplicate publication key');entries.push(extra as Record<string,string>);}
 const keys=new ServiceKeyRing(new Map(entries.map(entry=>{
  requireThat(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(entry.keyId!),'Publication key identifier invalid');
  const key=createPrivateKey(privateFile(entry.privateKeyPath!,16384));requireThat(key.asymmetricKeyType==='ed25519','Ed25519 publication key required');
  const notBefore=Date.parse(entry.notBefore!)/1000,notAfter=Date.parse(entry.notAfter!)/1000;requireThat(Number.isFinite(notBefore)&&Number.isFinite(notAfter)&&notAfter>notBefore,'Publication key interval invalid');
  return [entry.keyId!,{key,notBefore,notAfter,enabled:true}] as const;
 })));
 return {configuration:x,keys};
}
/** Operator-owned startup configuration. Never accepted as employee or public HTTP input. */
export function observedPublicationOptions(db:Store,path:string):PublicationOptions{
 const {configuration:x,keys}=readObservedPublicationConfiguration(path),row=db.get<{configuration:string}>('SELECT configuration FROM investment_runs WHERE run_id=?',x.runId!);requireThat(row&&db.get('SELECT 1 FROM observed_investment_runs WHERE run_id=?',x.runId!),'Observed publication run missing');const c=JSON.parse(row.configuration) as Configuration;
 requireThat(new URL(x.methodologyUrl!).origin==='https://asymmetri.co','Public methodology must belong to the authorized website');
 const scope=db.get<{envelope:string}>('SELECT envelope FROM investment_team_scopes WHERE run_id=? ORDER BY rowid LIMIT 1',x.runId!)!,team=JSON.parse(scope.envelope),clock={now:()=>new Date().toISOString()};
 const description:PublicationDescription={title:'BotSquad Investment',purpose:'A personal noncommercial paper-investment experiment using real market observations and genuine AI employees.',objective:'Study evidence-driven decisions, independent challenge and transparent long-term accounting; no guaranteed return.',openingFieldDefinition:'Same-session raw daily chart OPEN, captured after that session closes and used only for precommitted modeled paper orders; not a tradable quote.',attribution:'Yahoo Finance via pinned yfinance direct daily chart adapter. Yahoo permission is owner-reported.',rightsEvidence:[x.methodologyUrl!],limitations:['Daily bars are captured after close; displayed fills are delayed simulations.','Archive retains normalized evidence, original decisions and accounting permanently.','Source publication times may be unknown. Finite employee allowances do not guarantee a dollar ceiling.','Published execution budgets describe the initial finite authority; later renewals retain this configuration and may have different operational limits. Worker availability is initial setup availability, not current runtime status.'],cycleExecutionBudget:team.executionPolicy.maxCycle,dailyExecutionBudget:team.executionPolicy.maxDay,runExecutionBudget:team.executionPolicy.maxRun,heartbeatSeconds:900,staleSeconds:2700,maxOutboxAgeSeconds:86400,maxOutboxBytes:8388608,dataDelaySeconds:0,workers:Object.fromEntries(team.participants.map((p:{workerId:string;name:string;responsibility:string})=>[p.workerId,{name:p.name,role:team.proposers.includes(p.workerId)?'Portfolio researcher':'Independent reviewer',responsibilities:[p.responsibility],status:'available'}])),instrumentClassification:Object.fromEntries([...c.instruments,c.benchmark.instrument].map(i=>[i.id,x.methodologyUrl!])),actionSources:{},artifacts:[]};
 return {sources:[new ObservedTeamPublicationSource(x.sourceId!,'Observed paper portfolio',db,clock,c.authorization.fixtureOperator,c.runId,description)],destinations:[{id:x.destinationId!,title:'asymmetri.co Investment',origin:'https://asymmetri.co',publisherId:x.publisherId!,keyId:x.keyId!,generation:x.generation!}],keys,transport:new FixedPublicationTransport(),autoObserved:true};
}
