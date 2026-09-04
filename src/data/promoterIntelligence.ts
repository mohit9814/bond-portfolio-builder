import promoterData from './promoterRiskDatabase.json';

export interface CitationLink {
  title: string;
  url: string;
  type: 'RATING_REPORT' | 'BSE_FILING' | 'NSDL' | 'REGULATORY' | 'MEDIA';
}

export interface PersonalSwot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface PromoterRiskRecord {
  entityKey: string;
  entityName: string;
  aliasesAndSubsidiaries: string[];
  promotersAndKeyPersons: string[];
  ownershipStructure: string;
  sector: string;
  broadSector: string;
  governanceScore: number; // 0 - 100
  riskSeverity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'CLEAN';
  autoExcludeFromProposals: boolean;
  exclusionReason?: string;
  negativeMediaFlags: string[];
  detailedCaseHistory: string;
  earlierBankruptciesOrDefaults: string;
  regulatoryActions: string;
  auditorAndAccountingQuality: string;
  investmentVerdict: string;
  lastRefinedDate: string;
  promoterJourney?: string;
  entitiesOwned?: string[];
  personalSwot?: PersonalSwot;
  citations?: CitationLink[];
}

const PROMOTER_DATABASE: Record<string, PromoterRiskRecord> = promoterData as Record<string, PromoterRiskRecord>;

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getPromoterRiskRecord(issuerOrIsin: string): PromoterRiskRecord | null {
  if (!issuerOrIsin) return null;
  const normalized = normalizeText(issuerOrIsin);

  // 1. Direct key match
  if (PROMOTER_DATABASE[normalized]) {
    return PROMOTER_DATABASE[normalized];
  }

  // 2. Search by entityKey or aliases
  for (const record of Object.values(PROMOTER_DATABASE)) {
    if (normalizeText(record.entityKey) === normalized || normalizeText(record.entityName) === normalized) {
      return record;
    }

    for (const alias of record.aliasesAndSubsidiaries) {
      const normAlias = normalizeText(alias);
      if (normAlias === normalized || normalized.includes(normAlias) || normAlias.includes(normalized)) {
        return record;
      }
    }
  }

  // 3. Fallback keyword heuristics for common groupings
  if (normalized.includes('edelweiss') || normalized.includes('nido home') || normalized.includes('ecap')) {
    return PROMOTER_DATABASE['edelweiss_group'] || null;
  }
  if (normalized.includes('sammaan') || normalized.includes('indiabulls') || normalized.includes('lucina') || normalized.includes('tapir') || normalized.includes('cyqure')) {
    return PROMOTER_DATABASE['sammaan_indiabulls'] || null;
  }
  if (normalized.includes('keertana') || normalized.includes('padmaja')) {
    return PROMOTER_DATABASE['keertana_spandana'] || null;
  }
  if (normalized.includes('iifl') || normalized.includes('samasta')) {
    return PROMOTER_DATABASE['iifl_group'] || null;
  }
  if (normalized.includes('muthoot fincorp') || normalized.includes('muthoot cap') || normalized.includes('muthoot mcred')) {
    return PROMOTER_DATABASE['muthoot_pappachan'] || null;
  }
  if (normalized.includes('muthoot fin')) {
    return PROMOTER_DATABASE['muthoot_finance_ltd'] || PROMOTER_DATABASE['muthoot_group'] || null;
  }
  if (normalized.includes('haldiram')) {
    return PROMOTER_DATABASE['haldiram_group'] || null;
  }
  if (normalized.includes('tata')) {
    return PROMOTER_DATABASE['tata_group'] || null;
  }
  if (normalized.includes('piramal')) {
    return PROMOTER_DATABASE['piramal_group'] || null;
  }
  if (normalized.includes('birla') || normalized.includes('aditya birla')) {
    return PROMOTER_DATABASE['aditya_birla_group'] || null;
  }
  if (normalized.includes('poonawalla')) {
    return PROMOTER_DATABASE['poonawalla_fincorp'] || null;
  }
  if (normalized.includes('shriram')) {
    return PROMOTER_DATABASE['shriram_group'] || null;
  }
  if (normalized.includes('chola') || normalized.includes('murugappa') || normalized.includes('royal sundaram')) {
    return PROMOTER_DATABASE['chola_group'] || PROMOTER_DATABASE['murugappa_cholamandalam'] || null;
  }
  if (normalized.includes('l&t') || normalized.includes('larsen') || normalized.includes('lt finance')) {
    return PROMOTER_DATABASE['lt_group'] || null;
  }
  if (normalized.includes('kotak')) {
    return PROMOTER_DATABASE['kotak_group'] || null;
  }
  if (normalized.includes('godrej')) {
    return PROMOTER_DATABASE['godrej_group'] || null;
  }
  if (normalized.includes('yes bank')) {
    return PROMOTER_DATABASE['yesbank_ecosystem'] || null;
  }
  if (normalized.includes('nuvama')) {
    return PROMOTER_DATABASE['nuvama_group'] || null;
  }
  if (normalized.includes('satin')) {
    return PROMOTER_DATABASE['satin_group'] || null;
  }
  if (normalized.includes('adani') || normalized.includes('alipurduar')) {
    return PROMOTER_DATABASE['adani_group'] || null;
  }
  if (normalized.includes('sdl') || normalized.includes('goi') || normalized.includes('pfc') || normalized.includes('rec') || normalized.includes('nabard') || normalized.includes('sidbi') || normalized.includes('irfc')) {
    return PROMOTER_DATABASE['generic_psu_sovereign'] || PROMOTER_DATABASE['state_sdls_and_sovereign'] || null;
  }
  if (normalized.includes('beverages') || normalized.includes('mineral dev') || normalized.includes('ap state')) {
    return PROMOTER_DATABASE['ap_state_entities'] || null;
  }
  if (normalized.includes('sbi') || normalized.includes('state bank')) {
    return PROMOTER_DATABASE['state_bank_of_india'] || null;
  }

  return null;
}

export function getAllPromoterRecords(): PromoterRiskRecord[] {
  return Object.values(PROMOTER_DATABASE);
}

export function getRiskSeverityStyling(severity: PromoterRiskRecord['riskSeverity']) {
  switch (severity) {
    case 'CRITICAL':
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
        color: '#f87171',
        icon: '⛔',
        label: 'Critical Risk'
      };
    case 'HIGH':
      return {
        bg: 'rgba(249, 115, 22, 0.15)',
        border: 'rgba(249, 115, 22, 0.4)',
        color: '#fb923c',
        icon: '⚠️',
        label: 'High Governance Risk'
      };
    case 'MODERATE':
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        color: '#fbbf24',
        icon: '⚡',
        label: 'Moderate Risk'
      };
    case 'LOW':
      return {
        bg: 'rgba(59, 130, 246, 0.15)',
        border: 'rgba(59, 130, 246, 0.4)',
        color: '#60a5fa',
        icon: '✓',
        label: 'Low Risk'
      };
    case 'CLEAN':
    default:
      return {
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.4)',
        color: '#34d399',
        icon: '🛡️',
        label: 'Clean Governance'
      };
  }
}
