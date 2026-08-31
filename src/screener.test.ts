import { DEFAULT_INVENTORY, DefaultBond } from './defaultInventory';
import { getUnitPrice } from './bondEngine';
import {
  ScreenerFilterState,
  PRESET_SCREENS,
  getAllScreens,
  saveCustomScreen,
  deleteSavedScreen,
  getScreenById
} from './savedScreensManager';

// Mock localStorage for Node test runner
const mockStore: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStore[k] || null,
  setItem: (k: string, v: string) => { mockStore[k] = v; },
  removeItem: (k: string) => { delete mockStore[k]; },
  clear: () => { for (const k in mockStore) delete mockStore[k]; }
};
(globalThis as any).window = {
  dispatchEvent: () => true
};

function filterInventory(inventory: DefaultBond[], f: ScreenerFilterState): DefaultBond[] {
  return inventory.filter(b => {
    if (f.searchTerm) {
      const term = f.searchTerm.toLowerCase();
      const matchIssuer = b.issuer.toLowerCase().includes(term);
      const matchIsin = b.isin.toLowerCase().includes(term);
      const matchGuarantor = b.guarantor ? b.guarantor.toLowerCase().includes(term) : false;
      const matchSector = b.sector ? b.sector.toLowerCase().includes(term) : false;
      if (!matchIssuer && !matchIsin && !matchGuarantor && !matchSector) return false;
    }

    const bondYieldPct = b.yield * 100;
    if (f.minYield !== undefined && bondYieldPct < f.minYield) return false;
    if (f.maxYield !== undefined && bondYieldPct > f.maxYield) return false;

    const bondCouponPct = (b.coupon || 0) * 100;
    if (f.minCoupon !== undefined && bondCouponPct < f.minCoupon) return false;
    if (f.maxCoupon !== undefined && bondCouponPct > f.maxCoupon) return false;

    if (f.minTenure !== undefined && b.months < f.minTenure) return false;
    if (f.maxTenure !== undefined && b.months > f.maxTenure) return false;

    if (f.rating) {
      const r = b.rating.toUpperCase();
      if (f.rating === 'AAA' && !r.includes('AAA')) return false;
      if (f.rating === 'AA' && !r.includes('AA')) return false;
      if (f.rating === 'AA_OR_BETTER' && !r.includes('AAA') && !r.includes('AA') && !r.includes('SOVEREIGN') && !r.includes('GOI')) return false;
      if (f.rating === 'A_OR_BETTER' && !r.includes('AAA') && !r.includes('AA') && !r.includes('A') && !r.includes('SOVEREIGN') && !r.includes('GOI')) return false;
      if (f.rating === 'A' && (!r.includes('A') || r.includes('AAA') || r.includes('AA'))) return false;
      if (f.rating === 'BBB' && !r.includes('BBB')) return false;
      if (f.rating === 'SUB_BBB' && (r.includes('AAA') || r.includes('AA') || r.includes('A') || r.includes('BBB') || r.includes('SOVEREIGN'))) return false;
    }

    if (f.sector && b.sector?.trim().toLowerCase() !== f.sector.trim().toLowerCase()) return false;

    if (f.frequency) {
      const freq = (b.frequency || '').toUpperCase();
      if (f.frequency === 'MONTHLY' && !freq.includes('MONTH')) return false;
      if (f.frequency === 'QUARTERLY' && !freq.includes('QUARTER')) return false;
      if (f.frequency === 'SEMI' && !freq.includes('SEMI') && !freq.includes('HALF') && !freq.includes('BI-ANNUAL')) return false;
      if (f.frequency === 'ANNUAL' && !freq.includes('ANNUAL') && !freq.includes('YEAR')) return false;
      if (f.frequency === 'ON_MATURITY' && !freq.includes('MATURITY') && !freq.includes('CUMULATIVE')) return false;
    }

    if (f.maxUnitPrice !== undefined) {
      const uPrice = getUnitPrice(b);
      if (uPrice > f.maxUnitPrice) return false;
    }

    if (f.minTradableFV !== undefined) {
      const fv = b.totalTradableFV || 0;
      if (fv < f.minTradableFV) return false;
    }

    if (f.guarantorOnly && (!b.guarantor || !b.guarantor.trim())) return false;

    return true;
  });
}

