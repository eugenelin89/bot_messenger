# INV-ASK-01 — HQ contract boundary acceptance

**Status, 2026-10-13:** HQ source component validated; full packet remains partial.
The private website session/queue/intake implementation and its acceptance are pending in the
existing asymmetri.co chat. This packet creates no public chat, runtime execution or authority.

## Delivered source

`src/domain/ask/contract.ts` provides six typed operations against the existing Ask 1.0 contract:
claim, renew, status, answer, receipt and control_sync. The boundary fixes the HTTPS origin,
paths, methods and permissions; validates named schemas, service/generation/question identity,
question hashes, leases, bounded strict JSON and safe problem responses; and freezes exact
request bytes for signed retries. Receipt digest binds the immutable answer, not its delivery
wrapper. All receipt dispositions survive parsing, including deletion/cancellation suppression.

The canonical contract is unchanged. Manifest SHA256:
`7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`.
No schema extension, dependency, migration, environment variable or application route was added.

## Validation

Build, typecheck and canonical types/eight-file digest check pass. The focused Ask boundary and
existing investment contract suite pass **224/224**, zero failures/skips. Inputs and clocks are
authored synthetic fixtures. This is Level 1 acceptance only; no HTTP requests, database queues,
model turns or private/public activation occurred. The earlier INV-REAL full regression remains
its own evidence; it was not rerun for this isolated module without runtime call sites.

Coverage includes exact OpenAPI route/permission matching; malformed/duplicate/oversized JSON;
wrong service, generation, question/hash and response identities; unknown fields and hostile path
IDs; frozen request retries; expired leases; post-purge receipt lookup; late suppressed receipts;
control pagination, stale barriers and historical controls under tighter local policy; public
caching denial; bounded errors without remote private details; and UTF8 byte/character limits.
See [machine-readable receipt](../evidence/inv-ask01/source-acceptance.json) for source/log hashes.
The first compiler run found a test tuple assignment mismatch; fixed before the passing run.

Architecture/security/recovery reviews found and corrected prepared requests outliving claims,
receipt lookup requiring retained raw answers, and tightened retention/freshness rejecting old
privacy controls. The final implementation rechecks transmission clocks, keeps six non-content
receipt identity fields, accepts historical controls within absolute v1 limits, and applies
stricter local freshness only to the empty terminal-page fact. Reviewers are development-time
specialists, not product employees or evidence of genuine answers. All four specialists, including
the test reviewer, accept this HQ-only component; the test reviewer independently verified source
and log hashes and found no critical missing test for this isolated scope.

## Integration handoff

ASK-02 must reconstruct prepared intents from trusted durable records and call
`assertAskRequestCurrent` immediately before every actual transmission. The structural object
is not an unforgeable grant. Use the canonical Ed25519 signature profile, exact stored UTF8
bytes/request ID with a fresh nonce, fixed HTTPS destination and denial handling. This module
does not perform signing, networking, persistence, retries or employee dispatch.

Store a minimal `AskReceiptIdentity` with the outbox for reconciliation after raw answer purge;
its digest is over canonical AskAnswer. A changed delivery wrapper needs a new transport key,
while identical answer identity/digest stays stable. Receiving historical acceptance does not
prove current display permission. A decoded stale control page still contains privacy work.
`terminalControlPage` only describes an empty, current page with no cursor; durable application,
acknowledgment and generation checks must separately prove controls drained. Parsing never
creates that proof or dispatch authority. Apply earlier local deletion deadlines durably.

HQ envelopes are limited to 262,144 UTF-8 bytes and problems to 8,192 bytes. These are independent of
the browser question limit of 16,384 bytes/2,000 characters. Counterpart limits must remain bounded
and compatible; oversized legitimate HQ envelopes must fail visibly. Canonical v1 control
windows cap at 60 seconds, raw purge at 7 days and suppression at 30 days; local policy may be tighter.

The website writer owns the separate private SQLite/session queue, cookie/CSRF/ownership checks,
rate/global flood caps, leasing/control sync, durable nonces/receipts, deletion/restore and
safe status API. Admission stays disabled until real independent limits and all activation gates
pass. Its canonical DTOs must match this exact manifest; do not join visitor chats into the
public investment archive. Website implementation/testing is not inferred from the 224 HQ tests.

## Remaining acceptance

ASK-A04/A06–A08 and relevant A10/A12 still require actual website isolation, duplicate/flood,
retention and restore tests. ASK-02 must add durable admission, finite separate budgets, genuine
eligible-employee routing and least-privilege execution; ASK-03/04 cover UI and cross-system
acceptance. Existing production Codex 401 remains held until changed login/routing evidence.
No denied login was retried, no credentials copied and no provider/account proof manufactured.
The owner-reported Yahoo confirmation and standing deployment/release authorization persist.
