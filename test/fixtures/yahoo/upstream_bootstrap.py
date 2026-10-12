"""Authored upstream semantics only. Not BotSquad authorization or a provider probe."""
import os
import sys
import unittest

os.environ['YF_DISABLE_CURL_CFFI'] = '1'
def network_guard(event, args):
    if event in ('socket.connect', 'socket.connect_ex', 'socket.getaddrinfo'):
        raise BaseException('offline_only')
sys.addaudithook(network_guard)
import requests
from yfinance import cache
from yfinance.config import YfConfig
from yfinance.data import YfData, SingletonMeta

YfConfig.network.retries = 0
YfConfig.network.proxy = None
cache._TzCacheManager._tz_cache = cache._TzCacheDummy()
cache._CookieCacheManager._Cookie_cache = cache._CookieCacheDummy()
cache._ISINCacheManager._isin_cache = cache._ISINCacheDummy()

class Session(requests.Session):
    def __init__(self, crumb_status=200, transient=False, chart_status=200, cookies=False):
        super().__init__()
        self.trust_env = False
        self.calls = []
        self.crumb_status, self.transient, self.chart_status, self.with_cookies = crumb_status, transient, chart_status, cookies
    def request(self, method, url, **kwargs):
        self.calls.append((url, dict(kwargs.get('params') or {})))
        response = requests.Response()
        response.status_code, response.url, response._content = 200, url, b'{}'
        if url == 'https://fc.yahoo.com':
            response.status_code, response._content = 404, b'Not Found'
            if self.with_cookies:
                self.cookies.set('A3', 'authored-cookie', domain='.yahoo.com', path='/', secure=True)
        elif url.endswith('/getcrumb'):
            if self.transient:
                raise requests.exceptions.Timeout('authored timeout')
            response.status_code, response._content = self.crumb_status, b'fixture-crumb'
        elif '/chart/' in url:
            response.status_code = self.chart_status
        elif url == 'https://guce.yahoo.com/consent':
            response._content = b'<html>authored missing csrf token</html>'
        else:
            raise BaseException('unplanned offline URL')
        return response

def data(session):
    SingletonMeta._instances.clear()
    return YfData(session=session)

class UpstreamSemantics(unittest.TestCase):
    def test_404_without_cookie_returns_true_but_is_not_a_session(self):
        session = Session()
        y = data(session)
        self.assertTrue(y._get_cookie_basic())
        self.assertEqual(len(session.cookies), 0)
        self.assertIsNone(y._cookie)
        self.assertFalse(y._save_cookie_curlCffi())
    def test_cookie_404_can_be_saved_and_crumb_succeeds_without_status_rewrite(self):
        session = Session(cookies=True)
        y = data(session)
        saved = []
        original = cache._CookieCacheManager._Cookie_cache.store
        cache._CookieCacheManager._Cookie_cache.store = lambda *args: saved.append(args)
        try:
            self.assertEqual(y._get_cookie_and_crumb_basic(5), 'fixture-crumb')
            self.assertEqual(len(saved), 2)
            self.assertEqual(saved[0][0], 'curlCffi')
            self.assertIsNone(y._cookie)
            self.assertEqual([u for u, _ in session.calls], ['https://fc.yahoo.com', 'https://fc.yahoo.com', 'https://query1.finance.yahoo.com/v1/test/getcrumb'])
        finally:
            cache._CookieCacheManager._Cookie_cache.store = original
    def test_rate_limited_crumb_allows_uncrumbed_chart_upstream_only(self):
        self.no_crumb(Session(crumb_status=429))
    def test_transient_crumb_allows_uncrumbed_chart_upstream_only(self):
        self.no_crumb(Session(transient=True))
    def no_crumb(self, session):
        y = data(session)
        result = y._make_request('https://query1.finance.yahoo.com/v8/finance/chart/AAPL', session.get, params={'range': '1d', 'interval': '1d'})
        self.assertEqual(result.status_code, 200)
        self.assertNotIn('crumb', session.calls[-1][1])
        self.assertEqual(len(session.calls), 4)
    def test_target_404_uses_alternate_strategy_even_with_zero_network_retries(self):
        session = Session(chart_status=404)
        result = data(session)._make_request('https://query1.finance.yahoo.com/v8/finance/chart/AAPL', session.get)
        self.assertEqual(result.status_code, 404)
        self.assertEqual(sum('/chart/' in u for u, _ in session.calls), 2)
        self.assertTrue(any('guce.yahoo.com' in u for u, _ in session.calls))

if __name__ == '__main__':
    unittest.main()
