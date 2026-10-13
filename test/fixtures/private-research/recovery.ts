import {randomUUID} from 'node:crypto';
import {researchFixture} from './support.js';
import type {RuntimeAdapter} from '../../../src/runtime/adapter.js';

export function recoveryFixture(){
 const f=researchFixture(),c=f.company,result=f.consent(),authority=f.authorize(result);
 let accountChecks=0;
 const runtime:RuntimeAdapter={type:'fake',supportsInterrupt:true,finiteHQPolicySupported:()=>true,run:async()=>{throw Error('Unexpected genuine or ordinary model path');},withFiniteHQAccount:async(_request,commit)=>{accountChecks++;return commit();}};
 c.investmentTeam.runtime=runtime;c.recover();
 const preview=c.finiteHQ.recoveryReleasePreview(result.scopeId),release={scopeId:result.scopeId,digest:preview.digest,receiptId:randomUUID()};
 return {...f,result,authority,runtime,preview,release,accountChecks:()=>accountChecks};
}
