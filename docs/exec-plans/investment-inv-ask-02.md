# INV-ASK-02 — HQ retrieval and genuine employee routing

Status: signed-transport component validated; delivery [PR78](https://github.com/eugenelin89/bot_messenger/pull/78). Full ASK-02 remains incomplete. Sole writer is the existing INV-REAL checkout
on codex/inv-real-01, starting at accepted main 9b555bdfc3e3f2734aaf4e1653840c63c93292fc.
Start: October 13, 2026, 07:01 America/Vancouver. Initial ETA: 45–90 minutes for the transport source
component, conditional on review and a safe shared validation window with Motion.

## Selected next prompt

Implement the dormant signed Ask HTTPS transport against the accepted canonical 1.0 contract
and ASK-01 HQ boundary. Reconstruct structural prepared requests from typed trusted intent
before signing. Require fresh synchronous authority checks, dedicated Ask keys, fixed origin
and six closed operations, exact frozen bytes and fresh nonces. Bound headers/body/deadline,
validate TLS, deny redirects and cookies, and return sanitized explicit delivery uncertainty
without retries. Prove the implementation against authored real loopback TLS and adversarial
fixtures. No application wiring or claim of durable grants, intake, model answers or activation.

## Dependencies and ownership

The canonical contract and HQ boundary pass. The actual website queue is still waiting on its
own tool approval, so full ASK-01 remains partial. Architecture review accepts this independent
dormant component; it requires no website or provider request. All website work stays delegated
to asymmetri.co chat 01a13487-f07f-7182-84ac-84abcfb07043, which already has the exact handoff.
HQ d262a8d remains active with healthy database/dispatcher and degraded runtime. The first health
read in this wake used the wrong port; the documented 4310/api/health confirms the actual state.
The denied account login was not retried. Owner Yahoo confirmation and release authority persist.

The Mac dropped below the shared 15 GB admission threshold, so no Mac build/test was started.
Motion was told its native slot was not needed. Independent Linux admission showed 36.7 GB free,
1.5 GB available RAM and matching locked dependencies. Validation uses a new isolated directory
`/var/tmp/botsquad-ask02-On0HIy`, service user botsquad, a 512 MB Node heap and nice priority 10.
Production and the existing accepted staging tree are unchanged. Parent alone edits; reviewers
are read-only. Use normal reviewed PR integration and exact acceptance hashes.

## Remaining parent scope

Separate dedicated Ask grants and budgets, durable imports/outbox/control acknowledgment,
restart/restore and provider uncertainty, existing dispatcher integration, isolated public-service
contexts, real eligible-worker routing and genuine answers remain required. Transport success is
not employee acceptance. Do not infer public-service account eligibility from the private login.

## Review and validation progress

Architecture, security and recovery source reviews found no remaining blocker. Review tightened
request reconstruction (structural prepared data is not authority), detached input snapshots,
post-TLS authorization before any HTTP bytes, final post-sign rechecks, and explicit delivery
uncertainty. Tests independently observe HTTP request events and decrypted application bytes.
Same-key revocation, TLS setup deadlines and synchronous end() failure are covered. The end()
failure fixture proves conservative classification, not actual partial transmission.

Initial Linux build found a test fixture Duplex/Socket type mismatch; corrected without
changing application behavior. Initial focused run passed 261/261. Static manifest check then
correctly detected 457 AppleDouble transfer metadata files, including nine beside canonical
contract files. Only verified metadata in this temporary directory was removed, and the original
failure log retained. No contract bytes were changed or regenerated. The final rerun adds two
post-sign clock/key fence cases and passes 263/263, zero failures/skips. Build/typecheck/canonical
manifest pass; exact local/remote source hashes match. See
[acceptance](../validation/investment/INV-ASK-02.md) and its machine-readable receipt.
Production health remains unchanged; no account, market or model request was repeated.
