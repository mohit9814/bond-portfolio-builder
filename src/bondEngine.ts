import { DefaultBond } from './defaultInventory';
import { parseRedemptionSchedule, generateStructuredCashFlows, StructuredRedemptionPlan, AmortizationType } from './redemptionEngine';
import { EngineHyperparameters, DEFAULT_HYPERPARAMETERS } from './engineSettingsManager';
import { resolveBondEntity } from './entityResolver';

export interface SelectedBond extends DefaultBond {
  allocatedAmount: number;
  allocatedPercent: number;
  allocationPercent: number;
  groupPercent?: number;
  annualInterest?: number;
  expectedAnnualReturn?: number;
  bucketIndex: number;
  overrideJustification?: string;
  units?: number;
  fdRate?: number;
  months: number;
  canonicalEntityKey?: string;
  canonicalEntityName?: string;
  governanceScore?: number;
  promoterRiskSeverity?: string;
  hasForeignBacking?: boolean;
  institutionalBadges?: string[];
  amortizationType?: AmortizationType | 'BULLET' | 'AMORTIZING' | 'STAGGERED' | 'EQUAL_ANNUAL_AMORTIZING' | 'STRUCTURED_TRANCHE_AMORTIZING' | string;
  structuredRedemptionPlan?: StructuredRedemptionPlan;
}

export interface FDRateConfig {
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
  t7: number;
}

export interface CashFlow {
  month: number;
  principal: number;
  interest: number;
  total: number;
  isin: string;
  issuer: string;
}

export interface PeriodicCashFlow {
  month: number;
  principal: number;
  coupon: number;
  total: number;
  isin: string;
  issuer: string;
  paymentLabel: string;
  outstandingPrincipalAfter: number;
  isAmortizingPrincipal: boolean;
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
  ratingTrend?: 'improving' | 'stable' | 'deteriorating';
  canonicalEntityKey?: string;
  canonicalEntityName?: string;
  governanceScore?: number;
  promoterRiskSeverity?: string;
  groupPercent?: number;
}

