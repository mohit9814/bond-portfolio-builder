import { DefaultBond } from '../defaultInventory';
import { PortfolioHolding } from '../analyzer/types';
import { getUnitPrice } from '../bondEngine';
import { ClientPortfolio, PurchaseAllocationPlan, PurchaseRecommendation, ClientRiskProfile } from './types';

export interface PurchaseRecommenderOptions {
  minYield?: number;
  maxTenureMonths?: number;
  minRating?: string;
  maxPerIssuerPercent?: number;
}

export function generatePurchaseSuggestions(
  portfolioOrHoldings: ClientPortfolio | PortfolioHolding[],
  inventory: DefaultBond[],
  customCash?: number,
  options?: PurchaseRecommenderOptions
): PurchaseAllocationPlan {
  const isClientObj = 'holdings' in portfolioOrHoldings;
  const holdings: PortfolioHolding[] = isClientObj ? portfolioOrHoldings.holdings : portfolioOrHoldings;
  const availableCash = customCash !== undefined
    ? customCash
    : (isClientObj ? portfolioOrHoldings.availableCash : 500000);
  const riskProfile: ClientRiskProfile = isClientObj ? portfolioOrHoldings.riskProfile : 'BALANCED';

  const totalCurrentValue = holdings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);
  const currentWeightedYield = totalCurrentValue > 0
    ? holdings.reduce((sum, h) => sum + (h.yieldPercent * h.estimatedMarketValue), 0) / totalCurrentValue
    : 10.0;

  if (availableCash <= 0 || inventory.length === 0) {
    return {
      clientId: isClientObj ? portfolioOrHoldings.id : undefined,
      availableCash,
      totalDeployed: 0,
      remainingCash: availableCash,
      recommendations: [],
      originalYield: currentWeightedYield,
      projectedNewYield: currentWeightedYield,
      yieldPickup: 0
    };
  }

  // 1. Identify Existing ISINs and Promoter Group Weights
  const existingIsins = new Set(holdings.map(h => h.isin.toUpperCase()));
  const groupWeights = new Map<string, number>();

  holdings.forEach(h => {
    const grp = (h.parentGroup || h.issuerName).toLowerCase();
    const curr = groupWeights.get(grp) || 0;
    groupWeights.set(grp, curr + h.estimatedMarketValue);
  });

  // 2. Filter Candidate Bonds from Active Inventory
  const candidates = inventory.filter(b => {
    if (!b.isin || existingIsins.has(b.isin.toUpperCase())) return false;
    if (b.yield <= 0) return false;

    const unitPrice = getUnitPrice(b);
    if (unitPrice > availableCash) return false;

    // Filter by Client Risk Profile
    if (riskProfile === 'CONSERVATIVE') {
      if (!b.rating.includes('AAA') && !b.rating.includes('AA')) return false;
    } else if (riskProfile === 'BALANCED') {
      if (b.rating.includes('BBB-') || b.rating.includes('BB')) return false;
    }

    if (options?.minYield && (b.yield * 100) < options.minYield) return false;
    if (options?.maxTenureMonths && b.months > options.maxTenureMonths) return false;

    return true;
  });

  // 3. Score & Rank Candidates
  const scoredCandidates = candidates.map(b => {
    const yieldPct = b.yield * 100;
    const unitPrice = getUnitPrice(b);
    const grp = (b.issuer || '').toLowerCase();
    const existingGrpExposure = groupWeights.get(grp) || 0;
    const existingGrpPct = totalCurrentValue > 0 ? (existingGrpExposure / totalCurrentValue) * 100 : 0;

    let score = yieldPct * 6; // Yield weight

    // Rating quality score
    if (b.rating.includes('AAA')) score += 20;
    else if (b.rating.includes('AA+')) score += 16;
    else if (b.rating.includes('AA')) score += 12;
    else if (b.rating.includes('A')) score += 6;

    // Diversification bonus
    if (existingGrpPct === 0) score += 15; // Brand new promoter group
    else if (existingGrpPct > 15) score -= 25; // Already heavily concentrated

    // Liquidity / Cashflow bonus
    if (b.frequency && b.frequency.includes('MONTHLY')) score += 5;

    // Tenure sweet spot (12 - 36 months)
    if (b.months >= 12 && b.months <= 36) score += 5;

    return { bond: b, score, unitPrice };
  }).sort((a, b) => b.score - a.score);

  // 4. Allocate Available Cash Across Top Candidates (Max 3-4 diverse additions)
  let cashRemaining = availableCash;
  const recommendations: PurchaseRecommendation[] = [];
  const selectedIssuers = new Set<string>();

  const maxPositions = availableCash >= 1500000 ? 4 : (availableCash >= 500000 ? 3 : 2);
  const targetPerPosition = availableCash / maxPositions;

  for (const item of scoredCandidates) {
    if (recommendations.length >= maxPositions) break;
    if (cashRemaining < item.unitPrice) continue;

    const issuerKey = item.bond.issuer.toLowerCase().split(' ')[0];
    if (selectedIssuers.has(issuerKey)) continue;

    // Calculate maximum integer units we can buy within target budget
    const maxAffordableUnits = Math.floor(cashRemaining / item.unitPrice);
    const desiredUnits = Math.max(1, Math.floor(targetPerPosition / item.unitPrice));
    const suggestedUnits = Math.min(maxAffordableUnits, desiredUnits);

    if (suggestedUnits <= 0) continue;

    const allocatedAmount = suggestedUnits * item.unitPrice;
    cashRemaining -= allocatedAmount;
    selectedIssuers.add(issuerKey);

    const projectedYield = item.bond.yield * 100;
    const yieldSpreadVsPortfolio = projectedYield - currentWeightedYield;

    const diversificationGain = `Introduces high-quality ${item.bond.sector || 'Financial Services'} paper (${item.bond.rating}) with 0% overlap with existing promoter groups.`;
    const riskFitRationale = `Rated ${item.bond.rating} matching the client's ${riskProfile} risk mandate.`;
    const tenureFitRationale = `Maturing in ${item.bond.months} months, providing structured medium-term liquidity.`;

    recommendations.push({
      bond: item.bond,
      score: Math.round(item.score),
      unitPrice: item.unitPrice,
      suggestedUnits,
      allocatedAmount,
      projectedYield,
      yieldSpreadVsPortfolio,
      diversificationGain,
      riskFitRationale,
      tenureFitRationale
    });
  }

  const totalDeployed = availableCash - cashRemaining;
  const newTotalVal = totalCurrentValue + totalDeployed;
  const projectedIncome = (totalCurrentValue * (currentWeightedYield / 100)) +
    recommendations.reduce((sum, r) => sum + (r.allocatedAmount * (r.projectedYield / 100)), 0);

  const projectedNewYield = newTotalVal > 0 ? (projectedIncome / newTotalVal) * 100 : currentWeightedYield;
  const yieldPickup = projectedNewYield - currentWeightedYield;

  return {
    clientId: isClientObj ? portfolioOrHoldings.id : undefined,
    availableCash,
    totalDeployed,
    remainingCash: cashRemaining,
    recommendations,
    originalYield: currentWeightedYield,
    projectedNewYield,
    yieldPickup
  };
}
