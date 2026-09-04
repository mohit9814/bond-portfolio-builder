import { PortfolioHolding } from '../analyzer/types';
import { DefaultBond } from '../defaultInventory';

export type ClientRiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export type ClientCategory = 'HNI' | 'ULTRA_HNI' | 'FAMILY_OFFICE' | 'CORPORATE_TREASURY' | 'RETAIL_SENIOR' | 'GENERAL';

export interface ClientPortfolio {
  id: string;
  clientName: string;
  accountNumber?: string;
  category: ClientCategory;
  riskProfile: ClientRiskProfile;
  targetYieldPercent: number;
  targetMonthlyCashflow: number;
  availableCash: number;
  holdings: PortfolioHolding[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRecommendation {
  bond: DefaultBond;
  score: number; // 0-100 composite ranking
  unitPrice: number;
  suggestedUnits: number;
  allocatedAmount: number;
  projectedYield: number;
  yieldSpreadVsPortfolio: number;
  diversificationGain: string;
  riskFitRationale: string;
  tenureFitRationale: string;
}

export interface PurchaseAllocationPlan {
  clientId?: string;
  availableCash: number;
  totalDeployed: number;
  remainingCash: number;
  recommendations: PurchaseRecommendation[];
  originalYield: number;
  projectedNewYield: number;
  yieldPickup: number;
}

export interface CrossClientPromoterExposure {
  parentGroup: string;
  totalAmount: number;
  percentageOfFirmAUA: number;
  clientCount: number;
  holdingCount: number;
  affectedClientNames: string[];
  riskSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  governanceScore?: number;
  promoterRiskSeverity?: 'CLEAN' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface FirmUpcomingMaturityItem {
  id: string;
  clientId: string;
  clientName: string;
  isin: string;
  securityName: string;
  maturityDate: string;
  monthsAway: number;
  inflowAmount: number;
  couponPercent: number;
  suggestedReinvestmentBond?: DefaultBond;
  reinvestmentYield?: number;
  yieldPickup?: number;
}

export interface UniversalBatchAction {
  type: 'EXIT' | 'BUY';
  isin: string;
  issuerName: string;
  rating: string;
  yieldOrCoupon: number;
  affectedClients: Array<{
    clientId: string;
    clientName: string;
    holdingValueOrSuggestedAmount: number;
  }>;
  totalFirmAmount: number;
  rationale: string;
  urgency: 'HIGH' | 'MEDIUM' | 'OPPORTUNITY';
}

export interface MultiClientAggregateSummary {
  totalClients: number;
  totalFirmAUA: number;
  totalHoldingsCount: number;
  firmWeightedYield: number;
  firmAverageHealthScore: number;
  totalAvailableCash: number;
  total90DayMaturityInflow: number;
  total180DayMaturityInflow: number;
  total365DayMaturityInflow: number;
  crossClientPromoterExposures: CrossClientPromoterExposure[];
  firmUpcomingMaturities: FirmUpcomingMaturityItem[];
  batchActions: UniversalBatchAction[];
}
