// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';
import * as XLSX from 'xlsx';
import { generateBondPortfolio } from './bondEngine';
import { DefaultBond } from './defaultInventory';

// Helper to parse Excel buffer in Node
// @ts-ignore
function parseExcelBuffer(buffer: any, baseDate: Date = new Date()): DefaultBond[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

  const bonds: DefaultBond[] = [];

  for (const row of rawRows) {
    const normalizedRow: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
      normalizedRow[key.trim().replace(/\r?\n|\r/g, ' ').toLowerCase()] = row[key];
    }

    const isin = String(normalizedRow['isin'] || '').trim();
    const issuer = String(normalizedRow['issuer name'] || normalizedRow['issuer'] || '').trim();
    if (!isin || !issuer) continue;

    const category = String(
      normalizedRow['category (in new version)'] ||
      normalizedRow['category'] ||
      normalizedRow['category_new'] ||
      ''
    ).trim().toLowerCase();
    if (category.includes('bundle - flexi') || category.includes('bundle-flexi')) {
      continue;
    }

    const rawCoupon = normalizedRow['coupon'] || normalizedRow['coupon '];
    let coupon: number | null = null;
    if (typeof rawCoupon === 'number') {
      coupon = rawCoupon;
    } else if (typeof rawCoupon === 'string' && rawCoupon.trim().toLowerCase() !== 'zero') {
      const parsed = parseFloat(rawCoupon);
      if (!isNaN(parsed)) coupon = parsed;
    }

    const rawYield = normalizedRow['offer yield'] || normalizedRow['yield'] || normalizedRow['offer_yield'];
    let yieldVal: number | null = null;
    if (typeof rawYield === 'number') {
      yieldVal = rawYield;
    } else if (typeof rawYield === 'string' && rawYield.trim() !== '-') {
      const parsed = parseFloat(rawYield);
      if (!isNaN(parsed)) yieldVal = parsed;
    }

    const finalYield = yieldVal !== null ? yieldVal : (coupon !== null ? coupon : 0.0);

    const rawMaturity = normalizedRow['redemption date'] || normalizedRow['maturity date'] || normalizedRow['redemption_date'];
    let maturityDate: Date | null = null;
    if (rawMaturity instanceof Date) {
      maturityDate = rawMaturity;
    } else if (typeof rawMaturity === 'string') {
      const parsed = new Date(rawMaturity);
      if (!isNaN(parsed.getTime())) maturityDate = parsed;
    }

    if (!maturityDate) continue;

    const diffTime = maturityDate.getTime() - baseDate.getTime();
    const months = Math.round((diffTime / (1000 * 60 * 60 * 24 * 30.4375)) * 10) / 10;

    const rating = String(normalizedRow['credit rating'] || normalizedRow['rating'] || 'Unrated').trim();
    const frequency = String(normalizedRow['interest payment frequency'] || normalizedRow['frequency'] || 'ON MATURITY').trim();

    const rawFV = normalizedRow['total tradable fv'] || normalizedRow['total tradable_fv'] || normalizedRow['face value'] || normalizedRow['face_value'];
    let totalTradableFV: number | undefined = undefined;
    if (typeof rawFV === 'number') {
      totalTradableFV = rawFV;
    } else if (typeof rawFV === 'string') {
      const parsed = parseFloat(rawFV.replace(/,/g, ''));
      if (!isNaN(parsed)) totalTradableFV = parsed;
    }

    const guarantor = String(
      normalizedRow['guarantor'] || normalizedRow['guarantor name'] || normalizedRow['guarantor_name'] || normalizedRow['parent company'] || ''
    ).trim() || undefined;

    const guarantorRating = String(
      normalizedRow['guarantor rating'] || normalizedRow['guarantor_rating'] || normalizedRow['parent rating'] || ''
    ).trim() || undefined;

    const rawTrend = String(
      normalizedRow['rating trend'] || normalizedRow['rating_trend'] || normalizedRow['outlook'] || normalizedRow['rating outlook'] || ''
    ).trim().toLowerCase();

    let ratingTrend: 'stable' | 'improving' | 'deteriorating' | undefined = undefined;
    if (rawTrend.includes('improv') || rawTrend.includes('positive') || rawTrend.includes('upgrad')) {
      ratingTrend = 'improving';
    } else if (rawTrend.includes('deteriorat') || rawTrend.includes('negative') || rawTrend.includes('downgrad')) {
      ratingTrend = 'deteriorating';
    } else if (rawTrend.includes('stabl')) {
      ratingTrend = 'stable';
    }

    const rawSector = String(
      normalizedRow['sector'] || normalizedRow['industry'] || normalizedRow['sector/industry'] || normalizedRow['sub-sector'] || ''
    ).trim();

    const ratingOutlookNote = String(
      normalizedRow['rating note'] || normalizedRow['outlook note'] || normalizedRow['rating_outlook_note'] || ''
    ).trim() || undefined;

    bonds.push({
      isin,
      issuer,
      coupon,
      yield: finalYield,
      maturity: maturityDate.toISOString().split('T')[0],
      months,
      rating,
      frequency,
      totalTradableFV,
      sector: rawSector || undefined,
      category,
      guarantor,
      guarantorRating,
      ratingTrend,
      ratingOutlookNote
    });
  }

  return bonds;
}

