export interface CompanyOverride {
  action: 'INCLUDE' | 'EXCLUDE';
  justification: string;
  timestamp: number;
}

const STORAGE_KEY = 'bond-company-overrides';

/**
 * Retrieve all persisted company overrides from localStorage.
 */
export function getCompanyOverrides(): Record<string, CompanyOverride> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Error reading company overrides from localStorage', e);
    return {};
  }
}

/**
 * Set or update a company override (Force INCLUDE or Force EXCLUDE).
 */
export function setCompanyOverride(issuer: string, action: 'INCLUDE' | 'EXCLUDE', justification: string) {
  const overrides = getCompanyOverrides();
  overrides[issuer.trim().toUpperCase()] = {
    action,
    justification: justification.trim() || `User manually set to ${action}`,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event('portfolio-overrides-changed'));
}

/**
 * Remove an individual company override.
 */
export function removeCompanyOverride(issuer: string) {
  const overrides = getCompanyOverrides();
  delete overrides[issuer.trim().toUpperCase()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event('portfolio-overrides-changed'));
}

/**
 * Clear all company overrides.
 */
export function clearAllCompanyOverrides() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('portfolio-overrides-changed'));
}

/**
 * Clear company overrides by action type (either all INCLUDES or all EXCLUDES).
 */
export function clearCompanyOverridesByAction(action: 'INCLUDE' | 'EXCLUDE') {
  const overrides = getCompanyOverrides();
  for (const key of Object.keys(overrides)) {
    if (overrides[key].action === action) {
      delete overrides[key];
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event('portfolio-overrides-changed'));
}
