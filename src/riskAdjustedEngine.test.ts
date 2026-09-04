import {
  assessBondFundamentalRisk,
  getRiskAdjustedIssuerCap,
  getCleanRatingSymbol,
  calculateCompositeFundamentalScore,
  getGradientPermissibleTenure
} from './riskAdjustedEngine';
import { DEFAULT_HYPERPARAMETERS } from './engineSettingsManager';
import { computeDynamicPromoterScore, PromoterRiskRecord } from './data/promoterIntelligence';
import { generateBondPortfolio } from './bondEngine';
import { DEFAULT_INVENTORY } from './defaultInventory';

console.log('\n=== Running Fundamental Risk-Adjusted Tenure, Time-Decay & Gradient Tests ===\n');

// Test 1: Rating Symbol Extraction
console.log('Test 1 — Clean Rating Symbol Extraction:');
if (getCleanRatingSymbol('CRISIL AAA') !== 'AAA') throw new Error('Failed to clean CRISIL AAA');
if (getCleanRatingSymbol('CARE BBB-') !== 'BBB-') throw new Error('Failed to clean CARE BBB-');
if (getCleanRatingSymbol('IND A+') !== 'A+') throw new Error('Failed to clean IND A+');
if (getCleanRatingSymbol('7.46% TG SDL 48') !== 'SOVEREIGN') throw new Error('Failed to detect SOVEREIGN');
console.log('  ✓ Clean rating symbols correctly resolved\n');

// Test 2: Higher Risk on Bond -> Lower Bond Tenure
console.log('Test 2 — Higher Risk on Bond -> Lower Allowable Tenure:');
const bbbBond = {
  isin: 'INE0Z4807015',
  issuer: 'CYQURE INDIA PVT LTD',
  rating: 'CARE BBB-',
  maturity: '2028-03-16',
  months: 18.4,
  yield: 0.135
};

const primeBond = {
  isin: 'IN0020240010',
  issuer: 'GOI 2029',
  rating: 'SOVEREIGN',
  maturity: '2029-06-15',
  months: 48.0,
  yield: 0.072
};

const bbbAssessment = assessBondFundamentalRisk(bbbBond, DEFAULT_HYPERPARAMETERS);
if (bbbAssessment.tier !== 'HIGH_RISK') throw new Error('BBB bond must be categorized as HIGH_RISK');
if (bbbAssessment.maxPermissibleTenureMonths > 18.0) throw new Error(`Expected <=18.0m max tenure for BBB, got ${bbbAssessment.maxPermissibleTenureMonths}`);

const primeAssessment = assessBondFundamentalRisk(primeBond, DEFAULT_HYPERPARAMETERS);
if (primeAssessment.tier !== 'PRIME') throw new Error('Sovereign bond must be categorized as PRIME');
if (primeAssessment.maxPermissibleTenureMonths !== 120) throw new Error('Prime bond should have full tenure eligibility');
console.log('  ✓ Higher risk bond tenure successfully capped at <=18m vs 120m for Prime\n');

// Test 3: Time-Decaying News Scoring (Older news penalizes less)
console.log('Test 3 — Time-Decayed Negative News Weighting:');
const mockRecentRecord: PromoterRiskRecord = {
  entityKey: 'test_recent',
  entityName: 'Test Recent Entity',
  aliasesAndSubsidiaries: [],
  promotersAndKeyPersons: [],
  ownershipStructure: 'Private',
  sector: 'NBFC',
  broadSector: 'Financials',
  governanceScore: 80,
  riskSeverity: 'MODERATE',
  autoExcludeFromProposals: false,
  negativeMediaFlags: [],
  detailedCaseHistory: '',
  earlierBankruptciesOrDefaults: '',
  regulatoryActions: '',
  auditorAndAccountingQuality: '',
  investmentVerdict: '',
  lastRefinedDate: '2026-09-04',
  datedNewsEvents: [
    {
      headline: 'Recent Regulatory Inquiry',
      date: '2026-06-01', // 3 months old
      severity: 'HIGH',
      category: 'REGULATORY',
      description: 'Recent regulatory warning.'
    }
  ]
};

const mockOldRecord: PromoterRiskRecord = {
  ...mockRecentRecord,
  entityKey: 'test_old',
  datedNewsEvents: [
    {
      headline: 'Old Historical Inquiry',
      date: '2021-01-15', // ~68 months old
      severity: 'HIGH',
      category: 'REGULATORY',
      description: 'Historical regulatory warning from 5 years ago.'
    }
  ]
};

const recentScore = computeDynamicPromoterScore(mockRecentRecord, '2026-09-04');
const oldScore = computeDynamicPromoterScore(mockOldRecord, '2026-09-04');

if (recentScore.timeDecayedNewsPenalty <= oldScore.timeDecayedNewsPenalty) {
  throw new Error(`Recent news penalty (${recentScore.timeDecayedNewsPenalty}) must be higher than old news penalty (${oldScore.timeDecayedNewsPenalty})`);
}
if (recentScore.finalGovernanceScore >= oldScore.finalGovernanceScore) {
  throw new Error(`Recent news score (${recentScore.finalGovernanceScore}) should be lower than decayed old news score (${oldScore.finalGovernanceScore})`);
}
console.log(`  ✓ Older news penalty decayed significantly (${oldScore.timeDecayedNewsPenalty} pts vs recent ${recentScore.timeDecayedNewsPenalty} pts)\n`);

