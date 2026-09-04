export interface ScreenerFilterState {
  searchTerm?: string;
  minYield?: number;
  maxYield?: number;
  minCoupon?: number;
  maxCoupon?: number;
  minTenure?: number;
  maxTenure?: number;
  rating?: string;
  sector?: string;
  frequency?: string;
  maxUnitPrice?: number;
  minTradableFV?: number;
  guarantorOnly?: boolean;
  securedOnly?: boolean;
  governanceRisk?: string;
}

export interface SavedScreen {
  id: string;
  name: string;
  description?: string;
  isPreset?: boolean;
  filters: ScreenerFilterState;
  createdAt: number;
}

const STORAGE_KEY = 'bond-saved-screens';

export const PRESET_SCREENS: SavedScreen[] = [
  {
    id: 'preset-clean-governance',
    name: '🛡️ Clean Governance & High Yield',
    description: 'Bonds with clean promoter governance (Score >= 80) and yield >= 10.5%',
    isPreset: true,
    filters: { minYield: 10.5, governanceRisk: 'CLEAN_ONLY' },
    createdAt: 1700000000000
  },
  {
    id: 'preset-high-yield',
    name: '🔥 High Yield (> 12% YTM)',
    description: 'Bonds offering high yields above 12% across tenures',
    isPreset: true,
    filters: { minYield: 12.0 },
    createdAt: 1700000000000
  },
  {
    id: 'preset-institutional',
    name: '🏛️ Institutional Grade (AAA / AA)',
    description: 'High credit quality bonds rated AAA or AA category',
    isPreset: true,
    filters: { rating: 'AA_OR_BETTER' },
    createdAt: 1700000000000
  },
  {
    id: 'preset-short-term',
    name: '⏱️ Short-Term Ladder (< 12 Mo)',
    description: 'Liquid short maturity bonds maturing within 1 year',
    isPreset: true,
    filters: { maxTenure: 12.0 },
    createdAt: 1700000000000
  },
  {
    id: 'preset-monthly-income',
    name: '💵 Monthly Regular Cashflow',
    description: 'Bonds providing regular monthly coupon payments',
    isPreset: true,
    filters: { frequency: 'MONTHLY' },
    createdAt: 1700000000000
  },
  {
    id: 'preset-retail-friendly',
    name: '🎯 Retail Accessible (≤ ₹1 Lakh Unit)',
    description: 'Bonds with lot size / unit price of ₹1 Lakh or less',
    isPreset: true,
    filters: { maxUnitPrice: 100000 },
    createdAt: 1700000000000
  }
];

/**
 * Retrieve user-created custom screens from localStorage.
 */
export function getCustomSavedScreens(): SavedScreen[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading saved screens from localStorage', e);
    return [];
  }
}

/**
 * Retrieve all screens (both built-in presets and user-saved custom screens).
 */
export function getAllScreens(): SavedScreen[] {
  return [...PRESET_SCREENS, ...getCustomSavedScreens()];
}

/**
 * Save a new custom screen or update an existing one.
 */
export function saveCustomScreen(name: string, filters: ScreenerFilterState, description?: string): SavedScreen {
  const customScreens = getCustomSavedScreens();
  const trimmedName = name.trim();
  
  // Check if a screen with this name already exists
  const existingIdx = customScreens.findIndex(s => s.name.toLowerCase() === trimmedName.toLowerCase());
  
  const screen: SavedScreen = {
    id: existingIdx >= 0 ? customScreens[existingIdx].id : `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: trimmedName,
    description: description?.trim() || `Custom screen with ${Object.keys(filters).length} active filters`,
    isPreset: false,
    filters,
    createdAt: Date.now()
  };

  if (existingIdx >= 0) {
    customScreens[existingIdx] = screen;
  } else {
    customScreens.unshift(screen);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(customScreens));
  window.dispatchEvent(new Event('saved-screens-changed'));
  return screen;
}

/**
 * Delete a custom saved screen by ID.
 */
export function deleteSavedScreen(id: string): boolean {
  if (id.startsWith('preset-')) return false; // Cannot delete built-in presets
  const customScreens = getCustomSavedScreens().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customScreens));
  window.dispatchEvent(new Event('saved-screens-changed'));
  return true;
}

/**
 * Get a specific screen by ID.
 */
export function getScreenById(id: string): SavedScreen | undefined {
  return getAllScreens().find(s => s.id === id);
}
