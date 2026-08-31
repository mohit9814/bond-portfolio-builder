import { DefaultBond } from '../defaultInventory';

export type RatingTrend = 'improving' | 'stable' | 'deteriorating';

export interface IssuerKnowledge {
  companyKey: string;
  displayName: string;
  parentGroup: string;
  sector: string;
  rating: string;
  ratingAgency: string;
  ratingTrend: RatingTrend;
  promoterPedigree: string;
  carPercent?: number; // Capital Adequacy Ratio %
  gnpaPercent?: number; // Gross NPA %
  keyRiskOrStrength: string;
  lastUpdated: string;
}

export interface PortfolioHolding {
  srNo: number;
  isin: string;
  securityName: string;
  qty: number;
  faceValue: number;
  estimatedMarketValue: number;
  couponPercent: number;
  yieldPercent: number;
  maturityDate: string;
  monthsToMaturity: number;
  frequency: string;
  rating: string;
  ratingAgency: string;
  ratingTrend: RatingTrend;
  issuerName: string;
  parentGroup: string;
  sector: string;
  isSecured: boolean;
  weightPercent: number;
}

export interface GroupExposure {
  parentGroup: string;
  totalAmount: number;
  percentage: number;
  holdingCount: number;
  isins: string[];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface PortfolioRiskAssessment {
  totalHoldingsCount: number;
  totalInvestedAmount: number;
  weightedYieldPercent: number;
  averageDurationMonths: number;
  healthScore: number; // 0 to 100
  healthGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  groupExposures: GroupExposure[];
  ratingDistribution: Record<string, number>; // Rating -> Amount
  ratingTrendBreakdown: {
    improvingAmount: number;
    improvingPercent: number;
    stableAmount: number;
    stablePercent: number;
    deterioratingAmount: number;
    deterioratingPercent: number;
  };
  highRiskAlerts: string[];
}

export type ExitSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ExitCategory =
  | 'CREDIT_DETERIORATION'
  | 'GROUP_OVERCONCENTRATION'
  | 'SUBPAR_YIELD'
  | 'REAL_ESTATE_SECTOR_RISK'
  | 'MATURITY_MISMATCH';

export interface ExitRecommendation {
  isin: string;
  securityName: string;
  issuerName: string;
  parentGroup: string;
  qty: number;
  estimatedValue: number;
  couponPercent: number;
  rating: string;
  ratingTrend: RatingTrend;
  severity: ExitSeverity;
  category: ExitCategory;
  rationale: string;
  suggestedAction: string;
}

export interface AddRecommendation {
  bond: DefaultBond;
  rationale: string;
  suggestedAllocation: number;
  targetTenureMonths: number;
  projectedYield: number;
  sector: string;
  rating: string;
}

export interface MaturityReinvestmentItem {
  isin: string;
  securityName: string;
  issuerName: string;
  maturityDate: string;
  monthsAway: number;
  cashInflowAmount: number;
  couponPercent: number;
  recommendedReplacement: DefaultBond | null;
  reinvestmentYield: number;
  yieldPickup: number; // Reinvestment Yield - Current Coupon
}
