# INV-ASK-CONTENT-01 — Dormant private content acceptance

**Status:** Bounded dormant source accepted; normal PR integration follows. This is a storage component of ASK-02; the complete
Ask packet and genuine operation remain incomplete. No HQ production deployment or authority
is supplied by this packet.

## Implemented boundary

[Decision048](../../decisions/decision_048_private_ask_content_custody.md) adds schema27 passive
Company metadata and a separately located private SQLite question/answer store. Company reserves
immutable question and answer identities before private writes. One exact answer and its
pending-authority outbox commit together privately. Exact existing content can reconcile an
interrupted projection; missing or contradictory previously committed content remains held.
The component accepts supplied answer bytes and does not prove an employee authored them.

Owned history is bounded by stored service/session/conversation identity and accepted minimal
receipts. Raw bodies never enter Company SQLite/WAL or ordinary Company backup roots. Private
path ownership/modes/inodes, single-link files, sidecars, persistent pair identity, original
retention and row/byte caps are checked. Backup exclusion is an explicit operator input, not a
claim that the live backup process has already been configured.

All retained controls, including ACKed controls, apply to local bodies and the outbox. Negative
answer receipts independently purge content. Cleanup still works after admission shuts off or
limits tighten. Missing/corrupt identities, unmatched store pairs and orphan content cannot
become permission to regenerate or redeliver. Uncertain metadata remains held after raw expiry;
pruning requires a reconciled terminal state. No runtime, dispatcher, model or network caller
is installed; the canonical protocol and dependencies are unchanged.

## Evidence and review

Implementation: `d9e422ea691f25ef79f13ed183bb76f49597e859`.

The [machine receipt](../evidence/inv-ask-content01/acceptance.json) records exact source
and raw-log hashes, commands, counts and qualifications. All416 selected build inputs match
local and isolated Linux source. Final build, typecheck, canonical manifest and **458/458**
checks pass, with zero failures/cancellations/skips. This includes **59 private-content cases**
and7 actual child SIGKILL boundaries. Sixteen raw logs are retained losslessly in JSON wrappers
with both raw and wrapper hashes; initial and failed runs are not replaced. Tests run serially
as unprivileged botsquad on Node24.21.0 in `/var/tmp/botsquad-ask-content-dyINjb`, with a 512 MB
heap and nice10, using matching locked dependencies. No heavy Mac job or account retry occurs.

Initial storage acceptance passed29/29. Expanded storage acceptance passed54/54, including
seven actual SIGKILL boundaries in disposable child processes: Company question reservation,
private question commit, Company answer reservation, private answer/outbox commit, accepted
receipt commit, discarded receipt commit and private control commit. These are authored local
storage failures, not worker/provider interruption or physical-erasure acceptance.

The first broader run passed377/384 and failed7: the simulator's explicit schema allowlist
still stopped at26. The allowlist now accepts the additive schema27 while rejecting other
unknown schemas. Original failures are retained. The second broadened run passed431/432; its only failure
was a future-schema fixture that still inserted27, now an existing version. The fixture now
inserts28 and retains the unknown-schema rejection assertion. Two older schema-count assertions
were updated and their AI-profile/engineering suites added. Final broadened checks cover every migration
suite, populated retained Company/portfolio/independent-spent-authority preservation, Company
controls, Ask contract/transport/control journal/content, canonical investment contracts and
financial arithmetic/recovery/snapshot behavior. Review also added receipt corruption, separate
clock freshness, deadline-shortening interruption and duplicate-purge recovery regressions.

Architecture, security and recovery specialists reviewed read-only and the writer corrected
their findings. All four advisory specialists accepted the bounded component. The test reviewer independently
recomputed every source/log/artifact hash and the raw test counts with zero mismatches. Normal
PR/check/merge remains a separate delivery step. No GitHub review
or CI result is inferred from these advisory reviews.

## Operational limits and next work

Raw SQLite deletion proves no filesystem, swap, backup or provider erasure. Both
`contentPurgeVerified` and `restorationVerified` remain false. Simultaneous rollback of the two
stores is not independently detected. Production private directory/backup/process isolation,
separate finite Ask grants and spent-budget custody, frozen signed attempts, genuine employee
routing, current generation/control coordination and combined load acceptance remain required.

The previous Linux observed-investment workflow timing failure remains unresolved; this packet
does not alter its stage bounds or rerun it as a claim of readiness. Production HQ remains
`d262a8dff59ab82587bd6444b083e5e9b7603cf0`, runtime authentication held after401. No real market or
model request, credit purchase, reload change, new portfolio, scope or retained-data reset occurs.

Website source `d0c454314d646b74895f4d9e3e4a014c63c666a6`, build `P7LP4PKXMUyZ96RJnAgcz`, was
released by its writer at19:08:31UTC with closed intake. The independent public
[read-back](../evidence/inv-ask-content01/public-readback.json) at19:14UTC confirms all three pages
HTTPS200, no Ask form, disabled availability and no Set-Cookie. The website writer reports112
preservation checks. Its receiver fixes require a separate rollout, delegated by the owner-
authorized next execution prompt; exact latest status belongs in the
[morning handoff](../../operations/INV-REAL-01.md). No fixture is represented as genuine activity.
