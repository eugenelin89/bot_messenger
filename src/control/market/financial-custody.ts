import {isResearchCustody,isOwnerResearchCustody,type ResearchCustody} from './research-custody.js';
import { assertProbeCapability, isOwnerProbe, type YahooProbeCustody } from './yahoo-probe-custody.js';
import { isHistoryCustody, isOwnerHistory, type YahooHistoryCustody } from './yahoo-history-custody.js';
/** Closed set of independent issuers. No structural object, flag or database can mint authority. */
export type FinancialCustody = YahooProbeCustody | YahooHistoryCustody | ResearchCustody;
export function assertFinancialCustody(value: unknown): asserts value is FinancialCustody {
  if (!isHistoryCustody(value) && !isResearchCustody(value)) assertProbeCapability(value);
}
export function isOwnerFinancialCustody(value: FinancialCustody): boolean {
  return isResearchCustody(value)?isOwnerResearchCustody(value):isHistoryCustody(value) ? isOwnerHistory(value) : isOwnerProbe(value);
}
