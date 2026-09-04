import {
  getCreditCoverageRecord,
  getAllCreditProfiles,
  getPortfolioConsolidatedFiveCs
} from './data/creditCoverageIntelligence';
import { PortfolioHolding } from './analyzer/types';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('🧪 Starting 5 Cs of Credit Framework & Quantitative Coverage Unit Tests...');

// Test 1: Verify all pre-built profiles in database
const profiles = getAllCreditProfiles();
assert(profiles.length >= 10, `Expected at least 10 corporate credit profiles, found ${profiles.length}`);
console.log(`  ✓ Verified ${profiles.length} comprehensive 5 Cs credit & coverage profiles loaded`);

// Test 2: Check institutional prime profile (Tata Power)
const tata = getCreditCoverageRecord('Tata Power Company Limited');
assert(tata !== null, 'Expected Tata Power profile to exist');
assert(tata.compositeCreditScore >= 85, `Tata Power composite score should be >= 85, got ${tata.compositeCreditScore}`);
assert(tata.creditGrade === 'PRIME', `Tata Power should be PRIME grade, got ${tata.creditGrade}`);
assert(tata.quantitativeCoverage.dscr >= 1.5, `Tata Power DSCR should be >= 1.5x, got ${tata.quantitativeCoverage.dscr}x`);
assert(tata.quantitativeCoverage.iscr >= 2.5, `Tata Power ISCR should be >= 2.5x, got ${tata.quantitativeCoverage.iscr}x`);
assert(tata.quantitativeCoverage.securityCoverRatio >= 1.25, 'Security cover must be >= 1.25x');
assert(tata.fiveCs.character.score >= 80, 'Tata Character score must be >= 80/100');
assert(tata.fiveCs.capacity.score >= 80, 'Tata Capacity score must be >= 80/100');
console.log('  ✓ Verified Tata Power Prime Institutional 5 Cs and quantitative metrics');

// Test 3: Check PSU profile (PFC / REC)
const pfc = getCreditCoverageRecord('Power Finance Corporation Ltd');
assert(pfc !== null, 'Expected PFC profile to exist');
assert(pfc.compositeCreditScore >= 90, 'PFC composite score should be >= 90');
assert(pfc.fiveCs.character.score >= 95, 'PFC sovereign backing character score must be >= 95/100');
assert(pfc.quantitativeCoverage.iscr >= 2.0, 'PFC ISCR must be >= 2.0x');
console.log('  ✓ Verified PSU Sovereign Backing 5 Cs metrics (PFC/REC)');

// Test 4: Check Gold NBFC profile (Muthoot Finance)
const muthoot = getCreditCoverageRecord('Muthoot Finance Limited');
assert(muthoot !== null, 'Expected Muthoot Finance profile to exist');
assert(muthoot.quantitativeCoverage.dscr >= 1.4, 'Muthoot DSCR must be >= 1.4x');
assert(muthoot.fiveCs.collateral.score >= 80, 'Muthoot Collateral score should be >= 80/100 (liquid gold collateral)');
assert(muthoot.fiveCs.capital.score >= 80, 'Muthoot Capital score should be >= 80/100 (high CRAR > 25%)');
console.log('  ✓ Verified High Collateral & Capital NBFC profile (Muthoot)');

// Test 5: Check High-Yield / Complex Issuer (Edelweiss Financial Services)
const edelweiss = getCreditCoverageRecord('Edelweiss Financial Services Ltd');
assert(edelweiss !== null, 'Expected Edelweiss profile to exist');
assert(edelweiss.compositeCreditScore < 80, 'Edelweiss should reflect moderate/adequate credit tier');
assert(edelweiss.quantitativeCoverage.dscr > 1.0, 'Edelweiss DSCR must be positive');
console.log('  ✓ Verified High-Yield / Flagged Issuer 5 Cs profile (Edelweiss)');

// Test 6: Fallback for unlisted / generic issuer
const fallback = getCreditCoverageRecord('INE999999999');
assert(fallback !== null, 'Expected fallback credit record for unknown entity');
assert(fallback.compositeCreditScore >= 60 && fallback.compositeCreditScore <= 75, 'Fallback score should be reasonable standard');
assert(fallback.quantitativeCoverage.dscr === 1.25, 'Standard fallback DSCR is 1.25x');
assert(fallback.quantitativeCoverage.iscr === 2.10, 'Standard fallback ISCR is 2.10x');
console.log('  ✓ Verified algorithmic fallback profile for unknown bonds');

