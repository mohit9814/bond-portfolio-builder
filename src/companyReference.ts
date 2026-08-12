import { DefaultBond } from './defaultInventory';

export interface CompanyReferenceKnowledge {
  companyKey: string; // Lowercased normalized matching key
  displayName: string;
  sector: string;
  rating: string;
  ratingTrend: 'stable' | 'improving' | 'deteriorating';
  summaryInsight: string;
  coreFocus: string;
  guarantor?: string;
  guarantorRating?: string;
}

export const COMPANY_REFERENCE_MAP: Record<string, CompanyReferenceKnowledge> = {
  'akara': {
    companyKey: 'akara',
    displayName: 'Akara Capital Advisors Pvt Ltd (Stashfin)',
    sector: 'Digital Retail Personal Lending (Fintech)',
    rating: 'ICRA BBB (Stable)',
    ratingTrend: 'stable',
    summaryInsight: '100% unsecured digital personal loans via Stashfin platform. Rebounding AUM (~₹2,799 Cr), backed by Singapore parent MTPL (21.6% CAR). Yield trades at a 120-200 bps risk premium over BBB peers.',
    coreFocus: 'Unsecured Consumer Digital Loans'
  },
  'akme': {
    companyKey: 'akme',
    displayName: 'Akme Fintrade (India) Ltd',
    sector: 'Rural & Semi-Urban Vehicle & LAP Financing',
    rating: 'ACUITE A- / IVR BBB+',
    ratingTrend: 'improving',
    summaryInsight: 'Bank facilities upgraded to ACUITE A- in mid-2026. Secured debt backed by vehicle collateral and LAP property pools with 12% monthly distributions.',
    coreFocus: 'Vehicle Finance (2W/4W) & LAP'
  },
  'manba': {
    companyKey: 'manba',
    displayName: 'Manba Finance Ltd',
    sector: 'Two-Wheeler (2W) & Three-Wheeler (3W) EV Financing',
    rating: 'CARE BBB+ (Positive)',
    ratingTrend: 'improving',
    summaryInsight: 'Publicly listed on NSE/BSE (IPO post-2024). Clean asset quality (3.6% GNPA, 24.5% CAR). Secured NCD backed by underlying vehicle collateral pools.',
    coreFocus: '2W/3W EV Financing'
  },
  'ugro': {
    companyKey: 'ugro',
    displayName: 'UGRO Capital Ltd',
    sector: 'MSME Financing (Data-Driven Underwriting)',
    rating: 'IND A+ (Positive)',
    ratingTrend: 'improving',
    summaryInsight: 'Institutional-grade MSME lender backed by TPG & ADV Partners. ~70% secured loan book with proprietary GST/bureau underwriting. AUM > ₹12,000 Cr with monthly payouts.',
    coreFocus: 'Secured MSME Financing'
  },
  'auxilo': {
    companyKey: 'auxilo',
    displayName: 'Auxilo Finserve Pvt Ltd',
    sector: 'Education Ecosystem Lending',
    rating: 'CRISIL A+ / CARE A+',
    ratingTrend: 'stable',
    summaryInsight: 'Elite institutional backing from Balrampur Chini, Enam Holdings & ICICI Bank. Pristine asset quality (0.55% GNPA) and 30.04% CAR. >90% loans backed by earning parent co-borrowers.',
    coreFocus: 'Education Student & Institution Loans'
  },
  'satin': {
    companyKey: 'satin',
    displayName: 'Satin Creditcare / Satin Finserv',
    sector: 'Microfinance (MFI) & Retail MSME',
    rating: 'ICRA A- / ICRA A',
    ratingTrend: 'improving',
    summaryInsight: 'Improving credit outlook supported by lower NNPA, strong collection efficiencies, and fresh capital infusions.',
    coreFocus: 'Microfinance & MSME'
  },
  'krazybee': {
    companyKey: 'krazybee',
    displayName: 'Krazybee Services Ltd (KreditBee)',
    sector: 'Digital Consumer Lending',
    rating: 'CARE A / CRISIL A+',
    ratingTrend: 'improving',
    summaryInsight: 'Scaled digital retail lending platform with strong A-tier credit profile, superior liquidity, and lower risk premium than BBB peers.',
    coreFocus: 'Digital Consumer Credit'
  },
  'earlysalary': {
    companyKey: 'earlysalary',
    displayName: 'EarlySalary Services Pvt Ltd (Fibe)',
    sector: 'Digital Consumer & Salary Advance',
    rating: 'CARE A-',
    ratingTrend: 'improving',
    summaryInsight: 'Fintech digital consumer lender with strong A- credit profile and robust liquidity.',
    coreFocus: 'Digital Consumer Lending'
  },
  'mufin': {
    companyKey: 'mufin',
    displayName: 'Mufin Green Finance Ltd',
    sector: 'Electric Vehicle (EV) Mobility Financing',
    rating: 'ACUITE A-',
    ratingTrend: 'stable',
    summaryInsight: 'Specialized EV & green mobility financing backed by structural vehicle collateral pools.',
    coreFocus: 'EV Mobility Financing'
  },
  'tyger': {
    companyKey: 'tyger',
    displayName: 'Tyger Home Fin Pvt Ltd (Tyger Capital)',
    sector: 'Affordable Housing Finance',
    rating: 'CRISIL A+',
    ratingTrend: 'stable',
    summaryInsight: 'Stable capitalization and strong parent backing from Tyger Capital Holdings.',
    coreFocus: 'Affordable Housing'
  },
  'indostar': {
    companyKey: 'indostar',
    displayName: 'IndoStar Capital Finance Ltd',
    sector: 'Commercial Vehicles & SME Financing',
    rating: 'A Level',
    ratingTrend: 'stable',
    summaryInsight: 'Established commercial vehicle & SME lender offering stable risk-adjusted returns.',
    coreFocus: 'Commercial Vehicles & SME'
  },
  'muthoot finance': {
    companyKey: 'muthoot finance',
    displayName: 'Muthoot Finance Ltd',
    sector: 'Gold Loans & Retail Credit',
    rating: 'ICRA AA+',
    ratingTrend: 'stable',
    summaryInsight: 'Gold loan pioneer with ultra-liquid, short-duration asset class providing immediate security realization. Expanding microfinance & housing verticals.',
    coreFocus: 'Gold Loans'
  },
  'muthoot fincorp': {
    companyKey: 'muthoot fincorp',
    displayName: 'Muthoot Fincorp Ltd',
    sector: 'Gold Loans & Micro-Lending',
    rating: 'CRISIL AA',
    ratingTrend: 'stable',
    summaryInsight: 'Huge semi-urban branch footprint with strong customer retention and immediate cash recovery lines. Cross-selling digital micro-loans.',
    coreFocus: 'Gold & Retail Credit'
  },
  'muthoot microfin': {
    companyKey: 'muthoot microfin',
    displayName: 'Muthoot Microfin Ltd',
    sector: 'Rural Microfinance (JLG)',
    rating: 'ICRA A',
    ratingTrend: 'stable',
    summaryInsight: 'Joint liability group (JLG) framework ensuring high collection discipline among rural borrowers. Digital onboarding driving MSME transition.',
    coreFocus: 'Rural Microfinance'
  },
  'iifl': {
    companyKey: 'iifl',
    displayName: 'IIFL Finance Ltd',
    sector: 'Gold, Home & MSME Loans',
    rating: 'CRISIL AA',
    ratingTrend: 'stable',
    summaryInsight: 'Well-diversified product mix spanning gold, home, and MSME loans with strong institutional funding relationships.',
    coreFocus: 'Diversified Retail Credit'
  },
  'mas financial': {
    companyKey: 'mas financial',
    displayName: 'MAS Financial Services Ltd',
    sector: 'Lower-Middle Class Retail & MSME',
    rating: 'CARE AA-',
    ratingTrend: 'stable',
    summaryInsight: 'Exceptional decade-long track record of maintaining Gross NPAs under 2%. Specialized focus on lower-middle class retail credit.',
    coreFocus: 'Retail & MSME Lending'
  },
  'nido': {
    companyKey: 'nido',
    displayName: 'Nido Home Finance Ltd (Edelweiss Housing)',
    sector: 'Affordable Housing Finance',
    rating: 'CRISIL A+',
    ratingTrend: 'stable',
    summaryInsight: 'Secured retail housing focus under restructured Edelweiss ecosystem. Unlocking growth in high-yield Tier-2/3 city affordable housing.',
    coreFocus: 'Secured Retail Housing'
  },
  'navi': {
    companyKey: 'navi',
    displayName: 'Navi Finserv Ltd',
    sector: 'Digital Personal & Home Loans',
    rating: 'IND A',
    ratingTrend: 'stable',
    summaryInsight: '100% digital, branchless infrastructure with instant approvals powered by advanced data analytics.',
    coreFocus: 'Digital Consumer Lending'
  },
  'edelweiss': {
    companyKey: 'edelweiss',
    displayName: 'Edelweiss Rural & Corporate Services Ltd',
    sector: 'Capital Markets & Corporate Credit',
    rating: 'ICRA A+',
    ratingTrend: 'stable',
    summaryInsight: 'Strong domain expertise in capital market lending, commodity funding, and corporate debt syndication.',
    coreFocus: 'Corporate Credit & Capital Markets'
  },
  'sammaan': {
    companyKey: 'sammaan',
    displayName: 'Sammaan Capital Ltd (formerly Indiabulls Housing)',
    sector: 'Institutional Mortgages & LAP',
    rating: 'ICRA AA+',
    ratingTrend: 'stable',
    summaryInsight: 'Institutional asset manager backed by Blackstone with heavily collateralized corporate and residential mortgage books.',
    coreFocus: 'Mortgages & LAP'
  }
};

/**
 * Fuzzy lookup helper to match company insights by issuer name or ISIN
 */
export function getCompanyInsights(bond: DefaultBond): { sector: string; ratingTrend?: 'stable' | 'improving' | 'deteriorating'; insightNote?: string } {
  const issuerLower = (bond.issuer || '').toLowerCase();
  
  for (const key of Object.keys(COMPANY_REFERENCE_MAP)) {
    if (issuerLower.includes(key)) {
      const ref = COMPANY_REFERENCE_MAP[key];
      return {
        sector: ref.sector,
        ratingTrend: ref.ratingTrend,
        insightNote: ref.summaryInsight
      };
    }
  }

  // Fallback if not matched in reference map
  const sector = bond.sector && bond.sector.toLowerCase() !== 'bulk'
    ? bond.sector
    : (bond.category && bond.category.toLowerCase() !== 'bulk' ? bond.category : 'Financial Services (NBFC)');

  return {
    sector,
    ratingTrend: bond.ratingTrend || 'stable',
    insightNote: bond.ratingOutlookNote || 'Credit profile backed by operational history and active monitoring.'
  };
}
