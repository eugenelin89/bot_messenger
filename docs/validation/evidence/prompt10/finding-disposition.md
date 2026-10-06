# Prompt 10 specialist findings — active disposition

Reviews are advisory read-only source reviews. Parent owns every edit and validation.
Design reports and implementation reports are retained unchanged alongside this ledger.
Final rereview and acceptance remain pending.

| Finding | Implementation disposition | Evidence still required |
| --- | --- | --- |
| Design: separate Task/resource/provider identity | Dedicated ComputerSession and per-execution context generations; no new execution origin; reverse binding collision checks | Real worker fresh-context continuation |
| Design: owner-only capability ceiling | Operator creation is explicit owner workflow; new capabilities excluded from CEO delegation; migration empty | Retained production preservation |
| Design: model slot waiting and network lifetime | Session waits immediately; Task enters awaiting approval only after provider settlement; no page network outside an active action | Real approval wait/continuation |
| Design: private evidence/device API | Binary private evidence with hashes; computer Tasks/messages/executions/artifacts/events excluded from v1 | UI and authenticated HTTP regression |
| Security B1 / Recovery B1: pending launch cleanup | Client tracks connection and terminal close; broker awaits pending launch and closes late browser before releasing occupancy; five-second failure watchdog exits cgroup | Actual interrupt during launch and broker disconnect |
| Security B2: premature page redemption | Page remains paused, then frozen and fingerprint-verified; only trusted controller sends exact captured request; ordinary page callbacks cannot redeem approval | Malicious timer / stale-page recorder case |
| Recovery B2: callback draining | Every operation exit denies new callbacks and drains accepted pending callbacks before releasing ownership; finish rejects unconsumed/transmitting/unknown intent | Real fault after transmission |
| Security I1 / Recovery I3: stranded reservation | Recovery includes all active execution reservations, even ready/already-closed sessions; provider uncertainty remains separate | Focused deterministic PASS; actual restart ledger |
| Security I2 / Recovery I4: fabricated page fetch success | No page-world fetch in approved execution. Worker mutation result derives only from committed trusted HTTP receipt | Fake-fetch fixture case |
| Security I3: credential/control URLs | Reuse conservative WE-01 publicUrl exclusions; persisted request evidence omits query/fragment/URL credentials. GET side effects still require vetted owner-approved sites | Automatic subrequest/redirect denial test |
| Recovery I5: recursive status context | Prior operations expose bounded metadata without previous result strings; serialized tool result capped at 192 KiB | 30 successive status reconstructions PASS |
| Actual worker failure: reentrant stop | Shared teardown promise; remove resource before synchronous runtime interruption; client close idempotent; shutdown waits pending teardown | Focused PASS; real worker retry pending |

The first actual worker completed onboarding and exercised denial, then hit the close
race after clicking a forbidden link. Its original Task, provider reference, private
screenshots and interrupted/unknown-provider history remain retained. Restart explicitly
closed the old session and confirmed cleanup; no replay. Fresh acceptance uses a separate
HQ root rather than clearing that history or its fence.