// Test 7: Portfolio-level weighted 5 Cs & Coverage aggregation
const mockHoldings: PortfolioHolding[] = [
  {
    srNo: 1,
    isin: 'INE245A07010',
    issuerName: 'Tata Power Company Limited',
    securityName: 'Tata Power 7.75% 2028',
    readableName: 'Tata Power 7.75% 2028',
    qty: 100,
    faceValue: 100000,
    estimatedMarketValue: 10000000, // 1 Cr (50%)
    weightPercent: 50,
    couponPercent: 7.75,
    yieldPercent: 7.80,
    rating: 'AA+',
    parentGroup: 'Tata Group',
    sector: 'Energy & Utilities',
    broadSector: 'Energy & Utilities',
    subSector: 'Power Generation',
    monthsToMaturity: 36,
    maturityDate: "2028-09-01",
    frequency: "ANNUAL",
    ratingAgency: "CRISIL",
    ratingTrend: "stable",
    isSecured: true
  },
  {
    srNo: 2,
    isin: 'INE134E08KJ9',
    issuerName: 'Power Finance Corporation Ltd',
    securityName: 'PFC 7.60% 2030',
    readableName: 'PFC 7.60% 2030',
    qty: 100,
    faceValue: 100000,
    estimatedMarketValue: 10000000, // 1 Cr (50%)
    weightPercent: 50,
    couponPercent: 7.60,
    yieldPercent: 7.65,
    rating: 'AAA',
    parentGroup: 'PFC / Ministry of Power',
    sector: 'Financial Services',
    broadSector: 'Financial Services',
    subSector: 'PSU Infrastructure Finance',
    monthsToMaturity: 60,
    maturityDate: "2030-09-01",
    frequency: "ANNUAL",
    ratingAgency: "CARE",
    ratingTrend: "stable",
    isSecured: true
  }
];

const consolidated = getPortfolioConsolidatedFiveCs(mockHoldings);
assert(consolidated.totalHoldingsAnalyzed === 2, 'Should have analyzed 2 holdings');
assert(consolidated.compositeScore >= 88, `Consolidated score should be >= 88, got ${consolidated.compositeScore}`);
assert(consolidated.creditGrade === 'PRIME', `Consolidated grade should be PRIME, got ${consolidated.creditGrade}`);
assert(consolidated.weightedDscr >= 1.45, `Weighted DSCR should be >= 1.45x, got ${consolidated.weightedDscr}x`);
assert(consolidated.weightedIscr >= 2.5, `Weighted ISCR should be >= 2.5x, got ${consolidated.weightedIscr}x`);
assert(consolidated.pillarAverages.character >= 80, 'Pillar Character should average >= 80');
assert(consolidated.pillarAverages.capacity >= 80, 'Pillar Capacity should average >= 80');
console.log('  ✓ Verified Portfolio Consolidated 5 Cs and Weighted Coverage Calculations:');
console.log(`    - Composite Score: ${consolidated.compositeScore}/100 (${consolidated.creditGrade})`);
console.log(`    - Weighted DSCR: ${consolidated.weightedDscr.toFixed(2)}x, ISCR: ${consolidated.weightedIscr.toFixed(2)}x, FCCR: ${consolidated.weightedFccr.toFixed(2)}x`);
console.log(`    - Character: ${consolidated.pillarAverages.character.toFixed(1)}, Capacity: ${consolidated.pillarAverages.capacity.toFixed(1)}, Collateral: ${consolidated.pillarAverages.collateral.toFixed(1)}, Capital: ${consolidated.pillarAverages.capital.toFixed(1)}, Conditions: ${consolidated.pillarAverages.conditions.toFixed(1)}`);

// Test 8: Empty portfolio handling
const emptyConsolidated = getPortfolioConsolidatedFiveCs([]);
assert(emptyConsolidated.totalHoldingsAnalyzed === 0, 'Empty portfolio should have 0 holdings');
assert(emptyConsolidated.compositeScore === 0, 'Empty portfolio should have 0 score');
console.log('  ✓ Verified empty portfolio edge case handling');

console.log('🎉 ALL 5 Cs CREDIT FRAMEWORK & COVERAGE UNIT TESTS PASSED SUCCESSFULLY!');
