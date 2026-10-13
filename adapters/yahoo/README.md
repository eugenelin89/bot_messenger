# Pinned Yahoo adapter

HQ-READY-03 implements a one-operation Python adapter behind the trusted Financial Data
Gateway. Import, migration and application startup never invoke it. The application remains fixture-only; the separate HQ-READY-03B owner CLI requires
a consumed, exact private manifest and encrypted custody. The generic `YahooHttpsTransport.exchange` rejects before DNS. There is no live
flag, employee command or collector. See the [dossier and probe proposal](../../docs/operations/YAHOO_FINANCIAL_GATEWAY.md).

## Reproduce offline validation

Use Python **3.12.12**, Node24 and the existing repository dependencies. Install only into
this adapter's ignored virtual environment; never the employee environment or production:

```sh
python3.12 -m venv adapters/yahoo/.venv
adapters/yahoo/.venv/bin/python -m pip install --require-hashes --only-binary=:all: -r adapters/yahoo/requirements.lock
adapters/yahoo/.venv/bin/python -m pip check
npm run build
node --test --test-concurrency=1 dist/test/yahoo-python.test.js dist/test/yahoo-protocol.test.js dist/test/yahoo-transport.test.js dist/test/financial-gateway.test.js dist/test/financial-recovery.test.js
```

Package installation reaches the package index, never Yahoo. Python fixture tests explicitly
skip when this environment is absent; those skips cannot establish adapter acceptance.
The fixed child uses `-I -B`, an empty temporary working directory/home, UTC, a scrubbed environment,
single numerical threads and a bounded JSON-line protocol. No shell or user-selected executable
is accepted. The audited requests session delegates every HTTP request to the parent; the Python
audit hook rejects DNS/connect calls. This is defense in depth for the pinned trusted library,
not an OS sandbox for arbitrary or malicious native Python packages. Pinned timezone, cookie
and ISIN caches are disabled; a data-processing audit hook rejects file writes/process spawning.
Core dumps are disabled and an independent 120-second child alarm survives supervisor death. Child cancellation kills
the process and waits for close; no stderr/provider diagnostics enter receipts.

## Dependency and capability audit — 2026-10-11

`requirements.lock` pins **yfinance1.7.0 and all22 transitive packages** to exact versions and
SHA-256 wheel hashes. `dependency-audit.json` records each installed artifact/hash, dependency
requirements and the per-version PyPI metadata source. Its published vulnerability arrays were
empty at inspection; this is a point-in-time package metadata check, not a comprehensive security
guarantee. No dependency upgrade is automatic. Python validates every installed version on each
operation. The lock allows unyanked wheels across platforms; only macOS arm64 was executed here.
Linux installation and confinement remain unvalidated. No Node dependency or lockfile changed.

Source was inspected in the installed1.7.0 wheel (`data.py`, `scrapers/history.py`,
`scrapers/quote.py`, `scrapers/fundamentals.py`, `config.py`):

- `YF_DISABLE_CURL_CFFI=1` selects requests; a supplied `requests.Session` is supported. The
  mandatory `curl_cffi` package remains locked but is not used for transport. No impersonation,
  proxy or cookie-strategy fallback is granted. A parent denial terminates the child.
- All library calls, including cookie/crumb bootstrap, metadata, quote and chunked statement
  requests, cross the parent quota. Library retries are0. The gateway permits at most two
  additional attempts for502/503/504, within the original shared budget/deadline.
- `Ticker.history` is called with explicit `auto_adjust=False`, `back_adjust=False`,
  `repair=False`, `rounding=False`, `actions=True`, `keepna=True`, `prepost=False`, `interval=1d`.
  No `download`/parallel workers are used. These flags do not prove as-traded split basis.
- The library moves daily indexes to exchange midnight and substitutes zero for missing volume.
  The adapter preserves original chart event timestamps and restores explicit nulls. Dropped
  source dates, missing adjustment arrays and changed columns fail closed. Original chart/quote/
  timeseries symbols are checked before library rewriting. Raw action event timestamps and
  dividend currencies survive library processing; quote/reporting currencies remain distinct.
  Binary64-derived
  decimal strings are labelled accordingly; original bounded response text is retained.
