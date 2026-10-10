/** Trusted internal INV-05 library. Deliberately absent from Company, HTTP, workers and schedulers. */
import { Store } from '../persistence/store.js';
import { ensure, SimulationError } from '../domain/investment/arithmetic.js';
import { canonical, hash, id, identity, time } from '../domain/investment/identity.js';
import { initialState, reduce } from '../domain/investment/reducer.js';
import { validateConfiguration } from '../domain/investment/policy.js';
import type { Command, Configuration, Journal, State } from '../domain/investment/types.js';
export type { Command, Configuration, Journal, State } from '../domain/investment/types.js';
export interface SimulationClock { now(): string }
export class FixtureClock implements SimulationClock {
  constructor(private value: string) { time(value); }
  now(): string { return this.value; }
  set(value: string): void { ensure(time(value)>=time(this.value),'clock_moved_backward'); this.value=value; }
}
interface RunRow { run_id: string; configuration: string; configuration_hash: string; evidence_mode: string; created_at: string; head_version: number; head_hash: string | null; checkpoint_hash: string | null }
interface JournalRow { version: number; transaction_id: string; operation_id: string; request_hash: string; previous_hash: string | null; journal_hash: string; recorded_at: string; payload: string }
interface OutboxRow { event_id: string; dependency_event_id: string | null; state: string; projection: string; projection_hash: string }
export interface DisabledProjection {
  format: 'inv05-private-projection-v1'; evidenceMode: 'synthetic_fixture'; runId: string; configurationHash: string;
  journalVersion: string; journalHash: string; ledgerVersion: string; transactionId: string;
  entries: Journal['entries']; outcome: Journal['outcome'];
}
function projection(j: Journal): DisabledProjection {
  return {format:'inv05-private-projection-v1',evidenceMode:'synthetic_fixture',runId:j.runId,configurationHash:j.configurationHash,journalVersion:j.version,journalHash:j.hash,ledgerVersion:j.ledgerVersion,transactionId:j.transactionId,entries:j.entries,outcome:j.outcome};
}
function operation(c: Configuration, command: Command, requestId: string): string {
  switch(command.type) {
    case 'initialize': return identity('init',c.runId);
    case 'decision': return identity('decision',c.runId,command.proposal.decisionId,command.proposal.revision);
    case 'review': return identity('review',c.runId,command.review.id);
    case 'submit': return identity('submit',c.runId,command.decisionId,command.revision,command.orderIndex);
    case 'observe': return identity('observation',c.runId,command.observation.id);
    case 'action': return identity('action',c.runId,command.action.provider,command.action.instrumentId,command.action.providerActionId);
    default: return identity('attempt',c.runId,requestId);
  }
}
function checkpoint(state: State): string { return hash({...state,hash:null}); }
function evaluate(c: Configuration, before: State, command: Command, at: string) {
  try { return reduce(c,before,command,at); }
  catch(error) {
    if (!(error instanceof SimulationError) || command.type==='initialize') throw error;
    // Rejections are immutable evidence; discard all tentative mutations/postings.
    return {state:structuredClone(before),entries:[],outcome:{status:'rejected',reason:error.code,orderId:null,valuation:null,fills:[]}};
  }
}
function effective(command: Command, at: string): string {
  switch(command.type) {
    case 'observe': return command.observation.marketAt;
    case 'action': return command.action.effectiveAt;
    case 'value': return command.asOf;
    default: return at;
  }
}
export class FixtureSimulator {
  constructor(private readonly store: Store, private readonly clock: SimulationClock, private readonly fixtureOperator: string,
    private readonly fault?: (phase: 'before_commit' | 'after_commit') => void) {
    id(fixtureOperator);
    ensure(store.get<{n:number}>('SELECT max(version) n FROM schema_migrations')?.n===16,'incompatible_schema');
    ensure(store.get<{integrity_check:string}>('PRAGMA integrity_check')?.integrity_check==='ok','database_corrupt');
    ensure(store.all('PRAGMA foreign_key_check').length===0,'missing_reference');
  }
  create(configuration: Configuration): Journal {
    const c=JSON.parse(canonical(configuration)) as Configuration; validateConfiguration(c);
    ensure(c.authorization.fixtureOperator===this.fixtureOperator,'fixture_operator_required');
    const at=this.clock.now();
    const result=this.store.transaction(()=>{
      const prior=this.store.get<RunRow>('SELECT * FROM investment_runs WHERE run_id=?',c.runId);
      if(prior) { ensure(prior.configuration_hash===hash(c),'frozen_configuration_conflict'); return this.executeInside(c.runId,{type:'initialize'},'initialization'); }
      ensure(time(at)===time(c.startsAt),'invalid_initialization_time');
      this.store.run('INSERT INTO investment_runs(run_id,configuration,configuration_hash,evidence_mode,created_at) VALUES (?,?,?,?,?)',c.runId,canonical(c),hash(c),'synthetic_fixture',at);
      return this.executeInside(c.runId,{type:'initialize'},'initialization');
    });
    this.fault?.('after_commit'); return result;
  }
  execute(runId: string, command: Command, requestId: string): Journal {
    id(runId); id(requestId); const serialized=canonical(command); ensure(Buffer.byteLength(serialized)<=131072,'command_too_large');
    const result=this.store.transaction(()=>this.executeInside(runId,JSON.parse(serialized) as Command,requestId));
    this.fault?.('after_commit'); return result;
  }
  inspect(runId: string): State { return this.store.transaction(()=>this.replay(runId).state); }
  configuration(runId: string): Configuration { return this.store.transaction(()=>this.replay(runId).configuration); }
  journal(runId: string): Journal[] { return this.store.transaction(()=>{this.replay(runId);return this.store.all<{payload:string}>('SELECT payload FROM investment_journal WHERE run_id=? ORDER BY version',runId).map(r=>JSON.parse(r.payload) as Journal);}); }
  outbox(runId: string): DisabledProjection[] { return this.store.transaction(()=>{this.replay(runId);return this.store.all<{projection:string}>("SELECT projection FROM investment_outbox WHERE run_id=? AND state='disabled' ORDER BY journal_version",runId).map(r=>JSON.parse(r.projection) as DisabledProjection);}); }
  private replay(runId: string): {configuration:Configuration;state:State;row:RunRow} {
    const row=this.store.get<RunRow>('SELECT * FROM investment_runs WHERE run_id=?',runId); ensure(row,'missing_run');
    const configuration=JSON.parse(row.configuration) as Configuration; validateConfiguration(configuration);
    ensure(configuration.runId===runId && hash(configuration)===row.configuration_hash && row.evidence_mode==='synthetic_fixture','configuration_corrupt');
    ensure(configuration.authorization.fixtureOperator===this.fixtureOperator,'fixture_operator_required');
    let state=initialState(configuration),lastTime=time(row.created_at);
    const rows=this.store.all<JournalRow>('SELECT * FROM investment_journal WHERE run_id=? ORDER BY version',runId);
    for(const r of rows) {
      const j=JSON.parse(r.payload) as Journal, {hash:journalHash,...body}=j;
      ensure(j.version===String(BigInt(state.version)+1n) && r.version===Number(j.version) && j.previousHash===state.hash && r.previous_hash===state.hash,'invalid_predecessor');
      ensure(j.runId===runId && j.configurationHash===row.configuration_hash && hash(body)===journalHash && journalHash===r.journal_hash,'journal_hash_mismatch');
      ensure(j.operationId===operation(configuration,j.command,j.originalRequestId) && j.transactionId===identity('transaction',runId,j.operationId),'operation_identity_mismatch');
      ensure(j.transactionId===r.transaction_id && j.operationId===r.operation_id && j.requestHash===r.request_hash && j.recordedAt===r.recorded_at && j.requestHash===hash(j.command),'journal_identity_mismatch');
      ensure(time(j.recordedAt)>=lastTime,'journal_clock_reversal'); lastTime=time(j.recordedAt);
      const result=evaluate(configuration,state,j.command,j.recordedAt);
      ensure(canonical(result.entries)===canonical(j.entries) && canonical(result.outcome)===canonical(j.outcome),'journal_replay_mismatch');
      ensure(j.previousLedgerVersion===state.ledgerVersion,'ledger_predecessor_mismatch');
      result.state.version=j.version; result.state.ledgerVersion=String(BigInt(state.ledgerVersion)+(j.entries.length ? 1n : 0n));
      ensure(j.ledgerVersion===result.state.ledgerVersion && checkpoint(result.state)===j.checkpointHash,'checkpoint_mismatch');
      state=result.state; state.hash=journalHash;
      const o=this.store.get<OutboxRow>('SELECT * FROM investment_outbox WHERE run_id=? AND journal_version=?',runId,r.version),p=projection(j);
      ensure(o && o.state==='disabled' && o.event_id===identity('event',runId,j.version) && o.dependency_event_id===(r.version===1?null:identity('event',runId,String(r.version-1))) && o.projection===canonical(p) && o.projection_hash===hash(p),'outbox_mismatch');
      const original=this.store.get<{journal_version:number}>('SELECT journal_version FROM investment_receipts WHERE run_id=? AND request_id=?',runId,j.originalRequestId);
      ensure(original?.journal_version===r.version,'receipt_identity_mismatch');
      ensure(this.store.all<{request_id:string}>('SELECT request_id FROM investment_receipts WHERE run_id=? AND journal_version=?',runId,r.version).every(receipt=>operation(configuration,j.command,receipt.request_id)===j.operationId),'receipt_identity_mismatch');
    }
    ensure(rows.length===row.head_version && state.hash===row.head_hash && (row.head_version===0 || checkpoint(state)===row.checkpoint_hash),'truncated_or_corrupt_history');
    ensure(this.store.get<{n:number}>('SELECT count(*) n FROM investment_outbox WHERE run_id=?',runId)!.n===rows.length,'outbox_count_mismatch');
    ensure(this.store.all<{request_hash:string;actual:string}>('SELECT r.request_hash,j.request_hash actual FROM investment_receipts r JOIN investment_journal j ON r.run_id=j.run_id AND r.journal_version=j.version WHERE r.run_id=?',runId).every(r=>r.request_hash===r.actual),'receipt_hash_mismatch');
    ensure(rows.every(j=>this.store.get('SELECT 1 FROM investment_receipts WHERE run_id=? AND journal_version=?',runId,j.version)),'missing_receipt');
    return {configuration,state,row};
  }
  private executeInside(runId: string, command: Command, requestId: string): Journal {
    const {configuration:c,state:before}=this.replay(runId),requestHash=hash(command),op=operation(c,command,requestId);
    const receipt=this.store.get<{request_hash:string;journal_version:number}>('SELECT * FROM investment_receipts WHERE run_id=? AND request_id=?',runId,requestId);
    if(receipt) { ensure(receipt.request_hash===requestHash,'request_identity_conflict'); return JSON.parse(this.store.get<{payload:string}>('SELECT payload FROM investment_journal WHERE run_id=? AND version=?',runId,receipt.journal_version)!.payload) as Journal; }
    const existing=this.store.get<JournalRow>('SELECT * FROM investment_journal WHERE run_id=? AND operation_id=?',runId,op);
    if(existing) {
      ensure(existing.request_hash===requestHash,'semantic_identity_conflict');
      this.store.run('INSERT INTO investment_receipts VALUES (?,?,?,?)',runId,requestId,requestHash,existing.version);
      return JSON.parse(existing.payload) as Journal;
    }
    ensure(BigInt(before.version)<100_000n,'journal_budget_exhausted');
    const at=this.clock.now(); const latest=this.store.get<{recorded_at:string}>('SELECT recorded_at FROM investment_journal WHERE run_id=? ORDER BY version DESC LIMIT 1',runId);
    ensure(time(at)>=time(latest?.recorded_at ?? c.startsAt),'clock_moved_backward');
    const result=evaluate(c,before,command,at),version=String(BigInt(before.version)+1n);
    result.state.version=version; result.state.ledgerVersion=String(BigInt(before.ledgerVersion)+(result.entries.length?1n:0n));
    const economicAt=result.outcome.status==='rejected'?at:command.type==='dividend_payment'?before.actions.find(a=>a.id===command.actionId)?.paymentAt ?? at:effective(command,at);
    const body={transactionId:identity('transaction',runId,op),runId,version,previousHash:before.hash,configurationHash:hash(c),ledgerVersion:result.state.ledgerVersion,previousLedgerVersion:before.ledgerVersion,
      operationId:op,originalRequestId:requestId,requestHash,eventAt:economicAt,effectiveAt:result.outcome.status==='rejected'?at:result.outcome.fills[0]?.effectiveAt ?? economicAt,recordedAt:at,command,entries:result.entries,outcome:result.outcome,checkpointHash:checkpoint(result.state)};
    const j:Journal={...body,hash:hash(body)},p=projection(j);
    this.store.run('INSERT INTO investment_journal VALUES (?,?,?,?,?,?,?,?,?)',runId,Number(version),j.transactionId,op,requestHash,before.hash,j.hash,at,canonical(j));
    this.store.run('INSERT INTO investment_outbox VALUES (?,?,?,?,?,?,?)',runId,Number(version),identity('event',runId,version),before.version==='0'?null:identity('event',runId,before.version),'disabled',canonical(p),hash(p));
    this.store.run('INSERT INTO investment_receipts VALUES (?,?,?,?)',runId,requestId,requestHash,Number(version));
    this.store.run('UPDATE investment_runs SET head_version=?,head_hash=?,checkpoint_hash=? WHERE run_id=?',Number(version),j.hash,j.checkpointHash,runId);
    this.fault?.('before_commit'); return j;
  }
}
