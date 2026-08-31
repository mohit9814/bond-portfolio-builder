import { DEFAULT_INVENTORY } from '../defaultInventory';
import { parsePortfolioInput, SAMPLE_PORTFOLIO_RAW } from './portfolioParser';
import { getIssuerKnowledge } from './issuerKnowledgeDatabase';
import {
  assessPortfolioRisk,
  generateExitRecommendations,
  generateAddRecommendations,
  generateMaturityReinvestmentSchedule
} from './riskEngine';

// Mock localStorage for Node test runner
const mockStore: Record<string, string> = {};
if (typeof localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => mockStore[k] || null,
    setItem: (k: string, v: string) => { mockStore[k] = v; },
    removeItem: (k: string) => { delete mockStore[k]; },
    clear: () => { for (const k in mockStore) delete mockStore[k]; }
  };
}

console.log('\n=== Running Current Bond Portfolio Analyzer & Rebalancer Test Suite ===\n');

// Test 1
{
  const holdings = parsePortfolioInput(SAMPLE_PORTFOLIO_RAW, DEFAULT_INVENTORY);
  if (holdings.length !== 21) {
    throw new Error(`Expected 21 parsed holdings, got ${holdings.length}`);
  }

  const isins = holdings.map(h => h.isin);
  const requiredIsins = ['INE00DJ07052', 'INE01YL07383', 'INE0BUS07BQ9', 'INE148I07GK5', 'INE532F07DG1', 'INE549K07EU4'];
  for (const req of requiredIsins) {
    if (!isins.includes(req)) {
      throw new Error(`Missing expected ISIN: ${req}`);
    }
  }

  const tapir = holdings.find(h => h.isin === 'INE00DJ07052');
  if (tapir?.qty !== 6) throw new Error(`Expected Tapir qty=6, got ${tapir?.qty}`);

  const efslZero = holdings.find(h => h.isin === 'INE532F07DG1');
  if (efslZero?.qty !== 894 || efslZero?.couponPercent !== 0) {
    throw new Error(`Expected EFSL zero coupon qty=894, coupon=0%, got qty=${efslZero?.qty}, coupon=${efslZero?.couponPercent}%`);
  }

  const totalWeight = holdings.reduce((sum, h) => sum + h.weightPercent, 0);
  if (Math.abs(totalWeight - 100) > 0.5) {
    throw new Error(`Expected total weight ~100%, got ${totalWeight}`);
  }

  console.log('Test 1 — Ingestion & Multi-Format Parser: 21 holdings parsed, enriched with quantities & zero coupon detection ✓');
}

// Test 2
{
  const efslKnowledge = getIssuerKnowledge('EFSL-10.10%-29-4-29-NCD INE532F07FI2');
  if (!efslKnowledge.parentGroup.includes('Edelweiss') || efslKnowledge.ratingTrend !== 'deteriorating') {
    throw new Error(`EFSL Knowledge incorrect: ${JSON.stringify(efslKnowledge)}`);
  }

  const iihflKnowledge = getIssuerKnowledge('IIHFL INE477L08147');
  if (!iihflKnowledge.parentGroup.includes('IIFL') || iihflKnowledge.ratingTrend !== 'improving') {
    throw new Error(`IIHFL Knowledge incorrect: ${JSON.stringify(iihflKnowledge)}`);
  }

  const tapirKnowledge = getIssuerKnowledge('TAPIR CONSTRUCTIONS LTD INE00DJ07052');
  if (!tapirKnowledge.parentGroup.includes('Sammaan') || tapirKnowledge.ratingTrend !== 'deteriorating') {
    throw new Error(`Tapir Knowledge incorrect: ${JSON.stringify(tapirKnowledge)}`);
  }

  const fibeKnowledge = getIssuerKnowledge('ESPL-10.70%-5-3-27-PVT INE01YL07383');
  if (!fibeKnowledge.parentGroup.includes('Fibe') || fibeKnowledge.ratingTrend !== 'improving') {
    throw new Error(`Fibe Knowledge incorrect: ${JSON.stringify(fibeKnowledge)}`);
  }

  console.log('Test 2 — Issuer Knowledge Database & Fundamental Intelligence: Parent mapping and rating trends verified ✓');
}

