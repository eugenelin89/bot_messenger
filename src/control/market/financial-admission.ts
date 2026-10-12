import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical, hash, id, time } from '../../domain/investment/identity.js';
import { evidenceRights } from '../../domain/market/admission.js';
import type { FinancialObservation } from '../../domain/market/financial.js';
import type { SourcePolicy } from '../../domain/market/types.js';
import type { SimulationClock } from '../investment.js';
import { FinancialStore } from './financial-store.js';
interface Delivery { id:string; scopeId:string; consumerId:string; observationId:string; deliveredAt:string; }
/** Trusted private evidence seam only. No runtime tool or group export is enabled by this module. */
export class FinancialAdmission {
  constructor(private readonly store:FinancialStore,private readonly clock:SimulationClock){}
  private current(observationId:string):FinancialObservation {
    const at=this.clock.now(),scope=this.store.current(at),e=this.store.observation(observationId);
    ensure(scope.policyIds.includes(e.policyId)&&scope.instrumentIds.includes(e.instrumentId),'financial_scope_mismatch');
    const policy=this.store.market.get<SourcePolicy>(e.policyId,'policy');
    evidenceRights(e,policy,['automation','internal_calculation','retention'],at);
    ensure(e.mode==='synthetic_fixture'&&e.audience==='private_research'&&!e.executionQualified,'financial_use_denied');
    ensure(time(e.firstRetrievedAt)<=time(at)&&time(e.normalizedAt)<=time(at),'financial_future_knowledge');return e;
  }
  /** Whole immutable packet delivery. A caller cannot assert an earlier delivery timestamp. */
  deliver(observationId:string,consumerId:string,deliveryId:string,use:'private_research'='private_research') {
    id(consumerId);id(deliveryId);ensure(use==='private_research','financial_use_denied');
    return this.store.db.transaction(()=>{
      const e=this.current(observationId),scope=this.store.current(this.clock.now());
      let delivery:Delivery;
      const prior=this.store.db.get<{hash:string;payload:string}>('SELECT hash,payload FROM financial_deliveries WHERE delivery_id=?',deliveryId);
      if(prior){delivery=JSON.parse(prior.payload) as Delivery;ensure(hash(delivery)===prior.hash&&delivery.consumerId===consumerId&&delivery.observationId===observationId&&delivery.scopeId===scope.id,'financial_delivery_conflict');}
      else {this.store.storageCheck();delivery={id:deliveryId,scopeId:scope.id,consumerId,observationId,deliveredAt:this.clock.now()};
        this.store.db.run('INSERT INTO financial_deliveries VALUES (?,?,?,?,?,?,?)',deliveryId,scope.id,observationId,consumerId,delivery.deliveredAt,hash(delivery),canonical(delivery));}
      const p=this.store.market.get<SourcePolicy>(e.policyId,'policy');
      const stale=time(this.clock.now())-time(e.firstRetrievedAt)>p.maxObservationAgeMs;
      return {delivery,observation:e,quality:stale?'stale':'research_only',executionQualified:false as const,limitations:[...e.issues,...(stale?['stale' as const]:[])]};
    });
  }
  /** Reconstruct exactly what this consumer could know at cutoff, never today's corrected vintage. */
  decisionEvidence(deliveryId:string,consumerId:string,cutoff:string):FinancialObservation {
    id(deliveryId);id(consumerId);ensure(time(cutoff)<=time(this.clock.now()),'financial_future_cutoff');
    const row=this.store.db.get<{hash:string;payload:string}>('SELECT hash,payload FROM financial_deliveries WHERE delivery_id=?',deliveryId);ensure(row,'financial_delivery_missing');
    const receipt=JSON.parse(row.payload) as Delivery;ensure(hash(receipt)===row.hash&&receipt.consumerId===consumerId,'financial_delivery_scope');
    const e=this.current(receipt.observationId),p=this.store.market.get<SourcePolicy>(e.policyId,'policy');
    ensure(time(receipt.deliveredAt)<=time(cutoff)&&time(e.firstRetrievedAt)<=time(cutoff)&&time(e.normalizedAt)<=time(cutoff),'financial_lookahead');
    ensure(this.store.latest(e.requestKey,cutoff)?.id===e.id,'financial_superseded_at_cutoff');
    ensure(time(cutoff)-time(e.firstRetrievedAt)<=p.maxObservationAgeMs,'financial_stale');
    ensure(e.records.length>0&&!e.issues.some(q=>['missing','nan','partial','unknown_unit'].includes(q)),'financial_quality_unqualified');
    for(const record of e.records){
      if(record.kind==='ohlcv')ensure(time(record.providerEventAt)<=time(cutoff)&&time(record.sessionCloseAt)<=time(cutoff),'financial_future_bar');
      else if(record.kind==='split'||record.kind==='dividend')ensure(time(record.providerEventAt)<=time(cutoff),'financial_future_action');
      // Period end is never used as statement publication or availability.
    }
    return e;
  }
}
