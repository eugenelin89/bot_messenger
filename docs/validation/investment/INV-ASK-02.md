# INV-ASK-02 — HQ transport component acceptance

**Status, October 13, 2026:** Dormant signed-transport source validated; parent packet remains
incomplete. Actual website intake, durable HQ admission, employee routing and genuine responses
are not supplied by this component. Production remains on d262a8d with runtime authentication held.

Source commit: `895f3ed36d140a65e385ed5647714349543c3e83`.
Delivery PR: [78](https://github.com/eugenelin89/bot_messenger/pull/78).

## Implemented boundary

`src/control/ask/transport.ts` sends the six existing canonical Ask operations only to
`https://asymmetri.co`. It reuses the signature profile and strict ASK-01 response decoder, with
no change to the canonical manifest or publication adapter. A new domain reconstruction helper
rebuilds every prepared field from typed operation/current context; a structural prepared object
cannot choose an arbitrary target, header, method, body, identity or signing permission.

The adapter snapshots the operation before asynchronous setup. DNS/TLS setup sends no HTTP
headers/body. After verified TLS, it rechecks current scope, lease/question expiry and key,
signs exact frozen bytes with a fresh nonce, then rechecks authority/clock/key synchronously
before marking transmission and calling end(). It uses normal certificate/hostname checks,
fixed Host/SNI, no caller-controlled wire options, no redirects/cookies and no automatic retry.

One client permits one in-flight request. A total 10-second deadline covers connection through
complete response. Limits are 16 KiB headers, 256 KiB successful body and 8 KiB problem body;
streamed and declared lengths are bounded. Duplicate sensitive headers, encoding, incomplete
responses, malformed schema/identity and public caching are rejected. Error results contain
fixed safe codes, never remote body/stack/signature/key material.

`not_sent` describes confirmed absence of an HTTP write; after end() begins, failure is
conservatively `unknown`, including timeout, abort, redirect, malformed reply or end() throwing.
Known valid remote problems are returned separately. None permits another model execution.
A valid delayed receipt can still decode after its transmitted claim expires; it proves only
historical acceptance, not present permission to display content.

## Validation and review

Build, typecheck and canonical types/eight-file manifest check pass on Node24.21.0. The focused
Ask contract, new TLS transport, existing investment contracts and publication TLS test suite
pass **263/263**, zero failures/skips. Source hashes match the local writer checkout exactly.
See [machine-readable receipt](../evidence/inv-ask02/transport-acceptance.json) for commands,
source/log hashes, initial failures and resource measurements.

All network tests use an authored loopback TLS server with generated fixture keys/certificates.
They exercise actual Node HTTPS, certificate and hostname denial, signatures for all six paths,
empty GET semantics, exact-body retries with fresh nonces, forged intents, input mutation during
TLS setup, same-key revocation, lease/clock changes, post-sign revocation, deadlines, aborts,
bounded headers/bodies, truncation, redirects, cookie/encoding rejection, malformed responses,
remote401 and late receipts. Pre-send denial tests count server request headers and decrypted
application bytes independently of completed bodies. The end() exception fixture proves
conservative uncertainty for a synchronous throw; it does not prove a partial write occurred.

Architecture/security/recovery source reviews accept the dormant component. Test review added
post-sign checks, narrowed the end() claim and independently verified all three source and seven
log hashes. All four specialists accept this component. This is local fixture acceptance, not actual
website integration or Level3 employee execution. The full company regression was not repeated:
no existing runtime, persistence, dispatcher or publication behavior was changed.

The Mac was below its shared 15 GB admission limit; no local heavy job ran. Motion retained the
native slot. Validation ran as unprivileged botsquad in a new isolated Linux temporary directory,
with a 512 MB heap/nice10, matching locked dependencies and ample measured disk/memory. Production
health remained unchanged. The first compiler run found a test type mismatch; the initial
manifest check caught Mac transfer metadata. Those issues were corrected and final checks passed.
No account login, website, market-data or model request was made by these checks.

## Required integration before activation

The factory is not wired into the application. Dedicated Ask key custody, durable typed owner
grants, exact frozen intent/outbox records, attempt reservations, privacy-control application
and acknowledgment, restore generation reconciliation, finite cost/token quotas and provider
uncertainty remain required. The synchronous current() hook must enforce the relevant durable
controls before returning scope/limits/clock. The hook and typed scope are not durable authority.
Receipt decoding needs current context but must remain available independently of model dispatch.

Before each explicit retry, reconcile the exact immutable request and its remote receipt. A new
wrapper/generation/control acknowledgment needs a new transport key; immutable answer identity
remains unchanged. The caller must persist transmission intent before calling this adapter;
crash recovery cannot infer not_sent merely because it did not retain a return value. Unknown
HTTP delivery and unknown provider execution are separate records. Keep their fences distinct.

Next source work is durable Ask grants/import/outbox/control state and restore handling, using
the canonical contract and existing dispatcher/account uncertainty rules. Actual anonymous
session intake remains delegated to the website chat. No canned employees, private-thread reuse,
paid provider setup, borrowed investment authority or public activation follows from these tests.


## Durable privacy-control journal — 2026-10-13

A subsequent, still dormant component adds passive schema26. It stores only control and sync
metadata, never visitor text, answers, provider threads or credentials. No application caller,
service, key, owner grant, model allowance or invocation is created. Schema25 company and
portfolio rows/rowids and independent consumed authority survive the migration unchanged.

The journal owns one pending request per service, frozen before I/O. Callers cannot choose its
cursor or acknowledgment IDs. An identical retry returns identical bytes/ID; receiving a bound
page atomically records immutable controls, indexed question/conversation suppression, exact
`suppression-journal-v1` application hashes, confirmed ACKs, and the next cursor. Even a nonempty
last page needs another exchange and an empty/null terminal page after all controls are ACKed.
Unknown IDs, changed duplicates, invalid responses and partial failures cannot advance state.

A new process instance invalidates freshness, abandons its old pending sync and starts from the
root with a fresh request ID. Current-instance checks reject late callbacks. Only a fresh fully
drained response before the retention horizon can reconcile abandoned **control-sync metadata**;
its exact resolver record remains retained while referenced. This never settles a model turn or
advances consumer generation. Expired unresolved requests/controls hold prepare, receive and
barrier evaluation, even if pruning was never called. Resolved metadata can be pruned; unresolved
horizon recovery remains an explicit integration requirement.

The real effect here is durable **suppression recording**, not content deletion. Every journal
barrier includes `contentPurgeVerified:false` and `restorationVerified:false`; it cannot authorize
model dispatch or answer release. A restored older snapshot can be missing controls already
ACKed remotely, and an empty reply cannot reconstruct them. The later import/execution adapter
must require its own application version, atomically apply retained controls to all actual local
content/executions/outbox, and separately reconcile backup suppression, provider retention,
consumer generation and independent finite authority. Raw content must not accidentally enter
indefinite whole-HQ backups. This component must remain unwired until those checks exist.

Current focused acceptance: 120/120 on Node24.21.0/Linux, zero failures/skips; build/typecheck and
unchanged canonical manifest pass. This includes 33 journal/migration cases plus the existing Ask
contract and HTTPS transport tests. Authored fixtures cover multipage ACK barriers, scoped
suppression, identical IDs across two services, exact retry, atomic rollback before/after ACK,
restart/stale callbacks, old-backup limits, clock/scope/generation changes, unresolved horizons,
stale empty responses, resolver retention after policy tightening, SQL transition guards and
populated schema25 preservation. The broad serial regression completed with failures; see the
qualified results below and [journal receipt](../evidence/inv-ask02/journal-acceptance.json).

Architecture, security and recovery review found no remaining source blocker after the fixes.
Test review requested the two-service privacy case, now passing in the final focused set. Initial
local check could not find tsc through a pre-existing dangling dependency link. The first isolated
Linux compiler found a test-only generic typing error; then 31/32 journal cases passed, with the
migration fixture held by an omitted README in staging. Adding required repository inputs fixed
that setup failure; these initial logs are retained. No actual receiver/model/provider deletion
or public Ask execution is proven by fixture results.

### Regression qualification

The original Linux sweep returned 1,935 passes, 48 failures, one cancellation and five conditional
receiver skips across 1,989 tests. Retained failures led to test-only repairs: use one synthetic
Date clock for authored evidence and sessions while keeping real timers; use monotonic observer
deadlines; synchronize cutoff admission before measuring real aborts; await the ordinary loop
completion tick; make identical-account notification revalidation deterministic; and use portable
temporary report paths. No production point-in-time, runtime, account or financial guard changed.

The unchanged business-adapter file passed 32/32 under its supported protected fixture directory.
Corrected Ask/finite acceptance passed 202/203, with its one observer failure subsequently passing
in the unchanged four-case dispatcher file. Repaired timing/account checks passed 22/22, portable
SIGKILL recovery passed 4/4, and the final cutoff assertion passed 2/2. The final cutoff receipt
measures both actual abort events at least 900ms after release. Build/typecheck/manifest pass.

The Linux observed workflow still has unresolved final-session research observer failures,
including a 633.44s full-universe case with a 180s stage bound. All recorded turns in that
snapshot were completed with no execution errors; a scheduling/performance explanation remains
an inference. The exact same 32 source/test hashes passed the complete plain workflow on
Mac/Node24.10.0 in 204.53s, with all accounting, publication, restart and authority assertions.
The subsequent whole file passed **27/27**, zero failures/skips/cancellations, in 416.63s;
all 32 source/test hashes were rechecked against the writer after the run. The Linux run was
stopped after two reported passes and five reported failures, before an aggregate footer, to
replace repeated failures with one bounded diagnostic. No further timeout increase was made.
These results qualify dormant component source acceptance; Linux live-workflow readiness
remains unproven. The shared Mac slot was returned to Motion after the test completed.

A separate diagnostic retained the original60s observer and still failed (0/1,268.40s).
At timeout, the dispatcher was scheduled, not stopped and had zero active turns. It had made
2,082full journal replays taking126.87s of205.85s elapsed. Three passive setImmediate observations
without kick() then saw synthesis, review and finalization complete in order. Finalization was
not yet advanced and the stage remained running when the original error was rethrown. This
demonstrates replay cost and natural progression in that case; it neither repairs performance
nor converts any original Linux failure into a pass. Diagnostic source/log hashes and snapshots
are retained in the machine receipt. A separate performance packet must preserve all corruption,
checkpoint, receipt, financial, point-in-time and authority checks.
