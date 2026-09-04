import { DefaultBond } from './defaultInventory';
import { resolveBondEntity } from './entityResolver';
import { getCreditCoverageRecord } from './data/creditCoverageIntelligence';
import { EngineHyperparameters } from './engineSettingsManager';
import { ClientRiskProfile } from './clients/types';

export type BondFundamentalRiskTier = 'PRIME' | 'UPPER_MEDIUM' | 'MODERATE' | 'HIGH_RISK';

export interface BondRiskAssessment {
  tier: BondFundamentalRiskTier;
  governanceScore: number;
  fiveCsScore: number;
  ratingSymbol: string;
  compositeFundamentalScore: number;
  isHighRisk: boolean;
  isSubAA: boolean;
  maxPermissibleTenureMonths: number;
  gradientTenureMonths: number;
  hasForeignBacking?: boolean;
  institutionalBadges?: string[];
  rationale: string;
}

export function getCleanRatingSymbol(ratingStr?: string | null): string {
  if (!ratingStr) return 'UNRATED';
  let r = ratingStr.toUpperCase().replace(/\(CE\)/g, '').trim();
  const agencies = ['CRISIL', 'BRICKWORK', 'BWR', 'ACUITE', 'FITCH', 'ICRA', 'CARE', 'INFO', 'INF', 'IND'];
  for (const agency of agencies) {
    if (r.startsWith(agency)) {
      r = r.substring(agency.length).trim();
    }
  }
  if (r.includes('SOVEREIGN') || r.includes('GOI') || r.includes('SDL') || r.includes('G-SEC')) return 'SOVEREIGN';
  if (r.includes('AAA')) return 'AAA';
  if (r.includes('AA+')) return 'AA+';
  if (r.includes('AA-')) return 'AA-';
  if (r.includes('AA')) return 'AA';
  if (r.includes('BBB+')) return 'BBB+';
  if (r.includes('BBB-')) return 'BBB-';
  if (r.includes('BBB')) return 'BBB';
  if (r.includes('A+')) return 'A+';
  if (r.includes('A-')) return 'A-';
  if (r.includes('A')) return 'A';
  return 'UNRATED';
}

export function getRatingNumericalScore(ratingSymbol: string): number {
  switch (ratingSymbol) {
    case 'SOVEREIGN': return 99;
    case 'AAA': return 98;
    case 'AA+': return 90;
    case 'AA': return 85;
    case 'AA-': return 80;
    case 'A+': return 75;
    case 'A': return 70;
    case 'A-': return 65;
    case 'BBB+': return 55;
    case 'BBB': return 50;
    case 'BBB-': return 45;
    default: return 40;
  }
}

/**
 * Calculates a continuous composite fundamental health score (0 - 100) blending:
 * 1. Governance & Promoter Score (35% weight) - including time-decayed news & foreign institutional backing boost
 * 2. 5 Cs Quantitative Credit & Balance Sheet Coverage Score (35% weight)
 * 3. Credit Rating Symbol Rank (30% weight)
 */
export function calculateCompositeFundamentalScore(
  bond: DefaultBond | any
): number {
  const entityRes = resolveBondEntity(bond);
  const creditProf = getCreditCoverageRecord(bond.isin || bond.issuer);
  const ratingSym = getCleanRatingSymbol(bond.rating);

  const govScore = entityRes.governanceScore ?? 75;
  const fiveCsScore = creditProf.fiveCsAssessment?.compositeScore ?? 75;
  const ratingScore = getRatingNumericalScore(ratingSym);

  const composite = (govScore * 0.35) + (fiveCsScore * 0.35) + (ratingScore * 0.30);
  return Math.round(Math.min(100, Math.max(10, composite)));
}

/**
 * Computes continuous gradient permissible tenure (months) based on fundamental health score:
 * - Low composite scores (~30-45) get strict shorter tenures (6m to 18m)
 * - Moderate scores (~65) get intermediate tenures (36m to 60m)
 * - Prime scores (85-100) unlock long-term maturities (up to 120m)
 */
export function getGradientPermissibleTenure(
  compositeScore: number,
  hp: EngineHyperparameters
): number {
  if (!hp.enableFundamentalTenureCapping) return 120;

  const minTenor = hp.maxHighRiskTenorMonths || 18; // base floor for high risk
  const maxTenor = 120; // 10 years

  // Smooth progressive gradient curve S in [30, 95]
  const normalized = Math.min(1, Math.max(0, (compositeScore - 30) / 65));
  const gradientMonths = minTenor + (maxTenor - minTenor) * Math.pow(normalized, 1.35);

  return Math.round(Math.min(maxTenor, Math.max(minTenor, gradientMonths)));
}

/**
 * Evaluates the fundamental credit, governance, and 5 Cs risk profile of a bond.
 */
