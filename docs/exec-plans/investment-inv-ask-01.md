# Execution plan — INV-ASK-01 contract boundary and private intake

Status: HQ source accepted by architecture, security, recovery and test review; delivery [PR77](https://github.com/eugenelin89/bot_messenger/pull/77). Full packet remains partial, with website private intake delegated to its existing chat.
Started: 2026-10-13 05:58 America/Vancouver. Initial ETA: 1–2 hours for the HQ packet,
subject to review; website execution remains at its own tool-approval boundary.
Source baseline: `6f7f644aa68df091b5088d6895548d0a76e13b45`.

## Selected next prompt

Execute INV-ASK-01 under the owner's entire-project continuation authorization. Reuse the
accepted canonical Ask 1.0 schema, OpenAPI, typed DTOs, signature profile and golden vectors.
Implement a typed HQ contract boundary with strict named-schema decoding, exact outbound
routes/permissions, bounded bodies and response identity checks for claims, renewals, status,
answers, receipts and privacy-control synchronization. Preserve the public publication
contract. No network, persistence or employee dispatch is introduced by this boundary.
Send the actual private website session/queue/intake implementation to the existing
asymmetri.co chat `01a13487-f07f-7182-84ac-84abcfb07043`. Do not claim its acceptance from HQ tests.

## Current evidence and constraints

- HQ deployed `d262a8d`, active, database/dispatcher healthy and runtime degraded at the wake.
  The previous account401 has no changed-login evidence; no denied authentication retry.
- Canonical manifest remains `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`.
  Ask definitions already exist; do not invent another wire protocol or mutable v1 extension.
- Existing `scripts/investment-contracts/ask.ts` is a snapshot conformance oracle, not durable
  intake, executable HTTP or genuine employee acceptance. Reuse its hash/schema primitives.
- Website source/intake/deployment is owned by its chat. It still waits for a tool approval;
  messages have supplied the exact packet and existing canonical digest. No bypass.
- Owner Yahoo clarification and release authority remain effective. No market requests,
  financial changes, paid data, credit purchases or account/credential changes in this packet.
- A typed valid message does not prove a durable import, control application, provider
  settlement, fresh generation after restore, or an owner Ask grant. ASK-02 must enforce those.
- Current ChatGPT-authenticated private runtime is not established for anonymous public Ask.
  Preserve the existing provider/account boundary until the actual supported configuration
  is verified; this does not prevent contract/source work.

## Work and acceptance

1. Review normative Ask requirements and predecessor contract; inspect counterpart ownership.
2. Implement a closed typed operation map and bounded strict response validation.
3. Exercise actual named wire vectors plus adversarial cross-service/generation/question/hash,
   malformed JSON, control pagination/freshness, identity and suppression receipt cases.
4. Obtain risk-routed read-only architecture/security/recovery/acceptance review and fix findings.
5. Run focused contracts/typecheck/build checks and relevant regression only. Coordinate native
   capacity with Motion; do not hold the slot during source authoring.
6. Update cross-repository handoff, evidence and morning report; normal reviewed PR/merge.
7. Leave website intake acceptance, real employee answers and anonymous activation explicitly
   pending until their actual implementation and technical gates are verified.

## Validation and review result

At 2026-10-13 13:21 UTC, build, typecheck, canonical manifest check and 224/224 focused contract
tests passed, with zero failures/skips. The first build exposed a test-only nonempty tuple
assignment error; repaired. The reviewed source hashes and log hashes are recorded in
[the acceptance receipt](../validation/evidence/inv-ask01/source-acceptance.json).

Architecture/security/recovery findings corrected: prepared claim expiry is rechecked before
transmit; late receipts decode separately from send eligibility; minimal non-content receipt
identity survives text purge; immutable historical controls survive tightened local retention;
configured freshness shortens only terminal-page eligibility. All three specialists accept the
HQ-only source boundary. Test review verifies the qualified acceptance and remaining gaps.

Motion explicitly lent then retook the shared build slot. Final own free disk was 15,508,062,208 bytes.
No overlapping heavy jobs were launched. No production deployment or account probe was performed.
Actual website private intake, its cross-host acceptance and ASK-02 routing remain unfinished.
