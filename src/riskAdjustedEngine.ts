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
  isHighRisk: boolean;
  isSubAA: boolean;
  maxPermissibleTenureMonths: number;
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

  const isBBB = ratingSym.includes('BBB') || ratingSym === 'UNRATED';
  const isA = ratingSym === 'A' || ratingSym === 'A+' || ratingSym === 'A-';
  const isAA = ratingSym.includes('AA');
  const isSovereignOrAAA = ratingSym === 'SOVEREIGN' || ratingSym === 'AAA';

  let tier: BondFundamentalRiskTier = 'MODERATE';
  let isHighRisk = false;
  let isSubAA = false;
  let maxTenure = 120; // Default 10 years
  let rationale = '';

  if (isBBB || govScore < 50 || fiveCsScore < 50 || entityRes.riskSeverity === 'HIGH' || entityRes.riskSeverity === 'CRITICAL') {
    tier = 'HIGH_RISK';
    isHighRisk = true;
    isSubAA = true;
    maxTenure = hp.enableFundamentalTenureCapping ? hp.maxHighRiskTenorMonths : 120;
    rationale = `High Fundamental Risk (${ratingSym}, Gov Score: ${govScore}/100, 5 Cs: ${fiveCsScore}/100). Tenure restricted to ${maxTenure}m to limit duration risk.`;
  } else if (isA || govScore < 68 || fiveCsScore < 65) {
    tier = 'MODERATE';
    isHighRisk = false;
    isSubAA = true;
    maxTenure = hp.enableFundamentalTenureCapping ? hp.maxModerateRiskTenorMonths : 120;
    rationale = `Moderate Risk (${ratingSym}, Gov Score: ${govScore}/100, 5 Cs: ${fiveCsScore}/100). Tenure capped at ${maxTenure}m.`;
  } else if (isAA && govScore >= 68 && fiveCsScore >= 65) {
    tier = 'UPPER_MEDIUM';
    isHighRisk = false;
    isSubAA = false;
    maxTenure = 60; // 5 years
    rationale = `Upper Medium Institutional Grade (${ratingSym}, Gov Score: ${govScore}/100). Up to 60m tenure allowed.`;
  } else if (isSovereignOrAAA) {
    tier = 'PRIME';
    isHighRisk = false;
    isSubAA = false;
    maxTenure = 120; // 10 years
    rationale = `Prime Institutional / Sovereign Quality (${ratingSym}, Gov Score: ${govScore}/100). Full long-term tenure eligible.`;
  }

  return {
    tier,
    governanceScore: govScore,
    fiveCsScore,
    ratingSymbol: ratingSym,
    isHighRisk,
    isSubAA,
    maxPermissibleTenureMonths: maxTenure,
    rationale
  };
}

/**
 * Determines the maximum single-issuer allocation cap for a specific bond,
 * dynamically scaling based on the investor's risk appetite:
 * - Aggressive portfolios accept higher-yield / risky bonds, but enforce LOWER single concentration on risky names (e.g. max 8% vs 15%) to prevent single default risk.
 * - Conservative portfolios strictly limit Sub-AA bonds.
 */
export function getRiskAdjustedIssuerCap(
  bond: DefaultBond | any,
  riskProfile: ClientRiskProfile | undefined,
  hp: EngineHyperparameters,
  portfolioTotalAmount: number
): { maxPercent: number; maxRupeeCap: number; ruleDescription: string } {
  const assessment = assessBondFundamentalRisk(bond, hp);
  let capPct = hp.maxSingleIssuerPct; // standard base cap (e.g. 15%)
  let ruleDesc = `Standard single issuer cap: ${capPct}%`;

  if (hp.enableInvestorRiskConcentration) {
    if (riskProfile === 'AGGRESSIVE') {
      if (assessment.isHighRisk) {
        // High risk appetite -> lower concentration of risky bonds for downside protection
        capPct = Math.min(capPct, hp.maxRiskyIssuerConcentrationPct);
        ruleDesc = `Aggressive Mandate: High-risk bond granular diversification cap applied (${capPct}% max per issuer).`;
      }
    } else if (riskProfile === 'CONSERVATIVE') {
      if (assessment.isHighRisk) {
        capPct = 0; // zero tolerance for high-risk bonds in conservative mandates
        ruleDesc = 'Conservative Mandate: High-risk bonds prohibited (0% cap).';
      } else if (assessment.isSubAA) {
        capPct = Math.min(capPct, hp.conservativeSubAACapPct);
        ruleDesc = `Conservative Mandate: Moderate-risk Sub-AA bond capped at ${capPct}%.`;
      }
    } else if (riskProfile === 'BALANCED') {
      if (assessment.isHighRisk) {
        capPct = Math.min(capPct, hp.maxRiskyIssuerConcentrationPct + 2); // e.g. 10%
        ruleDesc = `Balanced Mandate: Risky bond exposure capped at ${capPct}%.`;
      }
    }
  }

  const rupeeCap = portfolioTotalAmount * (capPct / 100);
  return {
    maxPercent: capPct,
    maxRupeeCap: rupeeCap,
    ruleDescription: ruleDesc
  };
}
