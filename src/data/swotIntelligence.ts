import swotData from './businessSwotDatabase.json';
import { PortfolioHolding } from '../analyzer/types';

export interface FinancialMetrics {
  crar?: number;
  crarPercent?: number;
  gnpa?: number;
  gnpaPercent?: number;
  nnpa?: number;
  gearing?: number;
  gearingRatio?: number;
  lcr?: number;
  liquidityCoverRatio?: number;
  roa?: number;
  patCagr?: string;
  [key: string]: unknown;
}

export interface SwotElements {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface BusinessSwotRecord {
  isin: string;
  issuer?: string;
  issuerName?: string;
  canonicalEntity?: string;
  parentGroup?: string;
  promoterKey?: string;
  ratingAgency: string;
  rating?: string;
  currentRating?: string;
  outlook?: string;
  reportDate?: string;
  rationaleDate?: string;
  sourceUrl: string;
  bseFilingUrl: string;
  nsdlDirectoryUrl: string;
  financialMetrics: FinancialMetrics;
  swot: SwotElements;
  keyStrengthsSummary?: string;
  keyConcernsSummary?: string;
  lastUpdated?: string;
}

const SWOT_DATABASE: Record<string, BusinessSwotRecord> = swotData as Record<string, BusinessSwotRecord>;

function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Retrieve Business SWOT record by ISIN or Issuer name
 */
export function getBusinessSwot(isinOrIssuer: string): BusinessSwotRecord | null {
  if (!isinOrIssuer) return null;
  const isinClean = isinOrIssuer.trim().toUpperCase();

  // 1. Direct key match
  const normKey = normalizeText(isinOrIssuer).replace(/\s+/g, '_');
  if (SWOT_DATABASE[normKey]) {
    return SWOT_DATABASE[normKey];
  }

  const norm = normalizeText(isinOrIssuer);
  if (!norm) return null;

  // 2. Direct ISIN or exact normalized match
  for (const record of Object.values(SWOT_DATABASE)) {
    const isinMatch = record.isin && record.isin.toUpperCase() === isinClean;
    const normIssuer = normalizeText(record.issuer || record.issuerName);
    const normCanonical = normalizeText(record.canonicalEntity || record.parentGroup);

    if (isinMatch ||
        (normIssuer && normIssuer === norm) ||
        (normCanonical && normCanonical === norm) ||
        (normIssuer && (norm.includes(normIssuer) || normIssuer.includes(norm))) ||
        (normCanonical && (norm.includes(normCanonical) || normCanonical.includes(norm)))) {
      return record;
    }
  }

  // 3. Keyword / First significant token matching
  const tokens = norm.split(' ').filter(t => !['ltd', 'limited', 'pvt', 'private', 'services', 'serv', 'corp', 'corporation', 'india', 'co'].includes(t));
  if (tokens.length > 0) {
    const mainToken = tokens[0];
    for (const [key, record] of Object.entries(SWOT_DATABASE)) {
      if (key.includes(mainToken) ||
          normalizeText(record.issuer || record.issuerName).includes(mainToken) ||
          normalizeText(record.canonicalEntity || record.parentGroup).includes(mainToken)) {
        return record;
      }
    }
  }

  return null;
}

/**
 * Get all available Business SWOT records
 */
export function getAllBusinessSwot(): BusinessSwotRecord[] {
  return Object.values(SWOT_DATABASE);
}

export interface ConsolidatedSwotInsight {
  topStrengths: { text: string; count: number; percentageOfPortfolio: number }[];
  topWeaknesses: { text: string; count: number; percentageOfPortfolio: number }[];
  topOpportunities: { text: string; count: number; percentageOfPortfolio: number }[];
  topThreats: { text: string; count: number; percentageOfPortfolio: number }[];
  avgCrar: number;
  avgGnpa: number;
  totalHoldingsAnalyzed: number;
  highCrarCoverageCount: number;
  lowNpaCount: number;
}

/**
 * Aggregate Portfolio holdings into a consolidated SWOT Matrix and credit metrics
 */
export function getPortfolioConsolidatedSwot(holdings: PortfolioHolding[]): ConsolidatedSwotInsight {
  const strengthCounts: Record<string, number> = {};
  const weaknessCounts: Record<string, number> = {};
  const oppCounts: Record<string, number> = {};
  const threatCounts: Record<string, number> = {};

  let crarSum = 0;
  let crarCount = 0;
  let gnpaSum = 0;
  let gnpaCount = 0;
  let analyzedCount = 0;
  let highCrarCount = 0;
  let lowNpaCount = 0;

  const totalValue = holdings.reduce((sum, h) => sum + (h.estimatedMarketValue || 0), 0) || 1;

  for (const holding of holdings) {
    const swot = (holding.isin ? getBusinessSwot(holding.isin) : null) ||
                 (holding.issuerName ? getBusinessSwot(holding.issuerName) : null) ||
                 (holding.securityName ? getBusinessSwot(holding.securityName) : null) ||
                 (holding.parentGroup ? getBusinessSwot(holding.parentGroup) : null);
    if (!swot) continue;
    analyzedCount++;

    const crar = swot.financialMetrics.crar ?? swot.financialMetrics.crarPercent;
    if (crar !== undefined && crar > 0) {
      crarSum += crar;
      crarCount++;
      if (crar >= 20) highCrarCount++;
    }

    const gnpa = swot.financialMetrics.gnpa ?? swot.financialMetrics.gnpaPercent;
    if (gnpa !== undefined) {
      gnpaSum += gnpa;
      gnpaCount++;
      if (gnpa < 3.0) lowNpaCount++;
    }

    if (swot.swot?.strengths) {
      swot.swot.strengths.forEach(s => {
        strengthCounts[s] = (strengthCounts[s] || 0) + (holding.estimatedMarketValue || 1);
      });
    }
    if (swot.swot?.weaknesses) {
      swot.swot.weaknesses.forEach(w => {
        weaknessCounts[w] = (weaknessCounts[w] || 0) + (holding.estimatedMarketValue || 1);
      });
    }
    if (swot.swot?.opportunities) {
      swot.swot.opportunities.forEach(o => {
        oppCounts[o] = (oppCounts[o] || 0) + (holding.estimatedMarketValue || 1);
      });
    }
    if (swot.swot?.threats) {
      swot.swot.threats.forEach(t => {
        threatCounts[t] = (threatCounts[t] || 0) + (holding.estimatedMarketValue || 1);
      });
    }
  }

  const mapToSorted = (counts: Record<string, number>) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, val]) => ({
        text,
        count: Math.round(val),
        percentageOfPortfolio: Math.round((val / totalValue) * 100)
      }));

  return {
    topStrengths: mapToSorted(strengthCounts),
    topWeaknesses: mapToSorted(weaknessCounts),
    topOpportunities: mapToSorted(oppCounts),
    topThreats: mapToSorted(threatCounts),
    avgCrar: crarCount > 0 ? Number((crarSum / crarCount).toFixed(2)) : 0,
    avgGnpa: gnpaCount > 0 ? Number((gnpaSum / gnpaCount).toFixed(2)) : 0,
    totalHoldingsAnalyzed: analyzedCount,
    highCrarCoverageCount: highCrarCount,
    lowNpaCount
  };
}
