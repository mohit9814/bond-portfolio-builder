import { IssuerKnowledge } from './types';

const STORAGE_CACHE_KEY = 'bond-issuer-knowledge-cache-v1';

export const CORE_ISSUER_REGISTRY: Record<string, IssuerKnowledge> = {
  'tapir': {
    companyKey: 'tapir',
    displayName: 'Tapir Constructions Ltd',
    parentGroup: 'Sammaan / Indiabulls Group',
    sector: 'Real Estate & Infrastructure Development',
    rating: 'BWR BB+ / Unrated',
    ratingAgency: 'BRICKWORK',
    ratingTrend: 'deteriorating',
    promoterPedigree: 'Real estate SPV linked to Indiabulls promoter ecosystem. High asset illiquidity, delayed construction milestones, and elevated project leverage.',
    carPercent: 14.2,
    gnpaPercent: 8.9,
    keyRiskOrStrength: 'High real estate cyclical risk; vulnerable to construction completion timelines and refinancing bottlenecks.',
    lastUpdated: '2026-08'
  },
  'earlysalary': {
    companyKey: 'earlysalary',
    displayName: 'Earlysalary Services Pvt Ltd (Fibe)',
    parentGroup: 'Fibe (Social Worth Technologies)',
    sector: 'Digital Retail Consumer Lending (Fintech)',
    rating: 'CARE A / CRISIL A-',
    ratingAgency: 'CARE',
    ratingTrend: 'improving',
    promoterPedigree: 'VC/PE backed by TPG, Norwest & Eight Roads. Fast-growing retail salary advance platform with low ticket sizes (₹35k avg) and rapid portfolio churn.',
    carPercent: 26.5,
    gnpaPercent: 2.1,
    keyRiskOrStrength: 'Strong tech-driven collection engine; healthy capitalization with improving credit profile.',
    lastUpdated: '2026-08'
  },
  'espl': {
    companyKey: 'espl',
    displayName: 'Earlysalary Services Pvt Ltd (ESPL / Fibe)',
    parentGroup: 'Fibe (Social Worth Technologies)',
    sector: 'Digital Retail Consumer Lending (Fintech)',
    rating: 'CARE A',
    ratingAgency: 'CARE',
    ratingTrend: 'improving',
    promoterPedigree: 'Fibe operating subsidiary.',
    carPercent: 26.5,
    gnpaPercent: 2.1,
    keyRiskOrStrength: 'High ROA (>3.5%) and strong collection efficiency.',
    lastUpdated: '2026-08'
  },
  'indel': {
    companyKey: 'indel',
    displayName: 'Indel Money Ltd (IML)',
    parentGroup: 'Indel Corporation',
    sector: 'Gold Loans & Micro-LAP Financing',
    rating: 'CRISIL BBB+ / ACUITE A-',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: 'South India focused NBFC primarily collateralized by gold jewellery (>85% book) with conservative LTV (<72%).',
    carPercent: 22.8,
    gnpaPercent: 1.85,
    keyRiskOrStrength: 'Liquid gold collateral buffers against credit loss; stable monthly cashflows.',
    lastUpdated: '2026-08'
  },
  'lucina': {
    companyKey: 'lucina',
    displayName: 'Lucina Land Development Ltd (LLDL)',
    parentGroup: 'Sammaan / Indiabulls Group',
    sector: 'Real Estate Commercial Land Development',
    rating: 'BWR BBB- / Watch',
    ratingAgency: 'BRICKWORK',
    ratingTrend: 'deteriorating',
    promoterPedigree: 'Indiabulls real estate land development vehicle with high coupon (13.5%) reflecting project development risk.',
    carPercent: 15.0,
    gnpaPercent: 6.5,
    keyRiskOrStrength: 'Subordinated project cashflows; high real estate execution and refinancing risks.',
    lastUpdated: '2026-08'
  },
  'keertana': {
    companyKey: 'keertana',
    displayName: 'Keertana Finserv Ltd (KFL)',
    parentGroup: 'Keertana Group (Padmaja Reddy)',
    sector: 'Rural Microfinance & Gold Loans (MFI)',
    rating: 'CARE A- / CRISIL A-',
    ratingAgency: 'CARE',
    ratingTrend: 'stable',
    promoterPedigree: 'Founded by ex-Spandana founder Padmaja Reddy. Strong rural distribution in AP, Telangana, Karnataka with hybrid gold/JLG model.',
    carPercent: 24.1,
    gnpaPercent: 2.4,
    keyRiskOrStrength: 'Geographic concentration in Southern states; solid promoter operational track record in rural lending.',
    lastUpdated: '2026-08'
  },
  'sammaan': {
    companyKey: 'sammaan',
    displayName: 'Sammaan Capital Ltd (formerly Indiabulls HFC)',
    parentGroup: 'Sammaan / Indiabulls Group',
    sector: 'Housing Finance & Retail Mortgages (HFC)',
    rating: 'CRISIL AA / ICRA AA',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: 'Institutionalized management post-Indiabulls promoter de-promoterization. Wholesale loan book de-risked into retail LAP & home loans.',
    carPercent: 25.2,
    gnpaPercent: 2.7,
    keyRiskOrStrength: 'Large liquidity cushion, low wholesale book reliance, steady retail collection.',
    lastUpdated: '2026-08'
  },
  'ibhfl': {
    companyKey: 'ibhfl',
    displayName: 'Indiabulls Housing Finance Ltd (now Sammaan Capital)',
    parentGroup: 'Sammaan / Indiabulls Group',
    sector: 'Housing Finance & Retail Mortgages (HFC)',
    rating: 'CRISIL AA / CARE AA',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: 'Renamed to Sammaan Capital Limited.',
    carPercent: 25.2,
    gnpaPercent: 2.7,
    keyRiskOrStrength: 'Sub-9% legacy coupon yield provides low returns compared to newer market instruments.',
    lastUpdated: '2026-08'
  },
  'iccl': {
    companyKey: 'iccl',
    displayName: 'Sammaan Finserve Ltd (formerly Indiabulls Commercial Credit)',
    parentGroup: 'Sammaan / Indiabulls Group',
    sector: 'Commercial Mortgages & LAP',
    rating: 'CRISIL AA',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: '100% subsidiary of Sammaan Capital.',
    carPercent: 26.0,
    gnpaPercent: 2.3,
    keyRiskOrStrength: 'Low coupon (8.45%) creates negative real yield spread against benchmark bonds.',
    lastUpdated: '2026-08'
  },
  'satin': {
    companyKey: 'satin',
    displayName: 'Satin Finserv Ltd (SFIL)',
    parentGroup: 'Satin Creditcare Group',
    sector: 'MSME Secured & Business Loans',
    rating: 'ICRA A- / CARE A-',
    ratingAgency: 'ICRA',
    ratingTrend: 'stable',
    promoterPedigree: 'Wholly owned MSME subsidiary of Satin Creditcare Network (listed parent with institutional PE backers).',
    carPercent: 24.8,
    gnpaPercent: 2.9,
    keyRiskOrStrength: '100% secured business lending collateralized by self-occupied residential/commercial properties.',
    lastUpdated: '2026-08'
  },
  'iifl_samasta': {
    companyKey: 'iifl_samasta',
    displayName: 'IIFL Samasta Finance Ltd',
    parentGroup: 'IIFL Group (Fairfax / Prem Watsa)',
    sector: 'Microfinance (MFI / JLG)',
    rating: 'CRISIL AA- / ICRA AA-',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: 'Microfinance arm of IIFL Finance backed by Fairfax India. Large nationwide rural presence (>₹13,000 Cr AUM).',
    carPercent: 23.4,
    gnpaPercent: 2.8,
    keyRiskOrStrength: 'Rural unsecured MFI nature carries cyclical weather and state policy risks, offset by group capital support.',
    lastUpdated: '2026-08'
  },
  'iihfl': {
    companyKey: 'iihfl',
    displayName: 'IIFL Home Finance Ltd (IIHFL)',
    parentGroup: 'IIFL Group (Fairfax / Prem Watsa)',
    sector: 'Affordable Housing Finance (HFC)',
    rating: 'CRISIL AA+ / ICRA AA+',
    ratingAgency: 'CRISIL',
    ratingTrend: 'improving',
    promoterPedigree: '20% equity owned by Abu Dhabi Investment Authority (ADIA). Elite tier-1 HFC with pristine asset quality (1.6% GNPA).',
    carPercent: 43.2,
    gnpaPercent: 1.6,
    keyRiskOrStrength: 'Exceptional capitalization (43.2% CAR) with global sovereign wealth backing.',
    lastUpdated: '2026-08'
  },
  'iifl_finance': {
    companyKey: 'iifl_finance',
    displayName: 'IIFL Finance Ltd',
    parentGroup: 'IIFL Group (Fairfax / Prem Watsa)',
    sector: 'Diversified Retail NBFC (Gold & LAP)',
    rating: 'CRISIL AA / ICRA AA',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: 'Parent holding company. RBI restrictions on gold loans were lifted in mid-2024 following comprehensive third-party audit.',
    carPercent: 20.1,
    gnpaPercent: 2.3,
    keyRiskOrStrength: 'Gold loan disbursals fully normalized; Fairfax backing provides robust solvency buffer.',
    lastUpdated: '2026-08'
  },
  'eaal': {
    companyKey: 'eaal',
    displayName: 'EAAA India Alternatives Ltd (formerly Edelweiss Alts)',
    parentGroup: 'Edelweiss Group (Rashesh Shah)',
    sector: 'Alternative Asset Management & Private Debt',
    rating: 'ICRA A+ / CRISIL A+',
    ratingAgency: 'ICRA',
    ratingTrend: 'stable',
    promoterPedigree: 'Market leader in private debt and alternative assets in India (>₹50,000 Cr AUM).',
    carPercent: 31.2,
    gnpaPercent: 1.2,
    keyRiskOrStrength: 'Strong fee-based asset management revenue stream.',
    lastUpdated: '2026-08'
  },
  'nido': {
    companyKey: 'nido',
    displayName: 'Nido Home Finance Ltd (formerly Edelweiss Housing)',
    parentGroup: 'Edelweiss Group (Rashesh Shah)',
    sector: 'Affordable Housing Finance',
    rating: 'CRISIL A+ / ICRA A+',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: 'Retail housing arm of Edelweiss Group.',
    carPercent: 32.5,
    gnpaPercent: 1.9,
    keyRiskOrStrength: 'Co-lending partnerships with SBI and major public sector banks.',
    lastUpdated: '2026-08'
  },
  'efsl': {
    companyKey: 'efsl',
    displayName: 'Edelweiss Financial Services Ltd (EFSL)',
    parentGroup: 'Edelweiss Group (Rashesh Shah)',
    sector: 'Financial Services Holding Company',
    rating: 'CRISIL A+ (Negative / Watch) / ICRA A+',
    ratingAgency: 'CRISIL',
    ratingTrend: 'deteriorating',
    promoterPedigree: 'Listed parent holding company. High leverage and debt repayment obligations across subsidiaries; faced regulatory scrutiny on ECL/EARC.',
    carPercent: 18.5,
    gnpaPercent: 3.8,
    keyRiskOrStrength: 'Elevated promoter group debt cluster; multiple ISIN holdings in single portfolio creates dangerous concentration risk.',
    lastUpdated: '2026-08'
  },
  'muthoot': {
    companyKey: 'muthoot',
    displayName: 'Muthoot Fincorp Ltd (MFCL)',
    parentGroup: 'Muthoot Pappachan Group (Blue Muthoot)',
    sector: 'Gold Loans & Micro-MSME Lending',
    rating: 'CRISIL AA- / ICRA AA-',
    ratingAgency: 'CRISIL',
    ratingTrend: 'stable',
    promoterPedigree: 'Over 130 years of family business history. >3,600 branches across India with >80% book collateralized by liquid gold.',
    carPercent: 20.4,
    gnpaPercent: 1.9,
    keyRiskOrStrength: 'Ultra-liquid collateral; regular monthly coupon servicing track record.',
    lastUpdated: '2026-08'
  }
};

