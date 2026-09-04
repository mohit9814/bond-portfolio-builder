import { DefaultBond } from '../defaultInventory';
import { PortfolioHolding } from './types';
import { getIssuerKnowledge, KNOWN_ISIN_FACE_VALUES } from './issuerKnowledgeDatabase';

export const SAMPLE_PORTFOLIO_RAW = `Sr. No.\tISIN\tSecurity Name\tQty
1\tINE00DJ07052\tTAPIR CONSTRUCTIONS LTD\t6
2\tINE01YL07383\tESPL-10.70%-5-3-27-PVT\t1
3\tINE0BUS07BQ9\tIML-11%-11-11-26-PVT\t2
4\tINE0BUS07BR7\tIML-11.25%-13-11-26-PVT\t2
5\tINE0JZO07032\tLLDL-13.50%-30-01-29-PVT\t9
6\tINE0NES07329\tKFL-12%-22-09-27-PVT\t10
7\tINE148I07GK5\tIBHFL-8.85%-26-9-26-NCDS\t56
8\tINE148I07GL3\tSEC RED NCD 9.0% SR. VI\t500
9\tINE244L08034\t845ICCL28\t4
10\tINE244L08059\tSFIL-8.80%-2-5-28-PVT\t12
11\tINE413U08093\tIIFL SAMASTA FIN LTD#11%\t6
12\tINE477L08147\tIIHFL\t144
13\tINE528L07115\t108EAAAL27\t2
14\tINE530B08110\tIIFL FINANCE LTD\t64
15\tINE530L07509\tNIDO-9.30%-29-4-32-NCD\t22
16\tINE530L07566\tNHFL-9.20%-15-9-26-NCD\t180
17\tINE532F07DG1\tEFSL-ZERO COUPON-20-1-28-NCD\t894
18\tINE532F07FI2\tEFSL-10.10%-29-4-29-NCD\t90
19\tINE532F07GE9\tEFSL-10%-24-10-27-NCD\t196
20\tINE549K07EF5\tMFCL-16-9-30-NCD\t60
21\tINE549K07EU4\tMFCL-9%-30-10-26-NCD\t290`;

interface RawParsedRow {
  srNo: number;
  isin: string;
  securityName: string;
  qty: number;
}

/**
 * Parses raw text input (Tab-delimited, CSV, or line-by-line table) into structured portfolio holdings.
 */
