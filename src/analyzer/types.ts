import { DefaultBond } from '../defaultInventory';

export type RatingTrend = 'improving' | 'stable' | 'deteriorating';

export interface HistoricalRating {
  agency: string;
  rating: string;
  outlook: 'Stable' | 'Positive' | 'Negative' | 'Watch' | 'Under Review' | 'Watch Developing';
  date: string;
  commentary: string;
  creditEnhancement?: string;
}

export interface IssuerKnowledge {
  companyKey: string;
  displayName: string;
  parentGroup: string;
  sector: string;
  broadSector?: string;
  subSector?: string;
  rating: string;
  ratingAgency: string;
  ratingTrend: RatingTrend;
  promoterPedigree: string;
  carPercent?: number; // Capital Adequacy Ratio %
  gnpaPercent?: number; // Gross NPA %
  keyRiskOrStrength: string;
  historicalRatings?: HistoricalRating[];
  lastUpdated: string;
}

export interface PortfolioHolding {
  srNo: number;
  isin: string;
  securityName: string;
  readableName: string;
  rawSecurityName?: string;
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
  broadSector: string;
  subSector: string;
  isSecured: boolean;
  weightPercent: number;
  principalRedemption?: string;
  amortizationSummary?: string;
  historicalRatings?: HistoricalRating[];
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
  | 'MATURITY_MISMATCH'
  | 'PROMOTER_GOVERNANCE_RISK';

export interface ExitRecommendation {
  isin: string;
  securityName: string;
  readableName?: string;
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
  readableName?: string;
  issuerName: string;
  maturityDate: string;
  monthsAway: number;
  cashInflowAmount: number;
  couponPercent: number;
  recommendedReplacement: DefaultBond | null;
  reinvestmentYield: number;
  yieldPickup: number; // Reinvestment Yield - Current Coupon
}

export interface BreadcrumbStep {
  level: number;
  label: string;
  mode: string;
  key: string;
}

export interface DrilldownFilter {
  mode: 'industry' | 'promoter' | 'rating' | 'bond';
  value: string;
  subValue?: string;
  parentCategory?: string;
}

export interface HierarchicalDrilldownState {
  mode: 'industry' | 'promoter' | 'rating' | 'bond';
  path: BreadcrumbStep[];
  activeHoldingIsin?: string;
}

export type BondRecommendationVerdict =
  | 'HOLD'
  | 'EXIT_AND_ROTATE'
  | 'TRIM_CONCENTRATION'
  | 'REINVEST_ON_MATURITY';

export interface ReplacementOption {
  bond: DefaultBond;
  projectedYield: number;
  yieldPickup: number;
  diversificationReason: string;
  ratingBoost: boolean;
}

export interface BondDeepInsight {
  holding: PortfolioHolding;
  verdict: BondRecommendationVerdict;
  verdictReason: string;
  portfolioGroupConcentrationPct: number;
  portfolioSectorConcentrationPct: number;
  yieldSpreadVsPortfolioAvg: number;
  suitableReplacements: ReplacementOption[];
}

export interface AdoptedRebalanceAction {
  id: string;
  sellHolding: PortfolioHolding;
  buyBond: DefaultBond;
  replacementValue: number;
  yieldPickup: number;
  rationale: string;
  adoptedAt: string;
}

export interface PortfolioRebalancePlan {
  actions: AdoptedRebalanceAction[];
  projectedTotalValue: number;
  originalWeightedYield: number;
  projectedWeightedYield: number;
  yieldDelta: number;
  originalHealthScore: number;
  projectedHealthScore: number;
}
