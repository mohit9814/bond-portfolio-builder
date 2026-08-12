import * as XLSX from 'xlsx';
import { DefaultBond } from './defaultInventory';

export async function parseExcelInventory(file: File, baseDate: Date = new Date()): Promise<DefaultBond[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with raw headers
        const rawRows = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
        
        const bonds: DefaultBond[] = [];

        for (const row of rawRows) {
          // Normalize keys (remove spaces, convert to lowercase for loose matching)
          const normalizedRow: Record<string, unknown> = {};
          for (const key of Object.keys(row)) {
            normalizedRow[key.trim().replace(/\r?\n|\r/g, ' ').toLowerCase()] = row[key];
          }

          // Resolve fields
          const isin = String(normalizedRow['isin'] || '').trim();
          const issuer = String(normalizedRow['issuer name'] || normalizedRow['issuer'] || '').trim();
          
          if (!isin || !issuer) continue;

          // Exclude "Bundle - Flexi" category
          const category = String(
            normalizedRow['category (in new version)'] ||
            normalizedRow['category'] ||
            normalizedRow['category_new'] ||
            ''
          ).trim().toLowerCase();
          if (category.includes('bundle - flexi') || category.includes('bundle-flexi')) {
            continue;
          }

          // Parse coupon
          const rawCoupon = normalizedRow['coupon'] || normalizedRow['coupon '];
          let coupon: number | null = null;
          if (typeof rawCoupon === 'number') {
            coupon = rawCoupon;
          } else if (typeof rawCoupon === 'string' && rawCoupon.trim().toLowerCase() !== 'zero') {
            const parsed = parseFloat(rawCoupon);
            if (!isNaN(parsed)) coupon = parsed;
          }

          // Parse yield
          const rawYield = normalizedRow['offer yield'] || normalizedRow['yield'] || normalizedRow['offer_yield'];
          let yieldVal: number | null = null;
          if (typeof rawYield === 'number') {
            yieldVal = rawYield;
          } else if (typeof rawYield === 'string' && rawYield.trim() !== '-') {
            const parsed = parseFloat(rawYield);
            if (!isNaN(parsed)) yieldVal = parsed;
          }

          // If yield is missing, use coupon. If coupon is missing or null, default to 0.0
          const finalYield = yieldVal !== null ? yieldVal : (coupon !== null ? coupon : 0.0);

          // Parse redemption date
          const rawMaturity = normalizedRow['redemption date'] || normalizedRow['maturity date'] || normalizedRow['redemption_date'];
          let maturityDate: Date | null = null;
          if (rawMaturity instanceof Date) {
            maturityDate = rawMaturity;
          } else if (typeof rawMaturity === 'string') {
            const parsed = new Date(rawMaturity);
            if (!isNaN(parsed.getTime())) maturityDate = parsed;
          }

          if (!maturityDate) continue;

          // Calculate tenure in months
          const diffTime = maturityDate.getTime() - baseDate.getTime();
          const months = Math.round((diffTime / (1000 * 60 * 60 * 24 * 30.4375)) * 10) / 10;

          const rating = String(normalizedRow['credit rating'] || normalizedRow['rating'] || 'Unrated').trim();
          const frequency = String(normalizedRow['interest payment frequency'] || normalizedRow['frequency'] || 'ON MATURITY').trim();

          // Parse total tradable FV
          const rawFV = normalizedRow['total tradable fv'] || normalizedRow['total tradable_fv'] || normalizedRow['face value'] || normalizedRow['face_value'];
          let totalTradableFV: number | undefined = undefined;
          if (typeof rawFV === 'number') {
            totalTradableFV = rawFV;
          } else if (typeof rawFV === 'string') {
            const parsed = parseFloat(rawFV.replace(/,/g, ''));
            if (!isNaN(parsed)) totalTradableFV = parsed;
          }

          // Parse Guarantor and Rating Trend fields
          const guarantor = String(
            normalizedRow['guarantor'] ||
            normalizedRow['guarantor name'] ||
            normalizedRow['guarantor_name'] ||
            normalizedRow['parent company'] ||
            ''
          ).trim() || undefined;

          const guarantorRating = String(
            normalizedRow['guarantor rating'] ||
            normalizedRow['guarantor_rating'] ||
            normalizedRow['parent rating'] ||
            ''
          ).trim() || undefined;

          const rawTrend = String(
            normalizedRow['rating trend'] ||
            normalizedRow['rating_trend'] ||
            normalizedRow['outlook'] ||
            normalizedRow['rating outlook'] ||
            ''
          ).trim().toLowerCase();

          let ratingTrend: 'stable' | 'improving' | 'deteriorating' | undefined = undefined;
          if (rawTrend.includes('improv') || rawTrend.includes('positive') || rawTrend.includes('upgrad')) {
            ratingTrend = 'improving';
          } else if (rawTrend.includes('deteriorat') || rawTrend.includes('negative') || rawTrend.includes('downgrad')) {
            ratingTrend = 'deteriorating';
          } else if (rawTrend.includes('stabl')) {
            ratingTrend = 'stable';
          }

          const rawSector = String(
            normalizedRow['sector'] ||
            normalizedRow['industry'] ||
            normalizedRow['sector/industry'] ||
            normalizedRow['sub-sector'] ||
            ''
          ).trim();

          const ratingOutlookNote = String(
            normalizedRow['rating note'] ||
            normalizedRow['outlook note'] ||
            normalizedRow['rating_outlook_note'] ||
            ''
          ).trim() || undefined;

          bonds.push({
            isin,
            issuer,
            coupon,
            yield: finalYield,
            maturity: maturityDate.toISOString().split('T')[0],
            months,
            rating,
            frequency,
            totalTradableFV,
            sector: rawSector || undefined,
            category,
            guarantor,
            guarantorRating,
            ratingTrend,
            ratingOutlookNote
          });
        }

        resolve(bonds);
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + (err as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading error.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
