import { requireUses } from '../../domain/market/validation.js';
import { ensure } from '../../domain/investment/arithmetic.js';
import { admitFixturePrice } from '../../domain/market/admission.js';
import type { Command, Configuration } from '../../domain/investment/types.js';
import type { CalendarEvidence, PriceEvidence, SourcePolicy } from '../../domain/market/types.js';
import { MarketStore } from './store.js';
import { FixtureSimulator, type SimulationClock } from '../investment.js';
/** Use stored evidence, never a worker-supplied object. Admission does not fill an order. */
export class MarketAdmission {
  constructor(private readonly store:MarketStore){}
  observation(evidenceId:string,configuration:Configuration,at:string){
    const e=this.store.get<PriceEvidence>(evidenceId,'price'),p=this.store.get<SourcePolicy>(e.policyId,'policy'),c=this.store.get<CalendarEvidence>(e.calendarId,'calendar');
    ensure(!this.store.prices().some(other=>other.correctionOf===e.id),'superseded_market_evidence');
    ensure(!this.store.prices().some(other=>other.instrumentId===e.instrumentId&&other.session===e.session&&other.field===e.field&&other.quality==='conflicting_sources'),'unresolved_source_conflict');
    return admitFixturePrice(e,p,c,configuration,at);
  }
}

/** All price-dependent operations using admitted market records pass this boundary.
 * The raw FixtureSimulator remains available only for the original disconnected INV-05 fixtures. */
export class MarketFixtureSimulator {
  private readonly simulator:FixtureSimulator;
  constructor(private readonly store:MarketStore,private readonly clock:SimulationClock,operator:string,private readonly riskAdmission?:(runId:string,command:Exclude<Command,{type:'observe'}>)=>void){this.simulator=new FixtureSimulator(store.db,clock,operator);}
  create(configuration:Configuration){return this.simulator.create(configuration);}
  inspect(runId:string){return this.simulator.inspect(runId);}
  observe(runId:string,evidenceId:string){
    return this.store.db.transaction(()=>{
      const configuration=this.simulator.configuration(runId),admission=new MarketAdmission(this.store);
      // Check the newest record first, then atomically deliver its original lineage.
      admission.observation(evidenceId,configuration,this.clock.now());
      const chain:PriceEvidence[]=[];let next:string|null=evidenceId;
      while(next){ensure(chain.length<1000,'correction_chain_limit');const e:PriceEvidence=this.store.get<PriceEvidence>(next,'price');chain.unshift(e);next=e.correctionOf;}
      return chain.map(e=>this.simulator.execute(runId,{type:'observe',observation:admitFixturePrice(e,this.store.get<SourcePolicy>(e.policyId,'policy'),this.store.get<CalendarEvidence>(e.calendarId,'calendar'),configuration,this.clock.now()).observation},`market_${e.id}`));
    });
  }
  execute(runId:string,command:Exclude<Command,{type:'observe'}>,requestId:string){
    return this.store.db.transaction(()=>{
      const state=this.simulator.inspect(runId),configuration=this.simulator.configuration(runId);
      // Exact receipt replay remains valid without repeating any price-dependent effect.
      const replay=this.store.db.get('SELECT 1 FROM investment_receipts WHERE run_id=? AND request_id=?',runId,requestId);
      const terminal=command.type==='fill'&&state.orders[command.orderId]?.status!=='pending';
      if(!replay&&!terminal)this.riskAdmission?.(runId,command);
      if(!replay&&!terminal&&['submit','fill','benchmark_open','value','revise_valuations'].includes(command.type)){
        const observed=new Set(state.observations.map(o=>o.id));
        for(const observation of state.observations){
          const e=this.store.get<PriceEvidence>(observation.id,'price'),p=this.store.get<SourcePolicy>(e.policyId,'policy');
          ensure(p.id===configuration.marketPolicy.id,'frozen_source_policy_mismatch');requireUses(p,['automation','internal_calculation','retention'],this.clock.now());
          for(const other of this.store.prices().filter(o=>o.instrumentId===e.instrumentId&&o.session===e.session&&o.field===e.field)){
            ensure(other.quality!=='conflicting_sources','unresolved_source_conflict');
            ensure(!other.correctionOf||observed.has(other.id),'market_correction_not_delivered');
          }
        }
      }
      return this.simulator.execute(runId,command,requestId);
    });
  }
}
