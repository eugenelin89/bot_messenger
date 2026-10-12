import type { YahooQuery, YahooResponse } from './financial.js';

/** Closed response grammar, not a heuristic that treats arbitrary 404 pages as permission. */
export function isCookieBootstrap(query: YahooQuery): boolean {
  return query.method === 'GET' && ['https://fc.yahoo.com', 'https://fc.yahoo.com/'].includes(query.url) && Object.keys(query.params).length === 0;
}
export function benignCookie404(response: YahooResponse): boolean {
  return response.status === 404 && /^text\/plain(?:;\s*charset=utf-8)?$/i.test(response.contentType) &&
    ['Not Found', 'Not Found\n', 'Not Found\r\n', '404 Not Found', '404 Not Found\n', '404 Not Found\r\n'].includes(response.body) && response.retryAfter === null;
}
export function acceptedCookie404(query: YahooQuery, response: YahooResponse): boolean {
  return isCookieBootstrap(query) && benignCookie404(response) && response.bootstrapCookiePresent === true && !response.bootstrapRejected;
}
export function validCrumb(body: string): boolean {
  return body.trim() === body && /^[A-Za-z0-9._~+\/-]{1,256}$/.test(body) && !/consent|captcha|login|signin|denied|forbidden|unauthori[sz]ed|too.?many.?requests/i.test(body);
}
