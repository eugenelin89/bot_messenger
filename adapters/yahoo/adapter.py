"""HQ-READY-03. One pinned yfinance operation, with every HTTP call delegated over stdio.

There is deliberately no live transport. This process cannot open sockets; the trusted
parent owns fixture admission/accounting. Never run a Yahoo convenience accessor directly.
"""
import json
import logging
import math
import os
import platform
import sys
import tempfile

PROTOCOL = "yahoo-yfinance-v1"
SETTINGS = dict(auto_adjust=False, back_adjust=False, repair=False, rounding=False,
                actions=True, keepna=True, prepost=False, interval="1d")
MAX_LINE = 600_000


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
    if platform.python_version() != "3.12.12":
        raise GatewayStop("python_version_mismatch")
    from importlib.metadata import version
    from pathlib import Path
    audit = json.loads(Path(__file__).with_name("dependency-audit.json").read_text())
    if any(version(p["name"]) != p["version"] for p in audit["packages"]):
        raise GatewayStop("python_dependency_version_mismatch")
    import requests
    import yfinance as yf
    from yfinance.config import YfConfig
    if yf.__version__ != "1.7.0":
        raise GatewayStop("yfinance_version_mismatch")
    YfConfig.network.retries = 0
    YfConfig.network.proxy = None
    YfConfig.debug.hide_exceptions = False
    YfConfig.locale.lang = "en-US"
    YfConfig.locale.region = "US"
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

    class BridgeSession(requests.Session):
        def __init__(self):
            super().__init__()
            self.trust_env = False
            self.charts = []
            self.count = 0

        def request(self, method, url, **kwargs):
            if method.upper() != "GET" or kwargs.get("data") or kwargs.get("json"):
                raise GatewayStop("python_http_method")
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
            if received["status"] != 200:
                raise GatewayStop("python_http_denied")
            # Parent rejects redirects and consent; no requests.Session transport is ever called.
            response = requests.Response()
            response.status_code = received["status"]
            response._content = received["body"].encode()
            response.encoding = "utf-8"
            response.url = url
            response.headers["Content-Type"] = received["contentType"]
            # Validate ORIGINAL provider identities before yfinance can overwrite/normalize them.
            if any(path in url for path in ("/chart/", "/quoteSummary/", "/v7/finance/quote", "/timeseries/")):
                document = response.json()
                container = "chart" if "/chart/" in url else "quoteSummary" if "/quoteSummary/" in url else "quoteResponse" if "/v7/finance/quote" in url else "timeseries"
                originals = document.get(container, {}).get("result")
                if originals is not None:
                    if not isinstance(originals, list) or len(originals) > 300:
                        raise GatewayStop("python_source_schema")
                    for original in originals:
                        identity = original.get("meta", {}).get("symbol") if container in ("chart", "timeseries") else original.get("symbol")
                        if identity != ([symbol] if container == "timeseries" else symbol):
                            raise GatewayStop("python_source_identity")
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
    with tempfile.TemporaryDirectory(prefix="yf-private-") as cache:
        yf.set_tz_cache_location(cache)
        session = BridgeSession()
        ticker = yf.Ticker(symbol, session=session)
        klass = r["dataClass"]
        if klass in ("ohlcv", "actions"):
            if r["interval"] != "1d" or not r["start"] or not r["end"]:
                raise GatewayStop("python_history_range")
            frame = ticker.history(start=r["start"], end=r["end"], timeout=5, **SETTINGS)
        else:
            # A bounded daily metadata request supplies venue/currency/timezone for statements.
            frame = ticker.history(period="1d", timeout=5, **SETTINGS)
        meta = ticker._price_history._history_metadata  # Audited private layout, pinned to 1.7.0.
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
                if set(raw_by_date) != {row["index"][:10] for row in rows}:
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
