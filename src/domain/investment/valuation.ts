import { add, checked, decimal, format, multiply, ratio } from './arithmetic.js';
import { emptyBook, position } from './accounting.js';
import { hash, identity, time } from './identity.js';
import { instrument, mark, nextSession, session as sessionFor } from './policy.js';
import type { Book, Configuration, State, Valuation, ValuationRecord } from './types.js';
export function bookValue(c: Configuration, state: State, book: Book, bookId: 'portfolio' | 'benchmark', asOf: string, at: string, exactSession?: string) {
  let value = 0n, basis = 0n; const reasons: string[] = [], observationIds: string[] = [];
  const holdings: Valuation['holdings'] = [];
  for (const [instrumentId,p] of Object.entries(book.positions).sort(([a],[b]) => a.localeCompare(b))) {
    const q = decimal(p.quantity); if (!q) continue;
    const i = instrument(c,instrumentId); let m = mark(c,state.observations,instrumentId,asOf,at,exactSession);
    if (m && exactSession && time(asOf)===time(sessionFor(c.calendar,exactSession).close) && m.field!=='regular_close') m=null;
    let missing = state.blocked[instrumentId] ?? (m ? null : 'missing_or_stale_mark');
    if (state.entitlements.some(e => e.book === bookId && e.instrumentId === instrumentId && e.fraction !== null)) missing = 'unresolved_fraction';
    const splitAfter = state.financialTimes.some(f => f.instrumentId === instrumentId && f.kind === 'split' && m && time(f.at) > time(m.marketAt) && time(f.at) <= time(asOf));
    if (splitAfter) missing = 'mark_predates_split';
    const v = missing || !m ? null : multiply(q,decimal(m.value));
    if (missing) reasons.push(`${instrumentId}:${missing}`); if (v !== null) value = add(value,v);
    basis = add(basis,decimal(p.basis)); if (m) observationIds.push(m.id);
    const symbol = state.symbols[instrumentId]?.filter(s => time(s.effectiveAt) <= time(asOf)).at(-1)?.symbol ?? i.symbol;
    holdings.push({instrumentId,symbol,quantity:p.quantity,basis:p.basis,averageCost:format(ratio(decimal(p.basis),q)),value:v === null ? null : format(v),markId:m?.id ?? null});
  }
  // An entitlement can remain when representable quantity is zero.
  if (state.entitlements.some(e => e.book === bookId && e.fraction !== null)) reasons.push('unresolved_fractional_entitlement');
  const equity = reasons.length ? null : checked(decimal(book.cash) + value + decimal(book.receivables) - decimal(book.liabilities));
  return {equity,value:reasons.length ? null : value,unrealized:reasons.length ? null : checked(value-basis),holdings,reasons,observationIds};
}
export function concentration(c: Configuration, state: State, asOf: string, at: string, exactSession?: string, excludeOrder?: string, proposed?: {instrumentId:string;notional:bigint;equityLoss?:bigint}): { reasons: string[]; equity: bigint | null } {
  const value = bookValue(c,state,state.portfolio,'portfolio',asOf,at,exactSession), reasons = [...value.reasons];
  if (value.equity === null || value.equity <= 0n) return {reasons:[...reasons,'equity_unavailable'],equity:value.equity};
  value.equity=checked(value.equity-(proposed?.equityLoss ?? 0n));
  if(value.equity<=0n) return {reasons:['equity_unavailable'],equity:value.equity};
  const exposure = new Map<string,bigint>();
  for (const h of value.holdings) exposure.set(h.instrumentId,decimal(h.value!));
  for (const o of Object.values(state.orders)) if (o.status === 'pending' && o.side === 'BUY' && o.id !== excludeOrder) exposure.set(o.instrumentId,add(exposure.get(o.instrumentId) ?? 0n,decimal(o.reservedCash)));
  if (proposed) exposure.set(proposed.instrumentId,add(exposure.get(proposed.instrumentId) ?? 0n,proposed.notional));
  const sectors = new Map<string,bigint>();
  for (const [key,n] of exposure) {
    const sector = instrument(c,key).sector;
    if (!sector) reasons.push(`${key}:unknown_sector`);
    else sectors.set(sector,add(sectors.get(sector) ?? 0n,n));
    if (n * 10_000n > value.equity * BigInt(c.positionLimitBps)) reasons.push(`${key}:position_limit`);
  }
  for (const [sector,n] of sectors) if (n * 10_000n > value.equity * BigInt(c.sectorLimitBps)) reasons.push(`${sector}:sector_limit`);
  const peak = latestValuations(state).filter(v=>time(v.snapshot.asOf)<=time(asOf)).reduce((p,v) => v.snapshot.equity === null ? p : (decimal(v.snapshot.equity) > p ? decimal(v.snapshot.equity) : p),decimal(c.initialCapital));
  if ((peak-value.equity) * 10_000n >= peak * BigInt(c.drawdownAttentionBps)) reasons.push('drawdown_attention');
  return {reasons:[...new Set(reasons)],equity:value.equity};
}
export function latestValuations(state: State): ValuationRecord[] {
  const byId = new Map<string,ValuationRecord>();
  for (const v of state.valuations) byId.set(v.snapshot.id,v);
  return [...byId.values()].sort((a,b) => time(a.snapshot.asOf)-time(b.snapshot.asOf));
}
export function valuePortfolio(c: Configuration, state: State, session: string, asOf: string, at: string, sequence: string, prior: Valuation | null = null): ValuationRecord {
  const isInitial = time(asOf) === time(c.startsAt), exactSession = isInitial ? undefined : session;
  const p = bookValue(c,state,state.portfolio,'portfolio',asOf,at,exactSession), b = bookValue(c,state,state.benchmark,'benchmark',asOf,at,exactSession);
  if (!isInitial && state.benchmarkNextOpen && time(sessionFor(c.calendar,state.benchmarkNextOpen).open)<=time(asOf)) { b.equity=null; b.reasons.push('benchmark_opening_pending'); }
  if (!isInitial && !state.benchmarkExecutions.some(f => time(f.effectiveAt) <= time(asOf))) { b.equity = null; b.reasons.push('benchmark_initial_open_unavailable'); }
  const capital = decimal(c.initialCapital), ret = p.equity === null ? null : ratio(p.equity-capital,capital), benchmarkReturn = b.equity === null ? null : ratio(b.equity-capital,capital);
  const previous = latestValuations(state).filter(v => time(v.snapshot.asOf) < time(asOf));
  const eligibleSessions = c.calendar.sessions.filter(s => s.status === 'open' && time(s.close) < time(asOf) && time(s.close) >= time(c.startsAt));
  const expectedPrevious = eligibleSessions.at(-1)?.close ?? c.startsAt;
  const comparable = previous.findLast(v => time(v.snapshot.asOf) === time(expectedPrevious))?.snapshot;
  const dailyReturn = p.equity !== null && comparable?.equity !== null && comparable?.equity !== undefined && decimal(comparable.equity) > 0n ? format(ratio(p.equity-decimal(comparable.equity),decimal(comparable.equity))) : null;
  let peak = capital, maxDrawdown = 0n;
  for (const v of previous) { const e = v.snapshot.equity; if (e === null) continue; if (decimal(e) > peak) peak = decimal(e); const dd = ratio(decimal(e)-peak,peak); if (dd < maxDrawdown) maxDrawdown = dd; }
  if (p.equity !== null && p.equity > peak) peak = p.equity;
  const drawdown = p.equity === null ? null : ratio(p.equity-peak,peak); if (drawdown !== null && drawdown < maxDrawdown) maxDrawdown = drawdown;
  const snapshot: Valuation = {
    id:prior?.id ?? identity('valuation',c.runId,session,asOf),sequence,revision:(prior?.revision ?? 0)+1,
    supersedes:prior ? `${prior.id}:${prior.revision}` : null,session,asOf,recordedAt:at,
    // Existing journal anchor plus exact financial history checkpoint avoids a self-referential hash.
    journalVersion:state.version,journalHash:state.hash!,ledgerVersion:String(state.accountingHistory.length),ledgerHash:hash(state.accountingHistory),configurationHash:state.configurationHash,
    observationIds:[...new Set([...p.observationIds,...b.observationIds])],
    cash:state.portfolio.cash,reservedCash:state.portfolio.reservedCash,availableCash:format(decimal(state.portfolio.cash)-decimal(state.portfolio.reservedCash)),
    holdingsValue:p.value === null ? null : format(p.value),receivables:state.portfolio.receivables,liabilities:state.portfolio.liabilities,
    equity:p.equity === null ? null : format(p.equity),realized:state.portfolio.realized,unrealized:p.unrealized === null ? null : format(p.unrealized),
    totalReturn:ret === null ? null : format(ret),dailyReturn,peak:p.equity === null ? null : format(peak),drawdown:drawdown === null ? null : format(drawdown),maxDrawdown:p.equity === null ? null : format(maxDrawdown),
    benchmarkEquity:b.equity === null ? null : format(b.equity),benchmarkReturn:benchmarkReturn === null ? null : format(benchmarkReturn),
    excessPercentagePoints:ret === null || benchmarkReturn === null ? null : format(checked((ret-benchmarkReturn)*100n)),
    quality:p.reasons.length || b.reasons.length ? (Object.keys(state.blocked).length ? 'blocked' : 'partial') : 'complete',
    reasons:[...new Set([...p.reasons,...b.reasons])],observedBreaches:concentration(c,state,asOf,at,exactSession).reasons,holdings:p.holdings,
  };
  return {snapshot,portfolio:structuredClone(state.portfolio),benchmark:structuredClone(state.benchmark),entitlements:structuredClone(state.entitlements),blocked:{...state.blocked},symbols:structuredClone(state.symbols),orders:structuredClone(state.orders)};
}

