/** Account-free identifier mapping only. This adapter never supplies price or venue authority. */
import { ensure } from '../../domain/investment/arithmetic.js';
import { time } from '../../domain/investment/identity.js';
import { strictJson } from '../../domain/market/normalize.js';
import { bytesHash } from '../../domain/market/validation.js';
export interface FigiIdentity {
  figi:string;compositeFIGI:string|null;shareClassFIGI:string|null;
  ticker:string;name:string;exchangeCode:string;securityType:string;
}
export interface FigiReceipt {source:'https://api.openfigi.com/v3/mapping';retrievedAt:string;responseHash:string;identities:FigiIdentity[];publicationFields:['figi','compositeFIGI','shareClassFIGI']}
export function parseFigi(body:string,retrievedAt:string):FigiReceipt {
  time(retrievedAt);ensure(Buffer.byteLength(body)<=65536,'identity_response_size');
  const data=strictJson(body);ensure(Array.isArray(data)&&data.length===1,'identity_schema_changed');
  const envelope=data[0] as {data?:unknown;error?:unknown;warning?:unknown};
  ensure(envelope&&typeof envelope==='object'&&Object.keys(envelope).every(k=>k==='data')&&Array.isArray(envelope.data)&&envelope.data.length>0&&envelope.data.length<=20,'identity_missing_or_ambiguous');
  const identities=envelope.data.map((row:unknown)=>{
    ensure(row&&typeof row==='object'&&!Array.isArray(row),'identity_schema_changed');const r=row as Record<string,unknown>;
    ensure(Object.keys(r).every(k=>['figi','name','ticker','exchCode','compositeFIGI','securityType','marketSector','shareClassFIGI','securityType2','securityDescription'].includes(k)),'identity_schema_changed');
    function figi(v:unknown,optional=false):string|null {if(optional&&(v===undefined||v===null))return null;ensure(typeof v==='string'&&/^[A-Z0-9]{12}$/.test(v),'invalid_figi');return v;}
    function text(key:string):string{const v=r[key];ensure(typeof v==='string'&&v.length>0&&v.length<=256&&!/[\u0000-\u001f]/.test(v),'identity_schema_changed');return v;}
    return {figi:figi(r.figi)!,compositeFIGI:figi(r.compositeFIGI,true),shareClassFIGI:figi(r.shareClassFIGI,true),ticker:text('ticker'),name:text('name'),exchangeCode:text('exchCode'),securityType:text('securityType')};
  });
  return {source:'https://api.openfigi.com/v3/mapping',retrievedAt,responseHash:bytesHash(body),identities,publicationFields:['figi','compositeFIGI','shareClassFIGI']};
}
/** At most one job/request and one request per instance. Callers need a fresh explicit invocation. No retries/timer. */
export class OpenFigiProbe {
  private used=false;
  async mapDocumentedExample():Promise<FigiReceipt> {
    ensure(!this.used,'identity_probe_budget_exhausted');this.used=true;
    const response=await fetch('https://api.openfigi.com/v3/mapping',{method:'POST',headers:{'content-type':'application/json'},body:'[{"idType":"ID_BB_GLOBAL","idValue":"BBG000BLNNH6"}]',redirect:'error',signal:AbortSignal.timeout(10000)});
    ensure(response.status===200,response.status===429?'identity_rate_limited':'identity_provider_unavailable');
    ensure(response.headers.get('content-type')?.split(';')[0]==='application/json','identity_schema_changed');
    const reader=response.body?.getReader();ensure(reader,'identity_empty_response');const chunks:Uint8Array[]=[];let bytes=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;ensure(bytes<=65536,'identity_response_size');chunks.push(value);}}finally{await reader.cancel();}
    const receipt=parseFigi(Buffer.concat(chunks).toString('utf8'),new Date().toISOString());
    ensure(receipt.identities.length===1&&receipt.identities[0]!.figi==='BBG000BLNNH6','identity_response_mismatch');return receipt;
  }
}
