import { decimal, ensure, nonnegative, positive } from './arithmetic.js';
import { date, exact, id, integer, time } from './identity.js';
import type { Calendar, Configuration, Instrument, Observation, Session } from './types.js';
export function instrument(c: Configuration, key: string): Instrument {
  const result = [...c.instruments, c.benchmark.instrument].find(i => i.id === key);
  ensure(result, 'unknown_instrument'); return result;
}
export function session(calendar: Calendar, key: string): Session {
  const result = calendar.sessions.find(s => s.date === key); ensure(result, 'unknown_session'); return result;
}
export function nextSession(c: Configuration, at: string, cutoff = true): Session | null {
  return c.calendar.sessions.find(s => s.status === 'open' && time(s.open) - (cutoff ? c.cutoffMinutes * 60_000 : 0) > time(at) && time(s.open) >= time(c.startsAt) && time(s.open) < time(c.endsAt)) ?? null;
}
export const deadline = (c: Configuration, s: Session): string => new Date(time(s.open) - c.cutoffMinutes * 60_000).toISOString();
export const expiry = (c: Configuration, s: Session): string => new Date(Math.min(time(s.open) + c.maxOpeningWaitSeconds * 1000, time(c.endsAt))).toISOString();
export function validateConfiguration(c: Configuration): void {
  exact(c, ['runId','version','methodology','evidenceMode','initialCapital','currency','universeVersion','instruments','allowedDirections','longOnly','leverage','positionLimitBps','sectorLimitBps','drawdownAttentionBps','commission','slippageBps','execution','cutoffMinutes','maxOpeningWaitSeconds','maxMarkAgeSeconds','calendar','marketPolicy','benchmark','startsAt','endsAt','publicationPolicy','authorization']);
  for (const value of [c.runId,c.version,c.universeVersion,c.publicationPolicy]) id(value);
  ensure(c.methodology === 'inv05-v1' && c.evidenceMode === 'synthetic_fixture', 'synthetic_only');
  ensure(c.currency === 'USD' && c.longOnly === true && c.leverage === false, 'unsupported_policy');
  ensure(JSON.stringify(c.allowedDirections) === '["BUY","SELL"]', 'unsupported_direction');
  positive(c.initialCapital); nonnegative(c.commission);
  for (const limit of [c.positionLimitBps,c.sectorLimitBps,c.drawdownAttentionBps]) integer(limit, 1, 10_000);
  integer(c.slippageBps, 0, 9999); integer(c.cutoffMinutes, 1, 1440);
  integer(c.maxOpeningWaitSeconds, 1, 86_400); integer(c.maxMarkAgeSeconds, 1, 604_800);
  ensure(c.execution === 'next_regular_open', 'unsupported_execution');
  ensure(time(c.startsAt) < time(c.endsAt), 'invalid_run_window');
  exact(c.authorization, ['fixtureOperator','authors','reviewers','expiresAt','maxOrders']);
  id(c.authorization.fixtureOperator); integer(c.authorization.maxOrders, 1, 10_000);
  ensure(time(c.authorization.expiresAt) >= time(c.startsAt) && time(c.authorization.expiresAt) <= time(c.endsAt), 'invalid_authorization');
  for (const list of [c.authorization.authors,c.authorization.reviewers]) { ensure(list.length > 0 && list.length <= 20 && new Set(list).size === list.length, 'invalid_authorization'); list.forEach(id); }
  exact(c.marketPolicy, ['id','provider','feed','acquisitionCost','adjustment']);
  for (const v of [c.marketPolicy.id,c.marketPolicy.provider,c.marketPolicy.feed]) id(v);
  ensure(c.marketPolicy.acquisitionCost === '0' && c.marketPolicy.adjustment === 'raw', 'unsupported_market_policy');
  exact(c.benchmark, ['instrument','convention']);
  ensure(c.benchmark.convention === 'raw_prices_explicit_dividends_next_open_reinvestment', 'unsupported_benchmark');
  ensure(c.instruments.length > 0 && c.instruments.length <= 100, 'invalid_universe');
  const instruments = [...c.instruments,c.benchmark.instrument];
  ensure(new Set(instruments.map(i => i.id)).size === instruments.length, 'duplicate_instrument');
  for (const i of instruments) {
    exact(i, ['id','symbol','venue','currency','sector','classificationSource']); id(i.id); id(i.symbol); id(i.venue);
    ensure(i.currency === 'USD' && (i.sector === null || (typeof i.sector === 'string' && i.sector.length > 0 && i.sector.length <= 100)) && typeof i.classificationSource === 'string' && i.classificationSource.length > 0, 'invalid_instrument');
  }
  exact(c.calendar, ['version','timezone','sessions','holidays']); id(c.calendar.version);
  ensure(c.calendar.timezone === 'America/New_York', 'unsupported_timezone');
  ensure(c.calendar.sessions.length > 0 && c.calendar.sessions.length <= 5000, 'invalid_calendar');
  const zone = new Intl.DateTimeFormat('en-CA', { timeZone: c.calendar.timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short' });
  let previous = -Infinity;
  for (const s of c.calendar.sessions) {
    exact(s, ['date','open','close','status','earlyClose']); date(s.date);
    ensure(time(s.open) > previous && time(s.close) > time(s.open), 'invalid_calendar_order'); previous = time(s.open);
    ensure(s.status === 'open' || s.status === 'closed', 'invalid_session_status'); ensure(typeof s.earlyClose === 'boolean', 'invalid_session');
    const parts = Object.fromEntries(zone.formatToParts(new Date(s.open)).map(p => [p.type,p.value]));
    const close = Object.fromEntries(zone.formatToParts(new Date(s.close)).map(p => [p.type,p.value]));
    ensure(`${parts.year}-${parts.month}-${parts.day}` === s.date && `${close.year}-${close.month}-${close.day}` === s.date && parts.hour === '09' && parts.minute === '30', 'invalid_exchange_open');
    ensure(close.minute === '00' && close.hour === (s.earlyClose ? '13' : '16'), 'invalid_exchange_close');
    ensure(!['Sat','Sun'].includes(parts.weekday!), 'weekend_session');
    ensure(s.status === 'closed' || !c.calendar.holidays.includes(s.date), 'holiday_session');
  }
  ensure(new Set(c.calendar.sessions.map(s => s.date)).size === c.calendar.sessions.length, 'duplicate_session');
  c.calendar.holidays.forEach(date);
  ensure(nextSession(c, c.startsAt), 'missing_initial_session');
}
export function validateObservation(c: Configuration, o: Observation, recordedAt: string): void {
  exact(o, ['id','instrumentId','venue','currency','provider','feed','field','value','adjustment','marketAt','availableAt','retrievedAt','session','calendarVersion','sourceId','sourceVersion','quality','correctionOf']);
  for (const value of [o.id,o.instrumentId,o.sourceId]) id(value);
  integer(o.sourceVersion, 1, 1_000_000); if (o.correctionOf !== null) id(o.correctionOf);
  const i = instrument(c, o.instrumentId), s = session(c.calendar, o.session);
  ensure(o.venue === i.venue && o.currency === 'USD' && o.provider === c.marketPolicy.provider && o.feed === c.marketPolicy.feed && o.calendarVersion === c.calendar.version, 'observation_policy_mismatch');
  ensure(o.adjustment === 'raw', 'adjusted_price_rejected');
  ensure(o.field === 'regular_open' || o.field === 'regular_close', 'unsupported_price_field');
  ensure(['verified','halted','unverified'].includes(o.quality), 'invalid_quality');
  ensure(s.status === 'open', 'closed_session'); positive(o.value);
  ensure(time(o.marketAt) === time(o.field === 'regular_open' ? s.open : s.close), 'wrong_market_time');
  ensure(time(o.marketAt) <= time(o.availableAt) && time(o.availableAt) <= time(o.retrievedAt) && time(o.retrievedAt) <= time(recordedAt), 'observation_time_order');
}
export function opening(c: Configuration, observations: Observation[], instrumentId: string, target: string, at: string): Observation | null {
  const s = session(c.calendar, target);
  if (s.status !== 'open' || time(at) < time(s.open) || time(at) >= time(expiry(c, s))) return null;
  // Arrival order is durable. Never replace the original opening with a later correction.
  return observations.find(o => o.instrumentId === instrumentId && o.session === target && o.field === 'regular_open' && o.correctionOf === null && o.quality === 'verified' && time(o.retrievedAt) <= time(at)) ?? null;
}
export function mark(c: Configuration, observations: Observation[], instrumentId: string, asOf: string, recordedAt: string, exactSession?: string): Observation | null {
  const candidates = observations.filter(o => o.instrumentId === instrumentId && time(o.marketAt) <= time(asOf) && time(o.retrievedAt) <= time(recordedAt) && (!exactSession || o.session === exactSession));
  const superseded = new Set(candidates.map(o => o.correctionOf).filter(Boolean));
  const latest = candidates.filter(o => o.quality === 'verified' && !superseded.has(o.id)).sort((a,b) => time(b.marketAt)-time(a.marketAt) || b.sourceVersion-a.sourceVersion)[0];
  return latest && time(asOf) - time(latest.marketAt) <= c.maxMarkAgeSeconds * 1000 && decimal(latest.value) > 0n ? latest : null;
}
