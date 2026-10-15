import type {Occurrence} from './types.js';
import type {FiniteHQPolicy} from '../usage/policy.js';

/** One owner-authorized new decision cycle; the failed attempt and all consumption remain retained. */
export interface ModelContinuation {
 authorityId:string;scopeId:string;loopId:string;session:string;sourceDigest:string;
 envelopeHash:string;checkpointDigest:string;controlRevision:number;portfolioHead:string;ownerReceiptHash:string;
 baseOccurrencesHash:string;generation:number;replacedId:string;replacement:Occurrence;additional:8;
 failed:{executionId:string;reservationHash:string};
 executionIds:string[];retainedHash:string;groupHash:string;turnsHash:string;
 supersededTurns:{turnId:string;advanced:number}[];
}
export interface ModelContinuationApproval {input:ModelContinuation;digest:string;receiptId:string;requestHash:string;approvedAt:string;approvedCheckpoint:string}
/** Only independently approved additions may be passed here. Frozen envelopes never change. */
export function additionalModelPolicy(p:FiniteHQPolicy,additional:number):FiniteHQPolicy{
 return {...p,maxRun:p.maxRun+additional,maxRolling24h:p.maxRolling24h+additional,maxWorker:p.maxWorker+additional,maxCycle:p.maxCycle+additional,maxDay:p.maxDay+additional};
}
