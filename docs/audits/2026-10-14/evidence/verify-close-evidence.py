"""Offline audit of retained receipts; never contacts a provider or changes HQ."""
import json, sys, pathlib, datetime
from decimal import Decimal, ROUND_DOWN, ROUND_HALF_EVEN

root = pathlib.Path(__file__).parent
inventory = json.loads(pathlib.Path(sys.argv[1]).read_text())
hq = json.loads(pathlib.Path(sys.argv[2]).read_text())
baseline = json.loads((root / 'inventory-verified.json').read_text())
assert inventory['configuration'] == baseline['configuration']
assert inventory['usage'] == baseline['usage']
assert inventory['journal'][:len(baseline['journal'])] == baseline['journal']
assert inventory['financialEvidence'][:9] == baseline['financialEvidence']
assert inventory['collections'][:9] == baseline['collections']
assert len(inventory['collections']) == 18
assert len({x['request_hash'] for x in inventory['collections']}) == 18
assert all(x['result']['status'] == 'ok' for x in inventory['collections'])
new = inventory['financialEvidence'][9:]
assert len(new) == 9
configuration = baseline['configuration'][0]['configuration']
expected = {x['id'] for x in configuration['instruments']} | {configuration['benchmark']['instrument']['id']}
assert {x['instrument_id'] for x in new} == expected
for x in new:
    q = x['qualification']
    assert q['session'] == '2026-10-14' and q['actions'] == [] and q['reasons'] == []
    assert len(q['prices']) == 2 and {p['field'] for p in q['prices']} == {'regular_open','regular_close'}
    assert all(p['session'] == '2026-10-14' and p['instrumentId'] == x['instrument_id'] and p['quality'] == 'verified' and p['sourceAvailableAt'] is None for p in q['prices'])
assert all(x['contentHashVerified'] and x['qualification']['qualified'] for x in new)
assert all(x['retrieved_at'] >= '2026-10-14T20:05:00.000Z' for x in new)
assert hq['finite']['run'] == 7 and hq['finite']['remainingRun'] == 4
assert hq['finite']['hold'] is None and hq['finite']['active'] == 0
assert not hq['proposals'] and not hq['reviews'] and not hq['submissions']
assert not hq['ledgerSummary']['orders']
portfolio = hq['ledgerSummary']['portfolio']
assert portfolio['cash'] == '100000.000000' and not portfolio['positions']
assert all(portfolio[k] == '0.000000' for k in ['reservedCash','realized','fees','income','receivables','liabilities'])
assert all(n == 0 for n in inventory['askTableCounts'].values()) and not inventory['askUsage']
close = {x['instrument_id']:next(p for p in x['qualification']['prices'] if p['field'] == 'regular_close') for x in new}
micro = Decimal('0.000001')
price = Decimal(close['SPY']['value'])
units = (Decimal('100000') / price).quantize(micro, rounding=ROUND_DOWN)
notional = (units * price).quantize(micro, rounding=ROUND_HALF_EVEN)
residual = Decimal('100000') - notional
result = {
    'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'inventoryAt': inventory['checkedAt'], 'hqAt': hq['checkedAt'],
    'historicalUsageConfigurationJournalSourcesPreserved': True,
    'sourceRequests': 18, 'newQualifiedSources': 9, 'modelRequests': 7,
    'remainingModelFamily': 4, 'portfolioCash': portfolio['cash'],
    'formalDecisionCount': 0, 'portfolioOrderCount': 0, 'askRecordedExecutionCount': 0,
    'closePrices': {k: v['value'] for k,v in close.items()},
    'sourceFinalityQualification': 'Accepted same-session snapshots; provider publication time/finality not independently established',
    'expectedBenchmarkFromRetainedSPYClose': {'price': str(price), 'units': str(units), 'notional': str(notional), 'residualCash': str(residual), 'slippageAndFees': '0 for benchmark under configured convention'},
    'actualBenchmarkAndValuationVerified': False,
}
if hq['ledgerSummary']['benchmarkExecutions']:
    allocation = hq['ledgerSummary']['benchmarkExecutions'][-1]['closeAllocation']
    assert allocation['observationId'] == close['SPY']['id']
    assert Decimal(allocation['units']) == units and Decimal(allocation['cash']) == residual
    result['actualBenchmarkAllocationMatches'] = True
if len(hq['ledgerSummary']['valuations']) > 1:
    record = hq['ledgerSummary']['valuations'][-1]
    snapshot = record['snapshot']
    assert snapshot['session'] == '2026-10-14' and snapshot['asOf'] == '2026-10-14T20:00:00.000Z'
    assert snapshot['quality'] == 'complete' and not snapshot['reasons']
    assert snapshot['equity'] == '100000.000000' and snapshot['benchmarkEquity'] == '100000.000000'
    assert snapshot['totalReturn'] == '0.000000' and snapshot['benchmarkReturn'] == '0.000000'
    assert Decimal(record['benchmark']['positions']['SPY']['quantity']) == units
    assert Decimal(record['benchmark']['positions']['SPY']['basis']) == notional
    assert Decimal(record['benchmark']['cash']) == residual
    result['actualBenchmarkAndValuationVerified'] = True
    result['valuation'] = snapshot
if len(sys.argv) > 3:
    public = json.loads(pathlib.Path(sys.argv[3]).read_text())
    assert public['allCanonicalHashesVerified'] and public['priorPrefixPreserved']
    assert not public['status']['watermark']['sourceGaps'] and public['ask']['state'] == 'disabled'
    snapshot = public['snapshot']['snapshot']
    assert snapshot and snapshot['quality'] == 'complete' and snapshot['session'] == '2026-10-14'
    assert Decimal(snapshot['cash']) == Decimal('100000') and Decimal(snapshot['equity']) == Decimal('100000')
    assert snapshot['holdings'] == [] and Decimal(snapshot['totalReturn']) == 0
    benchmark = snapshot['benchmark']
    assert Decimal(benchmark['units']) == units and Decimal(benchmark['cash']) == residual
    assert Decimal(benchmark['equity']) == Decimal('100000') and Decimal(benchmark['totalReturn']) == 0
    assert Decimal(benchmark['mark']['value']) == price and benchmark['mark']['field'] == 'regular_close'
    transactions = public['transactions']['items']
    assert len(transactions) == 1 and transactions[0]['event']['payload']['effect'] == 'initialization'
    assert transactions[0]['event']['payload']['fill'] is None
    result['publicMatchesRetainedBooks'] = True
    result['publicWatermark'] = public['status']['watermark']
print(json.dumps(result, indent=2))