- `get_info` provides selected current fields, not point-in-time fundamentals. It invokes
  quoteSummary, quote and a trailingPegRatio timeseries request even when that ratio is not selected.
- `get_income_stmt`, `get_balance_sheet` and `get_cash_flow`, `pretty=False`, support yearly and
  quarterly. The pinned library requests a broad finite timeseries beginning2016-12-31 and
  chunks metric types; returned tables are bounded to4 annual or5 quarterly periods and300 rows.
  Labels are preserved, but units/release times are unqualified when not established.
- The private metadata member `_price_history._history_metadata` is intentionally pinned and
  schema-checked. An upgrade needs source re-audit, fixture execution and a new reviewed version.

The [project documentation](https://ranaroussi.github.io/yfinance/) and
[PyPI release](https://pypi.org/project/yfinance/1.7.0/) describe the library; neither its software
license nor its availability grants Yahoo data automation, retention or redistribution rights.

HQ-READY-03B freezes exact statement types/chunks and UTC epoch bounds from this pinned version.
HTTP200 provider errors, malformed/empty top-level result envelopes and statement schema failures
raise a non-catchable gateway stop before quote/chunk fallback. Empty action events within valid
complete chart rows remain an honest zero-actions result. All such checks use authored fixtures
before the separately authorized single probe.

HQ-READY-03E adds `history.py`, a separate fixed query1-only profile for exactly AAPL daily
history September1 inclusive–October1 exclusive2026. It asserts the pinned library's original
query2 globals, then sets both `yfinance.base._BASE_URL_` and `yfinance.scrapers.history._BASE_URL_`
to query1 before Ticker creation. This is not response-based fallback. The parent separately
checks each ordinal of the six-call manifest. Three successful cookie-bootstrap calls, one
crumb, one metadata chart and one historical chart are the audited sequence; every call counts.
Any non-200 including cookie404 stops. See Decision041 and03E acceptance; source/profile alone
grants no wire permission, and the old default adapter/authorities retain their original scope.

HQ-READY-03F adds `bootstrap.py`, an **offline-only** compatibility profile through the same
adapter. It preserves HTTP404 only for an exact parent-qualified cookie-bootstrap response,
requires actual cookie presence without copying credentials into Python, and rejects missing
crumbs. All-200 legacy03E behavior and spent custody remain unchanged. The gateway exception
requires synthetic scope and authored transport; no owner CLI selects this profile. Run
`node --test dist/test/yahoo-bootstrap.test.js` after build for actual pinned-library authored
fixtures, including separately isolated upstream no-crumb/fallback tests. The exact six-call
sequence persists; two calls are charts. [Decision042](../../docs/decisions/decision_042_yahoo_bootstrap_compatibility.md)
defines the narrow grammar and [acceptance](../../docs/validation/investment/HQ-READY-03F.md)
records limitations. No404 body from a previous private probe was recovered or used as a fixture.


HQ-READY-03H adds fixed `direct.py`. It sets the original pinned query1 profile, obtains one
exact AAPL chart response through the parent, validates original identity/JSON/numeric/action
schema and passes that same response once to `PriceHistory`. It never constructs `Ticker` or
`YfData`; further captured-source access raises a non-catchable stop. No bootstrap, cookie,
crumb, forged session, native request or fallback is used. Existing parser flags, normalization,
null restoration and provider timestamps remain. `test/yahoo-direct.test.ts` exercises the
actual pinned Python path, with separate traps for `YfData` and native `Session.send` and an
explicit extra-read rejection. Authored tests establish parsing feasibility only. See
[Decision044](../../docs/decisions/decision_044_one_shot_direct_yahoo_chart.md) and
[acceptance](../../docs/validation/investment/HQ-READY-03H.md) for reviewed live gates/outcome.
