# HQ-READY-03F — offline Yahoo bootstrap compatibility

**Date:** 2026-10-12 America/Vancouver

**Base:** `2bca0e7db3d2acb54db45219b8f03684c4d335ee`, fetched clean synchronized main

**Branch/worktree:** `codex/hq-ready-03f-bootstrap` / `../bot_messenger-hq-ready-03f`

**Implementation commit:** `d6a6fcbe5ab026db259a747a16c6765abffcd7a6`

**Status:** Accepted offline source; reviewed Git integration follows this record; no Yahoo I/O or new live authority

The parent is the only implementation writer. Independent architecture, security, recovery and
acceptance reviewers are read-only development specialists, not BotSquad employees. The owner
explicitly authorized source/tests/documentation and reviewed Git integration, then a proposal
without execution. [Decision042](../../decisions/decision_042_yahoo_bootstrap_compatibility.md)
records the narrow compatibility rule and its unchanged authority boundary.

## Exact upstream investigation

The requested [yfinance1.7.0 data.py](https://github.com/ranaroussi/yfinance/blob/1.7.0/yfinance/data.py)
was fetched only from GitHub and compared byte-for-byte with the installed pinned wheel.
Both SHA256 values are `5f41a4cec99d50be3a13c8ae5f2674e1b5e1582be1a861fcdbb57bba783629da`.
No Yahoo request was used to investigate semantics or obtain fixture bodies.

- `_get_cookie_basic` returns early for an existing/reloaded cookie. Otherwise it calls
  `session.get(fc.yahoo.com)`, does **not** inspect returned status/body, invokes cookie saving,
  ignores that save result, and returns True. A returned404 therefore need not abort upstream.
  True is not proof that any cookie exists or that a session is authenticated.
- `_save_cookie_curlCffi` returns False for an empty jar. With a suitable Yahoo jar it calls the
  cookie cache's store operation. It does not set `_cookie` on this fetch path. Persistent load
  requires cached A3 and checks expiry. BotSquad disables that cache and keeps actual cookies in
  the parent, so the child cannot reload or claim one.
- `_get_cookie_and_crumb_basic` invokes `_get_cookie_basic`; `_get_crumb_basic` invokes it again
  when no crumb is cached, then reads crumb text. Basic crumb handling treats429 or the rate-limit
  text as `YFRateLimitError`, and None/HTML as missing. It is not a comprehensive denial/schema
  validator. BotSquad retains stricter status, content and cookie validation.
- `_make_request` can catch a crumb rate-limit error or recognized transient exception and send
  the target request without a crumb. A target response >=400 can invoke the alternate cookie
  strategy and another request even when network retries are0. Consent helpers can issue extra
  requests. Authored upstream-only fixtures demonstrate these behaviors; BotSquad does not permit
  these fallback paths after a refusal, missing crumb or uncertainty.
- The selected requests backend lacks `requests.exceptions.DNSError`, although `_get_cookie_basic`
  names it in an exception clause. An exception raised by the bridge at that point can therefore
  become AttributeError and emerge as sanitized `python_adapter_failure`. The direct bridge test
  records that exact pinned behavior and proves one call only. No upstream monkey patch is used.
  Parent gateway rejection kills the child and remains terminal independently of library catches.

[Historical issue2456](https://github.com/ranaroussi/yfinance/issues/2456) reports version0.2.59
with bootstrap404 followed by crumb200 and AAPL chart200, and a repeated-bootstrap fix reported
in0.2.61. It is historical technical evidence, not current access evidence or a fixture payload.
The1.7.0 source and actual offline execution, not that older version, determine this correction.

## Confirmed mismatch and implemented correction

The accepted BridgeSession rejects every non-200 before returning a requests.Response, the gateway
classifies404 as terminal, the parent cookie jar ingests cookies only on200, and03E custody sets
its permanent wire-denied latch on non-200. These explain why a response upstream can process
stops the accepted BotSquad path. They do not reveal what the destroyed03E body/cookies contained.

Only an explicit offline profile changes that behavior. It recognizes a tiny plain-text404
response grammar, requires a freshly received Secure nonempty anonymous A3 valid for both crumb
and chart paths, rejects challenge/redirect headers, and validates the actual outgoing cookie
header after DNS/rate spacing. Cookie values remain in parent memory. The Python response still
has status404; no cookie is manufactured in the child's empty jar and no logged-in state is asserted.
A valid parent-owned crumb must match each chart request. Changed cookies stop before chart reuse.

A complete invalid response is returned to trusted accounting with a nonsecret rejection marker:
original status, actual body bytes and hash are retained; the body is not sent to Python or stored
as financial evidence.403/429 circuits and other original HTTP backoffs remain intact. Incomplete,
oversized/aborted or otherwise uncertain transports retain conservative unknown accounting and
no replay. All bootstrap attempts/bytes count normally, and compatibility wire spacing is at least
five seconds after completion. Existing body/header/UTF-8/DNS/TLS/timeout controls remain in force.

The new wire factory requires fake drivers; the gateway exception requires **synthetic scope AND
authored transport**. No live CLI, issuer, manifest or custody is amended. In particular03E still
rejects non-200. A future approved compatibility profile must reuse and extend the existing custody
under a distinct identity; this task does not create that authority or call prepare/run/status/cleanup.

## Authored AAPL result and request audit

The full corrected **offline wire → gateway → actual pinned Python/yfinance → normalization**
returns21 authored September AAPL/XNAS/USD bars. Prices/volume are invented test constants,
not downloaded AAPL values. The actual sequence is:

| Ordinal | Operation | Status |
| --- | --- | --- |
|1 | Parameterless `fc.yahoo.com/` bootstrap |404 |
|2 | Same bootstrap; child cache/jar remains empty |404 |
|3 | query1 `v1/test/getcrumb` |200 |
|4 | query1 AAPL chart `range=1d&interval=1d` for timezone metadata, with crumb |200 |
|5 | Parameterless bootstrap before the subsequent library operation |404 |
|6 | query1 AAPL daily history with the frozen September epoch bounds/events, with crumb |200 |

All six are counted; there are **two chart requests**, one historical-range request, and no seventh
wire. Three404 receipts retain their original status and special bootstrap reason. Exactly two
financial originals are retained, with no cookie/crumb in normalized evidence. A replay of the
same logical ID returns the original result without I/O. A new operation cannot exceed six attempts.
An aggregate-cap test charges the nine-byte accepted bootstrap body and refuses the second attempt
before DNS when its full response reservation no longer fits.

The normalization retains unknown provider availability, current first-retrieval knowledge,
separate adjusted close and `executionQualified=false`. A historical cutoff fails no-lookahead
admission. A missing session and null source volume remain explicit partial/missing data, not
fabricated coverage or zero volume. Existing adjustment, incomplete-session, action, financial
admission and simulator regressions remain applicable; this is no paper execution qualification.

## Validation and failure evidence

All test response bodies are authored. The normal child cannot resolve/connect to Yahoo; fake
DNS/HTTPS drivers never use system Yahoo DNS or public sockets. Existing local TLS fixtures use
literal loopback. No genuine employee, paid API, production or public acceptance is claimed.

Development runs exposed a fixture scope mistakenly longer than the existing seven-day ceiling
and the pinned DNSError/AttributeError diagnostic described above. Scope dates were corrected and
the direct negative test now asserts the actual sanitized failure and one-call termination.
Those failed logs remain local; they are not acceptance. Independent review then tightened cookie
path/time-of-use checks, completed-denial accounting, HTTP backoff preservation and exact newline
grammar. No failure was hidden by skipping tests or relaxing a denial. Final committed-diff review also
caught Markdown hard-break trailing whitespace omitted by the earlier unstaged-only check;
metadata now uses blank lines and the complete base-to-head diff check passes.

| Check | Evidence/result |
| --- | --- |
| Upstream-only authored sessions | Five Python cases: returned404 without cookie, cookie save/crumb success,429/transient no-crumb charts, target404 alternate-strategy retry despite retries0 |
| Expanded compatibility checkpoint |60/60 pass,0 failures/skips; `/private/tmp/hq-ready-03f-bootstrap-fourth.log` |
| Broadened focused checkpoint |250/250 pass,0 failures/skips,126.135s; `/private/tmp/hq-ready-03f-focused.log`; before final newline/backoff generalization |
| Final exact-source compatibility |68/68 pass,0 failures/skips,49.883s; `/private/tmp/hq-ready-03f-bootstrap-final.log` |
| Final typecheck/build/contracts | `npm run check` passed; `npm run contracts:test` verifies generated contracts, builds and passes175/175,0 failures/skips; `/private/tmp/hq-ready-03f-check.log`, `/private/tmp/hq-ready-03f-contracts.log` |
| Full serial regression | `npm test`:1561 tests,1555 pass,0 fail/cancel,6 existing skips,604.284s; `/private/tmp/hq-ready-03f-full.log` |
| Historical preservation | All17 private non-data file hashes equal the starting baseline; all three spent/noResume markers intact and capsules absent; `/private/tmp/hq-ready-03f-authority-final.json` |

The six full-suite skips are existing gates: four team publication receiver cases plus one
standalone receiver case require `INV07_RECEIVER_ROOT`; the generic recipe filesystem-cap case
requires Linux. No new Yahoo test is skipped. These results are local static/integration evidence,
not real employee execution, production Linux isolation or public receiver qualification.

Cancellation while spacing creates no second socket. Cancellation during a pending response
retains `[404,0]` attempt statuses; a late response cannot deliver data or erase the uncertainty
fence. The new SIGKILL test kills a **stub adapter/gateway child after accepted404 settlement**,
reopens durable SQLite and verifies original404, consumed allowance, no replay/refill and blocked
new work. It does not claim a real-pinned-Python crash at that point. Existing unchanged history
custody tests cover durable one-shot consumption, concurrent races, fsync failure, child/watchdog
loss, encrypted capsule deletion, identity-safe recovery and permanent spent authority.

## Independent review and finding disposition

- Architecture: confirms reuse of existing boundaries and unchanged observed authority; no material
  runtime issue remains after exact synthetic/fixture gating and parent-only cookie checks.
- Security: crumb-only-path cookie and expiry between validation/header creation could omit the
  cookie on charts. Both fixed: validate both paths and the single actual outgoing header. Narrow
  barrier recognition, original status and fixture-only capability remain enforced.
- Recovery: complete denials previously became unknown; now settle their actual status/bytes.
  Barrier markers previously masked403/429 backoff; HTTP status circuits now take priority.
  Cancellation, late callbacks and SIGKILL retain consumed allowance. Legacy custody is unchanged.
- Acceptance: verifies actual pinned authored six-call/21-bar evidence, distinguishes the stub
  crash fixture and unchanged live-custody regression, and requires final full/check/contracts and
  receipt equality before integration. Documentation typo about forbidden fallbacks was corrected.

Architecture, security and recovery independently accept frozen source commit
`d6a6fcbe5ab026db259a747a16c6765abffcd7a6` with no material findings remaining. Acceptance
independently verified the completed full/check/contracts results, manifests and preservation
summary and found no blocking gap. All required local evidence is complete. The documentation
commit and exact remote PR head must still match this reviewed source before merging.

The [source manifest](HQ-READY-03F-source.sha256) freezes all nine changed runtime/test files;
the [build manifest](HQ-READY-03F-build.sha256) freezes their six TypeScript outputs. Both verified
after the full-suite and contract builds. All355 relative documentation file links resolve;
`git diff --check` passes. Environment: Node24.10.0, Python3.12.12, pinned yfinance1.7.0; no
dependency changes or installations. Local acceptance log SHA256 values are:

```text
c4a6181c8714d3ae73578b04ba60c800f707ac751c2ac529af9646276b7074a6  hq-ready-03f-bootstrap-final.log
28014874ccefff75c1a747d7e91f368e3ca71257775f820f9cb06125537b1874  hq-ready-03f-focused.log
14a7c3a25c306c9640dd12641e0e9fbff14b05a92cd3f3afc17f0b7b6c76ca43  hq-ready-03f-full.log
c9ad9f06cc17d075d6a98daaa0f145cf4d7f7d6265ff9351025f1362e5393652  hq-ready-03f-check.log
4d20e5be17b2a21dc7a4e56e8d4a608185036fb24fca52ee0139599e9f6ccc93  hq-ready-03f-contracts.log
```

## Preserved authority and remaining qualification

Decision037 remains exhausted4/4.03B/03D/03E remain permanently spent and their17 owner-private
non-data files are read only for hashes/noResume checks. No private payload is recovered, copied
or reconstructed. Original decisions, acceptance records, no-replay markers and live custody
source remain unchanged. No new live approval, manifest, anchor, reservation or Yahoo request
exists from this task. No employee inference, recurring collector, paper trade, paid provider,
production deployment, Asymmetri change or public publication occurred.

The03E body's known4585-byte length is outside this tiny accepted grammar. Its destroyed content
cannot be classified retrospectively. A future unknown/HTML404 still stops; fixtures do not prove
that Yahoo will provide the accepted response form, usable cookies, a crumb or financial data.
The [exact next proposal](../../operations/YAHOO_AAPL_QUALIFICATION_PROPOSAL.md) requires separate
owner approval/permission-scope confirmation, reviewed extension of existing custody, clean merged
source/build/host checks, one supervised six-attempt operation, private quality assessment and
immediate deletion. No-crumb fallback remains excluded despite upstream support. Historical
research, observed-price paper execution and public rights remain distinct qualifications.
