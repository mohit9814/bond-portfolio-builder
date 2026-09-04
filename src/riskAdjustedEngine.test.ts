import {
  assessBondFundamentalRisk,
  getRiskAdjustedIssuerCap,
  getCleanRatingSymbol
} from './riskAdjustedEngine';
import { DEFAULT_HYPERPARAMETERS } from './engineSettingsManager';
import { DEFAULT_INVENTORY } from './defaultInventory';

console.log('\n=== Running Fundamental Risk-Adjusted Tenure & Investor Concentration Tests ===\n');

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
if (bbbAssessment.maxPermissibleTenureMonths !== 18.0) throw new Error(`Expected 18.0m max tenure for BBB, got ${bbbAssessment.maxPermissibleTenureMonths}`);

const primeAssessment = assessBondFundamentalRisk(primeBond, DEFAULT_HYPERPARAMETERS);
if (primeAssessment.tier !== 'PRIME') throw new Error('Sovereign bond must be categorized as PRIME');
if (primeAssessment.maxPermissibleTenureMonths !== 120) throw new Error('Prime bond should have full tenure eligibility');
console.log('  ✓ Higher risk bond tenure successfully capped at 18m vs 120m for Prime\n');

// Test 3: Investor Risk Profile Concentration Scaling
console.log('Test 3 — Higher Risk Appetite -> Lower Concentration of Risky Bonds:');
const aggressiveCap = getRiskAdjustedIssuerCap(bbbBond, 'AGGRESSIVE', DEFAULT_HYPERPARAMETERS, 1000000);
if (aggressiveCap.maxPercent !== 8.0) throw new Error(`Expected 8.0% cap on high-risk bond in aggressive portfolio, got ${aggressiveCap.maxPercent}%`);
if (aggressiveCap.maxRupeeCap !== 80000) throw new Error(`Expected ₹80k max cap on ₹10L portfolio, got ${aggressiveCap.maxRupeeCap}`);

const conservativeCap = getRiskAdjustedIssuerCap(bbbBond, 'CONSERVATIVE', DEFAULT_HYPERPARAMETERS, 1000000);
if (conservativeCap.maxPercent !== 0) throw new Error('High-risk bond should be 0% in conservative portfolio');

const primeAggressiveCap = getRiskAdjustedIssuerCap(primeBond, 'AGGRESSIVE', DEFAULT_HYPERPARAMETERS, 1000000);
if (primeAggressiveCap.maxPercent !== 15.0) throw new Error('Prime bond should retain full 15% standard cap in aggressive portfolio');
console.log('  ✓ Aggressive portfolio enforces 8% granular cap on risky bonds while retaining 15% on Prime\n');

// Test 4: Configurable Hyperparameter Flag Overrides
console.log('Test 4 — Configurable Risk Parameter Overrides:');
const customHp = {
  ...DEFAULT_HYPERPARAMETERS,
  enableFundamentalTenureCapping: false,
  enableInvestorRiskConcentration: false
};

const disabledTenureAssessment = assessBondFundamentalRisk(bbbBond, customHp);
if (disabledTenureAssessment.maxPermissibleTenureMonths !== 120) {
  throw new Error('When tenure capping is disabled, max tenure should be 120m');
}

const disabledConcCap = getRiskAdjustedIssuerCap(bbbBond, 'AGGRESSIVE', customHp, 1000000);
if (disabledConcCap.maxPercent !== 15.0) {
  throw new Error('When risk concentration is disabled, standard cap 15% should apply');
}
console.log('  ✓ Configurable risk parameter flags successfully override engine rules\n');

console.log('🎉 ALL FUNDAMENTAL RISK-ADJUSTED TENURE & INVESTOR CONCENTRATION TESTS PASSED!\n');