/**
 * Retrieve issuer knowledge by matching ISIN prefix, ticker, or company name keywords.
 */
export function getIssuerKnowledge(query: string): IssuerKnowledge {
  const q = (query || '').toLowerCase().trim();
  
  // 1. Check local storage overrides / internet cache
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const cachedRaw = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cachedRaw) {
        const cache: Record<string, IssuerKnowledge> = JSON.parse(cachedRaw);
        for (const [k, v] of Object.entries(cache)) {
          if (q.includes(k) || k.includes(q)) return v;
        }
      }
    }
  } catch (e) {
    // Non-critical cache read error
  }

  // 2. Exact or substring match in Core Registry
  for (const [k, v] of Object.entries(CORE_ISSUER_REGISTRY)) {
    if (
      q.includes(k) ||
      v.displayName.toLowerCase().includes(q) ||
      v.companyKey.toLowerCase().includes(q) ||
      (q.includes('efsl') && k === 'efsl') ||
      (q.includes('nido') && k === 'nido') ||
      (q.includes('nhfl') && k === 'nido') ||
      (q.includes('eaal') && k === 'eaal') ||
      (q.includes('eaaal') && k === 'eaal') ||
      (q.includes('iifl') && q.includes('samasta') && k === 'iifl_samasta') ||
      (q.includes('iihfl') && k === 'iihfl') ||
      (q.includes('iifl') && k === 'iifl_finance') ||
      (q.includes('sammaan') && k === 'sammaan') ||
      (q.includes('ibhfl') && k === 'ibhfl') ||
      (q.includes('iccl') && k === 'iccl') ||
      (q.includes('sfil') && k === 'satin') ||
      (q.includes('satin') && k === 'satin') ||
      (q.includes('mfcl') && k === 'muthoot') ||
      (q.includes('muthoot') && k === 'muthoot') ||
      (q.includes('tapir') && k === 'tapir') ||
      (q.includes('lucina') && k === 'lucina') ||
      (q.includes('lldl') && k === 'lucina') ||
      (q.includes('kfl') && k === 'keertana') ||
      (q.includes('keertana') && k === 'keertana') ||
      (q.includes('espl') && k === 'espl') ||
      (q.includes('earlysalary') && k === 'earlysalary') ||
      (q.includes('fibe') && k === 'earlysalary') ||
      (q.includes('indel') && k === 'indel') ||
      (q.includes('iml') && k === 'indel')
    ) {
      return v;
    }
  }

  // 3. Fallback generic profile
  return {
    companyKey: q.slice(0, 12),
    displayName: query || 'Corporate Issuer',
    parentGroup: 'Independent Issuer',
    sector: 'Financial Services / Corporate',
    rating: 'A / BBB Grade',
    ratingAgency: 'CRISIL/ICRA/CARE',
    ratingTrend: 'stable',
    promoterPedigree: 'Standard corporate NBFC issuer profile in Indian debt capital markets.',
    keyRiskOrStrength: 'Evaluated under standard credit benchmarks.',
    lastUpdated: '2026-08'
  };
}

/**
 * Cache new or updated internet research for an issuer.
 */
export function cacheIssuerKnowledge(knowledge: IssuerKnowledge): void {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const cachedRaw = localStorage.getItem(STORAGE_CACHE_KEY);
      const cache: Record<string, IssuerKnowledge> = cachedRaw ? JSON.parse(cachedRaw) : {};
      cache[knowledge.companyKey.toLowerCase()] = knowledge;
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    // Non-critical cache write error
  }
}
