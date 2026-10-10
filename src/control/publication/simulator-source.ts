import { FixtureSimulator, type SimulationClock } from '../investment.js';
import { Store } from '../../persistence/store.js';
import { MarketStore } from '../market/store.js';
import { evidenceRights } from '../../domain/market/admission.js';
import type { ActionEvidence, PriceEvidence, SourcePolicy } from '../../domain/market/types.js';
import { ensure, decimal, format, multiply } from '../../domain/investment/arithmetic.js';
import { hash, time } from '../../domain/investment/identity.js';
import { initialState, reduce } from '../../domain/investment/reducer.js';
import type { Configuration, Journal, Order, State, ValuationRecord } from '../../domain/investment/types.js';
import type { Material, Origin, ProjectionContext, PublicationSource, PublicContent } from '../../domain/publication/types.js';
import type { Actor, CorporateAction, Event, Fill, Instrument, JournalEntry, LedgerTransaction, MarketObservation, PaperOrder, PortfolioSnapshot, RunConfiguration, Source, Worker } from '../../../contracts/investment/v1/types.js';
import { canonicalHash, sha256 as hashBytes, validate } from '../../../scripts/investment-contracts/schema.js';
import { checkContent } from '../../../scripts/investment-contracts/content.js';
export interface FixtureDecisionCopy {
  mode:'synthetic_fixture_derivative'; proposalHash:string; reviewHash:string;
  rationale:string; alternatives:[string,...string[]]; risks:[string,...string[]]; invalidationCondition:string;
  reviewRationale:string; dissent:string[];
}
export interface FixturePublicationDescription {
  title:string; purpose:string; objective:string; openingFieldDefinition:string; attribution:string;
  rightsEvidence:[string,...string[]]; limitations:[string,...string[]];
  cycleExecutionBudget:number; dailyExecutionBudget:number; runExecutionBudget:number;
  heartbeatSeconds:number; staleSeconds:number; maxOutboxAgeSeconds:number; maxOutboxBytes:number; dataDelaySeconds:number;
  workers:Record<string,Omit<Worker,'workerId'>>;
  instrumentClassification:Record<string,string>;
  decisions:Record<string,FixtureDecisionCopy>;
  actionSources:Record<string,Source>;
  artifacts:{id:string;version:number;title:string;createdAt:string;approvedAt:string;sourceHash:string;bytes:Buffer;contentType:PublicContent['contentType'];limitations:string[]}[];
}
/** A real simulator reader with explicitly invented fixture derivatives. It cannot label employees or prices as observed. */
export class SimulatorPublicationSource implements PublicationSource {
  readonly mode='synthetic_fixture' as const;
  readonly privateRunId:string;
  constructor(readonly id:string,readonly title:string,private readonly db:Store,private readonly clock:SimulationClock,private readonly fixtureOperator:string,runId:string,private readonly description:FixturePublicationDescription,private readonly readArtifact?:(id:string,version:number)=>Buffer){this.privateRunId=runId;}
  get participants(){return Object.keys(this.description.workers);}
  private simulator(){return new FixtureSimulator(this.db,this.clock,this.fixtureOperator);}
  checkRights(material:Material,at:string):void {
    const market=new MarketStore(this.db),sim=this.simulator(),c=sim.configuration(this.privateRunId),state=sim.inspect(this.privateRunId);
    ensure(c.evidenceMode==='synthetic_fixture'&&material.events.every(x=>x.event.evidenceMode==='synthetic_fixture'),'publication_observed_gate_closed');
    for(const content of material.contents){ensure(this.readArtifact&&hash({source:hashBytes(this.readArtifact(content.origin.id,Number(content.origin.version))),derivative:hashBytes(content.bytes)})===content.origin.hash,'publication_artifact_source_mismatch');}
    for(const o of state.observations){const e=market.get<PriceEvidence>(o.id,'price'),p=market.get<SourcePolicy>(e.policyId,'policy');ensure(p.id===c.marketPolicy.id&&e.mode==='synthetic_fixture','publication_source_policy');
      evidenceRights(e,p,['automation','internal_calculation','retention','public_display','derived_portfolio','exports','permanent_archive',...(o.instrumentId===c.benchmark.instrument.id?['benchmark' as const]:[])],at);
    }
    for(const action of state.actions){const rows=this.db.all<{id:string}>("SELECT id FROM investment_market_records WHERE kind='action'");const e=rows.map(r=>market.get<ActionEvidence>(r.id,'action')).find(e=>e.action.id===action.id);ensure(e,'publication_action_evidence_missing');ensure(e.mode==='synthetic_fixture'&&e.policyId===c.marketPolicy.id&&hash(e.action)===hash(action),'publication_action_source_mismatch');evidenceRights(e,market.get<SourcePolicy>(e.policyId,'policy'),['automation','internal_calculation','retention','public_display','derived_portfolio','benchmark','exports','permanent_archive'],at);}
  }
  project(ctx:ProjectionContext):Material {
    const sim=this.simulator(),c=sim.configuration(this.privateRunId),journals=sim.journal(this.privateRunId),d=this.description;
    ensure(c.evidenceMode==='synthetic_fixture','publication_observed_gate_closed');
    const sourceHash=hash({configuration:c,journals:journals.map(j=>j.hash),description:{...d,artifacts:d.artifacts.map(a=>({...a,bytes:a.bytes.toString('base64')}))}});
    const material:Material={sourceHash,events:[],contents:[]},pub=(kind:string,key:string)=>ctx.identity(kind,key);
    const origin=(kind:string,key:string,version:string,digest:string):Origin=>({kind,id:key,version,hash:digest});
    function emit(type:Event['type'],payload:unknown,key:string,at:string,source:Origin,actor:Actor={kind:'system'}) {
      const event=validate<Event>('Event',{schemaVersion:'1.0',eventId:pub('event',key),experimentId:ctx.experimentId,runId:ctx.runId,sourceSequence:ctx.sequence(key),type,occurredAt:at,recordedAt:at,actor,publicationPolicyVersion:ctx.policyVersion,evidenceMode:'synthetic_fixture',references:[],payload});
      material.events.push({event,origin:source});return event;
    }
    const instrument=(i:Configuration['instruments'][number]):Instrument=>{
      ensure(i.sector&&d.instrumentClassification[i.id],'publication_classification_missing');return {instrumentId:pub('instrument',i.id),symbol:i.symbol,venue:i.venue,currency:i.currency,sector:i.sector,classificationSource:d.instrumentClassification[i.id]!,symbolHistory:[{symbol:i.symbol,effectiveFrom:c.startsAt.slice(0,10),effectiveTo:null}]};
    };
    const configuration:RunConfiguration=validate('RunConfiguration',{
      configurationVersion:pub('configuration',c.version),methodologyVersion:c.methodology,methodologyHash:hash({method:c.methodology,execution:c.execution,cutoff:c.cutoffMinutes,rounding:'half_even_6'}),universeVersion:pub('universe',c.universeVersion),universe:c.instruments.map(instrument),initialCapital:c.initialCapital,currency:c.currency,
      benchmarkInstrument:instrument(c.benchmark.instrument),benchmarkConvention:c.benchmark.convention,calendarVersion:pub('calendar',c.calendar.version),calendarTimezone:c.calendar.timezone,marketProvider:c.marketPolicy.provider,feed:c.marketPolicy.feed,openingFieldDefinition:d.openingFieldDefinition,executionRule:c.execution,cutoffMinutes:c.cutoffMinutes,slippageBps:c.slippageBps,commission:c.commission,quantityRule:'whole_discretionary_six_decimal_actions',rounding:'half_even_6',costBasis:'weighted_average',longOnly:c.longOnly,leverage:c.leverage,cashConvention:'no_interest_no_tax_immediate_simulated_settlement',positionLimitBps:c.positionLimitBps,sectorLimitBps:c.sectorLimitBps,drawdownStopBps:c.drawdownAttentionBps,decisionCadence:'one_review_per_regular_session',officialSessions:c.calendar.sessions.filter(s=>s.status==='open').length,cycleExecutionBudget:d.cycleExecutionBudget,dailyExecutionBudget:d.dailyExecutionBudget,runExecutionBudget:d.runExecutionBudget,publicationPolicyVersion:ctx.policyVersion,publicationHeartbeatSeconds:d.heartbeatSeconds,publicationStaleSeconds:d.staleSeconds,maxOutboxAgeSeconds:d.maxOutboxAgeSeconds,maxOutboxBytes:d.maxOutboxBytes,dataDelaySeconds:d.dataDelaySeconds,attribution:d.attribution,rightsEvidence:d.rightsEvidence,configurationStatus:'synthetic_only',approvalRecordId:null,limitations:['Invented synthetic fixture; no real employee deliberation or observed price is claimed.',...d.limitations],maxOpeningWaitSeconds:c.maxOpeningWaitSeconds,
    });
    const configHash=canonicalHash(configuration),configOrigin=origin('configuration',c.runId,c.version,hash(c));
    emit('run.published',{title:d.title,purpose:d.purpose,objective:d.objective,runKind:'fixture',state:'configured',configuration,configurationHash:configHash,startsAt:c.startsAt,endsAt:c.endsAt,previousRunId:null},'run',c.startsAt,configOrigin);
    ensure(this.participants.length>0&&this.participants.every(p=>c.authorization.authors.includes(p)||c.authorization.reviewers.includes(p)),'publication_roster_source');
    emit('team.published',{rosterVersion:pub('roster','fixture'),workers:Object.entries(d.workers).map(([privateId,description])=>({...description,workerId:pub('worker',privateId)}))},'team',c.startsAt,origin('fixture_roster',c.runId,'1',hash(d.workers)));
    const market=new MarketStore(this.db);
    const observation=(privateId:string):MarketObservation=>{
      const e=market.get<PriceEvidence>(privateId,'price');ensure(e.value!==null&&e.marketAt!==null&&['verified','corrected'].includes(e.quality),'publication_price_unverified');
      return {observationId:pub('observation',e.id),instrumentId:pub('instrument',e.instrumentId),venue:e.venue,currency:e.currency,provider:e.provider,feed:e.feed,field:e.field,value:e.value,adjustment:'raw',session:e.session,marketAt:e.marketAt,availableAt:e.sourceAvailableAt,retrievedAt:e.retrievedAt,calendarVersion:pub('calendar',e.calendarVersion),sourceVersion:pub('source_version',`${e.sourceId}:${e.sourceVersion}`),delaySeconds:d.dataDelaySeconds};
    };
    let state=initialState(c),ledger:LedgerTransaction|null=null;const orderEvents=new Map<string,Event[]>(),decisionEvents=new Map<string,Extract<Event,{type:'decision.published'}>>(),publicFinancial:{privateVersion:bigint;transaction:LedgerTransaction}[]=[];
    const actionPayload=(actionId:string,kind:CorporateAction['kind'],atState:State):CorporateAction=>{
      const a=atState.actions.find(a=>a.id===actionId);ensure(a,'publication_action_missing');const src=d.actionSources[actionId];ensure(src,'publication_action_source_missing');const entitlement=atState.entitlements.find(e=>e.actionId===a.id&&e.book==='portfolio');
      return {actionId:pub('action',`${a.id}:${kind}`),providerActionId:pub('provider_action',a.providerActionId),instrumentId:pub('instrument',a.instrumentId),sourceVersion:pub('action_version',`${a.id}:${a.sourceVersion}`),kind,effectiveAt:kind==='dividend_payment'?a.paymentAt!:a.effectiveAt,exDate:a.kind==='dividend'?a.effectiveAt.slice(0,10):null,paymentDate:a.paymentAt?.slice(0,10)??null,numerator:a.numerator,denominator:a.denominator,cashPerShare:a.cashPerShare,entitledQuantity:entitlement?.quantity??null,fractionalEntitlement:entitlement?.fraction??null,newSymbol:a.newSymbol,source:{...src,sourceId:pub('source',src.sourceId)}};
    };
    const orderTransition=(o:Order,index:number,j:Journal)=>{
      const transition=o.transitions[index]!,prior=orderEvents.get(o.id)??[],decision=decisionEvents.get(`${o.decisionId}:${o.decisionRevision}`);ensure(decision,'publication_decision_derivative_required');
      const pending=transition.status==='pending',reservedCash=pending&&o.side==='BUY'?format(multiply(decimal(o.quantity),decimal(o.priceGuard))+decimal(c.commission)):'0.000000';
      const payload:PaperOrder={orderId:pub('order',o.id),decisionId:decision.payload.proposal.decisionId,decisionRevision:o.decisionRevision,proposalHash:decision.payload.proposalHash,orderIndex:o.orderIndex,revision:index+1,previousEventId:prior.at(-1)?.eventId??null,instrumentId:pub('instrument',o.instrumentId),side:o.side,quantity:o.quantity,targetSession:o.targetSession,deadline:o.deadline,priceGuard:o.priceGuard,status:transition.status,reason:transition.reason,configurationHash:configHash,expectedLedgerVersion:(prior[0]?.type==='paper.order'?prior[0].payload.expectedLedgerVersion:ledger?.ledgerVersion)??'1',reservedCash,reservedQuantity:pending&&o.side==='SELL'?o.quantity:'0.000000',expiresAt:o.expiresAt};
      const event=emit('paper.order',payload,`order:${o.id}:${index+1}`,transition.at,origin('journal',j.transactionId,j.version,j.hash));prior.push(event);orderEvents.set(o.id,prior);
    };
    for(const j of journals){
      const before=state;try{state=reduce(c,state,j.command,j.recordedAt).state;}catch{ensure(j.outcome.status==='rejected','publication_replay_failed');state=structuredClone(before);}
      state.version=j.version;state.ledgerVersion=j.ledgerVersion;state.hash=j.hash;
      const jOrigin=origin('journal',j.transactionId,j.version,j.hash);
      if(j.command.type==='control'&&j.outcome.status!=='rejected')emit('run.status',{state:j.command.state,reason:'Explicit synthetic simulator lifecycle control',effectiveAt:j.recordedAt,nextReviewAt:null},`control:${j.version}`,j.recordedAt,jOrigin);
      if(j.command.type==='review'&&j.outcome.status!=='rejected'){
        const r=j.command.review,decision=state.decisions[`${r.decisionId}:${r.revision}`];ensure(decision,'publication_decision_missing');
        const copy=d.decisions[`${r.decisionId}:${r.revision}`];ensure(copy&&copy.mode==='synthetic_fixture_derivative'&&copy.proposalHash===decision.hash&&copy.reviewHash===hash(r),'publication_review_derivative_required');
        ensure(decision.orders.length<=1,'publication_multi_order_derivative_required');const o=decision.orders[0];
        const proposal={decisionId:pub('decision',decision.decisionId),revision:decision.revision,action:decision.action,instrumentId:o?pub('instrument',o.instrumentId):null,quantity:o?.quantity??null,targetSession:o?.targetSession??null,priceGuard:o?.priceGuard??null,evidenceCutoff:decision.evidenceCutoff,committedAt:decision.committedAt,rationale:copy.rationale,alternatives:copy.alternatives,risks:copy.risks,invalidationCondition:copy.invalidationCondition,evidence:[],sources:[]};
        ensure(decision.evidence.length===0,'publication_evidence_derivative_required');const proposalHash=canonicalHash(proposal);
        const event=emit('decision.published',{proposal,proposalHash,review:{reviewId:pub('review',r.id),reviewerId:pub('worker',r.reviewer),proposalHash,proposalRevision:r.revision,reviewedAt:r.reviewedAt,disposition:r.disposition,rationale:copy.reviewRationale,dissent:copy.dissent,evidence:[]}},`decision:${r.decisionId}:${r.revision}`,j.recordedAt,origin('fixture_decision_derivative',j.transactionId,j.version,hash({journal:j.hash,copy})),{kind:'worker',workerId:pub('worker',decision.author)});
        ensure(event.type==='decision.published','publication_event_type');decisionEvents.set(`${r.decisionId}:${r.revision}`,event);
      }
      for(const o of Object.values(state.orders))for(let n=orderEvents.get(o.id)?.length??0;n<o.transitions.length;n++){if(o.transitions[n]!.status==='filled')break;orderTransition(o,n,j);}
      const postings=j.entries.filter(e=>e.book==='portfolio');
      if(postings.length){
        const accounts={cash:'cash',basis:'book_cost',quantity:'quantity',realized:'realized_pnl',fees:'fee',income:'income',receivables:'receivable',liabilities:'liability',capital:'capital'} as const;
        const sums=new Map<string,JournalEntry>();for(const p of postings){const account=accounts[p.account],instrumentId=['quantity','book_cost'].includes(account)?pub('instrument',p.instrumentId!):null,key=`${account}:${instrumentId}`;const old=sums.get(key);sums.set(key,{account,instrumentId,currency:'USD',amount:format(decimal(old?.amount??'0')+decimal(p.amount))});}
        let effect:LedgerTransaction['effect'],fill:Fill|null=null,corporateAction:CorporateAction|null=null;
        const f=j.outcome.fills.find(f=>f.book==='portfolio');
        if(j.command.type==='initialize')effect='initialization';
        else if(f){effect='fill';ensure(f.orderId,'publication_order_missing');const o=state.orders[f.orderId]!,oe=orderEvents.get(f.orderId)?.at(-1);ensure(oe?.type==='paper.order'&&oe.payload.status==='pending','publication_pending_order_required');
          fill={orderId:pub('order',f.orderId),orderRevision:oe.payload.revision,decisionId:pub('decision',o.decisionId),decisionRevision:o.decisionRevision,instrumentId:pub('instrument',f.instrumentId),side:f.side,quantity:o.quantity,price:f.price,fee:f.fee,releasedBasis:f.releasedBasis,roundingAdjustment:'0',observation:observation(f.observationId),priceRoundingResidual:f.priceResidual,basisRoundingResidual:f.basisResidual};
        }else if(j.command.type==='action'&&['split','dividend'].includes(j.command.action.kind)){effect=j.command.action.kind==='split'?'split':'dividend_accrual';corporateAction=actionPayload(j.command.action.id,effect,state);}
        else if(j.command.type==='dividend_payment'){effect='dividend_payment';corporateAction=actionPayload(j.command.actionId,effect,state);}
        else {ensure(false,'publication_financial_effect_unsupported');}
        const sequence:string=String(BigInt(ledger?.journalSequence??'0')+1n),unsigned:Omit<LedgerTransaction,'journalHash'>={transactionId:pub('transaction',j.transactionId),journalSequence:sequence,previousHash:ledger?.journalHash??null,previousLedgerVersion:ledger?.ledgerVersion??null,ledgerVersion:sequence,configurationHash:configHash,effect,sourceOperationId:pub('operation',j.operationId),effectiveAt:j.effectiveAt,recordedAt:j.recordedAt,entries:[...sums.values()] as [JournalEntry,...JournalEntry[]],fill,corporateAction,correctionOf:null};
        ledger=validate<LedgerTransaction>('LedgerTransaction',{...unsigned,journalHash:canonicalHash(unsigned)});emit('paper.ledger_transaction',ledger,`ledger:${j.transactionId}`,j.recordedAt,jOrigin);publicFinancial.push({privateVersion:BigInt(j.ledgerVersion),transaction:ledger});
      }
      for(const o of Object.values(state.orders))for(let n=orderEvents.get(o.id)?.length??0;n<o.transitions.length;n++)orderTransition(o,n,j);
      if(j.command.type==='action'&&j.outcome.status!=='rejected'){
        const a=j.command.action;ensure(c.instruments.some(i=>i.id===a.instrumentId),'publication_benchmark_action_unsupported_v1');const kind=a.kind==='dividend'?'dividend_accrual':a.kind;const payload=actionPayload(a.id,kind,state);
        const actionEvent=emit('market.action',payload,`market_action:${a.id}`,j.recordedAt,jOrigin);
        if(a.kind==='ticker_change'){
          const base=c.instruments.find(i=>i.id===a.instrumentId);ensure(base,'publication_instrument_missing');const previous=material.events.filter(x=>x.event.type==='instrument.updated'&&x.event.payload.instrument.instrumentId===pub('instrument',a.instrumentId)).at(-1)?.event;
          const previousInstrument=previous?.type==='instrument.updated'?previous.payload.instrument:instrument(base),symbols=structuredClone(previousInstrument.symbolHistory);symbols.at(-1)!.effectiveTo=a.effectiveAt.slice(0,10);symbols.push({symbol:a.newSymbol!,effectiveFrom:a.effectiveAt.slice(0,10),effectiveTo:null});
          emit('instrument.updated',{version:previous?.type==='instrument.updated'?previous.payload.version+1:1,instrument:{...previousInstrument,symbol:a.newSymbol,symbolHistory:symbols},effectiveAt:a.effectiveAt,reason:'Verified synthetic ticker-change evidence',action:{kind:'corporate_action',id:payload.actionId,version:1,relation:'supports'}},`symbol:${actionEvent.eventId}`,j.recordedAt,jOrigin);
        }
      }
      for(const record of state.valuations.slice(before.valuations.length)){
        const v=record.snapshot,anchor=publicFinancial.filter(f=>f.privateVersion<=BigInt(v.ledgerVersion)&&time(f.transaction.effectiveAt)<=time(v.asOf)).at(-1)?.transaction;ensure(anchor,'publication_valuation_anchor_missing');
        ensure(publicFinancial.filter(f=>BigInt(f.transaction.journalSequence)<=BigInt(anchor.journalSequence)).every(f=>time(f.transaction.effectiveAt)<=time(v.asOf)),'publication_historical_prefix_unsupported_v1');
        const snapshot=this.snapshot(c,record,state,configuration,anchor,pub,observation);
        emit('portfolio.snapshot',snapshot,`valuation:${v.id}:${v.revision}`,j.recordedAt,jOrigin);
      }
    }
    const artifactVersions=new Map<string,number>();
    for(const a of d.artifacts){const previous=artifactVersions.get(a.id)??0;ensure(Number.isSafeInteger(a.version)&&a.version===previous+1&&time(a.createdAt)<=time(a.approvedAt)&&/^[a-f0-9]{64}$/.test(a.sourceHash),'publication_artifact_derivative_invalid');ensure(this.readArtifact&&hashBytes(this.readArtifact(a.id,a.version))===a.sourceHash,'publication_artifact_source_mismatch');artifactVersions.set(a.id,a.version);const checked=checkContent(a.bytes,a.contentType,hashBytes(a.bytes)),actor:Actor={kind:'owner'},source=origin('fixture_artifact_derivative',a.id,String(a.version),hash({source:a.sourceHash,derivative:checked.sha256}));
      material.contents.push({origin:source,contentType:a.contentType,bytes:Buffer.from(a.bytes)});const artifactId=pub('artifact',a.id);
      if(a.version===1)emit('artifact.registered',{artifactId,title:a.title,author:actor,status:'awaiting_publication',reason:null,relationships:[]},`artifact:${a.id}:registration`,a.approvedAt,source,actor);
      emit('artifact.published',{artifactId,version:a.version,title:a.title,author:actor,createdAt:a.createdAt,publishedAt:a.approvedAt,contentType:a.contentType,sizeBytes:a.bytes.length,sha256:checked.sha256,relationships:[],sources:[],rights:'owner_authored',limitations:a.limitations,supersedes:previous?{kind:'artifact',id:artifactId,version:previous,relation:'supersedes'}:null,derivative:true},`artifact:${a.id}:${a.version}`,a.approvedAt,source,actor);
    }
    material.events.sort((a,b)=>BigInt(a.event.sourceSequence)<BigInt(b.event.sourceSequence)?-1:1);
    return material;
  }
  private snapshot(c:Configuration,record:ValuationRecord,state:State,configuration:RunConfiguration,anchor:LedgerTransaction,pub:(kind:string,key:string)=>string,observation:(id:string)=>MarketObservation):PortfolioSnapshot {
    const v=record.snapshot,benchmarkId=c.benchmark.instrument.id;
    const benchmarkObservation=state.observations.find(o=>v.observationIds.includes(o.id)&&o.instrumentId===benchmarkId&&o.field==='regular_close'&&o.session===v.session);
    const benchmarkMark=v.benchmarkEquity!==null&&benchmarkObservation?observation(benchmarkObservation.id):null;
    const complete=v.quality==='complete'&&benchmarkMark!==null;
    const previousSessions=c.calendar.sessions.filter(s=>s.status==='open'&&time(s.close)<time(v.asOf)&&time(s.close)>=time(c.startsAt));
    const previousAt=previousSessions.at(-1)?.close??c.startsAt;
    const comparable=state.valuations.findLast(p=>p.snapshot.asOf===previousAt&&time(p.snapshot.recordedAt)<=time(v.recordedAt))?.snapshot;
    return validate('PortfolioSnapshot',{
      valuationId:pub('valuation',v.id),valuationSequence:v.sequence,revision:v.revision,supersedes:v.revision===1?null:{kind:'valuation',id:pub('valuation',v.id),version:v.revision-1,relation:'supersedes'},journalSequence:anchor.journalSequence,journalHash:anchor.journalHash,configurationHash:canonicalHash(configuration),markSetId:pub('mark_set',`${v.id}:${v.revision}`),valuationAsOf:v.asOf,session:v.session,currency:'USD',cash:v.cash,receivables:v.receivables,liabilities:v.liabilities,
      holdings:v.holdings.map(h=>{const mark=h.value!==null&&h.markId?observation(h.markId):null;return {instrumentId:pub('instrument',h.instrumentId),symbol:h.symbol,sector:c.instruments.find(i=>i.id===h.instrumentId)!.sector,quantity:h.quantity,bookCost:h.basis,mark,marketValue:mark?h.value:null,unrealizedPnl:mark?format(decimal(h.value!)-decimal(h.basis)):null,missingReason:mark?null:'Unavailable or unsupported exact closing mark'};}),
      equity:complete?v.equity:null,realizedPnl:v.realized,unrealizedPnl:complete?v.unrealized:null,totalReturn:complete?v.totalReturn:null,dailyReturn:complete?v.dailyReturn:null,previousComparableEquity:complete&&v.dailyReturn!==null?comparable?.equity??null:null,peakEquity:complete?v.peak:null,drawdown:complete?v.drawdown:null,maxDrawdown:complete?v.maxDrawdown:null,
      benchmark:{instrumentId:pub('instrument',benchmarkId),convention:c.benchmark.convention,session:v.session,units:record.benchmark.positions[benchmarkId]?.quantity??'0.000000',cash:record.benchmark.cash,receivables:record.benchmark.receivables,mark:benchmarkMark,equity:benchmarkMark?v.benchmarkEquity:null,totalReturn:benchmarkMark?v.benchmarkReturn:null,missingReason:benchmarkMark?null:'Unavailable exact benchmark closing mark'},
      excessReturn:complete&&v.totalReturn!==null&&v.benchmarkReturn!==null?format(decimal(v.totalReturn)-decimal(v.benchmarkReturn)):null,quality:complete?'complete':v.quality==='blocked'?'blocked':'partial',limitations:complete?[]:['Unavailable or unsupported matched portfolio/benchmark valuation'],
    });
  }
}
