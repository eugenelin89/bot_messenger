import { add, checked, decimal, ensure, format, multiply, nonnegative, positive, rational, rounded, SCALE } from './arithmetic.js';
import type { Book, Configuration, Fill, Observation, Posting, State } from './types.js';
export const emptyBook = (): Book => ({ cash:'0.000000',reservedCash:'0.000000',realized:'0.000000',fees:'0.000000',income:'0.000000',receivables:'0.000000',liabilities:'0.000000',positions:{} });
export function position(book: Book, id: string) { return book.positions[id] ??= { quantity:'0.000000',basis:'0.000000',reserved:'0.000000' }; }
export function posting(state: State, entries: Posting[], bookId: 'portfolio' | 'benchmark', account: Posting['account'], amount: bigint, instrumentId: string | null = null): void {
  if (!amount) return;
  checked(amount); const book = state[bookId];
  if (account === 'quantity' || account === 'basis') {
    ensure(instrumentId, 'posting_instrument_required'); const p = position(book, instrumentId);
    p[account] = format(add(decimal(p[account]), amount));
  } else if (account !== 'capital') book[account] = format(add(decimal(book[account]), amount));
  entries.push({ book:bookId, account, instrumentId, amount:format(amount) });
}
export function assertBook(book: Book): void {
  const cash = nonnegative(book.cash), reserved = nonnegative(book.reservedCash);
  ensure(cash >= reserved, 'cash_reservation_inconsistent');
  for (const value of [book.fees,book.income,book.receivables,book.liabilities]) nonnegative(value);
  decimal(book.realized);
  for (const p of Object.values(book.positions)) {
    const q = nonnegative(p.quantity); nonnegative(p.basis); ensure(q >= nonnegative(p.reserved), 'share_reservation_inconsistent');
  }
}
export function assertBalanced(entries: Posting[]): void {
  for (const book of ['portfolio','benchmark'] as const) {
    let balance = 0n;
    for (const e of entries.filter(e => e.book === book)) {
      // Fees are informational: buy fees are in basis; sell fees in realized P&L.
      if (e.account === 'quantity' || e.account === 'fees') continue;
      balance += decimal(e.amount) * (['cash','basis','receivables'].includes(e.account) ? 1n : -1n);
    }
    ensure(balance === 0n, 'unbalanced_journal');
  }
}
export function trade(state: State, c: Configuration, entries: Posting[], bookId: 'portfolio' | 'benchmark', instrumentId: string, side: 'BUY' | 'SELL', quantity: bigint, observation: Observation, orderId: string | null): Fill {
  const book = state[bookId], p = position(book, instrumentId), fee = bookId === 'portfolio' ? nonnegative(c.commission) : 0n;
  const price = rounded(positive(observation.value) * (10_000n + (side === 'BUY' ? 1n : -1n) * BigInt(bookId === 'portfolio' ? c.slippageBps : 0)), 10_000n);
  ensure(price.value > 0n, 'unrepresentable_price');
  const notional = rounded(quantity * price.value, SCALE); ensure(quantity > 0n && notional.value > 0n, 'unrepresentable_trade');
  let basis = {value:0n,residual:rational(0n,1n)};
  if (side === 'BUY') {
    ensure(decimal(book.cash) - decimal(book.reservedCash) >= notional.value + fee, 'insufficient_cash');
    posting(state,entries,bookId,'cash',-notional.value-fee);
    posting(state,entries,bookId,'quantity',quantity,instrumentId);
    posting(state,entries,bookId,'basis',notional.value+fee,instrumentId);
  } else {
    const oldQuantity = decimal(p.quantity), oldBasis = decimal(p.basis);
    ensure(oldQuantity - decimal(p.reserved) >= quantity, 'insufficient_shares');
    ensure(notional.value >= fee, 'fee_exceeds_proceeds');
    basis = quantity === oldQuantity ? {value:oldBasis,residual:rational(0n,1n)} : rounded(oldBasis * quantity, oldQuantity);
    posting(state,entries,bookId,'cash',notional.value-fee);
    posting(state,entries,bookId,'quantity',-quantity,instrumentId);
    posting(state,entries,bookId,'basis',-basis.value,instrumentId);
    posting(state,entries,bookId,'realized',notional.value-fee-basis.value);
  }
  posting(state,entries,bookId,'fees',fee);
  state.inventoryHistory.push({at:observation.marketAt,book:bookId,instrumentId,quantity:p.quantity});
  state.financialTimes.push({instrumentId,at:observation.marketAt,kind:'fill'});
  return { orderId,book:bookId,observationId:observation.id,instrumentId,side,quantity:format(quantity),price:format(price.value),fee:format(fee),releasedBasis:format(basis.value),effectiveAt:observation.marketAt,priceResidual:price.residual,notionalResidual:notional.residual,basisResidual:basis.residual };
}
export function reserve(state: State, orderId: string): void {
  const o = state.orders[orderId]!;
  const cash = decimal(o.reservedCash), shares = decimal(o.reservedShares), p = position(state.portfolio,o.instrumentId);
  state.portfolio.reservedCash = format(add(decimal(state.portfolio.reservedCash),cash));
  p.reserved = format(add(decimal(p.reserved),shares));
}
export function release(state: State, orderId: string): void {
  const o = state.orders[orderId]!, p = position(state.portfolio,o.instrumentId);
  state.portfolio.reservedCash = format(decimal(state.portfolio.reservedCash)-decimal(o.reservedCash));
  p.reserved = format(decimal(p.reserved)-decimal(o.reservedShares));
  o.reservedCash = '0.000000'; o.reservedShares = '0.000000';
}
export function guardedCost(quantity: bigint, guard: bigint, fee: bigint): bigint { return add(multiply(quantity,guard),fee); }
