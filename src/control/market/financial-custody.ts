import { assertProbeCapability, isOwnerProbe, type YahooProbeCustody } from './yahoo-probe-custody.js';
import { isHistoryCustody, isOwnerHistory, type YahooHistoryCustody } from './yahoo-history-custody.js';
/** Closed set of independent issuers. No structural object, flag or database can mint authority. */
export type FinancialCustody = YahooProbeCustody | YahooHistoryCustody;
export function assertFinancialCustody(value: unknown): asserts value is FinancialCustody {
  if (!isHistoryCustody(value)) assertProbeCapability(value);
}
export function isOwnerFinancialCustody(value: FinancialCustody): boolean {
  return isHistoryCustody(value) ? isOwnerHistory(value) : isOwnerProbe(value);
}
