/** Pure, disposable conformance oracle. No production ledger, receiver or persistence. */
import type { Event, EventBatch, PublisherScope, RecordRef, RunConfiguration, PortfolioSnapshot, LedgerTransaction, MarketObservation, PaperOrder, ContentType } from '../../contracts/investment/v1/types.js';
import { canonicalHash, checkPublicStrings, divideEven, fixed, parseJson, product, requireContract as need, sha256, validate } from './schema.js';

export interface StagedContent { sha256: string; contentType: ContentType; sizeBytes: number }
export interface PublicationContext {
  experimentId: string; runId: string; now: string; scope: PublisherScope;
  history: readonly Event[]; content: ReadonlyMap<string, StagedContent>;
  receipts: ReadonlyMap<string, string>;
}
export interface BatchCheck { batch: EventBatch; acceptedIds: string[]; duplicateIds: string[]; replay: boolean }
export function recordKeys(event: Event): string[] {
  const keys = [`event:${event.eventId}:1`];
  switch (event.type) {
    case 'discussion.opened': keys.push(`discussion:${event.payload.discussionId}:1`); break;
    case 'discussion.contribution': keys.push(`contribution:${event.payload.contributionId}:1`); break;
    case 'artifact.registered': keys.push(`artifact:${event.payload.artifactId}:0`); break;
    case 'artifact.published': keys.push(`artifact:${event.payload.artifactId}:${event.payload.version}`); break;
    case 'decision.published': keys.push(`decision:${event.payload.proposal.decisionId}:${event.payload.proposal.revision}`, `review:${event.payload.review.reviewId}:1`); break;
    case 'paper.order': keys.push(`order:${event.payload.orderId}:${event.payload.revision}`); break;
    case 'paper.ledger_transaction': keys.push(`transaction:${event.payload.transactionId}:1`); break;
    case 'portfolio.snapshot': keys.push(`valuation:${event.payload.valuationId}:${event.payload.revision}`); break;
    case 'market.action': keys.push(`corporate_action:${event.payload.actionId}:1`); break;
    case 'instrument.updated': keys.push(`instrument:${event.payload.instrument.instrumentId}:${event.payload.version}`); break;
    case 'review.published': keys.push(`review:${event.payload.reviewId}:1`); break;
  }
  return keys;
}
const key = (r: RecordRef): string => `${r.kind}:${r.id}:${r.version}`;
export function publicRecords(events: readonly Event[]): Map<string, Event> {
  return new Map(events.flatMap(e => recordKeys(e).map(k => [k, e] as const)));
}
function reference(r: RecordRef, records: ReadonlyMap<string, Event>): Event {
  const event = records.get(key(r)); need(event, 'DEPENDENCY_NOT_READY'); return event;
}
function byId(records: ReadonlyMap<string, Event>, kind: RecordRef['kind'], id: string, version = 1): Event {
  return reference({ kind, id, version, relation: 'supports' }, records);
}
function refsIn(value: unknown, records: ReadonlyMap<string, Event>): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach(v => refsIn(v, records)); return; }
  const v = value as Record<string, unknown>;
  if ('relation' in v && 'version' in v && 'kind' in v && 'id' in v) { reference(v as unknown as RecordRef, records); return; }
  Object.values(v).forEach(v => refsIn(v, records));
}
function observation(m: MarketObservation, c: RunConfiguration, session?: string, instrumentId?: string): void {
  need(c.universe.some(x => x.instrumentId === m.instrumentId) || c.benchmarkInstrument.instrumentId === m.instrumentId, 'CONFLICT');
  const instrument = [...c.universe, c.benchmarkInstrument].find(x => x.instrumentId === m.instrumentId)!;
  need(m.provider === c.marketProvider && m.feed === c.feed && m.calendarVersion === c.calendarVersion && m.venue === instrument.venue, 'CONFLICT');
  need(fixed(m.value) > 0n && (!session || m.session === session) && (!instrumentId || m.instrumentId === instrumentId));
  need(Date.parse(m.marketAt) <= Date.parse(m.retrievedAt) && (!m.availableAt || (Date.parse(m.marketAt) <= Date.parse(m.availableAt) && Date.parse(m.availableAt) <= Date.parse(m.retrievedAt))));
}
interface LedgerState { cash: bigint; capital: bigint; receivable: bigint; liability: bigint; realized: bigint; quantity: Map<string, bigint>; basis: Map<string, bigint> }
function ledgerState(events: readonly Event[], sequence?: bigint): LedgerState {
  const s: LedgerState = { cash: 0n, capital: 0n, receivable: 0n, liability: 0n, realized: 0n, quantity: new Map(), basis: new Map() };
  for (const e of events) if (e.type === 'paper.ledger_transaction' && (!sequence || BigInt(e.payload.journalSequence) <= sequence)) {
    for (const entry of e.payload.entries) {
      const v = fixed(entry.amount), id = entry.instrumentId;
      if (entry.account === 'quantity' || entry.account === 'book_cost') {
        need(id); const map = entry.account === 'quantity' ? s.quantity : s.basis; map.set(id, (map.get(id) ?? 0n) + v);
      } else if (entry.account === 'cash') s.cash += v;
      else if (entry.account === 'capital') s.capital += v;
      else if (entry.account === 'receivable') s.receivable += v;
      else if (entry.account === 'liability') s.liability += v;
      else if (entry.account === 'realized_pnl') s.realized += v;
    }
  }
  need(s.cash >= 0n && s.receivable >= 0n && s.liability >= 0n && [...s.quantity.values(), ...s.basis.values()].every(x => x >= 0n));
  return s;
}
function checkLedger(t: LedgerTransaction, events: readonly Event[], records: ReadonlyMap<string, Event>, c: RunConfiguration): void {
  const journals = events.filter(e => e.type === 'paper.ledger_transaction').map(e => e.payload);
  const last = journals.at(-1), seq = BigInt(t.journalSequence);
  need(seq === BigInt(last?.journalSequence ?? '0') + 1n, 'SEQUENCE_GAP');
  need(t.previousHash === (last?.journalHash ?? null) && t.previousLedgerVersion === (last?.ledgerVersion ?? null) && BigInt(t.ledgerVersion) === seq, 'CONFLICT');
  const { journalHash, ...unsigned } = t; need(journalHash === canonicalHash(unsigned), 'CONFLICT');
  need(t.configurationHash === canonicalHash(c) && Date.parse(t.effectiveAt) <= Date.parse(t.recordedAt), 'CONFLICT');
  need(!journals.some(j => j.sourceOperationId === t.sourceOperationId), 'CONFLICT');
  const unique = t.entries.map(e => `${e.account}:${e.instrumentId ?? ''}`); need(new Set(unique).size === unique.length);
  for (const entry of t.entries) {
    if (['quantity','book_cost'].includes(entry.account)) need(entry.instrumentId && c.universe.some(i => i.instrumentId === entry.instrumentId));
    if (['cash','capital','liability','receivable','realized_pnl','fee','income'].includes(entry.account)) need(entry.instrumentId === null);
  }
  const amount = (account: string, id: string | null = null): bigint => fixed(t.entries.find(e => e.account === account && e.instrumentId === id)?.amount ?? '0');
  const before = ledgerState(events);
  if (t.effect === 'initialization') {
    need(seq === 1n && t.fill === null && t.corporateAction === null && t.correctionOf === null && t.entries.length === 2);
    need(amount('cash') === fixed(c.initialCapital) && amount('capital') === fixed(c.initialCapital));
  } else {
    need(seq > 1n && amount('capital') === 0n);
    if (t.effect === 'fill') {
      const f = t.fill; need(f && !t.corporateAction && !t.correctionOf);
      const order = byId(records, 'order', f.orderId, f.orderRevision); need(order.type === 'paper.order');
      const o = order.payload;
      need(events.filter(e => e.type === 'paper.order' && e.payload.orderId === f.orderId).at(-1)?.eventId === order.eventId, 'CONFLICT');
      need(o.status === 'pending' && o.decisionId === f.decisionId && o.decisionRevision === f.decisionRevision && o.instrumentId === f.instrumentId && o.side === f.side && o.quantity === f.quantity, 'CONFLICT');
      need(!journals.some(j => j.fill?.orderId === f.orderId), 'CONFLICT');
      const decision = byId(records, 'decision', f.decisionId, f.decisionRevision); need(decision.type === 'decision.published');
      need(Date.parse(decision.payload.proposal.committedAt) <= Date.parse(o.deadline) && Date.parse(o.deadline) < Date.parse(f.observation.marketAt) && Date.parse(t.recordedAt) <= Date.parse(o.expiresAt));
      need(Date.parse(f.observation.marketAt) - Date.parse(o.deadline) >= c.cutoffMinutes * 60000);
      observation(f.observation, c, o.targetSession, f.instrumentId);
      need(f.observation.field === 'regular_open' && Date.parse(f.observation.retrievedAt) <= Date.parse(t.recordedAt) && Date.parse(t.effectiveAt) === Date.parse(f.observation.marketAt));
      const multiplier = 10000n + (f.side === 'BUY' ? 1n : -1n) * BigInt(c.slippageBps);
      const expectedPrice = divideEven(fixed(f.observation.value) * multiplier, 10000n);
      need(fixed(f.price) === expectedPrice && fixed(f.fee) === fixed(c.commission));
      need(BigInt(f.priceRoundingResidual.numerator) * 10000n === (expectedPrice * 10000n - fixed(f.observation.value) * multiplier) * BigInt(f.priceRoundingResidual.denominator));
      need(f.side === 'BUY' ? fixed(f.price) <= fixed(o.priceGuard) : fixed(f.price) >= fixed(o.priceGuard));
      const qty = fixed(f.quantity), notional = product(f.quantity, f.price), fee = fixed(f.fee);
      const basis = before.basis.get(f.instrumentId) ?? 0n, held = before.quantity.get(f.instrumentId) ?? 0n;
      const expectedBasis = f.side === 'BUY' ? 0n : qty === held ? basis : divideEven(basis * qty, held);
      need(fixed(f.releasedBasis) === expectedBasis && fixed(f.roundingAdjustment) === 0n);
      const basisResidualNumerator = f.side === 'BUY' ? 0n : expectedBasis * held - basis * qty;
      const basisResidualDenominator = f.side === 'BUY' ? 1n : held;
      need(BigInt(f.basisRoundingResidual.numerator) * basisResidualDenominator === basisResidualNumerator * BigInt(f.basisRoundingResidual.denominator));
      need(amount('quantity', f.instrumentId) === (f.side === 'BUY' ? qty : -qty));
      need(amount('cash') === (f.side === 'BUY' ? -notional - fee : notional - fee));
      need(amount('book_cost', f.instrumentId) === (f.side === 'BUY' ? notional + fee : -expectedBasis));
      need(amount('realized_pnl') === (f.side === 'BUY' ? 0n : notional - fee - expectedBasis) && amount('fee') === fee);
      need(t.entries.every(e => ['cash','quantity','book_cost','realized_pnl','fee'].includes(e.account)));
      need(t.entries.every(e => e.instrumentId === null || e.instrumentId === f.instrumentId), 'CONFLICT');
    } else {
      need(t.fill === null);
      if (t.effect === 'correction') { need(t.correctionOf && !t.corporateAction); reference(t.correctionOf, records); }
      else {
        const action = t.corporateAction; need(action && action.kind === t.effect && !t.correctionOf);
        need(c.universe.some(i => i.instrumentId === action.instrumentId));
        need(!journals.some(j => j.corporateAction?.providerActionId === action.providerActionId && j.effect === t.effect), 'CONFLICT');
        if (t.effect === 'split') {
          need(action.numerator && action.denominator && BigInt(action.denominator) > 0n);
          const held = before.quantity.get(action.instrumentId) ?? 0n;
          const raw = held * BigInt(action.numerator), denominator = BigInt(action.denominator);
          const after = raw / denominator;
          need(amount('quantity', action.instrumentId) === after - held && t.entries.length === 1 && t.entries.every(e => e.account === 'quantity' && e.instrumentId === action.instrumentId));
          // An unrepresentable fractional entitlement is never silently rounded away.
          const residual = raw % denominator;
          if (residual === 0n) need(action.fractionalEntitlement === null);
          else need(action.fractionalEntitlement && BigInt(action.fractionalEntitlement.numerator) * denominator * 1000000n === residual * BigInt(action.fractionalEntitlement.denominator));
        } else {
          need(action.exDate && action.cashPerShare && action.entitledQuantity);
          const dividend = product(action.cashPerShare, action.entitledQuantity);
          need(dividend > 0n);
          if (t.effect === 'dividend_accrual') need(amount('receivable') === dividend && amount('income') === dividend && t.entries.every(e => ['receivable','income'].includes(e.account)));
          else {
            const accrual = journals.find(j => j.effect === 'dividend_accrual' && j.corporateAction?.providerActionId === action.providerActionId);
            need(action.paymentDate && accrual?.corporateAction && t.effectiveAt.slice(0,10) === action.paymentDate);
            for (const field of ['instrumentId','providerActionId','sourceVersion','exDate','paymentDate','cashPerShare','entitledQuantity'] as const) need(action[field] === accrual.corporateAction[field], 'CONFLICT');
            need(fixed(accrual.entries.find(e => e.account === 'receivable')?.amount ?? '0') === dividend, 'CONFLICT');
            need(amount('receivable') === -dividend && amount('cash') === dividend && t.entries.every(e => ['receivable','cash'].includes(e.account)));
          }
        }
      }
    }
  }
}
function checkSnapshot(s: PortfolioSnapshot, events: readonly Event[], c: RunConfiguration): void {
  const journal = events.find(e => e.type === 'paper.ledger_transaction' && e.payload.journalSequence === s.journalSequence);
  need(journal?.type === 'paper.ledger_transaction', 'DEPENDENCY_NOT_READY');
  need(journal.payload.journalHash === s.journalHash && s.configurationHash === canonicalHash(c), 'CONFLICT');
  const ledger = ledgerState(events, BigInt(s.journalSequence));
  need(fixed(s.cash) === ledger.cash && fixed(s.receivables) === ledger.receivable && fixed(s.liabilities) === ledger.liability && fixed(s.realizedPnl) === ledger.realized);
  need(new Set(s.holdings.map(h => h.instrumentId)).size === s.holdings.length);
  const heldIds = [...ledger.quantity].filter(([,q]) => q > 0n).map(([id]) => id).sort();
  need(JSON.stringify(heldIds) === JSON.stringify(s.holdings.map(h => h.instrumentId).sort()));
  let values = 0n, unrealized = 0n;
  for (const h of s.holdings) {
    need(fixed(h.quantity) === ledger.quantity.get(h.instrumentId) && fixed(h.bookCost) === ledger.basis.get(h.instrumentId));
    const updated = events.filter(e => e.type === 'instrument.updated' && e.payload.instrument.instrumentId === h.instrumentId && Date.parse(e.payload.effectiveAt) <= Date.parse(s.valuationAsOf)).sort((a,b) => a.type === 'instrument.updated' && b.type === 'instrument.updated' ? Date.parse(a.payload.effectiveAt) - Date.parse(b.payload.effectiveAt) || a.payload.version-b.payload.version : 0).at(-1);
    const instrument = updated?.type === 'instrument.updated' ? updated.payload.instrument : c.universe.find(i => i.instrumentId === h.instrumentId);
    need(instrument && h.sector === instrument.sector && h.symbol === instrument.symbol);
    if (!h.mark) { need(h.marketValue === null && h.unrealizedPnl === null && h.missingReason); continue; }
    observation(h.mark, c, s.session, h.instrumentId); need(h.mark.field === 'regular_close' && Date.parse(h.mark.marketAt) <= Date.parse(s.valuationAsOf));
    need(h.marketValue !== null && fixed(h.marketValue) === product(h.quantity, h.mark.value));
    need(h.unrealizedPnl !== null && fixed(h.unrealizedPnl) === fixed(h.marketValue) - fixed(h.bookCost) && h.missingReason === null);
    values += fixed(h.marketValue); unrealized += fixed(h.unrealizedPnl);
  }
  const b = s.benchmark; need(b.instrumentId === c.benchmarkInstrument.instrumentId && b.session === s.session && b.convention === c.benchmarkConvention);
  if (b.mark) {
    observation(b.mark, c, s.session, b.instrumentId); need(b.mark.field === 'regular_close' && Date.parse(b.mark.marketAt) <= Date.parse(s.valuationAsOf));
    need(b.equity !== null && fixed(b.equity) === product(b.units, b.mark.value) + fixed(b.cash) + fixed(b.receivables));
    need(b.totalReturn !== null && fixed(b.totalReturn) === divideEven(fixed(b.equity) * 1000000n, fixed(c.initialCapital)) - 1000000n && b.missingReason === null);
  } else need(b.equity === null && b.totalReturn === null && b.missingReason);
  if (s.quality === 'complete') {
    need(s.holdings.every(h => h.mark) && b.mark && s.equity !== null && s.unrealizedPnl !== null && s.totalReturn !== null && s.peakEquity !== null && s.drawdown !== null && s.maxDrawdown !== null && s.excessReturn !== null);
    const equity = ledger.cash + values + ledger.receivable - ledger.liability;
    need(fixed(s.equity) === equity && fixed(s.unrealizedPnl) === unrealized);
    need(fixed(s.totalReturn) === divideEven(equity * 1000000n, fixed(c.initialCapital)) - 1000000n);
    need(fixed(s.peakEquity) >= equity && fixed(s.peakEquity) > 0n && fixed(s.drawdown) === divideEven(equity * 1000000n, fixed(s.peakEquity)) - 1000000n);
    need(fixed(s.maxDrawdown) <= fixed(s.drawdown) && fixed(s.maxDrawdown) >= -1000000n);
    need(fixed(s.excessReturn) === fixed(s.totalReturn) - fixed(b.totalReturn!));
    if (s.previousComparableEquity === null) need(s.dailyReturn === null);
    else need(fixed(s.previousComparableEquity) > 0n && s.dailyReturn !== null && fixed(s.dailyReturn) === divideEven(equity * 1000000n, fixed(s.previousComparableEquity)) - 1000000n);
  } else need(s.equity === null && s.totalReturn === null && s.dailyReturn === null && s.drawdown === null && s.excessReturn === null && s.limitations.length > 0);
  const prior = events.filter(e => e.type === 'portfolio.snapshot').map(e => e.payload).filter(p => p.valuationId === s.valuationId);
  need(!events.some(e => e.type === 'portfolio.snapshot' && e.payload.valuationSequence === s.valuationSequence && e.payload.valuationId !== s.valuationId), 'CONFLICT');
  if (prior.length) { const previous = prior.at(-1)!; need(s.revision === previous.revision + 1 && s.valuationSequence === previous.valuationSequence && s.supersedes?.id === s.valuationId && s.supersedes.version === previous.revision, 'CONFLICT'); }
  else need(s.revision === 1 && s.supersedes === null);
}
const transitions: Record<PaperOrder['status'], readonly PaperOrder['status'][]> = { proposed: ['validated','rejected','cancelled'], validated: ['pending','rejected','expired','cancelled'], pending: ['filled','rejected','expired','cancelled'], filled: [], rejected: [], expired: [], cancelled: [] };
export function checkPublicationBatch(bytes: Uint8Array, idempotencyKey: string, ctx: PublicationContext): BatchCheck {
  const raw = parseJson(bytes); need(raw && typeof raw === 'object' && (raw as { schemaVersion?: string }).schemaVersion === '1.0', 'UNSUPPORTED_VERSION');
  const batch = validate<EventBatch>('EventBatch', raw), scope = validate<PublisherScope>('PublisherScope', ctx.scope);
  need(ctx.history.every(e => e.experimentId === ctx.experimentId && e.runId === ctx.runId), 'FORBIDDEN');
  need(scope.enabled && Date.parse(ctx.now) < Date.parse(scope.expiresAt), 'FORBIDDEN');
  need(scope.experimentId === ctx.experimentId && scope.runId === ctx.runId && batch.experimentId === ctx.experimentId && batch.runId === ctx.runId, 'FORBIDDEN');
  need(batch.batchId === idempotencyKey, 'CONFLICT');
  need(new Set(batch.events.map(e => e.eventId)).size === batch.events.length, 'CONFLICT');
  for (const event of batch.events) need(scope.eventTypes.includes(event.type) && event.publicationPolicyVersion === scope.publicationPolicyVersion && event.experimentId === batch.experimentId && event.runId === batch.runId, 'FORBIDDEN');
  const oldDigest = ctx.receipts.get(batch.batchId);
  if (oldDigest !== undefined) { need(oldDigest === sha256(bytes), 'CONFLICT'); return { batch, acceptedIds: [], duplicateIds: batch.events.map(e => e.eventId), replay: true }; }
  const events = [...ctx.history], records = publicRecords(events), acceptedIds: string[] = [], duplicateIds: string[] = [];
  for (const event of batch.events) {
    const existing = events.find(e => e.eventId === event.eventId);
    if (existing) { need(canonicalHash(existing) === canonicalHash(event), 'CONFLICT'); duplicateIds.push(event.eventId); continue; }
    need(!events.some(e => e.sourceSequence === event.sourceSequence), 'CONFLICT');
    need(Date.parse(event.occurredAt) <= Date.parse(event.recordedAt) && Date.parse(event.recordedAt) <= Date.parse(ctx.now));
    checkPublicStrings(event); refsIn(event, records);
    const runEvent = events.find(e => e.type === 'run.published');
    const c = runEvent?.type === 'run.published' ? runEvent.payload.configuration : undefined;
    if (event.type !== 'run.published') need(c && event.evidenceMode === runEvent?.evidenceMode, 'DEPENDENCY_NOT_READY');
    const roster = events.filter(e => e.type === 'team.published').at(-1);
    const workers = roster?.type === 'team.published' ? roster.payload.workers : [];
    const eligible = (id: string): void => { need(workers.some(w => w.workerId === id), 'FORBIDDEN'); };
    if (event.actor.kind === 'worker') eligible(event.actor.workerId);
    switch (event.type) {
      case 'run.published': {
        need(!runEvent && event.actor.kind === 'system', 'CONFLICT'); const p = event.payload, config = p.configuration;
        need(p.configurationHash === canonicalHash(config) && Date.parse(p.startsAt) < Date.parse(p.endsAt) && fixed(config.initialCapital) > 0n);
        need(config.positionLimitBps <= config.sectorLimitBps && config.cycleExecutionBudget <= config.dailyExecutionBudget && config.dailyExecutionBudget <= config.runExecutionBudget);
        need(config.publicationHeartbeatSeconds < config.publicationStaleSeconds && config.publicationPolicyVersion === scope.publicationPolicyVersion);
        need(new Set(config.universe.map(i => i.instrumentId)).size === config.universe.length);
        need(event.evidenceMode === 'synthetic_fixture' ? p.runKind === 'fixture' && config.configurationStatus === 'synthetic_only' && config.approvalRecordId === null : p.runKind !== 'fixture' && config.configurationStatus === 'owner_approved' && config.approvalRecordId !== null);
        break;
      }
      case 'team.published': need(event.actor.kind === 'system' && new Set(event.payload.workers.map(w => w.workerId)).size === event.payload.workers.length); break;
      case 'worker.activity': eligible(event.payload.workerId); need(event.actor.kind === 'system' || event.actor.kind === 'worker' && event.actor.workerId === event.payload.workerId); break;
      case 'discussion.opened': event.payload.participants.forEach(eligible); break;
      case 'discussion.contribution': {
        const p = event.payload, discussion = byId(records, 'discussion', p.discussionId); need(discussion.type === 'discussion.opened');
        need(event.actor.kind === 'worker' && discussion.payload.participants.includes(event.actor.workerId), 'FORBIDDEN');
        const previous = events.filter(e => e.type === 'discussion.contribution' && e.payload.discussionId === p.discussionId);
        need(BigInt(p.ordinal) === BigInt(previous.length + 1), 'DEPENDENCY_NOT_READY');
        if (p.replyTo) need(previous.some(e => e.type === 'discussion.contribution' && e.payload.contributionId === p.replyTo), 'DEPENDENCY_NOT_READY');
        break;
      }
      case 'discussion.closed': byId(records, 'discussion', event.payload.discussionId); need(event.payload.synthesis.kind === 'artifact'); break;
      case 'artifact.registered': need(canonicalHash(event.payload.author) === canonicalHash(event.actor), 'FORBIDDEN'); break;
      case 'artifact.published': {
        const p = event.payload, registration = byId(records, 'artifact', p.artifactId, 0);
        need(registration.type === 'artifact.registered' && canonicalHash(registration.payload.author) === canonicalHash(p.author), 'FORBIDDEN');
        need(Buffer.byteLength(JSON.stringify(p)) <= 16384, 'TOO_LARGE');
        need(canonicalHash(p.author) === canonicalHash(event.actor), 'FORBIDDEN');
        const content = ctx.content.get(p.sha256); need(content && content.sha256 === p.sha256 && content.sizeBytes === p.sizeBytes && content.contentType === p.contentType && scope.contentTypes.includes(p.contentType), 'DEPENDENCY_NOT_READY');
        need(p.sizeBytes <= (p.contentType === 'image/png' ? 4194304 : 131072) && Date.parse(p.createdAt) <= Date.parse(p.publishedAt) && Date.parse(p.publishedAt) <= Date.parse(event.recordedAt));
        if (p.version === 1) need(p.supersedes === null);
        else need(p.supersedes?.kind === 'artifact' && p.supersedes.id === p.artifactId && p.supersedes.version === p.version - 1);
        break;
      }
      case 'decision.published': {
        const p = event.payload, proposal = p.proposal; need(event.actor.kind === 'worker', 'FORBIDDEN'); eligible(p.review.reviewerId);
        need(p.review.reviewerId !== event.actor.workerId && p.proposalHash === canonicalHash(proposal) && p.review.proposalHash === p.proposalHash && p.review.proposalRevision === proposal.revision, 'CONFLICT');
        need(Date.parse(proposal.evidenceCutoff) <= Date.parse(proposal.committedAt) && Date.parse(proposal.committedAt) <= Date.parse(p.review.reviewedAt) && Date.parse(p.review.reviewedAt) <= Date.parse(event.recordedAt));
        if (proposal.action === 'HOLD') need(proposal.instrumentId === null && proposal.quantity === null && proposal.targetSession === null && proposal.priceGuard === null);
        else need(c!.universe.some(i => i.instrumentId === proposal.instrumentId) && proposal.quantity !== null && proposal.targetSession !== null && proposal.priceGuard !== null && fixed(proposal.priceGuard) > 0n);
        break;
      }
      case 'paper.order': {
        const p = event.payload, decision = byId(records, 'decision', p.decisionId, p.decisionRevision); need(decision.type === 'decision.published');
        const d = decision.payload.proposal;
        need(d.action !== 'HOLD' && d.action === p.side && d.instrumentId === p.instrumentId && d.quantity === p.quantity && d.targetSession === p.targetSession && d.priceGuard === p.priceGuard && decision.payload.proposalHash === p.proposalHash, 'CONFLICT');
        need(p.configurationHash === canonicalHash(c) && fixed(p.priceGuard) > 0n && Date.parse(d.committedAt) <= Date.parse(p.deadline) && Date.parse(p.deadline) < Date.parse(p.expiresAt));
        need(Date.parse(p.expiresAt) - Date.parse(p.deadline) <= (c!.maxOpeningWaitSeconds + c!.cutoffMinutes * 60) * 1000);
        need(p.status === 'rejected' || decision.payload.review.disposition === 'approve');
        const prior = events.filter(e => e.type === 'paper.order' && e.payload.orderId === p.orderId).at(-1);
        if (prior?.type === 'paper.order') need(p.revision === prior.payload.revision + 1 && p.previousEventId === prior.eventId && transitions[prior.payload.status].includes(p.status), 'CONFLICT');
        else need(p.revision === 1 && p.previousEventId === null && ['proposed','rejected'].includes(p.status));
        if (prior?.type === 'paper.order') for (const field of ['decisionId','decisionRevision','proposalHash','orderIndex','instrumentId','side','quantity','targetSession','deadline','expiresAt','priceGuard','configurationHash','expectedLedgerVersion'] as const) need(p[field] === prior.payload[field], 'CONFLICT');
        if (p.status === 'filled') need(events.some(e => e.type === 'paper.ledger_transaction' && e.payload.fill?.orderId === p.orderId && e.payload.fill.orderRevision === p.revision - 1), 'DEPENDENCY_NOT_READY');
        need(!events.some(e => e.type === 'paper.order' && e.payload.decisionId === p.decisionId && e.payload.decisionRevision === p.decisionRevision && e.payload.orderIndex === p.orderIndex && e.payload.orderId !== p.orderId), 'CONFLICT');
        if (['rejected','cancelled','expired','filled'].includes(p.status)) need(fixed(p.reservedCash) === 0n && fixed(p.reservedQuantity) === 0n);
        if (['rejected','cancelled','expired'].includes(p.status)) need(p.reason);
        break;
      }
      case 'paper.ledger_transaction': checkLedger(event.payload, events, records, c!); need(event.actor.kind === 'system'); break;
      case 'portfolio.snapshot': checkSnapshot(event.payload, events, c!); need(event.actor.kind === 'system'); break;
      case 'review.published': need(event.actor.kind === 'worker'); break;
      case 'content.corrected': need(key(event.payload.prior) !== key(event.payload.replacement)); break;
      case 'publication.notice': need(event.actor.kind !== 'worker'); break;
      case 'market.action': need(event.actor.kind === 'system' && c!.universe.some(i => i.instrumentId === event.payload.instrumentId)); break;
      case 'instrument.updated': {
        const p = event.payload, a = reference(p.action, records);
        need(event.actor.kind === 'system' && a.type === 'market.action' && a.payload.kind === 'ticker_change' && a.payload.instrumentId === p.instrument.instrumentId && a.payload.newSymbol === p.instrument.symbol && Date.parse(a.payload.effectiveAt) === Date.parse(p.effectiveAt), 'CONFLICT');
        const prior = events.filter(e => e.type === 'instrument.updated' && e.payload.instrument.instrumentId === p.instrument.instrumentId).at(-1);
        const previous = prior?.type === 'instrument.updated' ? prior.payload.instrument : c!.universe.find(i => i.instrumentId === p.instrument.instrumentId);
        need(previous && p.version === (prior?.type === 'instrument.updated' ? prior.payload.version + 1 : 1));
        for (const field of ['instrumentId','venue','currency','sector','classificationSource'] as const) need(p.instrument[field] === previous[field], 'CONFLICT');
        const date = p.effectiveAt.slice(0,10), expected = structuredClone(previous.symbolHistory), last = expected.at(-1)!;
        need(last.effectiveTo === null && last.effectiveFrom < date);
        last.effectiveTo = date;
        expected.push({symbol:p.instrument.symbol,effectiveFrom:date,effectiveTo:null});
        need(canonicalHash(expected) === canonicalHash(p.instrument.symbolHistory), 'CONFLICT');
        break;
      }
      case 'run.status': break;
    }
    for (const k of recordKeys(event)) need(!records.has(k), 'CONFLICT');
    events.push(event); ledgerState(events);
    for (const k of recordKeys(event)) records.set(k, event);
    acceptedIds.push(event.eventId);
  }
  return { batch, acceptedIds, duplicateIds, replay: false };
}
/** Latest means financial valuation order, not arrival order or timestamps. */
export function latestSnapshot(events: readonly Event[]): PortfolioSnapshot | null {
  return events.filter(e => e.type === 'portfolio.snapshot').map(e => e.payload).filter(s => s.quality === 'complete')
    .sort((a,b) => BigInt(a.valuationSequence) < BigInt(b.valuationSequence) ? -1 : BigInt(a.valuationSequence) > BigInt(b.valuationSequence) ? 1 : a.revision - b.revision).at(-1) ?? null;
}
