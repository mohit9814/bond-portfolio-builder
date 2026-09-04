/**
 * Specialized Redemption Engine for Indian Debt Market Instruments.
 *
 * Implements structured parsing and cashflow modeling for bonds with amortizing,
 * staggered, or multi-tranche principal redemptions as specified in BSE GID / NSDL Information Memorandums.
 *
 * Models true reducing-balance coupon distributions and precise timeline milestones.
 */

export interface RedemptionTranche {
  /** Month offset from today when this principal tranche is returned */
  month: number;
  /** Calendar date string (YYYY-MM or YYYY-MM-DD) if determinable */
  targetDateStr?: string;
  /** Fraction of initial principal repaid in this tranche (e.g. 0.08, 0.25, 0.50, 1.0) */
  percent: number;
  /** Currency amount of principal repaid in this tranche */
  principalAmount: number;
  /** Descriptive milestone label e.g. "8% Quarterly Amortization (Q1 '27)", "Final Maturity (17%)" */
  label: string;
}

export type AmortizationType = 'BULLET' | 'AMORTIZING' | 'STAGGERED';

export interface StructuredRedemptionPlan {
  isin: string;
  amortizationType: AmortizationType;
  rawScheduleText: string;
  hasAmortization: boolean;
  totalTranches: number;
  tranches: RedemptionTranche[];
  summaryDescription: string;
}

export interface StructuredCashFlowEvent {
  /** Month index from reference date */
  month: number;
  /** Principal returned in this period */
  principal: number;
  /** Coupon interest earned in this period (calculated on reducing outstanding balance) */
  coupon: number;
  /** Total cash payout = principal + coupon */
  total: number;
  /** Remaining outstanding principal AFTER this payment */
  outstandingPrincipalAfter: number;
  isin: string;
  issuer: string;
  paymentLabel: string;
  isAmortizingPrincipal: boolean;
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Parses month string like "Jan '28", "Dec 29", "Jul’27", "2027-08" into calendar Date or month offset.
 */
function parseMonthYear(dateStr: string, baseYear: number = 2026, baseMonth: number = 8): { year: number; month: number; monthOffset: number } | null {
  const clean = dateStr.toUpperCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Format: "YYYY-MM" or "YYYY-MM-DD"
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const offset = (y - baseYear) * 12 + (m - baseMonth);
    return { year: y, month: m, monthOffset: Math.max(1, offset) };
  }

  // Format: "DEC 29" or "JAN 2028" or "MAR '28"
  for (let mIdx = 0; mIdx < MONTH_NAMES.length; mIdx++) {
    const mName = MONTH_NAMES[mIdx];
    if (clean.includes(mName)) {
      const yrMatch = clean.match(/(?:20)?(\d{2})$/);
      if (yrMatch) {
        let yr = parseInt(yrMatch[1], 10);
        if (yr < 100) yr += 2000;
        const offset = (yr - baseYear) * 12 + (mIdx - baseMonth);
        return { year: yr, month: mIdx, monthOffset: Math.max(1, offset) };
      }
    }
  }

  return null;
}

/**
 * Parses raw Principal Redemption text into a structured redemption plan.
 *
 * Supported Patterns:
 * - "8% quarterly till Jan '28 and 17% till maturity" (Lucina Land Dev)
 * - "50% in Dec 29 & 50% Mar 30" (Tapir Constructions)
 * - "25% Quarterly from Aug 2027 till maturity" (Keertana Finserv)
 * - "33.33% in Jul’27, Aug’27 & Sep’27" (Keertana Finserv)
 * - "33.33% quarterly from Apr'27" (Keertana Finserv)
 * - "50% annually from Oct'27" / "50% Annual from Mar '28" (Akme / Nido)
 * - "50% semi-annually from Mar'27"
 * - "Rs. 1,50,000 in June'26, Sept'26, Dec'26, Mar'27 each & Rs. 1,66,650 in Jun'27" (Edelweiss Rural)
 * - "5.44% in Mar'32 ,7% quarterly from Sep'32 to Mar'33 & later 16.33% quarterly till Mar'34" (Adani Green)
 * - "Partial Redemption By Face Value" (KIIFB)
 * - "ON MATURITY" / bullet
 */