// Test 3
{
  const holdings = parsePortfolioInput(SAMPLE_PORTFOLIO_RAW, DEFAULT_INVENTORY);
  const assessment = assessPortfolioRisk(holdings);

  if (assessment.totalHoldingsCount !== 21) {
    throw new Error(`Expected 21 holdings count, got ${assessment.totalHoldingsCount}`);
  }
  if (assessment.totalInvestedAmount <= 0) {
    throw new Error(`Invalid total invested amount: ${assessment.totalInvestedAmount}`);
  }
  if (assessment.weightedYieldPercent < 8.0 || assessment.weightedYieldPercent > 15.0) {
    throw new Error(`Unrealistic weighted yield: ${assessment.weightedYieldPercent}%`);
  }

  const groupNames = assessment.groupExposures.map(g => g.parentGroup);
  if (!groupNames.some(g => g.includes('Edelweiss')) || !groupNames.some(g => g.includes('Sammaan'))) {
    throw new Error(`Failed to detect major group clusters in: ${groupNames.join(', ')}`);
  }

  if (assessment.highRiskAlerts.length === 0) {
    throw new Error('Expected risk alerts to be generated for concentrated portfolio');
  }

  console.log(`Test 3 — Risk Assessment Engine: Health Score=${assessment.healthScore} (${assessment.healthGrade}), Weighted Yield=${assessment.weightedYieldPercent.toFixed(2)}%, Duration=${(assessment.averageDurationMonths/12).toFixed(1)}y ✓`);
}

// Test 4
{
  const holdings = parsePortfolioInput(SAMPLE_PORTFOLIO_RAW, DEFAULT_INVENTORY);
  const assessment = assessPortfolioRisk(holdings);
  const exits = generateExitRecommendations(holdings, assessment);

  if (exits.length < 4) {
    throw new Error(`Expected at least 4 exit recommendations, got ${exits.length}`);
  }

  const exitIsins = exits.map(e => e.isin);
  // Real Estate SPV exits
  if (!exitIsins.includes('INE00DJ07052') || !exitIsins.includes('INE0JZO07032')) {
    throw new Error('Expected Tapir and Lucina real estate exits to be flagged');
  }

  // Sub-par yield drag exits (< 9.0%)
  if (!exitIsins.includes('INE148I07GK5') || !exitIsins.includes('INE244L08034') || !exitIsins.includes('INE244L08059')) {
    throw new Error('Expected sub-9% yield drag bonds to be flagged');
  }

  const tapirExit = exits.find(e => e.isin === 'INE00DJ07052');
  if (tapirExit?.severity !== 'HIGH' || tapirExit?.category !== 'REAL_ESTATE_SECTOR_RISK') {
    throw new Error(`Tapir exit metadata incorrect: ${JSON.stringify(tapirExit)}`);
  }

  console.log(`Test 4 — Exit Recommendations: ${exits.length} holdings successfully flagged for strategic rotation (Tapir, Lucina, low-yield IBHFL/SFIL/ICCL) ✓`);
}

// Test 5
{
  const holdings = parsePortfolioInput(SAMPLE_PORTFOLIO_RAW, DEFAULT_INVENTORY);
  const adds = generateAddRecommendations(holdings, DEFAULT_INVENTORY);

  if (adds.length < 3 || adds.length > 5) {
    throw new Error(`Expected between 3 and 5 additions, got ${adds.length}`);
  }

  const existingIsins = new Set(holdings.map(h => h.isin.toUpperCase()));
  for (const add of adds) {
    if (existingIsins.has(add.bond.isin.toUpperCase())) {
      throw new Error(`Add recommendation duplicated existing holding: ${add.bond.isin}`);
    }
    if (add.projectedYield < 10.5) {
      throw new Error(`Add recommendation yield too low: ${add.projectedYield}%`);
    }
  }

  console.log(`Test 5 — Add Recommendations: ${adds.length} high-grade replacement bonds selected from active inventory (Avg Yield: ${(adds.reduce((s, a) => s + a.projectedYield, 0)/adds.length).toFixed(2)}%) ✓`);
}

// Test 6
{
  const holdings = parsePortfolioInput(SAMPLE_PORTFOLIO_RAW, DEFAULT_INVENTORY);
  const maturities = generateMaturityReinvestmentSchedule(holdings, DEFAULT_INVENTORY);

  if (maturities.length === 0) {
    throw new Error('Expected upcoming maturities to be detected');
  }

  for (let i = 0; i < maturities.length - 1; i++) {
    if (maturities[i].monthsAway > maturities[i + 1].monthsAway) {
      throw new Error('Upcoming maturities not sorted chronologically');
    }
  }

  for (const m of maturities) {
    if (m.cashInflowAmount <= 0) throw new Error(`Invalid maturity cash inflow: ${m.cashInflowAmount}`);
    if (m.reinvestmentYield < 10.5) throw new Error(`Low reinvestment yield: ${m.reinvestmentYield}%`);
  }

  console.log(`Test 6 — Maturity Radar & Reinvestment: ${maturities.length} upcoming maturities mapped with automated reinvestment plans ✓`);
}

console.log('\nAll 6 Current Bond Portfolio Analyzer Test Suites Passed Successfully! ✓\n');

