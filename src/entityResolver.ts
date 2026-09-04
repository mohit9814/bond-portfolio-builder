import { DefaultBond } from './defaultInventory';
import { getPromoterRiskRecord, PromoterRiskRecord, computeDynamicPromoterScore } from './data/promoterIntelligence';
import { getBseGidRecord } from './data/bseGidIntelligence';

export interface EntityResolutionResult {
  canonicalEntityKey: string;
  canonicalEntityName: string;
  isMultiBondConglomerate: boolean;
  promoterRecord: PromoterRiskRecord | null;
  governanceScore: number;
  riskSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'CLEAN';
  autoExclude: boolean;
  exclusionReason?: string;
  hasForeignBacking?: boolean;
  institutionalBadges?: string[];
  dynamicScoreExplanation?: string;
}

/**
 * Resolves any bond, holding, issuer name, or ISIN to its canonical Ultimate Parent Entity.
 * Ensures that multiple bonds from the same group (e.g. IIFL Samasta + IIFL Home Fin,
 * or Edelweiss + Nido + ECap) share the exact same canonicalEntityKey.
 */
export function resolveBondEntity(bondOrIssuer: DefaultBond | any | string): EntityResolutionResult {
  let issuerStr = '';
  let isinStr = '';
  let groupHint = '';

  if (typeof bondOrIssuer === 'string') {
    if (bondOrIssuer.toUpperCase().startsWith('INE')) {
      isinStr = bondOrIssuer.trim();
    } else {
      issuerStr = bondOrIssuer.trim();
    }
  } else if (bondOrIssuer && typeof bondOrIssuer === 'object') {
    issuerStr = bondOrIssuer.issuer || bondOrIssuer.issuerName || bondOrIssuer.readableName || '';
    isinStr = bondOrIssuer.isin || '';
    groupHint = bondOrIssuer.parentGroup || '';
  }

  const promoter = (issuerStr ? getPromoterRiskRecord(issuerStr) : null) ||
                   (isinStr ? getPromoterRiskRecord(isinStr) : null) ||
                   (groupHint ? getPromoterRiskRecord(groupHint) : null);

  if (promoter) {
    const dynScore = computeDynamicPromoterScore(promoter);
    return {
      canonicalEntityKey: promoter.entityKey,
      canonicalEntityName: promoter.entityName,
      isMultiBondConglomerate: promoter.aliasesAndSubsidiaries.length > 1,
      promoterRecord: promoter,
      governanceScore: dynScore.finalGovernanceScore,
      riskSeverity: promoter.riskSeverity,
      autoExclude: promoter.autoExcludeFromProposals,
      exclusionReason: promoter.exclusionReason,
      hasForeignBacking: dynScore.hasForeignBacking,
      institutionalBadges: dynScore.institutionalBadges,
      dynamicScoreExplanation: dynScore.explanation
    };
  }

  // Check BSE GID / NSDL Registry mapping
  const gidRecord = getBseGidRecord(isinStr || issuerStr);
  if (gidRecord && gidRecord.groupEntityKey && gidRecord.groupEntityKey !== 'independent_corporate') {
    return {
      canonicalEntityKey: gidRecord.groupEntityKey,
      canonicalEntityName: gidRecord.parentGroup || gidRecord.issuerName,
      isMultiBondConglomerate: true,
      promoterRecord: null,
      governanceScore: 78,
      riskSeverity: 'LOW',
      autoExclude: false
    };
  }

  // Fallback if not specifically in database
  const normalizedKey = issuerStr.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();
  return {
    canonicalEntityKey: normalizedKey || 'independent_issuer',
    canonicalEntityName: issuerStr,
    isMultiBondConglomerate: false,
    promoterRecord: null,
    governanceScore: 75,
    riskSeverity: 'LOW',
    autoExclude: false
  };
}

/**
 * Checks if two bonds belong to the exact same ultimate parent entity.
 */
export function areBondsSameEntity(bondA: DefaultBond | string, bondB: DefaultBond | string): boolean {
  const resA = resolveBondEntity(bondA);
  const resB = resolveBondEntity(bondB);
  return resA.canonicalEntityKey === resB.canonicalEntityKey;
}