# Personal Operator Stabilization 03 — Owner Attention

**Status: Complete and deployed — code, exact Ubuntu/browser validation, preservation and real private UI acceptance passed.**
**Date:** 2026-10-06. Decision 026 applies; this is not Prompt 12.

## Definition and architecture

An item represents a current unresolved authoritative condition with a supported owner
decision, inspection, recovery or cancellation path. `GET /api/attention` is a local-owner
browser projection under existing Host/Origin/Fetch-Site and device-bearer restrictions.
The trusted synchronous projection uses SELECTs only; it avoids domain inspectors that
expire approvals or clean up device records. It requires the enabled human owner.
There is no migration, persisted attention state, dismissal, new authority or v1 endpoint.
Opening/refreshing it invokes no model, provider, research, Computer or business action.

Metadata consists of deterministic source IDs, typed destinations, timestamps and fixed
trusted labels/summaries. No stored objectives, error prose, request bodies, documents,
credentials, secret approval material, filesystem paths, screenshots, payloads or authority
envelopes enter this response. Detailed evidence remains in the existing inspectors.
The response includes exact total/category counts and up to 200 sorted items; truncation is
explicit. It scans current persistent records to classify them; it is not an event feed.

## Source inventory and exact classification

| Source | Included condition and owner path | Exclusions/history |
| --- | --- | --- |
| Ordinary Task | Enabled assignee, blocked/failed/awaiting approval, supported Task inspection/cancel/retry subject to existing limits | Queued/working/completed/cancelled, waiting_children, unresolved children, handed-back terminal parent, ordinary waiting integration, specialized domain-owned Tasks |
| Executions | Stopped unresolved runtime attempt, or latest stopped execution owning an unresolved conversation session with no live turn; owning actionable workflow or execution evidence fallback | Running model work, settled failed attempts under recovered work, earlier successful turns sharing a session |
| Infrastructure | Pending unexpired exact approval; consumed running operation with retained reconciliation error; unresolved coordination Task whose requested identity/project binding is still unsatisfied | Expired/denied approval itself, settled operations and satisfied bindings; ordinary running operation |
| Project Git | Pending unexpired publication approval; consumed running operation with error; current blocked remote repository in active project without pending/running publication | Terminal operations and expired approvals; normal pending automated continuation |
| Direct/peer conversation | Nonarchived failed/blocked/interrupted reply obligation, one item per conversation; inspect/cancel | Queued/waiting_peer/replying, cancelled/completed, archive; a newer unrelated success does not settle an older obligation |
| Working group | Current blocked group, existing inspect/finish/stop controls | Draft/active, intentional pause, stopped/completed/archived |
| Mandate/cycle | Active/blocked mandate with current blocked cycle or blocked mandate; inspection/controls | Draft, paused, stopped/cancelled, closed old cycle, waiting/backoff/ordinary active work |
| Company clock | Blocked current-version no-cycle occurrence on active/exhausted schedule and active/blocked mandate, with no later cycle | Future due time, exhaustion alone, old versions, cancelled/paused/completed occurrences |
| Computer | Requested unexpired policy or unexpired pending intent awaiting approval; unknown session/intent; unstarted requested/ready expired policy; unconfirmed terminal browser shutdown | Normal ready/provisioning/active, approved intent awaiting continuation, confirmed terminal history. Requested expiry links to Task cancellation; ready expiry to session inspection |
| Business | Awaiting exact approval with current active mandate/version/cycle, unexpired cycle/action/grant, no revocation/control/withdrawal, and live or matching committed action proposal; outcome_unknown regardless of stop/revoke | Old approvals, historical attempts/receipts, exhausted/revoked grant alone, obsolete/withdrawn/orphan proposal |
| Research | Durable unknown unresolved broker operation, existing operation inspector | Settled/history and normal executing research |
| Device | Pending device linked to claimed unexpired pairing; fingerprint confirmation/deny | Open/unclaimed/expired pairings; active/denied/revoked devices |

## Deduplication, ordering and UI

