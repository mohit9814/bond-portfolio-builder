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
}

export const DEFAULT_HYPERPARAMETERS: EngineHyperparameters = {
  maxSingleIssuerPct: 15,
  maxSingleSectorPct: 35,
  maxSubAPct: 25,
  maxBBBTenorMonths: 12.0,
  cashflowYieldTolerancePct: 0.5,
  allowUnitOverflow: false
};

const STORAGE_KEY = 'bond-engine-hyperparameters';

/**
 * Retrieve current engine hyperparameters from localStorage with fallback to Sane Defaults.
 */
export function getEngineHyperparameters(): EngineHyperparameters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_HYPERPARAMETERS };
    const parsed = JSON.parse(raw);
    return {
      maxSingleIssuerPct: typeof parsed.maxSingleIssuerPct === 'number' ? parsed.maxSingleIssuerPct : DEFAULT_HYPERPARAMETERS.maxSingleIssuerPct,
      maxSingleSectorPct: typeof parsed.maxSingleSectorPct === 'number' ? parsed.maxSingleSectorPct : DEFAULT_HYPERPARAMETERS.maxSingleSectorPct,
      maxSubAPct: typeof parsed.maxSubAPct === 'number' ? parsed.maxSubAPct : DEFAULT_HYPERPARAMETERS.maxSubAPct,
      maxBBBTenorMonths: typeof parsed.maxBBBTenorMonths === 'number' ? parsed.maxBBBTenorMonths : DEFAULT_HYPERPARAMETERS.maxBBBTenorMonths,
      cashflowYieldTolerancePct: typeof parsed.cashflowYieldTolerancePct === 'number' ? parsed.cashflowYieldTolerancePct : DEFAULT_HYPERPARAMETERS.cashflowYieldTolerancePct,
      allowUnitOverflow: typeof parsed.allowUnitOverflow === 'boolean' ? parsed.allowUnitOverflow : DEFAULT_HYPERPARAMETERS.allowUnitOverflow
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('engine-hyperparameters-changed'));
  return updated;
}

/**
 * Reset all engine hyperparameters back to standard Sane Defaults.
 */
export function resetEngineHyperparameters(): EngineHyperparameters {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HYPERPARAMETERS));
  window.dispatchEvent(new Event('engine-hyperparameters-changed'));
  return { ...DEFAULT_HYPERPARAMETERS };
}
