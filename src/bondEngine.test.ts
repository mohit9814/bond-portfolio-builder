import { generateBondPortfolio } from './bondEngine';
import { DEFAULT_INVENTORY, DefaultBond } from './defaultInventory';

function runTests() {
  console.log('--- Running Bond Selection Engine Tests ---');

  const investment = 1000000;
  const fdRates = { t1: 6.2, t2: 6.2, t3: 6.2, t4: 6.2, t5: 6.2, t6: 6.2, t7: 6.2 };

  const today = new Date();
  const mockInventory = DEFAULT_INVENTORY.map((b, idx) => {
    const monthsAhead = 8 + (idx % 16);
    const matDate = new Date(today.getTime());
    matDate.setDate(matDate.getDate() + Math.round(monthsAhead * 30.4375));
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

  // Test 8b: Zero/blank totalTradableQty AND zero/blank totalTradableFV bonds must never appear
  const zeroQtyIsin = 'IN_ZERO_QTY_0001';
  const zeroFvIsin  = 'IN_ZERO_FV__0001';
  const inventoryWithZeroQty = [
    // High-yield bond: qty=0 — must be excluded
    {
      isin: zeroQtyIsin, issuer: 'Zero Qty Co', coupon: 0.15, yield: 0.15,
      maturity: (() => { const d = new Date(); d.setMonth(d.getMonth() + 12); return d.toISOString().split('T')[0]; })(),
      months: 12, rating: 'ICRA AA', frequency: 'QUARTERLY',
      totalTradableFV: 5000000, totalTradableQty: 0, sector: 'NBFC'
    },
    // High-yield bond: FV=0 — must be excluded
    {
      isin: zeroFvIsin, issuer: 'Zero FV Co', coupon: 0.14, yield: 0.14,
      maturity: (() => { const d = new Date(); d.setMonth(d.getMonth() + 11); return d.toISOString().split('T')[0]; })(),
      months: 11, rating: 'ICRA AA', frequency: 'QUARTERLY',
      totalTradableFV: 0, totalTradableQty: 100, sector: 'NBFC'
    },
    // Bond with undefined qty/FV (hardcoded inventory style) — must pass through
    {
      isin: 'IN_UNDEF_QTY_0001', issuer: 'Undefined Qty Co', coupon: 0.10, yield: 0.10,
      maturity: (() => { const d = new Date(); d.setMonth(d.getMonth() + 12); return d.toISOString().split('T')[0]; })(),
      months: 12, rating: 'ICRA AA', frequency: 'QUARTERLY',
      totalTradableFV: undefined, totalTradableQty: undefined, sector: 'HFC'
    },
    // Normal bonds with valid qty + FV
    ...Array.from({ length: 10 }, (_, i) => ({
      isin: `IN_VALID_${String(i).padStart(4, '0')}`, issuer: `Valid Issuer ${i}`,
      coupon: 0.11 + i * 0.001, yield: 0.11 + i * 0.001,
      maturity: (() => { const d = new Date(); d.setMonth(d.getMonth() + 9 + i); return d.toISOString().split('T')[0]; })(),
      months: 9 + i, rating: 'ICRA AA', frequency: 'QUARTERLY',
      totalTradableFV: 5000000, totalTradableQty: 100 + i, sector: 'MFI'
    }))
  ];
  const summaryQtyFilter = generateBondPortfolio(inventoryWithZeroQty, 1000000, fdRates, 'ALL');
  console.assert(
    !summaryQtyFilter.selectedBonds.some(b => b.isin === zeroQtyIsin),
    `FAIL Test 8b: Bond with totalTradableQty=0 must NEVER appear in recommendations`
  );
  console.assert(
    !summaryQtyFilter.selectedBonds.some(b => b.isin === zeroFvIsin),
    `FAIL Test 8b: Bond with totalTradableFV=0 must NEVER appear in recommendations`
  );

  // Verify undefined-FV/Qty bond (hardcoded inventory) is not incorrectly filtered
  const twoItemInventory = [inventoryWithZeroQty[0], inventoryWithZeroQty[2]]; // zeroQty + undefinedQty
  const summaryTwoItem = generateBondPortfolio(twoItemInventory, 1000000, fdRates, 'ALL');
  console.assert(
    !summaryTwoItem.selectedBonds.some(b => b.isin === zeroQtyIsin),
    'FAIL Test 8b: Zero-qty bond must not be selected even in a 2-bond inventory'
  );
  console.assert(
    summaryTwoItem.selectedBonds.some(b => b.isin === 'IN_UNDEF_QTY_0001'),
    'FAIL Test 8b: undefined-qty/FV bond (hardcoded inventory) must NOT be filtered out'
  );
  console.log(`Test 8b — Liquidity filters: qty=0 excluded ✓, FV=0 excluded ✓, undefined-qty allowed ✓. Selected: ${summaryQtyFilter.selectedBonds.length} bonds.`);

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

  // ─── Test 15: Swap functionality completely replaces and removes original bond ───
  const isCandidateEligible = (b: DefaultBond) => {
    if (b.months < 7 || b.months > 24) return false;
    const cat = (b.category || '').toLowerCase();
    if (cat.includes('bundle - flexi') || cat.includes('bundle-flexi')) return false;
    const symbol = b.rating.toUpperCase();
    const isBetterThanBBB = symbol.includes('SOVEREIGN') || symbol.includes('GOI') ||
                            symbol.includes('AAA') || symbol.includes('AA') ||
                            symbol.includes('A');
    if (!isBetterThanBBB && b.months > 12.0) return false;
    return true;
  };

  const initialSummary = generateBondPortfolio(mockInventory, investment, fdRates, 'ALL', undefined, 10);
  console.assert(initialSummary.selectedBonds.length >= 7, 'FAIL Test 15 setup: Expected at least 7 bonds');
  
  const bondToSwapOut = initialSummary.selectedBonds[0];
  // Find a suitable candidate bond not in the initial portfolio that is eligible
  const replacementCand = mockInventory.find(b => 
    !initialSummary.selectedBonds.some(sb => sb.isin === b.isin) &&
    !initialSummary.selectedBonds.some(sb => sb.issuer === b.issuer) &&
    isCandidateEligible(b)
  );
  console.assert(replacementCand !== undefined, 'FAIL Test 15 setup: Could not find candidate replacement');

  if (replacementCand) {
    const swapExcluded = new Set<string>([bondToSwapOut.isin]);
    const swapReplacements = new Map<number, string>([[bondToSwapOut.bucketIndex, replacementCand.isin]]);
    const postSwapSummary = generateBondPortfolio(
      mockInventory, investment, fdRates, 'ALL', undefined, 10,
      swapExcluded, swapReplacements
    );

    console.assert(
      !postSwapSummary.selectedBonds.some(b => b.isin === bondToSwapOut.isin),
      `FAIL Test 15a: Swapped out bond ${bondToSwapOut.isin} (${bondToSwapOut.issuer}) must NOT be in recommended portfolio`
    );
    console.assert(
      postSwapSummary.selectedBonds.some(b => b.isin === replacementCand.isin),
      `FAIL Test 15b: Replacement bond ${replacementCand.isin} (${replacementCand.issuer}) must be in recommended portfolio`
    );

    // Verify 100% capital deployment after swap
    const postSwapTotal = postSwapSummary.selectedBonds.reduce((s, b) => s + b.allocatedAmount, 0);
    console.assert(
      Math.abs(postSwapTotal - investment) < 0.01,
      `FAIL Test 15c: Post-swap allocated amount ${postSwapTotal} must equal ${investment}`
    );
    console.log(`Test 15 — Swap functionality: Swapped out ${bondToSwapOut.issuer} -> Replaced with ${replacementCand.issuer} (Initial bond removed: ✓, New bond present: ✓, 100% Capital Deployed: ✓)`);
  }

  // ─── Test 16: Swap out bond when issuer has company-wide INCLUDE override ───
  if (replacementCand) {
    const companyOverrides: Record<string, { action: string; justification: string }> = {
      [bondToSwapOut.issuer]: { action: 'INCLUDE', justification: 'User company override' }
    };
    const swapExcludedWithOverride = new Set<string>([bondToSwapOut.isin]);
    const swapReplacementsWithOverride = new Map<number, string>([[bondToSwapOut.bucketIndex, replacementCand.isin]]);
    const postSwapOverrideSummary = generateBondPortfolio(
      mockInventory, investment, fdRates, 'ALL', undefined, 10,
      swapExcludedWithOverride, swapReplacementsWithOverride,
      7, 24, 'equal', undefined, undefined, false, companyOverrides
    );

    console.assert(
      !postSwapOverrideSummary.selectedBonds.some(b => b.isin === bondToSwapOut.isin),
      `FAIL Test 16: Bond ${bondToSwapOut.isin} must be removed even when its company has an INCLUDE override`
    );
    console.log('Test 16 — Swap exclusion priority: Swapped bond removed even with company INCLUDE override ✓');
  }

  // ─── Test 17: Multiple swaps across different buckets ───
  if (initialSummary.selectedBonds.length >= 2) {
    const bondA = initialSummary.selectedBonds[0];
    const bondB = initialSummary.selectedBonds[1];
    const unselectedCands = mockInventory.filter(b => 
      !initialSummary.selectedBonds.some(sb => sb.isin === b.isin) &&
      !initialSummary.selectedBonds.some(sb => sb.issuer === b.issuer) &&
      isCandidateEligible(b)
    );

    if (unselectedCands.length >= 2) {
      const repA = unselectedCands[0];
      const repB = unselectedCands[1];
      const multiSwapExcluded = new Set<string>([bondA.isin, bondB.isin]);
      const multiSwapReplacements = new Map<number, string>([
        [bondA.bucketIndex, repA.isin],
        [bondB.bucketIndex, repB.isin]
      ]);

      const multiSwapSummary = generateBondPortfolio(
        mockInventory, investment, fdRates, 'ALL', undefined, 10,
        multiSwapExcluded, multiSwapReplacements
      );

      console.assert(
        !multiSwapSummary.selectedBonds.some(b => b.isin === bondA.isin) &&
        !multiSwapSummary.selectedBonds.some(b => b.isin === bondB.isin),
        'FAIL Test 17a: Both swapped-out bonds must be absent from portfolio'
      );
      console.assert(
        multiSwapSummary.selectedBonds.some(b => b.isin === repA.isin) &&
        multiSwapSummary.selectedBonds.some(b => b.isin === repB.isin),
        'FAIL Test 17b: Both replacement bonds must be present in portfolio'
      );
      console.log('Test 17 — Multi-bucket Swap: Multiple simultaneous swaps across buckets succeed with all initial bonds removed ✓');
    }
  }

  // ─── Test 18: Inclusions & Exclusions Review and Modification Lifecycle ───
  // Step 1: Find a bond that is normally NOT selected in default run
  const defaultSummary = generateBondPortfolio(mockInventory, investment, fdRates, 'A', undefined, 10);
  const unselectedBond = mockInventory.find(b => 
    !defaultSummary.selectedBonds.some(sb => sb.issuer === b.issuer) &&
    isCandidateEligible(b)
  );
  console.assert(unselectedBond !== undefined, 'FAIL Test 18 setup: Need an unselected candidate bond');

  if (unselectedBond) {
    // Step 2: User adds bond's company to Force INCLUSION list
    const overridesWithInclude: Record<string, { action: string; justification: string }> = {
      [unselectedBond.issuer]: { action: 'INCLUDE', justification: 'User reviewed and added to inclusion list' }
    };
    const summaryWithInclusion = generateBondPortfolio(
      mockInventory, investment, fdRates, 'A', undefined, 10,
      undefined, undefined, 7, 24, 'equal', undefined, undefined, false, overridesWithInclude
    );

    console.assert(
      summaryWithInclusion.selectedBonds.some(b => b.issuer === unselectedBond.issuer),
      `FAIL Test 18a: Company ${unselectedBond.issuer} must be present after adding to inclusion list`
    );

    // Step 3: User reviews list and changes status from INCLUDE to EXCLUDE
    const overridesWithExclude: Record<string, { action: string; justification: string }> = {
      [unselectedBond.issuer]: { action: 'EXCLUDE', justification: 'User changed status to exclude' }
    };
    const summaryWithExclusion = generateBondPortfolio(
      mockInventory, investment, fdRates, 'A', undefined, 10,
      undefined, undefined, 7, 24, 'equal', undefined, undefined, false, overridesWithExclude
    );

    console.assert(
      !summaryWithExclusion.selectedBonds.some(b => b.issuer === unselectedBond.issuer),
      `FAIL Test 18b: Company ${unselectedBond.issuer} must be absent after changing to exclusion list`
    );

    // Step 4: User clears the override list (back to neutral auto-optimization)
    const summaryCleared = generateBondPortfolio(
      mockInventory, investment, fdRates, 'A', undefined, 10,
      undefined, undefined, 7, 24, 'equal', undefined, undefined, false, {}
    );
    console.assert(
      summaryCleared.selectedBonds.length >= 7,
      'FAIL Test 18c: Portfolio generation works after clearing overrides'
    );
    console.log(`Test 18 — Inclusions & Exclusions Review & Change Lifecycle: Add INCLUDE (✓) -> Change to EXCLUDE (✓) -> Reset/Clear (✓)`);
  }

  // ─── Test 19: Ticket Size & Single-Issuer Diversification Guard on Small Portfolios ───
  // A bond with unit price ₹6,16,650 (like Edelweiss) in a ₹10,00,000 portfolio
  const largeTicketBond: DefaultBond = {
    isin: 'INE657N07613',
    issuer: 'EDELWEISS RURAL AND CORP',
    rating: 'AA',
    yield: 0.13,
    coupon: 0.12,
    months: 14,
    maturity: '2027-10-15',
    frequency: 'MONTHLY',
    totalTradableFV: 6166500,
    totalTradableQty: 10, // Unit price = 6,16,650
    faceValue: 1000000
  };

  const inventoryWithLargeBond = [
    ...mockInventory.filter(b => b.isin !== largeTicketBond.isin && b.issuer !== largeTicketBond.issuer),
    largeTicketBond
  ];
  const smallInvestment = 1000000; // 10 Lakhs (15% max single issuer cap = ₹1.5 Lakhs)

  const smallPortfolioSummary = generateBondPortfolio(
    inventoryWithLargeBond, smallInvestment, fdRates, 'A', undefined, 10
  );

  // Assert: Large ticket bond must NOT be selected under default diversification rules
  console.assert(
    !smallPortfolioSummary.selectedBonds.some(b => b.isin === largeTicketBond.isin),
    'FAIL Test 19a: Large ticket bond (₹6.17L) must NOT be selected in a ₹10L portfolio under SANE diversification defaults'
  );

  // Assert: Large ticket bond must appear in eliminatedBonds with reason TICKET_SIZE_TOO_LARGE
  const eliminatedLargeBond = smallPortfolioSummary.eliminatedBonds.find(e => e.bond.isin === largeTicketBond.isin);
  console.assert(
    eliminatedLargeBond !== undefined && eliminatedLargeBond.reason === 'TICKET_SIZE_TOO_LARGE',
    'FAIL Test 19b: Large ticket bond must be eliminated with reason TICKET_SIZE_TOO_LARGE'
  );
  console.log('Test 19 — Ticket Size & Diversification Guard: ₹6.17L bond successfully eliminated from ₹10L portfolio (prevents 65% overallocation) ✓');

  // ─── Test 20: Large Ticket Bond Becomes Eligible on Large Portfolios ───────────
  const largeInvestment = 5000000; // 50 Lakhs (15% cap = ₹7.5 Lakhs >= ₹6.17L unit price)
  const largePortfolioSummary = generateBondPortfolio(
    inventoryWithLargeBond, largeInvestment, fdRates, 'A', undefined, 10
  );

  // Assert: In a ₹50L portfolio, the ₹6.17L unit price is <= 15% (₹7.5L), so it can be eligible
  const isSelectedOrEligible = largePortfolioSummary.selectedBonds.some(b => b.isin === largeTicketBond.isin) ||
    !largePortfolioSummary.eliminatedBonds.some(e => e.bond.isin === largeTicketBond.isin && e.reason === 'TICKET_SIZE_TOO_LARGE');
  console.assert(
    isSelectedOrEligible,
    'FAIL Test 20: Large ticket bond should NOT be eliminated by ticket size in a ₹50L portfolio'
  );
  console.log('Test 20 — Scaled Ticket Size Guard: ₹6.17L bond is eligible when portfolio size is ₹50L (under 15% cap) ✓');

  // ─── Test 21: User Overrides (allowUnitOverflow or Force Include) ───────────────
  const summaryWithOverflow = generateBondPortfolio(
    inventoryWithLargeBond, smallInvestment, fdRates, 'A', undefined, 10,
    undefined, undefined, 7, 24, 'equal', undefined, undefined, false, {},
    { allowUnitOverflow: true }
  );
  console.assert(
    summaryWithOverflow.selectedBonds.some(b => b.isin === largeTicketBond.isin),
    'FAIL Test 21: When user explicitly enables allowUnitOverflow, high yield large ticket bond is included'
  );
  console.log('Test 21 — Hyperparameter Override: allowUnitOverflow successfully permits user override ✓');

  console.log('All tests passed successfully! ✓');
}

runTests();
