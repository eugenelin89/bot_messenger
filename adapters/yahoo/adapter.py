"""HQ-READY-03. One pinned yfinance operation, with every HTTP call delegated over stdio.

This process cannot open sockets; the trusted parent owns fixture or one-shot owner
admission/accounting. Never run a Yahoo convenience accessor directly.
"""
import json
import logging
import math
import os
import platform
import sys
import contextlib

PROTOCOL = "yahoo-yfinance-v1"
SETTINGS = dict(auto_adjust=False, back_adjust=False, repair=False, rounding=False,
                actions=True, keepna=True, prepost=False, interval="1d")
MAX_LINE = 600_000
HISTORY_QUERY1_ONLY = False
BOOTSTRAP_COMPATIBILITY = False
DIRECT_CHART = False
RESEARCH_DIRECT = False
DIRECT_URL = "https://query1.finance.yahoo.com/v8/finance/chart/AAPL"
DIRECT_PARAMS = dict(period1=1788235200, period2=1790827200, interval="1d",
                     includePrePost=False, events="div,splits,capitalGains")


class GatewayStop(BaseException):
    """Cannot be swallowed by yfinance's generic exception/fallback handlers."""


def socket_guard(event, args):
    if event in ("socket.connect", "socket.connect_ex", "socket.getaddrinfo"):
        raise GatewayStop("python_network_disabled")


sys.addaudithook(socket_guard)
os.environ["YF_DISABLE_CURL_CFFI"] = "1"
logging.disable(logging.CRITICAL)


def read_line():
    line = sys.stdin.buffer.readline(MAX_LINE + 1)
    if len(line) > MAX_LINE or not line.endswith(b"\n"):
        raise GatewayStop("python_protocol_size")
    return json.loads(line)


def emit(value):
    encoded = json.dumps(value, separators=(",", ":"), allow_nan=False)
    if len(encoded.encode()) > MAX_LINE:
        raise GatewayStop("python_protocol_size")
    sys.stdout.write(encoded + "\n")
    sys.stdout.flush()