// Test 4: Foreign Institutional Inflow & Turnaround Boost
console.log('Test 4 — Foreign & Marquee Institutional Inflow / Turnaround Factor:');
const mockDistressedWithFairfax: PromoterRiskRecord = {
  ...mockRecentRecord,
  entityKey: 'test_turnaround',
  governanceScore: 65,
  datedNewsEvents: [
    {
      headline: 'Past Liquidity Strain',
      date: '2024-01-10',
      severity: 'HIGH',
      category: 'LEVERAGE',
      description: 'Liquidity tightening.',
      isResolved: true
    }
  ],
  institutionalBacking: [
    {
      institutionName: 'Fairfax Financial Holdings',
      isForeign: true,
      investmentType: 'STRATEGIC_MAJORITY',
      date: '2024-04-15',
      amountCr: 1500,
      description: 'Fairfax committed strategic equity infusion post-event.'
    }
  ]
};

const turnaroundScore = computeDynamicPromoterScore(mockDistressedWithFairfax, '2026-09-04');
if (!turnaroundScore.hasForeignBacking) throw new Error('Expected hasForeignBacking to be true');
if (turnaroundScore.institutionalBackingBoost <= 0) throw new Error('Expected positive institutional backing boost');
if (turnaroundScore.turnaroundMitigationBonus <= 0) throw new Error('Expected turnaround mitigation bonus');
if (turnaroundScore.finalGovernanceScore < 65) throw new Error('Expected turnaround to elevate governance score');
console.log(`  ✓ Foreign institutional backing provided +${turnaroundScore.institutionalBackingBoost} pts boost and +${turnaroundScore.turnaroundMitigationBonus} pts turnaround mitigation\n`);

// Test 5: Continuous Mathematical Gradients
console.log('Test 5 — Continuous Mathematical Gradients on Tenure & Caps:');
const bbbScore = calculateCompositeFundamentalScore(bbbBond);
const primeScore = calculateCompositeFundamentalScore(primeBond);
if (bbbScore >= primeScore) throw new Error('Composite score for BBB bond should be lower than prime bond');

const scoreLow = 40;
const scoreMid = 68;
const scoreHigh = 95;

const tenureLow = getGradientPermissibleTenure(scoreLow, DEFAULT_HYPERPARAMETERS);
const tenureMid = getGradientPermissibleTenure(scoreMid, DEFAULT_HYPERPARAMETERS);
const tenureHigh = getGradientPermissibleTenure(scoreHigh, DEFAULT_HYPERPARAMETERS);

if (!(tenureLow < tenureMid && tenureMid < tenureHigh)) {
  throw new Error(`Gradient tenure must strictly increase with score: got ${tenureLow}m, ${tenureMid}m, ${tenureHigh}m`);
}

const capLow = getRiskAdjustedIssuerCap(bbbBond, 'AGGRESSIVE', DEFAULT_HYPERPARAMETERS, 1000000);
const capPrime = getRiskAdjustedIssuerCap(primeBond, 'AGGRESSIVE', DEFAULT_HYPERPARAMETERS, 1000000);

if (capLow.maxPercent >= capPrime.maxPercent) {
  throw new Error(`Continuous gradient cap for risky bond (${capLow.maxPercent}%) should be lower than prime (${capPrime.maxPercent}%)`);
}
console.log(`  ✓ Continuous gradient validated: Tenure (${tenureLow}m -> ${tenureMid}m -> ${tenureHigh}m), Caps (${capLow.maxPercent}% -> ${capPrime.maxPercent}%)\n`);

// Test 6: Proposal Group Allocations Aggregation
console.log('Test 6 — Group Level Allocation % Aggregation in Portfolio Builder:');
const fdRates = { t1: 6.5, t2: 7.0, t3: 7.25, t4: 7.5, t5: 7.5, t6: 7.5, t7: 7.5 };
const portfolio = generateBondPortfolio(
  DEFAULT_INVENTORY,
  1000000,
  fdRates,
  'A',
  undefined,
  8
);

if (!portfolio.groupAllocations || portfolio.groupAllocations.length === 0) {
  throw new Error('Expected portfolio.groupAllocations to be populated');
}
const totalGroupPct = portfolio.groupAllocations.reduce((sum, g) => sum + g.percent, 0);
if (Math.abs(totalGroupPct - 1.0) > 0.05) {
  throw new Error(`Total group allocation percent must sum to ~100%, got ${(totalGroupPct * 100).toFixed(1)}%`);
}
console.log(`  ✓ Successfully aggregated ${portfolio.groupAllocations.length} conglomerate groups totaling ${(totalGroupPct * 100).toFixed(1)}%\n`);

console.log('🎉 ALL FUNDAMENTAL RISK-ADJUSTED TENURE, TIME-DECAY & GRADIENT TESTS PASSED!\n');
