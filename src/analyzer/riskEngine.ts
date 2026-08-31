import { DefaultBond } from '../defaultInventory';
import {
  PortfolioHolding,
  PortfolioRiskAssessment,
  GroupExposure,
  ExitRecommendation,
  AddRecommendation,
  MaturityReinvestmentItem
} from './types';

/**
 * Perform comprehensive risk assessment of user's current bond portfolio.
 */
export function assessPortfolioRisk(holdings: PortfolioHolding[]): PortfolioRiskAssessment {
  if (holdings.length === 0) {
    return {
      totalHoldingsCount: 0,
      totalInvestedAmount: 0,
      weightedYieldPercent: 0,
      averageDurationMonths: 0,
      healthScore: 100,
      healthGrade: 'A+',
      groupExposures: [],
      ratingDistribution: {},
      ratingTrendBreakdown: {
        improvingAmount: 0,
        improvingPercent: 0,
        stableAmount: 0,
        stablePercent: 0,
        deterioratingAmount: 0,
        deterioratingPercent: 0
      },
      highRiskAlerts: []
    };
  }

  const totalInvestedAmount = holdings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);

  // 1. Group / Conglomerate Exposures
  const groupMap = new Map<string, { total: number; count: number; isins: string[] }>();
  holdings.forEach(h => {
    const grp = h.parentGroup || 'Independent';
    const curr = groupMap.get(grp) || { total: 0, count: 0, isins: [] };
    curr.total += h.estimatedMarketValue;
    curr.count += 1;
    curr.isins.push(h.isin);
    groupMap.set(grp, curr);
  });

  const groupExposures: GroupExposure[] = Array.from(groupMap.entries()).map(([parentGroup, data]) => {
    const pct = totalInvestedAmount > 0 ? (data.total / totalInvestedAmount) * 100 : 0;
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (pct > 30) riskLevel = 'CRITICAL';
    else if (pct > 20) riskLevel = 'HIGH';
    else if (pct > 12) riskLevel = 'MODERATE';

    return {
      parentGroup,
      totalAmount: data.total,
      percentage: pct,
      holdingCount: data.count,
      isins: data.isins,
      riskLevel
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  // 2. Rating Breakdown & Trend
  const ratingDistribution: Record<string, number> = {};
  let improvingAmount = 0;
  let stableAmount = 0;
  let deterioratingAmount = 0;

  let weightedYieldSum = 0;
  let weightedDurationSum = 0;

  holdings.forEach(h => {
    const r = h.rating || 'Unrated';
    ratingDistribution[r] = (ratingDistribution[r] || 0) + h.estimatedMarketValue;

    if (h.ratingTrend === 'improving') improvingAmount += h.estimatedMarketValue;
    else if (h.ratingTrend === 'deteriorating') deterioratingAmount += h.estimatedMarketValue;
    else stableAmount += h.estimatedMarketValue;

    weightedYieldSum += (h.yieldPercent || h.couponPercent) * h.estimatedMarketValue;
    weightedDurationSum += (h.monthsToMaturity || 12) * h.estimatedMarketValue;
  });

  const weightedYieldPercent = totalInvestedAmount > 0 ? weightedYieldSum / totalInvestedAmount : 0;
  const averageDurationMonths = totalInvestedAmount > 0 ? weightedDurationSum / totalInvestedAmount : 0;

  const improvingPercent = totalInvestedAmount > 0 ? (improvingAmount / totalInvestedAmount) * 100 : 0;
  const stablePercent = totalInvestedAmount > 0 ? (stableAmount / totalInvestedAmount) * 100 : 0;
  const deterioratingPercent = totalInvestedAmount > 0 ? (deterioratingAmount / totalInvestedAmount) * 100 : 0;

  // 3. Health Score Calculation (Starts at 100, penalized for risks)
  let healthScore = 100;
  const highRiskAlerts: string[] = [];

  // Deduct for Group Overconcentration
  groupExposures.forEach(g => {
    if (g.percentage > 30) {
      healthScore -= 25;
      highRiskAlerts.push(`🚨 Extreme Group Concentration: ${g.parentGroup} represents ${g.percentage.toFixed(1)}% of your portfolio (${g.holdingCount} holdings). Prudential cap is 15-20%.`);
    } else if (g.percentage > 20) {
      healthScore -= 12;
      highRiskAlerts.push(`⚠️ Elevated Group Concentration: ${g.parentGroup} represents ${g.percentage.toFixed(1)}% of your portfolio.`);
    }
  });

  // Deduct for Deteriorating Rating Trend
  if (deterioratingPercent > 25) {
    healthScore -= 20;
    highRiskAlerts.push(`⚠️ ${deterioratingPercent.toFixed(1)}% of invested capital is in issuers with negative/deteriorating credit rating trajectories or regulatory watch.`);
  } else if (deterioratingPercent > 10) {
    healthScore -= 10;
    highRiskAlerts.push(`⚠️ ${deterioratingPercent.toFixed(1)}% of portfolio is in issuers with deteriorating credit ratings.`);
  }

  // Deduct for Sub-par yield drag
  const subParHoldings = holdings.filter(h => h.couponPercent > 0 && h.couponPercent < 9.0);
  if (subParHoldings.length >= 3) {
    healthScore -= 8;
    highRiskAlerts.push(`💡 Yield Drag: ${subParHoldings.length} legacy holdings yield below 9.0%, dragging down portfolio returns compared to current 11-13% inventory.`);
  }

  healthScore = Math.max(10, Math.min(100, Math.round(healthScore)));

  let healthGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (healthScore >= 90) healthGrade = 'A+';
  else if (healthScore >= 80) healthGrade = 'A';
  else if (healthScore >= 70) healthGrade = 'B';
  else if (healthScore >= 60) healthGrade = 'C';
  else if (healthScore >= 50) healthGrade = 'D';
  else healthGrade = 'F';

  return {
    totalHoldingsCount: holdings.length,
    totalInvestedAmount,
    weightedYieldPercent,
    averageDurationMonths,
    healthScore,
    healthGrade,
    groupExposures,
    ratingDistribution,
    ratingTrendBreakdown: {
      improvingAmount,
      improvingPercent,
      stableAmount,
      stablePercent,
      deterioratingAmount,
      deterioratingPercent
    },
    highRiskAlerts
  };
}

/**
 * Identify bonds to EXIT with severity, category, and strategic rationale.
 */
export function generateExitRecommendations(
  holdings: PortfolioHolding[],
  assessment: PortfolioRiskAssessment
): ExitRecommendation[] {
  const recommendations: ExitRecommendation[] = [];

  holdings.forEach(h => {
    const secLower = ((h.rawSecurityName || '') + ' ' + h.securityName + ' ' + h.issuerName).toLowerCase();

    // Condition 1: Credit deterioration & Group Overconcentration (EFSL multiple holdings with negative outlook)
    if (secLower.includes('efsl') && (h.ratingTrend === 'deteriorating' || assessment.groupExposures.find(g => g.parentGroup.includes('Edelweiss'))?.percentage! > 20)) {
      recommendations.push({
        isin: h.isin,
        securityName: h.securityName,
        readableName: h.readableName,
        issuerName: h.issuerName,
        parentGroup: h.parentGroup,
        qty: h.qty,
        estimatedValue: h.estimatedMarketValue,
        couponPercent: h.couponPercent,
        rating: h.rating,
        ratingTrend: h.ratingTrend,
        severity: 'HIGH',
        category: 'GROUP_OVERCONCENTRATION',
        rationale: 'Elevated Edelweiss Group parent leverage and multi-ISIN clustering creates disproportionate single-promoter exposure with Negative agency outlook.',
        suggestedAction: 'Trim/Exit to bring total Edelweiss group exposure below 15% prudential ceiling.'
      });
      return;
    }

    // Condition 2: Sub-par coupon yield drag (<= 9.0%) (IBHFL 8.85%, ICCL 8.45%, SFIL 8.80%)
    if (h.couponPercent > 0 && h.couponPercent <= 9.0) {
      recommendations.push({
        isin: h.isin,
        securityName: h.securityName,
        readableName: h.readableName,
        issuerName: h.issuerName,
        parentGroup: h.parentGroup,
        qty: h.qty,
        estimatedValue: h.estimatedMarketValue,
        couponPercent: h.couponPercent,
        rating: h.rating,
        ratingTrend: h.ratingTrend,
        severity: 'MEDIUM',
        category: 'SUBPAR_YIELD',
        rationale: `Sub-par coupon (${h.couponPercent.toFixed(2)}%) delivers low cash yield. Market currently offers 11.0%–12.5% in comparable/higher credit grades.`,
        suggestedAction: 'Sell/Redeem to reinvest in 11.5%+ rated bonds to capture 250-350 bps yield pickup.'
      });
      return;
    }

    // Condition 3: Real estate development land SPV without top-tier guarantee
    if (secLower.includes('lucina') || secLower.includes('lldl')) {
      recommendations.push({
        isin: h.isin,
        securityName: h.securityName,
        readableName: h.readableName,
        issuerName: h.issuerName,
        parentGroup: h.parentGroup,
        qty: h.qty,
        estimatedValue: h.estimatedMarketValue,
        couponPercent: h.couponPercent,
        rating: h.rating,
        ratingTrend: h.ratingTrend,
        severity: 'MEDIUM',
        category: 'REAL_ESTATE_SECTOR_RISK',
        rationale: 'Subordinated project land cashflows; high 13.5% coupon compensates for development milestones, but exposure should be prudently capped.',
        suggestedAction: 'Maintain position if comfortable with project escrow; trim if seeking lower sector cyclicality.'
      });
      return;
    }

    // Condition 4: General Deteriorating rating trend
    if (h.ratingTrend === 'deteriorating') {
      recommendations.push({
        isin: h.isin,
        securityName: h.securityName,
        readableName: h.readableName,
        issuerName: h.issuerName,
        parentGroup: h.parentGroup,
        qty: h.qty,
        estimatedValue: h.estimatedMarketValue,
        couponPercent: h.couponPercent,
        rating: h.rating,
        ratingTrend: h.ratingTrend,
        severity: 'MEDIUM',
        category: 'CREDIT_DETERIORATION',
        rationale: 'Negative rating outlook / regulatory scrutiny indicates potential credit downgrade risk.',
        suggestedAction: 'Reallocate into stable AA/A+ rated issuers with clean balance sheets.'
      });
    }
  });

  return recommendations;
}

/**
 * Recommend high-quality bonds to ADD from current available inventory to rebalance and improve yield.
 */
export function generateAddRecommendations(
  holdings: PortfolioHolding[],
  availableInventory: DefaultBond[]
): AddRecommendation[] {
  const existingIsins = new Set(holdings.map(h => h.isin.toUpperCase()));
  const existingIssuers = new Set(holdings.map(h => h.issuerName.toLowerCase()));

  // Filter available inventory for top quality bonds not already owned
  const candidates = availableInventory.filter(b => {
    if (existingIsins.has(b.isin.toUpperCase())) return false;
    if (b.totalTradableQty !== undefined && b.totalTradableQty <= 0) return false;
    if (b.totalTradableFV !== undefined && b.totalTradableFV <= 0) return false;
    if (b.category && b.category.toLowerCase().includes('bundle')) return false;
    return b.yield >= 0.105; // At least 10.5% yield
  });

  // Sort candidates by yield and credit quality
  candidates.sort((a, b) => b.yield - a.yield);

  const adds: AddRecommendation[] = [];
  const selectedIssuers = new Set<string>();

  for (const cand of candidates) {
    if (adds.length >= 5) break;
    const issuerKey = cand.issuer.toLowerCase();
    if (selectedIssuers.has(issuerKey) || existingIssuers.has(issuerKey)) continue;

    let rationale = '';
    const yldPct = (cand.yield * 100).toFixed(2);
    if (cand.rating.includes('AAA') || cand.rating.includes('AA')) {
      rationale = `High-grade ${cand.rating} credit offering ${yldPct}% yield. Strengthens portfolio credit quality while adding non-correlated sector exposure.`;
    } else if (cand.frequency && cand.frequency.includes('MONTHLY')) {
      rationale = `Attractive ${yldPct}% yield with regular monthly cashflow distributions to enhance portfolio liquidity.`;
    } else {
      rationale = `Robust ${cand.rating} institutional issuer offering ${yldPct}% yield. Diversifies away from concentrated NBFC clusters.`;
    }

    adds.push({
      bond: cand,
      rationale,
      suggestedAllocation: 100000,
      targetTenureMonths: cand.months,
      projectedYield: cand.yield * 100,
      sector: cand.sector || 'Financial Services',
      rating: cand.rating
    });
    selectedIssuers.add(issuerKey);
  }

  return adds;
}

/**
 * Generate a chronological reinvestment schedule for bonds maturing in the upcoming 3 to 12 months.
 */
export function generateMaturityReinvestmentSchedule(
  holdings: PortfolioHolding[],
  availableInventory: DefaultBond[]
): MaturityReinvestmentItem[] {
  // Filter for holdings maturing within the next 14 months
  const maturingHoldings = holdings.filter(h => h.monthsToMaturity <= 14);
  maturingHoldings.sort((a, b) => a.monthsToMaturity - b.monthsToMaturity);

  const existingIsins = new Set(holdings.map(h => h.isin.toUpperCase()));

  // Find suitable replacement bonds with higher yields
  const replacementCandidates = availableInventory.filter(b => 
    !existingIsins.has(b.isin.toUpperCase()) &&
    b.yield >= 0.105 &&
    b.months >= 12 && b.months <= 36
  ).sort((a, b) => b.yield - a.yield);

  return maturingHoldings.map((h, idx) => {
    const replacement = replacementCandidates[idx % replacementCandidates.length] || null;
    const reinvestmentYield = replacement ? replacement.yield * 100 : 11.5;
    const yieldPickup = Math.max(0, reinvestmentYield - h.couponPercent);

    return {
      isin: h.isin,
      securityName: h.securityName,
      readableName: h.readableName,
      issuerName: h.issuerName,
      maturityDate: h.maturityDate,
      monthsAway: h.monthsToMaturity,
      cashInflowAmount: h.estimatedMarketValue,
      couponPercent: h.couponPercent,
      recommendedReplacement: replacement,
      reinvestmentYield,
      yieldPickup
    };
  });
}