export function parsePortfolioInput(rawText: string, referenceInventory: DefaultBond[]): PortfolioHolding[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.trim().split(/\r?\n/);
  const rawRows: RawParsedRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by tab, comma, or multiple whitespace/pipes
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(p => p.trim());
    } else if (line.includes('|')) {
      parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
    } else {
      parts = line.split(/\s{2,}/).map(p => p.trim());
    }

    if (parts.length < 2) continue;

    // Detect header row
    const lowerFirst = parts[0].toLowerCase();
    const lowerSecond = (parts[1] || '').toLowerCase();
    if (
      lowerFirst.includes('sr') || lowerFirst.includes('isin') ||
      lowerSecond.includes('isin') || lowerFirst.includes('security')
    ) {
      continue;
    }

    let srNo = rawRows.length + 1;
    let isin = '';
    let secName = '';
    let qty = 1;

    // Pattern A: SrNo (0), ISIN (1), Name (2), Qty (3)
    if (parts[1] && parts[1].toUpperCase().startsWith('INE') && parts[1].length === 12) {
      srNo = parseInt(parts[0], 10) || (rawRows.length + 1);
      isin = parts[1].toUpperCase();
      secName = parts[2] || isin;
      qty = parseInt(parts[3] || '1', 10) || 1;
    }
    // Pattern B: ISIN (0), Name (1), Qty (2)
    else if (parts[0] && parts[0].toUpperCase().startsWith('INE') && parts[0].length === 12) {
      isin = parts[0].toUpperCase();
      secName = parts[1] || isin;
      qty = parseInt(parts[2] || '1', 10) || 1;
    }
    // Pattern C: Any field contains a 12-char INE code
    else {
      const isinIdx = parts.findIndex(p => p.toUpperCase().startsWith('INE') && p.length === 12);
      if (isinIdx !== -1) {
        isin = parts[isinIdx].toUpperCase();
        secName = parts[isinIdx + 1] || parts[0] || isin;
        qty = parseInt(parts[parts.length - 1] || '1', 10) || 1;
      }
    }

    if (isin) {
      rawRows.push({
        srNo,
        isin,
        securityName: secName,
        qty: Math.max(1, qty)
      });
    }
  }

  // Calculate estimated values and enrich with bond details
  const inventoryMap = new Map<string, DefaultBond>();
  referenceInventory.forEach(b => inventoryMap.set(b.isin.toUpperCase(), b));

  let totalValue = 0;
  const enrichedList = rawRows.map(row => {
    const matchedBond = inventoryMap.get(row.isin);
    const knowledge = getIssuerKnowledge(row.securityName + ' ' + row.isin + ' ' + (matchedBond?.issuer || ''));

    // Extract embedded coupon from security name (e.g., "10.70%", "11%", "ZERO COUPON", "8.85%", "845ICCL28")
    let couponPct = matchedBond && matchedBond.coupon !== null ? matchedBond.coupon * 100 : 10.0;
    if (row.securityName.toLowerCase().includes('zero coupon')) {
      couponPct = 0.0;
    } else {
      const couponMatch = row.securityName.match(/(\d+(\.\d+)?)%/);
      if (couponMatch && couponMatch[1]) {
        couponPct = parseFloat(couponMatch[1]);
      } else {
        const codeMatch = row.securityName.match(/^(\d{3,4})[A-Za-z]/);
        if (codeMatch && codeMatch[1]) {
          const num = parseInt(codeMatch[1], 10);
          couponPct = num > 100 ? num / 100 : num;
        } else if (row.isin.toUpperCase() === 'INE244L08034') {
          couponPct = 8.45;
        } else if (row.isin.toUpperCase() === 'INE148I07GK5') {
          couponPct = 8.85;
        } else if (row.isin.toUpperCase() === 'INE244L08059') {
          couponPct = 8.80;
        }
      }
    }

    // Extract maturity year from security name if available (e.g., "-27", "-28", "-32")
    let matDate = matchedBond ? matchedBond.maturity : '2027-12-31';
    let monthsToMat = matchedBond ? matchedBond.months : 24;

    const dateMatch = row.securityName.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      let year = parseInt(dateMatch[3], 10);
      if (year < 100) year += 2000;
      matDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const today = new Date();
      const target = new Date(year, month - 1, day);
      const diffMs = target.getTime() - today.getTime();
      monthsToMat = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60 * 24 * 30.4375)) * 10) / 10);
    }

    const isinUpper = row.isin.toUpperCase();
    const faceVal = KNOWN_ISIN_FACE_VALUES[isinUpper] || (matchedBond?.faceValue) || getEstimatedFaceValue(row.securityName, row.qty);
    const estVal = row.qty * faceVal;
    totalValue += estVal;

    const rating = matchedBond ? matchedBond.rating : knowledge.rating;
    const ratingTrend = matchedBond?.ratingTrend || knowledge.ratingTrend;
    const issuerName = matchedBond?.issuer || knowledge.displayName;
    const readableName = formatReadableSecurityName(row.securityName, row.isin, knowledge, couponPct, matDate);

    const holding: PortfolioHolding = {
      srNo: row.srNo,
      isin: row.isin,
      securityName: readableName, // Primary readable title
      readableName,
      rawSecurityName: row.securityName, // Kept for reference
      qty: row.qty,
      faceValue: faceVal,
      estimatedMarketValue: estVal,
      couponPercent: couponPct,
      yieldPercent: matchedBond ? matchedBond.yield * 100 : (couponPct > 0 ? couponPct : 10.25),
      maturityDate: matDate,
      monthsToMaturity: monthsToMat,
      frequency: matchedBond?.frequency || 'ANNUALLY',
      rating,
      ratingAgency: knowledge.ratingAgency,
      ratingTrend,
      issuerName,
      parentGroup: knowledge.parentGroup,
      sector: knowledge.sector,
      broadSector: knowledge.broadSector || knowledge.sector,
      subSector: knowledge.subSector || 'General Debt',
      isSecured: !row.securityName.toLowerCase().includes('unsecured'),
      weightPercent: 0, // populated below
      historicalRatings: knowledge.historicalRatings || []
    };

    return holding;
  });

  // Calculate accurate portfolio weights
  return enrichedList.map(h => ({
    ...h,
    weightPercent: totalValue > 0 ? (h.estimatedMarketValue / totalValue) * 100 : 0
  }));
}

