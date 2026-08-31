import {
  AdoptedRebalanceAction,
  PortfolioHolding,
  PortfolioRebalancePlan,
  PortfolioRiskAssessment
} from './types';
import { DefaultBond } from '../defaultInventory';

let adoptedActions: AdoptedRebalanceAction[] = [];

export function getAdoptedActions(): AdoptedRebalanceAction[] {
  return [...adoptedActions];
}

export function adoptRebalanceAction(
  sellHolding: PortfolioHolding,
  buyBond: DefaultBond,
  rationale: string
): AdoptedRebalanceAction {
  // Remove any existing action for this exact holding to avoid duplicates
  adoptedActions = adoptedActions.filter(a => a.sellHolding.isin !== sellHolding.isin);

  const buyYield = buyBond.yield * 100;
  const currentYield = sellHolding.yieldPercent || sellHolding.couponPercent;
  const yieldPickup = buyYield - currentYield;

  const newAction: AdoptedRebalanceAction = {
    id: `rebal_${sellHolding.isin}_${Date.now()}`,
    sellHolding,
    buyBond,
    replacementValue: sellHolding.estimatedMarketValue,
    yieldPickup,
    rationale,
    adoptedAt: new Date().toISOString()
  };

  adoptedActions.push(newAction);
  return newAction;
}

export function removeAdoptedAction(actionId: string): void {
  adoptedActions = adoptedActions.filter(a => a.id !== actionId);
}

export function clearRebalancingPlan(): void {
  adoptedActions = [];
}

export function calculateRebalancePlanImpact(
  originalHoldings: PortfolioHolding[],
  originalAssessment: PortfolioRiskAssessment | null
): PortfolioRebalancePlan {
  const totalVal = originalHoldings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);
  const origWeightedYield = originalAssessment?.weightedYieldPercent || 0;
  const origHealthScore = originalAssessment?.healthScore || 50;

  if (adoptedActions.length === 0 || totalVal === 0) {
    return {
      actions: [],
      projectedTotalValue: totalVal,
      originalWeightedYield: origWeightedYield,
      projectedWeightedYield: origWeightedYield,
      yieldDelta: 0,
      originalHealthScore: origHealthScore,
      projectedHealthScore: origHealthScore
    };
  }

  // Create simulated portfolio post-swaps
  const swapMap = new Map<string, AdoptedRebalanceAction>();
  adoptedActions.forEach(a => swapMap.set(a.sellHolding.isin, a));

  let projectedIncome = 0;
  let exitScoreBonus = 0;

  originalHoldings.forEach(h => {
    const swap = swapMap.get(h.isin);
    if (swap) {
      // Replaced by new bond
      const newYieldPct = swap.buyBond.yield * 100;
      projectedIncome += (h.estimatedMarketValue * (newYieldPct / 100));
      // Exiting risky EFSL or sub-par bond adds health points
      if (h.ratingTrend === 'deteriorating' || h.couponPercent < 9.0) {
        exitScoreBonus += 5;
      }
    } else {
      projectedIncome += (h.estimatedMarketValue * (h.yieldPercent / 100));
    }
  });

  const projectedWeightedYield = totalVal > 0 ? (projectedIncome / totalVal) * 100 : origWeightedYield;
  const yieldDelta = projectedWeightedYield - origWeightedYield;
  const projectedHealthScore = Math.min(95, Math.round(origHealthScore + exitScoreBonus + (yieldDelta > 0 ? 4 : 0)));

  return {
    actions: [...adoptedActions],
    projectedTotalValue: totalVal,
    originalWeightedYield: origWeightedYield,
    projectedWeightedYield,
    yieldDelta,
    originalHealthScore: origHealthScore,
    projectedHealthScore
  };
}

export function generateRebalancePlanCsvContent(
  plan: PortfolioRebalancePlan,
  originalHoldings: PortfolioHolding[]
): string {
  const rows: string[][] = [
    ['PORTFOLIO STRATEGIC REBALANCING & SWAP RECOMMENDATIONS'],
    ['Generated Date', new Date().toISOString().split('T')[0]],
    ['Total Adopted Swaps', plan.actions.length.toString()],
    ['Portfolio Total Value (₹ Lakhs)', ((plan.projectedTotalValue) / 100000).toFixed(2)],
    ['Original Weighted Yield (%)', `${plan.originalWeightedYield.toFixed(2)}%`],
    ['Projected Rebalanced Yield (%)', `${plan.projectedWeightedYield.toFixed(2)}%`],
    ['Net Yield Pickup (%)', `${plan.yieldDelta >= 0 ? '+' : ''}${plan.yieldDelta.toFixed(2)}%`],
    ['Original Health Score', `${plan.originalHealthScore}/100`],
    ['Projected Health Score', `${plan.projectedHealthScore}/100`],
    [],
    ['--- ADOPTED PORTFOLIO REBALANCING ACTIONS ---'],
    [
      'Action ID',
      'Sell ISIN',
      'Sell Security Name',
      'Sell Coupon (%)',
      'Sell Rating',
      'Capital Reallocated (₹)',
      'Buy ISIN',
      'Buy Security / Issuer',
      'Buy Projected Yield (%)',
      'Buy Rating',
      'Yield Pickup (%)',
      'Strategic Rationale'
    ]
  ];

  plan.actions.forEach(a => {
    rows.push([
      a.id,
      a.sellHolding.isin,
      `"${a.sellHolding.readableName || a.sellHolding.securityName}"`,
      a.sellHolding.couponPercent.toFixed(2),
      a.sellHolding.rating,
      a.replacementValue.toString(),
      a.buyBond.isin,
      `"${a.buyBond.issuer}"`,
      (a.buyBond.yield * 100).toFixed(2),
      a.buyBond.rating,
      `${a.yieldPickup >= 0 ? '+' : ''}${a.yieldPickup.toFixed(2)}%`,
      `"${a.rationale}"`
    ]);
  });

  rows.push([]);
  rows.push(['--- COMPLETE CURRENT PORTFOLIO ROSTER ---']);
  rows.push(['ISIN', 'Security Name', 'Parent Group', 'Sector', 'Sub-Sector', 'Qty', 'Face Value (₹)', 'Est Value (₹)', 'Weight (%)', 'Coupon (%)', 'Rating']);
  originalHoldings.forEach(h => {
    rows.push([
      h.isin,
      `"${h.readableName || h.securityName}"`,
      `"${h.parentGroup}"`,
      `"${h.broadSector || h.sector}"`,
      `"${h.subSector || ''}"`,
      h.qty.toString(),
      h.faceValue.toString(),
      h.estimatedMarketValue.toString(),
      h.weightPercent.toFixed(1),
      h.couponPercent.toFixed(2),
      h.rating
    ]);
  });

  return rows.map(r => r.join(',')).join('\n');
}
