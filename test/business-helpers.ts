import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fixture} from './helpers.js';
import {gitBlobHash,type BusinessAdapter,type MarkdownTarget,type MarkdownSnapshot,type MarkdownResult,type ExternalAction} from '../src/domain/business.js';

export const target={repository:'example/operations',repository_id:12345,branch:'main',path:'README.md'};
export const baseline={outcome:'One accurate current status paragraph',measurement_source:'Exact GitHub Markdown blob',window:'Point-in-time operational snapshot',unit:'document',denominator:null,freshness:'Fetched during this bounded cycle',missing_fields:'Reader behavior, revenue and model monetary costs unknown',privacy:'Mandate-private document; no customer data',expected_lag:'Immediate provider state',attribution_limitations:'Document presence establishes no business impact'};
/** SIMULATED provider only. These tests do not establish C11-2. */
export class FixtureAdapter implements BusinessAdapter {
  readonly identity='fixture-markdown-v1';readonly mode='simulated_fixture' as const;
  content='# Status\n\nStatus is duplicated.\nStatus is duplicated.\n';head='a'.repeat(40);puts=0;reads=0;
  receipt:MarkdownResult|null=null;before?:()=>Promise<void>;after?:()=>Promise<void>;failRead=false;unknown=false;now=()=>Date.now();
  async read(t:MarkdownTarget):Promise<MarkdownSnapshot>{this.reads++;if(this.failRead)throw new Error('PRIVATE PROVIDER SECRET must not escape');return {target:t,content:this.content,blob:gitBlobHash(this.content),head:this.head,retrieved_at:new Date(this.now()).toISOString(),source_ref:`fixture://${this.head}`,provider_time:null};}
  async replace(a:ExternalAction,transmit:()=>void):Promise<MarkdownResult>{await this.before?.();assert.equal(gitBlobHash(this.content),a.expected_blob);transmit();this.puts++;this.content=a.content;this.receipt={commit:'b'.repeat(40),blob:gitBlobHash(this.content),parent:this.head,provider_time:null,request_id:'fixture-only'};this.head=this.receipt.commit;await this.after?.();if(this.unknown)throw new Error('Lost provider response');return this.receipt;}
  async reconcile(){return this.receipt;}
}
export async function setup(){const f=fixture(),atlas=f.company.initializeCEO(),adapter=new FixtureAdapter();f.company.business.adapter=adapter;
  let time=Date.now();f.company.mandates.clock={now:()=>time};adapter.now=()=>time;
  const m=f.company.mandates.create({title:'SIMULATED operations',objective:'Correct ambiguous operational documentation',success_criteria:'Review exact source, propose useful bounded correction, observe then reassess',stop_criteria:'No useful improvement or no authority',constraints:'SIMULATED provider only; no spending',resources:'One bounded operation; costs unknown',coordinator_id:atlas.worker_id,envelope:{min_interval_seconds:30}});
  const grant=f.company.business.authorize({mandate_id:m.mandate_id,target,credential_ref:'fixture',expires_at:new Date(time+3600000).toISOString(),max_actions:3,mode:'simulated_fixture'});
  const evidence=await f.company.business.observe({grant_id:grant.grant_id,baseline,action_id:null});
  f.company.mandates.control({mandate_id:m.mandate_id,action:'activate'});
  const claim=f.company.claimWorkNext();assert.ok(claim?.origin==='conversation');f.company.conversations.context(claim.context);
  const call=(name:string,args:unknown,key=randomUUID())=>f.company.mandates.callTool(claim.context,key,name,args);
  call('read_mandate_record',{record_id:evidence.evidence_id});
  const initiative=call('propose_initiative',{title:'Clarify status',mechanism:'Remove ambiguity',expected_outcome:'Exact corrected document',assumptions:'No user-impact claim'}) as {initiative_id:string};
  const decision=call('record_strategic_decision',{initiative_id:initiative.initiative_id,disposition:'iterate',recommendation:'Propose exact correction',rationale:'Duplicated status obscures current operating state',alternatives:'Leave unchanged or report ambiguity',evidence_ids:[evidence.evidence_id],contrary_evidence:'No evidence of actual reader confusion',unknowns:'Business impact and model costs',missing_evidence:null}) as {decision_id:string};
  const proposal={grant_id:grant.grant_id,decision_id:decision.decision_id,baseline_id:evidence.evidence_id,edit:{old_text:'Status is duplicated.\nStatus is duplicated.',new_text:'Status appears once.'},commit_message:'Clarify operating status',rationale:'Remove duplicate status',measurement:'Read the exact resulting blob',risk:'Existing repository automation may run; no code changes',compensation:'A separately approved replacement may restore prior bytes; history and notifications remain',privacy:'Private repository only',estimated_cost:'Provider incremental cost zero in fixture; model monetary cost unknown',expires_at:new Date(time+600000).toISOString(),compensation_for:null};
  const propose=()=>call('propose_markdown_action',proposal) as ExternalAction;
  const wait=(a:ExternalAction)=>{call('wait_for_external_action',{action_id:a.action_id,summary:'Wait for exact owner approval; no effect yet'});f.company.finish(claim.execution.execution_id,{status:'completed',settled:true,summary:'Waiting'});f.company.mandates.progress();};
  const approve=(a:ExternalAction)=>f.company.business.decide({action_id:a.action_id,intent_hash:a.intent_hash,decision:'approved'});
  return {...f,atlas,adapter,m,grant,evidence,claim,call,proposal,propose,wait,approve,advance(ms:number){time+=ms;},time:()=>time};
}
