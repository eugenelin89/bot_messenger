import {requireThat,strictObject,textField} from '../model.js';
import {time} from './identity.js';
import {publicUrl} from '../../research/public-fetch.js';

export const PROCESS_VERSION='investment-process-v1' as const;
// Kept separate from the legacy paper suite: retained approvals must not change.
export const PROCESS_TOOLS=['paper_read_evidence','paper_request_evidence','paper_strategy_review'] as const;
export interface ResearchSource {
 id:string;instrumentId:string;url:string;kind:'filing'|'earnings'|'fundamentals'|'development';
 quality:'primary';rightsEvidence:string;reviewedAt:string;expiresAt:string;
 automation:true;privateRetention:true;modelProcessing:true;incrementalCost:'0';
}
export interface ProcessPolicy {
 version:typeof PROCESS_VERSION;objective:string;aspirationalReturnPercent:string|null;
 evaluationStart:string;evaluationEnd:string;benchmark:'SPY';cashReviewThreshold:number;
 historyDays:number;maxPageRequests:number;maxEvidenceRequests:number;sources:ResearchSource[];
}
export interface DecisionAssessment {
 disposition:'retain_investments'|'all_cash'|'blocked'|'trade';
 strongestAlternative:{instrumentId:string;caseFor:string;caseAgainst:string};
 cashComparison:string;uncertainty:string;missingEvidence:string[];nextAction:string;ownerInputNeeded:boolean;addressedRequestIds?:string[];
}
export function processPolicy(value:unknown,now:string,instruments:string[],sessions:string[]):ProcessPolicy {
 const a=strictObject(value,['version','objective','aspirationalReturnPercent','evaluationStart','evaluationEnd','benchmark','cashReviewThreshold','historyDays','maxPageRequests','maxEvidenceRequests','sources']);
 requireThat(a.version===PROCESS_VERSION&&a.benchmark==='SPY','Versioned process and SPY comparator required');textField(a,'objective',2000);
 requireThat(a.aspirationalReturnPercent===null||typeof a.aspirationalReturnPercent==='string'&&/^-?\d{1,4}(?:\.\d{1,4})?$/.test(a.aspirationalReturnPercent)&&Math.abs(Number(a.aspirationalReturnPercent))<=1000,'Finite aspirational target required; never a trading requirement');
 const start=time(textField(a,'evaluationStart',40)),end=time(textField(a,'evaluationEnd',40));requireThat(start>=time(now)&&end>start,'Evaluation period must be prospective and ordered; old periods remain historical');
 for(const [key,min,max] of [['cashReviewThreshold',1,20],['historyDays',30,180],['maxPageRequests',0,64],['maxEvidenceRequests',1,32]] as const)requireThat(Number.isSafeInteger(a[key])&&Number(a[key])>=min&&Number(a[key])<=max,'Invalid bounded '+key);
 requireThat(Array.isArray(a.sources)&&a.sources.length<=8,'At most eight exact primary sources');
 for(const raw of a.sources){const s=strictObject(raw,['id','instrumentId','url','kind','quality','rightsEvidence','reviewedAt','expiresAt','automation','privateRetention','modelProcessing','incrementalCost']);
  requireThat(/^[a-zA-Z0-9_-]{1,60}$/.test(textField(s,'id',60))&&instruments.includes(textField(s,'instrumentId',100)),'Source needs a permitted instrument');
  const u=publicUrl(textField(s,'url',2048));requireThat(u.href===s.url&&!u.search&&!u.hash,'Exact public HTTPS URL without query or fragment required');
  requireThat(['filing','earnings','fundamentals','development'].includes(String(s.kind))&&s.quality==='primary','Use company or regulator primary evidence; source identity must be owner-reviewed');
  textField(s,'rightsEvidence',2000);requireThat(time(textField(s,'reviewedAt',40))<=time(now)&&time(textField(s,'expiresAt',40))>time(now),'Current source permission review required');
  requireThat(s.automation===true&&s.privateRetention===true&&s.modelProcessing===true&&s.incrementalCost==='0','Explicit zero-cost automation, permanent private retention and model-processing rights required');
 }
 const sources=a.sources as unknown as ResearchSource[];requireThat(new Set(sources.map(s=>s.id)).size===sources.length&&new Set(sources.map(s=>s.url)).size===sources.length,'Duplicate primary source');
 requireThat(sources.length*sessions.length<=Number(a.maxPageRequests),'Page collection budget does not cover selected sessions');
 return a as unknown as ProcessPolicy;
}
export function assessment(value:unknown,instruments:string[]):DecisionAssessment {
 const a=strictObject(value,['disposition','strongestAlternative','cashComparison','uncertainty','missingEvidence','nextAction','ownerInputNeeded','addressedRequestIds']);
 requireThat(['retain_investments','all_cash','blocked','trade'].includes(String(a.disposition)),'Explicit decision disposition required');
 const alternative=strictObject(a.strongestAlternative,['instrumentId','caseFor','caseAgainst']);requireThat(instruments.includes(textField(alternative,'instrumentId',100)),'Compare cash with a permitted investment');
 for(const k of ['caseFor','caseAgainst'])textField(alternative,k,1500);for(const k of ['cashComparison','uncertainty','nextAction'])textField(a,k,1500);
 requireThat(Array.isArray(a.missingEvidence)&&a.missingEvidence.length<=8&&a.missingEvidence.every(x=>typeof x==='string'&&x.trim().length>0&&x.length<=500)&&typeof a.ownerInputNeeded==='boolean','Bounded missing evidence and owner-input status required');
 requireThat(a.addressedRequestIds===undefined||Array.isArray(a.addressedRequestIds)&&a.addressedRequestIds.length<=16&&a.addressedRequestIds.every(id=>typeof id==='string'&&id.length<=100),'Bounded addressed request IDs required');
 return a as unknown as DecisionAssessment;
}
export const pageRequest=(session:string,source:ResearchSource)=>({type:'investment-primary-page-v1',session,source});
