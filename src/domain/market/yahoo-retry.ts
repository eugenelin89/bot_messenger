/** The bounded wire and gateway must agree on the accepted Retry-After grammar. */
export function validYahooRetryAfter(value:unknown):value is string {
  return typeof value==='string'&&(
    /^\d{1,10}$/.test(value)&&Number(value)<=315360000||
    value.length===29&&new Date(value).toUTCString()===value
  );
}
