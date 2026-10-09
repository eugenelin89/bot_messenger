/** Private Ask conformance checks over supplied snapshots; never starts worker/model work. */
import { timingSafeEqual } from 'node:crypto';
import type { AskQuestion, AskQuestionState, AskAnswer, AskAnswerReceipt, AskLimits, AskRoute, AskServiceScope, ContextRef, Event } from '../../contracts/investment/v1/types.js';
import { canonicalHash, checkPublicStrings, requireContract as need, sha256, validate } from './schema.js';
import { publicRecords } from './publication.js';
export interface SessionAuthority {
  sessionId: string; secretHash: string; csrfHash: string; expiresAt: string; deleted: boolean;
}
export interface BrowserRequest {
  sessionSecret: string; csrfToken?: string; origin: string; method: 'GET' | 'POST' | 'DELETE';
}
/** Check this on every access, including cached/idempotent results. IDs are never credentials. */
export function checkSession(request: BrowserRequest, authority: SessionAuthority, ownerSessionId: string, now: string, origin: string): void {
  need(!authority.deleted && Date.parse(now) < Date.parse(authority.expiresAt) && authority.sessionId === ownerSessionId, 'NOT_FOUND');
  const same = (value: string, hash: string): boolean => /^[a-f0-9]{64}$/.test(hash) && timingSafeEqual(Buffer.from(sha256(value)), Buffer.from(hash));
  need(same(request.sessionSecret, authority.secretHash), 'NOT_FOUND');
  need(request.origin === origin, 'FORBIDDEN');
  if (request.method !== 'GET') need(request.csrfToken && same(request.csrfToken, authority.csrfHash), 'FORBIDDEN');
}
export interface QuestionRecord { question: AskQuestion; state: AskQuestionState; route: AskRoute | null; answer: AskAnswer | null; invocation: 'not_started' | 'started' | 'confirmed' | 'unknown' }
export interface AskContext {
  now: string; service: AskServiceScope; limits: AskLimits; ownerSessionId: string;
  conversationId: string; sessionExpiresAt: string; conversationDeleted: boolean;
  questions: readonly QuestionRecord[]; publicHistory: readonly Event[];
  revokedReferences: ReadonlySet<string>; consumerGeneration: string;
  dailyExecutionsUsed: number; dailyTokensUsed: number; queueSize: number;
  sessionHourlyCount: number; sessionDailyCount: number;
}
export const contextKey = (r: ContextRef): string => `${r.experimentId}/${r.runId}/${r.record.kind}/${r.record.id}/${r.record.version}`;
function publicReference(r: ContextRef, ctx: AskContext): void {
  need(['transaction','decision','artifact','order'].includes(r.record.kind), 'INVALID_REQUEST');
  need(!ctx.revokedReferences.has(contextKey(r)), 'WITHDRAWN');
  const history = ctx.publicHistory.filter(e => e.experimentId === r.experimentId && e.runId === r.runId);
  const record = publicRecords(history).get(`${r.record.kind}:${r.record.id}:${r.record.version}`);
  need(record, 'NOT_FOUND');
  need(!history.some(e => e.type === 'publication.notice' && e.payload.kind === 'withdrawal' && e.payload.affected.some(a => a.kind === r.record.kind && a.id === r.record.id && a.version === r.record.version)), 'WITHDRAWN');
}
function service(ctx: AskContext, permission: AskServiceScope['permissions'][number]): void {
  validate('AskServiceScope', ctx.service); validate('AskLimits', ctx.limits);
  need(ctx.service.enabled && Date.parse(ctx.now) < Date.parse(ctx.service.expiresAt) && ctx.service.permissions.includes(permission), 'FORBIDDEN');
  need(ctx.consumerGeneration === ctx.service.consumerGeneration, 'CONFLICT');
}
export function questionHash(question: AskQuestion): string {
  const { questionHash: _, ...immutable } = question; return canonicalHash(immutable);
}
export function checkQuestion(value: unknown, ctx: AskContext): { question: AskQuestion; action: 'admit' | 'known'; knownState?: AskQuestionState } {
  service(ctx, 'claim'); const question = validate<AskQuestion>('AskQuestion', value);
  need(question.serviceId === ctx.service.serviceId, 'FORBIDDEN');
  need(question.sessionId === ctx.ownerSessionId && question.conversationId === ctx.conversationId && !ctx.conversationDeleted, 'NOT_FOUND');
  need(Date.parse(ctx.now) < Date.parse(ctx.sessionExpiresAt) && Date.parse(ctx.now) < Date.parse(question.expiresAt) && Date.parse(question.receivedAt) <= Date.parse(ctx.now), 'EXPIRED');
  need(Date.parse(question.expiresAt) - Date.parse(question.receivedAt) <= ctx.limits.queueTtlSeconds * 1000 && Date.parse(question.expiresAt) <= Date.parse(ctx.sessionExpiresAt));
  need(question.questionHash === questionHash(question), 'CONFLICT');
  const known = ctx.questions.find(r => r.question.questionId === question.questionId);
  if (known) {
    need(known.question.questionHash === question.questionHash && known.question.sessionId === ctx.ownerSessionId && known.question.conversationId === ctx.conversationId, 'CONFLICT');
    return { question, action: 'known', knownState: known.state };
  }
  need(question.input.text.length <= ctx.limits.questionCharacters && Buffer.byteLength(JSON.stringify(question.input)) <= ctx.limits.requestBytes, 'TOO_LARGE');
  const prior = ctx.questions.filter(r => r.question.conversationId === question.conversationId && r.question.sessionId === question.sessionId);
  need(prior.length < ctx.limits.historyTurns, 'BUDGET_EXHAUSTED');
  need(!ctx.questions.some(r => r.question.sessionId === question.sessionId && !['answered','declined','failed','expired','cancelled'].includes(r.state)), 'CONFLICT');
  const expectedPrior = prior.map(r => r.question.questionId);
  need(JSON.stringify(question.priorOwnedQuestionIds) === JSON.stringify(expectedPrior), 'NOT_FOUND');
  need(question.input.priorQuestionId === (prior.at(-1)?.question.questionId ?? null), 'NOT_FOUND');
  if (question.input.context) publicReference(question.input.context, ctx);
  need(ctx.dailyExecutionsUsed < ctx.limits.dailyExecutions && ctx.dailyTokensUsed < ctx.limits.dailyTokens, 'BUDGET_EXHAUSTED');
  need(ctx.queueSize < ctx.limits.queueCapacity && ctx.sessionHourlyCount < ctx.limits.sessionHourlyQuestions && ctx.sessionDailyCount < ctx.limits.sessionDailyQuestions, 'RATE_LIMITED');
  return { question, action: 'admit' };
}
export interface AnswerProof {
  workerId: string; questionId: string; questionHash: string;
  settlement: 'confirmed' | 'unknown'; controlCheckedAt: string; controlValidUntil: string;
  controlsDrained: boolean; cancelled: boolean; deleted: boolean;
}
export function checkAnswer(value: unknown, record: QuestionRecord, ctx: AskContext, proof: AnswerProof): AskAnswerReceipt['disposition'] {
  service(ctx, 'answer');
  const answer = validate<AskAnswer>('AskAnswer', value), q = record.question;
  need(answer.serviceId === ctx.service.serviceId && q.serviceId === answer.serviceId && answer.questionId === q.questionId && answer.questionHash === q.questionHash && answer.questionRevision === q.revision && answer.conversationId === q.conversationId, 'CONFLICT');
  need(q.sessionId === ctx.ownerSessionId && q.conversationId === ctx.conversationId, 'NOT_FOUND');
  need(proof.questionId === q.questionId && proof.questionHash === q.questionHash && proof.workerId === answer.workerId, 'FORBIDDEN');
  need(record.route && record.route.workerId === answer.workerId && record.route.routingPolicyVersion === answer.routingPolicyVersion, 'FORBIDDEN');
  need(proof.settlement === 'confirmed' && record.invocation === 'confirmed', 'OUTCOME_UNKNOWN');
  need(proof.controlsDrained, 'FORBIDDEN');
  need(Date.parse(proof.controlCheckedAt) <= Date.parse(ctx.now) && Date.parse(ctx.now) < Date.parse(proof.controlValidUntil) && Date.parse(ctx.now) - Date.parse(proof.controlCheckedAt) <= ctx.limits.controlFreshnessSeconds * 1000, 'FORBIDDEN');
  if (record.answer) need(record.answer.answerId === answer.answerId && canonicalHash(record.answer) === canonicalHash(answer), 'CONFLICT');
  // Suppression precedes content delivery; a late body must not recreate deleted content.
  if (proof.deleted || ctx.conversationDeleted) return 'discarded_deleted';
  if (proof.cancelled || record.state === 'cancelled') return 'discarded_cancelled';
  if (Date.parse(ctx.now) >= Date.parse(q.expiresAt) || Date.parse(ctx.now) >= Date.parse(ctx.sessionExpiresAt) || record.state === 'expired') return 'discarded_expired';
  need(Date.parse(answer.generatedAt) >= Date.parse(q.receivedAt) && Date.parse(answer.generatedAt) <= Date.parse(ctx.now));
  need(answer.text.length <= ctx.limits.answerCharacters, 'TOO_LARGE'); checkPublicStrings(answer);
  for (const evidence of [...(q.input.context ? [q.input.context] : []), ...answer.evidence]) {
    try { publicReference(evidence, ctx); }
    catch { return 'withheld_evidence'; }
  }
  return 'accepted';
}
export function recoveryAction(record: QuestionRecord): 'deliver_existing' | 'reconcile_only' | 'eligible_for_admission' | 'terminal' {
  if (['cancelled','expired','declined','failed'].includes(record.state)) return 'terminal';
  if (record.answer && record.invocation === 'confirmed') return 'deliver_existing';
  if (record.invocation !== 'not_started' || record.state === 'outcome_unknown') return 'reconcile_only';
  return 'eligible_for_admission';
}
