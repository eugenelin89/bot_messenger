# INV-ASK-02 shared employee execution integration

Reviewed source acceptance, October 13, 2026. This is not public-service activation or genuine
employee-answer acceptance. The concrete runtime refuses public Ask before RPC;
the Dispatcher checks availability before consuming a finite reservation. No
production caller installs the service, and no operational Ask authority is created.

## Implemented boundary

Schema 28 adds non-content dispatch ownership and scoped custody holds. Schema 29
adds passive signed coordination, per-operation attempts and immutable claim epochs. A distinct
`public_question` execution shares the existing Dispatcher, two global slots and
existing employee exclusion, with at most one Ask execution. Ordinary work is
admitted first; near investment deadlines and immutable incurred duty cooldowns
hold Ask. Routing uses published-record authorship, relevant follow-up continuity,
approved topics and an approved generalist fallback.

Raw questions and answers remain in the separate finite-retention private store.
The normal Company database retains identity, provenance, hashes, accounting and
transitive public-evidence dependencies. A fresh context includes only the current
visitor's authorized history and permitted public material. Current controls,
claim lease, scope, worker, authority and all evidence dependencies are checked
again before tools, admission, transmission and answer commitment. The only tool
submits one immutable private answer; it supplies no company or investment action.

The existing Codex supervisor is reused with an immutable input snapshot, sanitized
environment, disabled native tools/skills/MCP, an empty dedicated workspace and a
fresh ephemeral thread. Private provider sessions cannot be reused. Subscription
usage remains monitored, not a hard cap; unavailable cost is null. Unknown usage,
provider outcomes and threshold overruns retain finite consumption and holds.
Known settlement survives partial private-answer and Company completion commits.
Privacy cleanup does not rewrite completed execution history or pause unrelated
Company work. Restore mismatches hold the affected Ask employees without retrying.

## Independent review and regressions

The latest reviewed candidate is `fbef721c1ee94481cbb98c6cf2b40a6c6d4f6ba1`.
Its 454-file committed source inventory matches isolated Linux staging exactly
(SHA256 `469b35a35d4630b6ae55a871468036cb16b1e2bec44db9aa3ea75211ce2a9683`).
The preceding routing change passed 90 focused tests but failed both original-bound
observed workflows: plain renewal 840.742 seconds overall and actions/revision
158.760 seconds overall. The new change removes one additional full simulator replay
within synchronous loop/team authorization; independent review found no remaining
source blocker. All nine added loop-backed corruption, rollback, expiry, snapshot
mutation and independent-custody cases passed. The complete focused group passed
155/155 with no skips or failures in 282.527 seconds. The actions/revision workflow passed at its original 60-second
per-stage bound (174.167 seconds for the whole test). Full-universe same-portfolio
renewal also passed at its original 180-second stage bound (938.989 seconds for the whole
test), preserving original authority consumption and journal continuity. The additional boundaries passed221/221 and actual investment-receiver cases passed5/5,
with no skips. The remaining adapter/protocol group passed380/380 with no failures, cancellations or skips. The older
results below retain their source provenance; they are not an all-green full-suite claim.

Current executed groups (overlapping cases are not added into a full-suite total):

| Group | Implementation source | Result | Raw evidence |
| --- | --- | --- | --- |
| Coordinator and public projection | `3f57754` core integration | 18/18 pass | `logs/coordinator-focused-03.log` |
| Exact TLS coordinator/strict transport and financial gateway | `3f57754` core integration | 30/30 pass | `logs/coordinator-interop-01.log` |
| Loop/team/discussion/snapshot/recovery/private research | `fbef721` | 155/155 pass, no skips | `logs/lexical-snapshot-focused-01.log` |
| Finite/activity/pilot/risk/research/mandates/Ask boundaries | `fbef721` | 221/221 pass, no skips | `logs/lexical-snapshot-boundaries-01.log` |
| Observed actions/revision, original 60-second stage bound | `fbef721` | 1/1 pass | `logs/lexical-snapshot-actions-01.log` |
| Full-universe same-portfolio renewal, original 180-second stage bound | `fbef721` | 1/1 pass | `logs/lexical-snapshot-plain-01.log` |
| Actual standalone investment receiver, pinned `6ecd498` | `fbef721` | 5/5 pass, no skips | `logs/final-investment-receiver-01.log` |
| Remaining 11 adapter/protocol files, two passed hot cases excluded | `fbef721` | 380/380 pass, no skips | `logs/final-adapter-regressions-02.log` |

