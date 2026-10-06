# Bounded business operations

Prompt 11 connects the existing mandate loop to one typed GitHub operation: replace one
existing ordinary Markdown document on one existing branch. It is neither a general HTTP
client nor a release/PR/merge/deployment system. [Decision 025](../decisions/decision_025_bounded_business_operations.md)
records the boundary; [validation](../validation/PROMPT_11_VALIDATION.md) separates implemented
behavior, simulated evidence, actual Ubuntu runtime evidence and the still-required live pilot.

## Ownership and authority

A business grant belongs to an existing mandate and its existing coordinator. Eligibility
requires an enabled persistent mandate coordinator, enabled principal and `internal_message`;
the owner chooses that coordinator through the existing mandate controls. No role name grants
provider authority. No employee role, hiring ceiling, retained capability profile or standing
research permission expands. Other employees analyze explicitly exported evidence through
existing internal Tasks and working groups; only the current coordinator can observe/propose.

Effective authority intersects the enabled human, current mandate/cycle/worker, current grant,
adapter/policy/mode, exact configured target, unexpired intent, immutable approval, settled
originating execution, intact evidence scope, and absence of an active/unknown target effect.
Messages, Decisions, group recommendations and ComputerSessions cannot grant or approve.
Client API v1 gains no business routes, DTOs, receipt content, events or approval powers.

An action has its own ID, original execution, mandate version, cycle, initiative and Decision,
grant, adapter/provider/type, exact repository ID/slug/branch/path, credential reference, prior
blob/head/content, replacement/edit/commit message, content hashes, risk/privacy/measurement/
cost/compensation disclosures, expiry, idempotency key and intent hash. SQL enforces lineage,
immutable originals, exact approval/attempt/receipt ownership and append-preserved history.
Changing any approved field requires a distinct intent and approval. One execution can propose
only one distinct action; identical duplicate requests return the retained intent, while
different metadata is rejected. Proposal allowance is consumed even after denial/failure.

## Evidence and retrieval

Business evidence is a trusted source admission, separate from worker interpretation. Retain
provider and source identity, observed/retrieved time, period, metric/value/unit, segmentation,
baseline definition (source/window/unit/denominator/freshness/missingness/privacy/lag/attribution),
reliability, immutable source reference/hash, category and mode. A Git commit time is source
metadata, not the time a business outcome occurred. Missing values remain unknown.

Modes are `real_live`, `real_read_only`, `public_source`, `owner_provided`,
`sanitized_snapshot`, and `simulated_fixture`. Existing public/sanitized identifiers retain
compatibility. A live adapter's baseline is REAL READ ONLY; its post-action document comparison
is REAL LIVE operational evidence. Fixture sources and receipts remain SIMULATED throughout.
Owner-entered legacy observations cannot claim REAL LIVE. A source failure admits no value.

The source snapshot retains the exact bounded UTF-8 document privately. The worker evidence
body clearly labels its first 12,000 source characters and omissions. Observation tools return
metadata/IDs; original retrieval uses the existing 6,000-character pagination, 48,000-character
per-execution budget and complete-current-original delivery hash before citation or proposal.
Catalogs contain bounded IDs and lifecycle metadata, not source bodies or action prose.
Full previous/proposed bytes are available to the owner. No private source is exported into
public repository acceptance files or automatically passed to public research.

Explicit group exports retain mode/source/hash/baseline/privacy provenance and a labelled
2,500-character source excerpt within the existing group bound. Task exports retain selected
original records within their 12,000-character packet ceiling. Withdrawal invalidates source
and derivative delivery, replaces coordinator scope, blocks prior Decisions/actions before
transmission and retains owner history. Late reads recheck scope, signal and shutdown state.

## Typed adapter and credentials

Production startup creates an adapter only when the service operator configures
`BOTSQUAD_BUSINESS_CONFIG`; it creates no grant or action. The protected JSON configuration
maps an opaque reference to a repository-restricted credential file and exact targets. Workers
cannot select a path, token, account, host, HTTP verb, headers, URL or executable.

Files must be bounded, owner-private regular files opened with `O_NOFOLLOW`. Every ancestor
must be a real directory owned by root/service and not group/world writable. No token enters
worker context, database evidence, logs, screenshots or exports. Tokens must actually be
restricted to the selected numeric repository ID; `repository_restricted:true` is an operator
attestation, not provider permission introspection. Live acceptance must verify that scope.

