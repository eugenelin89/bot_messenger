# INV-ASK-02 — HQ transport component acceptance

**Status, October 13, 2026:** Dormant signed-transport source validated; parent packet remains
incomplete. Actual website intake, durable HQ admission, employee routing and genuine responses
are not supplied by this component. Production remains on d262a8d with runtime authentication held.

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
