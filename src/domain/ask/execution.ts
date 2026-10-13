import type {AskAnswer, AskQuestion, AskRoute, ContextRef, Source} from '../../../contracts/investment/v1/types.js';
import type {AskAdmissionProof, AskGrant, AskReservation} from './authority.js';
import type {AskExecution, Worker} from '../model.js';
import type {EffectiveAIConfig} from '../ai-profile.js';
import type {UsageObservation} from '../usage/tokens.js';
import type {ToolDefinition} from '../../runtime/adapter.js';

export interface AskPublicEvidence {
 reference:ContextRef; authorWorkerIds:string[]; text:string; knowledgeAsOf:string|null;
}
export interface AskPublicContext {
 records:AskPublicEvidence[];
 documents:{source:Source;text:string}[];
}
export interface AskRuntimeInput {
 mode:'public_question'; worker:Worker; execution:AskExecution;
 /** Explicitly absent: public turns can never resume private employee runtime state. */
 binding?:never; investment?:never; prepareBinding?:never; admitSubscription?:never;
 grant:AskGrant; reservation:AskReservation; context:unknown; tools:ToolDefinition[];
 localDeadline:string;
 /** Rechecks independent custody, current roster, controls and exact context before effects. */
 authorize():void;
 admit(proof:AskAdmissionProof):void;
 beforeTransmit(proof:AskAdmissionProof):void;
 configured(config:EffectiveAIConfig):void;
 bind(providerSessionId:string):void;
 usage(observation:UsageObservation):void;
 event(type:string,detail:Record<string,unknown>):void;
 callTool(callId:string,name:string,args:unknown,signal?:AbortSignal):unknown;
}
export interface AskDispatchRow {
 execution_id:string;service_id:string;question_id:string;worker_id:string;public_worker_id:string;
 grant_id:string;reservation_digest:string;context_digest:string;route:string;evidence_refs:string;generation:string;
 created_at:string;deadline:string;duty_until:string;state:'reserved'|'running'|'completed'|'failed'|'unknown'|'suppressed';unresolved:number;
}
export interface AskPreparedTurn {
 question:AskQuestion; history:{question:AskQuestion;answer:AskAnswer}[];
 evidence:AskPublicContext; route:AskRoute; context:unknown; runtime:AskRuntimeInput;
}
