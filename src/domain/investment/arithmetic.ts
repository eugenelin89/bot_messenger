/** USD and shares use six decimals. No Number participates in financial postings. */
export const SCALE = 1_000_000n;
export const MAX = 999_999_999_999_999_999n;
const INTERMEDIATE_MAX = 10n ** 72n - 1n;
export class SimulationError extends Error {
  constructor(readonly code: string) { super(code); this.name = 'SimulationError'; }
}
export function ensure(condition: unknown, code: string): asserts condition {
  if (!condition) throw new SimulationError(code);
}
export function checked(n: bigint): bigint { ensure(n >= -MAX && n <= MAX, 'numeric_overflow'); return n; }
export function intermediate(n: bigint): bigint { ensure(n >= -INTERMEDIATE_MAX && n <= INTERMEDIATE_MAX, 'intermediate_overflow'); return n; }
export function decimal(value: string): bigint {
  ensure(typeof value === 'string' && /^-?(0|[1-9][0-9]{0,11})(\.[0-9]{1,6})?$/.test(value), 'invalid_decimal');
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = value.replace(/^-/, '').split('.');
  return checked((negative ? -1n : 1n) * (BigInt(whole!) * SCALE + BigInt(fraction.padEnd(6, '0'))));
}
export function positive(value: string): bigint { const n = decimal(value); ensure(n > 0n, 'positive_required'); return n; }
export function nonnegative(value: string): bigint { const n = decimal(value); ensure(n >= 0n, 'negative_amount'); return n; }
export function wholeShares(value: string): bigint { const n = positive(value); ensure(n % SCALE === 0n, 'whole_shares_required'); return n; }
export function format(n: bigint): string {
  checked(n); const a = n < 0n ? -n : n;
  return `${n < 0n ? '-' : ''}${a / SCALE}.${(a % SCALE).toString().padStart(6, '0')}`;
}
export function divideEven(n: bigint, d: bigint): bigint {
  intermediate(n); intermediate(d); ensure(d > 0n, 'positive_denominator_required');
  const sign = n < 0n ? -1n : 1n, a = n < 0n ? -n : n, q = a / d, r = a % d;
  return intermediate(sign * (q + (r * 2n > d || (r * 2n === d && q % 2n !== 0n) ? 1n : 0n)));
}
export function multiply(a: bigint, b: bigint): bigint { return checked(divideEven(intermediate(a * b), SCALE)); }
export function ratio(n: bigint, d: bigint): bigint { return checked(divideEven(intermediate(n * SCALE), d)); }
export function add(a: bigint, b: bigint): bigint { return checked(a + b); }
export interface Rational { numerator: string; denominator: string }
export function rational(n: bigint, d: bigint): Rational {
  intermediate(n); intermediate(d); ensure(d > 0n, 'positive_denominator_required');
  let a = n < 0n ? -n : n, b = d;
  while (b) { const remainder = a % b; a = b; b = remainder; }
  return { numerator: (n / (a || 1n)).toString(), denominator: (d / (a || 1n)).toString() };
}
export function rounded(n: bigint, d: bigint): { value: bigint; residual: Rational } {
  const value = checked(divideEven(n, d));
  return { value, residual: rational(intermediate(value * d - n), d) };
}
