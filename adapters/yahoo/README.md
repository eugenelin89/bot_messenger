# Pinned Yahoo adapter

HQ-READY-03 implements a one-operation Python adapter behind the trusted Financial Data
Gateway. Import, migration and application startup never invoke it. Only authored fixture
transport is admitted; `YahooHttpsTransport.exchange` rejects before DNS. There is no live
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
The fixed child uses `-I -B`, a temporary working directory/home/cache, a scrubbed environment,
single numerical threads and a bounded JSON-line protocol. No shell or user-selected executable
is accepted. The audited requests session delegates every HTTP request to the parent; the Python
audit hook rejects DNS/connect calls. This is defense in depth for the pinned trusted library,
not an OS sandbox for arbitrary or malicious native Python packages. Child cancellation kills
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
