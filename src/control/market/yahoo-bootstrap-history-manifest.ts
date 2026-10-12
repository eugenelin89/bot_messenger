import { ensure } from '../../domain/investment/arithmetic.js';
import { canonical } from '../../domain/investment/identity.js';
import { historyManifest } from './yahoo-history-manifest.js';

/** No owner issuer: technical feasibility failed before live admission in HQ-READY-03G. */
export const BOOTSTRAP_HISTORY_FIXTURE_ID = 'HQ-READY-03G-OFFLINE';
export function bootstrapHistoryFixtureManifest(preparedAt: string, sourceHash: string, approvalId?: string) {
  const m = historyManifest(preparedAt, sourceHash, approvalId);
  m.id = m.scope.id = BOOTSTRAP_HISTORY_FIXTURE_ID;
  m.policy.id = 'yahoo-hq-ready-03g-offline'; m.scope.policyIds = [m.policy.id];
  m.calendar.id = m.calendar.calendar.version = m.scope.calendarId = 'us-equities-2026-hq-ready-03g-offline';
  m.adapterProfile = 'hq-ready-03f-offline-bootstrap';
  m.permission = 'authored_fixture_only_no_live_admission';
  for (const right of Object.values(m.policy.rights)) {
    right.evidence = ['https://github.com/eugenelin89/bot_messenger/blob/main/docs/decisions/decision_043_yahoo_qualification_feasibility.md'];
    right.note = 'Authored offline custody acceptance only. No Yahoo permission or live capability is issued.';
  }
  m.policy.attribution = 'Authored Yahoo-shaped fixture; no provider data';
  return { ...m, liveAdmission: 'withheld_technical_feasibility' as const };
}
export function verifyBootstrapHistoryFixtureManifest(m: ReturnType<typeof bootstrapHistoryFixtureManifest>): void {
  ensure(canonical(m) === canonical(bootstrapHistoryFixtureManifest(m.preparedAt, m.sourceHash, m.approvalId)), 'probe_manifest_mismatch');
}