export function formatReadableSecurityName(
  rawSecName: string,
  isin: string,
  knowledge: { displayName: string },
  couponPct: number,
  matDate: string
): string {
  const isinUpper = isin.toUpperCase();
  const year = matDate.split('-')[0];

  const KNOWN_READABLE_NAMES: Record<string, string> = {
    'INE00DJ07052': 'Tapir Constructions Ltd (Embassy Group)',
    'INE01YL07383': 'EarlySalary Services Pvt Ltd (Fibe)',
    'INE0BUS07BQ9': 'Indel Money Ltd',
    'INE0BUS07BR7': 'Indel Money Ltd',
    'INE0JZO07032': 'Lucina Land Development Ltd (Embassy)',
    'INE0NES07329': 'Keertana Finserv Ltd',
    'INE148I07GK5': 'Sammaan Capital Ltd (formerly Indiabulls HFC)',
    'INE148I07GL3': 'Sammaan Capital Ltd (Series VI)',
    'INE244L08034': 'Sammaan Finserve Ltd (formerly ICCL)',
    'INE244L08059': 'Satin Finserv Ltd (SFIL)',
    'INE413U08093': 'IIFL Samasta Finance Ltd',
    'INE477L08147': 'IIFL Home Finance Ltd (IIHFL)',
    'INE528L07115': 'EAAA India Alternatives Ltd (Edelweiss Alts)',
    'INE530B08110': 'IIFL Finance Ltd',
    'INE530L07509': 'Nido Home Finance Ltd (Edelweiss Housing)',
    'INE530L07566': 'Nido Home Finance Ltd (Edelweiss Housing)',
    'INE532F07DG1': 'Edelweiss Financial Services Ltd (EFSL)',
    'INE532F07FI2': 'Edelweiss Financial Services Ltd (EFSL)',
    'INE532F07GE9': 'Edelweiss Financial Services Ltd (EFSL)',
    'INE549K07EF5': 'Muthoot Fincorp Ltd',
    'INE549K07EU4': 'Muthoot Fincorp Ltd'
  };

  const baseName = KNOWN_READABLE_NAMES[isinUpper] || knowledge.displayName || rawSecName;
  const couponText = couponPct === 0 ? 'Zero Coupon' : `${couponPct.toFixed(2)}%`;
  
  if (year && year !== '2027') {
    return `${baseName} • ${couponText} (${year})`;
  }
  return `${baseName} • ${couponText}`;
}

/**
 * Heuristic face value calculation based on ticket quantities.
 * In India, retail public issue NCDs have ₹1,000 face value, while private placements have ₹1,00,000 or ₹10,00,000.
 */
function getEstimatedFaceValue(secName: string, qty: number): number {
  const s = secName.toLowerCase();
  if (s.includes('pvt') || s.includes('private')) {
    return 100000;
  }
  if (qty >= 50) {
    return 1000; // Retail public issue bond (₹1,000 / unit)
  }
  return 100000; // Standard ₹1 Lakh / unit
}
