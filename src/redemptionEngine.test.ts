import {
  parseRedemptionSchedule,
  generateStructuredCashFlows
} from './redemptionEngine';
import { getBseGidRecord, getAllBseGidRecords } from './data/bseGidIntelligence';
import { resolveBondEntity, areBondsSameEntity } from './entityResolver';
import { DEFAULT_INVENTORY } from './defaultInventory';
import { generateBondPortfolio } from './bondEngine';

console.log('\n=== Running Structured Principal Redemption & BSE/NSDL Debt Intelligence Tests ===\n');

// ─── Test 1: Lucina Multi-Stage Redemption Parsing ───────────────────────────
console.log('Test 1 — Multi-Stage Structured Redemption Parsing:');
const lucinaText = "8% quarterly till Jan '28 and 17% till maturity";
const lucinaPlan = parseRedemptionSchedule(lucinaText, '2029-01-29', 28.9, 1000000);

if (!lucinaPlan.hasAmortization || lucinaPlan.amortizationType !== 'AMORTIZING') {
  throw new Error('Expected Lucina to be parsed as AMORTIZING');
}
if (lucinaPlan.tranches.length < 5) {
  throw new Error(`Expected at least 5 tranches for Lucina, got ${lucinaPlan.tranches.length}`);
}

const totalLucinaPrincipal = lucinaPlan.tranches.reduce((sum, t) => sum + t.principalAmount, 0);
if (Math.abs(totalLucinaPrincipal - 1000000) > 1) {
  throw new Error(`Total principal sum must equal ₹10,00,000, got ${totalLucinaPrincipal}`);
}
console.log(`  ✓ Lucina 8% quarterly parsed into ${lucinaPlan.tranches.length} tranches totaling ₹${(totalLucinaPrincipal / 100000).toFixed(2)}L\n`);

// ─── Test 2: Tapir Constructions Staggered Split Parsing ──────────────────────
console.log('Test 2 — 50/50 Staggered Split Redemption Parsing:');
const tapirText = '50% in Dec 29 & 50% Mar 30';
const tapirPlan = parseRedemptionSchedule(tapirText, '2030-03-11', 42.0, 500000);

if (tapirPlan.tranches.length !== 2) {
  throw new Error(`Expected 2 tranches for Tapir 50/50 split, got ${tapirPlan.tranches.length}`);
}
if (tapirPlan.tranches[0].principalAmount !== 250000 || tapirPlan.tranches[1].principalAmount !== 250000) {
  throw new Error(`Expected two ₹2.5L tranches for Tapir, got ${tapirPlan.tranches[0].principalAmount} and ${tapirPlan.tranches[1].principalAmount}`);
}
console.log('  ✓ Tapir Constructions 50/50 staggered split verified\n');

// ─── Test 3: Keertana & Akme Periodic Amortization Parsing ────────────────────
console.log('Test 3 — Periodic Amortization Patterns:');
const keertanaMonthly = parseRedemptionSchedule('33.33% in Jul’27, Aug’27 & Sep’27', '2027-09-30', 12.0, 300000);
if (keertanaMonthly.tranches.length !== 3) {
  throw new Error(`Expected 3 monthly tranches, got ${keertanaMonthly.tranches.length}`);
}

const akmeAnnual = parseRedemptionSchedule("50% annually from Oct'27", '2028-10-31', 25.0, 200000);
if (akmeAnnual.tranches.length !== 2) {
  throw new Error(`Expected 2 annual tranches, got ${akmeAnnual.tranches.length}`);
}
console.log('  ✓ Keertana 3-month split and Akme annual amortization verified\n');

// ─── Test 4: Reducing Balance Coupon Calculation ──────────────────────────────
console.log('Test 4 — Reducing Balance Coupon Calculation Verification:');
const cashFlowResult = generateStructuredCashFlows({
  isin: 'INE0JZO07040',
  issuer: 'LUCINA LAND DEV LTD',
  yield: 0.13, // 13%
  months: 28.9,
  maturity: '2029-01-29',
  frequency: 'MONTHLY',
  allocatedAmount: 1000000,
  principalRedemption: "8% quarterly till Jan '28 and 17% till maturity"
});

const flows = cashFlowResult.periodicFlows;
if (flows.length === 0) {
  throw new Error('Expected periodic cashflows to be generated');
}

// Verify that coupon interest in later months is lower than month 1 because principal is paid down
const firstCoupon = flows.find(f => f.month === 1);
const lateCoupon = flows.find(f => f.month === 20);

