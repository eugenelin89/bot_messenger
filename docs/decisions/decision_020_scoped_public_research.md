# Decision 020 — Scoped public research and standing knowledge authority

**Date:** 2026-10-01

**Status:** Implementation decision for WE-01; acceptance is tracked separately in the
[execution plan](../exec-plans/worker-empowerment-01.md).

## Context

[Decision 019](decision_019_near_term_worker_empowerment.md) prioritizes useful worker
capabilities and routine standing authority. Decision 018 keeps conversations separate
from Tasks and preserves worker identity when provider contexts change. Previously,
research meant analysis of approved reference documents; current external facts were
unavailable to ordinary workers. WE-01 supplies a bounded first slice, without renumbering
Prompt 08 or claiming completion of the broader empowerment direction.

## Decision

Add `research_search`, `research_open`, `research_read`, `research_sources` and
`read_company_document` as trusted dynamic tools for eligible workers. Public lookup
and company-document reading require separate explicit owner standing grants. The
browser owner selects a worker and confirms a preset once. Public Research permits
repeated routine lookups in research Tasks and conversations; Company Knowledge permits
only the selected approved reference paths. Neither permits external disclosure of
internal documents. Existing Task `read_document` permissions remain the earlier,
explicit approved-reference mechanism; new conversation access uses the separate grant.

Eligibility is trusted role/capability policy (CEO, researcher or Product Manager with
internal messaging and reference reading), never a display name or an agent's claim.
Effective access checks implemented capability, company policy, current immutable grant,
worker eligibility, current execution ownership and work scope. Grants record the human
issuer, trusted operation, modes, resources, numerical limits, policy version, creation,
optional expiry and final revocation. No worker can grant or delegate these powers.
Schema migration 9 creates empty authority tables; it does not enable any worker.

Use the existing configured Codex account with the pinned **0.157.0** App Server.
The ordinary worker's native web, shell, browser, desktop, plugins and inherited MCP
remain disabled. `research_search` invokes an isolated native live-search broker with
only a bounded public query and UTC time, without parent messages/documents. Its
thread/reference, model usage and outcome belong to the parent research operation.
The parent keeps its shared execution slot while awaiting the broker. There is no
independent queue, recursive delegation or hidden unbounded agent pool.

Native search can search/open/find through its external provider. BotSquad controls the
brief, tool configuration, invocation count, deadline and returned output; it does **not**
control or observe every provider request, DNS resolution, cache or internal search count.
Matching binary schema and a real existing-account probe, not current documentation
alone, establish protocol support. A live-search setting is not proof that each snippet
contains a fresh observation. No separate API key, new provider billing or account is used.

`research_open` uses a managed static HTTPS reader: GET on port 443, no credentials,
auth headers, cookies, request bodies, proxy configuration or JavaScript execution.
Validate public IPv4/IPv6 answers and pin the connection to those answers, retaining
normal hostname/TLS validation. Revalidate every redirect. Reject protected hosts,
non-public addresses, credential/control URLs, compressed responses, unsupported types,
large responses and excessive redirects. A URL filter cannot prove that every public
GET endpoint is side-effect free; this is an information-retrieval tool with conservative
control-path checks, not a general authenticated browser or permission to operate sites.

## Bounds and ownership

| Boundary | Default hard application limit |
| --- | --- |
| Public query | 500 characters |
| Operations per work | 32, shared across the root delegated research Task tree; per conversation otherwise |
| Search broker invocations per work | 8; opaque native internal activity is not counted as application calls |
| Worker operations | 120 per UTC day; 12 in a rolling minute |
| Broker deadline | 90 seconds, then interrupt with a bounded six-second settlement wait |
| Managed page | 15 seconds including DNS; 1 MiB response; three redirects; identity encoding only |
| Retained source text | 24,000 characters; up to 12 sources per lookup |
| Returned result | 16,000 serialized characters; 160,000 aggregate per work |
| Stored-source slice / document excerpt | 6,000 / 10,000 characters, shortened further for serialization |
| Evidence capacity | 20,000 operations, then an explicit operator retention review |

Attempts reserve durable budget before I/O outside SQLite transactions. Replays share
in-flight promises or return committed receipts only under current authority. Cross-tool
call IDs remain execution-wide. Regrant, retry, fresh conversation and context replacement
do not reset daily attempts; replacement does not reset work budgets. These are count,
time and output controls, not a monetary spending guarantee.

Revalidate grant, work scope, cancellation and execution ownership before source commit
and delivery. Revocation aborts local pending work and withholds late output; a query
already transmitted cannot be withdrawn. Other tools and completion cannot race an
unfinished research callback. Known source errors are durable tool failures without a
provider fence. An ambiguous model invocation retains an independent unresolved record,
blocking both further lookups and future Task/conversation dispatch for that worker.
A confirmed parent settlement cannot erase broker uncertainty. Recovery never blindly
replays a pending lookup; reserved but uninvoked work fails, ambiguous invocation remains
unknown, and consumed budgets stay consumed.

## Evidence and continuity

Retain operation identity, worker/execution/origin/scope, grant/policy, minimal request,
provider, actual returned/accessed source URLs, retrieval time, source-supplied time when
available, freshness label, bounded text, SHA-256 and omissions. Provider snippets,
managed page excerpts and provider summaries are distinct. Publication/observation fields
remain null when not reliably supplied; workers must cite an observation stated in the
source rather than substitute retrieval time. Current-weather replies need a location,
units and observation/forecast time. Missing or stale facts are not filled from memory.

Source reads and paginated listings are restricted to the same worker and work scope.
A public URL does not make the query or conversation that obtained it public. Retained
source IDs and timestamps survive restart and conversation replacement. Task managers
receive the subordinate's explicitly submitted report through existing child-result
context, not unrestricted access to another worker's search history.

Dynamic tools persist in Codex threads. First activation replaces only affected
conversation contexts through normal generation/handoff rules. Affected research Tasks
use a separate persisted research binding with predecessor provenance, preserving the
legacy binding. Revocation does not remove a tool schema from a live context; every call
rechecks authority. Unaffected engineering/infrastructure bindings remain reusable.

The browser exposes capabilities, standing grants, activity and source inspection with
escaped text and HTTPS links. Client API v1 gains no capability, management route,
conversation access or research history/event payload. Retained production activation
requires a separate one-time owner confirmation, even after deployment.

## Limits and follow-up

Query minimization, credential-pattern rejection and hostile-page tests reduce risk;
they cannot prove all semantic information leakage impossible. A worker with internal
context can attempt to encode private facts in an apparently public query. The broker
never receives that context automatically, and internal reading grants no disclosure
permission, but comprehensive data-loss prevention is not claimed.

Static extraction omits dynamic content and may encounter large pages, rate limits,
compression, bot defenses or unavailable sources. Workers may try another permitted
source within bounds and must report the limitation. No CAPTCHA or access-control bypass.
Provider availability and model/account access remain operational dependencies.
Scheduling belongs to Prompt 09, controlled Computer Use to 10, and the operating pilot
to 11. Working groups in Prompt 08 remain the next numbered milestone.
