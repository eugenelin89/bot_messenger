import { add, checked, decimal, ensure, format, nonnegative, positive, rational, rounded, SCALE, SimulationError, wholeShares } from './arithmetic.js';
import { assertBalanced, assertBook, emptyBook, guardedCost, position, posting, release, reserve, trade } from './accounting.js';
import { canonical, exact, hash, id, identity, integer, time } from './identity.js';
import { deadline, expiry, instrument, nextSession, opening, session, validateObservation } from './policy.js';
import { bookValue, concentration, latestValuations, historicalState, valuePortfolio } from './valuation.js';
import type { Command, Configuration, CorporateAction, Order, Outcome, Posting, State } from './types.js';
const ZERO = '0.000000';
const keys: Record<Command['type'], string[]> = {
  initialize:['type'], decision:['type','proposal'], review:['type','review'], observe:['type','observation'],
  submit:['type','decisionId','revision','orderIndex','expectedVersion','reviewId'], fill:['type','orderId'], cancel:['type','orderId'], expire:['type','orderId'],
  control:['type','state'], action:['type','action'], dividend_payment:['type','actionId'], benchmark_open:['type','session'], value:['type','session','asOf'], revise_valuations:['type','correctionId'],
};
export function initialState(c: Configuration): State {
  return {version:'0',ledgerVersion:'0',hash:null,configurationHash:hash(c),economicAsOf:c.startsAt,lifecycle:'active',portfolio:emptyBook(),benchmark:emptyBook(),benchmarkNextOpen:nextSession(c,c.startsAt)!.date,benchmarkFunding:[{amount:c.initialCapital,session:nextSession(c,c.startsAt)!.date,used:false}],ordersUsed:0,
    decisions:{},reviews:{},observations:[],orders:{},actions:[],entitlements:[],blocked:{},blockEvents:[],benchmarkExecutions:[],symbols:Object.fromEntries([...c.instruments,c.benchmark.instrument].map(i=>[i.id,[{symbol:i.symbol,effectiveAt:c.startsAt}]])),financialTimes:[],accountingHistory:[],payments:[],inventoryHistory:[],valuations:[],lastGood:null};
}
function running(c: Configuration, state: State, at: string): void {
  ensure(state.lifecycle === 'active', 'run_not_active');
  ensure(time(at) >= time(c.startsAt) && time(at) < time(c.endsAt), 'outside_run_window');
  ensure(time(at) < time(c.authorization.expiresAt), 'authorization_expired');
}
function transition(state: State, order: Order, status: Order['status'], at: string, reason: string | null): void {
  if (order.status === 'pending' && status !== 'pending') release(state,order.id);
  order.status = status; order.reason = reason; order.transitions.push({status,at,reason});
}
function cancelAffected(state: State, instrumentId: string | null, at: string, reason: string): void {
  for (const o of Object.values(state.orders)) if (o.status === 'pending' && (!instrumentId || o.instrumentId === instrumentId)) transition(state,o,'cancelled',at,reason);
}
function risk(c: Configuration, state: State, o: Order, at: string, executedPrice?: bigint): void {
  running(c,state,at); ensure(c.instruments.some(i=>i.id===o.instrumentId), 'instrument_not_allowed');
  ensure(!state.blocked[o.instrumentId], 'instrument_blocked'); ensure(instrument(c,o.instrumentId).sector, 'unknown_sector');
  ensure(!state.entitlements.some(e=>e.book==='portfolio' && e.fraction !== null), 'unresolved_entitlement');
  const quantity = wholeShares(o.quantity), p = position(state.portfolio,o.instrumentId);
  const effective = executedPrice === undefined ? at : session(c.calendar,o.targetSession).open;
  const view = bookValue(c,state,state.portfolio,'portfolio',effective,at,executedPrice === undefined ? undefined : o.targetSession);
  ensure(view.equity !== null, 'risk_marks_unavailable');
  if (o.side === 'BUY') {
    const cost = guardedCost(quantity,executedPrice ?? positive(o.priceGuard),nonnegative(c.commission));
    const ownReservation = o.status === 'pending' ? decimal(o.reservedCash) : 0n;
    ensure(decimal(state.portfolio.cash)-decimal(state.portfolio.reservedCash)+ownReservation >= cost, 'insufficient_cash');
    const assessment = concentration(c,state,effective,at,executedPrice === undefined ? undefined : o.targetSession,o.id,{instrumentId:o.instrumentId,notional:cost,equityLoss:nonnegative(c.commission)});
    ensure(assessment.reasons.length === 0, assessment.reasons[0] ?? 'risk_blocked');
  } else {
    const ownReservation = o.status === 'pending' ? decimal(o.reservedShares) : 0n;
    ensure(decimal(p.quantity)-decimal(p.reserved)+ownReservation >= quantity, 'insufficient_shares');
  }
}
function validateAction(c: Configuration, action: CorporateAction, at: string): void {
  exact(action,['id','providerActionId','provider','instrumentId','sourceVersion','effectiveAt','availableAt','adjustment','quality','kind','numerator','denominator','cashPerShare','paymentAt','newSymbol']);
  id(action.id); id(action.providerActionId); instrument(c,action.instrumentId); integer(action.sourceVersion,1,1_000_000);
  ensure(action.provider === c.marketPolicy.provider && action.adjustment === 'raw' && action.quality === 'verified','invalid_action_source');
  ensure(time(action.effectiveAt) >= time(c.startsAt) && time(action.effectiveAt) < time(c.endsAt) && time(action.effectiveAt) <= time(at) && time(action.availableAt) <= time(at), 'action_time_order');
  ensure(['split','dividend','ticker_change','unsupported'].includes(action.kind),'unsupported_action_kind');
  if (action.kind === 'split') {
    ensure(action.numerator !== null && action.denominator !== null && /^[1-9][0-9]{0,8}$/.test(action.numerator) && /^[1-9][0-9]{0,8}$/.test(action.denominator),'invalid_split_ratio');
    ensure(action.cashPerShare === null && action.paymentAt === null && action.newSymbol === null,'invalid_action_fields');
  } else if (action.kind === 'dividend') {
    ensure(action.cashPerShare !== null,'missing_dividend'); positive(action.cashPerShare);
    ensure(action.paymentAt === null || time(action.paymentAt) >= time(action.effectiveAt),'invalid_payment_time');
    ensure(action.numerator === null && action.denominator === null && action.newSymbol === null,'invalid_action_fields');
  } else if (action.kind === 'ticker_change') {
    ensure(action.newSymbol !== null,'missing_symbol'); id(action.newSymbol);
    ensure(action.numerator === null && action.denominator === null && action.cashPerShare === null && action.paymentAt === null,'invalid_action_fields');
  } else ensure(action.numerator === null && action.denominator === null && action.cashPerShare === null && action.paymentAt === null && action.newSymbol === null,'invalid_action_fields');
}
export function reduce(c: Configuration, input: State, command: Command, at: string): {state:State;entries:Posting[];outcome:Outcome} {
  const state = structuredClone(input), entries: Posting[] = [], outcome: Outcome = {status:'accepted',reason:null,orderId:null,valuation:null,fills:[]};
  ensure(command && Object.hasOwn(keys,command.type),'unknown_command'); exact(command,keys[command.type]); time(at);
  if (command.type !== 'initialize') ensure(state.version !== '0','not_initialized');
  switch (command.type) {
    case 'initialize': {
      ensure(state.version === '0' && time(at) === time(c.startsAt),'invalid_initialization');
      for (const book of ['portfolio','benchmark'] as const) { posting(state,entries,book,'cash',positive(c.initialCapital)); posting(state,entries,book,'capital',positive(c.initialCapital)); }
      break;
    }
    case 'decision': {
      running(c,state,at); const p = command.proposal;
      exact(p,['decisionId','revision','author','action','evidenceCutoff','evidence','rationale','orders']); id(p.decisionId); integer(p.revision,1,1_000_000);
      ensure(c.authorization.authors.includes(p.author),'unauthorized_author'); ensure(['BUY','SELL','HOLD'].includes(p.action),'invalid_decision');
      ensure(time(p.evidenceCutoff) <= time(at) && time(p.evidenceCutoff) >= time(c.startsAt),'invalid_evidence_cutoff');
      ensure(typeof p.rationale === 'string' && p.rationale.length > 0 && p.rationale.length <= 8000,'invalid_rationale');
      ensure(Array.isArray(p.evidence) && p.evidence.length <= 30,'invalid_evidence');
      for (const e of p.evidence) { exact(e,['id','availableAt']); id(e.id); const source=state.observations.find(o=>o.id===e.id); ensure(source && source.quality==='verified' && source.availableAt===e.availableAt,'missing_evidence_reference'); ensure(time(e.availableAt) <= time(p.evidenceCutoff) && time(source.retrievedAt)<=time(p.evidenceCutoff),'lookahead_evidence'); }
      ensure(Array.isArray(p.orders) && p.orders.length <= 20 && (p.action === 'HOLD' ? p.orders.length === 0 : p.orders.length > 0),'invalid_decision_orders');
      const target = nextSession(c,at);
      for (const o of p.orders) {
        exact(o,['instrumentId','side','quantity','priceGuard','targetSession']); instrument(c,o.instrumentId); wholeShares(o.quantity); positive(o.priceGuard);
        ensure(o.side === p.action,'decision_side_mismatch'); ensure(target && o.targetSession === target.date,'ineligible_target_session');
      }
      const key = `${p.decisionId}:${p.revision}`;
      ensure(!state.decisions[key],'duplicate_decision');
      const revisions = Object.values(state.decisions).filter(d=>d.decisionId===p.decisionId);
      ensure(p.revision === revisions.length+1,'decision_revision_gap');
      const decision = {...p,committedAt:at,hash:hash(p)}; state.decisions[key] = decision;
      if (p.action === 'HOLD') outcome.status = 'hold';
      break;
    }
    case 'review': {
      running(c,state,at); const r = command.review;
      exact(r,['id','decisionId','revision','proposalHash','reviewer','disposition','reviewedAt']); id(r.id); integer(r.revision,1,1_000_000);
      const d = state.decisions[`${r.decisionId}:${r.revision}`]; ensure(d,'missing_decision');
      ensure(c.authorization.reviewers.includes(r.reviewer) && r.reviewer !== d.author,'independent_reviewer_required');
      ensure(r.proposalHash === d.hash && time(r.reviewedAt) === time(at) && time(at) >= time(d.committedAt),'review_mismatch');
      ensure(r.disposition === 'approve' || r.disposition === 'reject','invalid_disposition'); ensure(!state.reviews[r.id],'duplicate_review');
      state.reviews[r.id] = r; break;
    }
    case 'observe': {
      const o = command.observation; validateObservation(c,o,at); ensure(!state.observations.some(x=>x.id===o.id),'duplicate_observation');
      const existing = state.observations.filter(x=>x.instrumentId===o.instrumentId && x.session===o.session && x.field===o.field);
      if (o.correctionOf === null) ensure(existing.length === 0 && o.sourceVersion === 1,'observation_requires_correction');
      else {
        const previous = existing.find(x=>x.id===o.correctionOf); ensure(previous && previous.sourceId===o.sourceId && o.sourceVersion===previous.sourceVersion+1,'invalid_correction_reference');
        ensure(!existing.some(x=>x.correctionOf===o.correctionOf),'correction_fork');
      }
      state.observations.push(o); break;
    }
    case 'submit': {
      id(command.decisionId); id(command.reviewId); integer(command.revision,1,1_000_000); integer(command.orderIndex,0,19);
      ensure(/^(0|[1-9][0-9]{0,17})$/.test(command.expectedVersion),'invalid_ledger_version');
      const d = state.decisions[`${command.decisionId}:${command.revision}`]; ensure(d,'missing_decision');
      ensure(d.action !== 'HOLD','hold_has_no_order'); const intent = d.orders[command.orderIndex]; ensure(intent,'missing_order_index');
      const orderId = identity('order',c.runId,d.decisionId,d.revision,command.orderIndex); ensure(!state.orders[orderId],'duplicate_order');
      const target = session(c.calendar,intent.targetSession);
      const o: Order = {id:orderId,decisionId:d.decisionId,decisionRevision:d.revision,orderIndex:command.orderIndex,proposalHash:d.hash,...intent,
        committedAt:at,deadline:deadline(c,target),expiresAt:expiry(c,target),expectedVersion:command.expectedVersion,reservedCash:ZERO,reservedShares:ZERO,status:'proposed',reason:null,transitions:[{status:'proposed',at,reason:null}]};
      state.orders[orderId] = o; outcome.orderId = orderId;
      try {
        ensure(state.ordersUsed < c.authorization.maxOrders,'operation_budget_exhausted'); state.ordersUsed++;
        ensure(command.expectedVersion === state.ledgerVersion,'ledger_version_conflict');
        ensure(time(at) < time(o.deadline) && time(d.committedAt) < time(o.deadline),'commitment_cutoff');
        const r = state.reviews[command.reviewId]; ensure(r && r.decisionId === d.decisionId && r.revision === d.revision && r.proposalHash === d.hash && r.disposition === 'approve' && time(r.reviewedAt) < time(o.deadline),'review_required');
        risk(c,state,o,at); transition(state,o,'validated',at,null);
        if (o.side === 'BUY') o.reservedCash = format(guardedCost(wholeShares(o.quantity),positive(o.priceGuard),nonnegative(c.commission)));
        else o.reservedShares = format(wholeShares(o.quantity));
        reserve(state,orderId); transition(state,o,'pending',at,null);
      } catch (error) { if (!(error instanceof SimulationError)) throw error; transition(state,o,'rejected',at,error.code); }
      outcome.status = o.status; outcome.reason = o.reason; break;
    }
    case 'fill': case 'expire': case 'cancel': {
      const o = state.orders[command.orderId]; ensure(o,'missing_order'); outcome.orderId = o.id;
      if (o.status !== 'pending') { outcome.status = o.status; outcome.reason = 'already_terminal'; break; }
      if (command.type === 'cancel') transition(state,o,'cancelled',at,'requested_cancel');
      else if (time(at) >= time(o.expiresAt)) transition(state,o,'expired',at,'opening_wait_expired');
      else if (command.type === 'expire') { outcome.status = 'pending'; outcome.reason = 'not_expired'; break; }
      else {
        const observation = opening(c,state.observations,o.instrumentId,o.targetSession,at);
        if (!observation) { outcome.status = 'data_blocked'; outcome.reason = 'opening_unavailable'; break; }
        // A known correction makes the original unsafe for a still-unfilled order. Never select its replacement.
        if (state.observations.some(x=>x.correctionOf===observation.id)) { outcome.status = 'data_blocked'; outcome.reason = 'opening_corrected'; break; }
        const price = rounded(positive(observation.value)*(10_000n+(o.side==='BUY'?1n:-1n)*BigInt(c.slippageBps)),10_000n).value;
        try {
          ensure(o.side==='BUY' ? price<=positive(o.priceGuard) : price>=positive(o.priceGuard),'price_guard');
          ensure(!state.financialTimes.some(f=>f.instrumentId===o.instrumentId && time(f.at)>time(observation.marketAt)),'out_of_order_fill');
          ensure(!state.accountingHistory.some(event=>time(event.effectiveAt)>time(observation.marketAt) && event.entries.some(e=>e.book==='portfolio')),'out_of_order_portfolio_fill');
          risk(c,state,o,at,price);
          const probe=structuredClone(state);release(probe,o.id);trade(probe,c,[],'portfolio',o.instrumentId,o.side,wholeShares(o.quantity),observation,o.id);
          if(o.side==='BUY') {const after=concentration(c,probe,observation.marketAt,at,o.targetSession,o.id);ensure(after.reasons.length===0,after.reasons[0]??'risk_blocked');}
        } catch (error) { if (!(error instanceof SimulationError)) throw error; transition(state,o,'rejected',at,error.code); outcome.status=o.status; outcome.reason=o.reason; break; }
        release(state,o.id);
        outcome.fills.push(trade(state,c,entries,'portfolio',o.instrumentId,o.side,wholeShares(o.quantity),observation,o.id));
        transition(state,o,'filled',at,null);
      }
      outcome.status = o.status; outcome.reason = o.reason; break;
    }
    case 'control': {
      ensure(['active','paused','ended'].includes(command.state),'invalid_lifecycle');
      ensure(state.lifecycle !== 'ended' || command.state === 'ended','run_ended');
      if (command.state === 'active') { ensure(time(at)<time(c.endsAt) && time(at)<time(c.authorization.expiresAt),'authorization_expired'); }
      else cancelAffected(state,null,at,`run_${command.state}`);
      state.lifecycle = command.state; outcome.status = command.state; break;
    }
    case 'action': {
      const a = command.action; validateAction(c,a,at);
      ensure(!state.actions.some(x=>x.provider===a.provider && x.instrumentId===a.instrumentId && x.providerActionId===a.providerActionId),'duplicate_action');
      ensure(!state.actions.some(x=>x.id===a.id),'action_id_conflict');
      state.actions.push(a); cancelAffected(state,a.instrumentId,at,'corporate_action');
      if (a.kind==='unsupported') { state.blocked[a.instrumentId]='unsupported_action'; outcome.status='blocked'; outcome.reason='unsupported_action'; break; }
      if (a.kind==='ticker_change') {
        const history=state.symbols[a.instrumentId]!; ensure(time(a.effectiveAt)>time(history.at(-1)!.effectiveAt),'out_of_order_symbol'); history.push({symbol:a.newSymbol!,effectiveAt:a.effectiveAt}); break;
      }
      if((a.kind==='split'||a.kind==='dividend') && state.actions.some(other=>other.id!==a.id && other.instrumentId===a.instrumentId && time(other.effectiveAt)===time(a.effectiveAt) && ((other.kind==='split' && a.kind==='dividend') || (other.kind==='dividend' && a.kind==='split')))) {
        state.blocked[a.instrumentId]='simultaneous_action_units_unknown';outcome.status='blocked';outcome.reason=state.blocked[a.instrumentId]!;break;
      }
      if (a.kind==='split' && (state.financialTimes.some(f=>f.instrumentId===a.instrumentId && time(f.at)>=time(a.effectiveAt)) || state.entitlements.some(e=>e.instrumentId===a.instrumentId && e.fraction!==null))) {
        state.blocked[a.instrumentId]='out_of_order_or_unresolved_split'; outcome.status='blocked'; outcome.reason=state.blocked[a.instrumentId]!; break;
      }
      for (const book of ['portfolio','benchmark'] as const) {
        const p=position(state[book],a.instrumentId);
        if (a.kind==='split') {
          const n=BigInt(a.numerator!),d=BigInt(a.denominator!),q=decimal(p.quantity),quantity=checked(q*n/d),remainder=q*n%d;
          posting(state,entries,book,'quantity',quantity-q,a.instrumentId);
          if (remainder) state.entitlements.push({actionId:a.id,book,instrumentId:a.instrumentId,quantity:ZERO,amount:ZERO,paymentAt:null,paid:false,fraction:rational(remainder,d*SCALE)});
          state.inventoryHistory.push({at:a.effectiveAt,book,instrumentId:a.instrumentId,quantity:p.quantity});
        } else {
          // Ex-date entitlement is the pre-boundary position, even when evidence arrives later.
          const prior=state.inventoryHistory.filter(h=>h.book===book && h.instrumentId===a.instrumentId && time(h.at)<time(a.effectiveAt)).at(-1);
          const quantity=decimal(prior?.quantity ?? ZERO),amount=rounded(quantity*positive(a.cashPerShare!),SCALE).value;
          ensure(!state.entitlements.some(e=>e.book===book && e.instrumentId===a.instrumentId && e.fraction!==null),'dividend_quantity_uncertain');
          state.entitlements.push({actionId:a.id,book,instrumentId:a.instrumentId,quantity:format(quantity),amount:format(amount),paymentAt:a.paymentAt,paid:false,fraction:null});
          posting(state,entries,book,'receivables',amount); posting(state,entries,book,'income',amount);
        }
      }
      if(a.kind==='split') state.financialTimes.push({instrumentId:a.instrumentId,at:a.effectiveAt,kind:'split'});
      break;
    }
    case 'dividend_payment': {
      const action=state.actions.find(a=>a.id===command.actionId && a.kind==='dividend'); ensure(action,'missing_dividend');
      ensure(!state.blocked[action.instrumentId],'instrument_blocked');
      const entitlements=state.entitlements.filter(e=>e.actionId===action.id && e.fraction===null); ensure(entitlements.length>0,'missing_entitlement');
      ensure(action.paymentAt && time(at)>=time(action.paymentAt),'payment_not_due');
      if(entitlements.some(e=>!e.paid)) state.payments.push({actionId:action.id,effectiveAt:action.paymentAt});
      for (const e of entitlements) if(!e.paid) {
        const amount=nonnegative(e.amount); posting(state,entries,e.book,'receivables',-amount); posting(state,entries,e.book,'cash',amount); e.paid=true;
        if(e.book==='benchmark' && amount>0n) {
          const eligible=nextSession(c,action.paymentAt!,false)?.date ?? null;
          state.benchmarkFunding.push({amount:e.amount,session:eligible,used:false});
          state.benchmarkNextOpen=state.benchmarkFunding.filter(x=>!x.used && x.session!==null).map(x=>x.session!).sort()[0] ?? null;
        }
      }
      break;
    }
    case 'benchmark_open': {
      running(c,state,at); ensure(state.benchmarkNextOpen===command.session,'benchmark_not_due');
      ensure(!state.blocked[c.benchmark.instrument.id] && !state.entitlements.some(e=>e.book==='benchmark' && e.fraction!==null),'benchmark_blocked');
      const o=opening(c,state.observations,c.benchmark.instrument.id,command.session,at);
      if(!o || state.observations.some(x=>x.correctionOf===o.id)) { outcome.status='data_blocked'; outcome.reason='benchmark_opening_unavailable'; break; }
      ensure(!state.actions.some(a=>a.instrumentId===c.benchmark.instrument.id && time(a.effectiveAt)>time(o.marketAt)) && !state.financialTimes.some(f=>f.instrumentId===c.benchmark.instrument.id && time(f.at)>time(o.marketAt)),'out_of_order_benchmark_fill');
      const futureFunding=state.benchmarkFunding.filter(x=>!x.used && x.session!==command.session).reduce((sum,x)=>add(sum,decimal(x.amount)),0n);
      const cash=checked(decimal(state.benchmark.cash)-futureFunding),price=positive(o.value); ensure(cash>=0n,'benchmark_funding_inconsistent'); let quantity=checked(cash*SCALE/price);
      while(quantity>0n && rounded(quantity*price,SCALE).value>cash) quantity--;
      if(quantity>0n && rounded(quantity*price,SCALE).value>0n) outcome.fills.push(trade(state,c,entries,'benchmark',c.benchmark.instrument.id,'BUY',quantity,o,null));
      for(const funding of state.benchmarkFunding) if(funding.session===command.session) funding.used=true;
      state.benchmarkExecutions.push({session:command.session,effectiveAt:o.marketAt});
      state.benchmarkNextOpen=state.benchmarkFunding.filter(x=>!x.used && x.session!==null).map(x=>x.session!).sort()[0] ?? null; break;
    }
    case 'value': {
      const s=session(c.calendar,command.session); ensure(time(command.asOf)===time(c.startsAt) || (s.status==='open' && time(command.asOf)===time(s.close)),'invalid_valuation_time');
      ensure(time(command.asOf)<=time(at) && time(command.asOf)>=time(c.startsAt) && time(command.asOf)<=time(c.endsAt),'valuation_time_order');
      ensure(time(command.asOf)>=time(state.economicAsOf),'historical_book_unavailable');
      const history=latestValuations(state); ensure(!history.length || time(command.asOf)>time(history.at(-1)!.snapshot.asOf),'valuation_order');
      const record=valuePortfolio(c,state,command.session,command.asOf,at,String(history.length+1));
      state.valuations.push(record); if(record.snapshot.equity!==null) state.lastGood=record.snapshot; outcome.valuation=record.snapshot; break;
    }
    case 'revise_valuations': {
      const correction=state.observations.find(o=>o.id===command.correctionId && o.correctionOf); ensure(correction,'missing_correction');
      const history=latestValuations(state);
      for(const old of history.filter(v=>time(v.snapshot.asOf)>=time(correction.marketAt))) {
        const snapshotState=historicalState(c,state,old);
        const record=valuePortfolio(c,snapshotState,old.snapshot.session,old.snapshot.asOf,at,old.snapshot.sequence,old.snapshot);
        state.valuations.push(record); outcome.valuation=record.snapshot;
      }
      state.lastGood=latestValuations(state).filter(v=>v.snapshot.equity!==null).at(-1)?.snapshot ?? null; break;
    }
  }
  if (entries.length) {
    const effectiveAt=outcome.fills[0]?.effectiveAt ?? (command.type==='action' ? command.action.effectiveAt : command.type==='dividend_payment' ? state.actions.find(a=>a.id===command.actionId)!.paymentAt! : at);
    state.accountingHistory.push({effectiveAt,entries:structuredClone(entries),settledOrders:outcome.fills.flatMap(f=>f.orderId?[f.orderId]:[])});
    if(time(effectiveAt)>time(state.economicAsOf)) state.economicAsOf=effectiveAt;
  }
  // A first-time historical mark cannot reuse present reservations or present uncertainty.
  // Existing historical records have their own saved orders and dated block reconstruction.
  if(!entries.length && (canonical(state.orders)!==canonical(input.orders) || canonical(state.blocked)!==canonical(input.blocked)) && time(at)>time(state.economicAsOf)) state.economicAsOf=at;
  if(command.type==='action' || command.type==='dividend_payment' || entries.length || (command.type==='benchmark_open' && outcome.status==='accepted')) {
    if(command.type==='action' && outcome.status==='blocked') state.blockEvents.push({instrumentId:command.action.instrumentId,reason:outcome.reason!,effectiveAt:command.action.effectiveAt});
    const effectiveAt=command.type==='action' ? command.action.effectiveAt : command.type==='dividend_payment' ? state.actions.find(a=>a.id===command.actionId)!.paymentAt! : outcome.fills[0]?.effectiveAt ?? (command.type==='benchmark_open'?session(c.calendar,command.session).open:at);
    for(const old of latestValuations(state).filter(v=>time(v.snapshot.asOf)>=time(effectiveAt))) {
      const historical=historicalState(c,state,old);
      const revision=valuePortfolio(c,historical,old.snapshot.session,old.snapshot.asOf,at,old.snapshot.sequence,old.snapshot);
      state.valuations.push(revision); outcome.valuation=revision.snapshot;
    }
    state.lastGood=latestValuations(state).filter(v=>v.snapshot.equity!==null).at(-1)?.snapshot ?? null;
  }
  assertBook(state.portfolio); assertBook(state.benchmark); assertBalanced(entries);
  ensure(decimal(state.portfolio.reservedCash)===Object.values(state.orders).filter(o=>o.status==='pending').reduce((a,o)=>add(a,decimal(o.reservedCash)),0n),'reservation_checkpoint_mismatch');
  for(const [key,p] of Object.entries(state.portfolio.positions)) ensure(decimal(p.reserved)===Object.values(state.orders).filter(o=>o.status==='pending' && o.instrumentId===key).reduce((a,o)=>add(a,decimal(o.reservedShares)),0n),'share_checkpoint_mismatch');
  canonical(state);
  return {state,entries,outcome};
}
