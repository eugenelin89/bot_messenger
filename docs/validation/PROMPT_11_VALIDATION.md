# Prompt 11 validation — business operations

**Status:** Implementation complete, normally merged and deployed. **Prompt 11 NOT complete:** C11-2 and live C11-3/C11-4 remain pending.
**Delivery:** [Implementation PR #15](https://github.com/eugenelin89/bot_messenger/pull/15), merge `7fd7733a25dc97544f2b0182e6845144657979ed`; subsequent documentation-only delivery recorded in the handoff/protected host journal.
**Evidence modes:** local deterministic, real browser and real Ubuntu workers with a
SIMULATED provider. Real external-business acceptance remains pending. No private Asymmetri
source or credential is here.

| ID | Required evidence | Status |
| --- | --- | --- |
| C11-1 | Useful bounded evidence/capabilities and reviewed authority | Passed implementation/review/local/Ubuntu/real-runtime fixture and deployment gates |
| C11-2 | Exact approved real external action, provider receipt, observed real effect | Pending credential, repository workflow and exact owner approval |
| C11-3 | Real two-cycle scheduled pilot, restart/context recovery and supervision | Real Ubuntu workers passed two fixture cycles and restarts; live-business pilot pending |
| C11-4 | Real baseline, sources, usage/costs/unknowns and evidence-driven next decision | Model schema and fixture checks implemented; live evidence/decision pending |

## Local evidence and retained failures

- Focused business domain, production adapter over controlled transport, and migration suite:
  **78 passed, zero failures/skips** at the latest [focused run](evidence/prompt11/local-focused.txt). Fixtures are not C11-2.
- Actual database close/reopen tests cover approved, preparing, transmitting and receipt states;
  one continuation, retained lineage and no blind replay. A separately built populated v13
  database migrates/reopens three times with every original rowid/field preserved, integrity/
  foreign keys intact and zero new business authority.
- Adapter contract tests validate exact request bytes, fixed host, repository identity,
  tree/blob/UTF-8 checks, symlinks/executables, redirects, response bounds, timeout, protected
  files, changed content, revocation boundary, lost response, actual parent and ambiguous history.
- Authorization checks include immutable fields/approval, owner boundary, worker self-approval
  denial, expiry/stop/pause/revoke, late success, cross-grant unknown fencing, source withdrawal,
  interruption/shutdown, worker reservation in both claim orderings and separately approved
  exact compensation. Additional cases deny excluded modes before I/O, expose only observation
  metadata, reject pre-withdrawal Decisions in fresh contexts and reject substituted SQL receipt lineage.
- Real headless Chrome exercised local UI/backend at desktop and mobile widths: reviewed hash,
  disabled approval until acknowledgement, one fixture effect/receipt, passive compensation
  request and no JavaScript page errors. Screenshots are local protected validation artifacts.
  Final viewport captures and an explicit dialog-width assertion verify the mobile exact-review
  surface without clipping; full-page fixed-dialog capture artifacts were replaced by viewport evidence.
- Initial compile failures: unused test import and wrong ClientDTO constructor; corrected.
  Initial test failures retained: null-prototype comparison, runtime-recovery timestamp versus
  pure migration comparison, and sandbox loopback EPERM. Corrected tests separate preservation
  from runtime mutation; loopback tests reran with authorized local networking.
- First adapter transport fixture incorrectly emitted strings rather than network Buffers,
  causing parsing failures; corrected and positive/negative adapter cases passed.
- First full suite: 362 tests, 358 passed, three failed, one skipped. All three failures were
  legacy tests expecting schema 13 instead of additive schema 14. Expectations were updated
  without weakening retained-row assertions. Full rerun: **367 tests, 366 passed, zero failed, one Linux-only skip** (53.3 seconds).

## Independent review and disposition

Parent remains sole writer/deployer. Project-scoped specialists operated read-only.

| Specialist | Material finding | Disposition |
| --- | --- | --- |
| Product strategy | Prefer an actually useful operations correction; do not equate document presence with business growth | Candidate is scoped document clarity; business signal/cost unknowns explicit |
| Product strategy | Preserve Asymmetri branch/review flow; do not choose direct-main merely to fit adapter | Normal owner-prepared short-lived branch preferred; exact exception would require separate explicit approval |
| Security | Withdrawn non-baseline evidence or old Decision could still authorize effect | All evidence withdrawals invalidate prior action/Decision before transmission |
| Security | Worker observation bypassed evidence-mode gate; replacement metacharacters changed bytes | Mode checked before/after read; metadata-only return; literal replacement |
| Security | Credential ancestors lacked owner check; receipt parent guessed baseline head | Root/service ownership required; actual validated provider parent retained |
| Recovery | Shutdown allowed preflight transmission; multiple/orphan proposals stranded cycles | Immediate shutdown admission gate; one distinct intent/execution; orphan cancellation |
| Recovery/test | Exception hooks were not crash/reopen proof; migration test began already migrated | Added actual persisted-state reopen and populated v13 migration tests |
| Architecture | Read cancellation was dropped; same-worker healthy work raced executor preflight | Signal propagated/transport aborted; pending callbacks gate commitment; independent worker reservation |
| Test | Fixture adapter alone did not test actual GitHub protocol; catalog leaked withdrawn prose | Production adapter transport fixtures; bounded metadata catalog and withdrawal checks |

Final security, recovery and architecture source reviews found no remaining source blockers.
The architecture review briefly reported a missing reverse-order worker check, then retracted
it after direct reinspection; the check already existed and an additional passing regression
now proves it. Final independent product, recovery and acceptance reviews also found no implementation blocker. The acceptance reviewer independently recomputed the intent, content, receipt and immutable delivery hashes, and verified the two-cycle packet; mutable initiative-context hashes are explicitly distinguished below.

## Ubuntu, deployment and live evidence

First Ubuntu attempt (`20261006a`, source `95bd394`) failed during isolated roster setup:
the harness attempted to hire a researcher from a product Task, correctly rejected by the
existing role policy. No model or business action ran. Its database/journal are retained.
The harness now uses separate product/research setup Tasks through the unchanged authority
path. Host regression paths were also aligned with the existing operator path guards before use.

The first Linux engineering/identity run used the advertised default `gpt-6-astra`, while
the retained historical runner pins `gpt-6-sol`. Its CTO created the local fixture repository
then declined allocation because it could not inspect recipe IDs with the available legacy
tools. Completion was correctly rejected for missing trusted integration. Retain this model/
legacy-workflow limitation; the regression runner now matches the historical model configuration
and repeats in a fresh directory, without changing production tools or weakening assertions.

### Real Ubuntu workers, simulated provider

The successful isolated run is retained at
`/var/lib/botsquad/validation/business-p11-20261006b`, source
`9baa9bd9077b6484de83097673c85efc42bf80b8`. The
[two-cycle packet](evidence/prompt11/two-cycle-fixture.json) includes the original mandate,
authority envelope, baseline, alternatives, exact approval/action/attempt/receipt, observations,
scheduler occurrence, decisions, complete original-delivery hashes and runtime telemetry.

- Actual advertised-default `gpt-6-astra`/medium workers completed three coordinator executions
  in distinct generations 1/2/3. Roster setup used no model and remains separately labelled.
- The company chose one duplicate-status-line correction. It compared leaving the document,
  narrow deduplication and broader rewriting, and explicitly judged optional team work
  unnecessary for this mechanical change. The harness supplied no worker response or conclusion.
- The exact proposal waited with no running model. A [preapproval restart](evidence/prompt11/restart-before-approval.json)
  preserved its hash, zero effects and the execution count.
- Trusted fixture approval produced exactly **one action, approval, attempt, receipt and
  simulated provider effect**. Baseline was 424 characters; the observed result was 393.
  The worker corrected its earlier estimated 394-character result after inspecting evidence.
  That was a prose arithmetic error; the exact approved content and executed bytes were 393.
- The company persisted its own once-only review for `2026-10-06T06:54:00Z`, about 86 seconds
  after Cycle 1 closed. A [second restart](evidence/prompt11/restart-before-cycle2.json) preserved
  the exact schedule and one effect. The clock opened one `durable_schedule` Cycle 2, with one
  completed occurrence, without an owner review-now request.
- Generation 3 retrieved the prior decision, original receipt, baseline, prior operational
  observation and a fresh operational observation. Its recorded decision retained the correction
  and stopped at the two-cycle acceptance bound; it claimed no reader/revenue/adoption benefit.
- Generations 2 and 3 each first attempted to cite an initiative as evidence. Both calls were
  rejected because a hypothesis is not supporting evidence; the worker removed those citations
  and successfully recorded its Decision. [Rejected tool attempts](evidence/prompt11/worker-tool-rejections.json)
  remain separate from the successful harness journal. The packet's initiative delivery hashes
  match the then-current `active` lifecycle; its final initiative is `stopped`. Immutable
  observation/Decision/receipt hashes and mutable initiative-context hashes are distinguished.
- The [systemd journal](evidence/prompt11/restart-journal.txt) independently records service
  stops/starts and process IDs 508001→513501→522895 at the two restart boundaries.
- Twenty actual runtime usage telemetry events and their execution IDs are retained. These are
  not provider billing receipts; monetary model/provider costs and business impact remain unknown.
  The model itself reported unavailable token totals; the operator packet separately retains
  telemetry without silently upgrading that model statement into measurement.
- A 30-second idle window added no executions. The owned validation HQ was stopped afterward;
  its complete protected history remains. No actual GitHub effect occurred.

The [Ubuntu full suite](evidence/prompt11/ubuntu-suite.txt) at that source passed **368/368**,
zero skips/failures, in 232.4 seconds under actual HQ confinement. It includes conversation,
research, group, mandate/scheduler, Computer Use, engineering, infrastructure and v1 privacy
regressions. Later focused additions bring business checks to 78. The only later product delta
preserves literal old-text whitespace instead of trimming it; exact-byte regression passed.
The [final-source Ubuntu suite](evidence/prompt11/ubuntu-final-suite.txt) at `15be496ad65277213cb8c821af86fcb23bba53b4` passed **372/372**, zero failures/skips, in 318.1 seconds. It includes all later authority tests and the literal whitespace correction.

[Real Linux lost-response recovery](evidence/prompt11/linux-recovery.json) passed: a consumed
approval reconciled the existing host identity receipt after restart; exact replay returned the
same receipt and changed payload was rejected. The fresh historical-model
[engineering/identity rerun](evidence/prompt11/linux-engineering.json) passed, with 32.368-second
execution and 30.459-second runtime-turn overlap, independent review/trusted integration/restart,
[Linux isolation](evidence/prompt11/linux-isolation.json) and [retirement denial](evidence/prompt11/linux-retirement.json).
The first Projects run failed in the provider turn before the CTO made any tool call; exact
cause was unavailable through the redacted adapter error. Its history is retained and one fresh
bounded [Projects rerun](evidence/prompt11/linux-projects.json) passed: two review rounds, three submissions, trusted integration, restart/recovery, controlled remote publication/reconciliation, 100 isolation and four archive-denial checks. Execution/runtime overlap was 27.266/24.258 seconds. No live GitHub publication was performed. The first failure is not erased by later success.

A [harmless credential canary](evidence/prompt11/credential-canary.json) was service-readable
and denied to all seven retained ready worker UIDs. Two operator-script mistakes (UID conversion
and an incorrect table name) preceded the successful probe and are retained; no actual credential
was used. Real selected-repository token scope is still unverified because provisioning is pending.

### Production preservation and live boundary

Protected predeployment backup/inventory: `/var/backups/botsquad/prompt11-20261006`.
It retains 75 pre-existing databases, 189 worker homes, 634 root records and 381 account/group
mappings; only the newly created active business fixture database was excluded. The consistent
production copy passed [three offline migration openings](evidence/prompt11/offline-migration.json):
schema 13→14, **92 original tables and 2,234 original rows**, every original field/rowid unchanged,
integrity/FKs valid, all ten new business tables empty and no runtime invoked.

No production grants, private target writes or live approvals have occurred. A private discovery
candidate packet contains an exact README deletion and hashes, normal owner-prepared branch
workflow, costs/risks/measurement and compensation limits. It is not an executable company intent;
credential provisioning, refreshed current baseline, company selection and exact owner approval
remain required. Private source/content is deliberately absent from this public record.

### Completed implementation delivery

[PR #15](https://github.com/eugenelin89/bot_messenger/pull/15) merged normally at
`7fd7733a25dc97544f2b0182e6845144657979ed`; local main, origin/main, deployed source and
running health matched at the [accepted release](evidence/prompt11/deployment-accepted.json).
The merged product/test/runner source is identical to final Ubuntu-tested `15be496`.
An independent fresh Ubuntu checkout and production build matched all **251 dist/public files**,
manifest SHA-256 `e0df7f062f7c26a15207f766e2122621c2bd9146c7c201494eeea69c054580d9`.
Node 24.21.0, Codex 0.157.0, dependency lockfile, HQ/browser units and service restrictions
remain unchanged. Runtime is ready, DB/dispatcher healthy, listener only `127.0.0.1:4310`.

A fresh protected backup at `/var/backups/botsquad/prompt11-delivery-20261006` preceded
production migration. The exact merged build repeated the offline 13→14 migration three
times with every original field/rowid retained, zero authority and no model invocation.
[Original preservation](evidence/prompt11/preservation-original.json) verifies **75 databases,
53,718 rows, 189 homes, 634 root records and 381 account/group mappings**.
[Fresh preservation](evidence/prompt11/preservation-fresh.json) also verifies all newly retained
validation history: **81 databases, 59,245 rows, 212 homes, 702 records and 427 mappings**.
The live comparison excludes only `workers.updated_at`, which startup refreshes; the separate
offline proof compares every original field including that timestamp. Integrity/FKs pass.

Production remains eight enabled idle workers, 48 Tasks (30 completed, 17 cancelled, one
blocked), 65 completed executions, one existing Atlas Task/conversation research grant,
seven ready identities and pause=false. Mandates, cycles, schedules, occurrences, Computer
Operators/grants/sessions and all ten business tables are zero. No business provider credential
is configured. Browser UID has one broker Node process and zero Chromium processes.
The [30.458-second idle sample](evidence/prompt11/production-idle.json), sampled 30 times,
retained every count and produced zero model/browser/business work. A [real Chrome passive
production check](evidence/prompt11/production-ui.json) passed after initial state loaded,
with no mutation requests or JavaScript errors and an unconfigured empty business surface.

Two earlier passive browser attempts are retained as failures: an alternate SSH tunnel port
was correctly rejected by the Host guard (403), and clicking navigation before initial state
loaded exposed the pre-existing `public/app.js` undefined-state render race. The latter exists
unchanged in baseline `34c6a29`; waiting for the initial worker roster passed. It has no effect
or approval consequence and remains a known UI readiness limitation, not a weakened assertion.
All owned Ubuntu validation units are inactive; failed unit status and protected raw evidence,
homes, receipts and uncertainty fences remain. Task-owned local browser/tunnel processes are
closed at final handoff. No production or Asymmetri acceptance demonstration was fabricated.

The follow-up documentation revision records these observations. Its final exact source and
build equality are recorded outside Git in the final handoff and protected host journal to
avoid a self-referential commit hash. No additional runtime test is needed for documentation
alone; exact source/build/health identity and retained state are checked after delivery.

### Real pilot exit ledger — pending

| Required item | Actual live status |
| --- | --- |
| Target / usefulness | Owner-designated Asymmetri Motion GitHub; private README clarity candidate removes a duplicated operations statement |
| Real source / baseline | Owner-authorized read-only discovery retained privately; must refresh through the deployed adapter before company selection |
| Owner mandate / envelope / credential | Not activated; restricted service credential and an existing approved pilot branch remain prerequisites |
| Company alternatives / team work / Decision | None for the live pilot; fixture choices above are not substituted |
| Exact live action / human approval / receipt | None proposed through the production company, none approved, none executed |
| Reversibility / impact | Candidate could be compensated by another approved commit; Git history/notifications/automation cannot be erased; no business benefit proven |
| Real observation / scheduled occurrence / Cycle 2 | None; these await the approved action and company-scheduled review |
| Cost / usage | No live execution or provider action usage; no spending authorized. Model/provider billing and business impact unknown |
| Interventions / failures | Owner designated read-only target; developer prepared a private candidate. Validation interventions/failures are listed above |
| Next review | No company live review exists yet. Provision exact scope, let company inspect/choose, approve the exact intent, then observe and schedule |

**Recommendation:** finish this one narrow live loop before adding connectors or considering
multi-company/federation. Follow up separately on the legacy early-navigation UI race and the
advertised-default model's legacy recipe-discovery limitation. Neither justifies broader authority.


The real pilot exit packet must still record original mandate/envelope, exact authorized
target, actual baseline/source, company-selected alternatives/work/Decision, exact owner
approval, action/receipt/result, scheduled occurrence and Cycle 2 decision, usage and cost
unknowns, failures/interventions, limitations and next review. A fixture cannot fill these rows.
