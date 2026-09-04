import { DefaultBond } from '../defaultInventory';
import { assessPortfolioRisk } from '../analyzer/riskEngine';
import { resolveBondEntity } from '../entityResolver';
import {
  ClientPortfolio,
  MultiClientAggregateSummary,
  CrossClientPromoterExposure,
  FirmUpcomingMaturityItem,
  UniversalBatchAction
} from './types';

export function calculateAggregateClientMetrics(
  clients: ClientPortfolio[],
  inventory: DefaultBond[]
): MultiClientAggregateSummary {
  if (clients.length === 0) {
    return {
      totalClients: 0,
      totalFirmAUA: 0,
      totalHoldingsCount: 0,
      firmWeightedYield: 0,
      firmAverageHealthScore: 100,
      totalAvailableCash: 0,
      total90DayMaturityInflow: 0,
      total180DayMaturityInflow: 0,
      total365DayMaturityInflow: 0,
      crossClientPromoterExposures: [],
      firmUpcomingMaturities: [],
      batchActions: []
    };
  }

  let totalHoldingsCount = 0;
  let totalInvestedAmount = 0;
  let totalAvailableCash = 0;
  let weightedIncomeSum = 0;
  let healthScoreSum = 0;

  const promoterMap = new Map<string, {
    total: number;
    clientIds: Set<string>;
    clientNames: Set<string>;
    holdingCount: number;
    sampleIsin?: string;
  }>();

  const firmUpcomingMaturities: FirmUpcomingMaturityItem[] = [];
  const exitHoldingMap = new Map<string, {
    isin: string;
    issuerName: string;
    rating: string;
    coupon: number;
    rationale: string;
    urgency: 'HIGH' | 'MEDIUM';
    clients: Array<{ clientId: string; clientName: string; value: number }>;
  }>();

  // 1. Process Each Client
  clients.forEach(client => {
    totalAvailableCash += client.availableCash || 0;
    const clientVal = client.holdings.reduce((s, h) => s + h.estimatedMarketValue, 0);
    totalInvestedAmount += clientVal;
    totalHoldingsCount += client.holdings.length;

    // Health Score
    const assessment = assessPortfolioRisk(client.holdings);
    healthScoreSum += assessment.healthScore;

    // Weighted Yield
    client.holdings.forEach(h => {
      weightedIncomeSum += h.estimatedMarketValue * (h.yieldPercent / 100);
      const entity = resolveBondEntity(h);

      // Group Aggregate
      const grp = entity.canonicalEntityName || h.parentGroup || 'Independent';
      const pData = promoterMap.get(grp) || {
        total: 0,
        clientIds: new Set<string>(),
        clientNames: new Set<string>(),
        holdingCount: 0,
        sampleIsin: h.isin
      };
      pData.total += h.estimatedMarketValue;
      pData.clientIds.add(client.id);
      pData.clientNames.add(client.clientName);
      pData.holdingCount += 1;
      if (!pData.sampleIsin) pData.sampleIsin = h.isin;
      promoterMap.set(grp, pData);

      // Maturities Radar (Upcoming within 14 months)
      if (h.monthsToMaturity <= 14) {
        firmUpcomingMaturities.push({
          id: `mat_${client.id}_${h.isin}`,
          clientId: client.id,
          clientName: client.clientName,
          isin: h.isin,
          securityName: h.readableName || h.securityName,
          maturityDate: h.maturityDate,
          monthsAway: h.monthsToMaturity,
          inflowAmount: h.estimatedMarketValue,
          couponPercent: h.couponPercent,
          reinvestmentYield: 11.5,
          yieldPickup: Math.max(0, 11.5 - h.couponPercent)
        });
      }

      // Detect Exits for Batch Actions (Forensic Risk, Rating Deterioration, or Sub-9% Yield)
      const isCriticalOrHighRisk = entity.riskSeverity === 'CRITICAL' || entity.riskSeverity === 'HIGH';
      if (isCriticalOrHighRisk || h.ratingTrend === 'deteriorating' || h.couponPercent < 9.0) {
        let exitRationale = '';
        let exitUrgency: 'HIGH' | 'MEDIUM' = 'MEDIUM';

        if (entity.riskSeverity === 'CRITICAL') {
          exitRationale = `CRITICAL Promoter Governance Risk (Score: ${entity.governanceScore}/100): ${entity.promoterRecord?.exclusionReason || entity.promoterRecord?.regulatoryActions || 'Regulatory supervision order / litigation'}`;
          exitUrgency = 'HIGH';
        } else if (entity.riskSeverity === 'HIGH') {
          exitRationale = `High Governance Scrutiny (Score: ${entity.governanceScore}/100): ${entity.promoterRecord?.exclusionReason || entity.promoterRecord?.regulatoryActions || 'Negative media flags'}`;
          exitUrgency = 'HIGH';
        } else if (h.ratingTrend === 'deteriorating') {
          exitRationale = 'Credit rating deterioration with negative agency outlook';
          exitUrgency = 'HIGH';
        } else {
          exitRationale = 'Sub-9% yield drag vs market opportunities';
          exitUrgency = 'MEDIUM';
        }

        const exitEntry = exitHoldingMap.get(h.isin) || {
          isin: h.isin,
          issuerName: h.issuerName || h.readableName || h.securityName,
          rating: h.rating,
          coupon: h.couponPercent,
          rationale: exitRationale,
          urgency: exitUrgency,
          clients: []
        };
        exitEntry.clients.push({
          clientId: client.id,
          clientName: client.clientName,
          value: h.estimatedMarketValue
        });
        exitHoldingMap.set(h.isin, exitEntry);
      }
    });
  });

  const totalFirmAUA = totalInvestedAmount + totalAvailableCash;
  const firmWeightedYield = totalInvestedAmount > 0 ? (weightedIncomeSum / totalInvestedAmount) * 100 : 0;
  const firmAverageHealthScore = Math.round(healthScoreSum / clients.length);

  // 2. Sort & Structure Cross-Client Promoter Exposure
  const crossClientPromoterExposures: CrossClientPromoterExposure[] = Array.from(promoterMap.entries())
    .map(([parentGroup, data]) => {
      const percentageOfFirmAUA = totalFirmAUA > 0 ? (data.total / totalFirmAUA) * 100 : 0;
      const grpEntity = resolveBondEntity(data.sampleIsin || parentGroup);
      
      let riskSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (grpEntity.riskSeverity === 'CRITICAL' || percentageOfFirmAUA > 25) {
        riskSeverity = 'CRITICAL';
      } else if (grpEntity.riskSeverity === 'HIGH' || percentageOfFirmAUA > 18) {
        riskSeverity = 'HIGH';
      } else if (grpEntity.riskSeverity === 'MODERATE' || percentageOfFirmAUA > 10) {
        riskSeverity = 'MODERATE';
      }

      return {
        parentGroup,
        totalAmount: data.total,
        percentageOfFirmAUA,
        clientCount: data.clientIds.size,
        holdingCount: data.holdingCount,
        affectedClientNames: Array.from(data.clientNames),
        riskSeverity,
        governanceScore: grpEntity.governanceScore,
        promoterRiskSeverity: grpEntity.riskSeverity
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 3. Chronological Upcoming Maturities and Horizon Totals
  firmUpcomingMaturities.sort((a, b) => a.monthsAway - b.monthsAway);

  // Find suitable replacement bonds for maturities from inventory
  firmUpcomingMaturities.forEach((m) => {
    const replacement = inventory.find(b => {
      if (b.yield < 0.11 || b.months < 12 || b.months > 36) return false;
      const bEntity = resolveBondEntity(b);
      return bEntity.riskSeverity !== 'CRITICAL' && bEntity.riskSeverity !== 'HIGH';
    });
    if (replacement) {
      m.suggestedReinvestmentBond = replacement;
      m.reinvestmentYield = replacement.yield * 100;
      m.yieldPickup = Math.max(0, (replacement.yield * 100) - m.couponPercent);
    }
  });

  const total90DayMaturityInflow = firmUpcomingMaturities
    .filter(m => m.monthsAway <= 3)
    .reduce((s, m) => s + m.inflowAmount, 0);

  const total180DayMaturityInflow = firmUpcomingMaturities
    .filter(m => m.monthsAway <= 6)
    .reduce((s, m) => s + m.inflowAmount, 0);

  const total365DayMaturityInflow = firmUpcomingMaturities
    .filter(m => m.monthsAway <= 12)
    .reduce((s, m) => s + m.inflowAmount, 0);

  // 4. Formulate Universal Batch Actions
  const batchActions: UniversalBatchAction[] = [];

  // Batch Exits
  exitHoldingMap.forEach(e => {
    const totalVal = e.clients.reduce((s, c) => s + c.value, 0);
    batchActions.push({
      type: 'EXIT',
      isin: e.isin,
      issuerName: e.issuerName,
      rating: e.rating,
      yieldOrCoupon: e.coupon,
      affectedClients: e.clients.map(c => ({
        clientId: c.clientId,
        clientName: c.clientName,
        holdingValueOrSuggestedAmount: c.value
      })),
      totalFirmAmount: totalVal,
      rationale: e.rationale,
      urgency: e.urgency
    });
  });

  // Batch Buys from Inventory (Top high-yield, clean-governance opportunities across firm)
  const topBuys = inventory
    .filter(b => {
      if (b.yield < 0.115 || !b.rating.includes('A')) return false;
      const bEnt = resolveBondEntity(b);
      return bEnt.riskSeverity !== 'CRITICAL' && bEnt.riskSeverity !== 'HIGH';
    })
    .slice(0, 3);

  topBuys.forEach(b => {
    const buyYield = b.yield * 100;
    const eligibleClients = clients.filter(c => c.availableCash >= 100000);
    const suggestedPerClient = 200000;
    const totalPossible = eligibleClients.length * suggestedPerClient;

    if (eligibleClients.length > 0) {
      batchActions.push({
        type: 'BUY',
        isin: b.isin,
        issuerName: b.issuer,
        rating: b.rating,
        yieldOrCoupon: buyYield,
        affectedClients: eligibleClients.map(c => ({
          clientId: c.id,
          clientName: c.clientName,
          holdingValueOrSuggestedAmount: Math.min(c.availableCash, suggestedPerClient)
        })),
        totalFirmAmount: totalPossible,
        rationale: `Institutional grade ${b.rating} offering attractive ${buyYield.toFixed(2)}% yield with clean promoter governance.`,
        urgency: 'OPPORTUNITY'
      });
    }
  });

  return {
    totalClients: clients.length,
    totalFirmAUA,
    totalHoldingsCount,
    firmWeightedYield,
    firmAverageHealthScore,
    totalAvailableCash,
    total90DayMaturityInflow,
    total180DayMaturityInflow,
    total365DayMaturityInflow,
    crossClientPromoterExposures,
    firmUpcomingMaturities,
    batchActions
  };
}