Read-only architecture/recovery and runtime/security reviewers inspected the exact
changed boundaries. Material findings were fixed: scoped versus global holds;
pre-transmit prior-history freshness; uncited and transitive evidence withdrawal;
bidirectional Company/independent-custody restore comparison; settlement crash
windows; lifecycle wakeups; private-content metadata retirement; partial commit
classification; terminal historical outcome preservation; private provider-session
collisions; topic handoff; immutable historical cooldown; actual child-exit proof;
bounded pending-tool cleanup; immutable proof/payload snapshots; and forbidden
private callback fields. Final focused reviews report no remaining material findings.

Validation uses disposable Linux staging
`/var/tmp/botsquad-ask-integration-idEyvv`, unprivileged `botsquad`, a 512 MiB Node
heap, low scheduling priority and serial test execution. The core integration was frozen at
`3f57754648340008f5eca5aea6ff8b2c6987bb2a` on PR88. Its original443-file inventory matches
staging byte-for-byte and all bytes match the implementation commit (inventory SHA256
`440db7dbc109fe7be59db54a8e035dc2722b873c27c7941238846f6fd56e7038`).

- Earlier runtime/service42/42 passed. The combined authority/coordinator/public-context/
  runtime/service run passed93/94; the sole failure was a synthetic60second lease that
  expired during a paused-claim delivery scenario. Matching the real90second receiver lease
  fixed it. Corrected coordinator/projection18/18 passed, including101configuration reads.
- Actual verified-TLS interoperability with exact website6ecd498 and the existing shared
  Dispatcher passed. One authored adapter execution, one answer wire, a dropped accepted
  answer ACK, signed receipt recovery, owned browser read, deletion/control ACK and listener/
  private-tree cleanup passed. This used15HTTPS requests and took63.201274seconds.
  Strict original-mode transport acceptance used16requests and passed in5.279751seconds.
- Those two interop cases plus the financial gateway suite passed30/30 in108.009826seconds.
  A real-clock spacing defect caused by variable pre-wire commit latency was corrected with
  a post-commit call-start floor; an injected80ms first-commit delay makes the regression
  deterministic. Existing observed-source independent wire gates remain intact.
- The initial complete-suite attempt passed1,751top-level cases (with five conditional receiver cases skipped) and failed123 in four
  adapter-dependent files because disposable staging omitted all11tracked Python adapter
  files and its fixed runtime link. A cancellation fixture then waited indefinitely for a
  request that could not start. The coordinator interrupted only the disposable parent;
  the log has no final clean summary. Unstarted files are not passes.
- Staging repair verified all454source files, existing Python3.12.12/yfinance1.7.0 and
  dependency consistency. The eight affected files plus three unreached transport/protocol
  files were rerun serially under a60minute outer deadline. Pinned Python normalization
  passed, but plain workflow renewal timed out after928.457seconds. The run was stopped
  with two passes and one failure; the retained log has no complete summary. A narrow
  duplicate discussion-verification repair was then investigated; the final passing results are recorded above. Original
  actions/revision60second and plain180second stage bounds remain unchanged.
  No heavy Mac build or local dependency installation was used.

