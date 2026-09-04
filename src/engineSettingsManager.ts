export interface EngineHyperparameters {
  /** Maximum allowable single issuer allocation percentage (Sane default: 15%) */
  maxSingleIssuerPct: number;
  /** Maximum allowable single sector/industry concentration percentage (Sane default: 35%) */
  maxSingleSectorPct: number;
  /** Maximum allocation percentage allowed in Sub-A / BBB tier bonds (Sane default: 25%) */
  maxSubAPct: number;
  /** Maximum maturity tenor allowed for Sub-A / BBB tier bonds in months (Sane default: 12m) */
  maxBBBTenorMonths: number;
  /** Maximum acceptable yield drop to gain quarterly coupon coverage (Sane default: 0.5%) */
  cashflowYieldTolerancePct: number;
  /**
   * If true, allows allocating 1 unit of a bond whose unit price exceeds the single issuer cap.
   * If false (SANE DEFAULT), bonds with ticket size > issuer cap are eliminated to strictly protect diversification.
   */
  allowUnitOverflow: boolean;
  /** Enable intelligent fundamental risk tenure capping (higher bond risk -> lower allowable tenure) */
  enableFundamentalTenureCapping: boolean;
  /** Maximum holding period / tenure for high-risk / sub-A / low fundamental score bonds (months, default: 18m) */
  maxHighRiskTenorMonths: number;
  /** Maximum holding period / tenure for moderate-risk A-grade bonds (months, default: 36m) */
  maxModerateRiskTenorMonths: number;
  /** Enable investor risk appetite concentration scaling (higher risk appetite -> lower concentration on individual risky bonds) */
  enableInvestorRiskConcentration: boolean;
  /** Maximum single-issuer allocation cap on high-risk bonds in aggressive/high-yield mandates (default: 8%) */
  maxRiskyIssuerConcentrationPct: number;
  /** Maximum total Sub-AA allocation permitted for conservative investor mandates (default: 10%) */
  conservativeSubAACapPct: number;
}

export const DEFAULT_HYPERPARAMETERS: EngineHyperparameters = {
  maxSingleIssuerPct: 15,
  maxSingleSectorPct: 35,
  maxSubAPct: 25,
  maxBBBTenorMonths: 12.0,
  cashflowYieldTolerancePct: 0.5,
  allowUnitOverflow: false,
  enableFundamentalTenureCapping: true,
  maxHighRiskTenorMonths: 18.0,
  maxModerateRiskTenorMonths: 36.0,
  enableInvestorRiskConcentration: true,
  maxRiskyIssuerConcentrationPct: 8.0,
  conservativeSubAACapPct: 10.0
};

const STORAGE_KEY = 'bond-engine-hyperparameters';

/**
 * Retrieve current engine hyperparameters from localStorage with fallback to Sane Defaults.
 */
export function getEngineHyperparameters(): EngineHyperparameters {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { ...DEFAULT_HYPERPARAMETERS };
    const parsed = JSON.parse(raw);
    return {
      maxSingleIssuerPct: typeof parsed.maxSingleIssuerPct === 'number' ? parsed.maxSingleIssuerPct : DEFAULT_HYPERPARAMETERS.maxSingleIssuerPct,
      maxSingleSectorPct: typeof parsed.maxSingleSectorPct === 'number' ? parsed.maxSingleSectorPct : DEFAULT_HYPERPARAMETERS.maxSingleSectorPct,
      maxSubAPct: typeof parsed.maxSubAPct === 'number' ? parsed.maxSubAPct : DEFAULT_HYPERPARAMETERS.maxSubAPct,
      maxBBBTenorMonths: typeof parsed.maxBBBTenorMonths === 'number' ? parsed.maxBBBTenorMonths : DEFAULT_HYPERPARAMETERS.maxBBBTenorMonths,
      cashflowYieldTolerancePct: typeof parsed.cashflowYieldTolerancePct === 'number' ? parsed.cashflowYieldTolerancePct : DEFAULT_HYPERPARAMETERS.cashflowYieldTolerancePct,
      allowUnitOverflow: typeof parsed.allowUnitOverflow === 'boolean' ? parsed.allowUnitOverflow : DEFAULT_HYPERPARAMETERS.allowUnitOverflow,
      enableFundamentalTenureCapping: typeof parsed.enableFundamentalTenureCapping === 'boolean' ? parsed.enableFundamentalTenureCapping : DEFAULT_HYPERPARAMETERS.enableFundamentalTenureCapping,
      maxHighRiskTenorMonths: typeof parsed.maxHighRiskTenorMonths === 'number' ? parsed.maxHighRiskTenorMonths : DEFAULT_HYPERPARAMETERS.maxHighRiskTenorMonths,
      maxModerateRiskTenorMonths: typeof parsed.maxModerateRiskTenorMonths === 'number' ? parsed.maxModerateRiskTenorMonths : DEFAULT_HYPERPARAMETERS.maxModerateRiskTenorMonths,
      enableInvestorRiskConcentration: typeof parsed.enableInvestorRiskConcentration === 'boolean' ? parsed.enableInvestorRiskConcentration : DEFAULT_HYPERPARAMETERS.enableInvestorRiskConcentration,
      maxRiskyIssuerConcentrationPct: typeof parsed.maxRiskyIssuerConcentrationPct === 'number' ? parsed.maxRiskyIssuerConcentrationPct : DEFAULT_HYPERPARAMETERS.maxRiskyIssuerConcentrationPct,
      conservativeSubAACapPct: typeof parsed.conservativeSubAACapPct === 'number' ? parsed.conservativeSubAACapPct : DEFAULT_HYPERPARAMETERS.conservativeSubAACapPct
    };
  } catch (e) {
    console.error('Error reading engine hyperparameters from localStorage', e);
    return { ...DEFAULT_HYPERPARAMETERS };
  }
}

/**
 * Save updated engine hyperparameters to localStorage and notify listeners.
 */
export function saveEngineHyperparameters(params: Partial<EngineHyperparameters>): EngineHyperparameters {
  const current = getEngineHyperparameters();
  const updated: EngineHyperparameters = {
    ...current,
    ...params
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('engine-hyperparameters-changed'));
  }
  return updated;
}

/**
 * Reset all engine hyperparameters back to standard Sane Defaults.
 */
export function resetEngineHyperparameters(): EngineHyperparameters {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HYPERPARAMETERS));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('engine-hyperparameters-changed'));
  }
  return { ...DEFAULT_HYPERPARAMETERS };
}
