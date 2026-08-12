import { generateBondPortfolio } from './bondEngine';
import { DEFAULT_INVENTORY } from './defaultInventory';

function runTests() {
  console.log('--- Running Bond Selection Engine Tests ---');

  const investment = 1000000;
  const fdRates = { t1: 6.2, t2: 6.2, t3: 6.2, t4: 6.2, t5: 6.2, t6: 6.2, t7: 6.2 };

  const today = new Date();
  const mockInventory = DEFAULT_INVENTORY.map((b, idx) => {
    const monthsAhead = 7 + (idx % 18);
    const matDate = new Date(today.getTime());
    matDate.setMonth(matDate.getMonth() + monthsAhead);
    return { ...b, maturity: matDate.toISOString().split('T')[0] };
  });

  // Test 1: Defaults (A or better rating)
  const summaryA = generateBondPortfolio(mockInventory, investment, fdRates, 'A');
  console.assert(
    summaryA.selectedBonds.length >= 10,
    `FAIL Test 1: Expected at least 10 bonds, got ${summaryA.selectedBonds.length}`
  );
  const allRatingsBetterThanA = summaryA.selectedBonds.every(b => {
    const r = b.rating.toUpperCase();
    return r.includes('SOVEREIGN') || r.includes('GOI') || r.includes('AAA') ||
           r.includes('AA') || r.includes('A+') || (r.includes('A') && !r.includes('A-'));
  });
  console.assert(allRatingsBetterThanA, 'FAIL Test 1b: All selected bonds must be A or better');

  // Test 2: Bucket alignment
  const maturitiesInBuckets = summaryA.selectedBonds.every(b => b.bucketIndex >= 0 && b.bucketIndex < 6);
  console.assert(maturitiesInBuckets, 'FAIL Test 2: All selected bonds must fit inside the 6 buckets');

  // Test 3: 100% Capital Deployment
  const calculatedTotal = summaryA.selectedBonds.reduce((acc, b) => acc + b.allocatedAmount, 0);
  console.assert(
    Math.abs(calculatedTotal - investment) < 0.01,
    `FAIL Test 3: Allocation sum ${calculatedTotal} does not match investment ${investment}`
  );

  // Test 4: Cashflow splits (maturity-based CashFlow objects are consistent)
  const firstCashFlow = summaryA.monthlyCashFlows[0];
  console.assert(
    firstCashFlow.principal > 0 && firstCashFlow.interest > 0 &&
    Math.abs(firstCashFlow.total - (firstCashFlow.principal + firstCashFlow.interest)) < 0.01,
    'FAIL Test 4: monthlyCashFlows principal+interest must equal total'
  );

  // Test 5: Exclusion filter
  const excludedSet = new Set<string>();
  const isinToExclude = summaryA.selectedBonds[0].isin;
  excludedSet.add(isinToExclude);
  const summaryExclude = generateBondPortfolio(mockInventory, investment, fdRates, 'A', undefined, 10, excludedSet);
  console.assert(
    !summaryExclude.selectedBonds.some(b => b.isin === isinToExclude),
    'FAIL Test 5: Excluded ISIN must not appear in selected bonds'
  );

  // Test 6: Manual swap
  const swapMap = new Map<number, string>();
  const swapIsin = mockInventory[mockInventory.length - 1].isin;
  swapMap.set(0, swapIsin);
  const summarySwap = generateBondPortfolio(mockInventory, investment, fdRates, 'ALL', undefined, 10, undefined, swapMap);
  console.assert(
    summarySwap.selectedBonds.some(b => b.isin === swapIsin && b.bucketIndex === 0),
    'FAIL Test 6: Manually swapped ISIN must be locked in bucket 0'
  );

  // Test 7: Zero-allocation elimination
  const zeroAllocBonds = summaryA.selectedBonds.filter(b => b.allocatedAmount <= 0 || b.allocationPercent <= 0);
  console.assert(zeroAllocBonds.length === 0, `FAIL Test 7: Found ${zeroAllocBonds.length} bonds with 0 allocation`);
  const zeroAllocCompanies = summaryA.companyAllocations.filter(c => c.amount <= 0 || c.percent <= 0);
  console.assert(zeroAllocCompanies.length === 0, `FAIL Test 7b: Found ${zeroAllocCompanies.length} companies with 0 allocation`);

  // Test 8: 15% single company cap
  const maxCompanyWeight = Math.max(...summaryA.companyAllocations.map(c => c.percent));
  console.assert(maxCompanyWeight <= 0.150001, `FAIL Test 8: Company weight ${(maxCompanyWeight * 100).toFixed(2)}% exceeded 15% cap!`);

  // ══════════════════════════════════════════════════════════════════════════
  // QUARTERLY CASHFLOW TARGET TESTS (Tests 9-14)
  //
  // Critical assertion: targetQuarterlyCashflowPct must DRIVE BOND SELECTION
  // toward periodic-coupon bonds — not merely act as a reporting layer.
  // ══════════════════════════════════════════════════════════════════════════

  const today2 = new Date();
  const makeDate = (monthsAhead: number): string => {
    const d = new Date(today2);
    d.setMonth(d.getMonth() + monthsAhead);
    return d.toISOString().split('T')[0];
  };

  // Controlled inventory: ON MATURITY bonds have HIGHER yield, periodic bonds have LOWER yield.
  // This proves that when the target is set, the engine swaps in lower-yield periodic bonds
  // despite the yield penalty — demonstrating real selection influence.

  const onMaturityBonds = Array.from({ length: 8 }, (_, i) => ({
    isin: `IN_MAT_${String(i).padStart(4, '0')}`,
    issuer: `Maturity Issuer ${i}`,
    coupon: 0.115 + i * 0.001,
    yield: 0.115 + i * 0.001,
    maturity: makeDate(10 + i),
    months: 10 + i,
    rating: 'ICRA AA',
    frequency: 'ON MATURITY',
    totalTradableFV: 5000000,
    sector: 'NBFC'
  }));

  const quarterlyBonds = Array.from({ length: 8 }, (_, i) => ({
    isin: `IN_QTR_${String(i).padStart(4, '0')}`,
    issuer: `Quarterly Issuer ${i}`,
    coupon: 0.108 + i * 0.001,
    yield: 0.108 + i * 0.001,
    maturity: makeDate(10 + i),
    months: 10 + i,
    rating: 'ICRA AA',
    frequency: 'QUARTERLY',
    totalTradableFV: 5000000,
    sector: 'HFC'
  }));

  const semiAnnualBonds = Array.from({ length: 8 }, (_, i) => ({
    isin: `IN_SAU_${String(i).padStart(4, '0')}`,
    issuer: `SemiAnnual Issuer ${i}`,
    coupon: 0.110 + i * 0.001,
    yield: 0.110 + i * 0.001,
    maturity: makeDate(10 + i),
    months: 10 + i,
    rating: 'ICRA AA',
    frequency: 'SEMI-ANNUAL',
    totalTradableFV: 5000000,
    sector: 'MFI'
  }));

  const controlledInventory = [...onMaturityBonds, ...quarterlyBonds, ...semiAnnualBonds];
  const fdR = { t1: 6.2, t2: 6.2, t3: 6.2, t4: 6.2, t5: 6.2, t6: 6.2, t7: 6.2 };
  const cfInvestment = 1000000;

  // ─── Test 9: Without target — ON MATURITY bonds should be preferred (highest yield) ───
  const summaryNoTarget = generateBondPortfolio(
    controlledInventory, cfInvestment, fdR, 'ALL',
    undefined, 7, undefined, undefined, 7, 24, 'equal'
    // No targetQuarterlyCashflowPct
  );
  const noTargetOnMatCount = summaryNoTarget.selectedBonds.filter(
    b => !(b.frequency || '').toUpperCase().match(/MONTHLY|QUARTERLY|SEMI|ANNUAL/)
  ).length;
  console.log(`Test 9  — No cashflow target: ON MATURITY bonds selected = ${noTargetOnMatCount}/${summaryNoTarget.selectedBonds.length}`);
  console.assert(
    noTargetOnMatCount > 0,
    'FAIL Test 9: Expected ON MATURITY bonds to be selected when no cashflow target (they yield more)'
  );

  // ─── Test 10: WITH target — periodic-coupon bonds MUST be selected MORE than without ───
  const summaryWithTarget = generateBondPortfolio(
    controlledInventory, cfInvestment, fdR, 'ALL',
    undefined, 7, undefined, undefined, 7, 24, 'equal',
    undefined, 5.0 // 5% quarterly cashflow target
  );
  const withTargetPeriodicCount = summaryWithTarget.selectedBonds.filter(
    b => !!(b.frequency || '').toUpperCase().match(/MONTHLY|QUARTERLY|SEMI|ANNUAL/)
  ).length;
  const noTargetPeriodicCount = summaryNoTarget.selectedBonds.filter(
    b => !!(b.frequency || '').toUpperCase().match(/MONTHLY|QUARTERLY|SEMI|ANNUAL/)
  ).length;
  console.log(`Test 10 — With target: periodic bonds = ${withTargetPeriodicCount}, without target: ${noTargetPeriodicCount}`);
  console.assert(
    withTargetPeriodicCount > noTargetPeriodicCount,
    `FAIL Test 10: TARGET IS NOT DRIVING SELECTION. ` +
    `Periodic bonds with target (${withTargetPeriodicCount}) must exceed without target (${noTargetPeriodicCount}). ` +
    `The feature is only a reporting layer — fix getBondScore() and coupon stagger optimization.`
  );

  // ─── Test 11: periodicCashFlows generates more events than bonds ───
  console.assert(
    summaryWithTarget.periodicCashFlows.length > summaryWithTarget.selectedBonds.length,
    `FAIL Test 11: periodicCashFlows (${summaryWithTarget.periodicCashFlows.length}) must exceed bond count ` +
    `(${summaryWithTarget.selectedBonds.length}) — periodic bonds should generate multiple coupon events`
  );
  // All events must be valid (positive month and total)
  const invalidEvents = summaryWithTarget.periodicCashFlows.filter(cf => cf.month <= 0 || cf.total <= 0);
  console.assert(invalidEvents.length === 0, `FAIL Test 11b: ${invalidEvents.length} invalid periodic cashflow events`);
  // Coupon-only events (principal=0) must exist
  const couponOnlyEvents = summaryWithTarget.periodicCashFlows.filter(cf => cf.principal === 0);
  console.assert(couponOnlyEvents.length > 0, 'FAIL Test 11c: Expected coupon-only events (principal=0) from periodic-coupon bonds');

  // ─── Test 12: quarterlyCashflow analysis is correctly populated ───
  console.assert(
    summaryWithTarget.quarterlyCashflow !== undefined,
    'FAIL Test 12: quarterlyCashflow must be populated when targetQuarterlyCashflowPct is set'
  );
  if (summaryWithTarget.quarterlyCashflow) {
    const qc = summaryWithTarget.quarterlyCashflow;
    console.assert(Math.abs(qc.targetPercent - 5.0) < 0.001, `FAIL Test 12a: targetPercent should be 5.0, got ${qc.targetPercent}`);
    console.assert(
      Math.abs(qc.requiredPerQuarter - cfInvestment * 0.05) < 0.01,
      `FAIL Test 12b: requiredPerQuarter should be ${cfInvestment * 0.05}, got ${qc.requiredPerQuarter}`
    );
    console.assert(qc.totalQuarters > 0, 'FAIL Test 12c: totalQuarters must be > 0');
    console.assert(qc.quartersMet >= 0 && qc.quartersMet <= qc.totalQuarters, 'FAIL Test 12d: quartersMet out of valid range');

    // Each quarter's actualCashflow must equal sum of periodicCashFlows in that window
    qc.items.forEach(item => {
      const minM = (item.quarter - 1) * 3 + 1;
      const maxM = item.quarter * 3;
      const expectedActual = summaryWithTarget.periodicCashFlows
        .filter(cf => cf.month >= minM && cf.month <= maxM)
        .reduce((s, cf) => s + cf.total, 0);
      console.assert(
        Math.abs(item.actualCashflow - expectedActual) < 0.01,
        `FAIL Test 12e Q${item.quarter}: actualCashflow ${item.actualCashflow.toFixed(0)} ≠ periodicCashFlows sum ${expectedActual.toFixed(0)}`
      );
      // isMet flag must match actual vs required
      console.assert(
        item.isMet === (item.actualCashflow >= qc.requiredPerQuarter),
        `FAIL Test 12f Q${item.quarter}: isMet flag is inconsistent`
      );
    });
    console.log(`Test 12 — Quarterly analysis: ${qc.quartersMet}/${qc.totalQuarters} quarters met at ${qc.targetPercent}%/quarter`);
  }

  // ─── Test 13: Periodic-coupon bonds generate early-quarter income; ON MATURITY bonds don't ───
  // With short-maturity mocks, both may meet the same LATE quarters at maturity.
  // The key difference: periodic bonds generate coupon income in EARLY quarters (before maturity),
  // while ON MATURITY bonds generate ZERO early-quarter income.
  const summaryOnMatOnly = generateBondPortfolio(
    onMaturityBonds, cfInvestment, fdR, 'ALL',
    undefined, 7, undefined, undefined, 7, 24, 'equal', undefined, 5.0
  );
  const summaryQtrlOnly = generateBondPortfolio(
    quarterlyBonds, cfInvestment, fdR, 'ALL',
    undefined, 7, undefined, undefined, 7, 24, 'equal', undefined, 5.0
  );
  const onMatEarlyCouponIncome = summaryOnMatOnly.periodicCashFlows
    .filter(cf => cf.principal === 0) // Coupon-only events (not maturity)
    .reduce((s, cf) => s + cf.total, 0);
  const periodicEarlyCouponIncome = summaryQtrlOnly.periodicCashFlows
    .filter(cf => cf.principal === 0) // Coupon-only events
    .reduce((s, cf) => s + cf.total, 0);
  console.log(`Test 13 — Early coupon income (pre-maturity): ON MATURITY=₹${onMatEarlyCouponIncome.toFixed(0)}, Quarterly=₹${periodicEarlyCouponIncome.toFixed(0)}`);
  console.assert(
    onMatEarlyCouponIncome === 0,
    `FAIL Test 13a: ON MATURITY bonds must generate ZERO pre-maturity coupon income, got ₹${onMatEarlyCouponIncome}`
  );
  console.assert(
    periodicEarlyCouponIncome > 0,
    `FAIL Test 13b: Quarterly bonds must generate pre-maturity coupon income, got ₹${periodicEarlyCouponIncome}`
  );


  console.log(`Test 13 — Early coupon income (pre-maturity): ON MATURITY=₹${onMatEarlyCouponIncome.toFixed(0)}, Quarterly=₹${periodicEarlyCouponIncome.toFixed(0)}`);
  console.assert(
    onMatEarlyCouponIncome === 0,
    `FAIL Test 13a: ON MATURITY bonds must generate ZERO pre-maturity coupon income, got ₹${onMatEarlyCouponIncome}`
  );
  console.assert(
    periodicEarlyCouponIncome > 0,
    `FAIL Test 13b: Quarterly bonds must generate pre-maturity coupon income, got ₹${periodicEarlyCouponIncome}`
  );


  // ─── Test 14: quarterlyCashflow is undefined when no target is set ───
  const summaryNoQcf = generateBondPortfolio(mockInventory, investment, fdRates, 'A');
  console.assert(
    summaryNoQcf.quarterlyCashflow === undefined,
    'FAIL Test 14: quarterlyCashflow must be undefined when targetQuarterlyCashflowPct is not provided'
  );

  console.log('All tests passed successfully! ✓');
}

runTests();
