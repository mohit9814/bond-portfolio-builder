import { DefaultBond } from './defaultInventory';
import { getPromoterRiskRecord, PromoterRiskRecord } from './data/promoterIntelligence';

export interface EntityResolutionResult {
  canonicalEntityKey: string;
  canonicalEntityName: string;
  isMultiBondConglomerate: boolean;
  promoterRecord: PromoterRiskRecord | null;
  governanceScore: number;
  riskSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'CLEAN';
  autoExclude: boolean;
  exclusionReason?: string;
}

/**
 * Resolves any bond, issuer name, or ISIN to its canonical Ultimate Parent Entity.
 * Ensures that multiple bonds from the same group (e.g. IIFL Samasta + IIFL Home Fin,
 * or Edelweiss + Nido + ECap) share the exact same canonicalEntityKey.
 */
export function resolveBondEntity(bondOrIssuer: DefaultBond | string): EntityResolutionResult {
  const issuerStr = typeof bondOrIssuer === 'string' ? bondOrIssuer : (bondOrIssuer.issuer || '');
  const isinStr = typeof bondOrIssuer === 'string' ? '' : (bondOrIssuer.isin || '');

  const promoter = getPromoterRiskRecord(issuerStr) || (isinStr ? getPromoterRiskRecord(isinStr) : null);

  if (promoter) {
    return {
      canonicalEntityKey: promoter.entityKey,
      canonicalEntityName: promoter.entityName,
      isMultiBondConglomerate: promoter.aliasesAndSubsidiaries.length > 1,
      promoterRecord: promoter,
      governanceScore: promoter.governanceScore,
      riskSeverity: promoter.riskSeverity,
      autoExclude: promoter.autoExcludeFromProposals,
      exclusionReason: promoter.exclusionReason
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