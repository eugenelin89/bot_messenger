import {randomUUID} from 'node:crypto';
import type {Company} from '../company.js';
import {requireThat,strictObject,textField} from '../../domain/model.js';
import type {ReplyRequest} from '../../domain/conversations.js';
import type {WorkingGroup} from '../../domain/discussions.js';
import {DISCUSSION_LIMITS} from '../../domain/discussions.js';
import type {Loop,LoopEnvelope,Occurrence,Stage,InvestmentUsage} from '../../domain/investment-loop/types.js';
import type {TurnLimits} from '../../domain/investment-team/types.js';
import {hash,integer,time} from '../../domain/investment/identity.js';
import type {Command,Journal} from '../../domain/investment/types.js';
import {expiry} from '../../domain/investment/policy.js';
import {FixtureSimulator} from '../investment.js';
import {MarketStore} from '../market/store.js';
import {MarketFixtureSimulator} from '../market/admission.js';
import {requireUses} from '../../domain/market/validation.js';
import type {SourcePolicy} from '../../domain/market/types.js';
const iso=(n:number)=>new Date(n).toISOString();
const day=(at:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
const amount=(v:unknown,min:number,max:number)=>{requireThat(typeof v==='number','Finite numeric limit required');integer(v,min,max);return v;};
export class InvestmentLoop {
 constructor(readonly company:Company){}
 /** Isolated acceptance fault injection only. */
 fault?:(point:string)=>void;
 private get db(){return this.company.store;}
 now(){return this.company.investmentTeam.now();}
 get(loopId:string){const l=this.db.get<Loop>('SELECT * FROM investment_loops WHERE loop_id=?',loopId);requireThat(l,'Investment loop missing');return l;}
 forScope(scopeId:string){return this.db.get<Loop>('SELECT * FROM investment_loops WHERE scope_id=?',scopeId);}
 forGroup(groupId:string){const s=this.company.investmentTeam.forGroup(groupId);return s?this.forScope(s.scope_id):undefined;}
 envelope(l:Loop){const e=JSON.parse(l.envelope) as LoopEnvelope;requireThat(hash({envelope:e,scope:this.company.investmentTeam.scope(l.scope_id).digest})===l.digest,'Loop envelope integrity failed');return e;}
 private scope(l:Loop){return this.company.investmentTeam.scope(l.scope_id);}
 private team(l:Loop){return this.company.investmentTeam.envelope(this.scope(l));}
 private configuration(l:Loop){return this.company.investmentTeam.configuration(this.scope(l));}
 private sim(l:Loop){const c=this.configuration(l);return new FixtureSimulator(this.db,{now:()=>this.now()},c.authorization.fixtureOperator);}
 private market(l:Loop){return this.company.investmentTeam.market(this.scope(l));}
 private rawMarket(l:Loop){return new MarketFixtureSimulator(new MarketStore(this.db),{now:()=>this.now()},this.configuration(l).authorization.fixtureOperator);}
 occurrences(l:Loop){return this.db.all<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE loop_id=? AND plan_revision=? ORDER BY due_at,stage',l.loop_id,l.plan_revision);}
 private running(l:Loop){return this.db.get<Occurrence>("SELECT * FROM investment_loop_occurrences WHERE loop_id=? AND stage='research' AND state='running'",l.loop_id);}
 private session(l:Loop,date:string){const s=this.configuration(l).calendar.sessions.find(s=>s.date===date&&s.status==='open');requireThat(s,'Session outside frozen calendar');return s;}
 private limits(value:unknown):TurnLimits {const a=strictObject(value,['inputTokens','outputTokens','maxCostMicros']);return {inputTokens:amount(a.inputTokens,1,4000000),outputTokens:amount(a.outputTokens,1,640000),maxCostMicros:amount(a.maxCostMicros,0,400000000)};}
 preview(input:unknown){this.company.conversations.human();return this.db.transaction(()=>{
  const a=strictObject(input,['scopeId','sessions','researchMinutes','maxCycleExecutions','maxDailyExecutions','maxRunExecutions','dailyLimits','runLimits','maxStageAttempts','retrySeconds']);
  const scope=this.company.investmentTeam.scope(textField(a,'scopeId',100)),team=this.company.investmentTeam.envelope(scope),c=this.company.investmentTeam.configuration(scope),g=this.company.discussions.group(scope.group_id);
  requireThat(scope.state==='active'&&g.state==='draft'&&!this.db.get('SELECT 1 FROM investment_team_executions WHERE scope_id=?',scope.scope_id),'Select an approved fresh team with no execution history');
  requireThat(time(this.now())<time(team.expiresAt)&&this.simForScope(scope.scope_id).inspect(scope.run_id).lifecycle==='active','Current finite team and run authority required');
  requireThat(Array.isArray(a.sessions)&&a.sessions.length>=1&&a.sessions.length<=8&&a.sessions.every(s=>typeof s==='string')&&new Set(a.sessions).size===a.sessions.length,'Choose one to eight explicit calendar sessions');
  const e:LoopEnvelope={scopeId:scope.scope_id,sessions:[...a.sessions as string[]].sort(),researchMinutes:amount(a.researchMinutes,1,120),maxCycleExecutions:amount(a.maxCycleExecutions,2,24),maxDailyExecutions:amount(a.maxDailyExecutions,2,40),maxRunExecutions:amount(a.maxRunExecutions,2,40),dailyLimits:this.limits(a.dailyLimits),runLimits:this.limits(a.runLimits),maxStageAttempts:amount(a.maxStageAttempts,1,5),retrySeconds:amount(a.retrySeconds,1,3600)};
  requireThat(e.maxCycleExecutions<=e.maxDailyExecutions&&e.maxDailyExecutions<=e.maxRunExecutions&&e.maxRunExecutions<=Math.min(team.maxExecutions,g.turn_limit),'Loop execution bounds exceed approved cumulative team/group capacity');
  requireThat(team.participants.length+(e.sessions.length-1)*2+g.turns_used+DISCUSSION_LIMITS.reservedTurns<=e.maxRunExecutions&&e.maxCycleExecutions>=team.participants.length,'Reserve at least two turns per session and final synthesis capacity');
  for(const k of ['inputTokens','outputTokens','maxCostMicros'] as const)requireThat(team.turnLimits[k]<=e.dailyLimits[k]&&e.dailyLimits[k]<=e.runLimits[k],'Aggregate limit cannot admit the approved per-turn reservation');
  const benchmark=this.simForScope(scope.scope_id).inspect(scope.run_id).benchmarkNextOpen;requireThat(!benchmark||e.sessions[0]===benchmark,'The first session must include the frozen benchmark opening; no omitted or backdated allocation');
  const plan=e.sessions.map(date=>{const s=c.calendar.sessions.find(s=>s.date===date&&s.status==='open');requireThat(s,'Session outside the frozen open calendar');const cutoff=time(s.open)-c.cutoffMinutes*60000,research=cutoff-e.researchMinutes*60000;requireThat(research>time(this.now())&&research>=time(c.startsAt)&&time(s.close)<Math.min(time(team.expiresAt),time(c.endsAt)),'Choose future sessions wholly within finite run/team authority');return {session:date,research:iso(research),cutoff:iso(cutoff),open:s.open,expire:expiry(c,s),mark:s.close,markEnd:iso(Math.min(time(s.close)+c.maxMarkAgeSeconds*1000,time(team.expiresAt)-1,time(c.endsAt)-1))};});
  const digest=hash({envelope:e,scope:scope.digest}),old=this.forScope(scope.scope_id);if(old?.digest===digest)return this.previewResult(old,plan);if(old)requireThat(old.state==='draft','Approved loop envelope is immutable');
  const loopId=old?.loop_id??randomUUID(),generation=(old?.generation??0)+1;if(old){this.db.run('UPDATE investment_loops SET envelope=?,digest=?,generation=?,plan_revision=?,updated_at=? WHERE loop_id=?',JSON.stringify(e),digest,generation,generation,this.now(),loopId);this.db.run("UPDATE investment_loop_occurrences SET state='cancelled',reason='Draft superseded' WHERE loop_id=? AND state='pending'",loopId);}else this.db.run("INSERT INTO investment_loops VALUES (?,?,?,?,'draft',1,1,NULL,?,?)",loopId,scope.scope_id,JSON.stringify(e),digest,this.now(),this.now());
  for(const p of plan)for(const stage of ['research','cutoff','open','expire','mark'] as Stage[]){const expires=stage==='research'?p.cutoff:stage==='open'?p.expire:stage==='mark'?p.markEnd:p[stage];this.db.run("INSERT INTO investment_loop_occurrences VALUES (?,?,?,?,?,?,?,?,'pending',?,0,NULL,NULL,NULL,?,?)",`loop_${hash([loopId,generation,p.session,stage])}`,loopId,digest,generation,p.session,stage,p[stage],expires,generation,this.now(),this.now());}
  const l=this.get(loopId),preview=this.previewResult(l,plan);this.db.run('INSERT INTO investment_loop_previews VALUES (?,?,?,?,?)',randomUUID(),loopId,digest,JSON.stringify(preview),this.now());return preview;
 });}
 private simForScope(scopeId:string){const s=this.company.investmentTeam.scope(scopeId),c=this.company.investmentTeam.configuration(s);return new FixtureSimulator(this.db,{now:()=>this.now()},c.authorization.fixtureOperator);}
 private previewResult(l:Loop,plan:unknown){return {loopId:l.loop_id,digest:l.digest,envelope:this.envelope(l),plan,derivedCycleReservation:{inputTokens:this.envelope(l).maxCycleExecutions*this.team(l).turnLimits.inputTokens,outputTokens:this.envelope(l).maxCycleExecutions*this.team(l).turnLimits.outputTokens,maxCostMicros:this.envelope(l).maxCycleExecutions*this.team(l).turnLimits.maxCostMicros},team:this.team(l),configuration:this.configuration(l),notice:'Explicit start admits finite due work. No production activation. Budget days use America/New_York. Reservations never refund; missing measured usage is unknown. No post-stop valuation or automatic prose publication.'};}
 requireScope(scopeId:string){const l=this.forScope(scopeId);if(l)requireThat(l.state==='active','Investment loop is held or ended');}
 private authority(l:Loop,resuming=false){
  const s=this.scope(l),t=this.team(l),g=this.company.discussions.group(s.group_id);requireThat(s.state==='active'&&time(this.now())<time(t.expiresAt),'Current team scope is inactive or expired');
  requireThat(s.group_scope===g.scope_version&&hash(this.company.discussions.members(g).map(w=>w.worker_id).sort())===hash(t.participants.map(p=>p.workerId).sort()),'Loop sharing or membership changed');
  requireThat(t.participants.every(p=>this.company.discussions.eligible().some(w=>w.worker_id===p.workerId)),'Loop participant unavailable');
  const c=this.configuration(l);requireThat(time(this.now())<time(c.endsAt),'Run horizon ended');
  if(resuming)requireThat(!t.participants.some(p=>this.company.providerUnresolved(p.workerId))&&!this.unknown(l),'Reconcile provider and usage uncertainty before resuming');
  const p=new MarketStore(this.db).get<SourcePolicy>(c.marketPolicy.id,'policy');requireUses(p,['automation','internal_calculation','retention'],this.now());
 }
 private unknown(l:Loop){return !!this.db.get("SELECT 1 FROM investment_loop_executions le JOIN investment_loop_occurrences o USING(occurrence_id) JOIN executions x USING(execution_id) LEFT JOIN investment_loop_usage u USING(execution_id) WHERE o.loop_id=? AND (u.state IN ('unknown','exceeded') OR u.execution_id IS NULL AND x.status!='running')",l.loop_id);}
 private totals(l:Loop,where='',params:string[]=[]){return this.db.get<{executions:number;inputTokens:number;outputTokens:number;maxCostMicros:number}>(`SELECT count(*) executions,coalesce(sum(te.input_limit),0) inputTokens,coalesce(sum(te.output_limit),0) outputTokens,coalesce(sum(te.cost_limit),0) maxCostMicros FROM investment_loop_executions le JOIN investment_team_executions te USING(execution_id) JOIN investment_loop_occurrences o USING(occurrence_id) WHERE o.loop_id=? ${where}`,l.loop_id,...params)!;}
 private budget(l:Loop,o:Occurrence){const e=this.envelope(l),t=this.team(l),run=this.totals(l),daily=this.totals(l,'AND le.day=?',[day(this.now())]),cycle=this.totals(l,'AND le.occurrence_id=?',[o.occurrence_id]);requireThat(!this.unknown(l),'Measured investment usage is unknown or exceeded; no further model admission');requireThat(run.executions<e.maxRunExecutions&&daily.executions<e.maxDailyExecutions&&cycle.executions<e.maxCycleExecutions,'Investment loop execution budget exhausted');for(const k of ['inputTokens','outputTokens','maxCostMicros'] as const)requireThat(run[k]+t.turnLimits[k]<=e.runLimits[k]&&daily[k]+t.turnLimits[k]<=e.dailyLimits[k],'Investment loop token or cost reservation exhausted');}
 bindRequest(groupId:string,requestId:string){const l=this.forGroup(groupId);if(!l)return;const o=this.running(l);requireThat(l.state==='active'&&o&&o.generation===l.generation&&time(this.now())<time(o.expires_at),'No current loop occurrence for discussion request');this.db.run('INSERT INTO investment_loop_requests VALUES (?,?,?)',requestId,o.occurrence_id,l.generation);}
 authorize(scopeId:string,r:ReplyRequest){const l=this.forScope(scopeId);if(!l)return;this.requireScope(scopeId);this.authority(l);const binding=this.db.get<{occurrence_id:string;generation:number}>('SELECT * FROM investment_loop_requests WHERE request_id=?',r.request_id),o=binding?this.db.get<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE occurrence_id=?',binding.occurrence_id):undefined;requireThat(o&&o.loop_id===l.loop_id&&o.state==='running'&&binding?.generation===l.generation&&o.generation===l.generation&&time(this.now())>=time(o.due_at)&&time(this.now())<time(o.expires_at),'Investment occurrence is stale or outside its dispatch window');if(r.status==='queued')this.budget(l,o);}
 reserve(scopeId:string,r:ReplyRequest,executionId:string){const l=this.forScope(scopeId);if(!l)return;this.authorize(scopeId,r);const b=this.db.get<{occurrence_id:string}>('SELECT * FROM investment_loop_requests WHERE request_id=?',r.request_id)!,o=this.db.get<Occurrence>('SELECT * FROM investment_loop_occurrences WHERE occurrence_id=?',b.occurrence_id)!;this.budget(l,o);this.db.run('INSERT INTO investment_loop_executions VALUES (?,?,?,?,?)',executionId,o.occurrence_id,l.generation,day(this.now()),this.now());}
 settle(executionId:string,usage?:InvestmentUsage){const binding=this.db.get('SELECT 1 FROM investment_loop_executions WHERE execution_id=?',executionId);if(!binding||this.db.get('SELECT 1 FROM investment_loop_usage WHERE execution_id=?',executionId))return;const limits=this.company.investmentTeam.limits(executionId)!;const valid=usage&&['inputTokens','outputTokens','costMicros'].every(k=>Number.isSafeInteger(usage[k as keyof InvestmentUsage])&&usage[k as keyof InvestmentUsage]>=0);const state=!valid?'unknown':usage.inputTokens>limits.inputTokens||usage.outputTokens>limits.outputTokens||usage.costMicros>limits.maxCostMicros?'exceeded':'measured';this.db.run('INSERT INTO investment_loop_usage VALUES (?,?,?,?,?,?)',executionId,state,valid?usage.inputTokens:null,valid?usage.outputTokens:null,valid?usage.costMicros:null,this.now());this.fault?.('usage_before_settlement');}
 private update(o:Occurrence,state:Occurrence['state'],reason:string|null=null,result:unknown=null,retry:string|null=null){this.db.run('UPDATE investment_loop_occurrences SET state=?,reason=?,result=?,retry_at=?,updated_at=? WHERE occurrence_id=?',state,reason,result===null?o.result:JSON.stringify(result),retry,this.now(),o.occurrence_id);}
 private cancelModel(l:Loop,reason:string){const g=this.company.discussions.group(this.scope(l).group_id);this.db.run("UPDATE conversation_requests SET status='cancelled',error=?,updated_at=? WHERE status='queued' AND request_id IN (SELECT lr.request_id FROM investment_loop_requests lr JOIN investment_loop_occurrences o USING(occurrence_id) WHERE o.loop_id=?)",reason,this.now(),l.loop_id);if(!['completed','archived','stopped'].includes(g.state))this.db.run("UPDATE working_groups SET state='paused',deadline=NULL,error=? WHERE group_id=?",reason,g.group_id);this.company.emit('investment_interrupt',l.scope_id);}
 private block(l:Loop,reason:string){this.cancelModel(l,reason);this.db.run("UPDATE investment_loops SET state='blocked',reason=?,generation=generation+1,updated_at=? WHERE loop_id=?",reason,this.now(),l.loop_id);const o=this.running(l);if(o)this.update(o,'blocked',reason);this.sim(l).execute(this.scope(l).run_id,{type:'control',state:'paused'},`loop_block_${l.loop_id}_${l.generation}`);}
 control(input:unknown){this.company.conversations.human();const a=strictObject(input,['loopId','action','digest','receiptId','orderId']),loopId=textField(a,'loopId',100),receiptId=textField(a,'receiptId',100),action=textField(a,'action',30);return this.db.transaction(()=>{
  const l=this.get(loopId),requestHash=hash(a),old=this.db.get<{request_hash:string;result:string}>('SELECT * FROM investment_loop_controls WHERE receipt_id=?',receiptId);if(old){requireThat(old.request_hash===requestHash,'Loop receipt payload mismatch');return JSON.parse(old.result);}
  const s=this.scope(l),sim=this.sim(l);let result:unknown;
  if(action==='start'){requireThat(l.state==='draft'&&a.digest===l.digest,'Exact draft loop consent required');this.authority(l,true);requireThat(this.company.discussions.group(s.group_id).state==='draft'&&!this.db.get('SELECT 1 FROM investment_team_executions WHERE scope_id=?',l.scope_id),'Loop preview context is no longer fresh');requireThat(this.occurrences(l).filter(o=>o.state==='pending').every(o=>o.due_at>this.now()),'Loop preview is stale; do not start missed work');this.db.run("UPDATE investment_loops SET state='active',updated_at=? WHERE loop_id=?",this.now(),loopId);}
  else if(action==='pause'||action==='stop'){
   requireThat(l.state!=='stopped'&&l.state!=='finished'&&l.state!=='draft','Start or inspect the loop first');const state=action==='pause'?'paused':'ended';result=sim.execute(s.run_id,{type:'control',state},`loop_owner_${receiptId}`);this.cancelModel(l,`Investment run ${action}`);if(action==='stop')this.db.run("UPDATE working_groups SET state='stopped',deadline=NULL WHERE group_id=? AND state!='completed'",s.group_id);this.db.run('UPDATE investment_loops SET state=?,generation=generation+1,reason=?,updated_at=? WHERE loop_id=?',action==='pause'?'paused':'stopped',`Owner ${action}`,this.now(),loopId);
   this.db.run("UPDATE investment_loop_occurrences SET state='cancelled',reason=?,retry_at=NULL,updated_at=? WHERE loop_id=? AND (state='running' OR (?='stop' AND state='pending'))",`Owner ${action}`,this.now(),loopId,action);
  }else if(action==='resume'){
   requireThat(l.state==='paused'||l.state==='blocked','Only held loops can resume');requireThat(this.occurrences(l).some(o=>o.state==='pending'&&o.stage!='expire'&&time(o.due_at)>time(this.now())),'No eligible future work remains; ended cycles cannot be replayed');this.authority(l,true);requireThat(!this.company.discussions.activeExecutions(s.group_id).length,'Active model work has not settled');this.company.publication.requireNewRisk(this.team(l).publicationChannelId);
   result=sim.execute(s.run_id,{type:'control',state:'active'},`loop_owner_${receiptId}`);requireThat(result&& (result as Journal).outcome.status==='active','Run could not resume');
   this.db.run("UPDATE investment_loop_occurrences SET state='missed',reason='Window elapsed during hold; never replayed',retry_at=NULL,updated_at=? WHERE loop_id=? AND state='pending' AND stage!='expire' AND due_at<=?",this.now(),loopId,this.now());this.db.run("UPDATE investment_loops SET state='active',generation=generation+1,reason=NULL,updated_at=? WHERE loop_id=?",this.now(),loopId);
  }else if(action==='cancel_order'){const orderId=textField(a,'orderId',100);result=sim.execute(s.run_id,{type:'cancel',orderId},`loop_owner_${receiptId}`);}
  else requireThat(false,'Unknown investment run control');
  this.fault?.('control_before_commit');const reply={loop:this.get(loopId),result:result??null,notice:'Completed fills and provider uncertainty are retained. Cancelled orders and missed cycles never resume.'};this.db.run('INSERT INTO investment_loop_controls VALUES (?,?,?,?,?)',receiptId,loopId,requestHash,JSON.stringify(reply),this.now());this.company.emit('changed');return reply;
 });}
 /** Called at the natural would-synthesize boundary, never from model text directly. */
 waitBetweenCycles(g:WorkingGroup){const l=this.forGroup(g.group_id);if(!l||l.state!=='active')return false;const o=this.running(l);if(!o)return false;const future=this.occurrences(l).some(n=>n.stage==='research'&&n.state==='pending'&&n.due_at>o.due_at);if(!future)return false;
  this.update(o,'complete','Waiting for next calendar cycle',{groupRevision:g.revision,evidenceRevision:g.evidence_revision});this.db.run("UPDATE working_groups SET state='paused',deadline=NULL,error='Waiting for next calendar cycle' WHERE group_id=?",g.group_id);return true;
 }
 expireResearchForGroup(groupId:string){const l=this.forGroup(groupId),o=l?this.running(l):undefined;if(!l||l.state!=='active'||!o||time(this.now())<time(o.expires_at))return false;this.update(o,'missed','Research cutoff elapsed');this.cancelModel(l,'Research cutoff elapsed; no late paper decisions');const cutoff=this.occurrences(l).find(n=>n.stage==='cutoff'&&n.session===o.session&&n.state==='pending');if(cutoff)this.update(cutoff,'complete');return true;}
 cycleForGroup(groupId:string){const l=this.forGroup(groupId);return l?this.running(l):undefined;}
 clockForGroup(groupId:string){return this.forGroup(groupId)?time(this.now()):Date.now();}
 admitCommand(scopeId:string,command:Exclude<Command,{type:'observe'}>){const l=this.forScope(scopeId);if(!l)return;
  if(command.type==='decision'||command.type==='review'||command.type==='submit'){const o=this.running(l);requireThat(o&&time(this.now())<time(o.expires_at),'Paper decisions require the current research occurrence');if(command.type==='submit'){const d=this.sim(l).inspect(this.scope(l).run_id).decisions[`${command.decisionId}:${command.revision}`];requireThat(d?.orders[command.orderIndex]?.targetSession===o.session,'Order must target this occurrence session');}}
  const state=this.sim(l).inspect(this.scope(l).run_id),buy=command.type==='submit'?state.decisions[`${command.decisionId}:${command.revision}`]?.orders[command.orderIndex]?.side==='BUY':command.type==='fill'?state.orders[command.orderId]?.side==='BUY':command.type==='benchmark_open';
  if(buy)requireThat(!this.occurrences(l).some(o=>['blocked','missed'].includes(o.state)&&(o.stage==='open'||o.stage==='mark'))&&(!state.valuations.length||state.valuations.at(-1)?.snapshot.quality==='complete'),'Loop data health blocks new risk');
 }
 private capture(l:Loop){this.db.db.exec('SAVEPOINT investment_capture');try{this.company.publication.capture({channelId:this.team(l).publicationChannelId});this.db.db.exec('RELEASE investment_capture');return null;}catch(e){this.db.db.exec('ROLLBACK TO investment_capture; RELEASE investment_capture');return String(e).slice(0,600);}}
 private intake(l:Loop,session:string,field:'regular_open'|'regular_close'){
  const market=new MarketStore(this.db),c=this.configuration(l),allowed=new Set([...c.instruments.map(i=>i.id),c.benchmark.instrument.id]),all=market.prices();
  for(const p of all.filter(p=>p.session===session&&p.field===field&&allowed.has(p.instrumentId)&&!all.some(n=>n.correctionOf===p.id)))this.rawMarket(l).observe(c.runId,p.id);
 }
 private runStage(l:Loop,o:Occurrence){
  const c=this.configuration(l),s=this.session(l,o.session),request=`${o.occurrence_id}_${o.attempts+1}`,market=this.market(l),before=market.inspect(c.runId),results:Journal[]=[];
  if(o.stage==='open'){
   const issues:string[]=[];this.intake(l,o.session,'regular_open');this.capture(l);
   for(const order of Object.values(before.orders).filter(x=>x.targetSession===o.session&&x.status==='pending')){this.db.db.exec('SAVEPOINT investment_order');try{this.capture(l);results.push(market.execute(c.runId,{type:'fill',orderId:order.id},`${request}_${order.id}`));this.db.db.exec('RELEASE investment_order');}catch(e){this.db.db.exec('ROLLBACK TO investment_order; RELEASE investment_order');issues.push(String(e).slice(0,600));}}
   const current=market.inspect(c.runId);if(current.benchmarkNextOpen&&current.benchmarkNextOpen<o.session)issues.push('Earlier frozen benchmark opening is unresolved; no backdated allocation');if(current.benchmarkNextOpen===o.session){try{this.capture(l);this.company.publication.requireNewRisk(this.team(l).publicationChannelId);results.push(market.execute(c.runId,{type:'benchmark_open',session:o.session},`${request}_benchmark`));}catch(e){issues.push(String(e).slice(0,600));}}
   for(const r of results)if(r.outcome.status==='rejected'&&!(r.command.type==='fill'&&market.inspect(c.runId).orders[r.command.orderId]?.status==='rejected'))issues.push(`Retained ${r.command.type} rejection: ${r.outcome.reason}`);
   const waiting=issues.length>0||results.some(r=>r.outcome.status==='data_blocked'||r.outcome.status==='pending');return {waiting,results,issues};
  }
  this.intake(l,o.session,'regular_close');const current=market.inspect(c.runId);
  const open=this.occurrences(l).find(n=>n.stage==='open'&&n.session===o.session)!;
  requireThat(!['pending','running'].includes(open.state),'Opening stage has not settled; valuation waits');
  const needed=[...Object.entries(current.portfolio.positions).filter(([,p])=>Number(p.quantity)>0).map(([id])=>id),...Object.entries(current.benchmark.positions).filter(([,p])=>Number(p.quantity)>0).map(([id])=>id)];
  const missing=needed.some(id=>!current.observations.some(p=>p.instrumentId===id&&p.session===o.session&&p.field==='regular_close'&&p.quality==='verified'));
  if(missing&&o.attempts+1<this.envelope(l).maxStageAttempts&&time(this.now())<time(o.expires_at))return {waiting:true,results};
  results.push(market.execute(c.runId,{type:'value',session:o.session,asOf:s.close},`${request}_value`));return {waiting:false,results};
 }
 private deterministic(l:Loop,o:Occurrence){const e=this.envelope(l);this.db.db.exec('SAVEPOINT investment_stage');let result:unknown,waiting=false,reason:string|null=null;
  try{const r=this.runStage(l,o);result=r;waiting=r.waiting;const failure=o.stage==='open'?undefined:r.results.find(j=>j.outcome.status==='rejected');if(failure)throw Error(`Deterministic stage rejected: ${failure.outcome.reason}`);this.fault?.('journal_before_stage');this.db.db.exec('RELEASE investment_stage');}
  catch(error){this.db.db.exec('ROLLBACK TO investment_stage; RELEASE investment_stage');result={error:String(error).slice(0,600)};waiting=true;reason=String(error).slice(0,600);}
  const attempts=o.attempts+1,exhausted=attempts>=e.maxStageAttempts||time(this.now())>=time(o.expires_at),state=waiting?(exhausted?'blocked':'pending'):'complete';
  this.db.run('INSERT INTO investment_loop_attempts VALUES (?,?,?,?,?,?)',`${o.occurrence_id}_${attempts}`,o.occurrence_id,attempts,state,JSON.stringify(result),this.now());this.db.run('UPDATE investment_loop_occurrences SET attempts=? WHERE occurrence_id=?',attempts,o.occurrence_id);
  this.update(o,state,waiting?(reason??'Verified source or publication evidence is unavailable'):null,result,state==='pending'?iso(Math.min(time(o.expires_at),time(this.now())+e.retrySeconds*1000)):null);this.capture(l);
 }
 tick(){
  for(const snapshot of this.db.all<Loop>("SELECT * FROM investment_loops l WHERE state='active' OR state IN ('paused','blocked') AND EXISTS(SELECT 1 FROM investment_loop_occurrences o WHERE o.loop_id=l.loop_id AND o.stage='expire' AND o.state='pending' AND o.due_at<=?) ORDER BY created_at",this.now()))this.db.transaction(()=>{
   let l=this.get(snapshot.loop_id);const now=time(this.now());
   // Cleanup is trusted and model-free, independent of source/publication/team permissions.
   for(const o of this.occurrences(l).filter(o=>o.stage==='expire'&&o.state==='pending'&&time(o.due_at)<=now)){
    const sim=this.sim(l),run=this.scope(l).run_id,state=sim.inspect(run),results=[];for(const order of Object.values(state.orders).filter(x=>x.targetSession===o.session&&x.status==='pending'))results.push(sim.execute(run,{type:'expire',orderId:order.id},`${o.occurrence_id}_${order.id}`));this.update(o,'complete',null,results);
   }
   if(l.state!=='active')return;
   try{this.authority(l);requireThat(!this.unknown(l),'Investment usage unknown or exceeded; inspect original execution');}catch(error){this.block(l,String(error).slice(0,600));return;}
   this.expireResearchForGroup(this.scope(l).group_id);const running=this.running(l),g=this.company.discussions.group(this.scope(l).group_id);
   if(running&&g.state==='completed')this.update(running,'complete',null,{groupRevision:g.revision});
   else if(running&&g.state==='blocked'){this.block(l,'Discussion or provider outcome blocked; no automatic model retry');return;}
   for(const o of this.occurrences(l).filter(o=>o.state==='pending'&&o.stage!=='expire'&&time(o.retry_at??o.due_at)<=now).slice(0,32)){
    if(o.stage==='cutoff'){
     const r=this.running(l);if(r?.session===o.session){this.update(r,'missed','Research cutoff elapsed');this.cancelModel(l,'Research cutoff elapsed; no late paper decisions');}
     this.update(o,'complete');continue;
    }
    if(o.stage==='research'){
     if(now>=time(o.expires_at)){this.update(o,'missed','Missed research window; no catch-up model dispatch');continue;}
     if(this.company.paused){this.update(o,'pending','Company model dispatch is paused');continue;}
     try{
      requireThat(!this.running(l),'Earlier research occurrence remains open');requireThat(!this.company.discussions.activeExecutions(g.group_id).length&&!this.team(l).participants.some(p=>this.company.providerUnresolved(p.workerId)),'Prior model outcome or active turn prevents another cycle');
      requireThat(this.company.investmentTeam.runtime?.runBoundedInvestment,'Bounded investment runtime unavailable');this.budget(l,o);
      requireThat(!this.db.get("SELECT 1 FROM group_syntheses WHERE group_id=? AND state='final'",g.group_id),'Final investment discussion cannot reopen');
      this.db.run("UPDATE investment_loop_occurrences SET state='running',generation=?,attempts=1,retry_at=NULL,updated_at=? WHERE occurrence_id=?",l.generation,this.now(),o.occurrence_id);
      this.company.discussions.startInvestmentCycle(g.group_id,o.occurrence_id);
     }catch(error){this.block(l,String(error).slice(0,600));this.update(o,'blocked',String(error).slice(0,600));return;}
     this.fault?.('enqueue_before_occurrence_commit');
    }else if(now>time(o.expires_at)){this.update(o,'missed','Deterministic stage window elapsed; no retrospective replay');}
    else this.deterministic(l,o);
   }
   l=this.get(l.loop_id);if(l.state==='active'&&this.occurrences(l).every(o=>!['pending','running'].includes(o.state))){const blocked=this.occurrences(l).some(o=>o.state==='blocked');this.db.run('UPDATE investment_loops SET state=?,reason=?,updated_at=? WHERE loop_id=?',blocked?'blocked':'finished',blocked?'Finite loop ended with blocked stages':'Finite loop exhausted; no more scheduled work',this.now(),l.loop_id);this.sim(l).execute(this.scope(l).run_id,{type:'control',state:blocked?'paused':'ended'},`loop_end_${l.loop_id}_${l.generation}`);if(!blocked)this.db.run("UPDATE working_groups SET state='stopped',deadline=NULL WHERE group_id=? AND state!='completed'",this.scope(l).group_id);}
  });
 }
 nextWake(){const times:string[]=[];for(const l of this.db.all<Loop>("SELECT * FROM investment_loops WHERE state NOT IN ('draft','finished','stopped')")){
  for(const o of this.occurrences(l)){if(o.state==='pending'&&(l.state==='active'||o.stage==='expire'))times.push(o.stage==='research'&&this.company.paused?o.expires_at:o.retry_at??o.due_at);if(l.state==='active'&&o.stage==='research'&&o.state==='running')times.push(o.expires_at);}
  if(l.state==='active')times.push(this.team(l).expiresAt);
 }return times.sort()[0];}
 context(scopeId:string){const l=this.forScope(scopeId);if(!l)return;const state=this.sim(l).inspect(this.scope(l).run_id);return {loopId:l.loop_id,state:l.state,generation:l.generation,currentOccurrence:this.running(l)??null,usageReservations:this.totals(l),outcomes:{ledgerVersion:state.ledgerVersion,orders:Object.values(state.orders).slice(-20),lastValuation:state.valuations.at(-1)?.snapshot??null,benchmarkExecutions:state.benchmarkExecutions.slice(-8),recentObservations:state.observations.slice(-20)},notice:'Original committed outcomes and observation metadata. Read cited proposal/source originals before revising. Unknown costs remain unknown; no automatic paper or publication approval.'};}
 inspect(){this.company.conversations.human();return {notice:'Finite source-only operating loops. Current Codex investment model execution is held. No production activation or post-stop valuation.',clockNow:this.now(),budgetTimezone:'America/New_York',scopes:this.db.all<{scope_id:string;run_id:string;group_id:string}>("SELECT scope_id,run_id,group_id FROM investment_team_scopes WHERE state='active'"),loops:this.db.all<Loop>('SELECT * FROM investment_loops ORDER BY created_at DESC LIMIT 100').map(l=>({...l,envelope:this.envelope(l),occurrences:this.occurrences(l),usage:{reserved:this.totals(l),measured:this.db.all('SELECT u.* FROM investment_loop_usage u JOIN investment_loop_executions x USING(execution_id) JOIN investment_loop_occurrences o USING(occurrence_id) WHERE o.loop_id=?',l.loop_id),unknown:this.unknown(l)},publicationHealth:this.company.publication.health(this.team(l).publicationChannelId),orders:Object.values(this.sim(l).inspect(this.scope(l).run_id).orders)}))};}
}