if (!firstCoupon || !lateCoupon) {
  throw new Error('Expected early and late coupon events');
}
if (lateCoupon.coupon >= firstCoupon.coupon) {
  throw new Error(`Reducing balance coupon failed: month 20 coupon (₹${lateCoupon.coupon}) should be less than month 1 coupon (₹${firstCoupon.coupon})`);
}

const totalPrincipalRepaid = flows.reduce((sum, f) => sum + f.principal, 0);
if (Math.abs(totalPrincipalRepaid - 1000000) > 1) {
  throw new Error(`Total principal repaid across cashflow events must equal ₹10,00,000, got ${totalPrincipalRepaid}`);
}
console.log(`  ✓ Month 1 coupon: ₹${firstCoupon.coupon.toFixed(0)} | Month 20 coupon: ₹${lateCoupon.coupon.toFixed(0)} (Accurate reducing balance confirmed)\n`);

// ─── Test 5: BSE GID & NSDL Terms Intelligence Database ───────────────────────
console.log('Test 5 — BSE GID & NSDL Debt Memorandum Knowledge Base:');
const allGid = getAllBseGidRecords();
if (allGid.length < 10) {
  throw new Error(`Expected at least 10 BSE GID records, got ${allGid.length}`);
}

const lucinaGid = getBseGidRecord('INE0JZO07040');
if (!lucinaGid || !lucinaGid.securityCoverRatio.includes('1.50x') || !lucinaGid.debentureTrustee.includes('Catalyst')) {
  throw new Error('Expected Lucina GID record with 1.50x security cover and Catalyst Trusteeship');
}

const psuGid = getBseGidRecord('POWER FINANCE CORPORATION LTD');
if (!psuGid || !psuGid.parentGroup.includes('PFC') || !psuGid.debentureTrustee.includes('SBICAP')) {
  throw new Error('Expected PFC record with sovereign Maharatna backing');
}
console.log(`  ✓ Verified ${allGid.length} BSE GID & NSDL records covering Asset Cover, DSRA, Escrow, and Covenants\n`);

// ─── Test 5b: NSDL Group Entity Diversification Resolution ───────────────────
console.log('Test 5b — NSDL / BSE Group Entity Single-Entity Diversification:');
const lucinaBond = DEFAULT_INVENTORY.find(b => b.isin === 'INE0JZO07040');
const tapirBond = DEFAULT_INVENTORY.find(b => b.isin === 'INE00DJ07052');
if (lucinaBond && tapirBond) {
  const isSameGroup = areBondsSameEntity(lucinaBond, tapirBond);
  const resolved = resolveBondEntity(lucinaBond);
  if (!isSameGroup || resolved.canonicalEntityKey !== 'sammaan_indiabulls') {
    throw new Error(`Expected Lucina and Tapir to resolve to same entity 'sammaan_indiabulls', got ${resolved.canonicalEntityKey}`);
  }
}
console.log('  ✓ Single-Entity Group Conglomerate resolution from NSDL/Promoter master verified\n');

// ─── Test 6: Proposal Engine Integration with Structured Cashflows ────────────
console.log('Test 6 — Portfolio Proposal Cashflow Integration:');
const fdRates = { t1: 2.75, t2: 4.25, t3: 5.75, t4: 6.25, t5: 6.45, t6: 6.50, t7: 6.50 };
const portfolio = generateBondPortfolio(
  DEFAULT_INVENTORY,
  1000000,
  fdRates,
  'ALL',
  undefined,
  10,
  undefined,
  undefined,
  1,
  60,
  'equal'
);

// Verify that periodicCashFlows contains structured labels and valid principals
if (!portfolio.periodicCashFlows || portfolio.periodicCashFlows.length === 0) {
  throw new Error('Expected portfolio.periodicCashFlows to contain events');
}

const totalPortfolioPrincipal = portfolio.periodicCashFlows.reduce((sum, cf) => sum + cf.principal, 0);
if (Math.abs(totalPortfolioPrincipal - portfolio.totalInvestment) > 5) {
  throw new Error(`Portfolio principal repayment sum (₹${totalPortfolioPrincipal}) must equal total investment (₹${portfolio.totalInvestment})`);
}
console.log(`  ✓ Proposal cashflow schedule verified: ₹${(totalPortfolioPrincipal / 100000).toFixed(2)}L principal deployed and returned\n`);

console.log('All 6 Structured Principal Redemption & BSE/NSDL Intelligence Tests Passed Successfully! ✓\n');
