import { DefaultBond } from './defaultInventory';

export interface SelectedBond extends DefaultBond {
  allocationPercent: number;
  allocatedAmount: number;
  expectedAnnualReturn: number;
  bucketIndex: number;
  fdRate?: number;
  overrideJustification?: string;
}

export interface FDRateConfig {
  t1: number; // < 46 days
  t2: number; // 46 to 183 days
  t3: number; // 184 to 365 days
  t4: number; // 1 year to 2 years
  t5: number; // 2 to 3 years
  t6: number; // 3 to 5 years
  t7: number; // 5 to 10 years
}

export interface CashFlow {
  month: number;
  principal: number;
  interest: number;
  total: number;
  isin: string;
  issuer: string;
}

/**
 * A single periodic coupon/principal payment event for a bond.
 * Used to model true quarterly cashflow income (e.g., quarterly coupon, monthly coupon).
 */
export interface PeriodicCashFlow {
  /** Which month (from today) this payment arrives */
  month: number;
  /** Principal returned (non-zero only at maturity) */
  principal: number;
  /** Coupon interest amount for this period */
  coupon: number;
  /** Total cash received = principal + coupon */
  total: number;
  isin: string;
  issuer: string;
  /** Human-readable label e.g. "Q3 Coupon", "Maturity" */
  paymentLabel: string;
}

export interface CompanyAllocation {
  company: string;
  amount: number;
  percent: number;
  bondCount: number;
  rating: string;
  sector?: string;
  guarantor?: string;
  guarantorRating?: string;
  ratingTrend?: 'stable' | 'improving' | 'deteriorating';
}

export interface QuarterlyCashflowItem {
  quarter: number;
  monthsRange: string;
  actualCashflow: number;
  targetCashflow: number;
  isMet: boolean;
  surplusDeficit: number;
  coveragePercent: number;
}

export interface QuarterlyCashflowAnalysis {
  targetPercent: number;
  requiredPerQuarter: number;
  totalQuarters: number;
  quartersMet: number;
  items: QuarterlyCashflowItem[];
}

/** Reason categories for bond elimination — shown in the transparency panel. */
export type EliminationReason =
  | 'TENURE_MISMATCH'      // Outside min/max tenure window selected by user
  | 'BUNDLE_FLEXI'         // Excluded category (Bundle-Flexi products)
  | 'USER_EXCLUDED'        // Manually excluded by user via the exclusion list
  | 'USER_EXCLUDE'         // Alias for manual exclusion
  | 'ILLIQUID_QTY'         // Total Tradable Qty = 0 or blank
  | 'ILLIQUID_FV'          // Total Tradable FV = 0 or blank
  | 'BBB_TENOR_VIOLATION'  // BBB-rated bond with tenure > 12 months (regulatory risk cap)
  | 'BELOW_MIN_RATING'     // Rating below user-specified minimum
  | 'NOT_SELECTED';        // Passed all filters but not chosen by the optimizer (runner-up)

export interface EliminatedBond {
  bond: DefaultBond;
  reason: EliminationReason;
  /** Human-readable explanation shown in the drill-down view */
  detail: string;
}

export interface PortfolioSummary {
  selectedBonds: SelectedBond[];
  totalInvestment: number;
  portfolioYield: number;
  fdRate: number; // Blended FD rate
  portfolioAnnualReturn: number;
  fdAnnualReturn: number;
  extraReturn: number; // Lifetime extra return
  ratingDistribution: Record<string, number>;
  /** Maturity-level cashflows (principal + total interest at maturity). Used for the Cash Flow Schedule tab. */
  monthlyCashFlows: CashFlow[];
  /** Detailed periodic coupon payment events (monthly/quarterly/semi-annual/annual per bond). Used for Quarterly Cashflow tracker. */
  periodicCashFlows: PeriodicCashFlow[];
  companyAllocations: CompanyAllocation[];
  quarterlyCashflow?: QuarterlyCashflowAnalysis;
  /** All bonds that were screened out, with the reason and explanation for each. */
  eliminatedBonds: EliminatedBond[];
}

export interface MaturityBucket {
  name: string;
  min: number;
  max: number;
}

export function getMaturityBuckets(minTenure: number, maxTenure: number, targetNumIssuers: number = 10): MaturityBucket[] {
  const numBuckets = Math.min(6, Math.max(1, targetNumIssuers));
  const totalMonthsRange = Math.max(0.1, maxTenure - minTenure);
  const bucketSize = totalMonthsRange / numBuckets;
  return Array.from({ length: numBuckets }, (_, idx) => {
    const minVal = minTenure + idx * bucketSize;
    const maxVal = idx === numBuckets - 1 ? maxTenure + 0.1 : minTenure + (idx + 1) * bucketSize - 0.01;
    
    const minText = minVal.toFixed(1);
    const maxText = maxVal.toFixed(1);
    return {
      name: `${minText}-${maxText} Months`,
      min: minVal,
      max: maxVal
    };
  });
}

export const getUnitPrice = (bond: DefaultBond): number => {
  if (bond.totalTradableFV && bond.totalTradableQty && bond.totalTradableQty > 0) {
    return Math.floor(bond.totalTradableFV / bond.totalTradableQty);
  }
  if (bond.faceValue && bond.faceValue > 0) return bond.faceValue;
  return 100000;
};

