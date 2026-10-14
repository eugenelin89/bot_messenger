# Ask launch — qualified implementation acceptance

**Owner pause — October 13, 2026, 11:08 p.m. Vancouver:** Ask development and activation are paused until explicit owner resume. Public admission remains disabled. No API spending was approved; do not seek or infer it while paused. Preserve the installed code and evidence. Investment continues under its existing authority and schedule.

**2026-10-14 05:55 UTC.** Reviewed API implementation, authored acceptance and closed HQ/website deployments are complete. Public Ask remains closed: no API credentials, spending grant, provider call or genuine answer exists. Personal Codex eligibility remains unestablished. See [Decision051](../decisions/decision_051_ask_api_launch.md), [operation](../operations/ASK-LAUNCH.md) and [execution plan](../exec-plans/ask-launch.md).

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

[Migration receipt](evidence/ask-launch/migration05-result.json): an online protected SQLite backup, SHA2563e9856cddcf8ed8b6d2f814432955291798eeefb8a5922b509de24b37bfa40cb, was copied to disposable host storage. Schema25→29 preserved all171 old tables exactly by rowid/all-field hashes, created13 empty Ask tables, passed three reopen cycles, integrity check and zero foreign-key errors. No Company, Dispatcher, model or network service was constructed. Credentials were not copied. The later deployment used a new stopped consistent backup, recorded below.

## Independent review

The repository architecture/security/recovery reviewer and runtime/evidence reviewer each reported no known remaining material issue in their static scope. Findings corrected: final post-custody proof expiry, owner pause before wire/delivery, terminal paid-failure accounting, cleanup independent of model/signing availability, production-versus-fixture genesis, offline initialization exclusivity, pause-before-grant ordering, lock release after open failure and restart-configuration checks before fence removal. Targeted new regressions passed as qualified above.

## Counterpart deployment

