import { randomBytes, sign, type KeyObject } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { contentDigest, signatureBase, signatureInput, type SignedMessage } from '../../../scripts/investment-contracts/signatures.js';
import { ensure } from '../../domain/investment/arithmetic.js';
import { id } from '../../domain/investment/identity.js';
import type { Destination } from '../../domain/publication/types.js';
export interface WireResponse { status: number; contentType: string; bytes: Buffer }
export interface PublicationTransport { send(destination: Destination, message: SignedMessage): Promise<WireResponse> }
export interface KeyRing {
  has(keyId: string, nowSeconds: number): boolean;
  sign(keyId: string, bytes: Buffer, nowSeconds: number): Buffer;
}
/** Trusted injection only. Neither keys nor this object enter owner DTOs or worker contexts. */
export class ServiceKeyRing implements KeyRing {
  constructor(private readonly keys: ReadonlyMap<string,{key:KeyObject;notBefore:number;notAfter:number;enabled:boolean}>) {}
  has(keyId:string,now:number):boolean { const k=this.keys.get(keyId);return !!k&&k.enabled&&k.key.asymmetricKeyType==='ed25519'&&now>=k.notBefore&&now<k.notAfter; }
  sign(keyId:string,bytes:Buffer,now:number):Buffer { ensure(this.has(keyId,now),'publication_key_unavailable');return sign(null,bytes,this.keys.get(keyId)!.key); }
}
export function destinationValid(d:Destination):void {
  [d.id,d.publisherId,d.keyId].forEach(id);ensure(/^[1-9]\d{0,17}$/.test(d.generation),'invalid_generation');
  const u=new URL(d.origin);
  ensure(d.origin===u.origin&&!u.username&&!u.password&&!u.search&&!u.hash,'invalid_publication_destination');
  ensure(u.protocol==='https:'||(d.fixtureLoopback===true&&u.protocol==='http:'&&u.hostname==='127.0.0.1'),'publication_https_required');
}
export function signedRequest(d:Destination,keyRing:KeyRing,at:string,method:SignedMessage['method'],path:string,body:Buffer,requestId?:string,contentType='application/json'):SignedMessage {
  destinationValid(d);const now=Math.floor(Date.parse(at)/1000);ensure(Number.isSafeInteger(now),'invalid_publication_time');
  const headers:[string,string][]=[['botsquad-generation',d.generation]];
  if(method!=='GET'){ensure(requestId,'publication_request_id_required');headers.push(['content-type',contentType],['content-digest',contentDigest(body)],['idempotency-key',requestId]);}
  const message:SignedMessage={method,authority:new URL(d.origin).host,path,headers,body};
  const input=signatureInput(method,{created:now,expires:now+60,keyId:d.keyId,nonce:randomBytes(24).toString('base64url')});
  headers.push(['signature-input',input],['signature',`sig1=:${keyRing.sign(d.keyId,Buffer.from(signatureBase(message,input)),now).toString('base64')}:`]);return message;
}
/** One exact configured authority, no redirects, bounded deadline/body, normal TLS validation. */
export class FixedPublicationTransport implements PublicationTransport {
  constructor(private readonly trustedCa?:Buffer) {}
  async send(d:Destination,m:SignedMessage):Promise<WireResponse> {
    destinationValid(d);ensure(m.authority===new URL(d.origin).host,'publication_authority_mismatch');
    ensure(/^\/api\/experiments\/v1\/experiments\/[A-Za-z0-9_-]+\/runs\/[A-Za-z0-9_-]+\/(events|heartbeat|status|receipts\/[A-Za-z0-9_-]+|content\/[a-f0-9]{64})$/.test(m.path),'publication_path_denied');
    ensure(m.body.length<=4194304,'publication_body_limit');
    return new Promise((resolve,reject)=>{
      const u=new URL(d.origin),headers=Object.fromEntries(m.headers);
      if(m.method!=='GET')headers['content-length']=String(m.body.length);
      headers.connection='close';
      const req=(u.protocol==='https:'?httpsRequest:httpRequest)({protocol:u.protocol,hostname:u.hostname,port:u.port||undefined,method:m.method,path:m.path,headers,agent:false,...(this.trustedCa?{ca:this.trustedCa}:{})},res=>{
        const chunks:Buffer[]=[];let size=0;
        res.on('data',(part:Buffer)=>{size+=part.length;if(size>262144){req.destroy(new Error('publication_response_limit'));return;}chunks.push(part);});
        res.on('end',()=>{if(!res.complete){reject(new Error('publication_incomplete_response'));return;}resolve({status:res.statusCode??0,contentType:res.headers['content-type']??'',bytes:Buffer.concat(chunks)});});
        res.on('error',reject);
      });
      const deadline=setTimeout(()=>req.destroy(new Error('publication_timeout')),10000);
      req.on('close',()=>clearTimeout(deadline));req.on('error',reject);req.end(m.body);
    });
  }
}
