import test from 'node:test';
import assert from 'node:assert/strict';
import { checked, decimal, divideEven, format, MAX, multiply, positive, rational, rounded, SCALE, wholeShares } from '../src/domain/investment/arithmetic.js';
import { canonical, hash } from '../src/domain/investment/identity.js';
import { canonicalHash } from '../scripts/investment-contracts/schema.js';
import { nextSession, validateConfiguration } from '../src/domain/investment/policy.js';
import { configuration } from './fixtures/investment/support.js';
import { observationFor } from './fixtures/investment/support.js';
import { initialState } from '../src/domain/investment/reducer.js';
import { assertBalanced, assertBook, trade } from '../src/domain/investment/accounting.js';
import type { Posting } from '../src/domain/investment/types.js';

test('six-decimal parsing and formatting are exact at magnitude bounds',()=>{
  for(const value of ['0','1','0.000001','-0.000001','999999999999.999999','-999999999999.999999']) assert.equal(decimal(format(decimal(value))),decimal(value));
  assert.equal(decimal('0.1')+decimal('0.2'),decimal('0.3')); assert.equal(decimal('999999999999.999999'),MAX);
});
for(const value of ['NaN','Infinity','1e3','1E-6','+1','01',' 1','1.0000001','1000000000000','0x10','1.','--1']) test(`reject financial spelling ${value}`,()=>assert.throws(()=>decimal(value)));
test('positive quantities and whole-share rule reject zero/negative/fractional inputs',()=>{for(const s of ['0','-1'])assert.throws(()=>positive(s));assert.throws(()=>wholeShares('1.5'));});
test('half-even is symmetric, including exact tie residuals',()=>{
  assert.equal(divideEven(5n,2n),2n);assert.equal(divideEven(7n,2n),4n);assert.equal(divideEven(-5n,2n),-2n);assert.equal(divideEven(-7n,2n),-4n);
  assert.deepEqual(rounded(5n,2n),{value:2n,residual:{numerator:'-1',denominator:'2'}});assert.deepEqual(rational(6n,8n),{numerator:'3',denominator:'4'});
});
test('checked values and intermediate products fail closed',()=>{assert.throws(()=>checked(MAX+1n));assert.throws(()=>multiply(MAX,MAX));assert.throws(()=>divideEven(10n**73n,1n));assert.throws(()=>divideEven(1n,0n));});
test('deterministic seed: 10000 decimal round trips and bounded rounding errors',()=>{
  let seed=42n;for(let i=0;i<10000;i++){seed=(seed*1664525n+1013904223n)%4294967296n;const n=seed*123456n;assert.equal(decimal(format(n)),n);const d=seed%991n+1n,r=rounded(n,d);assert.ok((r.value*d-n)*2n<=d);assert.ok((n-r.value*d)*2n<=d);}
  assert.equal(SCALE,1000000n);
});
test('runtime JCS matches canonical v1 oracle and rejects lossy inputs',()=>{
  const value={b:'0.000001',a:[true,'π',null,{z:1}],unicode:'😀'};assert.equal(hash(value),canonicalHash(value));
  for(const bad of [NaN,Infinity,undefined,1.5,9007199254740992,'\ud800',new Date(),{a:undefined}]) assert.throws(()=>canonical(bad));
});
test('fixture calendar selects weekend, holiday, DST and early-close sessions',()=>{
  const c=configuration();validateConfiguration(c);
  assert.equal(nextSession(c,'2026-03-06T14:00:00Z')?.date,'2026-03-09');
  assert.equal(nextSession(c,'2026-03-08T12:00:00Z')?.open,'2026-03-09T13:30:00.000Z');
  assert.equal(nextSession(c,'2026-11-01T12:00:00Z')?.open,'2026-11-02T14:30:00.000Z');
  assert.equal(nextSession(c,'2026-11-26T12:00:00Z')?.close,'2026-11-27T18:00:00.000Z');
  c.calendar.sessions[1]!.status='closed';assert.equal(nextSession(c,'2026-03-08T12:00:00Z')?.date,'2026-03-10');
});
test('configuration rejects non-USD, operational evidence, invalid DST and wrong precision',()=>{
  for(const mutate of [(c:ReturnType<typeof configuration>)=>{(c as unknown as {currency:string}).currency='CAD';},(c:ReturnType<typeof configuration>)=>{(c as unknown as {evidenceMode:string}).evidenceMode='observed_paper';},(c:ReturnType<typeof configuration>)=>{c.initialCapital='1.0000001';},(c:ReturnType<typeof configuration>)=>{c.calendar.sessions[1]!.open='2026-03-09T14:30:00.000Z';}]){const c=configuration();mutate(c);assert.throws(()=>validateConfiguration(c));}
});
test('seeded 1000 accumulation/partial-exit/full-exit cycles conserve cash, basis and realized PnL',()=>{
  const c=configuration(),state=initialState(c);state.portfolio.cash='1000000.000000';let seed=17n,expected=decimal(state.portfolio.cash);
  const random=()=>{seed=(seed*1664525n+1013904223n)%4294967296n;return seed;};
  for(let i=0;i<1000;i++) {
    const q1=(random()%9n+1n)*SCALE,q2=(random()%9n+1n)*SCALE,p1=random()%100000000n+SCALE,p2=random()%100000000n+SCALE,sell=random()%100000000n+SCALE,entries:Posting[]=[];
    const observation=(p:bigint)=>observationFor(c,'ACME','2026-03-06','regular_open',format(p));
    trade(state,c,entries,'portfolio','ACME','BUY',q1,observation(p1),'a');trade(state,c,entries,'portfolio','ACME','BUY',q2,observation(p2),'b');
    assert.equal(decimal(state.portfolio.positions.ACME!.basis),q1/SCALE*p1+q2/SCALE*p2);
    trade(state,c,entries,'portfolio','ACME','SELL',SCALE,observation(sell),'partial');trade(state,c,entries,'portfolio','ACME','SELL',q1+q2-SCALE,observation(sell),'exit');
    expected+=(q1+q2)/SCALE*sell-q1/SCALE*p1-q2/SCALE*p2;
    assert.equal(decimal(state.portfolio.cash),expected);assert.equal(decimal(state.portfolio.realized),expected-decimal('1000000'));assert.equal(state.portfolio.positions.ACME!.basis,'0.000000');assert.equal(state.portfolio.positions.ACME!.quantity,'0.000000');assertBalanced(entries);assertBook(state.portfolio);
  }
});
