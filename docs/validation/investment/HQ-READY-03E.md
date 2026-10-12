# HQ-READY-03E — one AAPL historical-data qualification

**Started:** 2026-10-12 America/Vancouver  
**Base:** `d49c77b9d655413ceb66818eafb1361f91e4c404`, clean freshly fetched local/remote main  
**Branch/worktree:** `codex/hq-ready-03e` / `../bot_messenger-hq-ready-03e`  
**Status:** Source/offline acceptance passed; integration and live gates pending; no live authority prepared or Yahoo request made

[Decision041](../../decisions/decision_041_one_shot_aapl_history.md) records the owner's exact
new authorization and reported permission. Parent is sole writer; independent reviewers are
read-only development specialists, not BotSquad employee inference.

## Scope and source

New independent03E manifest/custody/CLI, closed issuer union through existing FinancialStore
and transport, fixed pre-request query1 adapter profile, unchanged FinancialDataGateway and
synthetic-only FinancialAdmission. Old03B/03D custody source, anchors, hashes and spent markers
are preserved. New source tightens shared wire monotonic checks after synchronous I/O,
advances confirmed stages only after durability, and fixes selected family/no automatic fallback.
No schema, contract, dependency, production or employee capability changes.

## Reference and permission evidence

On2026-10-12 the official [Nasdaq schedule](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule)
confirmed September7 closure and09:30–16:00 Eastern regular hours. The frozen September range
contains21 scheduled sessions. The [Apple FAQ](https://investor.apple.com/faq/default.aspx)
confirmed AAPL/Nasdaq identity. Neither reference proves actual opening events, unexpected
closures or Yahoo coverage. No Yahoo request was made for these reference checks.
The owner's verbal personal-use permission report and explicit bounded test authorization are
accepted as reported; no independent written terms verification or public rights are claimed.

## Development evidence and findings

- First shared regression:100/101 passed; a pre-aborted transport stopped before recording its
  expected reservation. Restored consume-before-stop semantics without permitting DNS.
- First new test build exposed strict TypeScript fixture annotations; corrected.
- First03E fixture run:22/23 passed. Actual pinned six-request path returned21 authored bars;
  copied-directory denial hit file-mode checking before identity checking. Fixture permissions
  corrected to exercise identity specifically; implementation denial was not weakened.
- Independent architecture review required known HTTP refusals to settle normally in the gateway,
  separate from the irreversible no-more-wire latch; fixed. Action counts now come from retained
  original events, and sample quality distinguishes incomplete/descriptive metadata.
- Independent recovery/security reviews identified constructor-race/unproven capsule deletion
  and parent-loss descendant lifetime. Durable approval/path/device/inode ownership now gates
  deletion. A separate native watchdog survives supervisor death and kills blocked Node/Python
  descendants before bounded recovery. Added adversarial fixtures. A pre-receipt constructor
  crash can leave an empty orphan; unproven deletion is refused, with no data/network or replay.
- Final focused run:235/235 passed, zero skips,113.136s. Includes36 history tests, pinned Python
  sequence, shared diagnostics, protocol/transport, financial gateway/recovery and connectivity.
  Native watchdog fixture includes SIGKILL of supervisor while Node and Python remain alive.
- The crash test previously titled “after durable reservation” actually exercised consumption
  and sealing. Its title is corrected; reservation/transport failures have separate fixtures.
- Security, recovery, architecture and acceptance specialists report no remaining blocking
  source defects. Required regression is complete; integration remains pending.
- Initial full serial run:1493 total,1486 passed,1 failed,6 existing skips,591.201s. The local
  TLS fixture expected `all:true` despite the new explicit family4/no-auto-selection production
  options; the HTTP exchange itself succeeded. The corrected fixture separately verifies actual
  scalar production options, forced Node24 `all:true`, and TLS trust rejection. No runtime source
  or assertion of the pin's one-address behavior was weakened. Acceptance independently cleared
  this correction; final local TLS run4/4 passed, zero skips. Initial failure log retained.
- Final typecheck passed. Generated-contract integrity/build and175 contract tests passed,
  zero skips. Full serial rerun:1493 total,1487 passed,0 failed,6 existing skips,539.326s.

All financial values used in fixtures are authored. Live data is never copied to tests/Git.
All offline validation gates passed. Source integration,
rebuilt main, single live outcome and cleanup are separate
uncompleted gates; no source-success claim is a financial-data qualification.

## Frozen source

Implementation commit: `2cdc9e6d449882c27aa54e668febe373dd53ad4e`.
Test-only follow-up: `87ad823b92a606ddad0221ee3923097142b8f041`.
The [source manifest](HQ-READY-03E-source.sha256) pins30 implementation/dependency/test files;
SHA256 `f07ef4f55ee6e25f3cd54c19245a8cf3bf735b80db1868c62f989baef934f9a3`.
The [build manifest](HQ-READY-03E-build.sha256) pins20 compiled files;
SHA256 `11b35f51cc49fe0cc570208da4296f6aee5c08884bc94a0106094af23c46158d`.
The separate acceptance commit changes only documentation. Fresh-main admission additionally
hashes every tracked source/script/adapter/config and compiled TypeScript file with the actual
merged commit, preventing use of a worktree-only or stale build.

## Host and historical custody preflight

Read-only checks confirmed Node24.10.0,16GiB RAM, AC power, FileVault and encrypted swap.
The actual accepted host/core-dump checks and explicit Time Machine exclusion/verification
passed on a new empty temporary directory, then that fixture was deleted. Live anchor/capsule
exclusion is independently repeated at preparation/consumption; this fixture is no authority.
All11 original03B/03D files were hashed privately before work, and exact names/bytes match again
after development. Both authorities remain spent/noResume; Decision037 remains exhausted4/4.
The03E live anchor and capsule are still absent. No financial data was obtained in testing.

## Retained validation logs

Only non-data log hashes are committed; complete logs remain local in `/private/tmp`.

| Local log | SHA256 |
| --- | --- |
| `hq-ready-03e-focused.log` | `1b93ca406cdaf085a5809b93aa2592ec506a0717476618e80e73b919db42b8c6` |
| `hq-ready-03e-full.log` | `10d3ec76f581fa63d2e42d09287d0697d5b12bde3e7389399b4d3fe7c7b89ff8` |
| `hq-ready-03e-local-final.log` | `09dce70889a1c62710d25a4bd1f0616019b6e32c8bb633a0ab1d5befbd001078` |
| `hq-ready-03e-check-final.log` | `c9ad9f06cc17d075d6a98daaa0f145cf4d7f7d6265ff9351025f1362e5393652` |
| `hq-ready-03e-contracts-final.log` | `c7d9b260cbb654e427af84ffdfd8a4a3afecae07f7cc6790d5412d59ed83a707` |
| `hq-ready-03e-full-final.log` | `bc1647ebe21481809a120f78f5a640837e8d10958d702ef3c5acdb8d2ad8b9bc` |

The six pre-existing skips are five external standalone-receiver cases and one Linux-only
filesystem/resource case. No Yahoo, pinned Python, custody, transport, callback or recovery
test was skipped. Runtime source remains commit2cdc9e6; the sole later test correction is
87ad823. Security independently verified all30 source and20 build entries against that commit.
Architecture/recovery clear the same runtime; acceptance cleared the fixture correction and
requires the full passing result above. No Level3 employee, public or production run is claimed.