def main():
    global DIRECT_URL, DIRECT_PARAMS
    if platform.python_version() != "3.12.12":
        raise GatewayStop("python_version_mismatch")
    from importlib.metadata import version
    from pathlib import Path
    audit = json.loads(Path(__file__).with_name("dependency-audit.json").read_text())
    if any(version(p["name"]) != p["version"] for p in audit["packages"]):
        raise GatewayStop("python_dependency_version_mismatch")
    import requests
    import yfinance as yf
    # Pinned cache classes are deliberately no-op: no timezone/cookie/ISIN SQLite or disk cache.
    # This protects custody even if this child or its parent is killed without finally cleanup.
    from yfinance import cache as yf_cache
    yf_cache._TzCacheManager._tz_cache = yf_cache._TzCacheDummy()
    yf_cache._CookieCacheManager._Cookie_cache = yf_cache._CookieCacheDummy()
    yf_cache._ISINCacheManager._isin_cache = yf_cache._ISINCacheDummy()
    from yfinance.config import YfConfig
    if yf.__version__ != "1.7.0":
        raise GatewayStop("yfinance_version_mismatch")
    if HISTORY_QUERY1_ONLY:
        import yfinance.base as yf_base
        import yfinance.scrapers.history as yf_history
        if yf_base._BASE_URL_ != "https://query2.finance.yahoo.com" or yf_history._BASE_URL_ != "https://query2.finance.yahoo.com":
            raise GatewayStop("python_host_profile_changed")
        # Fixed before Ticker creation; never a response-triggered host switch.
        yf_base._BASE_URL_ = yf_history._BASE_URL_ = "https://query1.finance.yahoo.com"
    from yfinance.scrapers.fundamentals import Financials
    original_payload = Financials._fetch_fundamentals_payload
    def strict_payload(self, *args, **kwargs):
        try:
            return original_payload(self, *args, **kwargs)
        except Exception:
            raise GatewayStop("python_statement_schema")
    Financials._fetch_fundamentals_payload = strict_payload
    YfConfig.network.retries = 0
    YfConfig.network.proxy = None
    YfConfig.debug.hide_exceptions = False
    YfConfig.locale.lang = "en-US"
    YfConfig.locale.region = "US"
    import resource
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    import signal
    signal.signal(signal.SIGALRM, lambda *_: os._exit(1))
    signal.alarm(120)  # Independent child ceiling survives loss of the supervisor.
    def custody_guard(event, args):
        if event == "open":
            mode = args[1] if len(args) > 1 else None
            flags = args[2] if len(args) > 2 else 0
            if (isinstance(mode, str) and any(c in mode for c in "wax+")) or (isinstance(flags, int) and flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND)):
                raise GatewayStop("python_disk_write_disabled")
        if event in ("os.mkdir", "os.rename", "os.remove", "os.rmdir", "subprocess.Popen", "os.system"):
            raise GatewayStop("python_external_effect_disabled")
    sys.addaudithook(custody_guard)
    envelope = read_line()
    if set(envelope) != {"protocol", "input"} or envelope["protocol"] != PROTOCOL:
        raise GatewayStop("python_protocol")
    arg = envelope["input"]
    if set(arg) != {"symbol", "request"}:
        raise GatewayStop("python_protocol")
    r, symbol = arg["request"], arg["symbol"]
    import re
    if not isinstance(symbol, str) or not re.fullmatch(r"[A-Z][A-Z0-9.-]{0,19}", symbol):
        raise GatewayStop("python_symbol")
    if set(r) != {"schemaVersion", "instrumentId", "dataClass", "start", "end", "interval", "statement", "frequency", "fields", "adjustment"}:
        raise GatewayStop("python_protocol")
    if r["schemaVersion"] != "financial-research-v1" or r["adjustment"] != "yahoo_unrepaired":
        raise GatewayStop("python_protocol")

    if HISTORY_QUERY1_ONLY and not RESEARCH_DIRECT and (symbol != "AAPL" or r["dataClass"] != "ohlcv" or r["start"] != "2026-09-01" or r["end"] != "2026-10-01"):
        raise GatewayStop("python_history_profile")

    if RESEARCH_DIRECT:
        from datetime import datetime
        from zoneinfo import ZoneInfo
        if r["dataClass"] != "ohlcv" or r["interval"] != "1d":
            raise GatewayStop("python_research_profile")
        start = datetime.strptime(r["start"], "%Y-%m-%d").replace(tzinfo=ZoneInfo("America/New_York"))
        end = datetime.strptime(r["end"], "%Y-%m-%d").replace(tzinfo=ZoneInfo("America/New_York"))
        if not 0 < (end - start).days <= 32:
            raise GatewayStop("python_research_range")
        DIRECT_URL = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol
        DIRECT_PARAMS = dict(period1=int(start.timestamp()), period2=int(end.timestamp()), interval="1d",
                             includePrePost=False, events="div,splits,capitalGains")

    class BridgeSession(requests.Session):
        def __init__(self):
            super().__init__()
            self.trust_env = False
            self.charts = []
            self.count = 0

        def request(self, method, url, **kwargs):
            if method.upper() != "GET" or kwargs.get("data") or kwargs.get("json"):
                raise GatewayStop("python_http_method")
            if DIRECT_CHART and (self.count != 0 or url != DIRECT_URL or kwargs.get("params") != DIRECT_PARAMS):
                raise GatewayStop("python_direct_request_scope")
            self.count += 1
            if self.count > 100:
                raise GatewayStop("python_request_limit")
            emit({"type": "request", "id": self.count,
                  "query": {"method": "GET", "url": url, "params": kwargs.get("params") or {}}})
            reply = read_line()
            if reply.get("id") != self.count or reply.get("type") != "response":
                raise GatewayStop("python_protocol")
            if reply.get("error"):
                raise GatewayStop("python_transport_denied")
            received = reply["response"]
            if received.get("bootstrapRejected"):
                raise GatewayStop("python_bootstrap_rejected")
            cookie = url in ("https://fc.yahoo.com", "https://fc.yahoo.com/") and not kwargs.get("params")
            benign404 = (BOOTSTRAP_COMPATIBILITY and cookie and received["status"] == 404
                         and re.fullmatch(r"text/plain(?:;\s*charset=utf-8)?", received["contentType"], re.I)
                         and re.fullmatch(r"(?:404 )?Not Found(?:\r?\n)?", received["body"])
                         and received.get("retryAfter") is None
                         and received.get("bootstrapCookiePresent") is True)
            if received["status"] != 200 and not benign404:
                raise GatewayStop("python_http_denied")
            if BOOTSTRAP_COMPATIBILITY and cookie and received.get("bootstrapCookiePresent") is not True:
                raise GatewayStop("python_bootstrap_cookie_missing")
            if BOOTSTRAP_COMPATIBILITY and url.endswith("/v1/test/getcrumb"):
                if (not re.fullmatch(r"[A-Za-z0-9._~+/-]{1,256}", received["body"])
                        or re.search(r"consent|captcha|login|signin|denied|forbidden|unauthori[sz]ed|too.?many.?requests", received["body"], re.I)):
                    raise GatewayStop("python_crumb_schema")
            # Parent rejects redirects and consent; no requests.Session transport is ever called.
            response = requests.Response()
            response.status_code = received["status"]
            response._content = received["body"].encode()
            response.encoding = "utf-8"
            response.url = url
            response.headers["Content-Type"] = received["contentType"]
            # Validate ORIGINAL provider identities before yfinance can overwrite/normalize them.
            if any(path in url for path in ("/chart/", "/quoteSummary/", "/v7/finance/quote", "/timeseries/")):
                try:
                    if DIRECT_CHART:
                        def invalid_constant(_value):
                            raise GatewayStop("python_direct_json")
                        def unique_object(pairs):
                            value = {}
                            for key, item in pairs:
                                if key in value:
                                    raise GatewayStop("python_direct_json")
                                value[key] = item
                            return value
                        document = json.loads(received["body"], parse_constant=invalid_constant, object_pairs_hook=unique_object)
                    else:
                        document = response.json()
                    container = "chart" if "/chart/" in url else "quoteSummary" if "/quoteSummary/" in url else "quoteResponse" if "/v7/finance/quote" in url else "timeseries"
                    envelope = document.get(container)
                    if not isinstance(envelope, dict) or envelope.get("error") is not None:
                        raise GatewayStop("python_provider_denial_or_schema")
                    originals = envelope.get("result")
                    if not isinstance(originals, list) or not originals or len(originals) > 300:
                        raise GatewayStop("python_source_empty_or_schema")
                    if DIRECT_CHART and len(originals) != 1:
                        raise GatewayStop("python_chart_schema")
                    for original in originals:
                        identity = original.get("meta", {}).get("symbol") if container in ("chart", "timeseries") else original.get("symbol")
                        if identity != ([symbol] if container == "timeseries" else symbol):
                            raise GatewayStop("python_source_identity")
                        if container == "quoteSummary":
                            for module in ("financialData", "quoteType", "defaultKeyStatistics", "assetProfile", "summaryDetail"):
                                if module in original and not isinstance(original[module], dict):
                                    raise GatewayStop("python_source_schema")
                        if container == "timeseries":
                            for key, points in original.items():
                                if key in ("meta", "timestamp"):
                                    continue
                                if not isinstance(points, list):
                                    raise GatewayStop("python_source_schema")
                                for point in points:
                                    if not isinstance(point, dict) or not isinstance(point.get("reportedValue"), dict):
                                        raise GatewayStop("python_source_schema")
                                    if "raw" not in point["reportedValue"] or not isinstance(point.get("asOfDate"), str):
                                        raise GatewayStop("python_source_schema")
                except (ValueError, TypeError, AttributeError, KeyError):
                    raise GatewayStop("python_source_schema")
            try:
                if "/v8/finance/chart/" in url:
                    document = response.json()
                    result = document.get("chart", {}).get("result")
                    if result:
                        chart = result[0]
                        if "timestamp" in chart and chart["timestamp"]:
                            indicators = chart.get("indicators", {})
                            quote = (indicators.get("quote") or [{}])[0]
                            if not all(k in quote for k in ("open", "high", "low", "close", "volume")):
                                raise GatewayStop("python_chart_schema")
                            if not indicators.get("adjclose") or "adjclose" not in indicators["adjclose"][0]:
                                raise GatewayStop("python_chart_adjustment_missing")
                            arrays = list(quote.values()) + [indicators["adjclose"][0]["adjclose"]]
                            if any(not isinstance(a, list) or len(a) != len(chart["timestamp"]) for a in arrays):
                                raise GatewayStop("python_chart_schema")
                        self.charts.append(chart)
            except (ValueError, TypeError, AttributeError, KeyError, IndexError):
                raise GatewayStop("python_chart_schema")
            return response

    def cell(value):
        if value is None:
            return None
        if isinstance(value, str):
            return value
        if isinstance(value, bool):
            raise GatewayStop("python_numeric_type")
        if math.isnan(float(value)):
            return "NaN"
        if not math.isfinite(float(value)):
            raise GatewayStop("python_nonfinite")
        return str(value)

    # Fresh isolated cache per operation: no home cookies, credentials or persistent yfinance cache.
    with contextlib.nullcontext():
        session = BridgeSession()
        if DIRECT_CHART:
            # Obtain the single response through existing parent admission, then give the
            # exact response to the pinned parser. No Ticker/YfData or bootstrap state.
            from yfinance.scrapers.history import PriceHistory
            captured = session.get(DIRECT_URL, params=DIRECT_PARAMS)
            raw = session.charts[-1]
            meta = raw.get("meta", {})
            if (meta.get("symbol") != (symbol if RESEARCH_DIRECT else "AAPL") or meta.get("currency") != "USD"
                    or meta.get("exchangeName") not in (("NMS", "NGM", "NCM", "NASDAQ", "NYQ", "NYSE") if RESEARCH_DIRECT else ("NMS", "NGM", "NCM", "NASDAQ"))
                    or meta.get("exchangeTimezoneName") != "America/New_York"
                    or meta.get("instrumentType") != "EQUITY"
                    or meta.get("dataGranularity") != "1d"):
                raise GatewayStop("python_direct_metadata")
            stamps = raw.get("timestamp")
            if (not isinstance(stamps, list) or not 1 <= len(stamps) <= 366
                    or any(type(ts) is not int for ts in stamps)
                    or len(set(stamps)) != len(stamps)):
                raise GatewayStop("python_chart_schema")
            # Validate original JSON types before pandas/yfinance can coerce strings,
            # booleans or fractional volumes into apparently valid financial numbers.
            def number(value):
                return type(value) in (int, float) and math.isfinite(value)
            quote = raw["indicators"]["quote"][0]
            for field in ("open", "high", "low", "close", "volume", "adjclose"):
                values = raw["indicators"]["adjclose"][0]["adjclose"] if field == "adjclose" else quote[field]
                for value in values:
                    if value is None:
                        continue
                    if (not number(value) or (field == "volume" and
                            (value < 0 or value > 9007199254740991 or int(value) != value))):
                        raise GatewayStop("python_direct_numeric_schema")
            events = raw.get("events", {})
            if not isinstance(events, dict) or set(events) - {"dividends", "splits", "capitalGains"}:
                raise GatewayStop("python_direct_action_schema")
            for kind, actions in events.items():
                if not isinstance(actions, dict) or (kind == "capitalGains" and actions):
                    raise GatewayStop("python_direct_action_schema")
                for action in actions.values():
                    if (not isinstance(action, dict) or type(action.get("date")) is not int
                            or not DIRECT_PARAMS["period1"] <= action["date"] < DIRECT_PARAMS["period2"]):
                        raise GatewayStop("python_direct_action_schema")
                    if kind == "splits":
                        numerator, denominator = action.get("numerator"), action.get("denominator")
                        if (not number(numerator) or not number(denominator) or numerator <= 0
                                or denominator <= 0 or not math.isfinite(numerator / denominator)):
                            raise GatewayStop("python_direct_action_schema")
                    elif not number(action.get("amount")) or action["amount"] < 0:
                        raise GatewayStop("python_direct_action_schema")
            class CapturedChart:
                consumed = False
                def get(self, url, params, timeout):
                    if self.consumed or url != DIRECT_URL or params != DIRECT_PARAMS:
                        raise GatewayStop("python_captured_chart_scope")
                    self.consumed = True
                    return captured
                cache_get = get
            source = CapturedChart()
            history = PriceHistory(source, symbol, meta["exchangeTimezoneName"], session=session)
        else:
            ticker = yf.Ticker(symbol, session=session)
        klass = r["dataClass"]
        if klass in ("ohlcv", "actions"):
            if r["interval"] != "1d" or not r["start"] or not r["end"]:
                raise GatewayStop("python_history_range")
            frame = (history.history if DIRECT_CHART else ticker.history)(start=r["start"], end=r["end"], timeout=5, **SETTINGS)
        else:
            # A bounded daily metadata request supplies venue/currency/timezone for statements.
            frame = ticker.history(period="1d", timeout=5, **SETTINGS)
        meta = (history if DIRECT_CHART else ticker._price_history)._history_metadata  # Audited pinned layout.
        if klass in ("ohlcv", "actions"):
            columns = list(frame.columns)
            if len(frame) > 366:
                raise GatewayStop("python_row_limit")
            rows = [{"index": index.isoformat(), "values": [cell(v) for v in row]} for index, row in frame.iterrows()]
            # yfinance converts missing volume to zero. Restore explicit provider missingness.
            if session.charts and rows:
                raw = session.charts[-1]
                quote = raw["indicators"]["quote"][0]
                import pandas as pd
                raw_by_date = {pd.Timestamp(ts, unit="s", tz="UTC").tz_convert(meta["exchangeTimezoneName"]).date().isoformat(): n for n, ts in enumerate(raw["timestamp"])}
                if (DIRECT_CHART and len(raw_by_date) != len(raw["timestamp"])) or set(raw_by_date) != {row["index"][:10] for row in rows}:
                    raise GatewayStop("python_library_dropped_bars")
                action_dates = {}
                for kind in ("dividends", "splits"):
                    for action in raw.get("events", {}).get(kind, {}).values():
                        stamp = pd.Timestamp(action["date"], unit="s", tz="UTC")
                        day = stamp.tz_convert(meta["exchangeTimezoneName"]).date().isoformat()
                        if day not in raw_by_date or (day, kind) in action_dates:
                            raise GatewayStop("python_ambiguous_action")
                        action_dates[(day, kind)] = dict(timestamp=stamp.isoformat().replace("+00:00", "Z"))
                        if kind == "dividends":
                            action_dates[(day, kind)]["currency"] = action.get("currency")
                for row in rows:
                    n = raw_by_date[row["index"][:10]]
                    row["dividend"] = action_dates.get((row["index"][:10], "dividends"))
                    row["split"] = action_dates.get((row["index"][:10], "splits"))
                    row["providerTimestamp"] = pd.Timestamp(raw["timestamp"][n], unit="s", tz="UTC").isoformat().replace("+00:00", "Z")
                    for column, source in (("Open","open"),("High","high"),("Low","low"),("Close","close"),("Volume","volume")):
                        if quote[source][n] is None:
                            row["values"][columns.index(column)] = None
                    if raw["indicators"]["adjclose"][0]["adjclose"][n] is None:
                        row["values"][columns.index("Adj Close")] = None
            data = {"columns": columns, "rows": rows}
        elif klass == "fundamentals":
            allowed = {"shortName","longName","sector","industry","country","marketCap","totalRevenue","totalDebt","totalCash","trailingPE","forwardPE","priceToBook","sharesOutstanding","profitMargins","revenueGrowth","returnOnEquity"}
            if not isinstance(r["fields"], list) or not r["fields"] or len(r["fields"]) > 16 or not set(r["fields"]) <= allowed:
                raise GatewayStop("python_fields")
            info = ticker.get_info()
            # No implied historical as-of or publication time from current snapshots.
            data = dict(values={key: cell(info.get(key)) for key in r["fields"]},
                        quoteCurrency=info.get("currency"), reportingCurrency=info.get("financialCurrency"))
        elif klass == "statement":
            accessors = {"income": ticker.get_income_stmt, "balance_sheet": ticker.get_balance_sheet, "cash_flow": ticker.get_cash_flow}
            if r["statement"] not in accessors or r["frequency"] not in ("annual","quarterly"):
                raise GatewayStop("python_statement")
            statement = accessors[r["statement"]](as_dict=False, pretty=False, freq="yearly" if r["frequency"] == "annual" else "quarterly")
            if len(statement) > 300 or len(statement.columns) > (4 if r["frequency"] == "annual" else 5):
                raise GatewayStop("python_row_limit")
            data = {"columns": [v.date().isoformat() for v in statement.columns],
                    "rows": [{"label": str(label), "values": [cell(v) for v in values]} for label, values in statement.iterrows()]}
        else:
            raise GatewayStop("python_data_class")
        output = dict(protocol=PROTOCOL, versions=dict(python=platform.python_version(),yfinance=yf.__version__),
                      symbol=symbol,dataClass=klass,currency=meta.get("currency"),timezone=meta.get("exchangeTimezoneName"),
                      exchange=meta.get("exchangeName"),data=data,settings=SETTINGS)
        emit({"type":"result", "body":json.dumps(output,separators=(",",":"),allow_nan=False)})


if __name__ == "__main__":
    try:
        main()
    except GatewayStop as error:
        emit({"type":"error","code":str(error)})
        sys.exit(1)
    except BaseException:
        # Provider exception text can include URLs, cookies or payloads; never echo it.
        emit({"type":"error","code":"python_adapter_failure"})
        sys.exit(1)
