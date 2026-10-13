/** Ask 1.0 wire boundary. Valid messages are data, never model/dispatch authority. */
import type {
  AskAnswer, AskAnswerDelivery, AskAnswerReceipt, AskClaim, AskClaimInput, AskClaimPage,
  AskControlSync, AskControlSyncInput, AskLimits, AskQuestion, AskRenewInput,
  AskServiceScope, AskStatus, AskStatusDelivery, Problem,
} from '../../../contracts/investment/v1/types.js';
import { questionHash } from '../../../scripts/investment-contracts/ask.js';
import {
  canonicalHash, canonicalJson, checkPublicStrings, parseJson, problem,
  requireContract as need, sha256, validate,
} from '../../../scripts/investment-contracts/schema.js';

export const ASK_ORIGIN = 'https://asymmetri.co';
// Browser question requestBytes is separate from these larger HQ envelopes.
export const ASK_WIRE_BYTES = 262144;
export const ASK_PROBLEM_BYTES = 8192;
export interface AskBoundaryContext { scope: AskServiceScope; limits: AskLimits; now: string }
export type AskOperation =
  | { kind: 'claim'; input: AskClaimInput }
  | { kind: 'renew'; requestId: string; claim: AskClaim; input: AskRenewInput }
  | { kind: 'status'; requestId: string; claim: AskClaim; input: AskStatusDelivery }
  | { kind: 'answer'; requestId: string; claim: AskClaim; input: AskAnswerDelivery }
  | { kind: 'receipt'; identity: AskReceiptIdentity }
  | { kind: 'control_sync'; input: AskControlSyncInput };
export type AskKind = AskOperation['kind'];
/** Minimal non-content identity retained for receipt reconciliation after raw text is purged. */
export type AskReceiptIdentity = Pick<AskAnswer, 'serviceId'|'answerId'|'questionId'|'questionHash'|'generatedAt'> & {answerDigest:string};
export function askReceiptIdentity(value: AskAnswer): Readonly<AskReceiptIdentity> {
  validate('AskAnswer', value);
  return Object.freeze({serviceId:value.serviceId, answerId:value.answerId, questionId:value.questionId,
    questionHash:value.questionHash, generatedAt:value.generatedAt, answerDigest:canonicalHash(value)});
}
function receiptIdentity(value: AskReceiptIdentity): void {
  need(value && Object.keys(value).sort().join(',') === 'answerDigest,answerId,generatedAt,questionHash,questionId,serviceId', 'INVALID_SCHEMA');
  for(const field of ['serviceId','answerId','questionId'] as const) validate('Id', value[field]);
  validate('Hash', value.questionHash); validate('Hash', value.answerDigest); validate('Time', value.generatedAt);
}
type Responses = {
  claim: AskClaimPage; renew: AskClaim; status: AskStatus;
  answer: AskAnswerReceipt; receipt: AskAnswerReceipt; control_sync: AskControlSync;
};
type Permission = AskServiceScope['permissions'][number];
const profile = {
  claim: { permission: 'claim', response: 'AskClaimPage', input: 'AskClaimInput' },
  renew: { permission: 'claim', response: 'AskClaim', input: 'AskRenewInput' },
  status: { permission: 'status', response: 'AskStatus', input: 'AskStatusDelivery' },
  answer: { permission: 'answer', response: 'AskAnswerReceipt', input: 'AskAnswerDelivery' },
  receipt: { permission: 'receipt', response: 'AskAnswerReceipt', input: null },
  control_sync: { permission: 'control_sync', response: 'AskControlSync', input: 'AskControlSyncInput' },
} as const;
interface Binding {
  serviceId: string; generation: string; scopeHash: string; limitsHash: string;
  claimId: string | null; claimExpiresAt: string | null; questionExpiresAt: string | null; questionJson: string | null; questionId: string | null;
  questionHash: string | null; answerId: string | null; answerDigest: string | null;
  answerGeneratedAt: string | null;
}
/** Structural internal data, not an authority token. Reconstruct from trusted persisted intent. */
export interface PreparedAskRequest<K extends AskKind = AskKind> {
  readonly kind: K; readonly origin: typeof ASK_ORIGIN; readonly method: 'GET' | 'POST';
  readonly path: string; readonly permission: Permission; readonly requestId: string | null;
  /** Exact immutable UTF-8 body. A retry signs these bytes with a fresh nonce. */
  readonly body: string; readonly bodyHash: string;
  readonly binding: Readonly<Binding>;
}
export interface AskWireResponse { status: number; contentType: string; cacheControl: string; bytes: Uint8Array }
export type DecodedAskResponse<K extends AskKind> =
  | { kind: 'data'; value: Responses[K]; terminalControlPage: boolean }
  | { kind: 'problem'; code: Problem['code']; status: number; retryAfterSeconds: number | null };
