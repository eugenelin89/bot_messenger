import { ensure } from '../../domain/investment/arithmetic.js';
import type { MarketTransportResponse, PriceAdapter, PriceRequest } from '../../domain/market/types.js';
/** The sole price transport is explicitly a disposable loopback fixture, never a live feed. */
export class FixtureHttpAdapter implements PriceAdapter {
  readonly kind='synthetic-json-v1' as const;
  private readonly endpoint:string;
  constructor(endpoint:string) {
    const u=new URL(endpoint);
    ensure(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/fixture/prices','fixture_endpoint_required');
    this.endpoint=u.href;
  }
  async read(request:PriceRequest,signal:AbortSignal,maxBytes:number):Promise<MarketTransportResponse> {
    const response=await fetch(this.endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request),redirect:'error',signal});
    const chunks:Uint8Array[]=[];let length=0;const reader=response.body?.getReader();
    try {if(reader)while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;ensure(length<=maxBytes,'market_response_size');chunks.push(value);}}
    finally{await reader?.cancel();}
    const retry=response.headers.get('retry-after');
    return {status:response.status,contentType:response.headers.get('content-type')??'',body:Buffer.concat(chunks).toString('utf8'),retryAfterSeconds:retry&&/^\d+$/.test(retry)?Math.min(Number(retry),86400):null};
  }
}