The first routing follow-up was pinned at
`0d9aa5de3b9763b72724ddca5a33a231d4a0b3a9`. All454 source hashes match the isolated
staging copy; inventory SHA256
`247e5bf865cd80c491d5f0efd45441b5acc663c1a7ff1e6b40cd58e26789f426`.
It removes a duplicate outer discussion authorization traversal while the existing
handler still verifies within its transaction before tools, content or cached receipts.
No snapshot cache or timeout relaxation was added. The fresh build and90/90 focused
conversation/discussion/team/corruption/recovery tests passed in105.874831seconds,
including six new stale-identity, revoked-authority, unchanged-head corruption and
rollback cases. Its two subsequent workflow failures are retained in
[the failed outcome](evidence/inv-ask02-integration/discussion-routing-workflows-01-outcome.json).
The later `fbef721` result above supersedes this candidate for acceptance.

The exact website archive contains91source files and51compiled artifacts; source tree
`69f5de533afa126ae3290af84ed45f253b2fac96b1df9d7d87ee55e11a1fa2f4` and full source/build
inventory SHA256`17aa9bab77c4c9d3fee04515573d5e95ab697ccaa94da856ad31801c6f0fd854`.
The receiver lockfile was unchanged and the clean Linux build reused its previously built
locked native dependencies. Host/SNI stay asymmetri.co, certificate verification stays on,
and only a test wire injection dials the loopback TLS port. Dedicated keys and disposable
scope are generated by the literal test-only launcher and removed on verified termination.

Failures are retained in [raw logs](evidence/inv-ask02-integration/logs/): initial missing local
dependencies; runtime type typo; outdated schema allowlist/assertions; premature foreign-history
expectation; initializeNix wrapper/tuple types; fake ordinary result omitted a required summary;
VACUUM snapshot permissions0644; generic test narrowing; short synthetic lease; and copied
interop unused imports/execution discriminator. The prior broad run hit its30minute deadline:
1,175passes,26failures,55cancelled and1skip. Failures were traced to stale schema assertions,
missing staging deployment assets, a credential-root path lacking the required protected
ancestor, and the diagnosed rate-spacing defect. Fixes preserve production guards; cancelled
files and optional unconfigured interop were not treated as passes. Final interop explicitly
asserts settled complete usage and null/unavailable charges. No genuine model ran.

## Acceptance boundaries

| Requirement | Source/disposable evidence | Actual public evidence |
| --- | --- | --- |
| Existing employee selection, general/context/follow-up routing | Shared Dispatcher/service tests; authored actual-TLS delivery | Genuine model questions blocked |
| Private history and two-visitor ownership | Service, private-content and receiver ownership tests | No public intake/session provisioned |
| Tools cannot mutate investments or private tasks | Exact Ask tool allowlist and runtime rejection tests | Concrete adapter closes before RPC |
| Duplicate import, lost ACK, claim expiry | Immutable identity/epoch tests; actual signed receipt recovery | No live answer transmission |
| Cancel/delete/expiry and partial cleanup | Suppression, fault/SIGKILL and cross-store recovery tests | Operational retention proof incomplete |
| Old snapshot cannot restore authority or content | Bidirectional independent custody/effect checkpoints | No production destructive test |
| Worker/grant/generation changes and uncertain provider outcomes | Durable holds and no-repeat tests | No new operational Ask grant |
| Concurrency and investment priority | Shared two-slot/one-Ask exclusion, ordinary priority/cooldown tests | Investment process unchanged |
| Receiver/website capacity | Counterpart254/254confined synthetic cases and guarded health observations | Genuine combined model workload unmeasured |

The [independent review receipt](evidence/inv-ask02-integration/independent-reviews.json),
[production continuity read](evidence/inv-ask02-integration/hq-readback-04.json) and
[actual closed-page browser check](evidence/inv-ask02-integration/browser-readback-01.json)
separate static, authored, protocol-only and production observations.

## Actual pinned-runtime evidence