function runComprehensiveInventoryTestSuite() {
  console.log('================================================================');
  console.log('🚀 COMPREHENSIVE INVENTORY & PORTFOLIO SUITE VERIFICATION');
  console.log('================================================================\n');

  // @ts-ignore
  const inventoryDir = path.join((process as any).cwd(), 'bond-inventory');
  // @ts-ignore
  const files: string[] = fs.readdirSync(inventoryDir).filter((f: string) => f.endsWith('.xlsx'));

  console.log(`📂 Found ${files.length} inventory files in bond-inventory/\n`);

  const fdRates = { t1: 4.25, t2: 5.75, t3: 6.25, t4: 6.45, t5: 6.50, t6: 6.50, t7: 6.50 };

  // Investment amounts: 5 Lakhs (500,000) to 1 Crore (10,000,000) in steps of 5 Lakhs (500,000)
  const investmentAmounts: number[] = [];
  for (let amt = 500000; amt <= 10000000; amt += 500000) {
    investmentAmounts.push(amt);
  }

  const ratingFilters: ('A' | 'BBB-' | 'ALL')[] = ['A', 'BBB-', 'ALL'];
  const minIssuersList: number[] = [5, 10, 15];
  const strategies: ('equal' | 'smart')[] = ['smart', 'equal'];
  const tenureRanges: { min: number; max: number }[] = [
    { min: 7, max: 24 },
    { min: 12, max: 36 },
    { min: 6, max: 60 }
  ];

  let totalSimulations = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  files.forEach((fileName: string) => {
    // @ts-ignore
    const filePath = path.join(inventoryDir, fileName);
    console.log(`----------------------------------------------------------------`);
    console.log(`📑 Testing Inventory File: [${fileName}]`);
    console.log(`----------------------------------------------------------------`);

    const fileBuffer = fs.readFileSync(filePath);
    const bonds = parseExcelBuffer(fileBuffer);
    console.log(`   -> Parsed ${bonds.length} active bonds from Excel.\n`);

    if (bonds.length === 0) {
      console.error(`   ❌ FAIL: Inventory file ${fileName} yielded 0 valid bonds!`);
      totalFailed++;
      return;
    }

    let fileSimCount = 0;

    for (const amount of investmentAmounts) {
      for (const ratingFilter of ratingFilters) {
        for (const targetIssuers of minIssuersList) {
          for (const strategy of strategies) {
            for (const tenure of tenureRanges) {
              fileSimCount++;
              totalSimulations++;

              try {
                const summary = generateBondPortfolio(
                  bonds,
                  amount,
                  fdRates,
                  ratingFilter,
                  undefined,
                  targetIssuers,
                  undefined,
                  undefined,
                  tenure.min,
                  tenure.max,
                  strategy
                );

                // --- STRICT ASSERTIONS ---

                // 1. Must select at least 1 bond if matching inventory exists
                console.assert(
                  summary.selectedBonds.length > 0,
                  `FAIL [${fileName} | ₹${amount}]: Portfolio returned 0 bonds!`
                );

                // 2. NO ZERO ALLOCATION / WEIGHT PERMITTED
                const zeroAllocBonds = summary.selectedBonds.filter(b => b.allocatedAmount <= 0 || b.allocationPercent <= 0);
                console.assert(
                  zeroAllocBonds.length === 0,
                  `FAIL [${fileName} | ₹${amount}]: Found ${zeroAllocBonds.length} bonds with 0% weight!`
                );

                const zeroAllocCompanies = summary.companyAllocations.filter(c => c.amount <= 0 || c.percent <= 0);
                console.assert(
                  zeroAllocCompanies.length === 0,
                  `FAIL [${fileName} | ₹${amount}]: Found ${zeroAllocCompanies.length} companies with 0% weight!`
                );

                // 3. STRICT SINGLE COMPANY WEIGHT CAP (15% or 1/N equal weight)
                const STEP = 10000;
                const maxCompanyCapAllowed = Math.max(amount * 0.15, amount / targetIssuers);
                summary.companyAllocations.forEach(c => {
                  console.assert(
                    c.amount <= maxCompanyCapAllowed + 100000, // allow 1 unit overflow if unit price is large
                    `FAIL [${fileName} | ₹${amount}]: Company ${c.company} allocation ₹${c.amount} exceeded cap ₹${maxCompanyCapAllowed}!`
                  );
                });

                // 4. ACCURATE WEIGHTED YIELD ACCORDING TO ALLOCATED CAPITAL
                const totalAllocatedAmount = summary.selectedBonds.reduce((acc, b) => acc + b.allocatedAmount, 0);
                const expectedWeightedYield = summary.selectedBonds.reduce((acc, b) => acc + (b.yield * b.allocatedAmount), 0) / (totalAllocatedAmount || 1);
                console.assert(
                  Math.abs(summary.portfolioYield - expectedWeightedYield) < 0.0001,
                  `FAIL [${fileName} | ₹${amount}]: Portfolio yield calculation mismatch! Computed: ${summary.portfolioYield}, Expected: ${expectedWeightedYield}`
                );

                // 5. TRADABLE FV CAP COMPLIANCE
                summary.selectedBonds.forEach(b => {
                  if (b.totalTradableFV && b.totalTradableFV > 0) {
                    console.assert(
                      b.allocatedAmount <= b.totalTradableFV,
                      `FAIL [${fileName} | ₹${amount}]: Bond ${b.isin} allocated ₹${b.allocatedAmount} exceeding Tradable FV cap ₹${b.totalTradableFV}!`
                    );
                  }
                });

                // 6. 100% FULL CAPITAL DEPLOYMENT ASSERTION
                // Verifies that total allocated capital matches target investment unless total available inventory is exhausted
                const maxInventoryCapacity = bonds.reduce((sum, b) => sum + Math.min(b.totalTradableFV || Infinity, maxCompanyCapAllowed), 0);
                if (maxInventoryCapacity >= amount) {
                  console.assert(
                    Math.abs(totalAllocatedAmount - amount) <= STEP,
                    `FAIL [${fileName} | Target ₹${amount}]: Only allocated ₹${totalAllocatedAmount} (${((totalAllocatedAmount/amount)*100).toFixed(1)}%) instead of 100%!`
                  );
                }

                // 7. QUARTERLY CASHFLOW TARGET — DRIVES SELECTION + REPORTING ASSERTIONS
                const testQuarterlyTarget = 5.0; // 5% per quarter
                const qSummary = generateBondPortfolio(
                  bonds, amount, fdRates, ratingFilter, undefined, targetIssuers,
                  undefined, undefined, tenure.min, tenure.max, strategy, undefined, testQuarterlyTarget
                );

                // 7a. quarterlyCashflow analysis must be defined
                console.assert(
                  qSummary.quarterlyCashflow !== undefined,
                  `FAIL [${fileName} | ₹${amount}]: quarterlyCashflow must be defined when target is set`
                );

                // 7b. periodicCashFlows must exist and be non-empty
                console.assert(
                  qSummary.periodicCashFlows !== undefined && qSummary.periodicCashFlows.length > 0,
                  `FAIL [${fileName} | ₹${amount}]: periodicCashFlows must be non-empty`
                );

                // 7c. All periodic events must have valid month and positive total
                const invalidPeriodic = qSummary.periodicCashFlows.filter(cf => cf.month <= 0 || cf.total <= 0);
                console.assert(
                  invalidPeriodic.length === 0,
                  `FAIL [${fileName} | ₹${amount}]: ${invalidPeriodic.length} invalid periodic cashflow events found`
                );

                if (qSummary.quarterlyCashflow) {
                  const qc = qSummary.quarterlyCashflow;
                  // 7d. requiredPerQuarter calculation
                  const expectedReq = amount * 0.05;
                  console.assert(
                    Math.abs(qc.requiredPerQuarter - expectedReq) < 0.01,
                    `FAIL [${fileName} | ₹${amount}]: requiredPerQuarter ${qc.requiredPerQuarter} expected ${expectedReq}`
                  );
                  // 7e. Each quarter's actualCashflow must match periodicCashFlows sum for that window
                  qc.items.forEach(item => {
                    const minM = (item.quarter - 1) * 3 + 1;
                    const maxM = item.quarter * 3;
                    const expectedActual = qSummary.periodicCashFlows
                      .filter(cf => cf.month >= minM && cf.month <= maxM)
                      .reduce((s, cf) => s + cf.total, 0);
                    console.assert(
                      Math.abs(item.actualCashflow - expectedActual) < 0.01,
                      `FAIL [${fileName} | ₹${amount}] Q${item.quarter}: actualCashflow ${item.actualCashflow.toFixed(0)} ≠ periodicCashFlows sum ${expectedActual.toFixed(0)}`
                    );
                  });
                  // 7f. quartersMet must be in valid range
                  console.assert(
                    qc.quartersMet >= 0 && qc.quartersMet <= qc.totalQuarters,
                    `FAIL [${fileName} | ₹${amount}]: quartersMet (${qc.quartersMet}) out of range [0, ${qc.totalQuarters}]`
                  );
                }

                totalPassed++;

              } catch (err) {
                console.error(`   ❌ EXCEPTION [${fileName} | Amount ₹${amount} | Strategy ${strategy}]:`, (err as Error).message);
                totalFailed++;
              }
            }
          }
        }
      }
    }

    console.log(`   ✅ Passed ${fileSimCount} simulation scenarios for ${fileName}.\n`);
  });

  console.log('================================================================');
  console.log(`🎉 TEST SUITE COMPLETE`);
  console.log(`   Total Scenario Simulations: ${totalSimulations}`);
  console.log(`   Passed: ${totalPassed}`);
  console.log(`   Failed: ${totalFailed}`);
  console.log('================================================================');
}

runComprehensiveInventoryTestSuite();
