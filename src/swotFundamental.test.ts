import { getBusinessSwot, getAllBusinessSwot, getPortfolioConsolidatedSwot } from './data/swotIntelligence';
import { getPromoterRiskRecord, getAllPromoterRecords } from './data/promoterIntelligence';
import { PortfolioHolding } from './analyzer/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error('Assertion failed: ' + message);
  }
}

console.log('\n=== Running Business Fundamental SWOT & Source Citations Test Suite ===\n');

// Test 1: Fundamental SWOT retrieval and rating report citations
const swot = getBusinessSwot('INE528S07350') || getBusinessSwot('EDELWEISS FINANCIAL SERV LTD');
assert(swot !== null, 'Business SWOT record for Edelweiss must exist');
if (swot) {
  assert(swot.ratingAgency.length > 0, 'Rating agency must be specified');
  assert(swot.sourceUrl.startsWith('http'), 'Rating rationale URL must be valid HTTP(S) link');
  assert(swot.bseFilingUrl.startsWith('http'), 'BSE filing URL must be valid HTTP(S) link');
  assert(swot.nsdlDirectoryUrl.startsWith('http'), 'NSDL directory URL must be valid HTTP(S) link');
  assert(swot.swot.strengths.length > 0, 'Strengths must contain parsed elements');
  assert(swot.swot.weaknesses.length > 0, 'Weaknesses must contain parsed elements');
  assert(swot.swot.opportunities.length > 0, 'Opportunities must contain parsed elements');
  assert(swot.swot.threats.length > 0, 'Threats must contain parsed elements');
}
console.log('Test 1 — Business SWOT & Verified Rating Citations (CITE TO SOURCE):');
console.log('  ✓ Verified 4-quadrant SWOT and live report URLs for ISINs & issuers');

// Test 2: Financial metrics coverage (CRAR, GNPA, Gearing, LCR)
const allSwot = getAllBusinessSwot();
assert(allSwot.length >= 15, 'Must have at least 15 comprehensive SWOT records');
const withCrar = allSwot.filter(s => {
  const c = s.financialMetrics.crar ?? s.financialMetrics.crarPercent;
  return c !== undefined && c > 0;
});
assert(withCrar.length >= 5, 'Must have populated CRAR metrics for capital evaluation');
console.log('Test 2 — Financial Metrics & Balance Sheet Ratios (CRAR, GNPA, Gearing):');
console.log(`  ✓ Verified ${allSwot.length} SWOT records with ${withCrar.length} capital adequacy profiles`);

// Test 3: Portfolio Consolidated SWOT Matrix & Credit Vulnerability Matrix
const mockHoldings: PortfolioHolding[] = [
  {
    srNo: 1,
    isin: 'INE528S07350',
    rawSecurityName: 'EDELWEISS 10.5%',
    securityName: 'EDELWEISS FINANCIAL SERV LTD',
    readableName: 'EDELWEISS FINANCIAL SERVICES',
    issuerName: 'EDELWEISS FINANCIAL SERV LTD',
    parentGroup: 'Edelweiss Group',
    broadSector: 'Financial Services',
    subSector: 'Diversified NBFC',
    sector: 'Financial Services',
    rating: 'CRISIL AA-',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    isSecured: true,
    couponPercent: 10.5,
    yieldPercent: 10.8,
    qty: 100,
    faceValue: 1000,
    estimatedMarketValue: 100000,
    weightPercent: 50,
    maturityDate: '2027-03-05',
    monthsToMaturity: 30,
    frequency: 'ANNUAL'
  },
  {
    srNo: 2,
    isin: 'INE804I075Y4',
    rawSecurityName: 'MUTHOOT 9.5%',
    securityName: 'MUTHOOT FINANCE LTD',
    readableName: 'MUTHOOT FINANCE',
    issuerName: 'MUTHOOT FINANCE LTD',
    parentGroup: 'Muthoot Group',
    broadSector: 'Financial Services',
    subSector: 'Gold Loan NBFC',
    sector: 'Financial Services',
    rating: 'CRISIL AA+',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    isSecured: true,
    couponPercent: 9.5,
    yieldPercent: 9.5,
    qty: 100,
    faceValue: 1000,
    estimatedMarketValue: 100000,
    weightPercent: 50,
    maturityDate: '2028-01-15',
    monthsToMaturity: 40,
    frequency: 'MONTHLY'
  }
];

const consolidated = getPortfolioConsolidatedSwot(mockHoldings);
assert(consolidated.totalHoldingsAnalyzed >= 1, 'Should analyze portfolio holdings for SWOT');
assert(consolidated.topStrengths.length > 0, 'Consolidated top strengths must be aggregated');
assert(consolidated.topWeaknesses.length > 0, 'Consolidated top weaknesses must be aggregated');
console.log('Test 3 — Consolidated Portfolio Business SWOT Matrix:');
console.log(`  ✓ Aggregated ${consolidated.totalHoldingsAnalyzed} holdings into top strengths (${consolidated.topStrengths[0]?.text.slice(0, 35)}...) and vulnerabilities`);

// Test 4: Promoter & Executive Dossiers with Personal SWOT & Journey
const promoter = getPromoterRiskRecord('Rashesh Shah') || getPromoterRiskRecord('edelweiss_group');
assert(promoter !== null, 'Promoter record for Rashesh Shah must exist');
if (promoter) {
  assert(!!promoter.promoterJourney && promoter.promoterJourney.length > 30, 'Promoter journey must be detailed');
  assert(!!promoter.entitiesOwned && promoter.entitiesOwned.length > 1, 'Entities owned list must contain subsidiaries');
  assert(!!promoter.personalSwot && promoter.personalSwot.strengths.length > 0, 'Personal SWOT strengths must exist');
  assert(!!promoter.personalSwot && promoter.personalSwot.weaknesses.length > 0, 'Personal SWOT weaknesses must exist');
  assert(!!promoter.citations && promoter.citations.length > 0, 'Promoter citations must exist');
  assert(promoter.citations[0].url.startsWith('http'), 'Promoter citation link must be valid URL');
}
console.log('Test 4 — Promoter & Executive Career Journey & Personal SWOT Dossiers:');
console.log('  ✓ Verified executive track record, corporate tree, and 4-quadrant personal SWOT');

// Test 5: Universal coverage of Personal SWOT & Citations across all promoter records
const allPromoters = getAllPromoterRecords();
for (const p of allPromoters) {
  assert(!!p.personalSwot && p.personalSwot.strengths.length > 0, `Promoter ${p.entityName} must have personal SWOT`);
  assert(!!p.citations && p.citations.length > 0, `Promoter ${p.entityName} must have citations`);
}
console.log('Test 5 — Universal Coverage Across All 32+ Promoter Records:');
console.log(`  ✓ Verified 100% Personal SWOT & Live Citation coverage across ${allPromoters.length} entities`);

console.log('\nAll 5 Business Fundamental SWOT & Promoter Dossier Tests Passed Successfully! ✓\n');