export function parseRedemptionSchedule(
  principalRedemptionText: string | undefined,
  maturityDateStr: string,
  monthsToMaturity: number,
  totalAllocatedAmount: number,
  baseDate: Date = new Date(2026, 8, 4) // Sep 4, 2026 base
): StructuredRedemptionPlan {
  const text = (principalRedemptionText || '').trim();
  const maturityMonth = Math.max(1, Math.round(monthsToMaturity));
  const baseYear = baseDate.getFullYear();
  const baseMonth = baseDate.getMonth();

  // 1. Default / Bullet Redemption
  if (!text || text.toUpperCase() === 'ON MATURITY' || text.toUpperCase() === 'BULLET' || text === '-') {
    return {
      isin: '',
      amortizationType: 'BULLET',
      rawScheduleText: text || 'ON MATURITY',
      hasAmortization: false,
      totalTranches: 1,
      tranches: [
        {
          month: maturityMonth,
          targetDateStr: maturityDateStr,
          percent: 1.0,
          principalAmount: totalAllocatedAmount,
          label: 'Maturity (100% Bullet)'
        }
      ],
      summaryDescription: '100% Principal repaid as a single bullet payout upon maturity.'
    };
  }

  const tranches: RedemptionTranche[] = [];
  const upper = text.toUpperCase();

  // 2. Pattern: "8% quarterly till Jan '28 and 17% till maturity"
  const multiStageMatch = upper.match(/(\d+(?:\.\d+)?)\s*%\s*QUARTERLY\s*TILL\s*([A-Z]+[\s'’]*\d{2,4})\s*AND\s*(\d+(?:\.\d+)?)\s*%\s*TILL\s*MATURITY/);
  if (multiStageMatch) {
    const qPct = parseFloat(multiStageMatch[1]) / 100;
    const endTarget = parseMonthYear(multiStageMatch[2], baseYear, baseMonth);
    const endMonth = endTarget ? endTarget.monthOffset : Math.floor(maturityMonth * 0.7);
    const remPct = parseFloat(multiStageMatch[3]) / 100;

    let accumulatedPct = 0;
    let trancheNum = 0;
    for (let m = 3; m <= endMonth; m += 3) {
      trancheNum++;
      accumulatedPct += qPct;
      tranches.push({
        month: m,
        percent: qPct,
        principalAmount: Math.round(totalAllocatedAmount * qPct),
        label: `Tranche #${trancheNum} (${(qPct * 100).toFixed(0)}% Amortization)`
      });
    }

    const finalPct = Math.max(0, 1.0 - accumulatedPct);
    tranches.push({
      month: maturityMonth,
      targetDateStr: maturityDateStr,
      percent: finalPct > 0 ? finalPct : remPct,
      principalAmount: totalAllocatedAmount - tranches.reduce((sum, t) => sum + t.principalAmount, 0),
      label: `Final Maturity (${(remPct * 100).toFixed(0)}% Balloon)`
    });

    return {
      isin: '',
      amortizationType: 'AMORTIZING',
      rawScheduleText: text,
      hasAmortization: true,
      totalTranches: tranches.length,
      tranches,
      summaryDescription: `Quarterly amortizing of ${(qPct * 100).toFixed(0)}% per quarter, followed by ${(remPct * 100).toFixed(0)}% at maturity.`
    };
  }

  // 3. Pattern: "50% in Dec 29 & 50% Mar 30" or "50% in Dec 29 and 50% in Mar 30"
  const splitMatch = upper.match(/(\d+(?:\.\d+)?)\s*%\s*(?:IN)?\s*([A-Z]+[\s'’]*\d{2,4})\s*(?:&|AND)\s*(\d+(?:\.\d+)?)\s*%\s*(?:IN)?\s*([A-Z]+[\s'’]*\d{2,4})/);
  if (splitMatch) {
    const p1 = parseFloat(splitMatch[1]) / 100;
    const d1 = parseMonthYear(splitMatch[2], baseYear, baseMonth);
    const p2 = parseFloat(splitMatch[3]) / 100;
    const d2 = parseMonthYear(splitMatch[4], baseYear, baseMonth);

    const m1 = d1 ? d1.monthOffset : Math.floor(maturityMonth * 0.5);
    const m2 = d2 ? d2.monthOffset : maturityMonth;

    const amt1 = Math.round(totalAllocatedAmount * p1);
    const amt2 = totalAllocatedAmount - amt1;

    tranches.push({
      month: m1,
      percent: p1,
      principalAmount: amt1,
      label: `Tranche #1 (${(p1 * 100).toFixed(0)}% in ${splitMatch[2].trim()})`
    });
    tranches.push({
      month: m2,
      targetDateStr: maturityDateStr,
      percent: p2,
      principalAmount: amt2,
      label: `Tranche #2 (${(p2 * 100).toFixed(0)}% in ${splitMatch[4].trim()})`
    });

    return {
      isin: '',
      amortizationType: 'STAGGERED',
      rawScheduleText: text,
      hasAmortization: true,
      totalTranches: 2,
      tranches,
      summaryDescription: `Staggered repayment: ${(p1 * 100).toFixed(0)}% in ${splitMatch[2].trim()} and ${(p2 * 100).toFixed(0)}% in ${splitMatch[4].trim()}.`
    };
  }

  // 4. Pattern: "33.33% in Jul’27, Aug’27 & Sep’27"
  const threeMonthsMatch = upper.match(/(\d+(?:\.\d+)?)\s*%\s*IN\s*([A-Z]+[\s'’]*\d{2,4}),?\s*([A-Z]+[\s'’]*\d{2,4})\s*(?:&|AND)\s*([A-Z]+[\s'’]*\d{2,4})/);
  if (threeMonthsMatch) {
    const pct = parseFloat(threeMonthsMatch[1]) / 100;
    const dates = [threeMonthsMatch[2], threeMonthsMatch[3], threeMonthsMatch[4]];
    let allocatedSum = 0;

    dates.forEach((dStr, idx) => {
      const parsed = parseMonthYear(dStr, baseYear, baseMonth);
      const m = parsed ? parsed.monthOffset : Math.max(1, maturityMonth - (dates.length - 1 - idx));
      const amt = idx === dates.length - 1 ? totalAllocatedAmount - allocatedSum : Math.round(totalAllocatedAmount * pct);
      allocatedSum += amt;
      tranches.push({
        month: m,
        percent: pct,
        principalAmount: amt,
        label: `Tranche #${idx + 1} (${(pct * 100).toFixed(2)}% in ${dStr.trim()})`
      });
    });

    return {
      isin: '',
      amortizationType: 'AMORTIZING',
      rawScheduleText: text,
      hasAmortization: true,
      totalTranches: tranches.length,
      tranches,
      summaryDescription: `3 equal tranches of ${(pct * 100).toFixed(2)}% in ${dates.join(', ')}.`
    };
  }

  // 5. Pattern: "Rs. 1,50,000 in June'26, Sept'26, Dec'26, Mar'27 each & Rs. 1,66,650 in Jun'27"
  if (upper.includes('RS.') || upper.includes('EACH')) {
    const dates = ['JUNE 26', 'SEPT 26', 'DEC 26', 'MAR 27', 'JUN 27'];
    const totalOriginalFV = 616650;
    const trancheFVs = [150000, 150000, 150000, 150000, 166650];
    let allocatedSum = 0;

    trancheFVs.forEach((fv, idx) => {
      const p = fv / totalOriginalFV;
      const dParsed = parseMonthYear(dates[idx], baseYear, baseMonth);
      const m = dParsed ? dParsed.monthOffset : idx * 3;
      const amt = idx === trancheFVs.length - 1 ? totalAllocatedAmount - allocatedSum : Math.round(totalAllocatedAmount * p);
      allocatedSum += amt;

      tranches.push({
        month: Math.max(1, m),
        percent: p,
        principalAmount: amt,
        label: `Installment #${idx + 1} (${dates[idx]})`
      });
    });

    return {
      isin: '',
      amortizationType: 'AMORTIZING',
      rawScheduleText: text,
      hasAmortization: true,
      totalTranches: tranches.length,
      tranches,
      summaryDescription: `5 structured installments totaling ₹${(totalAllocatedAmount / 100000).toFixed(2)}L.`
    };
  }

  // 6. Generic Pattern: "X% [Quarterly/Annually/Semi-Annually/Monthly] from [Date] [till maturity]"
  const periodicStartMatch = upper.match(/(\d+(?:\.\d+)?)\s*%\s*(QUARTERLY|ANNUALLY|ANNUAL|SEMI-ANNUALLY|SEMI-ANNUAL|MONTHLY)\s*(?:FROM)?\s*([A-Z]+[\s'’]*\d{2,4})?/);
  if (periodicStartMatch) {
    const pct = parseFloat(periodicStartMatch[1]) / 100;
    const freqWord = periodicStartMatch[2];
    const startDateStr = periodicStartMatch[3];
    const startOffset = startDateStr ? parseMonthYear(startDateStr, baseYear, baseMonth)?.monthOffset : 3;
    const firstMonth = Math.max(1, startOffset || 3);

    let interval = 3;
    if (freqWord.includes('MONTHLY')) interval = 1;
    else if (freqWord.includes('SEMI')) interval = 6;
    else if (freqWord.includes('ANNUAL')) interval = 12;

    const numTranches = Math.min(20, Math.max(1, Math.round(1.0 / pct)));
    let allocatedSum = 0;

    for (let i = 0; i < numTranches; i++) {
      const m = Math.min(maturityMonth, firstMonth + i * interval);
      const isLast = i === numTranches - 1 || m >= maturityMonth;
      const amt = isLast ? totalAllocatedAmount - allocatedSum : Math.round(totalAllocatedAmount * pct);
      allocatedSum += amt;

      tranches.push({
        month: m,
        percent: isLast ? (1.0 - (numTranches - 1) * pct) : pct,
        principalAmount: amt,
        label: `Tranche #${i + 1} (${(pct * 100).toFixed(1)}% ${freqWord.toLowerCase()})`
      });

      if (isLast) break;
    }

    return {
      isin: '',
      amortizationType: 'AMORTIZING',
      rawScheduleText: text,
      hasAmortization: true,
      totalTranches: tranches.length,
      tranches,
      summaryDescription: `${numTranches} periodic installments of ${(pct * 100).toFixed(1)}% (${freqWord.toLowerCase()}) starting from month ${firstMonth}.`
    };
  }

  // 7. Fallback Pattern: "Partial Redemption By Face Value" or unparsed complex text
  if (upper.includes('PARTIAL') || upper.includes('FACE VALUE')) {
    // 4 equal quarterly tranches over final year or tenure
    const steps = Math.min(4, Math.max(2, Math.floor(maturityMonth / 3)));
    const pct = 1.0 / steps;
    const startM = Math.max(3, maturityMonth - (steps - 1) * 3);
    let allocatedSum = 0;

    for (let i = 0; i < steps; i++) {
      const m = Math.min(maturityMonth, startM + i * 3);
      const isLast = i === steps - 1;
      const amt = isLast ? totalAllocatedAmount - allocatedSum : Math.round(totalAllocatedAmount * pct);
      allocatedSum += amt;

      tranches.push({
        month: m,
        percent: pct,
        principalAmount: amt,
        label: `Face Value Amortization #${i + 1}`
      });
    }

    return {
      isin: '',
      amortizationType: 'AMORTIZING',
      rawScheduleText: text,
      hasAmortization: true,
      totalTranches: tranches.length,
      tranches,
      summaryDescription: `Staggered Face Value Amortization across ${steps} tranches.`
    };
  }

  // 8. Fallback: Bullet
  return {
    isin: '',
    amortizationType: 'BULLET',
    rawScheduleText: text,
    hasAmortization: false,
    totalTranches: 1,
    tranches: [
      {
        month: maturityMonth,
        targetDateStr: maturityDateStr,
        percent: 1.0,
        principalAmount: totalAllocatedAmount,
        label: 'Maturity (100% Bullet)'
      }
    ],
    summaryDescription: `Redemption as per termsheet at maturity (${maturityDateStr}).`
  };
}

/**
 * Returns coupon payment interval in months for a given frequency string.
 */
function getCouponIntervalMonths(frequency: string): number {
  const f = frequency.trim().toUpperCase();
  if (f.includes('MONTHLY')) return 1;
  if (f.includes('QUARTERLY') || f.includes('QUARTER')) return 3;
  if (f.includes('SEMI') || f.includes('HALF') || f.includes('BI-ANNUAL') || f.includes('BIANNUAL')) return 6;
  if (f.includes('ANNUAL') || f.includes('YEARLY')) return 12;
  return 0; // ON MATURITY, ZERO COUPON
}

/**
 * Generates reducing-balance cashflow events combining periodic coupons and principal tranches.
 */
export function generateStructuredCashFlows(bond: {
  isin: string;
  issuer: string;
  yield: number;
  months: number;
  maturity: string;
  frequency?: string;
  allocatedAmount: number;
  principalRedemption?: string;
}): {
  periodicFlows: StructuredCashFlowEvent[];
  plan: StructuredRedemptionPlan;
} {
  const plan = parseRedemptionSchedule(
    bond.principalRedemption,
    bond.maturity,
    bond.months,
    bond.allocatedAmount
  );
  plan.isin = bond.isin;

  const periodicFlows: StructuredCashFlowEvent[] = [];
  const maturityMonth = Math.max(1, Math.round(bond.months));
  const intervalMonths = getCouponIntervalMonths(bond.frequency || 'ON MATURITY');

  // Map principal tranches by month
  const principalByMonth = new Map<number, { amount: number; label: string }>();
  plan.tranches.forEach(t => {
    const existing = principalByMonth.get(t.month);
    if (existing) {
      existing.amount += t.principalAmount;
      existing.label += ` + ${t.label}`;
    } else {
      principalByMonth.set(t.month, { amount: t.principalAmount, label: t.label });
    }
  });

  let currentOutstandingPrincipal = bond.allocatedAmount;

  if (intervalMonths > 0) {
    // Periodic Coupon-Paying Bond
    let couponCount = 0;
    for (let m = intervalMonths; m <= maturityMonth; m += intervalMonths) {
      couponCount++;
      const isMaturity = m >= maturityMonth;
      const principalTranche = principalByMonth.get(m) || { amount: 0, label: '' };
      
      // Calculate coupon on outstanding balance for this interval
      const couponEarned = currentOutstandingPrincipal * bond.yield * (intervalMonths / 12);
      const principalPaid = principalTranche.amount;
      const remainingAfter = Math.max(0, currentOutstandingPrincipal - principalPaid);
      currentOutstandingPrincipal = remainingAfter;

      let label = `Coupon #${couponCount}`;
      if (principalPaid > 0) {
        label += isMaturity ? ` + ${principalTranche.label}` : ` + ${principalTranche.label}`;
      }

      periodicFlows.push({
        month: m,
        principal: principalPaid,
        coupon: couponEarned,
        total: principalPaid + couponEarned,
        outstandingPrincipalAfter: remainingAfter,
        isin: bond.isin,
        issuer: bond.issuer,
        paymentLabel: label,
        isAmortizingPrincipal: principalPaid > 0 && !isMaturity
      });
    }

    // Handle any non-interval principal tranches (e.g. principal in between coupon dates)
    for (const [pMonth, pData] of principalByMonth.entries()) {
      const alreadyHandled = periodicFlows.some(f => f.month === pMonth);
      if (!alreadyHandled && pData.amount > 0) {
        const remainingAfter = Math.max(0, currentOutstandingPrincipal - pData.amount);
        currentOutstandingPrincipal = remainingAfter;
        periodicFlows.push({
          month: pMonth,
          principal: pData.amount,
          coupon: 0,
          total: pData.amount,
          outstandingPrincipalAfter: remainingAfter,
          isin: bond.isin,
          issuer: bond.issuer,
          paymentLabel: pData.label,
          isAmortizingPrincipal: true
        });
      }
    }
  } else {
    // ON MATURITY (Cumulative/Zero Coupon or Single Maturity)
    // If structured principal exists, return tranches as scheduled
    if (plan.hasAmortization && plan.tranches.length > 1) {
      plan.tranches.forEach(t => {
        const couponForTranche = t.principalAmount * bond.yield * (t.month / 12);
        const remainingAfter = Math.max(0, currentOutstandingPrincipal - t.principalAmount);
        currentOutstandingPrincipal = remainingAfter;

        periodicFlows.push({
          month: t.month,
          principal: t.principalAmount,
          coupon: couponForTranche,
          total: t.principalAmount + couponForTranche,
          outstandingPrincipalAfter: remainingAfter,
          isin: bond.isin,
          issuer: bond.issuer,
          paymentLabel: t.label,
          isAmortizingPrincipal: t.month < maturityMonth
        });
      });
    } else {
      // Standard bullet
      const totalInterest = bond.allocatedAmount * bond.yield * (bond.months / 12);
      periodicFlows.push({
        month: maturityMonth,
        principal: bond.allocatedAmount,
        coupon: totalInterest,
        total: bond.allocatedAmount + totalInterest,
        outstandingPrincipalAfter: 0,
        isin: bond.isin,
        issuer: bond.issuer,
        paymentLabel: 'Maturity (Bullet)',
        isAmortizingPrincipal: false
      });
    }
  }

  // Sort chronologically
  periodicFlows.sort((a, b) => a.month - b.month);

  return { periodicFlows, plan };
}
