import {copyFileSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {FinalAtlasLineage} from '../../src/control/usage/pilot-lineage.js';
import {inspectMayaHistory} from '../../src/control/usage/pilot-final-history.js';
import {finalizeMaya} from '../../scripts/credit-pilot/maya-review.js';
import {prepareFinalAtlas} from '../../scripts/credit-pilot/final-atlas.js';
import {beginMaya,claimedInput,completeFixture,mayaFixture,sourceSha,verifiedAccount} from './maya-pilot.js';

/** All history here is labelled deterministic test data. No provider is contacted. */
export function finalHistoryFixture(){
 const h=mayaFixture(),p=h.f!,request=beginMaya(p,h.ledger);
 p.company.creditPilot.release(request,null);const input=claimedInput(p.company,p.company.claimWorkNext());
 h.ledger.admit(p.s,input,verifiedAccount);
 completeFixture(input,'Deterministic fake Maya historical review: net cash is not a valuation floor. Not genuine employee speech.',p.contextBinding!.imports.map(e=>e.evidenceId));
 p.company.finish(input.execution.execution_id,{status:'completed',settled:true});
 const report=finalizeMaya(h.ledger,p);p.close();h.ledger.close();
 const archive=join(h.dir,'maya-archive');mkdirSync(archive,{mode:0o700});
 copyFileSync(join(p.root,'company.sqlite'),join(archive,'company.sqlite'));copyFileSync(h.file,join(archive,'authority-lineage.sqlite'));
 writeFileSync(join(archive,'authority-maya-execution-evidence.json'),JSON.stringify(report),{mode:0o600});
 const ledger=new FinalAtlasLineage(h.file),history=inspectMayaHistory(ledger,archive);
 return {...h,ledger,history,archive,cleanup(){ledger.close();h.cleanup();}};
}
export function finalFixture(prepared=true,bindAccount=true){
 const h=finalHistoryFixture();h.ledger.authorizeFinal(h.history,'d'.repeat(64),new Date().toISOString(),'e'.repeat(64));
 const f=prepared?prepareFinalAtlas(h.ledger,sourceSha,process.cwd()):undefined;
 if(f){f.company.investmentTeam.runtime=h.atlas.adapter;if(bindAccount)h.ledger.bindAccount(f.s,verifiedAccount);}
 return {...h,f,cleanup(){if(f){if(f.store.db.isOpen)f.close();rmSync(f.root,{recursive:true,force:true});}h.cleanup();}};
}
export function beginFinal(f:NonNullable<ReturnType<typeof finalFixture>['f']>,ledger:FinalAtlasLineage){
 ledger.claimSupervision(f.s);f.company.discussions.control({group_id:f.s.groupId,action:'start',receipt_key:'final-fixture-start'});
 return f.store.get<{request_id:string}>("SELECT request_id FROM conversation_requests WHERE target_worker_id=? AND status='queued'",f.s.workerId)!.request_id;
}
export function reserveFinal(f:ReturnType<typeof finalFixture>){
 const p=f.f!,request=beginFinal(p,f.ledger);p.company.creditPilot.release(request,null);return claimedInput(p.company,p.company.claimWorkNext());
}