Website and receiver owner acknowledged source6a194f040b70714de3b1281de5b58c1b8ad29579 (implementation1058b13); website build3eDBZMdlma5Ug7_iw_ZES/PID2408308, Ask receiverPID2407630. Final05:35:35UTC readback: disabled, session503/no cookie/private-no-store, receiver generation0, heldfalse, empty keys/content, unchanged configurationSHAae4a0bb70ac41a58f28c0d5d9bc5c44fae6869ad5afdc43b4ba3081f75913e5c. Investment receiverc2edfd5/PID2385469 and unrelated Motion assets were preserved. Authored browser/native tests passed; no provider inference or spending authority was supplied. [Counterpart release record](https://github.com/eugenelin89/asymmetri/blob/main/docs/ASK-LAUNCH-RELEASE_2026-10-14.md).

## Reviewed merge and actual closed HQ deployment

[PR89](https://github.com/eugenelin89/bot_messenger/pull/89) merged normally at **5691504d6ebc39f7d639ec9a4fd2d00511a1ef57**, reviewed implementationce03b86c030b58d8752c12fb7e734808c8447f09. Fetched main has the identical tree. GitHub returned no commit statuses or workflow runs; no CI pass is claimed.

[Actual deployment receipt](evidence/ask-launch/upgrade-receipts.json): schema29, PID820597, active at05:49UTC; initial startup runtimeunknown became ready in the05:52 readback. Ask state is disabled/installedfalse/closedtrue, with no credential, operational custody, grant, raw question, answer or API request. Effective MemorySwapMax0 and LimitCORE0 are asserted. Protected configuration lives in root:botsquad0750 `/etc/botsquad-ask-launch`, with service-owned0600 files. Publication handoff custody is separate service-owned0700 storage under `/var/lib/botsquad-publication-custody`.

The stopped backup is `/var/backups/botsquad/ask-upgrade-20261014T054843Z`, root0700/files0600. It preserves Company, independent finite authority/checkpoint and previous build/service configuration; provider credentials and private signing keys were not copied. These are recovery artifacts, **not an automatic downgrade**: the old schema25 binary rejects schema29. After any migration/new receipt, repair forward or use the separately reviewed recovery procedure while retaining all new custody effects; never replay spent authority or recreate the permanent restart marker.

The one-use permit completed. Two counted requests under the existing publisher allowance retrieved the exact retained batch receipt and current public watermark. Receipt retrieval uses a signed authenticated request over verified TLS; the response and public status are not independently signed receiver attestations. Generation remains1, with its private/public run/channel identities unchanged. No receiver grant or generation was reset.

[Preservation verification](evidence/ask-launch/preservation-after.json) shows166 old tables exactly unchanged. The only six changed old tables are schema migrations, publisher instance, two additional publication attempts/results, one reconciliation control and workers' startup `updated_at` fields. All previous publication rows remain an exact prefix; every other worker field is unchanged. Thirteen new Ask tables are empty. All selected investment run/journal/scope/loop/occurrence/collection/employee records remain exact. All704 compiled files and25 public assets match the tested Linux build.

Finite custody retains its complete previous event prefix and all consumption. Existing standing observed restart recovery appended exactly hold/resume, advancing checkpoint9→11; this is not a new grant or reload confirmation. [Actual finite readback](evidence/ask-launch/finite-after.json) validates custody with run0/rolling0/active0/collections0, no hold/stop/provider denial, and unchanged authentic October11 reload confirmation. The finite authority expiry and14 future occurrences remain unchanged. [HQ readback](evidence/ask-launch/hq-after.json) retains five delivered batches and37heartbeats, zero selected market/collection/employee execution records before11:45UTC.

Preparation and verification failures are retained, not hidden. The first preflight found11 absent Yahoo adapter files; production remained active. They were verified unchanged between the deployed and merged source, copied exactly to staging, and all324 deployment source/asset inputs then matched. The stopped helper next found root0700 `/etc/botsquad` untraversable; it had created no permit or migration. Only the two new configuration files were moved to the dedicated protected directory, then the exact unconsumed checkpoint continued. No bootstrap/reprovision/authority reset occurred. Independent deployment review also caught the service user's Git ownership check, corrected using command-scoped trust for `/opt/botsquad` only. Initial preservation assertions surfaced the documented worker timestamps and finite recovery entries; final verification narrowly asserts those exact differences.

[Independent public readback05:53UTC](evidence/ask-launch/public-after.json) passed8/8 verified IPv4 HTTPS reads,200/no-cookie/Askdisabled. An earlier stale script requested unsupported `resource=workers` and received400; its raw result is retained separately, then the current supported `events` resource passed. Website owner explicitly acknowledged the final HQ/website/canonical closed integration without another build or deployment. Final independent read-only claim review verified all34 evidence hashes and15 raw log wrappers, the exact reviewed/deployed implementation tree and the qualified preservation/closed-state claims; no material issue remained.

## Remaining live gates and exact owner decision

**Ask BotSquad remains BLOCKED** at https://asymmetri.co/botsquad/ask. No employee has answered a genuine public question. General, real-record contextual, follow-up and private/action-denial model cases are all unrun. Authored passes cannot satisfy them. No API usage was generated; actual provider invoice charges are unavailable.

The one required owner decision is to authorize **OpenAI API `gpt-5.4-mini-2026-03-17`, at most15 attempts and$5 total over24hours**, including four acceptance cases, and supply a legitimate API project key directly on HQ in `/etc/botsquad-ask-launch/openai-api-key` (service owner `botsquad`,0600). Do not paste the key into chat or source. Each attempt reserves$0.314;15 reserve at most$4.71. A2000-input/400-output answer is approximately$0.0033 at pinned base prices. No purchase, credit top-up, automatic reload or investment permission is included. The user's ASK-LAUNCH request explicitly withheld new API charges, so deployment authorization cannot supply this spending decision.

After that actual decision/key, bind the finite grant, exact provider account, existing employee roster, current receiver generation and reviewed `ask-api-privacy-v1` disclosure; execute the four genuine cases with real provider IDs/usage, signed delivery and visitor read-back, then open bounded admission only after successful acceptance. Until then the API notice remains a prepared candidate outside the approved live registry, with live closed notice`ask-privacy-v1`. Privacy authored tests cover session isolation, deletion/cancellation, withheld delivery, recovery and cleanup after backend expiry. API `store:false` does not remove default provider abuse-monitoring retention; external host snapshots/physical disposal are not established. No genuine provider retention/erasure test is claimed.

Raw runner text is retained byte-for-byte inside each log JSON wrapper with its hash/length. The evidence manifest hashes every evidence file except itself. `upgrade.sh` is the corrected reusable reference, not an instruction to repeat the first-only handoff; `upgrade-checkpoint-continuation.sh` records the executed continuation. No fixture is installed into retained production state.
