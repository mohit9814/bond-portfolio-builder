import { IssuerKnowledge } from './types';

const STORAGE_CACHE_KEY = 'bond-issuer-knowledge-cache-v1';

export const KNOWN_ISIN_FACE_VALUES: Record<string, number> = {
  'INE00DJ07052': 100000, // Tapir Constructions (₹1 Lakh)
  'INE01YL07383': 100000, // ESPL/Fibe (₹1 Lakh)
  'INE0BUS07BQ9': 100000, // Indel Money 11% (₹1 Lakh)
  'INE0BUS07BR7': 100000, // Indel Money 11.25% (₹1 Lakh)
  'INE0JZO07032': 100000, // Lucina Land Development (₹1 Lakh)
  'INE0NES07329': 100000, // Keertana Finserv (₹1 Lakh)
  'INE148I07GK5': 1000,   // Sammaan Capital / IBHFL 8.85% (Public Issue ₹1,000)
  'INE148I07GL3': 1000,   // Sammaan Capital / IBHFL 9.0% (Public Issue ₹1,000)
  'INE244L08034': 100000, // Sammaan Finserve / ICCL 8.45% (₹1 Lakh)
  'INE244L08059': 100000, // Satin Finserv 8.80% (₹1 Lakh)
  'INE413U08093': 100000, // IIFL Samasta 11% (₹1 Lakh)
  'INE477L08147': 1000,   // IIFL Home Finance (Public Issue ₹1,000)
  'INE528L07115': 100000, // EAAA India Alternatives (₹1 Lakh)
  'INE530B08110': 1000,   // IIFL Finance Zero Coupon (Public Issue ₹1,000)
  'INE530L07509': 1000,   // Nido Home Finance 9.30% (Public Issue ₹1,000)
  'INE530L07566': 1000,   // Nido Home Finance 9.20% (Public Issue ₹1,000)
  'INE532F07DG1': 1000,   // EFSL Zero Coupon (Public Issue ₹1,000)
  'INE532F07FI2': 1000,   // EFSL 10.10% (Public Issue ₹1,000)
  'INE532F07GE9': 1000,   // EFSL 10.00% (Public Issue ₹1,000)
  'INE549K07EF5': 1000,   // Muthoot Fincorp 9.60% (Public Issue ₹1,000)
  'INE549K07EU4': 1000    // Muthoot Fincorp 9.00% (Public Issue ₹1,000)
};

