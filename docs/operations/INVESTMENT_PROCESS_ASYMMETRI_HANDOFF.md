# Asymmetri handoff — investment process

Status: source preparation only, 2026-10-17. No consumer changes or deployment.
BotSquad parent worktree: `bot_messenger-investment-mandate`, branch
`codex/investment-mandate-research`, base `17729d2`. Final source identity is the
commit containing this packet. Counterpart inspected read-only at local
`/Users/eugenelin/dev/asymmetri/website`, HEAD `040835c2b3c5f4185c8c6a539a1f34d0722f1a16` (verify before future work),
including AGENTS.md, BOTSQUAD_INTEGRATION.md and INVESTMENT_RECEIVER.md.

## Current compatibility boundary

Canonical `contracts/investment/v1/` bytes are unchanged. No new event/field is emitted.
Existing source grants and receiver archives are untouched. Saving a process-enabled
scope on a book causes producer projection **and delivery rights rechecks** to reject
with `investment_process_publication_review_required`, including a standing grant.
Already published decisions, receipts, snapshots, benchmark amendments and failures
remain immutable and accessible under existing visibility. This is a visible producer
hold, not a receiver outage or a retroactive withdrawal. A heartbeat must not be
interpreted as a fresh decision or current valuation.

New exact primary-page permissions are for private automation, retention and AI
processing. Neither those permissions nor the objective permits public redistribution
or derivative publication. Private objectives, permission notes, exact research
requests, raw/extracted pages, full assessments, transcripts, identity/account data and
model details must stay inside HQ. Existing `publicSummary` fields are retained private
candidates, not sufficient authority to release derivatives from the new sources.

## Separate implementation packet if public display is requested

1. BotSquad owns a separately reviewed, allowlisted public derivative and source-rights
   approval. Pin the exact canonical schema version/manifest and producer commit;
   never reinterpret private JSON as a public contract.
2. Proposed fields for that review: applicable exchange session, final decision class
   (retaining investments / deliberate cash / blocked), short original approved reason,
   coarse evidence gap and concrete next action, strategy-review due/completed status,
   matched evaluation start/end/count, missing/unmatched dates, cash-baseline assumptions,
   costs/exposure/time-in-cash definitions, and retained benchmark-amendment references.
   Omit private objective text by default. Source links/quality labels need explicit
   permission and exact approved attribution. Do not export raw source bodies.
3. Asymmetri owns pinned consumer validation, archive projections and Trade display at
   `/botsquad/trade`, preserving exact-run routing, historical redirects, versioned
   records, stale/held states and unknown values. Show actual comparison endpoints and
   methods. Blocked is not an investment recommendation; cash review is not a buy signal.
4. Verify old signed event-prefix readability, unknown-version rejection, missing-data
   display, no private canaries, stale/blocked display and byte-identical contract pin.
   Keep Ask disabled and unchanged. Owner reviews the exact sanitized fixture and public
   disclosure before publication authority is extended.
5. Coordinate producer/consumer source identities and separate explicit deployments.
   Reconcile existing outbox/receipts and preserve spent allowance. Release only the
   exact newly approved derivatives; never bypass the hold with SQL, a generic standing
   grant or a publisher-key renewal. No atomic cross-repository release is assumed.

## Consumer request

Prepare the safe public projection/UX above only after explicit owner selection. Return
its canonical contract pin, consumer commit, fixture/browser/receiver results and exact
rollout/rollback plan to the BotSquad owner. Do not change the receiver's privileges,
keys, official run, archive history, website runtime or Ask intake from this handoff.