/** Rebuild economic state at the original mark instant using every accepted effective-time posting.
 * Later-known dividends append revised snapshots; original books/snapshots remain evidence. */
export function historicalState(c: Configuration, state: State, old: ValuationRecord): State {
  const result = {...state,portfolio:emptyBook(),benchmark:emptyBook(),orders:structuredClone(old.orders)};
  const asOf = time(old.snapshot.asOf);
  for (const event of state.accountingHistory.filter(e=>time(e.effectiveAt)<=asOf)) for (const entry of event.entries) {
    const book=result[entry.book],amount=decimal(entry.amount);
    if(entry.account==='basis' || entry.account==='quantity') { const p=position(book,entry.instrumentId!);p[entry.account]=format(add(decimal(p[entry.account]),amount)); }
    else if(entry.account!=='capital') book[entry.account]=format(add(decimal(book[entry.account]),amount));
  }
  for(const event of state.accountingHistory.filter(e=>time(e.effectiveAt)<=asOf)) for(const orderId of event.settledOrders) {
    const order=result.orders[orderId];if(order) {order.status='filled';order.reservedCash='0.000000';order.reservedShares='0.000000';}
  }
  for(const order of Object.values(result.orders).filter(o=>o.status==='pending')) {
    result.portfolio.reservedCash=format(add(decimal(result.portfolio.reservedCash),decimal(order.reservedCash)));
    const p=position(result.portfolio,order.instrumentId);p.reserved=format(add(decimal(p.reserved),decimal(order.reservedShares)));
  }
  result.entitlements=state.entitlements.filter(e=>{const a=state.actions.find(a=>a.id===e.actionId);return a && time(a.effectiveAt)<=asOf;}).map(e=>({...e,paid:state.payments.some(p=>p.actionId===e.actionId && time(p.effectiveAt)<=asOf)}));
  result.blocked=Object.fromEntries(state.blockEvents.filter(e=>time(e.effectiveAt)<=asOf).map(e=>[e.instrumentId,e.reason]));
  const first=nextSession(c,c.startsAt)!;
  const funding=[{at:c.startsAt,session:first.date},...result.entitlements.filter(e=>e.book==='benchmark' && e.paid && decimal(e.amount)>0n).map(e=>({at:e.paymentAt!,session:c.calendar.sessions.find(s=>s.status==='open' && time(s.open)>time(e.paymentAt!))?.date ?? null}))];
  result.benchmarkNextOpen=funding.filter(f=>f.session && time(sessionFor(c.calendar,f.session).open)<=asOf && !state.benchmarkExecutions.some(t=>t.session===f.session && time(t.effectiveAt)<=asOf)).map(f=>f.session!).sort()[0] ?? null;
  return result;
}
