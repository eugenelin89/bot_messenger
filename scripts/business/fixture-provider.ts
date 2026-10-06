// Isolated acceptance only. Production startup never imports this provider.
import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {requireThat} from '../../src/domain/model.js';
import {gitBlobHash,contentHash,type BusinessAdapter,type MarkdownTarget,type MarkdownSnapshot,type ExternalAction,type MarkdownResult} from '../../src/domain/business.js';
export const fixtureTarget={repository:'fixture/fieldnote-operations',repository_id:110011,branch:'pilot',path:'README.md'};
const initial='# Fieldnote operations — SIMULATED provider fixture\n\nCurrent status: private pilot.\nCurrent status: private pilot.\n\nRequests are reviewed within two business days. This is a service target, not measured delivery.\n\nA request should include a concise description and expected outcome. No customer or production information is present in this fixture. Reader behavior, revenue, conversion and monetary model costs are unknown.\n';
type State={content:string;head:string;receipt:MarkdownResult|null;effects:number};
export class FixtureBusinessProvider implements BusinessAdapter {
  readonly identity='fixture-markdown-v1';readonly mode='simulated_fixture' as const;readonly path:string;
  constructor(directory:string){requireThat(/^\/var\/lib\/botsquad\/validation\/business-p11-[a-zA-Z0-9-]+$/.test(directory),'Isolated business fixture directory required');this.path=join(directory,'SIMULATED-provider-state.json');if(!existsSync(this.path))this.save({content:initial,head:contentHash(initial).slice(0,40),receipt:null,effects:0});}
  private state(){return JSON.parse(readFileSync(this.path,'utf8')) as State;}
  private save(state:State){const tmp=`${this.path}.${randomUUID()}.tmp`;writeFileSync(tmp,JSON.stringify(state,null,2),{mode:0o600,flag:'wx'});renameSync(tmp,this.path);}
  private target(target:MarkdownTarget){requireThat(JSON.stringify(target)===JSON.stringify(fixtureTarget),'Fixture target mismatch');}
  async read(target:MarkdownTarget,_ref:string,signal?:AbortSignal):Promise<MarkdownSnapshot>{this.target(target);requireThat(!signal?.aborted,'Fixture read interrupted');const s=this.state();return {target,content:s.content,blob:gitBlobHash(s.content),head:s.head,retrieved_at:new Date().toISOString(),source_ref:`fixture:SIMULATED:${s.head}:README.md`,provider_time:null};}
  async replace(action:ExternalAction,beforeTransmit:()=>void):Promise<MarkdownResult>{this.target(JSON.parse(action.target));const old=this.state();requireThat(gitBlobHash(old.content)===action.expected_blob&&old.content===action.previous_content,'Fixture document changed');beforeTransmit();const receipt:MarkdownResult={commit:contentHash(action.action_id+action.content).slice(0,40),blob:gitBlobHash(action.content),parent:old.head,provider_time:new Date().toISOString(),request_id:`SIMULATED:${action.action_id}`,confirmation:'provider_response'};this.save({content:action.content,head:receipt.commit,receipt,effects:old.effects+1});return receipt;}
  async reconcile(action:ExternalAction){this.target(JSON.parse(action.target));const s=this.state();return s.receipt?.blob===action.content_blob?{...s.receipt,confirmation:'reconciled_correlation' as const}:null;}
}
