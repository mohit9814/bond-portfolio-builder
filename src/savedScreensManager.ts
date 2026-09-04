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
  swotProfile?: string;
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
    id: 'preset-swot-high-capital',
    name: '💪 Strong Capital Buffer (CRAR ≥ 20%)',
    description: 'Bonds with verified rating agency CRAR buffer >= 20% and clean governance',
    isPreset: true,
    filters: { swotProfile: 'high_crar', governanceRisk: 'EXCLUDE_CRITICAL_HIGH' },
    createdAt: 1700000000000
  },
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

export function getCustomSavedScreens(): SavedScreen[] {
  try {
    const data = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getAllScreens(): SavedScreen[] {
  return [...PRESET_SCREENS, ...getCustomSavedScreens()];
}

export function saveCustomScreen(
  name: string,
  arg2: string | ScreenerFilterState,
  arg3?: ScreenerFilterState | string
): SavedScreen {
  let description = '';
  let filters: ScreenerFilterState = {};

  if (typeof arg2 === 'string') {
    description = arg2;
    filters = (arg3 as ScreenerFilterState) || {};
  } else {
    filters = arg2;
    description = typeof arg3 === 'string' ? arg3 : '';
  }

  const current = getCustomSavedScreens();
  const newScreen: SavedScreen = {
    id: 'screen-' + Date.now(),
    name,
    description,
    isPreset: false,
    filters,
    createdAt: Date.now()
  };

  current.push(newScreen);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  return newScreen;
}

export function deleteSavedScreen(id: string): boolean {
  const current = getCustomSavedScreens();
  const filtered = current.filter(s => s.id !== id);
  if (filtered.length !== current.length) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    return true;
  }
  return false;
}

export function getScreenById(id: string): SavedScreen | undefined {
  return getAllScreens().find(s => s.id === id);
}