function time(value: string): number { validate('Time', value); return Date.parse(value); }
function current(ctx: AskBoundaryContext, permission: Permission): void {
  validate('AskServiceScope', ctx.scope); validate('AskLimits', ctx.limits);
  need(ctx.scope.enabled && time(ctx.now) < time(ctx.scope.expiresAt) && ctx.scope.permissions.includes(permission), 'FORBIDDEN');
}
function question(value: AskQuestion, ctx: AskBoundaryContext, requireUnexpired: boolean): void {
  validate('AskQuestion', value);
  need(value.serviceId === ctx.scope.serviceId, 'FORBIDDEN');
  need(value.questionHash === questionHash(value), 'CONFLICT');
  const received = time(value.receivedAt), expires = time(value.expiresAt), now = time(ctx.now);
  need(received <= now && received < expires && expires - received <= ctx.limits.queueTtlSeconds * 1000, 'EXPIRED');
  if (requireUnexpired) need(now < expires, 'EXPIRED');
  need([...value.input.text].length <= ctx.limits.questionCharacters && Buffer.byteLength(canonicalJson(value.input)) <= ctx.limits.requestBytes, 'TOO_LARGE');
  need(value.priorOwnedQuestionIds.length < ctx.limits.historyTurns, 'BUDGET_EXHAUSTED');
  need(!value.priorOwnedQuestionIds.includes(value.questionId), 'CONFLICT');
  need(value.input.priorQuestionId === (value.priorOwnedQuestionIds.at(-1) ?? null), 'CONFLICT');
  if (value.input.context) need(['transaction','decision','artifact','order'].includes(value.input.context.record.kind), 'INVALID_REQUEST');
}
function claim(value: AskClaim, ctx: AskBoundaryContext, requireUnexpired: boolean): void {
  validate('AskClaim', value);
  need(value.serviceId === ctx.scope.serviceId && value.consumerGeneration === ctx.scope.consumerGeneration, 'CONFLICT');
  question(value.question, ctx, requireUnexpired);
  const lease = time(value.leaseExpiresAt);
  need(lease > time(value.question.receivedAt) && lease <= time(value.question.expiresAt), 'EXPIRED');
  if (requireUnexpired) need(time(ctx.now) < lease && lease <= time(ctx.scope.expiresAt), 'EXPIRED');
}
function answer(value: AskAnswer, ctx: AskBoundaryContext): void {
  validate('AskAnswer', value); need(value.serviceId === ctx.scope.serviceId, 'FORBIDDEN');
  need(time(value.generatedAt) <= time(ctx.now), 'INVALID_REQUEST');
  if (value.knowledgeAsOf !== null) need(time(value.knowledgeAsOf) <= time(value.generatedAt), 'INVALID_REQUEST');
  need([...value.text].length <= ctx.limits.answerCharacters, 'TOO_LARGE');
  checkPublicStrings(value);
}
/** Only the six existing HQ operations are representable; no caller-provided URL/schema. */
export function prepareAskRequest<K extends AskKind>(operation: Extract<AskOperation, {kind: K}>, ctx: AskBoundaryContext): PreparedAskRequest<K>;
export function prepareAskRequest(operation: AskOperation, ctx: AskBoundaryContext): PreparedAskRequest {
  need(operation && typeof operation === 'object' && Object.hasOwn(profile, operation.kind), 'INVALID_REQUEST');
  const p = profile[operation.kind]; current(ctx, p.permission);
  const input = operation.kind === 'receipt' ? operation.identity : operation.input;
  if (p.input !== null) validate(p.input, input);
  else receiptIdentity(input as AskReceiptIdentity);
  const binding: Binding = {
    serviceId: ctx.scope.serviceId, generation: ctx.scope.consumerGeneration,
    scopeHash: canonicalHash(ctx.scope), limitsHash: canonicalHash(ctx.limits),
    claimId: null, claimExpiresAt:null, questionExpiresAt:null, questionJson: null, questionId: null, questionHash: null,
    answerId: null, answerDigest: null, answerGeneratedAt: null,
  };
  let path: string, requestId: string | null;
  if ('claim' in operation) {
    claim(operation.claim, ctx, true);
    const q = operation.claim.question;
    Object.assign(binding, { claimId: operation.claim.claimId, claimExpiresAt:operation.claim.leaseExpiresAt, questionExpiresAt:q.expiresAt, questionJson: canonicalJson(q), questionId: q.questionId, questionHash: q.questionHash });
  }
  switch (operation.kind) {
    case 'claim':
      need(operation.input.serviceId === ctx.scope.serviceId && operation.input.consumerGeneration === ctx.scope.consumerGeneration, 'CONFLICT');
      path = '/api/ask/v1/hq/claims'; requestId = operation.input.claimRequestId; break;
    case 'renew':
      need(operation.input.serviceId === ctx.scope.serviceId && operation.input.consumerGeneration === ctx.scope.consumerGeneration, 'CONFLICT');
      need(operation.input.questionId === binding.questionId && operation.input.questionHash === binding.questionHash, 'CONFLICT');
      path = `/api/ask/v1/hq/claims/${binding.claimId}/renew`; requestId = operation.requestId; break;
    case 'status': {
      const {status} = operation.input;
      need(operation.input.claimId === binding.claimId && operation.input.consumerGeneration === binding.generation, 'CONFLICT');
      need(status.questionId === binding.questionId && status.questionHash === binding.questionHash, 'CONFLICT');
      need(time(status.updatedAt) >= time(operation.claim.question.receivedAt) && time(status.updatedAt) <= time(ctx.now), 'INVALID_REQUEST');
      checkPublicStrings(status);
      path = `/api/ask/v1/hq/questions/${binding.questionId}/status`; requestId = operation.requestId; break;
    }
    case 'answer': {
      const a = operation.input.answer, q = operation.claim.question; answer(a, ctx);
      need(operation.input.claimId === binding.claimId && operation.input.consumerGeneration === binding.generation, 'CONFLICT');
      need(a.questionId === q.questionId && a.questionHash === q.questionHash && a.questionRevision === q.revision && a.conversationId === q.conversationId, 'CONFLICT');
      need(time(a.generatedAt) >= time(q.receivedAt), 'INVALID_REQUEST');
      Object.assign(binding, {answerId:a.answerId, answerDigest:canonicalHash(a), answerGeneratedAt:a.generatedAt});
      path = `/api/ask/v1/hq/questions/${binding.questionId}/answer`; requestId = operation.requestId; break;
    }
    case 'receipt': {
      const a = operation.identity;
      need(a.serviceId === ctx.scope.serviceId, 'FORBIDDEN');
      need(time(a.generatedAt) <= time(ctx.now), 'INVALID_REQUEST');
      Object.assign(binding, {questionId:a.questionId, questionHash:a.questionHash, answerId:a.answerId, answerDigest:a.answerDigest, answerGeneratedAt:a.generatedAt});
      path = `/api/ask/v1/hq/answers/${a.answerId}/receipt`; requestId = null; break;
    }
    case 'control_sync':
      need(operation.input.serviceId === ctx.scope.serviceId && operation.input.consumerGeneration === ctx.scope.consumerGeneration, 'CONFLICT');
      path = '/api/ask/v1/hq/control-sync'; requestId = operation.input.syncId; break;
  }
  if (requestId !== null) validate('Id', requestId);
  const body = operation.kind === 'receipt' ? '' : canonicalJson(input);
  need(Buffer.byteLength(body) <= ASK_WIRE_BYTES, 'TOO_LARGE');
  return Object.freeze({kind:operation.kind, origin:ASK_ORIGIN, method:operation.kind === 'receipt' ? 'GET' : 'POST',
    path, permission:p.permission, requestId, body, bodyHash:sha256(body), binding:Object.freeze(binding)});
}
function assertBindingCurrent(request: PreparedAskRequest, ctx: AskBoundaryContext): void {
  validate('AskServiceScope', ctx.scope); validate('AskLimits', ctx.limits); time(ctx.now);
  need(canonicalHash(ctx.scope) === request.binding.scopeHash, 'CONFLICT');
  if (request.kind !== 'receipt') need(canonicalHash(ctx.limits) === request.binding.limitsHash, 'CONFLICT');
}
/** ASK-02 must invoke this again immediately before each actual transmission. */
export function assertAskRequestCurrent(request: PreparedAskRequest, ctx: AskBoundaryContext): void {
  assertBindingCurrent(request, ctx); current(ctx, request.permission);
  if (request.binding.claimId !== null) {
    need(time(ctx.now) < time(request.binding.claimExpiresAt!) && time(ctx.now) < time(request.binding.questionExpiresAt!), 'EXPIRED');
  }
}
/** Compare a persisted immutable intent with a proposed retry; not a durable dedupe store. */
export function assertAskRetry(original: PreparedAskRequest, next: PreparedAskRequest): void {
  need(original.requestId !== null && next.requestId === original.requestId && next.kind === original.kind
    && next.path === original.path && next.method === original.method && next.body === original.body
    && next.binding.serviceId === original.binding.serviceId && next.binding.generation === original.binding.generation, 'CONFLICT');
}
/** Decode only against the actual frozen request. No receiver text is used as an error message. */
export function decodeAskResponse<K extends AskKind>(request: PreparedAskRequest<K>, response: AskWireResponse, ctx: AskBoundaryContext): DecodedAskResponse<K> {
  // A valid late receipt can arrive after its transmitted claim expired. Decoding data
  // does not send anything or authorize further work; changed scope/generation still fences it.
  assertBindingCurrent(request, ctx);
  need(typeof response.cacheControl === 'string' && response.cacheControl.toLowerCase().split(',').map(s=>s.trim()).sort().join(',') === 'no-store,private', 'FORBIDDEN');
  const isProblem = response.status >= 400 && response.status <= 599;
  need(response.status === 200 || isProblem, 'UNAVAILABLE');
  const media = isProblem ? 'application/problem+json' : 'application/json';
  need(response.contentType === media || response.contentType === `${media}; charset=utf-8`, 'UNSUPPORTED_MEDIA');
  const parsed = parseJson(response.bytes, isProblem ? ASK_PROBLEM_BYTES : ASK_WIRE_BYTES);
  if (isProblem) {
    const received = validate<Problem>('Problem', parsed), safe = problem(received.code, received.requestId);
    need(received.status === response.status && safe.status === response.status, 'INVALID_SCHEMA');
    return {kind:'problem', code:received.code, status:response.status, retryAfterSeconds:safe.retryable ? received.retryAfterSeconds : null};
  }
  const value = validate<Responses[K]>(profile[request.kind].response, parsed);
  let terminalControlPage = false;
  switch (request.kind) {
    case 'claim': {
      const page = value as AskClaimPage;
      need(page.claimRequestId === request.requestId, 'CONFLICT');
      if (page.claim) claim(page.claim, ctx, true);
      break;
    }
    case 'renew': {
      const renewed = value as AskClaim; claim(renewed, ctx, true);
      need(renewed.claimId === request.binding.claimId && canonicalJson(renewed.question) === request.binding.questionJson, 'CONFLICT');
      break;
    }
    case 'status': {
      const status = value as AskStatus;
      need(status.questionId === request.binding.questionId && status.questionHash === request.binding.questionHash, 'CONFLICT');
      need(time(status.updatedAt) <= time(ctx.now), 'INVALID_REQUEST'); checkPublicStrings(status);
      // The receiver may report a terminal suppression instead of echoing requested work state.
      break;
    }
    case 'answer': case 'receipt': {
      const receipt = value as AskAnswerReceipt, b = request.binding;
      need(receipt.answerId === b.answerId && receipt.questionId === b.questionId && receipt.questionHash === b.questionHash && receipt.answerDigest === b.answerDigest, 'CONFLICT');
      need(time(receipt.receivedAt) >= time(b.answerGeneratedAt!) && time(receipt.receivedAt) <= time(ctx.now), 'INVALID_REQUEST');
      // An accepted receipt records historical acceptance, never current display permission.
      break;
    }
    case 'control_sync': {
      const sync = value as AskControlSync;
      need(sync.syncId === request.requestId, 'CONFLICT');
      const checked = time(sync.checkedAt), valid = time(sync.validUntil), now = time(ctx.now);
      need(checked <= now && valid > checked && valid - checked <= 60000, 'INVALID_REQUEST');
      need(new Set(sync.controls.map(c=>c.controlId)).size === sync.controls.length, 'CONFLICT');
      for (const control of sync.controls) {
        const effective = time(control.effectiveAt), purge = time(control.purgeBy), suppression = time(control.suppressionUntil);
        need(effective <= checked && purge >= effective && suppression >= purge, 'INVALID_REQUEST');
        // Historical immutable controls survive tighter local policy. These are v1 absolute
        // ceilings; applying earlier local purge deadlines belongs to durable ASK-02 control handling.
        need(purge - effective <= 604800000 && suppression - effective <= 2592000000, 'INVALID_REQUEST');
        need(control.action !== 'cancel' || control.questionId !== null, 'INVALID_REQUEST');
      }
      terminalControlPage = sync.controls.length === 0 && sync.nextCursor === null && now < valid
        && now - checked <= ctx.limits.controlFreshnessSeconds * 1000;
      // This is only a page fact. Durable application/acknowledgment and a fresh generation
      // are still required; this module intentionally cannot produce controlsDrained proof.
      break;
    }
  }
  return {kind:'data', value, terminalControlPage};
}