At 22:31:22 UTC the installed production Codex 0.157.0 passed a bounded, actual
zero-inference probe: fresh `thread/start`, `ephemeral:true`, `path:null`, no parent
or fork, exact empty workspace, `gpt-6-sol`, OpenAI/default, approvals never,
readOnly sandbox and network disabled. The account stayed stable and both local
children terminated. The method allowlist excluded `turn/start`; no visitor text,
model turn, new grant, purchase, reload change or investment operation occurred.
The [sanitized receipt](evidence/inv-ask02-integration/ephemeral-probe-01.json)
and [executed diagnostic](evidence/inv-ask02-integration/ephemeral-probe.mjs) are
retained. The script runs from the described staging root against its compiled
runtime helpers; it is not a public-service admission path.

This establishes local protocol properties only. It does not prove anonymous
public-service entitlement, provider-side retention, host memory/swap/core/backups
purge, genuine employee answers or combined production workload capacity. Existing
private Pro login/credits evidence is not an anonymous-service authorization.
The public eligibility gate therefore remains unconditionally closed.

## Remaining integration and release gates

Signed configuration high-water, operation-specific applied-effect reconciliation, bounded
polling, claim renewal/epochs, immutable answer delivery and lost-response receipt recovery
are now implemented. Configuration is approved by exact scope/limits/roster/notice identity;
receiver prose never enters ordinary Company records. Reading privacy controls and delivery
receipts remains possible during a content hold. Snapshot mismatches retain an Ask-only hold.
An exact missing receipt permits bounded identical-answer retransmission while its frozen
wrapper remains valid; it never repeats model inference or proves absence of a prior effect.
An expired uncertain wrapper remains conservatively held. Known answers can use a fresh claim.

The public projection admits only accepted current-generation publication receipts, follows
record/event dependencies and authentic public authorship, rejects pending withdrawals across
all record aliases, and pins approved document content hashes. `installAsk` checks the real
adapter before composing services. Migrations create no key, grant or operational authority.
Production composition, independent finite authority provisioning and genuine acceptance
remain gated by unsupported public-service eligibility and unverified retention facts.
Canonical package remains PR87 at
`00d9e82668dcfd39b25294d9a05a7f97e4d28295`, manifest
`5396443e475d3fe69825ef8af4e916a408b39452182e9c4828fa17b7faf37a84`.

Production HQ remains d262a8d/schema25/PID759078 with the existing investment run
and October14–15 schedule. No portfolio/bootstrap/allowance reset or HQ restart
occurred. Once schema29 is installed, older binaries cannot open it; repair forward
and preserve independent consumption rather than restoring data to an earlier
allowance. Anonymous intake, real Ask acceptance and source deployment remain
unperformed until the applicable reviewed operational gates are satisfied.


## Website release and independent public read-back