export interface GroupAllocation {
  groupKey: string;
  groupName: string;
  amount: number;
  percent: number;
  bondCount: number;
  issuers: string[];
  governanceScore?: number;
  promoterRiskSeverity?: string;
  hasForeignBacking?: boolean;
  institutionalBadges?: string[];
  ratings: string[];
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

export type EliminationReason =
  | 'TENURE_MISMATCH'      // Outside min/max tenure window selected by user
  | 'BUNDLE_FLEXI'         // Excluded category (Bundle-Flexi products)
  | 'USER_EXCLUDED'        // Manually excluded by user via the exclusion list
  | 'USER_EXCLUDE'         // Alias for manual exclusion
  | 'ILLIQUID_QTY'         // Total Tradable Qty = 0 or blank
  | 'ILLIQUID_FV'          // Total Tradable FV = 0 or blank
  | 'TICKET_SIZE_TOO_LARGE' // Unit price exceeds single issuer cap (diversification rule)
  | 'BBB_TENOR_VIOLATION'  // BBB-rated bond with tenure > 12 months (regulatory risk cap)
  | 'BELOW_MIN_RATING'     // Rating below user-specified minimum
  | 'PROMOTER_GOVERNANCE_RISK' // Flagged due to adverse promoter negative media / regulatory action
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
  groupAllocations: GroupAllocation[];
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
  companyOverrides: Record<string, { action: string; justification: string }> = {},
  hyperparameters: Partial<EngineHyperparameters> = {}
): PortfolioSummary {
  const hp: EngineHyperparameters = {
    ...DEFAULT_HYPERPARAMETERS,
    ...hyperparameters
  };

  const maxPossibleStandardBonds = Math.floor(totalInvestment / 100000) || 1;

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
    if (override?.action === 'INCLUDE' && reason !== 'ILLIQUID_QTY' && reason !== 'ILLIQUID_FV' && reason !== 'USER_EXCLUDED' && reason !== 'USER_EXCLUDE') {
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

  // ─── Stage 4b: Physical Unit Ticket Size & Diversification Guard ─────────
  const maxSingleIssuerCap = Math.max(
    totalInvestment * (hp.maxSingleIssuerPct / 100),
    totalInvestment / Math.min(targetNumIssuers, maxPossibleStandardBonds)
  );

  candidateBonds = candidateBonds.filter(b => {
    const override = companyOverrides[b.issuer];
    if (override?.action === 'INCLUDE') return true;

    const unitPrice = getUnitPrice(b);
    if (!hp.allowUnitOverflow && unitPrice > maxSingleIssuerCap) {
      return eliminate(b, 'TICKET_SIZE_TOO_LARGE',
        `Ticket size (₹${unitPrice.toLocaleString('en-IN')}) exceeds single-issuer diversification cap (₹${Math.round(maxSingleIssuerCap).toLocaleString('en-IN')}).`);
    }
    return true;
  });

  // ─── Stage 5: BBB tenure rule ─────────────────────────────────────────────
  candidateBonds = candidateBonds.filter(b => {
    const override = companyOverrides[b.issuer];
    if (override?.action === 'INCLUDE') return true;

    const symbol = getCleanRatingSymbol(b.rating);
    const isBBB = symbol.startsWith('BBB') && !symbol.includes('AAA') && !symbol.includes('AA') && !symbol.startsWith('A');
    if (isBBB && !relaxBBBCap && b.months > 12) {
      return eliminate(b, 'BBB_TENOR_VIOLATION',
        `Rating is ${b.rating} with tenure of ${b.months.toFixed(1)}m. BBB-rated bonds cannot exceed 12 months for capital protection.`);
    }
    return true;
  });

  // ─── Stage 6: Rating threshold ───────────────────────────────────────────
  candidateBonds = candidateBonds.filter(b => {
    const override = companyOverrides[b.issuer];
    if (override?.action === 'INCLUDE') return true;

    if (minRatingGrade === 'A') {
      if (!isAOrBetter(b.rating)) {
        return eliminate(b, 'BELOW_MIN_RATING',
          `Rating ${b.rating} is below the minimum required grade of A.`);
      }
    } else if (minRatingGrade === 'BBB-') {
      if (!isBBBMinusOrBetter(b.rating)) {
        return eliminate(b, 'BELOW_MIN_RATING',
          `Rating ${b.rating} is below the minimum required grade of BBB-.`);
      }
    }
    return true;
  });

  // ─── Stage 6b: Promoter / Entity Governance Risk Screening ───────────────
  candidateBonds = candidateBonds.filter(b => {
    const override = companyOverrides[b.issuer];
    if (override?.action === 'INCLUDE') return true;

    const entity = resolveBondEntity(b);
    if (entity.autoExclude || entity.riskSeverity === 'CRITICAL' || entity.riskSeverity === 'HIGH') {
      return eliminate(b, 'PROMOTER_GOVERNANCE_RISK',
        `Flagged due to high promoter/entity governance risk (${entity.canonicalEntityName}). Score: ${entity.governanceScore}/100.`);
    }
    return true;
  });

  // 2. Distribute into dynamic buckets
  const bucketCandidates: DefaultBond[][] = buckets.map(() => []);

  candidateBonds.forEach(bond => {
    buckets.forEach((bucket, idx) => {
      if (bond.months >= bucket.min && bond.months <= bucket.max) {
        bucketCandidates[idx].push(bond);
      }
    });
  });

  // Sort each bucket by yield descending
  bucketCandidates.forEach(bList => {
    bList.sort((a, b) => b.yield - a.yield);
  });

  // 3. Selection Strategy:
  let selected: { bond: DefaultBond; bucketIndex: number }[] = [];
  const selectedIssuers = new Set<string>();

  // Check manual replacements first
  if (manualReplacements) {
    manualReplacements.forEach((isin, bIdx) => {
      const b = candidateBonds.find(c => c.isin === isin);
      if (b) {
        selected.push({ bond: b, bucketIndex: bIdx });
        selectedIssuers.add(b.issuer);
      }
    });
  }

  // Pick unique issuers across buckets
  buckets.forEach((_, idx) => {
    if (manualReplacements && manualReplacements.has(idx)) {
      return;
    }
    const cand = bucketCandidates[idx].find(b => !selectedIssuers.has(b.issuer));
    if (cand) {
      selected.push({ bond: cand, bucketIndex: idx });
      selectedIssuers.add(cand.issuer);
    } else if (bucketCandidates[idx].length > 0) {
      // If unique issuer not found in bucket, pick highest yield from that bucket
      const anyCand = bucketCandidates[idx][0];
      selected.push({ bond: anyCand, bucketIndex: idx });
    }
  });

  // Fallback: If we didn't get targetNumIssuers, fill with highest yielding remaining unique bonds
  if (selected.length < targetNumIssuers && candidateBonds.length > 0) {
    const remaining = candidateBonds
      .filter(b => !selected.some(s => s.bond.isin === b.isin))
      .sort((a, b) => b.yield - a.yield);

    for (const rem of remaining) {
      if (selected.length >= targetNumIssuers) break;
      if (!selectedIssuers.has(rem.issuer) || selected.length < buckets.length) {
        selected.push({ bond: rem, bucketIndex: 0 });
        selectedIssuers.add(rem.issuer);
      }
    }
  }

  // 4. Optimization Loop (Target Yield Optimization if targetYieldPercent provided)
  if (targetYieldPercent && selected.length > 0) {
    const targetYield = targetYieldPercent / 100;
    let currentBlendedYield = selected.reduce((sum, s) => sum + s.bond.yield, 0) / selected.length;

    let improved = true;
    let loopLimit = 0;
    while (improved && loopLimit < 50) {
      improved = false;
      if (currentBlendedYield < targetYield) {
        // Find best yield upgrade
        let bestSwap: { selectedIndex: number; newBond: DefaultBond; yieldGain: number } | null = null;

        for (let i = 0; i < selected.length; i++) {
          const current = selected[i];
          const bIdx = current.bucketIndex;
          const candidates = bucketCandidates[bIdx] || candidateBonds;

          for (const cand of candidates) {
            if (selected.some(s => s.bond.isin === cand.isin)) continue;

            const wouldBeUnique = new Set(selected.map((s, idx) => idx === i ? cand.issuer : s.bond.issuer));
            if (wouldBeUnique.size < selectedIssuers.size) continue;

            const yieldGain = cand.yield - current.bond.yield;
            if (yieldGain > 0) {
              if (!bestSwap || yieldGain > bestSwap.yieldGain) {
                bestSwap = { selectedIndex: i, newBond: cand, yieldGain };
              }
            }
          }
        }

        if (bestSwap) {
          selected[bestSwap.selectedIndex].bond = bestSwap.newBond;
          currentBlendedYield = selected.reduce((sum, s) => sum + s.bond.yield, 0) / selected.length;
          improved = true;
        }
      } else {
        // If yield is satisfied, maximize rating/safety while keeping yield >= targetYield
        let bestSwap: { selectedIndex: number; newBond: DefaultBond; safetyGain: number } | null = null;

        for (let i = 0; i < selected.length; i++) {
          const current = selected[i];
          const bIdx = current.bucketIndex;
          const candidates = bucketCandidates[bIdx] || candidateBonds;

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

  // Maximum single company allocation limit: configurable percentage of total investment (Sane default: 15%)
  const baseMaxCompanyCap = Math.max(
    totalInvestment * (hp.maxSingleIssuerPct / 100),
    totalInvestment / Math.min(targetNumIssuers, maxPossibleStandardBonds)
  );

  // Track company total allocations to strictly enforce single issuer cap
  const companyAllocTotals: Record<string, number> = {};
  selected.forEach(s => { 
    companyAllocTotals[s.bond.issuer] = 0; 
    bondAllocations[s.bond.isin] = 0;
  });

  if (customAllocations && customAllocations.size === N) {
    // User custom allocation override (capped by totalTradableFV and company limit)
    selected.forEach(s => {
      const u = getUnitPrice(s.bond);
      let val = customAllocations.get(s.bond.isin) || 0;
      
      const fvCap = s.bond.totalTradableFV && s.bond.totalTradableFV > 0 ? s.bond.totalTradableFV : Infinity;
      const isForceIncluded = companyOverrides[s.bond.issuer]?.action === 'INCLUDE';
      const effectiveCompanyCap = (hp.allowUnitOverflow || isForceIncluded)
        ? Math.max(baseMaxCompanyCap, u)
        : baseMaxCompanyCap;
      
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
      const isForceIncluded = companyOverrides[s.bond.issuer]?.action === 'INCLUDE';
      const effectiveCompanyCap = (hp.allowUnitOverflow || isForceIncluded)
        ? Math.max(baseMaxCompanyCap, u)
        : baseMaxCompanyCap;
      
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
        const isForceIncluded = companyOverrides[s.bond.issuer]?.action === 'INCLUDE';
        const effectiveCompanyCap = (hp.allowUnitOverflow || isForceIncluded)
          ? Math.max(baseMaxCompanyCap, u)
          : baseMaxCompanyCap;
        
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

    const entityRes = resolveBondEntity(s.bond);
    const plan = parseRedemptionSchedule(s.bond.principalRedemption, s.bond.maturity, s.bond.months, allocatedAmount);

    selectedBonds.push({
      ...s.bond,
      allocationPercent,
      allocatedAmount,
      allocatedPercent: allocationPercent,
      expectedAnnualReturn: allocatedAmount * s.bond.yield,
      bucketIndex: s.bucketIndex,
      fdRate: fdRateForBond,
      overrideJustification: companyOverrides[s.bond.issuer]?.justification,
      canonicalEntityKey: entityRes.canonicalEntityKey,
      canonicalEntityName: entityRes.canonicalEntityName,
      governanceScore: entityRes.governanceScore,
      promoterRiskSeverity: entityRes.riskSeverity,
      hasForeignBacking: entityRes.hasForeignBacking,
      institutionalBadges: entityRes.institutionalBadges,
      amortizationType: plan.amortizationType,
      structuredRedemptionPlan: plan
    });

    const issuer = s.bond.issuer;
    if (!companyAllocMap[issuer]) {
      companyAllocMap[issuer] = { amount: 0, count: 0, rating: s.bond.rating, sampleBond: s.bond };
    }
    companyAllocMap[issuer].amount += allocatedAmount;
    companyAllocMap[issuer].count += 1;
  });

  const totalActualAllocated = selectedBonds.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const effectiveTotalInvestment = totalActualAllocated > 0 ? totalActualAllocated : totalInvestment;

  // Build Group / Conglomerate Summary Map
  const groupMap: Record<string, {
    key: string;
    name: string;
    amount: number;
    bondCount: number;
    issuers: Set<string>;
    governanceScore?: number;
    promoterRiskSeverity?: string;
    hasForeignBacking?: boolean;
    institutionalBadges?: string[];
    ratings: Set<string>;
  }> = {};

  selectedBonds.forEach(b => {
    const gKey = b.canonicalEntityKey || 'independent';
    const gName = b.canonicalEntityName || b.issuer;
    if (!groupMap[gKey]) {
      groupMap[gKey] = {
        key: gKey,
        name: gName,
        amount: 0,
        bondCount: 0,
        issuers: new Set<string>(),
        governanceScore: b.governanceScore,
        promoterRiskSeverity: b.promoterRiskSeverity,
        hasForeignBacking: b.hasForeignBacking,
        institutionalBadges: b.institutionalBadges,
        ratings: new Set<string>()
      };
    }
    groupMap[gKey].amount += b.allocatedAmount;
    groupMap[gKey].bondCount += 1;
    groupMap[gKey].issuers.add(b.issuer);
    groupMap[gKey].ratings.add(b.rating);
  });

  const groupAllocations: GroupAllocation[] = Object.values(groupMap).map(g => ({
    groupKey: g.key,
    groupName: g.name,
    amount: g.amount,
    percent: g.amount / effectiveTotalInvestment,
    bondCount: g.bondCount,
    issuers: Array.from(g.issuers),
    governanceScore: g.governanceScore,
    promoterRiskSeverity: g.promoterRiskSeverity,
    hasForeignBacking: g.hasForeignBacking,
    institutionalBadges: g.institutionalBadges,
    ratings: Array.from(g.ratings)
  })).sort((a, b) => b.amount - a.amount);

  // Decorate selectedBonds with groupPercent
  selectedBonds.forEach(b => {
    const gKey = b.canonicalEntityKey || 'independent';
    const grp = groupMap[gKey];
    if (grp) {
      b.groupPercent = grp.amount / effectiveTotalInvestment;
    }
  });

  const companyAllocations: CompanyAllocation[] = Object.keys(companyAllocMap).map(company => {
    const data = companyAllocMap[company];
    const entityRes = resolveBondEntity(data.sampleBond);
    const gKey = entityRes.canonicalEntityKey;
    const grp = groupMap[gKey];
    return {
      company,
      amount: data.amount,
      percent: data.amount / effectiveTotalInvestment,
      groupPercent: grp ? grp.amount / effectiveTotalInvestment : undefined,
      bondCount: data.count,
      rating: data.rating,
      sector: data.sampleBond.sector,
      guarantor: data.sampleBond.guarantor,
      guarantorRating: data.sampleBond.guarantorRating,
      ratingTrend: data.sampleBond.ratingTrend,
      canonicalEntityKey: entityRes.canonicalEntityKey,
      canonicalEntityName: entityRes.canonicalEntityName,
      governanceScore: entityRes.governanceScore,
      promoterRiskSeverity: entityRes.riskSeverity
    };
  });

  // Calculate Metrics
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

  // Calculate maturing cash flows (including structured amortizing tranches)
  const monthlyCashFlows: CashFlow[] = [];
  selectedBonds.forEach(b => {
    const plan = b.structuredRedemptionPlan || parseRedemptionSchedule(b.principalRedemption, b.maturity, b.months, b.allocatedAmount);
    plan.tranches.forEach(tranche => {
      const trancheInterest = tranche.principalAmount * b.yield * (tranche.month / 12);
      monthlyCashFlows.push({
        month: tranche.month,
        principal: tranche.principalAmount,
        interest: trancheInterest,
        total: tranche.principalAmount + trancheInterest,
        isin: b.isin,
        issuer: b.issuer
      });
    });
  });
  monthlyCashFlows.sort((a, b) => a.month - b.month);

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Periodic Coupon & Structured Principal Payment Events
  // Models reducing-balance coupon distributions for amortizing bonds
  // ─────────────────────────────────────────────────────────────────────────
  const periodicCashFlows: PeriodicCashFlow[] = [];

  selectedBonds.forEach(bond => {
    const { periodicFlows } = generateStructuredCashFlows({
      isin: bond.isin,
      issuer: bond.issuer,
      yield: bond.yield,
      months: bond.months,
      maturity: bond.maturity,
      frequency: bond.frequency,
      allocatedAmount: bond.allocatedAmount,
      principalRedemption: bond.principalRedemption
    });

    periodicFlows.forEach(flow => {
      periodicCashFlows.push({
        month: flow.month,
        principal: flow.principal,
        coupon: flow.coupon,
        total: flow.total,
        isin: flow.isin,
        issuer: flow.issuer,
        paymentLabel: flow.paymentLabel,
        outstandingPrincipalAfter: flow.outstandingPrincipalAfter,
        isAmortizingPrincipal: flow.isAmortizingPrincipal
      });
    });
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
    groupAllocations,
    quarterlyCashflow,
    eliminatedBonds: eliminated
  };
}
