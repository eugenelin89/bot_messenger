import { generateKeyPairSync } from 'node:crypto';
import { rmSync } from 'node:fs';
import { setup, configuration } from '../investment/support.js';
import { scheduledCalendar2026, simulatorCalendar } from '../../../src/domain/market/calendar.js';
import { normalizePrice } from '../../../src/domain/market/normalize.js';
import { uses, type InstrumentIdentity, type SourcePolicy } from '../../../src/domain/market/types.js';
import { MarketStore } from '../../../src/control/market/store.js';
import { MarketFixtureSimulator } from '../../../src/control/market/admission.js';
import { hash } from '../../../src/domain/investment/identity.js';
import { SimulatorPublicationSource, type FixturePublicationDescription } from '../../../src/control/publication/simulator-source.js';
import { PublicationService, type PublicationOptions } from '../../../src/control/publication/service.js';
import { ServiceKeyRing, type PublicationTransport } from '../../../src/control/publication/transport.js';
import type { Destination, Envelope } from '../../../src/domain/publication/types.js';
export function publicationFixture(options:Partial<PublicationOptions>={},policyOverrides:Partial<SourcePolicy>={}) {
  const calendar=scheduledCalendar2026(),f=setup({calendar:simulatorCalendar(calendar,'2026-03-06','2026-11-30')}),market=new MarketStore(f.store);
  f.store.run("INSERT INTO principals VALUES ('human','human','Fixture owner',1,?)",f.clock.now());
  const policy:SourcePolicy={id:f.config.marketPolicy.id,version:1,provider:f.config.marketPolicy.provider,feed:f.config.marketPolicy.feed,mode:'synthetic_fixture',incrementalCost:'0',reviewedAt:'2026-01-01T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z',rights:Object.fromEntries(uses.map(u=>[u,{status:'allowed',evidence:['synthetic:invented'],note:'Invented fixture permission only'}])) as SourcePolicy['rights'],attribution:'Synthetic fixture only',maxObservationAgeMs:86400000,maxRequests:1000,minIntervalMs:1,cacheMs:0,timeoutMs:100,maxBytes:4096,...policyOverrides};
  market.register(policy,'policy',f.clock.now());market.register(calendar,'calendar',f.clock.now());
  const identities=new Map([...f.config.instruments,f.config.benchmark.instrument].map(i=>{const value:InstrumentIdentity={id:i.id,venue:'XNYS',currency:'USD',source:'synthetic:invented',symbols:[{symbol:i.symbol,from:'2026-01-01',until:null}]};market.register(value,'instrument',f.clock.now());return [i.id,value];}));
  const admitted=new MarketFixtureSimulator(market,f.clock,'fixture-owner');
  const price=(instrumentId:string,session:string,field:'regular_open'|'regular_close',value:string,patch:Record<string,unknown>={})=>{
    const s=calendar.calendar.sessions.find(s=>s.date===session)!,request={instrumentId,session,field},body=JSON.stringify({schema:'synthetic-price-v1',symbol:identities.get(instrumentId)!.symbols[0]!.symbol,venue:'XNYS',currency:'USD',field,value,adjustment:'raw',session,marketAt:field==='regular_open'?s.open:s.close,availableAt:null,sourceId:`${instrumentId}-${session}-${field}`,sourceVersion:1,status:'verified',correctionOf:null,...patch});
    const e=normalizePrice(body,request,policy,identities.get(instrumentId)!,calendar,f.clock.now(),market.prices());market.put(e.id,'price',e,f.clock.now());admitted.observe(f.config.runId,e.id);return e;
  };
  const description:FixturePublicationDescription={title:'Synthetic publisher acceptance',purpose:'Invented accounting evidence',objective:'Validate publication without real investment claims',openingFieldDefinition:'Invented exact regular opening fixture',attribution:'Synthetic test fixture',rightsEvidence:['https://example.invalid/synthetic-permission'],limitations:['Invented instruments and values; no live price or publication right is proven.'],cycleExecutionBudget:1,dailyExecutionBudget:1,runExecutionBudget:1,heartbeatSeconds:60,staleSeconds:180,maxOutboxAgeSeconds:86400,maxOutboxBytes:1048576,dataDelaySeconds:0,workers:{author:{name:'Fixture author',role:'Synthetic author',responsibilities:['Invented proposal'],status:'unavailable'},reviewer:{name:'Fixture reviewer',role:'Synthetic reviewer',responsibilities:['Invented independent check'],status:'unavailable'}},instrumentClassification:Object.fromEntries(configuration().instruments.concat(configuration().benchmark.instrument).map(i=>[i.id,'Invented fixture classification'])),decisions:{},actionSources:{},artifacts:[]};
  const originals=new Map<string,Buffer>();
  const artifact=(value:FixturePublicationDescription['artifacts'][number],original:Buffer)=>{originals.set(`${value.id}:${value.version}`,original);description.artifacts.push(value);};
  const source=new SimulatorPublicationSource('fixture-source','Synthetic simulator',f.store,f.clock,'fixture-owner',f.config.runId,description,(id,version)=>{const bytes=originals.get(`${id}:${version}`);if(!bytes)throw new Error('publication_artifact_source_missing');return bytes;});
  const key=generateKeyPairSync('ed25519'),secondKey=generateKeyPairSync('ed25519');
  const keys=new ServiceKeyRing(new Map([['fixture-key',{key:key.privateKey,notBefore:0,notAfter:2000000000,enabled:true}],['rotated-key',{key:secondKey.privateKey,notBefore:0,notAfter:2000000000,enabled:true}]]));
  const destination:Destination={id:'fixture-destination',title:'Disposable receiver',origin:'http://127.0.0.1:9999',publisherId:'fixture-publisher',keyId:'fixture-key',generation:'1',fixtureLoopback:true};
  const service=new PublicationService(f.store,{sources:[source],destinations:[destination],keys,clock:f.clock,...options});
  const envelope:Envelope={sourceId:source.id,destinationId:destination.id,audience:'public',futureFinancial:false,participants:source.participants,eventTypes:['run.published','run.status','team.published','decision.published','paper.order','paper.ledger_transaction','portfolio.snapshot','artifact.registered','artifact.published','market.action','instrument.updated'],contentTypes:['text/plain','text/markdown','application/json','text/csv','image/png'],expiresAt:'2026-03-10T00:00:00.000Z',maxAttempts:100,maxBytes:1048576,maxQueueBytes:1048576,maxAgeSeconds:86400,writesPerMinute:60};
  const order=(name='buy',targetSession='2026-03-06')=>{const o=f.order(name,'BUY','2',targetSession,'110');const r=o.review.command; if(r.type!=='review')throw new Error('fixture');description.decisions[`${name}:1`]={mode:'synthetic_fixture_derivative',proposalHash:hash(o.proposal),reviewHash:hash(r.review),rationale:'Invented fixture thesis',alternatives:['Invented HOLD alternative'],risks:['Invented loss scenario'],invalidationCondition:'Synthetic guard or unavailable evidence',reviewRationale:'Invented fixture review only',dissent:[]};return o;};
  const complete=()=>{const o=order();f.clock.set('2026-03-06T14:31:00.000Z');price('ACME','2026-03-06','regular_open','100');price('ETF','2026-03-06','regular_open','100');admitted.execute(f.config.runId,{type:'fill',orderId:o.id},'fill');admitted.execute(f.config.runId,{type:'benchmark_open',session:'2026-03-06'},'benchmark');f.clock.set('2026-03-06T21:01:00.000Z');price('ACME','2026-03-06','regular_close','105');price('ETF','2026-03-06','regular_close','102');admitted.execute(f.config.runId,{type:'value',session:'2026-03-06',asOf:'2026-03-06T21:00:00.000Z'},'value');return o;};
  return {...f,artifact,originals,market,policy,price,description,source,key,secondKey,keys,destination,service,envelope,order,complete,admitted,
    configured:(transport:PublicationTransport,extra:Partial<PublicationOptions>={})=>new PublicationService(f.store,{sources:[source],destinations:[destination],keys,transport,clock:f.clock,...extra}),
    cleanup:()=>{f.close();rmSync(f.dir,{recursive:true,force:true});}};
}
