import type {Occurrence} from './types.js';

/** An owner-selected research limitation and two replacement starts; never a new budget. */
export interface SourceContinuation {
 authorityId:string;scopeId:string;loopId:string;session:string;
 envelopeHash:string;checkpointDigest:string;controlRevision:number;portfolioHead:string;ownerReceiptHash:string;
 baseOccurrencesHash:string;effectiveOccurrencesHash:string;generation:number;
 failed:{instrumentId:string;requestHash:string;reservationId:string;reservationHash:string;resultHash:string;reason:'financial_ohlc_order'};
 retained:{instrumentId:string;requestHash:string;reservationId:string;reservationHash:string;evidenceId:string;evidenceHash:string;contentHash:string}[];
 remaining:{instrumentId:string;requestHash:string}[];
 replacedIds:string[];replacements:Occurrence[];
}
export interface SourceContinuationApproval {
 input:SourceContinuation;digest:string;receiptId:string;requestHash:string;approvedAt:string;approvedCheckpoint:string;
}
