/** Read-only public projection verification; never invokes a market/provider request. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import canonicalize from 'canonicalize';
const output=process.argv[2],baseline=process.argv[3]?JSON.parse(readFileSync(process.argv[3],'utf8')):null;
assert.ok(output,'Explicit output path required');
const base='https://asymmetri.co/api/experiments/v1/experiments/16496aa38732845beeea0a75f4614b93136be792accbb4e0/runs/0f6ea49caee91243f2f028a8ddde55abaa68faaaa2de453c';
const result={checkedAt:new Date().toISOString(),kind:'Verified HTTPS GET and public canonical-hash consistency, not signed receiver attestation',responses:[]};
for(const [name,url] of Object.entries({status:base+'/status',events:base+'/events?limit=100',transactions:base+'/transactions?limit=100',snapshot:base+'/snapshot',ask:'https://asymmetri.co/api/ask/v1/availability'})){
 const response=await fetch(url,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)}),body=await response.text();
 assert.equal(response.status,200);assert.equal(response.headers.get('set-cookie'),null);assert.ok(body.length<1048576);
 result.responses.push({name,status:response.status,cacheControl:response.headers.get('cache-control'),noCookie:true});result[name]=JSON.parse(body);
}
assert.equal(result.events.nextCursor,null);assert.equal(result.transactions.nextCursor,null);
for(const item of result.events.items)assert.equal(createHash('sha256').update(canonicalize(item.event)).digest('hex'),item.eventHash);
for(const name of ['events','transactions','snapshot'])assert.deepEqual(result[name].watermark,result.status.watermark);
assert.equal(result.ask.state,'disabled');
if(baseline)for(const old of baseline.events.items)assert.ok(result.events.items.some(next=>next.event.eventId===old.event.eventId&&next.eventHash===old.eventHash),'Prior public event/hash missing');
result.allCanonicalHashesVerified=true;result.priorPrefixPreserved=baseline?true:null;
writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({checkedAt:result.checkedAt,state:result.status.state,watermark:result.status.watermark,eventCount:result.events.items.length,transactions:result.transactions.items.map(x=>({effect:x.event.payload.effect,fill:x.event.payload.fill})),snapshotNull:result.snapshot.snapshot===null,ask:result.ask.state,hashesVerified:true}));