The adapter uses fixed HTTPS `api.github.com:443`, standard certificate/hostname verification,
fixed headers and GET/PUT paths assembled from validated fields. No redirects, cookies,
provider-returned URLs or arbitrary proxy configuration are followed. Each response is at most
1 MiB and each request has a ten-second deadline. Cancellation aborts source reads. Read verifies
repository identity, exact branch ref, commit/tree/blob hashes, non-truncated trees and exact
regular file mode `100644`; symlinks, executables, AGENTS.md and workflow paths are unsupported.
Paths traverse at most five components; documents are valid UTF-8, at most 64 KiB. One unique
old-text occurrence is replaced with literal new text, each bounded to 8,000 characters.

PUT uses GitHub Contents with the expected old blob SHA, exact new bytes, branch and reviewed
commit message containing the action ID. It neither creates a branch nor bypasses branch
protection. Repository workflow/automation must be reviewed with the owner. Blob comparison
is **not branch-head comparison**: unrelated files may advance, and an ABA change cannot be
excluded. The receipt retains the actual provider commit parent, never a guessed baseline head.

## Lifecycle, recovery and scheduling

`awaiting_approval → approved → executing → succeeded | failed | outcome_unknown`, with
owner denial/revocation/cancellation before execution. Controls after transmission remain
separate immutable intervention records and never erase receipt or uncertainty.

The coordinator commits `wait_for_external_action` and ends. Its model slot is released.
The original cycle deadline is never extended for approval. Before network I/O, the executor
atomically reserves the resource and inserts one `preparing` attempt. After read-only preflight,
it rechecks all authority and commits `transmitting` immediately before the PUT. The executor
reserves that worker during preflight/transmission, without consuming a model slot. Other
workers remain dispatchable. A pending read must settle before model commitment/finish.

Known pre-transmission failures and recovered preparing attempts fail with no replay.
Anything after the durable transmission boundary without a matching receipt becomes
`outcome_unknown`. A canonical repository-ID/branch/path SQLite fence spans grants and workers.
There is no resend endpoint or automatic retry. Unknown business effects remain distinct from
model-provider uncertainty, permitting scoped read-only review while the target stays fenced.
Known failed origin executions cancel their untransmitted orphan intents; immutable ownership
is never adopted by a new execution.

Trusted callbacks settle by action/attempt ownership, independent of a live worker context.
Late success after pause/stop/revoke retains the provider receipt and intervention. Shutdown
closes effect/read admission immediately and drains outstanding reads, writes and reconciliation
before database close. Startup recovers durable attempts and never starts an idle effect twice.

Owner reconciliation reads at most 20 path-history commits. Exactly one matching action-marked
message, exact after bytes and actual parent-path before bytes establishes **correlation**, not
cryptographic writer identity. That receipt is labelled `reconciled_correlation`, distinct from
`provider_response`. Missing, conflicting or unavailable history leaves uncertainty. Each action
allows at most six retained reconciliation attempts and one concurrent read; no history is erased.

Terminal actions advance the waiting mandate turn atomically and enqueue one fresh bounded
coordinator generation. Receipt, new observation and prior decision are independently retrievable.
The company then persists a Prompt 09 review schedule; restart preserves occurrence identity.
Cycle 2 must evaluate actual evidence and uncertainty, not infer business success from a receipt.

## Bounds and limitations

| Bound | Limit |
| --- | --- |
| Provider grant | One target, at most 24 hours, 1–3 proposals; 100 retained grants per HQ |
| Source retrieval | 12 attempts per grant, one concurrent; failed attempts stay consumed |
| External executor | One active attempt per HQ; one immutable attempt per action |
| Reconciliation | Six attempts/action, one concurrent, 20 history candidates |
| Worker tools | Existing 20 calls and 48,000 retrieved characters per strategic execution |
| Wait | Existing cycle deadline and execution budget; no model polling |

Operational `approved_document_present=true` proves only that the observed blob matches the
approved content. Customer benefit, adoption, revenue, attribution and monetary model/provider
cost remain unknown unless separately sourced. Provider exactly-once semantics are not claimed;
the guarantee is no blind duplicate transmission under BotSquad control.

Restoration is a new compensation proposal tied to a confirmed prior action, a fresh baseline
and Decision, exact retained previous bytes, current authority and a separate approval. An owner
compensation request is passive and starts no model. History, notifications, CI/webhooks and
other downstream effects cannot be undone by stop or document restoration. No money, release,
App Store, customer outreach, account creation, generic CRM or federation is introduced.
