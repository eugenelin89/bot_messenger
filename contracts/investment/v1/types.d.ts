/* Generated from schema.json by npm run contracts:generate. Do not edit. */

/**
 * INV-01 v1.0 wire contracts. Synthetic fixtures do not authorize a run or service. Public portfolio and private Ask roots remain disjoint. All decimals are exact strings. Semantic requirements are in PROTOCOL.md.
 */
export type InvestmentShowcaseContract =
  | EventBatch
  | PublicationReceipt
  | ContentReceipt
  | Heartbeat
  | HeartbeatReceipt
  | PublicStatus
  | PublicExperiment
  | EventPage
  | DiscussionPage
  | ArtifactPage
  | TransactionPage
  | PerformancePage
  | DiscussionDetail
  | DecisionDetail
  | SnapshotResponse
  | ArtifactDetail
  | Problem
  | AskAvailability
  | AskSessionCreate
  | AskSession
  | AskConversationCreate
  | AskConversation
  | AskQuestionInput
  | AskQuestion
  | AskAdmission
  | AskRoute
  | AskStatus
  | AskAnswer
  | AskTurn
  | AskConversationPage
  | AskCancel
  | AskControlReceipt
  | AskClaimInput
  | AskClaim
  | AskClaimPage
  | AskRenewInput
  | AskAnswerDelivery
  | AskStatusDelivery
  | AskAnswerReceipt
  | AskControlSyncInput
  | AskControlSync
  | AskLimits
  | AskWorkerEligibility
  | AskServiceScope
  | PublisherScope
  | AskRoster
  | RecordDetail;
export type Version = "1.0";
export type Id = string;
export type Event =
  | RunPublishedEvent
  | TeamPublishedEvent
  | RunStatusEvent
  | WorkerActivityEvent
  | DiscussionOpenedEvent
  | ContributionEvent
  | DiscussionClosedEvent
  | ArtifactRegisteredEvent
  | ArtifactVersionEvent
  | DecisionPublishedEvent
  | PaperOrderEvent
  | LedgerTransactionEvent
  | PortfolioSnapshotEvent
  | OutcomeReviewEvent
  | CorrectionEvent
  | PublicationNoticeEvent
  | CorporateActionEvent
  | InstrumentUpdateEvent;
export type Sequence = string;
export type Time = string;
export type Actor =
  | {
      kind: "system" | "owner";
    }
  | {
      kind: "worker";
      workerId: Id;
    };
export type Mode = "synthetic_fixture" | "observed_paper";
export type RunState =
  "draft" | "configured" | "private_trial" | "ready_for_public" | "active" | "paused" | "ended" | "archived";
export type Hash = string;
export type Date = string;
export type Decimal = string;
export type HttpsUrl = string;
export type Text = string;
export type ArtifactRef = RecordRef & {
  kind: "artifact";
};
export type ArtifactState =
  "registered" | "awaiting_publication" | "published" | "withheld" | "failed" | "superseded" | "withdrawn";
export type ContentType = "text/plain" | "text/markdown" | "application/json" | "image/png" | "text/csv";
export type Quantity = string;
export type SignedDecimal = string;
export type TransactionRef = RecordRef & {
  kind: "transaction";
};
export type ValuationRef = RecordRef & {
  kind: "valuation";
};
export type DecisionRef = RecordRef & {
  kind: "decision";
};
export type CorporateActionRef = RecordRef & {
  kind: "corporate_action";
};
export type ErrorCode =
  | "INVALID_REQUEST"
  | "UNSUPPORTED_VERSION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DEPENDENCY_NOT_READY"
  | "SEQUENCE_GAP"
  | "REPLAY"
  | "TOO_LARGE"
  | "UNSUPPORTED_MEDIA"
  | "INVALID_SCHEMA"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "OUTCOME_UNKNOWN"
  | "CURSOR_RESET"
  | "EXPIRED"
  | "CANCELLED"
  | "WITHDRAWN"
  | "BUDGET_EXHAUSTED";
export type AskVersion = "1.0";
export type AskQuestionState =
  | "admitted"
  | "queued"
  | "routed"
  | "answering"
  | "answered"
  | "declined"
  | "expired"
  | "cancelled"
  | "failed"
  | "outcome_unknown";