Effect/session state owns specialized Tasks. Exact approvals own their pending operations.
Research uncertainty suppresses the same Task/conversation/group/mandate blockage. Provider
uncertainty upgrades its actionable owning workflow rather than adding an execution badge;
a closed workflow retains a fallback execution item while its independent fence exists.
A coordinator fence in its current mandate-owned group suppresses the same parent cycle
blockage (group + current cycle + coordinator identity join); uncertainty in a specialist
child does not blanket-hide independent parent blockage. Execution/attempt/receipt/grant
history is supporting evidence, never independent attention. Source identity keys choose
one highest-priority condition. Mandate cycle and current blocked occurrence share one key.

Categories sort **Uncertain outcomes → Approvals → Blocked work → Failed work → Device
identities**, oldest first within category, stable identity tie-break. No inferred severity.
Attention appears near the top of Workspace with `…` before a successful read, `?` on an
unloaded failure, verified `0`, or bounded `9+`. Cached counts carry `*` and a stale explanation
until Attention succeeds in the current connection generation. Loading is never empty.
Zero says “Nothing needs your attention right now”; it does not assert universal health.

Cards show category, short source identity, time, trusted explanation and navigation only.
Links select existing exact approval, Task inspector, session, group, mandate/action,
conversation, device or research inspector; repository/host evidence uses existing sections.
There are no consequential buttons or arbitrary dismissal in Attention. Navigation honors
Stabilization 02's serialized refresh, cancellation, generation fencing, final user intent
and independent auxiliary errors. Read navigation survives degraded cached state. Generic
Computer Task retry is hidden because the server already disallows it; cancellation remains.

## Validation and review

- TypeScript check/build pass.
- [Final focused tests](evidence/personal03/local-focused.txt): **52/52** (51 classification,
  1 HTTP). Repeated HTTP reads compare every table unchanged, zero fake-runtime calls,
  bounded/sanitized metadata, existing Host/Origin/cross-site/device boundary and absent v1/write route.
- [Affected domains](evidence/personal03/local-domains.txt): **287/287** before five final
  edge-case tests; covers control, HTTP, infrastructure, remote Git, conversations, discussions,
  mandates, Computer, business and authority. The final edge cases pass in the 52-test run.
- [Browser regressions](evidence/personal03/local-browser.txt): **45/45** (12 Attention,
  22 startup/reconnect and 11 existing client/conversation/group/mandate/research/demo checks).
  Real browser over isolated backend fixtures, desktop 1440×1100 and narrow 390×844. Zero
  unexpected writes/errors; source resolution uses an explicit fixture approval denial.
  Synthetic screenshots inspected locally; no production private screenshot is published.
- Fixtures inject explicit durable unknown states where appropriate; group coordinator
  cases use real convene/wait/domain progression. Business uses SIMULATED adapter receipts.
  This is deterministic/local integration acceptance, not real model or business execution.
- Initial fixture failures were corrected: actual group charter prerequisites, consumed
  approval timestamps, runtime binding/starting event, exact integration delivery join,
  auxiliary-error browser request race. Assertions were retained; nested macOS confinement
  requires running its existing trusted fixture recipe outside the outer tool sandbox.

Read-only specialists: **control_plane_architect**, **security_reviewer**, **test_reviewer**.
Findings resolved: shared-session historical duplicate; waiting-integration relationship;
research ownership; coordinator-owned group/parent duplicate; expired unstarted Computer;
blocked no-cycle occurrence; stale cached count across reconnect; business lifecycle filters;
unsupported Computer generic retry. Tests cover the fixes. Security and architecture reviews
closed with no material findings. Test review requested exact group selection (strengthened)
and final host/deployment evidence, now supplied below. Parent is sole writer.

Ubuntu candidate verification exposed two fixture-order assumptions. The first domain run
was 290/292: the coordinator tests had assumed UUID-dependent group roster order. Explicit
coordinator priority preserves every original assertion; corrected Ubuntu focused checks
pass 52/52. Initial Ubuntu browser run was 33/34: the narrow held-startup test timed out
waiting for Mandates while renewing the session during release. The fixture now verifies
boot completion before renewal; the separate held-read reconnect cancellation test is
unchanged. The precise original release/abort mechanism is unproven. The new narrow status
wait reads text because its footer is intentionally hidden; final local startup is 22/22.
The original failed Ubuntu logs are retained alongside successful results. Test reviewer
confirmed both fixture changes preserve coverage and do not weaken assertions.

