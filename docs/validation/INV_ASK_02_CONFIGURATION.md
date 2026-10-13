# INV-ASK-02 signed configuration contract acceptance

2026-10-13. This accepts a canonical protocol increment, not operational Ask.
The sole HQ writer remains `codex/inv-real-01`; the existing Asymmetri chat owns
website implementation. Production investment identities and custody are unchanged.

The canonical GET `/api/ask/v1/service/configuration` adds an exact caller-scoped,
short-lived configuration snapshot under the existing `control_sync` signature
permission. Closed schema, stable configuration hash, generation, held/readiness
flags and freshness are checked. No model authority, signing material, account
identity, visitor text or private path is returned. The prior strict budget modes
and `activity_capped_subscription` remain unchanged.

Nine-file package manifest SHA-256:
`5396443e475d3fe69825ef8af4e916a408b39452182e9c4828fa17b7faf37a84`.

Validation ran as the unprivileged service user in isolated Linux staging
`/var/tmp/botsquad-ask-integration-idEyvv`, against the existing pinned dependencies,
with a 512 MiB Node heap and low scheduling priority. No production database or
runtime was changed. Contract generation/check and TypeScript build passed.
The combined contract/Ask boundary/local TLS/authority run had 307 passing tests
and one stale operation-count assertion; after changing 31 to 32 operations,
all 176 contract tests passed. The other 132 tests had already passed and their
source was unchanged. These are authored conformance and disposable TLS tests;
no genuine employee/provider inference or public-service eligibility is claimed.

Retained failed attempts: the first generation lacked the new root registration;
it failed type-check. A read-only architecture reviewer found the omission; both
schema roots and catalogue roots were fixed before acceptance. The reviewer also
requested enabled/control permission checks in the exported helper; these were
added. Configuration hash was independently recomputed and matched the fixture.

Consumer obligations remain explicit: persist revision/hash high-water marks,
reject rollback and same-revision changes, bound configuration polling, and
reconcile configuration reads without clearing unrelated uncertainty. Existing
journal observations deliberately remain unresolved until operation-specific
reconciliation; this slice does not add a polling daemon. Older binaries cannot
replay a newly recorded configuration wire kind, so an operational downgrade
requires compatibility review, not blindly restoring an old Company snapshot.

Website acceptance must additionally prove closed-intake reconciliation access,
stale-generation/held-custody rejection, exact vendoring, receiver regressions and
unchanged investment signatures. Anonymous Ask remains closed pending genuine
runtime/public eligibility, retention and cross-system acceptance.
