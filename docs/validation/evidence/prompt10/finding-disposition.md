# Prompt 10 specialist finding disposition

The parent is sole writer/integrator/deployer. All four Decision 023 specialists reviewed
read-only in fresh sessions with inherited model/reasoning settings; no specialist ran tests,
changed Git state or accessed the host. Reports are retained with whitespace normalization.
The table records implementation disposition separately from outstanding release evidence.

| Finding / reviewer | Parent disposition and evidence |
| --- | --- |
| Task/resource/provider separation; control-plane design | ComputerSession belongs to an ordinary Task. Dedicated context generations and bidirectional binding checks prevent cross-mode reuse. Actual approval continuation has two distinct provider references in `worker-state.json`; focused binding tests pass. |
| Capability/delegation ceiling; security design | Explicit owner-only minimal operator workflow; excluded CEO delegation; unchanged eight-worker and manager limits. Additive migration creates no operator/grant/session. Offline migration passed; final retained production gate pending. |
| Waiting model slot and network lifetime; control/security design | Awaiting approval settles the requesting execution and releases its slot. Browser requests require an active operation and current grant. Actual waiting/continuation and deterministic callback lifetime tests pass. |
| Private evidence / v1; control/security design | Hashed owner-private PNG route; related Tasks, executions, messages, artifacts and events filtered from v1. Actual owner UI and authenticated HTTP hidden-ID/control tests pass. |
| Pending connect/launch cleanup; security/recovery implementation B1 | Shared terminal close tracks connection and launch, retains occupancy until actual cleanup, with broker watchdog/cgroup termination. Real provisioning revoke and abrupt socket-loss probes passed; final enhanced probe asserts the launch is unresolved at disconnect. |
| Page callbacks redeeming approval before recheck; security B2 | Browser freezes and verifies fingerprint; only trusted controller can transmit captured request. Timer/stale-page fixture produces zero effects. |
| Failed-action callback draining; recovery B2 | Every exit denies new callbacks and drains accepted callbacks before release/settlement. Deterministic pending-forward failure test and real eight-request concurrency probe pass. |
| Stranded ready/closed execution reservation; security/recovery | Recovery includes active execution reservations in every state, retaining provider uncertainty. Deterministic recovery and actual HQ restart receipts pass. |
| Fabricated page-world success; security/recovery | Approved effects use trusted HTTP receipt committed before delivery, never page `fetch` results. Actual overridden-fetch probe cannot fabricate success. |
| Credential/control URLs; security | Canonical public URL exclusions and pinned DNS forwarding apply before transmission; query/fragment removed from network ledger. Deterministic DNS/redirect tests and real control redirect denial pass. Vetted read-only origins remain an explicit limitation. |
| Recursive status / full historical receipt context; recovery/control | Prior operations are metadata only; historical intent/receipt excerpts bounded while actionable requests remain exact. Full receipt retained in SQLite. Repeated status and 256-KiB receipt/later-generation tests pass. |
| Reentrant teardown; actual worker failure | Shared stop promise and resource removal before synchronous interruption, plus idempotent client close. Original failed worker retained in `first-worker-retained-state.json`; fresh worker2 acceptance passed without clearing its history/fence. |
| Completion before cleanup acknowledgement; review2 all three | Session and tool success require confirmed shutdown. Failed acknowledgement keeps reservation and withholds completion. Focused test passes; actual safe/approved finish confirmation is repeated on final candidate. |
| Cleanup retry window versus broker restart; review2 recovery | Owner can recheck a terminal unconfirmed environment after automatic retries end; shared/cancelled cleanup work is awaited on shutdown. Delayed recovery test passes and preserves uncertainty. |
| UI recheck hidden after revocation; review3 test | Explicit Recheck browser cleanup button appears for terminal unconfirmed sessions even after revocation. Backend semantics unchanged; labelled owner UI lost-ack probe pending. |
| Mixed-case private inputs; review2 security | Normalize HTML input type before password/file denial. Actual `PASSWORD` / `FiLe` controls denied in fault4. |
| Repeat installer retains old broker; review2 security | Bootstrap stops broker before replacing files; installer explicitly restarts and waits readiness. Actual repeat production installer gate pending. |
| Queued automatic restart during bootstrap; review3 recovery | Stop installed units regardless of active state. `broker-restart-delay.json` proves auto-restart cancellation for longer than configured delay, followed by new PID/readiness. Existing HQ confinement unchanged. |
| Idle status socket release race; review3 security | Await explicit broker close acknowledgement before confirming idle; cancelled connects use the same release handshake. Synthetic delayed-disconnect Unix RPC test passes without a sleep. Final actual immediate replacement probe pending. |
| Combined bypass assertion and invalid SW fixture; review3 test | Valid JS service-worker fixture, separate rendered attempted/denied outcomes, per-path request denial assertions, and forbidden WebSocket upgrade recorder. Focused final Chromium rerun pending. |
| Additional crash windows; review2 recovery | Consumed-before-send becomes unknown and unreplayed; committed-before-delivery plus revoke retains known receipt; screenshot publication failure consumes attempt without evidence row. All targeted deterministic tests pass. |
| Exact provenance and retained release; all reviews | Archive-based Projects run failed only at final Git SHA collection and is retained. Candidate checkout run, final exact Ubuntu/build/worker evidence, normal merge/deploy, preservation and idle cleanup remain mandatory before Complete. |

No known authority blocker remains in the reviewed implementation. This is not a release
acceptance statement. The validation record and final release receipts close pending gates.