export function assessBondFundamentalRisk(
  bond: DefaultBond | any,
  hp: EngineHyperparameters
): BondRiskAssessment {
  const entityRes = resolveBondEntity(bond);
  const creditProf = getCreditCoverageRecord(bond.isin || bond.issuer);
  const ratingSym = getCleanRatingSymbol(bond.rating);

  const govScore = entityRes.governanceScore ?? 75;
  const fiveCsScore = creditProf.fiveCsAssessment?.compositeScore ?? 75;
  const compositeScore = calculateCompositeFundamentalScore(bond);
  const gradientTenure = getGradientPermissibleTenure(compositeScore, hp);

  const isBBB = ratingSym.includes('BBB') || ratingSym === 'UNRATED';
  const isA = ratingSym === 'A' || ratingSym === 'A+' || ratingSym === 'A-';
  const isAA = ratingSym.includes('AA');
  const isSovereignOrAAA = ratingSym === 'SOVEREIGN' || ratingSym === 'AAA';

  let tier: BondFundamentalRiskTier = 'MODERATE';
  let isHighRisk = false;
  let isSubAA = false;
  let maxTenure = gradientTenure;
  let rationale = '';

  if (isBBB || govScore < 50 || fiveCsScore < 50 || entityRes.riskSeverity === 'HIGH' || entityRes.riskSeverity === 'CRITICAL' || compositeScore < 55) {
    tier = 'HIGH_RISK';
    isHighRisk = true;
    isSubAA = true;
    maxTenure = hp.enableFundamentalTenureCapping ? Math.min(gradientTenure, hp.maxHighRiskTenorMonths) : 120;
    rationale = `High Fundamental Risk (${ratingSym}, Gov: ${govScore}/100, 5 Cs: ${fiveCsScore}/100, Composite: ${compositeScore}/100). Gradient tenure capped at ${maxTenure}m to curtail duration risk.`;
  } else if (isA || govScore < 68 || fiveCsScore < 65 || compositeScore < 72) {
    tier = 'MODERATE';
    isHighRisk = false;
    isSubAA = true;
    maxTenure = hp.enableFundamentalTenureCapping ? Math.min(gradientTenure, hp.maxModerateRiskTenorMonths) : 120;
    rationale = `Moderate Risk (${ratingSym}, Gov: ${govScore}/100, Composite: ${compositeScore}/100). Gradient tenure capped at ${maxTenure}m.`;
  } else if (isAA && govScore >= 68 && fiveCsScore >= 65) {
    tier = 'UPPER_MEDIUM';
    isHighRisk = false;
    isSubAA = false;
    maxTenure = Math.min(gradientTenure, 60);
    rationale = `Upper Medium Institutional Grade (${ratingSym}, Gov: ${govScore}/100, Composite: ${compositeScore}/100). Up to ${maxTenure}m tenure eligible.`;
  } else if (isSovereignOrAAA) {
    tier = 'PRIME';
    isHighRisk = false;
    isSubAA = false;
    maxTenure = 120;
    rationale = `Prime Institutional / Sovereign Quality (${ratingSym}, Composite: ${compositeScore}/100). Full long-term tenure eligible.`;
  }

  return {
    tier,
    governanceScore: govScore,
    fiveCsScore,
    ratingSymbol: ratingSym,
    compositeFundamentalScore: compositeScore,
    isHighRisk,
    isSubAA,
    maxPermissibleTenureMonths: maxTenure,
    gradientTenureMonths: gradientTenure,
    hasForeignBacking: entityRes.hasForeignBacking,
    institutionalBadges: entityRes.institutionalBadges,
    rationale
  };
}

/**
 * Determines the continuous gradient maximum single-issuer allocation cap for a specific bond,
 * smoothly scaling based on the investor's risk profile and fundamental score.
 */
export function getRiskAdjustedIssuerCap(
  bond: DefaultBond | any,
  riskProfile: ClientRiskProfile | undefined,
  hp: EngineHyperparameters,
  portfolioTotalAmount: number
): { maxPercent: number; maxRupeeCap: number; ruleDescription: string; compositeScore: number } {
  const assessment = assessBondFundamentalRisk(bond, hp);
  const S = assessment.compositeFundamentalScore;
  let capPct = hp.maxSingleIssuerPct; // standard base cap (e.g. 15%)
  let ruleDesc = `Standard single issuer cap: ${capPct}%`;

  if (hp.enableInvestorRiskConcentration) {
    if (riskProfile === 'AGGRESSIVE') {
      if (assessment.isHighRisk || S < 60) {
        // Continuous gradient scaling for aggressive mandates: lower concentration for riskier bonds
        const floorCap = hp.maxRiskyIssuerConcentrationPct; // e.g. 8%
        const norm = Math.min(1, Math.max(0, (S - 35) / 60));
        capPct = Math.round((floorCap + (hp.maxSingleIssuerPct - floorCap) * norm) * 10) / 10;
        ruleDesc = `Aggressive Mandate: Continuous gradient cap applied (${capPct}% max based on Composite Score ${S}/100).`;
      }
    } else if (riskProfile === 'CONSERVATIVE') {
      if (assessment.isHighRisk || S < 50) {
        capPct = 0; // zero tolerance for high-risk bonds in conservative mandates
        ruleDesc = `Conservative Mandate: High-risk bonds prohibited (0% cap, Score ${S}/100).`;
      } else if (assessment.isSubAA || S < 75) {
        const norm = Math.min(1, Math.max(0, (S - 50) / 25));
        capPct = Math.round((hp.conservativeSubAACapPct * norm) * 10) / 10;
        ruleDesc = `Conservative Mandate: Sub-AA gradient cap of ${capPct}% applied (Score ${S}/100).`;
      }
    } else if (riskProfile === 'BALANCED') {
      if (assessment.isHighRisk || S < 60) {
        const floorCap = Math.min(hp.maxSingleIssuerPct, hp.maxRiskyIssuerConcentrationPct + 2);
        const norm = Math.min(1, Math.max(0, (S - 35) / 60));
        capPct = Math.round((floorCap + (hp.maxSingleIssuerPct - floorCap) * norm) * 10) / 10;
        ruleDesc = `Balanced Mandate: Gradient cap of ${capPct}% applied (Score ${S}/100).`;
      }
    }
  }

  const rupeeCap = portfolioTotalAmount * (capPct / 100);
  return {
    maxPercent: capPct,
    maxRupeeCap: rupeeCap,
    ruleDescription: ruleDesc,
    compositeScore: S
  };
}
