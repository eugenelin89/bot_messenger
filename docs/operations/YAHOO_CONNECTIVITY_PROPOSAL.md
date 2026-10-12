# Proposed second Yahoo connectivity test — owner approval required

**Status:** Proposal only. No new live owner capability, manifest, approval, reservation, Yahoo DNS query or
Yahoo request has been created by HQ-READY-03C. Do not execute the old qualification CLI.

The first HQ-READY-03B authority remains permanently spent, `noResume=true`, with its original
approval/accounting/cleanup receipts unchanged. Decision037 also remains exhausted4/4.
This proposal cannot expand or replace either authority. A later owner-selected source packet
must implement and independently review a distinct create-only one-shot capability, fixed new
anchor and cleanup path; the existing nine-read manifest cannot express this smaller scope.
Source acceptance alone would not authorize network access.

## Purpose and proposed bounds

Confirm whether the repaired Node transport can resolve the approved host, establish TCP/TLS,
send one minimal request and receive HTTP headers. This does not qualify financial fields,
validate a cookie/crumb session or authorize repeating the nine financial reads.

| Item | Exact proposed scope |
| --- | --- |
| Endpoint | **`GET https://fc.yahoo.com/`**, no query, body, credentials, Cookie or Authorization header |
| Attempts | **One total reserved attempt**, including any uncertain outcome. At most one resolver invocation (`all:true`), one selected validated public IP, one TCP connection and one HTTPS request. No retries, alternate IP, automatic family race, redirects, reconnect, fallback host, crumb or financial endpoint |
| Timing | Owner starts once within60 seconds of new manifest creation; expiry at60 seconds, request deadline10 seconds including DNS/connect/TLS/write/response, overall process ceiling30 seconds including cleanup. Deadline/expiry/stop abort and consume the attempt; no resume |
| Bytes | Maximum16,384 parsed HTTP header bytes and4,096 application body bytes consumed, also the aggregate body cap. Stop/close on cap or malformed/oversized content. Reject compressed responses. Discard all body and cookie/header contents immediately; do not follow or reuse Set-Cookie |
| Byte-accounting limit | These are application limits, not exact network-bandwidth caps: TLS/TCP overhead and already-buffered unread bytes are not counted as retained data. Destroy socket immediately on stop; do not claim zero peer bytes or a hard total-wire-byte ceiling |
| TLS/network | Normal certificate-chain/hostname verification and original SNI. All returned DNS addresses must validate as public; pin exactly one. No disabled verification, proxy, login, CAPTCHA, consent, identity rotation or separate DNS connectivity probe |
| Headers | Fixed `User-Agent: BotSquad/0.1 private personal research`, `Accept: application/json, text/plain`, `Accept-Encoding: identity`; ordinary Host header. No account login, Python/yfinance operation, persistent session or cookie jar |
| Durable logging | New scope/source/build identity, one reservation, allowlisted endpoint ID, milestone names/UTC timestamps and elapsed milliseconds, allowlisted error category/code, HTTP status if known, consumed byte count and cleanup result. No raw exception, IP/DNS answer, certificate, environment, request parameters, body, cookie, credential, header content or financial observation |
| Retention | Raw response data remains in bounded memory only until immediate discard/close. Disable core dumps and verify the existing encrypted-host/swap/backup controls. Retain only private non-data approval/spent/stage/accounting/cleanup evidence to prevent replay; Git may retain a non-data outcome summary. No capsule carrying financial data, backup or public data export |
| Stop conditions | Stop after this response, any error/timeout/cancellation/expiry, unapproved/private/mixed DNS answer, certificate failure, lost accounting, status refusal/429/redirect, malformed/oversized/compressed data, consent/login challenge or indeterminate settlement. No follow-up action from any status |
| Interpretation | Any validated HTTP status proves HTTP connectivity for this endpoint/time only. A403/429 records an explicit HTTP response and a refusal/rate result; other status meanings require evidence. Success does not establish financial-data quality, broader Yahoo availability, ongoing automation rights or permission to proceed to financial reads |
| Costs and operations | US$0 market-data spend; no employees/models, trading, recurring collector, production/Asymmetri deployment, public publication or account/billing changes |

The60-second capability lifetime is an upper limit, never a second attempt window. The30-second
process ceiling begins at consumption, with the10-second transport deadline beginning before DNS.
The proposal should not be executed if the new capability cannot enforce every bound above.

## Permission provenance and approval gate

[Decision038](../decisions/decision_038_yahoo_finance_private_source.md) records the owner's
reported verbal Yahoo permission for personal use. It is not independently verified writing,
and the original conversation's exact automation/retention/public scope remains unknown.
Preserve that provenance accurately; do not demand writing as the only possible form of evidence,
and do not convert it into unrestricted rights.

Before any network access, the owner must **separately approve this exact one-attempt scope**
and confirm that their reported permission covers this minimal automated personal-use GET and
non-data receipt retention, with any narrower conditions applied. Freeze the reviewed source
and exact new manifest after that decision. Neither this document nor the HQ-READY-03C request
is approval. No preparation or execution occurred during this task.

If this connectivity test succeeds, stop. A later financial-data qualification still needs its
own explicit scope, custody and approval, and genuine financial-data qualification remains blocked.

## HQ-READY-03D disposition — 2026-10-12

The owner has now explicitly approved this exact one-attempt scope and confirmed that their
reported Yahoo permission covers the minimal automated personal-use GET and non-data receipt
retention, to the best of their understanding. [Decision040](../decisions/decision_040_one_shot_yahoo_connectivity.md)
records the separate authority; [03D acceptance](../validation/investment/HQ-READY-03D.md) records
its current source, execution and cleanup status. The03C proposal/history above remains provenance.
The new implementation tightens body consumption to zero by closing at headers and independently
bounds consumption through cleanup to10seconds. Body contents/challenges remain uninspected.
The original03B authorization is never reset or reused.

The 03D authority was consumed once on 2026-10-12: verified TLS and HTTP 404 headers were received,
then the response size check stopped processing with zero body bytes consumed. The child exited,
private non-data cleanup is recorded and the new authority is permanently spent 1/1/noResume.
This proposal is fulfilled and supplies no further request authority. Financial qualification
remains blocked; the exact evidence and limitations are in the 03D acceptance record.