The website writer accepted and deployed receiver configuration source
`2b630150e17c629729ac87026f0df0ab1d30e959` after254/254 confined Linux checks;
Ask remains disabled with generation zero and no operational authority/content.
Its actual receiver implementation is `a9b1ec5548a1672a5a87537e218dc1926eb55db1`.
The final presentation-only website release is
`f47f99b87361910623d493d654eabf71431d6798`, build`Ixd_-ObWeoNMR0vKBkNyi`,
PID2401430, activated23:36:27UTC. Receipt/journal commit
`f34870552d47c3fabeb2757ba872303fbf581727` does not change the installed runtime.
The counterpart retained104 verified HTTP checks, four pre-existing IPv6 TLS failures,
four fallback fingerprints and all48 original tutorial images. Both receivers, private
configuration, authority, protected Motion content and prior immutable archive rows
remain unchanged. [Exact release and rollback record](https://github.com/eugenelin89/asymmetri/blob/f34870552d47c3fabeb2757ba872303fbf581727/docs/BOTSQUAD-STATUS-RELEASE_2026-10-13.md).

Independent verified HTTPS read-back at23:38UTC returned200 for all eight Research,
Investment, Ask, archive and availability reads, without cookies. The current exact
experiment/run and source5/journal1 were retained. The hydrated browser verified both
96×96 portraits, hierarchy, corrected “Next published review: Not published,” separate
publisher contact, unknown archive freshness, unavailable complete performance and a
snapshot explicitly labelled for its session. Ask stayed closed. Earlier mobile/tablet,
keyboard and disabled-composer checks are retained separately. The hydrated website status copy avoids
inferring an unconfigured private scheduler from missing public schedule fields; raw API
reason fields are preserved and still contain the older source reason text.
See [HTTP receipt](evidence/inv-ask02-integration/public-readback-03.json),
[browser receipt](evidence/inv-ask02-integration/browser-readback-02.json) and
[counterpart host claims](evidence/inv-ask02-integration/website-release-03.json).


The website owner acknowledged a final read-only host/public check at01:36:27UTC on
October14 (October13 evening in Vancouver): exact source/build/PID identities unchanged,
all five scoped services active without restarts, Ask disabled, eight verified HTTPS reads
successful without cookies, and retained private configurations/authority/immutable archive
baselines preserved. No release-health drift was found. A generic gunicorn-active flag was
corrected against the retained baseline: it was inactive before and after this check.
See [counterpart final read-back](evidence/inv-ask02-integration/website-release-04.json) and
[parent HTTPS read-back](evidence/inv-ask02-integration/public-readback-04.json).


## Final reconciliation and production boundary

All planned affected and previously unreached groups passed at the unchanged implementation
`fbef721`; the final 11-file adapter/protocol group passed380/380 in1235.127seconds. The
corrected Node `--test-skip-pattern` excludes the two separately passed hot workflows.
A negative include-filter had matched the enclosing file and repeated plain; that disposable
run was stopped with2passes/11cancellations and retained. The filter diagnostic first failed
from an inaccessible inherited root working directory, then passed from the actual staging
root. Neither interrupted nor diagnostic results are included in product acceptance totals.
The original full-suite attempts remain interrupted/failed; this is a documented reconciliation
of affected, unreached and conditional cases, not a claim that one complete-suite run passed.

Final read-only HQ/public checks at02:12UTC October14 retain the original production process,
source/schema, private configuration/head hashes, public identities and all14pending scheduled
occurrences. Five batches and22heartbeats are delivered; the selected run has no actual market,
collection or employee execution records yet. Eight verified public HTTPS reads return200
without cookies, with Ask disabled. No HQ restart, portfolio reset or authority reset occurred.
See [final HQ read-back](evidence/inv-ask02-integration/hq-readback-04.json),
[final public read-back](evidence/inv-ask02-integration/public-readback-05.json),
[finite authority read-back](evidence/inv-ask02-integration/finite-usage-readback-01.json),
[final scoped test results](evidence/inv-ask02-integration/lexical-snapshot-outcome.json) and
[reproduction commands](evidence/inv-ask02-integration/serial-regression-groups.sh).

GitHub returned no combined status entries or PR-triggered workflow runs for the implementation
commit; no CI success is inferred. All builds/tests ran on isolated Linux, unprivileged,
serial, nice10, with a512MiB Node heap. The Mac capacity check and counterpart Motion reports
are separate resource observations; no Motion build approval was sent after automatic review
rejected the outgoing capacity-approval message for lacking explicit trusted authorization.
No source, test or deployment depends on that unsent message.

The final read-only claim review found no material issue. The [evidence manifest](evidence/inv-ask02-integration/evidence-manifest.json) records SHA256 and byte length for every retained evidence file, including failed and interrupted runs.

The staged whitespace check reports runner-produced trailing spaces and terminal blank lines
in verbatim raw `.log` evidence. Those bytes are retained to preserve the recorded hashes;
`git diff --cached --check` excluding that raw-log directory passes for source and documentation.