Exact code integration: [PR #23](https://github.com/eugenelin89/bot_messenger/pull/23),
merge `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5`. Exact merged Ubuntu check/build and
[292/292 domain checks](evidence/personal03/ubuntu-merged-domains.txt) and
[34/34 browser checks](evidence/personal03/ubuntu-merged-browser.txt) pass with no skips. Node 24.21.0,
existing Chromium bundle, non-root `botsquad`, isolated fixture directory and development
identity backend; no production fixture or live model run. Concurrent PR #24 added separate
investment design documents on main; those are preserved. No runtime/test/dependency
change came from that concurrent merge, and this task did not create its Decision 027.

## Production classification and acceptance

Read-only baseline investigation found one genuinely unresolved retained Task:
`task_cae78898-23c9-4e76-b6e5-4440e4fa8fdf`, infrastructure coordination assigned to Nix.
Its create-worker-identity request expired; target remains enabled and has no OS identity,
with no later resolving operation. The expired approval is historical and excluded; the
unresolved coordination has a supported Task inspection/cancellation path. Cancellation
allows a fresh request; generic retry cannot grant host authority. Do not cancel it for
acceptance or revive the old approval. The deployed projection and real UI both confirm **1 blocked item**.

[Deployment receipt](evidence/personal03/deployment.json): exact merge `c6c8f0b47f59a02ebb5142361e2d396a4f075dc5`,
259 independently rebuilt dist/public files match; dependency lock unchanged. Consistent
root-private backup made with services stopped, at
`/var/backups/botsquad/personal03-20261006-production`. Runtime/dispatcher ready, loopback
only, pause=false preserved, provider unconfigured and temporary credential absent. No
schema/authority activation. Original **59,909 rows across 82 databases**, **212 homes**,
**702 root records** and **427 account/group mappings** passed comparison. Only the existing
`workers.updated_at` startup-timestamp exclusion applies; normal startup audit rows append.
Prompt 11 action/approval/attempt/receipt and Stabilization 01/02 evidence remain intact.

[Real private UI acceptance](evidence/personal03/production-ui.json) passed through the normal
port-4310 SSH tunnel, native SSE and real production records, at 1440×1100 and 390×844.
Each viewport used an uncached hard reload with a held real company read: immediate
Attention rendered loading and `…`, then verified `1`. Its sole item opened the exact Task
inspector with legitimate cancellation, no unsupported generic retry; Attention → source →
back and width checks passed. Actual tunnel termination/recreation retained `1*` and the
last item, then recovered to `1`. **Zero page errors and zero non-GET requests**. The Task
was not changed. No private screenshots or record bodies were exported. The acceptance
[driver](evidence/personal03/production-ui.mjs) records only sanitized outcomes; its import
is package-relative for reuse. An initial alternate-port probe was rejected by the existing
Host boundary before UI work; the normal port was used without changing that boundary.
Local locked dependencies were restored in the dedicated worktree after the shared
dependency directory disappeared; package/lock files did not change.

[Post-UI preservation and idle](evidence/personal03/production-ui-idle.json) passed another
30-second sample: all table counts and pause state unchanged; zero running/queued work,
ComputerSessions, active schedules, pending reads/reconciliations or business attempts.
The complete original-record/home/account/root-record comparison passed again after UI.
Production retains 8 workers, 48 Tasks, 69 executions, 2 closed cycles and 1 business receipt.

The documentation completion follow-up changes no source, public asset, test or dependency.
Its final merged deployment identity is recorded in the protected completion receipt and
final handoff; it uses the same accepted implementation with an independent exact-revision
build and a repeated read-only tunnel/idle check. This avoids embedding a commit's own hash
inside its content. No remaining product or acceptance gate is deferred.

## Limits and next candidate

Local owner browser only. Counts describe classified current conditions, not complete health
or an activity/unread model. Up to 200 cards are returned with exact totals. Domain resolution
continues through existing inspectors and may require explicit owner decisions; Attention
never reconciles or retries. No live-model workflow was rerun because authority, dispatcher,
runtime and recovery execution did not change. Next candidate: simplify common operator
status/recovery wording using actual daily use, preserving these authority boundaries.
