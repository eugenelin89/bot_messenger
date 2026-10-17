# INV-114 retained process upgrade — validation

Date: October 17, 2026. Source branch: `codex/inv114-retained-process-upgrade`.
Base: `3f777c727e0b37415d2ccbe873de8575c7fbbff7` (merged PRs #113–115).
Source integration: [PR116](https://github.com/eugenelin89/bot_messenger/pull/116).

## Delivery boundaries

This record covers implementation and controlled fixtures. Source integration is
identified by the PR/commit containing this record. INV-114 has not been deployed, operationally approved,
activated or genuinely exercised by investment workers. No production scope was
created; no live model, market-data or trade call was made. Publication permissions
and the October 19–21 legacy schedule remain unchanged. The recovery coordinator,
“Review this morning’s run”, confirmed separate ownership and no overlapping changes.

The October 17 deployed baseline remains `addbb83ee7e8a3d15490903f4b0caf2b39febad4`,
schema 32. INV-114 adds no SQL migration, initialization or automatic authority.

## Historical audit

Read-only inspection found 261 independent journal events and 18 reservations, with
head `ffb19119acb0a8c93a36dad06fe17a337fee734f44a41b5db0bed68f49e2acec`.
The three exceptions below are settled but incomplete; no missing usage was filled in.
This historical snapshot is not a future custody/approval checkpoint.

| Execution | Retained status | Original acknowledgement |
| --- | --- | --- |
| `execution_ec78843c-0b56-4343-9d38-a6ba223867be` | completed, incomplete usage | recovery approval event 60 |
| `execution_6a718cca-d5a9-4a3b-acaa-094ea31ba62e` | awaiting approval, incomplete usage | renewal approval event 151 |
| `execution_eba1d457-a519-42ce-b06c-b3061a924e95` | failed, incomplete usage | model continuation event 196 |

Latest bounded successor approval event 258 retains those same reservation/local-usage
hashes. Normal Save and ordinary independent approval continue to require complete
predecessor receipts. Existing renewal/continuation tools cannot authorize process
tools. Expiry alone does not repair any gap or permit ordinary approval.

The new transition derives exceptions from this independent acknowledgement chain,
checks original hashes, and binds all predecessor envelopes, reservations and local
usage rows. It preserves raw rolling consumption. Approval atomically appends its
one-use marker and retirement events; exact lost-response retries cannot issue a
second grant. Descendant process renewals retain the same upgrade root and exceptions.

## Controlled validation

Local Node 24.10, temporary SQLite/authority/custody directories and authored data/model
fixtures were used. Loopback browser tests use disposable HQ instances and Chrome.
No authored result establishes genuine worker reasoning or live source availability.

| Check | Result |
| --- | --- |
| TypeScript build | passed |
| Journal, finite HQ, telemetry recovery, migration, account, inert setup and process boundaries | 128 passed, 0 failed, 0 skipped |
| Broader finite HQ, snapshot/rolling limits, investment loop/process/recovery and migration regressions | 185 passed, 0 failed, 0 skipped |
| Existing observed-investment browser at 390/1440 | 2 passed |
| Existing finite-HQ browser at 390/1440 | 4 passed |
| Full retained-process Company/Dispatcher fixture, including publication race | 1 passed, 0 failed, 0 skipped; 102.8s |
| Legacy draft/source/model recovery scenarios | 3 passed, 0 failed, 0 skipped; 143.6s |
| New retained-process real-HQ browser at 390/1440 | passed in final full fixture; no JavaScript errors or horizontal overflow |
| Documentation links and final diff checks | 2 passed; `git diff --check` clean |
| Ubuntu Node 24.21 build and targeted boundaries | build passed; 113 passed, 0 failed, 0 skipped |
| Ubuntu retained-process Company/Dispatcher fixture | 1 passed, 0 failed, 0 skipped; 615.2s; history collection 78.4s |
| Ubuntu browser | not run; desktop/mobile browser evidence above is local |

The full fixture constructs the original/recovery/renewal/source/model-continuation
chain with three real authored incomplete receipts. It denies preparation while legacy
sessions remain active; verifies ordinary approval denial; preserves old records through
inert Save, reopen, changed checkpoint and fresh preparation; recovers an independently
committed approval using its exact retained request; checks activation rollback and
duplicate scheduling; and exercises 120-day history, a primary page and an independently
reviewed HOLD retaining existing positions. A later process renewal retains the root
and exceptions. All worker text, market observations and conclusions are authored.

The journal scenarios include unknown effects, changed custody/history/account/routing,
changed roles/tools/policy, duplicate/downgrade transitions, budget exhaustion, all
reservation retention, preapproval restart, independent commit/custody failure, exact
duplicate recovery, descendant renewal and complete failed/interrupted consumption.
Existing process tests cover all-cash escalation, research-blocked and supported trade
proposals. There is no forced genuine purchase or acceptance claim from a fixture.

The final publication test holds a real fixture transport promise across attempted
Preview/Save, rejects without changing scopes or publication records, and separately
checks uncertain, receipt-required and leased jobs. Unrelated books do not block
setup. Queued unsent jobs survive Save and then remain behind the process hold.

The new UI check verifies blank objective/evaluation/session/model limits, proposed 120
days/3 sessions, retained disabled model profile, saved exact request recovery after
reload, separate activation, and no automatic activation. Private screenshots remain
outside the repository under the system temporary `botsquad-inv114-browser` directory.

## Failures retained and resolved

- Security review found an in-flight publication could be stranded by Save's hold.
  Same-book quiescence now guards Preview, transactional Save and preparation checks.
  The held-transport and uncertainty fixtures pass without auto-draining jobs.
- The full chain exposed a pre-existing mismatch: source failure paused an untouched
  draft discussion, while supported source continuation required draft. The repair
  retains draft only for zero turns and zero scope executions; loop/book still block
  and all other groups pause. No allowance or continuation eligibility was expanded.
- The fixture initially attempted release after shutting down finite controls; it now
  performs the actual recovery lifecycle before creating a fresh approval preview.
- A SQLite null-prototype receipt comparison was corrected to canonical JSON equality.
- Reading every historical/universe evidence body exhausted the existing retrieval
  limit. The authored worker now reads the relevant AAPL/SPY/primary evidence and
  mandate. Production retrieval limits were not raised. Insufficient evidence remains
  a bounded research request or blocked outcome.
- A future-renewal fixture reused a now-historical evaluation start and was correctly
  rejected. Its proposed future evaluation start was corrected.
- The documentation check initially found this then-unwritten validation link. Final
  link validation is recorded above; the failed attempt is not treated as a pass.

Final local receipts: `/private/tmp/inv114-boundaries.log`,
`/private/tmp/inv114-regressions.log`, `/private/tmp/inv114-legacy-recovery.log`,
`/private/tmp/inv114-hq-browser-final-7.log`, `/private/tmp/inv114-observed-browser.log`,
`/private/tmp/inv114-finite-browser.log` and `/private/tmp/inv114-docs-final.log`.
Earlier failed logs remain under `/private/tmp/inv114-*.log`.

## Independent review

Architecture, security, recovery and acceptance specialists reviewed independently,
read-only; the parent remained sole writer. Material findings fixed include legacy
process downgrade/omission, activation requiring the exact local approval receipt,
held lost-response finalization, complete failed-attempt recovery, and an HQ reload
losing the original approval UUID. Architecture, security, recovery and acceptance reviews cleared source integration
with the final local fixture, documentation and diff receipts. Subsequent Ubuntu
validation was separately owner-authorized. Reviewers did not perform production operations.

## Remaining operational gates

Automatic approval review initially rejected the private source/test export; nothing
was copied then. The owner subsequently explicitly approved isolated validation of
`c4580e0331a2cb1eb18a26feebfd6d55ba8a9a85` only. The reviewed source and required
five Company reference documents were exported, with inspected manifests and SHA256
checks, to `/tmp/botsquad-inv114-c4580e0-20261017` on the existing Ubuntu host.

Execution used `nobody`, an empty environment, fresh temporary HOME/data, installed
Node 24.21 and existing dependencies read-only, nice 10, a 512 MiB Node heap, concurrency 1
and a separate network namespace with loopback only. No live endpoint was reachable.
The existing recovery coordinator confirmed no competing recovery operation. The
initial run passed compilation but Company fixtures failed because the first archive
omitted its five reference documents. Those exact same-commit dependencies were added;
all failed logs were retained, and no assertions or production source were changed.

The target suite passed 113 tests. The full retained fixture reached the approved
process with 18 historical authored attempts, then its 60-second collection observer
expired while 120-day/nine-instrument collection was still running, with no application
error. That failed run lasted 462.6s; its preceding model continuation took 75.5s.
The acceptance reviewer approved increasing only this fixture observer to 180s and
its overall timeout to 900s, with an elapsed-collection diagnostic. Production source,
assertions, business clocks, runtime deadlines and budgets remain unchanged.
Fixture commit: `541f1c4dd13fe19dbfcf1ad925ccde567d20c5e4`; its local rerun passed in 90.6s.
The final Ubuntu retained-process fixture passed: 1 test, 0 failures, 0 skips;
615.2s overall, 78.4s history collection, 75.3s legacy model continuation. The full
24-attempt authored chain, reviewed HOLD and final preservation assertions passed.
Ubuntu logs are retained in the stage's `logs/` directory, including initial failed
attempts; local copies are in `/private/tmp/inv114-ubuntu-logs/`. Production remained
active with the original PID 926485 before and after, without service or selector writes.
These are authored fixture results on the deployment OS, not genuine worker,
market, account or operational activation evidence.

After source integration, use the separate
[deployment and owner-decision plan](../../operations/INV114_RETAINED_PROCESS_DEPLOYMENT.md).
Fresh current custody, settled October 19–21 work, owner-selected objective/evaluation,
primary URLs/rights and finite numeric allowance are required. October 22, 120 days and
three eligible all-cash sessions remain an unsaved proposal. Public output stays held;
the existing Asymmetri handoff remains separate.
