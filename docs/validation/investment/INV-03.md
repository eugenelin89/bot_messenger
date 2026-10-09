# INV-03 — Artifact/discussion archive and INFRA-02 remediation

**Accepted October 9, 2026 for source and private synthetic scope. Remaining
activation dependencies documented.** INV-04 is ready for a separately selected
fixture-based packet. No subsequent milestone, website release, public receiver,
real publisher, market collection, official trading or Ask was activated.

## Exact cross-repository state

- [Asymmetri implementation](https://github.com/eugenelin89/asymmetri/commit/6a80e28494274b3fce1d51a45b7bf012cf2ae97e): `6a80e28494274b3fce1d51a45b7bf012cf2ae97e`.
- [Separate Engineering Journal](https://github.com/eugenelin89/asymmetri/commit/e1b750bbecb4c3aedcbddeb94a4aab4c64bf6b03): `e1b750bbecb4c3aedcbddeb94a4aab4c64bf6b03`, prompt 055. Both pushed; main clean and equal to origin/main.
- Installed private receiver source receipt: **`6a80e28494274b3fce1d51a45b7bf012cf2ae97e`**, 75 source/compiled files hash-verified. Previous source `a38696e9efb4d55dff1835d4dbb674454332170d` retained with complete empty schema 001/config/unit for receiver-only rollback.
- Public website unchanged at `745a92c676bcbe85c3aa675a1099d26321f1c1e2`; no website service restart/release.
- [PR35](https://github.com/eugenelin89/bot_messenger/pull/35) reviewed and merged `7cd52672ab1de1dc687d6aeebc718919760ac2e5`.
- [PR36](https://github.com/eugenelin89/bot_messenger/pull/36) corrected README/index/version/whitespace at `b6701c1051ccb8aae574283615f95569d9976dc0`, retargeted to main, independently reviewed and merged `8a150eb47cd1f1cbc9b5cb3178775ae656052fdf`.
- This separate documentation handoff starts at BotSquad main `8a150eb47cd1f1cbc9b5cb3178775ae656052fdf`, in owned branch `codex/inv03-archive-handoff`. No HQ runtime changes. Integration/host updates are sequential, not atomic.
- Contract 1.0 stays at `ba3dd74bc6be495f655b5ad1e6e4ba3fdf85b755`, manifest `7ec71b39d7a25c7067ade8b26d37f1a58552b2dbfd14e9b6d7aa827ccc867e31`. Decisions 029/030 remain unchanged.

The pinned Asymmetri [acceptance](https://github.com/eugenelin89/asymmetri/blob/e1b750bbecb4c3aedcbddeb94a4aab4c64bf6b03/docs/INV-03-VALIDATION.md),
[operations](https://github.com/eugenelin89/asymmetri/blob/e1b750bbecb4c3aedcbddeb94a4aab4c64bf6b03/docs/INV-03-OPERATIONS.md)
and [ingress](https://github.com/eugenelin89/asymmetri/blob/e1b750bbecb4c3aedcbddeb94a4aab4c64bf6b03/docs/INV-03-INGRESS.md)
records own exact commands, limitations, measurements and issue closure evidence.
Raw private evidence and screenshots remain outside Git; no keys/private inventories
or real employee/athlete/market data were published.

## Delivered and accepted

Migration 001 checksum unchanged; additive 002 provides exact rights approvals,
registry controls, immutable owner audit, correction release, denied hashes, read
holds and future-event suppression. All seven artifact states are accounted for:
registered, awaiting_publication, published, failed, withheld, superseded, withdrawn.
Exact versions preserve source/author/time/rights/limitations, related artifacts and
corrections. Worker, owner and system discussion contributions preserve participant,
order, reply, evidence, challenges, synthesis, dissent, unresolved issues and closure.

Asymmetri routes under `/botsquad/investment` include registry/discussion index,
`/artifacts/{id}/versions/{version}`, `/discussions/{id}` and typed exact records.
Safe Markdown/text/JSON/CSV/normalized PNG content is bounded and SHA256 verified.
Current metadata and control visibility are checked before headers, during streaming
and before page rendering. Withdrawal covers shared-byte aliases, late publication
and older-backup replay; no claim can recall already transferred bytes.
Owner rights approval binds exact artifact metadata; signature/run approval alone
cannot permit observed market-derived publication. Real provider selection is INV-06.

Complete backup verifies SQLite/FKs/CAS, disabled config, current controls, schema,
runtime and receipt watermarks. Restore creates a durable incomplete marker before
copy, holds reads, fences authority and requires independently verified **current**
controls before read release. AES256-GCM backup files publish final names only after
authentication/fsync; crash partials are never restore inputs. Owner CLI controls
remain local; there is no public administration or Ask endpoint.

## Actual tests and limits

| Evidence | Actual result |
| --- | --- |
| Receiver regression and archive tests | 200/200 local Node 24.10.0; 200/200 actual Ubuntu 22.10/Node 22.23.1, SQLite 3.53.4 |
| Nginx 1.22 stream TLS/SNI | 62/62; verified TLS 1.2/1.3, ALPN, trust/hostname, strict signed request and pipeline mutation checks |
| Nginx HTTP profile | Rejected, 48/52: HTTP/1.0 normalized/accepted, duplicate Connection hidden/accepted, keep-alive sentinel mutation, plus failed parent |
| Sustained actual-host synthetic load | 953.199s; 1,894 events, 62 artifact versions, 1,800 added contributions, 240 grouped reads, retries/checkpoints/idle intervals |
| Resources | Cgroup 92.98 MiB/RSS 121.34 MiB/swap 1.004 MiB peaks; available RAM minimum 319.92 MiB/disk 13.424 GiB; CPU 142.181s/throttled 123.244s; no OOM/threshold abort |
| Latency | Write p95 4.604s; read p95 2.891s; final 48-read follow-up p95 3.498s. No performance improvement or public SLA claimed |
| Existing site during load | All homepage probes 200, maximum 186ms |
| SQLite contention/recovery | Four signed writes plus 12 reads during 300ms writer locks; graceful/SIGKILL preserved 1,898 events/66 batches/exact receipt; duplicate/conflict/rotation/fence/cursor reset pass |
| Complete restore/encryption | 65-file manifest verified; newer withdrawal reconciled after fenced restore; 11,335,680-byte tar round-trip authenticated and hash-identical; temporary key deleted |
| Low disk / confinement | Isolated 8 MiB tmpfs rejects upload 503 with no event mutation, retains receipts; no elevated capabilities, code unwritable, 10 private roots hidden, loopback only |
| Human views | Five formats, long report, safe states, pagination, exact links, 320–1920px layouts, keyboard focus, console clean; fixture labels persist on failure |
| Website tooling | Check/Sites build/Next webpack build pass, root+receiver production audits 0; default Turbopack environment EPERM documented, not counted as pass |
| Preservation | Fresh 228 before/after requests across 15 hosts, DNS/TLS/config/PID/build unchanged; protected Motion paths, tutorial canonical/hashes/images preserved |

A03/A06/A07 mechanisms and A02/A09 regressions pass using synthetic evidence. This
never substitutes for A08/A10 actual worker behavior or live HQ/market acceptance.
Three independent read-only reviewers assessed archive/recovery, ingress and website/
PR surfaces. Findings were corrected and rerun; no private-install blocker remained.
Early Node22 copy/permission/test-context failures and rejected HTTP runs are retained.
Reduced-motion CSS was reviewed; no screen-reader-device/OS preference audit claimed.

Capacity acceptance is limited to about 2,000 events/3.4MB content, four roughly 30-event
batches and four uploads per minute plus groups of four reads at tested pacing, under
256 MiB memory/64 MiB swap/50% CPU limits. Configured 16 MiB run/64 MiB archive/256 MiB CAS
ceilings were not fully capacity-qualified. Larger archives, visitor bursts, integrated
page fan-out and TLS handshakes remain exposure gates. It is not a public maximum.

## Inherited issue tracker

| Issue | Disposition | Remaining dependency |
| --- | --- | --- |
| Nginx duplicate headers | **Implemented but activation testing remains** — stream TLS 62 pass, HTTP failures preserved | Replace rejected profile in reviewed shared 443 integration |
| TLS/ingress | **Implemented but activation testing remains** — complete isolated design accepted | Public DNS/cert, IPv4/IPv6 listeners, trusted client IP, renewal, authority mapping and handshake capacity |
| Sustained capacity | **Resolved and tested** — bounded private envelope measured | Larger/public capacity is a distinct exposure gate |
| Backup/restore | **Resolved and tested** — synthetic full restore/encryption/fencing | Live RTO/custody require acceptance |
| Independent custody | **Blocked by a specific technical or owner-dependent prerequisite** | Owner-selected independent destination and separate key custody |
| Schedule/retention | **Blocked by a specific technical or owner-dependent prerequisite** | Owner approve concrete proposal, locations and notification path |
| Publisher credentials | **Deferred to a named future milestone** — finite synthetic lifecycle passes, operational 0 | INV-07/launch actual grants |
| HQ receipt reconciliation | **Deferred to a named future milestone** — synthetic duplicate/conflict/new-generation passes | INV-07 real outbox/receiver recovery |
| Market/public rights | **Deferred to a named future milestone** — exact-approval negative tests pass | INV-06 free-source automation/derived/public rights |
| Ubuntu 22.10 exception | **Resolved and tested** — private compatibility/exception review only | OS remains unsupported; migration independent, re-review before new exposure |
| PR35 | **Resolved and tested** — reviewed/merged | None |
| PR36 | **Resolved and tested** — corrected/retargeted/reviewed/merged | None |
| Existing-site preservation | **Resolved and tested** — 228 probes and unchanged config/services | Future releases repeat preservation |
| INV-03 archive | **Resolved and tested** — full lifecycle/downloads/discussion/UI | Public website release remains disabled |

The old encrypted Mac backup copies and their recovery records/keys were deleted
by a later owner-approved cleanup; the temporary snapshot was already deleted.
Historical INFRA-01 checks cannot establish current recoverability. No independent
copy is verified. Synthetic drills are not operational backups. The reviewed proposal
is daily+prechange, ordinary RPO 24h, current control export after each visibility change,
target RTO 2h (unmeasured), 7 daily/4 weekly/3 monthly, monthly synthetic/quarterly representative
restores, with host/Mac/independent copies and separate keys. No schedule or paid service
was activated. Ask retention remains a separate future private-data policy.

## Final host state and next packet

Receiver source matches the commit above; schema 002, integrity OK, FK empty, WAL/FULL,
all operational publisher/key/run/event/batch/nonce/content/approval/control counts zero.
Config false, explicit marker absent, unit inactive/static, no port 3101 or proxy listener.
Task-owned fixture runtime directories, keys/certificates, units and mounts were removed.
Public website, Nginx, other sites, actual Django and dormant PostgreSQL were preserved.
Ubuntu 22.10 remains unsupported; no claimed security support or automatic OS project.

INV-04 may build fixture-based public-experience source only when selected. Before
combined public website/receiver activation, reconcile today's loopback read Host with
the future public signed authority through explicit trusted server-only configuration
and tests; preserve strict Host equality. Shared443 rollout, ordinary-site client-IP
preservation, certificates/renewal/rollback and public capacity remain unaccepted.
Real HQ publishing requires INV-07/08 and actual owner scopes; market collection needs
INV-06 under Decision 029 US$0. Official paper trading requires simulator/ledger/calendar/
actions/benchmark, real worker evidence and explicit run/budget activation. Ask requires
its separate packets, provider clearance, privacy/quotas and actual employee answers.
INV-10–12 and explicit owner release remain required for full public Showcase launch.
No financial performance, customer outcome, real organization operation or launch is
inferred from this milestone. See the [execution plan](../../exec-plans/investment-inv03-handoff.md).