export function generateBondPortfolio(
  bonds: DefaultBond[],
  totalInvestment: number,
  fdRates: FDRateConfig,
  minRatingGrade: 'A' | 'BBB-' | 'ALL' = 'A',
  targetYieldPercent?: number,
  targetNumIssuers: number = 10,
  excludedIsins?: Set<string>,
  manualReplacements?: Map<number, string>,
  minTenure: number = 7,
  maxTenure: number = 24,
  allocationStrategy: 'equal' | 'smart' = 'equal',
  customAllocations?: Map<string, number>,
  targetQuarterlyCashflowPct?: number,
  relaxBBBCap: boolean = false,
  companyOverrides: Record<string, { action: string; justification: string }> = {}
): PortfolioSummary {
  // 1. Define buckets dynamically based on minTenure, maxTenure, and targetNumIssuers
  const buckets = getMaturityBuckets(minTenure, maxTenure, targetNumIssuers);

  // Helper to extract rating symbol
  const getCleanRatingSymbol = (rating: string): string => {
    let r = rating.toUpperCase().replace(/\(CE\)/g, '').trim();
    const agencies = ['CRISIL', 'ICRA', 'CARE', 'IND', 'ACUITE', 'FITCH'];
    for (const agency of agencies) {
      if (r.startsWith(agency)) {
        r = r.substring(agency.length).trim();
      }
    }
    return r;
  };

  const isAOrBetter = (rating: string): boolean => {
    const symbol = getCleanRatingSymbol(rating);
    if (symbol.includes('SOVEREIGN') || symbol.includes('GOI')) return true;
    if (symbol.includes('AAA') || symbol.includes('AA') || symbol === 'A+' || symbol === 'A') return true;
    return false;
  };

  const isBBBMinusOrBetter = (rating: string): boolean => {
    const symbol = getCleanRatingSymbol(rating);
    if (symbol.includes('SOVEREIGN') || symbol.includes('GOI')) return true;
    if (symbol.includes('AAA') || symbol.includes('AA') || symbol.includes('A') || symbol.includes('BBB')) return true;
    return false;
  };

  const getRatingScore = (rating: string): number => {
    const symbol = getCleanRatingSymbol(rating);
    if (symbol.includes('SOVEREIGN') || symbol.includes('GOI')) return 5;
    if (symbol === 'AAA') return 4.5;
    if (symbol === 'AA+') return 4;
    if (symbol === 'AA') return 3.5;
    if (symbol === 'AA-') return 3;
    if (symbol === 'A+') return 2.5;
    if (symbol === 'A') return 2;
    if (symbol === 'A-') return 1.5;
    if (symbol === 'BBB+') return 1;
    if (symbol === 'BBB') return 0.5;
    return 0;
  };

  const getFDRateForTenure = (months: number): number => {
    const days = months * 30.4375;
    if (days < 46) return fdRates.t1 / 100;
    if (days <= 183) return fdRates.t2 / 100;
    if (days <= 365) return fdRates.t3 / 100;
    if (months <= 24) return fdRates.t4 / 100;
    if (months <= 36) return fdRates.t5 / 100;
    if (months <= 60) return fdRates.t6 / 100;
    return fdRates.t7 / 100;
  };

  // Calculate dynamic tenure relative to current date (runtime creation)
  const today = new Date();
  const getDynamicMonths = (maturityStr: string): number => {
    const mat = new Date(maturityStr);
    const diffTime = mat.getTime() - today.getTime();
    const months = diffTime / (1000 * 60 * 60 * 24 * 30.4375);
    return Math.round(months * 10) / 10;
  };



  // ─── Elimination tracking ─────────────────────────────────────────────────
  // Collect every bond that is screened out with the specific reason and a
  // human-readable explanation. This powers the transparency panel in the UI.
  const eliminated: EliminatedBond[] = [];

  /** Push a bond into the eliminated list and return false (for use in filter callbacks). */
  const eliminate = (bond: DefaultBond, reason: EliminationReason, detail: string): boolean => {
    const override = companyOverrides[bond.issuer];
    if (override?.action === 'INCLUDE' && reason !== 'ILLIQUID_QTY' && reason !== 'ILLIQUID_FV') {
      return true;
    }
    eliminated.push({ bond, reason, detail });
    return false;
  };

  // Exclude early if EXCLUDE is present
  const allWithDynMonths = bonds.map(b => ({
    ...b,
    months: getDynamicMonths(b.maturity)
  })).filter(b => {
    if (companyOverrides[b.issuer]?.action === 'EXCLUDE') {
      return eliminate(b, 'USER_EXCLUDE', 'User manually excluded this company.');
    }
    return true;
  });

  let candidateBonds = allWithDynMonths.filter(b => {
    if (b.months < minTenure) {
      return eliminate(b, 'TENURE_MISMATCH',
        `Maturity in ${b.months.toFixed(1)}m is below the minimum tenure of ${minTenure}m selected.`);
    }
    if (b.months > maxTenure + 0.99) {
      return eliminate(b, 'TENURE_MISMATCH',
        `Maturity in ${b.months.toFixed(1)}m exceeds the maximum tenure of ${maxTenure}m selected.`);
    }
    return true;
  });

  // ─── Stage 2: Bundle-Flexi category ──────────────────────────────────────
  candidateBonds = candidateBonds.filter(b => {
    if (!b.category) return true;
    const cat = b.category.trim().toLowerCase();
    if (cat.includes('bundle - flexi') || cat.includes('bundle-flexi')) {
      return eliminate(b, 'BUNDLE_FLEXI',
        `Category "${b.category}" is a Bundle-Flexi product which is excluded from all portfolios.`);
    }
    return true;
  });

  // ─── Stage 3: User-excluded ISINs ────────────────────────────────────────
  if (excludedIsins) {
    candidateBonds = candidateBonds.filter(b => {
      if (excludedIsins.has(b.isin)) {
        return eliminate(b, 'USER_EXCLUDED',
          `Manually excluded from this proposal.`);
      }
      return true;
    });
  }

  // ─── Stage 4: Liquidity guard ─────────────────────────────────────────────
  candidateBonds = candidateBonds.filter(b => {
    if (b.totalTradableQty !== undefined && b.totalTradableQty <= 0) {
      return eliminate(b, 'ILLIQUID_QTY',
        `Total Tradable Qty is ${b.totalTradableQty} — bond is illiquid and cannot be purchased.`);
    }
    if (b.totalTradableFV !== undefined && b.totalTradableFV <= 0) {
      return eliminate(b, 'ILLIQUID_FV',
        `Total Tradable FV is ₹0 — no inventory available for this bond.`);
    }
    return true;
  });

  // ─── Stage 5: BBB > 12-month tenor cap ───────────────────────────────────
  candidateBonds = candidateBonds.filter(b => {
    const symbol = getCleanRatingSymbol(b.rating);
    const isBetterThanBBB = symbol.includes('SOVEREIGN') || symbol.includes('GOI') ||
                            symbol.includes('AAA') || symbol.includes('AA') ||
                            symbol.includes('A');
    if (!isBetterThanBBB && b.months > 12.0 && !relaxBBBCap) {
      return eliminate(b, 'BBB_TENOR_VIOLATION',
        `Rating ${b.rating} (BBB tier) with tenure ${b.months.toFixed(1)}m exceeds the 12-month cap for sub-A bonds. Regulatory risk management rule.`);
    }
    return true;
  });

  // ─── Stage 6: Minimum rating filter ──────────────────────────────────────
  if (minRatingGrade === 'A') {
    candidateBonds = candidateBonds.filter(b => {
      if (!isAOrBetter(b.rating)) {
        return eliminate(b, 'BELOW_MIN_RATING',
          `Rating ${b.rating} is below the minimum "A" grade selected for this portfolio.`);
      }
      return true;
    });
  } else if (minRatingGrade === 'BBB-') {
    candidateBonds = candidateBonds.filter(b => {
      if (!isBBBMinusOrBetter(b.rating)) {
        return eliminate(b, 'BELOW_MIN_RATING',
          `Rating ${b.rating} is below the minimum "BBB-" grade selected for this portfolio.`);
      }
      return true;
    });
  }

  // Group into buckets
  const bucketedBonds: DefaultBond[][] = buckets.map(() => []);
  candidateBonds.forEach(bond => {
    for (let i = 0; i < buckets.length; i++) {
      if (bond.months >= buckets[i].min && bond.months <= buckets[i].max) {
        bucketedBonds[i].push(bond);
        break;
      }
    }
  });

  /**
   * Returns a bonus score for a bond's payment frequency.
   * Higher score = bond pays coupons more frequently = better for quarterly cashflow targets.
   * Used only when targetQuarterlyCashflowPct is set.
   */
  const getFrequencyScore = (frequency: string): number => {
    const f = (frequency || '').trim().toUpperCase();
    if (f.includes('MONTHLY')) return 4;
    if (f.includes('QUARTERLY') || f.includes('QUARTER')) return 3;
    if (f.includes('SEMI') || f.includes('HALF') || f.includes('BI-ANNUAL') || f.includes('BIANNUAL')) return 2;
    if (f.includes('ANNUAL') || f.includes('YEARLY')) return 1;
    return 0; // ON MATURITY / ZERO COUPON — no periodic income
  };

  /**
   * Combined bond score for sorting within a bucket.
   * When a quarterly cashflow target is set, frequency preference is blended in (30% weight)
   * so periodic-coupon bonds rank above ON MATURITY bonds of similar yield.
   */
  const getBondScore = (bond: DefaultBond): number => {
    const yieldScore = bond.yield * 100;
    const ratingBonus = getRatingScore(bond.rating) / 100;
    if (targetQuarterlyCashflowPct && targetQuarterlyCashflowPct > 0) {
      // Blend: 70% yield + 30% frequency preference (normalized to yield-comparable scale)
      const freqBonus = getFrequencyScore(bond.frequency || '') * 0.5;
      return yieldScore * 0.7 + freqBonus + ratingBonus;
    }
    return yieldScore + ratingBonus;
  };

  // Sort each bucket by combined score (yield-first if no target; frequency-blended if target set)
  bucketedBonds.forEach(bucketList => {
    bucketList.sort((a, b) => getBondScore(b) - getBondScore(a));
  });

  // 3. Selection: Find optimal issuer count K (minK <= K <= maxK) that maximizes portfolio yield
  // Note: Minimum K is enforced to be at least 7 so that no single company exceeds 15% allocation (1/7 = 14.28% <= 15%)
  // Upper bound maxK is capped by available candidate bonds count so we never pick more issuers than available bonds
  const availableCandidateCount = candidateBonds.length;
  const minK = Math.min(availableCandidateCount, Math.max(7, targetNumIssuers));
  const maxK = Math.min(25, availableCandidateCount);

  let bestSelected: { bond: DefaultBond; bucketIndex: number }[] = [];
  let maxEvaluatedYield = -1;

  for (let K = minK; K <= maxK; K++) {
    const tempBuckets = getMaturityBuckets(minTenure, maxTenure, K);
    const tempBucketedBonds: DefaultBond[][] = tempBuckets.map(() => []);

    candidateBonds.forEach(bond => {
      for (let i = 0; i < tempBuckets.length; i++) {
        if (bond.months >= tempBuckets[i].min && bond.months <= tempBuckets[i].max) {
          tempBucketedBonds[i].push(bond);
          break;
        }
      }
    });

    tempBucketedBonds.forEach(bucketList => {
      // Use same frequency-blended scoring so the K-search also favours periodic coupon bonds
      bucketList.sort((a, b) => getBondScore(b) - getBondScore(a));
    });

    const tempSelected: { bond: DefaultBond; bucketIndex: number }[] = [];
    const tempIssuers = new Set<string>();

    if (manualReplacements) {
      for (const [bIndex, isin] of manualReplacements.entries()) {
        const targetBond = candidateBonds.find(b => b.isin === isin);
        if (targetBond) {
          tempSelected.push({ bond: targetBond, bucketIndex: bIndex });
          tempIssuers.add(targetBond.issuer);
        }
      }
    }

    const tryAddTemp = (bond: DefaultBond, bIdx: number): boolean => {
      if (tempSelected.some(s => s.bond.isin === bond.isin)) return false;
      if (tempIssuers.has(bond.issuer)) return false;
      tempSelected.push({ bond, bucketIndex: bIdx });
      tempIssuers.add(bond.issuer);
      return true;
    };

    let attempts = 0;
    while (tempIssuers.size < K && attempts < 100) {
      let addedInPass = false;
      for (let bIdx = 0; bIdx < tempBuckets.length; bIdx++) {
        if (tempIssuers.size >= K) break;
        const list = tempBucketedBonds[bIdx];
        for (const bond of list) {
          if (tryAddTemp(bond, bIdx)) {
            addedInPass = true;
            break;
          }
        }
      }
      if (!addedInPass) break;
      attempts++;
    }

    if (tempSelected.length > 0) {
      const avgYield = tempSelected.reduce((sum, s) => sum + s.bond.yield, 0) / tempSelected.length;
      if (avgYield > maxEvaluatedYield || bestSelected.length === 0) {
        maxEvaluatedYield = avgYield;
        bestSelected = tempSelected;
      }
    }
  }

  const selected = bestSelected;
  const selectedIssuers = new Set(selected.map(s => s.bond.issuer));

  // Fallback if absolutely empty
  if (selected.length === 0) {
    bonds.slice(0, targetNumIssuers).forEach((b, i) => {
      selected.push({ bond: b, bucketIndex: i % 6 });
      selectedIssuers.add(b.issuer);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3b. COUPON STAGGER OPTIMIZATION (only when quarterly cashflow target is set)
  //
  // Goal: ensure coupon payment months are spread across all 4 quarters of
  // the year so the customer receives income in every quarter, not just at
  // maturity or clustered in one period.
  //
  // Strategy:
  //   For each selected bond that pays ON MATURITY, try to swap it for a
  //   periodic-coupon bond from the same bucket whose issuer is not already
  //   in the portfolio. Accept the swap only if it does not drop average
  //   portfolio yield by more than CF_YIELD_TOLERANCE.
  // ─────────────────────────────────────────────────────────────────────────
  if (targetQuarterlyCashflowPct && targetQuarterlyCashflowPct > 0 && selected.length > 0) {
    const CF_YIELD_TOLERANCE = 0.005; // Allow up to 0.5% yield drop to gain cashflow coverage

    /** Returns the payment interval months (0 = ON MATURITY). */
    const getInterval = (frequency: string): number => {
      const f = (frequency || '').trim().toUpperCase();
      if (f.includes('MONTHLY')) return 1;
      if (f.includes('QUARTERLY') || f.includes('QUARTER')) return 3;
      if (f.includes('SEMI') || f.includes('HALF') || f.includes('BI-ANNUAL') || f.includes('BIANNUAL')) return 6;
      if (f.includes('ANNUAL') || f.includes('YEARLY')) return 12;
      return 0;
    };

    /** Which calendar quarters (1-4) does a bond pay coupons in, based on its maturity month? */
    const getCouponQuarters = (bond: DefaultBond): Set<number> => {
      const interval = getInterval(bond.frequency || '');
      const matMonth = Math.round(bond.months);
      const quarters = new Set<number>();
      if (interval === 0) return quarters; // ON MATURITY pays nothing periodically
      for (let m = interval; m <= matMonth; m += interval) {
        quarters.add(((m - 1) % 12) + 1 > 9 ? 4 : ((m - 1) % 12) + 1 > 6 ? 3 : ((m - 1) % 12) + 1 > 3 ? 2 : 1);
      }
      return quarters;
    };

    // Determine which annual quarters (1-4) currently have coupon coverage
    const coveredQuarters = new Set<number>();
    selected.forEach(s => {
      getCouponQuarters(s.bond).forEach(q => coveredQuarters.add(q));
    });

    // Only swap if some quarters are uncovered
    const allQuarters = [1, 2, 3, 4];
    const missingQuarters = allQuarters.filter(q => !coveredQuarters.has(q));

    if (missingQuarters.length > 0) {
      const currentAvgYield = selected.reduce((s, x) => s + x.bond.yield, 0) / selected.length;
      const minAllowedYield = currentAvgYield - CF_YIELD_TOLERANCE;

      // Find ON MATURITY bonds in selection that are candidates for swapping
      for (let i = 0; i < selected.length; i++) {
        if (missingQuarters.every(q => coveredQuarters.has(q))) break; // All covered now

        const current = selected[i];
        if (getInterval(current.bond.frequency || '') !== 0) continue; // Already periodic
        if (manualReplacements && manualReplacements.has(current.bucketIndex)) continue; // Locked

        // Find best periodic-coupon replacement in the same bucket
        const bucketCandidates = bucketedBonds[current.bucketIndex] || [];
        let bestReplacement: DefaultBond | null = null;
        let bestReplacementScore = -1;

        for (const cand of bucketCandidates) {
          if (selected.some(s => s.bond.isin === cand.isin)) continue; // Already in portfolio
          if (selectedIssuers.has(cand.issuer)) continue; // Issuer already present
          if (getInterval(cand.frequency || '') === 0) continue; // Also ON MATURITY — no benefit

          // Check yield tolerance: simulate swap
          const hypotheticalYields = selected.map((s, idx) => idx === i ? cand.yield : s.bond.yield);
          const hypotheticalAvg = hypotheticalYields.reduce((a, b) => a + b, 0) / hypotheticalYields.length;
          if (hypotheticalAvg < minAllowedYield) continue;

          // Score: prefer bonds that cover currently missing quarters + high frequency
          const candQuarters = getCouponQuarters(cand);
          const newCoverage = missingQuarters.filter(q => candQuarters.has(q)).length;
          const score = newCoverage * 10 + getFrequencyScore(cand.frequency || '') + cand.yield;

          if (score > bestReplacementScore) {
            bestReplacementScore = score;
            bestReplacement = cand;
          }
        }

        if (bestReplacement) {
          // Perform the swap
          selectedIssuers.delete(current.bond.issuer);
          selected[i] = { bond: bestReplacement, bucketIndex: current.bucketIndex };
          selectedIssuers.add(bestReplacement.issuer);
          // Update covered quarters
          getCouponQuarters(bestReplacement).forEach(q => coveredQuarters.add(q));
        }
      }
    }
  }

  // 4. OPTIMIZE FOR TARGET YIELD
  if (targetYieldPercent !== undefined && targetYieldPercent > 0) {
    const targetYield = targetYieldPercent / 100;
    
    // Greedy Swap Optimization
    let currentBlendedYield = selected.reduce((sum, s) => sum + s.bond.yield, 0) / selected.length;
    let improved = true;
    let loopLimit = 0;

    while (improved && loopLimit < 50) {
      improved = false;
      
      if (currentBlendedYield < targetYield) {
        // Need HIGHER yield: swap a low-yield bond for a high-yield candidate
        let bestSwap: { selectedIndex: number; newBond: DefaultBond } | null = null;
        let maxYieldGain = 0;

        for (let i = 0; i < selected.length; i++) {
          const current = selected[i];
          if (manualReplacements && manualReplacements.has(current.bucketIndex)) continue; // Lock manual choice
          const candidates = bucketedBonds[current.bucketIndex];

          for (const cand of candidates) {
            // Must not be already selected, and either same issuer or new issuer if not exceeding limit
            if (selected.some(s => s.bond.isin === cand.isin)) continue;
            
            // Check issuer swap compatibility
            const wouldBeUnique = new Set(selected.map((s, idx) => idx === i ? cand.issuer : s.bond.issuer));
            if (wouldBeUnique.size < selectedIssuers.size) continue; // Keep uniqueness count intact

            const yieldGain = cand.yield - current.bond.yield;
            if (yieldGain > maxYieldGain) {
              maxYieldGain = yieldGain;
              bestSwap = { selectedIndex: i, newBond: cand };
            }
          }
        }

        if (bestSwap) {
          selected[bestSwap.selectedIndex].bond = bestSwap.newBond;
          currentBlendedYield = selected.reduce((sum, s) => sum + s.bond.yield, 0) / selected.length;
          improved = true;
        }
      } else {
        // We have excess yield: swap higher-yield for HIGHER safety (rating score) while staying above target
        let bestSwap: { selectedIndex: number; newBond: DefaultBond; safetyGain: number } | null = null;

        for (let i = 0; i < selected.length; i++) {
          const current = selected[i];
          if (manualReplacements && manualReplacements.has(current.bucketIndex)) continue; // Lock manual choice
          const candidates = bucketedBonds[current.bucketIndex];

          for (const cand of candidates) {
            if (selected.some(s => s.bond.isin === cand.isin)) continue;

            const wouldBeUnique = new Set(selected.map((s, idx) => idx === i ? cand.issuer : s.bond.issuer));
            if (wouldBeUnique.size < selectedIssuers.size) continue;

            const safetyGain = getRatingScore(cand.rating) - getRatingScore(current.bond.rating);
            const newYield = currentBlendedYield + (cand.yield - current.bond.yield) / selected.length;

            if (safetyGain > 0 && newYield >= targetYield) {
              if (!bestSwap || safetyGain > bestSwap.safetyGain) {
                bestSwap = { selectedIndex: i, newBond: cand, safetyGain };
              }
            }
          }
        }

        if (bestSwap) {
          selected[bestSwap.selectedIndex].bond = bestSwap.newBond;
          currentBlendedYield = selected.reduce((sum, s) => sum + s.bond.yield, 0) / selected.length;
          improved = true;
        }
      }
      loopLimit++;
    }
  }

  // 5. Allocation & Company Clubbing
  const N = selected.length;
  const bondAllocations: Record<string, number> = {};

  // Maximum single company allocation limit: 15% of total investment
  const baseMaxCompanyCap = totalInvestment * 0.15;

  // Track company total allocations to strictly enforce <= 15% cap per issuer
  const companyAllocTotals: Record<string, number> = {};
  selected.forEach(s => { 
    companyAllocTotals[s.bond.issuer] = 0; 
    bondAllocations[s.bond.isin] = 0;
  });

  if (customAllocations && customAllocations.size === N) {
    // User custom allocation override (capped by totalTradableFV and 15% company limit unless 1 unit exceeds it)
    selected.forEach(s => {
      const u = getUnitPrice(s.bond);
      let val = customAllocations.get(s.bond.isin) || 0;
      
      const fvCap = s.bond.totalTradableFV && s.bond.totalTradableFV > 0 ? s.bond.totalTradableFV : Infinity;
      const effectiveCompanyCap = Math.max(baseMaxCompanyCap, u); // allow at least 1 unit if it exceeds 15%
      
      val = Math.min(val, fvCap);
      val = Math.min(val, effectiveCompanyCap);
      
      // discrete floor
      val = Math.floor(val / u) * u;
      
      bondAllocations[s.bond.isin] = val;
      companyAllocTotals[s.bond.issuer] += val;
    });
  } else {
    const rawEqual = totalInvestment / N;
    let totalSpent = 0;

    let sortedForDistribution = [...selected];
    if (allocationStrategy === 'smart') {
      sortedForDistribution.sort((a, b) => b.bond.yield - a.bond.yield); // Highest yield first
    }

    // 1. Initial base allocation capped by totalTradableFV and company cap
    sortedForDistribution.forEach(s => {
      const u = getUnitPrice(s.bond);
      const effectiveCompanyCap = Math.max(baseMaxCompanyCap, u);
      
      const fvCap = s.bond.totalTradableFV && s.bond.totalTradableFV > 0
        ? s.bond.totalTradableFV
        : Infinity;
        
      const maxAllowed = Math.min(fvCap, effectiveCompanyCap);
      
      let alloc = Math.floor(rawEqual / u) * u;
      
      // zero-allocation deadlock prevention:
      if (alloc === 0 && rawEqual > 0 && maxAllowed >= u) {
          alloc = u;
      }

      if (alloc > maxAllowed) {
        alloc = Math.floor(maxAllowed / u) * u;
      }

      // Budget clamp
      if (totalSpent + alloc > totalInvestment) {
        alloc = Math.floor((totalInvestment - totalSpent) / u) * u;
      }

      bondAllocations[s.bond.isin] = alloc;
      companyAllocTotals[s.bond.issuer] += alloc;
      totalSpent += alloc;
    });

    let pool = totalInvestment - totalSpent;

    // 2. Distribute remaining excess pool evenly (or smartly) among uncapped bonds
    let iterations = 0;
    let poolChanged = true;
    while (pool > 0 && poolChanged && iterations < 500) {
      poolChanged = false;
      for (const s of sortedForDistribution) {
        const u = getUnitPrice(s.bond);
        if (pool < u) continue;

        const currentBondAlloc = bondAllocations[s.bond.isin];
        const currentCompanyAlloc = companyAllocTotals[s.bond.issuer];

        const fvCap = s.bond.totalTradableFV && s.bond.totalTradableFV > 0 ? s.bond.totalTradableFV : Infinity;
        const effectiveCompanyCap = Math.max(baseMaxCompanyCap, u);
        
        const companyRemainingCap = effectiveCompanyCap - currentCompanyAlloc;
        const bondRemainingCap = fvCap - currentBondAlloc;
        
        const maxAdd = Math.min(bondRemainingCap, companyRemainingCap, pool);
        
        if (maxAdd >= u) {
          bondAllocations[s.bond.isin] += u;
          companyAllocTotals[s.bond.issuer] += u;
          pool -= u;
          totalSpent += u;
          poolChanged = true;
        }
      }
      iterations++;
    }
  }

  // Fallback Overflow Allocation: If all initial selected bonds hit caps, 
  // continuously draw the next best candidate bonds to deploy 100% of totalInvestment
  let totalAllocatedSoFar = Object.values(bondAllocations).reduce((a, b) => a + b, 0);
  let unallocatedPool = totalInvestment - totalAllocatedSoFar;
  
  if (unallocatedPool > 0) {
    const remainingCandidates = candidateBonds.filter(c => !selected.some(s => s.bond.isin === c.isin));
    remainingCandidates.sort((a, b) => b.yield - a.yield);

    for (const cand of remainingCandidates) {
      const u = getUnitPrice(cand);
      if (unallocatedPool < u) continue;

      const currentCompanyAlloc = companyAllocTotals[cand.issuer] || 0;
      const effectiveCompanyCap = Math.max(baseMaxCompanyCap, u);
      const companyRemainingCap = effectiveCompanyCap - currentCompanyAlloc;
      
      if (companyRemainingCap < u) continue;

      const fvCap = cand.totalTradableFV && cand.totalTradableFV > 0 ? cand.totalTradableFV : Infinity;
      const maxAllowed = Math.min(fvCap, companyRemainingCap, unallocatedPool);
      
      if (maxAllowed < u) continue;

      let alloc = Math.floor(maxAllowed / u) * u;
      
      bondAllocations[cand.isin] = alloc;
      companyAllocTotals[cand.issuer] = currentCompanyAlloc + alloc;
      unallocatedPool -= alloc;

      selected.push({
        bond: cand,
        bucketIndex: 0
      });
      
      if (unallocatedPool <= 0) break;
    }
  }



  // Map allocations back to selected bonds & build company summary
  const selectedBonds: SelectedBond[] = [];
  const companyAllocMap: Record<string, { amount: number; count: number; rating: string; sampleBond: DefaultBond }> = {};

  selected.forEach(s => {
    const allocatedAmount = bondAllocations[s.bond.isin] || 0;
    if (allocatedAmount <= 0) return; // Exclude bonds with 0 allocation

    const allocationPercent = allocatedAmount / totalInvestment;
    const fdRateForBond = getFDRateForTenure(s.bond.months);

    selectedBonds.push({
      ...s.bond,
      allocationPercent,
      allocatedAmount,
      expectedAnnualReturn: allocatedAmount * s.bond.yield,
      bucketIndex: s.bucketIndex,
      fdRate: fdRateForBond,
      overrideJustification: companyOverrides[s.bond.issuer]?.justification
    });

    const issuer = s.bond.issuer;
    if (!companyAllocMap[issuer]) {
      companyAllocMap[issuer] = { amount: 0, count: 0, rating: s.bond.rating, sampleBond: s.bond };
    }
    companyAllocMap[issuer].amount += allocatedAmount;
    companyAllocMap[issuer].count += 1;
  });

  const companyAllocations: CompanyAllocation[] = Object.keys(companyAllocMap).map(company => {
    const data = companyAllocMap[company];
    return {
      company,
      amount: data.amount,
      percent: data.amount / totalInvestment,
      bondCount: data.count,
      rating: data.rating,
      sector: data.sampleBond.sector,
      guarantor: data.sampleBond.guarantor,
      guarantorRating: data.sampleBond.guarantorRating,
      ratingTrend: data.sampleBond.ratingTrend
    };
  });

  // Calculate Metrics
  const totalActualAllocated = selectedBonds.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const effectiveTotalInvestment = totalActualAllocated > 0 ? totalActualAllocated : totalInvestment;

  const portfolioYield = selectedBonds.reduce((sum, b) => sum + (b.yield * b.allocatedAmount), 0) / effectiveTotalInvestment;
  const blendedFDRate = selectedBonds.reduce((sum, b) => sum + ((b.fdRate || 0) * b.allocatedAmount), 0) / effectiveTotalInvestment;

  const portfolioAnnualReturn = effectiveTotalInvestment * portfolioYield;
  const fdAnnualReturn = effectiveTotalInvestment * blendedFDRate;

  // Calculate total return over actual tenure periods
  const totalBondMaturityInterest = selectedBonds.reduce((sum, b) => sum + (b.allocatedAmount * b.yield * (b.months / 12)), 0);
  const totalFDMaturityInterest = selectedBonds.reduce((sum, b) => sum + (b.allocatedAmount * (b.fdRate || 0) * (b.months / 12)), 0);
  const extraReturn = totalBondMaturityInterest - totalFDMaturityInterest;

  // Rating distribution counts
  const ratingDistribution: Record<string, number> = {};
  selectedBonds.forEach(b => {
    let cat = 'Unrated';
    const symbol = getCleanRatingSymbol(b.rating);
    if (symbol.includes('SOVEREIGN') || symbol.includes('GOI')) cat = 'Sovereign';
    else if (symbol === 'AAA') cat = 'AAA';
    else if (symbol.startsWith('AA')) cat = 'AA';
    else if (symbol.startsWith('A')) cat = 'A';
    else if (symbol.startsWith('BBB')) cat = 'BBB';
    
    ratingDistribution[cat] = (ratingDistribution[cat] || 0) + 1;
  });

  // Calculate maturing cash flows
  const monthlyCashFlows: CashFlow[] = selectedBonds.map(b => {
    const principal = b.allocatedAmount;
    const interest = b.allocatedAmount * b.yield * (b.months / 12);
    return {
      month: Math.round(b.months),
      principal,
      interest,
      total: principal + interest,
      isin: b.isin,
      issuer: b.issuer
    };
  }).sort((a, b) => a.month - b.month);

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Periodic Coupon Payment Events
  // Each bond generates individual payment events based on its frequency.
  // This correctly models the income a customer receives each period.
  // ─────────────────────────────────────────────────────────────────────────
  const periodicCashFlows: PeriodicCashFlow[] = [];

  /**
   * Returns the coupon payment interval in months for a given frequency string.
   * Returns 0 for ON MATURITY (no periodic payments; all at end).
   */
  const getCouponIntervalMonths = (frequency: string): number => {
    const f = frequency.trim().toUpperCase();
    if (f.includes('MONTHLY')) return 1;
    if (f.includes('QUARTERLY') || f.includes('QUARTER')) return 3;
    if (f.includes('SEMI') || f.includes('HALF') || f.includes('BI-ANNUAL') || f.includes('BIANNUAL')) return 6;
    if (f.includes('ANNUAL') || f.includes('YEARLY')) return 12;
    // ON MATURITY, ZERO COUPON etc. — no periodic payments
    return 0;
  };

  selectedBonds.forEach(bond => {
    const maturityMonth = Math.round(bond.months);
    const intervalMonths = getCouponIntervalMonths(bond.frequency || 'ON MATURITY');
    // Annual coupon income = allocated × yield rate
    const annualCoupon = bond.allocatedAmount * bond.yield;

    if (intervalMonths > 0) {
      // Periodic coupon-paying bond: generate one coupon event per interval
      const couponPerPeriod = annualCoupon * (intervalMonths / 12);
      let couponCount = 0;

      for (let m = intervalMonths; m < maturityMonth; m += intervalMonths) {
        couponCount++;
        periodicCashFlows.push({
          month: m,
          principal: 0,
          coupon: couponPerPeriod,
          total: couponPerPeriod,
          isin: bond.isin,
          issuer: bond.issuer,
          paymentLabel: `Coupon #${couponCount}`
        });
      }

      // Final maturity event: last coupon stub (if any remaining) + full principal
      const monthsSinceLastCoupon = maturityMonth - Math.floor(maturityMonth / intervalMonths) * intervalMonths;
      const stubCoupon = monthsSinceLastCoupon > 0
        ? annualCoupon * (monthsSinceLastCoupon / 12)
        : couponPerPeriod; // last regular coupon coincides with maturity

      periodicCashFlows.push({
        month: maturityMonth,
        principal: bond.allocatedAmount,
        coupon: stubCoupon,
        total: bond.allocatedAmount + stubCoupon,
        isin: bond.isin,
        issuer: bond.issuer,
        paymentLabel: 'Maturity'
      });
    } else {
      // ON MATURITY bond: single bullet payment at maturity (principal + all accumulated interest)
      const totalInterest = annualCoupon * (bond.months / 12);
      periodicCashFlows.push({
        month: maturityMonth,
        principal: bond.allocatedAmount,
        coupon: totalInterest,
        total: bond.allocatedAmount + totalInterest,
        isin: bond.isin,
        issuer: bond.issuer,
        paymentLabel: 'Maturity (Bullet)'
      });
    }
  });

  periodicCashFlows.sort((a, b) => a.month - b.month);

  // ─────────────────────────────────────────────────────────────────────────
  // Quarterly Cashflow Analysis (uses periodicCashFlows, NOT monthlyCashFlows)
  // ─────────────────────────────────────────────────────────────────────────
  let quarterlyCashflow: QuarterlyCashflowAnalysis | undefined = undefined;
  if (targetQuarterlyCashflowPct !== undefined && targetQuarterlyCashflowPct > 0) {
    const requiredPerQuarter = totalInvestment * (targetQuarterlyCashflowPct / 100);
    const maxMonthInPortfolio = Math.max(...selectedBonds.map(b => Math.round(b.months)), maxTenure);
    const totalQuarters = Math.ceil(maxMonthInPortfolio / 3);

    const items: QuarterlyCashflowItem[] = [];
    let quartersMet = 0;

    for (let q = 1; q <= totalQuarters; q++) {
      const minM = (q - 1) * 3 + 1;
      const maxM = q * 3;

      // Sum ALL periodic payment events (coupons + maturities) within this quarter window
      const actualCashflow = periodicCashFlows
        .filter(cf => cf.month >= minM && cf.month <= maxM)
        .reduce((sum, cf) => sum + cf.total, 0);

      const isMet = actualCashflow >= requiredPerQuarter;
      if (isMet) quartersMet++;

      const surplusDeficit = actualCashflow - requiredPerQuarter;
      const coveragePercent = (actualCashflow / (requiredPerQuarter || 1)) * 100;

      items.push({
        quarter: q,
        monthsRange: `Months ${minM}-${maxM}`,
        actualCashflow,
        targetCashflow: requiredPerQuarter,
        isMet,
        surplusDeficit,
        coveragePercent
      });
    }

    quarterlyCashflow = {
      targetPercent: targetQuarterlyCashflowPct,
      requiredPerQuarter,
      totalQuarters,
      quartersMet,
      items
    };
  }

  // ─── Stage 7: NOT_SELECTED (runner-up bonds) ──────────────────────────────
  // Bonds that passed all 6 filter stages but were not chosen by the optimizer.
  // These are valuable "almost" picks — showing them builds user trust.
  const selectedIsins = new Set(selectedBonds.map(b => b.isin));
  candidateBonds.forEach(b => {
    if (!selectedIsins.has(b.isin)) {
      eliminated.push({
        bond: b,
        reason: 'NOT_SELECTED',
        detail: `Passed all risk filters (Rating: ${b.rating}, Yield: ${(b.yield * 100).toFixed(2)}%) but was not chosen by the optimizer — another bond in the same maturity bucket offered a better risk-adjusted return or portfolio diversification.`
      });
    }
  });

  return {
    selectedBonds,
    totalInvestment,
    portfolioYield,
    fdRate: blendedFDRate,
    portfolioAnnualReturn,
    fdAnnualReturn,
    extraReturn,
    ratingDistribution,
    monthlyCashFlows,
    periodicCashFlows,
    companyAllocations: companyAllocations.sort((a, b) => b.amount - a.amount),
    quarterlyCashflow,
    eliminatedBonds: eliminated
  };
}