export const CORE_ISSUER_REGISTRY: Record<string, IssuerKnowledge> = {
  'tapir': {
    companyKey: 'tapir',
    displayName: 'Tapir Constructions Ltd',
    parentGroup: 'Embassy / Sammaan Group',
    sector: 'Real Estate & Infrastructure Development',
    rating: 'IVR A- (CE) / Stable',
    ratingAgency: 'INFOMERICS',
    ratingTrend: 'improving',
    promoterPedigree: 'Wholly owned SPV of Embassy Developments Limited (formerly Indiabulls Real Estate). Debt is supported by unconditional & irrevocable corporate guarantee with structured DSRA escrow.',
    carPercent: 18.2,
    gnpaPercent: 4.1,
    keyRiskOrStrength: 'Credit enhanced by Embassy parent; structured escrow buffers construction risk with high 12.5% yield.',
    historicalRatings: [
      {
        agency: 'INFOMERICS',
        rating: 'IVR A- (CE)',
        outlook: 'Stable',
        date: '2025-11-15',
        commentary: 'Rating reaffirmed at IVR A- (CE) with Stable outlook. The rating continues to derive strength from the unconditional and irrevocable corporate guarantee provided by Embassy Developments Ltd and a structured debt service reserve account (DSRA) mechanism.',
        creditEnhancement: 'Corporate Guarantee from Embassy Developments Ltd'
      },
      {
        agency: 'INFOMERICS',
        rating: 'IVR A- (CE)',
        outlook: 'Stable',
        date: '2024-10-22',
        commentary: 'Reaffirmed with Stable outlook based on cashflow visibility from ongoing commercial and residential assets and strict escrow waterfall priority for debenture servicing.',
        creditEnhancement: 'Corporate Guarantee from Embassy Developments Ltd'
      },
      {
        agency: 'INFOMERICS',
        rating: 'IVR A- (CE)',
        outlook: 'Stable',
        date: '2024-04-12',
        commentary: 'Rating upgraded from IVR BBB+ following execution of legally enforceable tripartite corporate guarantee and project escrow agreements.',
        creditEnhancement: 'Corporate Guarantee from Embassy Developments Ltd'
      },
      {
        agency: 'INFOMERICS',
        rating: 'IVR BBB+',
        outlook: 'Positive',
        date: '2023-10-18',
        commentary: 'Initial rating assigned at IVR BBB+ with Positive outlook reflecting standalone asset valuation and impending institutional sponsor restructuring.'
      }
    ],
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
    historicalRatings: [
      {
        agency: 'CARE',
        rating: 'CARE A',
        outlook: 'Stable',
        date: '2025-09-10',
        commentary: 'Upgraded to CARE A on the back of sustained growth in AUM, improved operational profitability, and robust equity capitalization supported by marquee global investors.'
      },
      {
        agency: 'CRISIL',
        rating: 'CRISIL A-',
        outlook: 'Positive',
        date: '2024-11-20',
        commentary: 'Outlook revised to Positive from Stable reflecting consistent asset quality performance and rapid retail scale-up.'
      },
      {
        agency: 'CARE',
        rating: 'CARE A-',
        outlook: 'Stable',
        date: '2024-03-15',
        commentary: 'Reaffirmed at CARE A- Stable citing comfortable capital adequacy and strong technology stack.'
      },
      {
        agency: 'CRISIL',
        rating: 'CRISIL BBB+',
        outlook: 'Positive',
        date: '2023-08-11',
        commentary: 'Initial CRISIL investment-grade rating assigned acknowledging disciplined risk underwriting and equity infusions.'
      }
    ],
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
    historicalRatings: [
      { agency: 'CARE', rating: 'CARE A', outlook: 'Stable', date: '2025-09-10', commentary: 'Upgraded to CARE A based on robust profitability and portfolio seasoning.' },
      { agency: 'CRISIL', rating: 'CRISIL A-', outlook: 'Positive', date: '2024-11-20', commentary: 'Positive outlook on strong risk control and low credit loss rates.' },
      { agency: 'CARE', rating: 'CARE A-', outlook: 'Stable', date: '2024-03-15', commentary: 'Reaffirmed at CARE A- Stable.' },
      { agency: 'CRISIL', rating: 'CRISIL BBB+', outlook: 'Positive', date: '2023-08-11', commentary: 'Initial rating assigned.' }
    ],
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
    historicalRatings: [
      {
        agency: 'CRISIL',
        rating: 'CRISIL BBB+',
        outlook: 'Stable',
        date: '2025-10-05',
        commentary: 'CRISIL BBB+ / Stable reaffirmed. The rating reflects healthy capitalization, established track record in gold loan business, and sound asset quality supported by liquid collateral.'
      },
      {
        agency: 'ACUITE',
        rating: 'ACUITE A-',
        outlook: 'Stable',
        date: '2025-04-18',
        commentary: 'ACUITE A- reaffirmed noting strong profitability, low credit costs, and experienced management team.'
      },
      {
        agency: 'CRISIL',
        rating: 'CRISIL BBB+',
        outlook: 'Stable',
        date: '2024-09-28',
        commentary: 'Reaffirmed with Stable outlook as gold loan portfolio expanded across southern states.'
      },
      {
        agency: 'ACUITE',
        rating: 'ACUITE A-',
        outlook: 'Stable',
        date: '2024-02-14',
        commentary: 'Upgraded from ACUITE BBB+ on sustained growth in AUM and comfortable liquidity cushion.'
      }
    ],
    lastUpdated: '2026-08'
  },
  'lucina': {
    companyKey: 'lucina',
    displayName: 'Lucina Land Development Ltd (LLDL)',
    parentGroup: 'Embassy / Sammaan Group',
    sector: 'Real Estate Commercial Land Development',
    rating: 'IVR BBB+ (CE) / Stable',
    ratingAgency: 'INFOMERICS',
    ratingTrend: 'stable',
    promoterPedigree: 'Real estate land development entity with high 13.5% coupon and structured project cashflow escrow.',
    carPercent: 16.5,
    gnpaPercent: 5.2,
    keyRiskOrStrength: 'Subordinated project cashflows; cushioned by structured escrow and land asset backing.',
    historicalRatings: [
      {
        agency: 'INFOMERICS',
        rating: 'IVR BBB+ (CE)',
        outlook: 'Stable',
        date: '2025-08-19',
        commentary: 'Rating maintained at IVR BBB+ (CE) supported by project escrow collections and land parcel mortgaged security cover.'
      },
      {
        agency: 'INFOMERICS',
        rating: 'IVR BBB+ (CE)',
        outlook: 'Stable',
        date: '2024-11-10',
        commentary: 'Reaffirmed with Stable outlook reflecting satisfactory development milestones on residential projects.'
      },
      {
        agency: 'INFOMERICS',
        rating: 'IVR BBB+ (CE)',
        outlook: 'Stable',
        date: '2024-03-20',
        commentary: 'Assigned IVR BBB+ (CE) with credit enhancement mechanism in place.'
      },
      {
        agency: 'BRICKWORK',
        rating: 'BWR BBB-',
        outlook: 'Stable',
        date: '2023-09-12',
        commentary: 'Initial standalone rating assigned prior to credit enhancement structure.'
      }
    ],
    lastUpdated: '2026-08'
  },
  'keertana': {
    companyKey: 'keertana',
    displayName: 'Keertana Finserv Ltd (KFL)',
    parentGroup: 'Keertana Group (Padmaja Reddy)',
    sector: 'Rural Microfinance & Gold Loans (MFI)',
    rating: 'CARE A- / CRISIL A-',
    ratingAgency: 'CARE',
    ratingTrend: 'improving',
    promoterPedigree: 'Founded by veteran microfinance pioneer Padmaja Reddy (ex-Spandana). High rural distribution with conservative hybrid gold/JLG model.',
    carPercent: 24.1,
    gnpaPercent: 2.4,
    keyRiskOrStrength: 'High promoter operational credibility; strong collection efficiency across AP, Telangana & Karnataka.',
    historicalRatings: [
      { agency: 'CARE', rating: 'CARE A-', outlook: 'Stable', date: '2025-11-04', commentary: 'Upgraded to CARE A- Stable citing strong profitability, high capital adequacy (24.1%), and seasoned JLG/gold portfolio.' },
      { agency: 'CRISIL', rating: 'CRISIL A-', outlook: 'Stable', date: '2025-03-22', commentary: 'Assigned CRISIL A- Stable acknowledging experienced management and diversified liability mix.' },
      { agency: 'CARE', rating: 'CARE BBB+', outlook: 'Positive', date: '2024-08-15', commentary: 'Outlook revised to Positive on rapid institutional growth.' },
      { agency: 'CARE', rating: 'CARE BBB+', outlook: 'Stable', date: '2023-11-30', commentary: 'Initial investment grade rating assigned.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2025-09-25', commentary: 'CRISIL AA / Stable reaffirmed. Wholesale book de-risked; retail co-lending with major public sector banks expanded.' },
      { agency: 'ICRA', rating: 'ICRA AA', outlook: 'Stable', date: '2025-03-12', commentary: 'ICRA AA reaffirmed with comfortable capital adequacy and large liquidity reserves.' },
      { agency: 'CARE', rating: 'CARE AA', outlook: 'Stable', date: '2024-09-18', commentary: 'Reaffirmed post corporate rebranding to Sammaan Capital Limited.' },
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2024-02-10', commentary: 'Stable outlook reaffirmed with steady asset quality.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2025-09-25', commentary: 'CRISIL AA / Stable reaffirmed post-transformation into retail-focused HFC.' },
      { agency: 'ICRA', rating: 'ICRA AA', outlook: 'Stable', date: '2025-03-12', commentary: 'ICRA AA / Stable reaffirmed.' },
      { agency: 'CARE', rating: 'CARE AA', outlook: 'Stable', date: '2024-09-18', commentary: 'CARE AA / Stable reaffirmed.' },
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2024-02-10', commentary: 'Rating reaffirmed.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2025-09-25', commentary: 'Reaffirmed at CRISIL AA supported by 100% parent ownership by Sammaan Capital.' },
      { agency: 'CARE', rating: 'CARE AA', outlook: 'Stable', date: '2025-02-18', commentary: 'CARE AA reaffirmed with sound capital position.' },
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2024-09-15', commentary: 'Reaffirmed.' },
      { agency: 'CARE', rating: 'CARE AA', outlook: 'Stable', date: '2024-01-20', commentary: 'Reaffirmed.' }
    ],
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
    historicalRatings: [
      { agency: 'ICRA', rating: 'ICRA A-', outlook: 'Stable', date: '2025-10-12', commentary: 'ICRA A- Stable reaffirmed. Driven by parent support and fully secured MSME portfolio.' },
      { agency: 'CARE', rating: 'CARE A-', outlook: 'Stable', date: '2025-04-08', commentary: 'CARE A- Stable reaffirmed with comfortable capital adequacy.' },
      { agency: 'ICRA', rating: 'ICRA A-', outlook: 'Stable', date: '2024-10-15', commentary: 'Reaffirmed.' },
      { agency: 'CARE', rating: 'CARE BBB+', outlook: 'Positive', date: '2024-02-11', commentary: 'Upgraded to CARE A- on capital infusion.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL AA-', outlook: 'Stable', date: '2025-08-20', commentary: 'CRISIL AA- / Stable reaffirmed. Strategic importance to IIFL Finance parent and robust liquidity cushion.' },
      { agency: 'ICRA', rating: 'ICRA AA-', outlook: 'Stable', date: '2025-02-14', commentary: 'ICRA AA- reaffirmed citing nationwide diversification.' },
      { agency: 'CRISIL', rating: 'CRISIL AA-', outlook: 'Stable', date: '2024-08-10', commentary: 'Reaffirmed.' },
      { agency: 'ICRA', rating: 'ICRA AA-', outlook: 'Stable', date: '2024-01-25', commentary: 'Reaffirmed.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL AA+', outlook: 'Stable', date: '2025-09-14', commentary: 'CRISIL AA+ / Stable reaffirmed. Outstanding capital adequacy (43.2%) and strong shareholder profile with ADIA equity stake.' },
      { agency: 'ICRA', rating: 'ICRA AA+', outlook: 'Stable', date: '2025-03-02', commentary: 'ICRA AA+ reaffirmed highlighting lowest GNPA in affordable housing segment.' },
      { agency: 'CRISIL', rating: 'CRISIL AA+', outlook: 'Stable', date: '2024-09-08', commentary: 'Reaffirmed.' },
      { agency: 'ICRA', rating: 'ICRA AA+', outlook: 'Stable', date: '2024-02-18', commentary: 'Reaffirmed.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2025-09-18', commentary: 'CRISIL AA / Stable reaffirmed. Operational normalization in gold loan segment post-RBI clearance and strong liquidity position.' },
      { agency: 'ICRA', rating: 'ICRA AA', outlook: 'Stable', date: '2025-03-20', commentary: 'ICRA AA reaffirmed with Stable outlook.' },
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Watch Developing', date: '2024-03-10', commentary: 'Placed on Watch Developing following regulatory embargo.' },
      { agency: 'CRISIL', rating: 'CRISIL AA', outlook: 'Stable', date: '2024-09-15', commentary: 'Removed from watch and reinstated Stable outlook after RBI lifted gold loan restrictions.' }
    ],
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
    historicalRatings: [
      { agency: 'ICRA', rating: 'ICRA A+', outlook: 'Stable', date: '2025-08-11', commentary: 'ICRA A+ / Stable reaffirmed. Asset management fee predictability and high growth in alternative private debt funds.' },
      { agency: 'CRISIL', rating: 'CRISIL A+', outlook: 'Stable', date: '2025-02-09', commentary: 'CRISIL A+ reaffirmed.' },
      { agency: 'ICRA', rating: 'ICRA A+', outlook: 'Stable', date: '2024-08-18', commentary: 'Reaffirmed.' },
      { agency: 'CRISIL', rating: 'CRISIL A+', outlook: 'Stable', date: '2024-01-14', commentary: 'Reaffirmed.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL A+', outlook: 'Stable', date: '2025-09-02', commentary: 'CRISIL A+ / Stable reaffirmed. Retail mortgage asset quality remains resilient with strong co-lending traction.' },
      { agency: 'ICRA', rating: 'ICRA A+', outlook: 'Stable', date: '2025-03-10', commentary: 'ICRA A+ reaffirmed.' },
      { agency: 'CRISIL', rating: 'CRISIL A+', outlook: 'Stable', date: '2024-09-05', commentary: 'Reaffirmed.' },
      { agency: 'ICRA', rating: 'ICRA A+', outlook: 'Stable', date: '2024-02-12', commentary: 'Reaffirmed.' }
    ],
    lastUpdated: '2026-08'
  },
  'efsl': {
    companyKey: 'efsl',
    displayName: 'Edelweiss Financial Services Ltd (EFSL)',
    parentGroup: 'Edelweiss Group (Rashesh Shah)',
    sector: 'Financial Services Holding Company',
    rating: 'CRISIL A+ / ICRA A+',
    ratingAgency: 'CRISIL',
    ratingTrend: 'deteriorating',
    promoterPedigree: 'Listed parent holding company. Elevated group debt clusters and reliance on asset monetization.',
    carPercent: 18.5,
    gnpaPercent: 3.8,
    keyRiskOrStrength: 'Elevated promoter group debt cluster; multiple ISIN holdings in single portfolio creates dangerous concentration risk.',
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL A+', outlook: 'Negative', date: '2025-10-18', commentary: 'Outlook revised to Negative from Stable on account of slower-than-anticipated group debt reduction and significant debt repayment obligations.' },
      { agency: 'ICRA', rating: 'ICRA A+', outlook: 'Negative', date: '2025-05-14', commentary: 'Outlook revised to Negative citing leverage at parent holding company level.' },
      { agency: 'CRISIL', rating: 'CRISIL A+', outlook: 'Stable', date: '2024-10-10', commentary: 'CRISIL A+ Stable reaffirmed.' },
      { agency: 'ICRA', rating: 'ICRA A+', outlook: 'Stable', date: '2024-04-12', commentary: 'ICRA A+ Stable reaffirmed.' }
    ],
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
    historicalRatings: [
      { agency: 'CRISIL', rating: 'CRISIL AA-', outlook: 'Stable', date: '2025-09-12', commentary: 'CRISIL AA- / Stable reaffirmed. Established market position in gold lending, adequate capital position, and regular servicing track record.' },
      { agency: 'ICRA', rating: 'ICRA AA-', outlook: 'Stable', date: '2025-02-28', commentary: 'ICRA AA- reaffirmed with Stable outlook.' },
      { agency: 'CRISIL', rating: 'CRISIL AA-', outlook: 'Stable', date: '2024-09-14', commentary: 'Reaffirmed.' },
      { agency: 'ICRA', rating: 'ICRA AA-', outlook: 'Stable', date: '2024-02-20', commentary: 'Reaffirmed.' }
    ],
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