export interface EventBatch {
  schemaVersion: Version;
  batchId: Id;
  experimentId: Id;
  runId: Id;
  /**
   * @minItems 1
   * @maxItems 50
   */
  events: [Event, ...Event[]];
}
export interface RunPublishedEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "run.published";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: RunPublished;
}
export interface RecordRef {
  kind:
    | "event"
    | "discussion"
    | "contribution"
    | "decision"
    | "review"
    | "order"
    | "transaction"
    | "artifact"
    | "valuation"
    | "corporate_action"
    | "instrument";
  id: Id;
  version: number;
  relation: "supports" | "challenges" | "summarizes" | "supersedes" | "reviews" | "results_in" | "produced_by";
}
export interface RunPublished {
  title: string;
  purpose: string;
  objective: string;
  runKind: "fixture" | "private_trial" | "official";
  state: RunState;
  configuration: RunConfiguration;
  configurationHash: Hash;
  startsAt: Time;
  endsAt: Time;
  previousRunId: Id | null;
}
export interface RunConfiguration {
  configurationVersion: Id;
  methodologyVersion: Id;
  methodologyHash: Hash;
  universeVersion: Id;
  /**
   * @minItems 1
   * @maxItems 100
   */
  universe: [Instrument, ...Instrument[]];
  initialCapital: Decimal;
  currency: "USD";
  benchmarkInstrument: Instrument;
  benchmarkConvention: "raw_prices_explicit_dividends_next_open_reinvestment";
  calendarVersion: Id;
  calendarTimezone: "America/New_York";
  marketProvider: Id;
  feed: Id;
  openingFieldDefinition: string;
  executionRule: "next_regular_open";
  cutoffMinutes: number;
  slippageBps: number;
  commission: Decimal;
  quantityRule: "whole_discretionary_six_decimal_actions";
  rounding: "half_even_6";
  costBasis: "weighted_average";
  longOnly: true;
  leverage: false;
  cashConvention: "no_interest_no_tax_immediate_simulated_settlement";
  positionLimitBps: number;
  sectorLimitBps: number;
  drawdownStopBps: number;
  decisionCadence: "one_review_per_regular_session";
  officialSessions: number;
  cycleExecutionBudget: number;
  dailyExecutionBudget: number;
  runExecutionBudget: number;
  publicationPolicyVersion: Id;
  publicationHeartbeatSeconds: number;
  publicationStaleSeconds: number;
  maxOutboxAgeSeconds: number;
  maxOutboxBytes: number;
  dataDelaySeconds: number;
  attribution: string;
  /**
   * @minItems 1
   * @maxItems 10
   */
  rightsEvidence: [HttpsUrl, ...HttpsUrl[]];
  configurationStatus: "synthetic_only" | "owner_approved";
  approvalRecordId: Id | null;
  /**
   * @minItems 1
   * @maxItems 20
   */
  limitations: [string, ...string[]];
  maxOpeningWaitSeconds: number;
}
export interface Instrument {
  instrumentId: Id;
  symbol: string;
  venue: string;
  currency: "USD";
  sector: string;
  classificationSource: string;
  /**
   * @minItems 1
   * @maxItems 20
   */
  symbolHistory: [
    {
      symbol: string;
      effectiveFrom: Date;
      effectiveTo: Date | null;
    },
    ...{
      symbol: string;
      effectiveFrom: Date;
      effectiveTo: Date | null;
    }[]
  ];
}
export interface TeamPublishedEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "team.published";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: TeamPublished;
}
export interface TeamPublished {
  rosterVersion: Id;
  /**
   * @minItems 1
   * @maxItems 8
   */
  workers: [Worker, ...Worker[]];
}
export interface Worker {
  workerId: Id;
  name: string;
  role: string;
  /**
   * @minItems 1
   * @maxItems 10
   */
  responsibilities: [string, ...string[]];
  status: "available" | "busy" | "unavailable" | "retired";
}
export interface RunStatusEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "run.status";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: RunStatus;
}
export interface RunStatus {
  state: RunState;
  reason: string;
  effectiveAt: Time;
  nextReviewAt: Time | null;
}
export interface WorkerActivityEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "worker.activity";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: WorkerActivity;
}
export interface WorkerActivity {
  activityId: Id;
  workerId: Id;
  activity: "research" | "discussion" | "decision" | "review" | "idle" | "blocked";
  work: RecordRef | null;
  startedAt: Time;
  finishedAt: Time | null;
  summary: string;
}
export interface DiscussionOpenedEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "discussion.opened";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: DiscussionOpened;
}
export interface DiscussionOpened {
  discussionId: Id;
  topic: string;
  charter: string;
  audiencePolicyVersion: Id;
  /**
   * @minItems 1
   * @maxItems 8
   */
  participants: [Id, ...Id[]];
}
export interface ContributionEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "discussion.contribution";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: Contribution;
}
export interface Contribution {
  contributionId: Id;
  discussionId: Id;
  ordinal: Sequence;
  body: Text;
  replyTo: Id | null;
  /**
   * @minItems 0
   * @maxItems 20
   */
  evidence: RecordRef[];
}
export interface DiscussionClosedEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "discussion.closed";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: DiscussionClosed;
}
export interface DiscussionClosed {
  discussionId: Id;
  outcome: string;
  /**
   * @minItems 0
   * @maxItems 20
   */
  dissent: string[];
  /**
   * @minItems 0
   * @maxItems 20
   */
  unresolved: string[];
  synthesis: ArtifactRef;
}
export interface ArtifactRegisteredEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "artifact.registered";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: ArtifactRegistered;
}
export interface ArtifactRegistered {
  artifactId: Id;
  title: string;
  author: Actor;
  status: ArtifactState;
  reason: string | null;
  /**
   * @minItems 0
   * @maxItems 20
   */
  relationships: RecordRef[];
}
export interface ArtifactVersionEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "artifact.published";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: ArtifactVersion;
}
export interface ArtifactVersion {
  artifactId: Id;
  version: number;
  title: string;
  author: Actor;
  createdAt: Time;
  publishedAt: Time;
  contentType: ContentType;
  sizeBytes: number;
  sha256: Hash;
  /**
   * @minItems 0
   * @maxItems 20
   */
  relationships: RecordRef[];
  /**
   * @minItems 0
   * @maxItems 30
   */
  sources: Source[];
  rights: "owner_authored" | "licensed_publication";
  /**
   * @minItems 0
   * @maxItems 20
   */
  limitations: string[];
  supersedes: ArtifactRef | null;
  derivative: boolean;
}
export interface Source {
  sourceId: Id;
  url: HttpsUrl;
  title: string;
  publisher: string;
  publishedAt: Time | null;
  eventAt: Time | null;
  retrievedAt: Time;
  summary: string;
  /**
   * @minItems 0
   * @maxItems 10
   */
  limitations: string[];
  rights: "public_link" | "licensed_summary" | "owner_authored";
}
export interface DecisionPublishedEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "decision.published";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: DecisionPublished;
}
export interface DecisionPublished {
  proposal: DecisionProposal;
  proposalHash: Hash;
  review: IndependentReview;
}
export interface DecisionProposal {
  decisionId: Id;
  revision: number;
  action: "BUY" | "SELL" | "HOLD";
  instrumentId: Id | null;
  quantity: Quantity | null;
  targetSession: Date | null;
  priceGuard: Decimal | null;
  evidenceCutoff: Time;
  committedAt: Time;
  rationale: string;
  /**
   * @minItems 1
   * @maxItems 10
   */
  alternatives: [string, ...string[]];
  /**
   * @minItems 1
   * @maxItems 10
   */
  risks: [string, ...string[]];
  invalidationCondition: string;
  /**
   * @minItems 0
   * @maxItems 20
   */
  evidence: RecordRef[];
  /**
   * @minItems 0
   * @maxItems 30
   */
  sources: Source[];
}
export interface IndependentReview {
  reviewId: Id;
  reviewerId: Id;
  proposalHash: Hash;
  proposalRevision: number;
  reviewedAt: Time;
  disposition: "approve" | "reject" | "revise";
  rationale: string;
  /**
   * @minItems 0
   * @maxItems 20
   */
  dissent: string[];
  /**
   * @minItems 0
   * @maxItems 20
   */
  evidence: RecordRef[];
}
export interface PaperOrderEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "paper.order";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: PaperOrder;
}
export interface PaperOrder {
  orderId: Id;
  decisionId: Id;
  decisionRevision: number;
  proposalHash: Hash;
  orderIndex: number;
  revision: number;
  previousEventId: Id | null;
  instrumentId: Id;
  side: "BUY" | "SELL";
  quantity: Quantity;
  targetSession: Date;
  deadline: Time;
  priceGuard: Decimal;
  status: "proposed" | "validated" | "pending" | "filled" | "rejected" | "expired" | "cancelled";
  reason: string | null;
  configurationHash: Hash;
  expectedLedgerVersion: Sequence;
  reservedCash: Decimal;
  reservedQuantity: Decimal;
  expiresAt: Time;
}
export interface LedgerTransactionEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "paper.ledger_transaction";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: LedgerTransaction;
}
export interface LedgerTransaction {
  transactionId: Id;
  journalSequence: Sequence;
  previousHash: Hash | null;
  journalHash: Hash;
  previousLedgerVersion: Sequence | null;
  ledgerVersion: Sequence;
  configurationHash: Hash;
  effect: "initialization" | "fill" | "split" | "dividend_accrual" | "dividend_payment" | "correction";
  sourceOperationId: Id;
  effectiveAt: Time;
  recordedAt: Time;
  /**
   * @minItems 1
   * @maxItems 30
   */
  entries: [JournalEntry, ...JournalEntry[]];
  fill: Fill | null;
  corporateAction: CorporateAction | null;
  correctionOf: TransactionRef | null;
}
export interface JournalEntry {
  account:
    "cash" | "quantity" | "book_cost" | "realized_pnl" | "fee" | "income" | "receivable" | "liability" | "capital";
  instrumentId: Id | null;
  amount: SignedDecimal;
  currency: "USD";
}
export interface Fill {
  orderId: Id;
  orderRevision: number;
  decisionId: Id;
  decisionRevision: number;
  instrumentId: Id;
  side: "BUY" | "SELL";
  quantity: Quantity;
  price: Decimal;
  fee: Decimal;
  releasedBasis: Decimal;
  /**
   * Additional posted cash correction in USD; v1 fill requires zero. Sub-micro residuals are separately exact rationals in micro-USD.
   */
  roundingAdjustment: string;
  observation: MarketObservation;
  priceRoundingResidual: Rational;
  basisRoundingResidual: Rational;
}
export interface MarketObservation {
  observationId: Id;
  instrumentId: Id;
  venue: string;
  currency: "USD";
  provider: Id;
  feed: Id;
  field: "regular_open" | "regular_close";
  value: Decimal;
  adjustment: "raw";
  session: Date;
  marketAt: Time;
  availableAt: Time | null;
  retrievedAt: Time;
  calendarVersion: Id;
  sourceVersion: Id;
  delaySeconds: number;
}
export interface Rational {
  numerator: string;
  denominator: Sequence;
}
export interface CorporateAction {
  actionId: Id;
  providerActionId: Id;
  instrumentId: Id;
  sourceVersion: Id;
  kind: "split" | "dividend_accrual" | "dividend_payment" | "ticker_change" | "unsupported";
  effectiveAt: Time;
  exDate: Date | null;
  paymentDate: Date | null;
  numerator: Sequence | null;
  denominator: Sequence | null;
  cashPerShare: Decimal | null;
  entitledQuantity: Decimal | null;
  fractionalEntitlement: Rational | null;
  newSymbol: string | null;
  source: Source;
}
export interface PortfolioSnapshotEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "portfolio.snapshot";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: PortfolioSnapshot;
}
export interface PortfolioSnapshot {
  valuationId: Id;
  valuationSequence: Sequence;
  revision: number;
  supersedes: ValuationRef | null;
  journalSequence: Sequence;
  journalHash: Hash;
  configurationHash: Hash;
  markSetId: Id;
  valuationAsOf: Time;
  session: Date;
  currency: "USD";
  cash: Decimal;
  receivables: Decimal;
  liabilities: Decimal;
  /**
   * @minItems 0
   * @maxItems 100
   */
  holdings: Holding[];
  equity: Decimal | null;
  realizedPnl: SignedDecimal;
  unrealizedPnl: SignedDecimal | null;
  totalReturn: SignedDecimal | null;
  dailyReturn: SignedDecimal | null;
  previousComparableEquity: Decimal | null;
  peakEquity: Decimal | null;
  drawdown: SignedDecimal | null;
  maxDrawdown: SignedDecimal | null;
  benchmark: Benchmark;
  excessReturn: SignedDecimal | null;
  quality: "complete" | "partial" | "stale" | "blocked";
  /**
   * @minItems 0
   * @maxItems 20
   */
  limitations: string[];
}
export interface Holding {
  instrumentId: Id;
  symbol: string;
  sector: string;
  quantity: Decimal;
  bookCost: Decimal;
  mark: MarketObservation | null;
  marketValue: Decimal | null;
  unrealizedPnl: SignedDecimal | null;
  missingReason: string | null;
}
export interface Benchmark {
  instrumentId: Id;
  convention: "raw_prices_explicit_dividends_next_open_reinvestment";
  session: Date;
  units: Decimal;
  cash: Decimal;
  receivables: Decimal;
  mark: MarketObservation | null;
  equity: Decimal | null;
  totalReturn: SignedDecimal | null;
  missingReason: string | null;
}
export interface OutcomeReviewEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "review.published";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: OutcomeReview;
}
export interface OutcomeReview {
  reviewId: Id;
  /**
   * @minItems 1
   * @maxItems 20
   */
  originalDecisions: [DecisionRef, ...DecisionRef[]];
  /**
   * @minItems 0
   * @maxItems 30
   */
  observations: RecordRef[];
  interpretation: string;
  /**
   * @minItems 0
   * @maxItems 20
   */
  limitations: string[];
  nextDisposition: "continue" | "revise" | "pause" | "stop";
  asOf: Time;
}
export interface CorrectionEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "content.corrected";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: Correction;
}
export interface Correction {
  prior: RecordRef;
  replacement: RecordRef;
  reason: string;
}
export interface PublicationNoticeEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "publication.notice";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: PublicationNotice;
}
export interface PublicationNotice {
  noticeId: Id;
  kind: "omission" | "delay" | "rights" | "withdrawal" | "correction";
  /**
   * @minItems 0
   * @maxItems 30
   */
  affected: RecordRef[];
  reason: string;
  effectiveAt: Time;
}
export interface CorporateActionEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "market.action";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: CorporateAction;
}
export interface InstrumentUpdateEvent {
  schemaVersion: Version;
  eventId: Id;
  experimentId: Id;
  runId: Id;
  sourceSequence: Sequence;
  type: "instrument.updated";
  occurredAt: Time;
  recordedAt: Time;
  actor: Actor;
  publicationPolicyVersion: Id;
  evidenceMode: Mode;
  /**
   * @minItems 0
   * @maxItems 30
   */
  references: RecordRef[];
  payload: InstrumentUpdate;
}
export interface InstrumentUpdate {
  instrument: Instrument;
  version: number;
  effectiveAt: Time;
  reason: string;
  action: CorporateActionRef;
}
export interface PublicationReceipt {
  schemaVersion: Version;
  batchId: Id;
  experimentId: Id;
  runId: Id;
  bodyDigest: Hash;
  receiptId: Id;
  receivedAt: Time;
  /**
   * @minItems 0
   * @maxItems 50
   */
  acceptedIds: Id[];
  /**
   * @minItems 0
   * @maxItems 50
   */
  duplicateIds: Id[];
  receiverCursor: Id;
  watermark: Watermark;
}
export interface Watermark {
  journalSequence: Sequence | null;
  journalHash: Hash | null;
  sourceSequence: Sequence | null;
  sourceGaps: boolean;
}
export interface ContentReceipt {
  schemaVersion: Version;
  uploadId: Id;
  experimentId: Id;
  runId: Id;
  sha256: Hash;
  contentType: ContentType;
  sizeBytes: number;
  receivedAt: Time;
  state: "staged_private";
}
export interface Heartbeat {
  schemaVersion: Version;
  heartbeatId: Id;
  experimentId: Id;
  runId: Id;
  sentAt: Time;
  lastSourceSequence: Sequence | null;
  state: RunState;
}
export interface HeartbeatReceipt {
  schemaVersion: Version;
  heartbeatId: Id;
  receivedAt: Time;
}
export interface PublicStatus {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  state: RunState;
  watermark: Watermark;
  freshness: Freshness;
  /**
   * @minItems 0
   * @maxItems 20
   */
  notices: PublicationNotice[];
}
export interface Freshness {
  lastActivityAt: Time | null;
  lastPublicationAt: Time | null;
  lastHeartbeatAt: Time | null;
  valuationAsOf: Time | null;
  expectedMarkSession: Date | null;
  status: "fresh" | "stale" | "unknown" | "market_closed";
  reason: string | null;
}
export interface PublicExperiment {
  schemaVersion: Version;
  experimentId: Id;
  title: string;
  purpose: string;
  objective: string;
  officialRunId: Id | null;
  /**
   * @minItems 0
   * @maxItems 100
   */
  runs: {
    runId: Id;
    kind: "fixture" | "private_trial" | "official";
    state: RunState;
    methodologyVersion: Id;
  }[];
  nextCursor: Id | null;
}
export interface EventPage {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  /**
   * @minItems 0
   * @maxItems 100
   */
  items: ReceivedEvent[];
  nextCursor: Id | null;
  watermark: Watermark;
  freshness: Freshness;
}
export interface ReceivedEvent {
  event: Event;
  eventHash: Hash;
  receivedAt: Time;
  receiverSequence: Sequence;
  receiptId: Id;
}
export interface DiscussionPage {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  /**
   * @minItems 0
   * @maxItems 100
   */
  items: DiscussionOpened[];
  nextCursor: Id | null;
  watermark: Watermark;
  freshness: Freshness;
}
export interface ArtifactPage {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  /**
   * @minItems 0
   * @maxItems 100
   */
  items: ArtifactRegistryEntry[];
  nextCursor: Id | null;
  watermark: Watermark;
  freshness: Freshness;
}
export interface ArtifactRegistryEntry {
  registration: ArtifactRegistered;
  status: ArtifactState;
  currentPublishedVersion: number | null;
  publishedReference: RecordRef | null;
  safeReason: string | null;
}
export interface TransactionPage {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  /**
   * @minItems 0
   * @maxItems 100
   */
  items: (
    | {
        kind: "order";
        event: PaperOrderEvent;
      }
    | {
        kind: "transaction";
        event: LedgerTransactionEvent;
      }
  )[];
  nextCursor: Id | null;
  watermark: Watermark;
  freshness: Freshness;
}
export interface PerformancePage {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  /**
   * @minItems 0
   * @maxItems 100
   */
  items: PortfolioSnapshot[];
  nextCursor: Id | null;
  watermark: Watermark;
  freshness: Freshness;
}
export interface DiscussionDetail {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  discussion: DiscussionOpened;
  /**
   * @minItems 0
   * @maxItems 100
   */
  contributions: ContributionEvent[];
  closure: DiscussionClosed | null;
  nextCursor: Id | null;
  freshness: Freshness;
}
export interface DecisionDetail {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  decision: DecisionPublishedEvent;
  /**
   * @minItems 0
   * @maxItems 50
   */
  orders: PaperOrder[];
  /**
   * @minItems 0
   * @maxItems 100
   */
  transactions: RecordRef[];
  /**
   * @minItems 0
   * @maxItems 30
   */
  reviews: RecordRef[];
  freshness: Freshness;
}
export interface SnapshotResponse {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  snapshot: PortfolioSnapshot | null;
  watermark: Watermark;
  freshness: Freshness;
}
export interface ArtifactDetail {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  artifactId: Id;
  version: number;
  status: ArtifactState;
  metadata: ArtifactVersion | null;
  safeReason: string | null;
}
export interface Problem {
  schemaVersion: Version;
  code: ErrorCode;
  requestId: Id;
  status: number;
  retryable: boolean;
  detail: string;
  retryAfterSeconds: number | null;
  resync: "status_snapshot_page" | null;
}
export interface AskAvailability {
  schemaVersion: AskVersion;
  serviceId: Id;
  state: "available" | "paused" | "busy" | "disabled";
  retryAfterSeconds: number | null;
  privacyNoticeVersion: Id;
}
export interface AskSessionCreate {
  schemaVersion: AskVersion;
  privacyNoticeVersion: Id;
}
export interface AskSession {
  schemaVersion: AskVersion;
  serviceId: Id;
  sessionId: Id;
  createdAt: Time;
  expiresAt: Time;
  privacyNoticeVersion: Id;
  csrfToken: string;
}
export interface AskConversationCreate {
  schemaVersion: AskVersion;
}
export interface AskConversation {
  schemaVersion: AskVersion;
  conversationId: Id;
  createdAt: Time;
  expiresAt: Time;
  state: "open" | "closed" | "deleted" | "expired";
}
export interface AskQuestionInput {
  schemaVersion: AskVersion;
  text: string;
  context: ContextRef | null;
  priorQuestionId: Id | null;
  language: string;
  preferredWorkerId?: Id | null;
}
export interface ContextRef {
  experimentId: Id;
  runId: Id;
  record: RecordRef;
}
export interface AskQuestion {
  schemaVersion: AskVersion;
  serviceId: Id;
  sessionId: Id;
  conversationId: Id;
  questionId: Id;
  revision: 1;
  questionHash: Hash;
  input: AskQuestionInput;
  /**
   * @minItems 0
   * @maxItems 8
   */
  priorOwnedQuestionIds: Id[];
  receivedAt: Time;
  expiresAt: Time;
}
export interface AskAdmission {
  schemaVersion: AskVersion;
  conversationId: Id;
  questionId: Id;
  revision: 1;
  questionHash: Hash;
  state: AskQuestionState;
  receivedAt: Time;
  expiresAt: Time;
}
export interface AskRoute {
  workerId: Id;
  reason: "record_provenance" | "follow_up" | "topic" | "generalist" | "fallback";
  explanation: string;
  routingPolicyVersion: Id;
  previousWorkerId: Id | null;
}
export interface AskStatus {
  schemaVersion: AskVersion;
  questionId: Id;
  questionHash: Hash;
  state: AskQuestionState;
  route: AskRoute | null;
  updatedAt: Time;
  safeReason: string | null;
}
export interface AskAnswer {
  schemaVersion: AskVersion;
  serviceId: Id;
  answerId: Id;
  conversationId: Id;
  questionId: Id;
  questionRevision: 1;
  questionHash: Hash;
  workerId: Id;
  routingPolicyVersion: Id;
  generatedAt: Time;
  text: Text;
  /**
   * @minItems 0
   * @maxItems 20
   */
  evidence: ContextRef[];
  knowledgeAsOf: Time | null;
  /**
   * @minItems 0
   * @maxItems 20
   */
  limitations: string[];
  interpretation:
    "general_answer" | "historical_record_explanation" | "new_interpretation" | "clarification" | "refusal";
  /**
   * @maxItems 20
   */
  publicSources: Source[];
}
export interface AskTurn {
  questionId: Id;
  input: AskQuestionInput;
  status: AskStatus;
  answer: AskAnswer | null;
}
export interface AskConversationPage {
  schemaVersion: AskVersion;
  conversation: AskConversation;
  /**
   * @minItems 0
   * @maxItems 8
   */
  turns: AskTurn[];
  nextCursor: Id | null;
}
export interface AskCancel {
  schemaVersion: AskVersion;
  reason: "visitor_cancelled";
}
export interface AskControlReceipt {
  schemaVersion: AskVersion;
  controlId: Id;
  conversationId: Id;
  questionId: Id | null;
  action: "cancel" | "delete" | "expire";
  effectiveAt: Time;
  purgeBy: Time;
  suppressionUntil: Time;
}
export interface AskClaimInput {
  schemaVersion: AskVersion;
  serviceId: Id;
  claimRequestId: Id;
  consumerGeneration: Sequence;
  capacity: 1;
}
export interface AskClaim {
  schemaVersion: AskVersion;
  claimId: Id;
  serviceId: Id;
  consumerGeneration: Sequence;
  leaseExpiresAt: Time;
  question: AskQuestion;
}
export interface AskClaimPage {
  schemaVersion: AskVersion;
  claimRequestId: Id;
  claim: AskClaim | null;
  retryAfterSeconds: number;
}
export interface AskRenewInput {
  schemaVersion: AskVersion;
  serviceId: Id;
  consumerGeneration: Sequence;
  questionId: Id;
  questionHash: Hash;
}
export interface AskAnswerDelivery {
  schemaVersion: AskVersion;
  claimId: Id;
  consumerGeneration: Sequence;
  lastControlSyncId: Id;
  answer: AskAnswer;
}
export interface AskStatusDelivery {
  schemaVersion: AskVersion;
  claimId: Id;
  consumerGeneration: Sequence;
  lastControlSyncId: Id;
  status: AskStatus;
}
export interface AskAnswerReceipt {
  schemaVersion: AskVersion;
  answerId: Id;
  questionId: Id;
  questionHash: Hash;
  answerDigest: Hash;
  receiptId: Id;
  receivedAt: Time;
  disposition: "accepted" | "discarded_cancelled" | "discarded_deleted" | "discarded_expired" | "withheld_evidence";
}
export interface AskControlSyncInput {
  schemaVersion: AskVersion;
  serviceId: Id;
  consumerGeneration: Sequence;
  syncId: Id;
  /**
   * @minItems 0
   * @maxItems 100
   */
  acknowledgedControlIds: Id[];
  after: Id | null;
}
export interface AskControlSync {
  schemaVersion: AskVersion;
  syncId: Id;
  /**
   * @minItems 0
   * @maxItems 100
   */
  controls: AskControlReceipt[];
  nextCursor: Id | null;
  checkedAt: Time;
  validUntil: Time;
}
export interface AskLimits {
  schemaVersion: AskVersion;
  configurationStatus: "synthetic_only" | "owner_approved";
  approvalRecordId: Id | null;
  questionCharacters: number;
  requestBytes: number;
  answerCharacters: number;
  historyTurns: number;
  sessionHourlyQuestions: number;
  sessionDailyQuestions: number;
  outstandingPerSession: 1;
  queueCapacity: number;
  queueTtlSeconds: number;
  sessionTtlSeconds: number;
  rawRetentionSeconds: number;
  suppressionRetentionSeconds: number;
  maxActiveAsk: 1;
  maxAnswerExecutions: 1;
  maxRouterExecutions: number;
  maxResearchCalls: number;
  executionDeadlineSeconds: number;
  dailyExecutions: number;
  dailyTokens: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  dailyBudgetUsd: Decimal | null;
  monetaryEnforcement: "verified_cap" | "unavailable_disable_paid_admission";
  dutyCycleBps: number;
  controlFreshnessSeconds: number;
}
export interface AskWorkerEligibility {
  workerId: Id;
  /**
   * @minItems 1
   * @maxItems 30
   */
  topics: [string, ...string[]];
  /**
   * @minItems 0
   * @maxItems 30
   */
  publicKnowledge: HttpsUrl[];
  researchEnabled: boolean;
  fallbackOrder: number;
  enabled: boolean;
}
export interface AskServiceScope {
  serviceId: Id;
  keyId: Id;
  /**
   * @minItems 1
   * @maxItems 5
   */
  permissions: [
    "claim" | "control_sync" | "status" | "answer" | "receipt",
    ...("claim" | "control_sync" | "status" | "answer" | "receipt")[]
  ];
  consumerGeneration: Sequence;
  expiresAt: Time;
  enabled: boolean;
}
export interface PublisherScope {
  publisherId: Id;
  keyId: Id;
  experimentId: Id;
  runId: Id;
  /**
   * @minItems 1
   * @maxItems 18
   */
  eventTypes: [
    (
      | "run.published"
      | "team.published"
      | "run.status"
      | "worker.activity"
      | "discussion.opened"
      | "discussion.contribution"
      | "discussion.closed"
      | "artifact.registered"
      | "artifact.published"
      | "decision.published"
      | "paper.order"
      | "paper.ledger_transaction"
      | "portfolio.snapshot"
      | "review.published"
      | "content.corrected"
      | "publication.notice"
      | "market.action"
      | "instrument.updated"
    ),
    ...(
      | "run.published"
      | "team.published"
      | "run.status"
      | "worker.activity"
      | "discussion.opened"
      | "discussion.contribution"
      | "discussion.closed"
      | "artifact.registered"
      | "artifact.published"
      | "decision.published"
      | "paper.order"
      | "paper.ledger_transaction"
      | "portfolio.snapshot"
      | "review.published"
      | "content.corrected"
      | "publication.notice"
      | "market.action"
      | "instrument.updated"
    )[]
  ];
  /**
   * @minItems 1
   * @maxItems 5
   */
  contentTypes: [ContentType, ...ContentType[]];
  publicationPolicyVersion: Id;
  expiresAt: Time;
  enabled: boolean;
  generation: Sequence;
  writesPerMinute: number;
  bytesPerDay: number;
}
export interface AskRoster {
  schemaVersion: AskVersion;
  serviceId: Id;
  rosterVersion: Id;
  /**
   * @maxItems 8
   */
  workers: {
    worker: Worker;
    /**
     * @minItems 1
     * @maxItems 30
     */
    topics: [string, ...string[]];
    researchAvailable: boolean;
  }[];
}
export interface RecordDetail {
  schemaVersion: Version;
  experimentId: Id;
  runId: Id;
  record: RecordRef;
  visibility: "published" | "withdrawn" | "withheld";
  event: ReceivedEvent | null;
  safeReason: string | null;
}
