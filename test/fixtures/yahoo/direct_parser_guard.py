"""Authored-response acceptance of production adapter; never provider traffic."""
import importlib.util
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('botsquad_yahoo_adapter', root / 'adapters/yahoo/adapter.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.HISTORY_QUERY1_ONLY = module.DIRECT_CHART = True
import yfinance.data
import yfinance.scrapers.history
import requests

def forbidden(*args, **kwargs):
    raise module.GatewayStop('forbidden_bootstrap_or_network')

# These traps prove the production parse path never enters bootstrap/network. They
# do not fake a successful return or trigger upstream no-crumb fallback.
yfinance.data.YfData.__init__ = forbidden
requests.Session.send = forbidden
original = yfinance.scrapers.history.PriceHistory.history
mode = sys.argv[1]
def guarded(self, *args, **kwargs):
    frame = original(self, *args, **kwargs)
    if mode == 'extra':
        self._data.get(module.DIRECT_URL, module.DIRECT_PARAMS, 5)
    elif mode == 'alternate':
        self._data.get('https://query2.finance.yahoo.com/v8/finance/chart/AAPL', module.DIRECT_PARAMS, 5)
    if self.session.cookies or self.session.count != 1 or not self._data.consumed:
        raise module.GatewayStop('unexpected_parser_state')
    return frame

yfinance.scrapers.history.PriceHistory.history = guarded
try:
    module.main()
except module.GatewayStop as error:
    module.emit({'type': 'error', 'code': str(error)})
    raise SystemExit(1)
