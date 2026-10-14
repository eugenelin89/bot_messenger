# Ask launch — qualified implementation acceptance

**2026-10-14 05:45 UTC.** API implementation and authored acceptance are complete. HQ deployment remains pending. Public Ask remains closed: no API credentials, spending grant, provider call or genuine answer exists. Personal Codex eligibility remains unestablished. See [Decision051](../decisions/decision_051_ask_api_launch.md), [operation](../operations/ASK-LAUNCH.md) and [execution plan](../exec-plans/ask-launch.md).

## Scope and source

The separate pinned OpenAI Responses adapter routes the existing Ask employees through the shared Dispatcher. Independent production-purpose custody, final wire checks, priced terminal failure settlement, durable owner pause and raw-content cleanup preserve the original strict Codex path. No ordinary investment runtime or authority is substituted. A one-use externally retained clean-restart handoff permits exact receipt/current-watermark reconciliation after a quiescent same-generation upgrade; ordinary restore recovery is unchanged.

Canonical commit507f93afaa0d5e8ede28922e82fc677b8b5cc4e2 and manifest4b61ab70b60f7660a7c2586b88666c5e00ce5ab9b849fb63295ffb095a5aae76 raise only the permitted Ask input ceiling to400000. No service limit/grant is increased automatically. Website independently generated and checked all nine canonical files.

All549 [source05 inputs](evidence/ask-launch/source05-inputs.json) matched the sole-writer checkout and Linux staging. Build05 passed. Documentation updates after this source snapshot do not change tested code. Linux used Node24.21, serial concurrency1 and512MiB heap; no Mac native build was run.

## Validation and retained failures

| Run | Actual result | Qualification |
| --- | --- | --- |
| Check01 | TypeScript tuple narrowing error | Fixed using a readonly tuple; raw error retained. |
| Build02 / focused02 | Build passed;77pass/3fail | Fixture policy was bound after custody; corrected ordering. |
| Build03 / focused03 |116pass/0fail/0cancel/0skip | API, authority, service and publication authored tests. |
| Build04 / canonical04 | Passed | Exact generated canonical contract. |
| Focused04 |142pass/6fail/0cancel/0skip | Six operational assertions expected undefined while closed claim correctly throws; all other cases passed. |
| Build05 / operational05 |13pass/0fail/0cancel/0skip | Only test assertions changed from source04; production code unchanged. |
| Regressions05 |321pass/0fail/0cancel/0skip | Ask contract/custody/context/runtime/transport, usage, HTTP, finite/private/investment routing and publication migration/transport/kill/projection. |

The groups overlap and are not a full-suite total. These outputs are authored, not genuine employee answers. Earlier PR88 timing/staging failures and their accepted unchanged-bound repairs remain in [historical integration evidence](INV_ASK_02_EMPLOYEE_INTEGRATION.md); expensive completed workflows were not repeated.

New tests include zero request-body bytes before final authority, post-custody deadline expiry, verified TLS,401 denial without retries, actual request-ID requirement, malformed/wrong-model/extra-price outputs, priced failed/incomplete responses, owner pause at transmission/completion, reopened settlement, cross-session/private isolation, disabled-body coordinator behavior, expired/missing model or signing material cleanup, offline locked/foreign storage denial and lock release. Publication negatives cover lost receipt, watermark/configuration/spent-state/path drift and forbidden offline permit renewal. Existing recovery/cancellation/deletion/receiver tests remain authoritative authored evidence.

## Actual protected migration rehearsal

[Migration receipt](evidence/ask-launch/migration05-result.json): an online protected SQLite backup, SHA2563e9856cddcf8ed8b6d2f814432955291798eeefb8a5922b509de24b37bfa40cb, was copied to disposable host storage. Schema25→29 preserved all171 old tables exactly by rowid/all-field hashes, created13 empty Ask tables, passed three reopen cycles, integrity check and zero foreign-key errors. No Company, Dispatcher, model or network service was constructed. Credentials were not copied. A stopped consistent backup is still required for deployment.

## Independent review

The repository architecture/security/recovery reviewer and runtime/evidence reviewer each reported no known remaining material issue in their static scope. Findings corrected: final post-custody proof expiry, owner pause before wire/delivery, terminal paid-failure accounting, cleanup independent of model/signing availability, production-versus-fixture genesis, offline initialization exclusivity, pause-before-grant ordering, lock release after open failure and restart-configuration checks before fence removal. Targeted new regressions passed as qualified above.

## Counterpart deployment

Website and receiver owner acknowledged source6a194f040b70714de3b1281de5b58c1b8ad29579 (implementation1058b13); website build3eDBZMdlma5Ug7_iw_ZES/PID2408308, Ask receiverPID2407630. Final05:35:35UTC readback: disabled, session503/no cookie/private-no-store, receiver generation0, heldfalse, empty keys/content, unchanged configurationSHAae4a0bb70ac41a58f28c0d5d9bc5c44fae6869ad5afdc43b4ba3081f75913e5c. Investment receiverc2edfd5/PID2385469 and unrelated Motion assets were preserved. Authored browser/native tests passed; no provider inference or spending authority was supplied. [Counterpart release record](https://github.com/eugenelin89/asymmetri/blob/main/docs/ASK-LAUNCH-RELEASE_2026-10-14.md).

## Remaining live gates

Complete normal HQ PR/merge, stopped backup and compatible closed deployment with retained publication receipt reconciliation. Then request one actual owner decision: OpenAI API gpt-5.4-mini-2026-03-17, maximum$5 over24hours and15 attempts, with a legitimate protected credential. Candidate API privacy notice is prepared but unapproved; activation must bind and verify its exact live version and current receiver scope. Four genuine cases, real employee/provider IDs, settled usage, signed delivery and visitor read-back remain unrun. Never call Ask LIVE before they succeed.

Raw runner text is retained byte-for-byte inside each log JSON wrapper with its hash/length. The evidence manifest hashes every evidence file except itself. No fixture is installed into retained production state.