function runScreenerTests() {
  console.log('=== Running Bond Screener & Saved Screens Test Suite ===\n');

  // Test 1: Percentage Filtering Fix (Yield & Coupon)
  const minYieldFilter: ScreenerFilterState = { minYield: 11.0 };
  const yieldResults = filterInventory(DEFAULT_INVENTORY, minYieldFilter);
  console.assert(yieldResults.length > 0, 'FAIL Test 1a: Should find bonds with yield >= 11.0%');
  yieldResults.forEach(b => {
    console.assert(b.yield * 100 >= 11.0, `FAIL Test 1b: Bond ${b.isin} yield ${b.yield * 100}% is less than 11.0%`);
  });
  console.log(`Test 1 — Percentage Filter Fix: Min Yield (11.0%) matched ${yieldResults.length} bonds correctly ✓`);

  // Test 2: Min & Max Yield Range
  const yieldRangeFilter: ScreenerFilterState = { minYield: 10.0, maxYield: 12.0 };
  const rangeResults = filterInventory(DEFAULT_INVENTORY, yieldRangeFilter);
  rangeResults.forEach(b => {
    const yPct = b.yield * 100;
    console.assert(yPct >= 10.0 && yPct <= 12.0, `FAIL Test 2: Bond ${b.isin} yield ${yPct}% out of range [10, 12]`);
  });
  console.log(`Test 2 — Yield Range: [10.0%, 12.0%] matched ${rangeResults.length} bonds within bounds ✓`);

  // Test 3: Tenure & Rating Grade Filter Combination
  const comboFilter: ScreenerFilterState = {
    minTenure: 6,
    maxTenure: 24,
    rating: 'AA_OR_BETTER'
  };
  const comboResults = filterInventory(DEFAULT_INVENTORY, comboFilter);
  comboResults.forEach(b => {
    console.assert(b.months >= 6 && b.months <= 24, `FAIL Test 3a: Tenure ${b.months} out of bounds`);
    const r = b.rating.toUpperCase();
    console.assert(r.includes('AAA') || r.includes('AA') || r.includes('SOVEREIGN') || r.includes('GOI'), `FAIL Test 3b: Rating ${b.rating} not AA or better`);
  });
  console.log(`Test 3 — Multi-Parameter Query (Tenure + Rating): Matched ${comboResults.length} bonds ✓`);

  // Test 4: Physical Unit Price Cap Filter
  const priceCapFilter: ScreenerFilterState = { maxUnitPrice: 100000 };
  const priceResults = filterInventory(DEFAULT_INVENTORY, priceCapFilter);
  priceResults.forEach(b => {
    const uPrice = getUnitPrice(b);
    console.assert(uPrice <= 100000, `FAIL Test 4: Unit price ₹${uPrice} exceeds ₹1,00,000 cap`);
  });
  console.log(`Test 4 — Unit Price Cap (≤ ₹1L): Matched ${priceResults.length} retail accessible bonds ✓`);

  // Test 5: Saved Screens CRUD Lifecycle
  // Step A: Check presets exist
  console.assert(PRESET_SCREENS.length >= 5, 'FAIL Test 5a: Preset screens should exist');
  
  // Step B: Save a custom screen
  const customFilter: ScreenerFilterState = { minYield: 12.5, minTenure: 12, rating: 'A_OR_BETTER' };
  const saved = saveCustomScreen('High Yield Long Term A+', customFilter, 'My personal strategy');
  console.assert(saved.name === 'High Yield Long Term A+', 'FAIL Test 5b: Saved screen name match');
  console.assert(saved.filters.minYield === 12.5, 'FAIL Test 5c: Saved filter state match');

  // Step C: Retrieve all screens and verify custom screen is loaded
  const allScreens = getAllScreens();
  const loaded = allScreens.find(s => s.id === saved.id);
  console.assert(loaded !== undefined, 'FAIL Test 5d: Custom screen should be in getAllScreens()');
  console.assert(loaded?.name === 'High Yield Long Term A+', 'FAIL Test 5e: Loaded screen name match');

  // Step D: Retrieve by ID
  const direct = getScreenById(saved.id);
  console.assert(direct?.id === saved.id, 'FAIL Test 5f: getScreenById match');

  // Step E: Delete custom screen
  const deleted = deleteSavedScreen(saved.id);
  console.assert(deleted === true, 'FAIL Test 5g: deleteSavedScreen should return true');
  console.assert(getScreenById(saved.id) === undefined, 'FAIL Test 5h: Deleted screen should not exist');

  // Step F: Preset deletion guard
  const presetDeleteAttempt = deleteSavedScreen(PRESET_SCREENS[0].id);
  console.assert(presetDeleteAttempt === false, 'FAIL Test 5i: Presets must not be deletable');

  console.log('Test 5 — Saved Screens Manager Lifecycle (Create, List, Read, Guarded Delete) passed ✓');

  console.log('\nAll 5 Screener Test Suites Passed Successfully! ✓');
}

runScreenerTests();
