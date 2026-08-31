import { DefaultBond } from './defaultInventory';
import { getUnitPrice } from './bondEngine';
import { getCompanyOverrides, setCompanyOverride } from './overridesManager';
import { openBondDetailModal } from './bondDetailModal';
import {
  ScreenerFilterState,
  getAllScreens,
  saveCustomScreen,
  deleteSavedScreen,
  getScreenById,
  PRESET_SCREENS
} from './savedScreensManager';

let inventoryBonds: DefaultBond[] = [];
let filteredBonds: DefaultBond[] = [];

// Sorting State
type ScreenerSortColumn = 'issuer' | 'isin' | 'rating' | 'coupon' | 'yield' | 'months' | 'price' | 'totalTradableFV' | 'sector';
let sortColumn: ScreenerSortColumn = 'yield';
let sortDirection: 'asc' | 'desc' = 'desc';

// Active Screen ID
let activeScreenId: string | null = null;

// DOM Elements
let screenerSearch: HTMLInputElement;
let screenerMinYield: HTMLInputElement;
let screenerMaxYield: HTMLInputElement;
let screenerMinCoupon: HTMLInputElement;
let screenerMaxCoupon: HTMLInputElement;
let screenerMinTenure: HTMLInputElement;
let screenerMaxTenure: HTMLInputElement;
let screenerRating: HTMLSelectElement;
let screenerSector: HTMLSelectElement;
let screenerFrequency: HTMLSelectElement;
let screenerMaxPrice: HTMLSelectElement;
let screenerMinTradableFV: HTMLSelectElement;
let screenerGuarantorOnly: HTMLInputElement;
let screenerTableBody: HTMLTableSectionElement;
let screenerCount: HTMLDivElement;
let savedScreensSelect: HTMLSelectElement;
let presetChipsContainer: HTMLDivElement;
let activeFiltersChipsContainer: HTMLDivElement;

export function initScreener() {
  screenerSearch = document.getElementById('screener-search') as HTMLInputElement;
  screenerMinYield = document.getElementById('screener-min-yield') as HTMLInputElement;
  screenerMaxYield = document.getElementById('screener-max-yield') as HTMLInputElement;
  screenerMinCoupon = document.getElementById('screener-min-coupon') as HTMLInputElement;
  screenerMaxCoupon = document.getElementById('screener-max-coupon') as HTMLInputElement;
  screenerMinTenure = document.getElementById('screener-min-tenure') as HTMLInputElement;
  screenerMaxTenure = document.getElementById('screener-max-tenure') as HTMLInputElement;
  screenerRating = document.getElementById('screener-rating') as HTMLSelectElement;
  screenerSector = document.getElementById('screener-sector') as HTMLSelectElement;
  screenerFrequency = document.getElementById('screener-frequency') as HTMLSelectElement;
  screenerMaxPrice = document.getElementById('screener-max-price') as HTMLSelectElement;
  screenerMinTradableFV = document.getElementById('screener-min-tradable-fv') as HTMLSelectElement;
  screenerGuarantorOnly = document.getElementById('screener-guarantor-only') as HTMLInputElement;
  screenerTableBody = document.getElementById('screener-table-body') as HTMLTableSectionElement;
  screenerCount = document.getElementById('screener-count') as HTMLDivElement;
  savedScreensSelect = document.getElementById('saved-screens-select') as HTMLSelectElement;
  presetChipsContainer = document.getElementById('preset-chips-container') as HTMLDivElement;
  activeFiltersChipsContainer = document.getElementById('active-filters-chips') as HTMLDivElement;

  // Filter input listeners
  const filterInputs = [
    screenerSearch, screenerMinYield, screenerMaxYield, screenerMinCoupon,
    screenerMaxCoupon, screenerMinTenure, screenerMaxTenure, screenerRating,
    screenerSector, screenerFrequency, screenerMaxPrice, screenerMinTradableFV,
    screenerGuarantorOnly
  ];

  filterInputs.forEach(input => {
    if (!input) return;
    const eventName = input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input';
    input.addEventListener(eventName, () => {
      if (activeScreenId) {
        activeScreenId = null;
        if (savedScreensSelect) savedScreensSelect.value = '';
        renderPresetChips();
      }
      applyFilters();
    });
  });

  // Table Sorting headers
  document.querySelectorAll('#screener-view th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort') as ScreenerSortColumn;
      if (sortColumn === col) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = col;
        sortDirection = col === 'yield' || col === 'coupon' || col === 'totalTradableFV' ? 'desc' : 'asc';
      }
      updateSortIcons();
      applyFilters();
    });
  });

  // Saved Screens actions
  initSavedScreenControls();

  // Export CSV button
  const exportBtn = document.getElementById('screener-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportFilteredToCSV);
  }

  // Reset Filters button
  const resetBtn = document.getElementById('screener-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  // Toggle Advanced Filters drawer
  const toggleAdvBtn = document.getElementById('screener-toggle-advanced');
  const advPanel = document.getElementById('screener-advanced-panel');
  if (toggleAdvBtn && advPanel) {
    toggleAdvBtn.addEventListener('click', () => {
      const isHidden = advPanel.style.display === 'none';
      advPanel.style.display = isHidden ? 'grid' : 'none';
      toggleAdvBtn.textContent = isHidden ? '▲ Hide Advanced Filters' : '▼ More Filters';
    });
  }

  window.addEventListener('saved-screens-changed', populateSavedScreensDropdown);
  populateSavedScreensDropdown();
  renderPresetChips();
}

export function setScreenerInventory(bonds: DefaultBond[]) {
  inventoryBonds = bonds;
  populateSectorDropdown();
  applyFilters();
}

function populateSectorDropdown() {
  if (!screenerSector) return;
  const currentVal = screenerSector.value;
  const sectors = new Set<string>();
  inventoryBonds.forEach(b => {
    if (b.sector && b.sector.trim()) sectors.add(b.sector.trim());
  });

  const sortedSectors = Array.from(sectors).sort();
  screenerSector.innerHTML = '<option value="">All Sectors / Industries</option>';
  sortedSectors.forEach(sec => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = sec;
    screenerSector.appendChild(opt);
  });
  screenerSector.value = currentVal;
}

function initSavedScreenControls() {
  if (savedScreensSelect) {
    savedScreensSelect.addEventListener('change', () => {
      const selectedId = savedScreensSelect.value;
      if (selectedId) {
        loadScreenById(selectedId);
      }
    });
  }

  const saveScreenBtn = document.getElementById('save-screen-btn');
  if (saveScreenBtn) {
    saveScreenBtn.addEventListener('click', () => {
      const name = prompt('Enter a name for this custom screen:', 'My Custom Screen');
      if (name && name.trim()) {
        const filters = getCurrentFilterState();
        const saved = saveCustomScreen(name.trim(), filters);
        activeScreenId = saved.id;
        populateSavedScreensDropdown();
        if (savedScreensSelect) savedScreensSelect.value = saved.id;
        alert(`Screen "${name.trim()}" saved successfully!`);
      }
    });
  }

  const deleteScreenBtn = document.getElementById('delete-screen-btn');
  if (deleteScreenBtn) {
    deleteScreenBtn.addEventListener('click', () => {
      if (!activeScreenId || activeScreenId.startsWith('preset-')) {
        alert('Please select a custom saved screen to delete.');
        return;
      }
      const screen = getScreenById(activeScreenId);
      if (screen && confirm(`Delete saved screen "${screen.name}"?`)) {
        deleteSavedScreen(activeScreenId);
        activeScreenId = null;
        resetAllFilters();
      }
    });
  }
}

function populateSavedScreensDropdown() {
  if (!savedScreensSelect) return;
  const screens = getAllScreens();
  savedScreensSelect.innerHTML = '<option value="">📂 Load Saved Screen...</option>';

  const presetsGroup = document.createElement('optgroup');
  presetsGroup.label = '⚡ Standard Presets';
  screens.filter(s => s.isPreset).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    presetsGroup.appendChild(opt);
  });
  savedScreensSelect.appendChild(presetsGroup);

  const customScreens = screens.filter(s => !s.isPreset);
  if (customScreens.length > 0) {
    const customGroup = document.createElement('optgroup');
    customGroup.label = '⭐ My Custom Screens';
    customScreens.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      customGroup.appendChild(opt);
    });
    savedScreensSelect.appendChild(customGroup);
  }

  if (activeScreenId) {
    savedScreensSelect.value = activeScreenId;
  }
}

function renderPresetChips() {
  if (!presetChipsContainer) return;
  presetChipsContainer.innerHTML = '';
  PRESET_SCREENS.forEach(preset => {
    const isActive = activeScreenId === preset.id;
    const chip = document.createElement('button');
    chip.className = `preset-chip ${isActive ? 'active' : ''}`;
    chip.style.cssText = isActive
      ? 'background: rgba(212, 175, 55, 0.25); border: 1px solid var(--accent-gold); color: #fff; padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);'
      : 'background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-glass); color: var(--text-secondary); padding: 0.35rem 0.85rem; border-radius: 20px; font-size: 0.78rem; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap;';
    chip.innerHTML = `${preset.name} ${isActive ? ' <span style="font-size: 0.7rem; opacity: 0.8;">✕</span>' : ''}`;
    
    chip.addEventListener('mouseenter', () => {
      if (!isActive) {
        chip.style.background = 'rgba(212, 175, 55, 0.15)';
        chip.style.color = 'var(--accent-gold)';
      }
    });
    chip.addEventListener('mouseleave', () => {
      if (!isActive) {
        chip.style.background = 'rgba(255, 255, 255, 0.06)';
        chip.style.color = 'var(--text-secondary)';
      }
    });
    chip.addEventListener('click', () => {
      if (activeScreenId === preset.id) {
        // Toggle OFF if already active
        resetAllFilters();
      } else {
        // Activate preset
        loadScreenById(preset.id);
      }
    });
    presetChipsContainer.appendChild(chip);
  });
}

export function loadScreenById(id: string) {
  const screen = getScreenById(id);
  if (!screen) return;

  activeScreenId = screen.id;
  setFilterState(screen.filters);
  if (savedScreensSelect) savedScreensSelect.value = screen.id;
  renderPresetChips();
  applyFilters();
}

function getCurrentFilterState(): ScreenerFilterState {
  const state: ScreenerFilterState = {};
  if (screenerSearch?.value.trim()) state.searchTerm = screenerSearch.value.trim();
  if (screenerMinYield?.value) state.minYield = parseFloat(screenerMinYield.value);
  if (screenerMaxYield?.value) state.maxYield = parseFloat(screenerMaxYield.value);
  if (screenerMinCoupon?.value) state.minCoupon = parseFloat(screenerMinCoupon.value);
  if (screenerMaxCoupon?.value) state.maxCoupon = parseFloat(screenerMaxCoupon.value);
  if (screenerMinTenure?.value) state.minTenure = parseFloat(screenerMinTenure.value);
  if (screenerMaxTenure?.value) state.maxTenure = parseFloat(screenerMaxTenure.value);
  if (screenerRating?.value) state.rating = screenerRating.value;
  if (screenerSector?.value) state.sector = screenerSector.value;
  if (screenerFrequency?.value) state.frequency = screenerFrequency.value;
  if (screenerMaxPrice?.value) state.maxUnitPrice = parseFloat(screenerMaxPrice.value);
  if (screenerMinTradableFV?.value) state.minTradableFV = parseFloat(screenerMinTradableFV.value);
  if (screenerGuarantorOnly?.checked) state.guarantorOnly = true;
  return state;
}

function setFilterState(f: ScreenerFilterState) {
  if (screenerSearch) screenerSearch.value = f.searchTerm || '';
  if (screenerMinYield) screenerMinYield.value = f.minYield !== undefined ? f.minYield.toString() : '';
  if (screenerMaxYield) screenerMaxYield.value = f.maxYield !== undefined ? f.maxYield.toString() : '';
  if (screenerMinCoupon) screenerMinCoupon.value = f.minCoupon !== undefined ? f.minCoupon.toString() : '';
  if (screenerMaxCoupon) screenerMaxCoupon.value = f.maxCoupon !== undefined ? f.maxCoupon.toString() : '';
  if (screenerMinTenure) screenerMinTenure.value = f.minTenure !== undefined ? f.minTenure.toString() : '';
  if (screenerMaxTenure) screenerMaxTenure.value = f.maxTenure !== undefined ? f.maxTenure.toString() : '';
  if (screenerRating) screenerRating.value = f.rating || '';
  if (screenerSector) screenerSector.value = f.sector || '';
  if (screenerFrequency) screenerFrequency.value = f.frequency || '';
  if (screenerMaxPrice) screenerMaxPrice.value = f.maxUnitPrice !== undefined ? f.maxUnitPrice.toString() : '';
  if (screenerMinTradableFV) screenerMinTradableFV.value = f.minTradableFV !== undefined ? f.minTradableFV.toString() : '';
  if (screenerGuarantorOnly) screenerGuarantorOnly.checked = !!f.guarantorOnly;
}

export function resetAllFilters() {
  activeScreenId = null;
  if (savedScreensSelect) savedScreensSelect.value = '';
  setFilterState({});
  renderPresetChips();
  applyFilters();
}

export function applyFilters() {
  const f = getCurrentFilterState();

  filteredBonds = inventoryBonds.filter(b => {
    // 1. Text Search (Issuer, ISIN, Guarantor, Sector)
    if (f.searchTerm) {
      const term = f.searchTerm.toLowerCase();
      const matchIssuer = b.issuer.toLowerCase().includes(term);
      const matchIsin = b.isin.toLowerCase().includes(term);
      const matchGuarantor = b.guarantor ? b.guarantor.toLowerCase().includes(term) : false;
      const matchSector = b.sector ? b.sector.toLowerCase().includes(term) : false;
      if (!matchIssuer && !matchIsin && !matchGuarantor && !matchSector) return false;
    }

    // 2. Yield Filter (Yield % normalized against b.yield * 100)
    const bondYieldPct = b.yield * 100;
    if (f.minYield !== undefined && bondYieldPct < f.minYield) return false;
    if (f.maxYield !== undefined && bondYieldPct > f.maxYield) return false;

    // 3. Coupon Filter (Coupon % normalized against b.coupon * 100)
    const bondCouponPct = (b.coupon || 0) * 100;
    if (f.minCoupon !== undefined && bondCouponPct < f.minCoupon) return false;
    if (f.maxCoupon !== undefined && bondCouponPct > f.maxCoupon) return false;

    // 4. Tenure Range (Months)
    if (f.minTenure !== undefined && b.months < f.minTenure) return false;
    if (f.maxTenure !== undefined && b.months > f.maxTenure) return false;

    // 5. Credit Rating Filter
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

    // 6. Sector Filter
    if (f.sector && b.sector?.trim().toLowerCase() !== f.sector.trim().toLowerCase()) return false;

    // 7. Payment Frequency Filter
    if (f.frequency) {
      const freq = (b.frequency || '').toUpperCase();
      if (f.frequency === 'MONTHLY' && !freq.includes('MONTH')) return false;
      if (f.frequency === 'QUARTERLY' && !freq.includes('QUARTER')) return false;
      if (f.frequency === 'SEMI' && !freq.includes('SEMI') && !freq.includes('HALF') && !freq.includes('BI-ANNUAL')) return false;
      if (f.frequency === 'ANNUAL' && !freq.includes('ANNUAL') && !freq.includes('YEAR')) return false;
      if (f.frequency === 'ON_MATURITY' && !freq.includes('MATURITY') && !freq.includes('CUMULATIVE')) return false;
    }

    // 8. Max Unit Price Cap
    if (f.maxUnitPrice !== undefined) {
      const uPrice = getUnitPrice(b);
      if (uPrice > f.maxUnitPrice) return false;
    }

    // 9. Min Tradable FV
    if (f.minTradableFV !== undefined) {
      const fv = b.totalTradableFV || 0;
      if (fv < f.minTradableFV) return false;
    }

    // 10. Guarantor Only
    if (f.guarantorOnly && (!b.guarantor || !b.guarantor.trim())) return false;

    return true;
  });

  // Apply Sorting
  filteredBonds.sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortColumn) {
      case 'issuer': valA = a.issuer; valB = b.issuer; break;
      case 'isin': valA = a.isin; valB = b.isin; break;
      case 'rating': valA = a.rating; valB = b.rating; break;
      case 'coupon': valA = a.coupon || 0; valB = b.coupon || 0; break;
      case 'yield': valA = a.yield; valB = b.yield; break;
      case 'months': valA = a.months; valB = b.months; break;
      case 'price': valA = getUnitPrice(a); valB = getUnitPrice(b); break;
      case 'totalTradableFV': valA = a.totalTradableFV || 0; valB = b.totalTradableFV || 0; break;
      case 'sector': valA = a.sector || ''; valB = b.sector || ''; break;
      default: valA = a.yield; valB = b.yield; break;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      const numA = typeof valA === 'number' ? valA : 0;
      const numB = typeof valB === 'number' ? valB : 0;
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    }
  });

  renderActiveFilterChips(f);
  renderTable();
}

function renderActiveFilterChips(f: ScreenerFilterState) {
  if (!activeFiltersChipsContainer) return;
  activeFiltersChipsContainer.innerHTML = '';

  const activeChips: { label: string; clear: () => void }[] = [];

  if (f.searchTerm) activeChips.push({ label: `Search: "${f.searchTerm}"`, clear: () => { if (screenerSearch) screenerSearch.value = ''; } });
  if (f.minYield !== undefined) activeChips.push({ label: `Min Yield: ${f.minYield}%`, clear: () => { if (screenerMinYield) screenerMinYield.value = ''; } });
  if (f.maxYield !== undefined) activeChips.push({ label: `Max Yield: ${f.maxYield}%`, clear: () => { if (screenerMaxYield) screenerMaxYield.value = ''; } });
  if (f.minCoupon !== undefined) activeChips.push({ label: `Min Coupon: ${f.minCoupon}%`, clear: () => { if (screenerMinCoupon) screenerMinCoupon.value = ''; } });
  if (f.maxCoupon !== undefined) activeChips.push({ label: `Max Coupon: ${f.maxCoupon}%`, clear: () => { if (screenerMaxCoupon) screenerMaxCoupon.value = ''; } });
  if (f.minTenure !== undefined) activeChips.push({ label: `Min Tenure: ${f.minTenure}m`, clear: () => { if (screenerMinTenure) screenerMinTenure.value = ''; } });
  if (f.maxTenure !== undefined) activeChips.push({ label: `Max Tenure: ${f.maxTenure}m`, clear: () => { if (screenerMaxTenure) screenerMaxTenure.value = ''; } });
  if (f.rating) activeChips.push({ label: `Rating: ${f.rating}`, clear: () => { if (screenerRating) screenerRating.value = ''; } });
  if (f.sector) activeChips.push({ label: `Sector: ${f.sector}`, clear: () => { if (screenerSector) screenerSector.value = ''; } });
  if (f.frequency) activeChips.push({ label: `Freq: ${f.frequency}`, clear: () => { if (screenerFrequency) screenerFrequency.value = ''; } });
  if (f.maxUnitPrice !== undefined) activeChips.push({ label: `Max Unit: ₹${(f.maxUnitPrice / 100000).toFixed(1)}L`, clear: () => { if (screenerMaxPrice) screenerMaxPrice.value = ''; } });
  if (f.minTradableFV !== undefined) activeChips.push({ label: `Min FV: ₹${(f.minTradableFV / 100000).toFixed(0)}L`, clear: () => { if (screenerMinTradableFV) screenerMinTradableFV.value = ''; } });
  if (f.guarantorOnly) activeChips.push({ label: `Guaranteed Only`, clear: () => { if (screenerGuarantorOnly) screenerGuarantorOnly.checked = false; } });

  activeChips.forEach(chip => {
    const el = document.createElement('span');
    el.style.cssText = 'display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); padding: 0.2rem 0.55rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500;';
    el.innerHTML = `${chip.label} <span style="cursor: pointer; font-weight: 700; color: #f87171;" title="Remove filter">✕</span>`;
    const closeBtn = el.querySelector('span');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        chip.clear();
        activeScreenId = null;
        if (savedScreensSelect) savedScreensSelect.value = '';
        applyFilters();
      });
    }
    activeFiltersChipsContainer.appendChild(el);
  });
}

function updateSortIcons() {
  document.querySelectorAll('#screener-view th[data-sort]').forEach(th => {
    const span = th.querySelector('span');
    if (span) span.innerHTML = '↕';
    if (th.getAttribute('data-sort') === sortColumn) {
      if (span) span.innerHTML = sortDirection === 'asc' ? '▲' : '▼';
    }
  });
}

function renderTable() {
  if (!screenerTableBody) return;
  screenerTableBody.innerHTML = '';
  screenerCount.innerText = `Showing ${filteredBonds.length} of ${inventoryBonds.length} bonds`;

  if (filteredBonds.length === 0) {
    screenerTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 3rem; color: var(--text-secondary);">No bonds match your active screening criteria. Try adjusting or clearing your filters.</td></tr>`;
    return;
  }

  const displayLimit = Math.min(filteredBonds.length, 500);
  const overrides = getCompanyOverrides();

  for (let i = 0; i < displayLimit; i++) {
    const b = filteredBonds[i];
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    tr.style.transition = 'background 0.2s';
    
    tr.onmouseover = () => { tr.style.background = 'rgba(255,255,255,0.04)'; };
    tr.onmouseout = () => { tr.style.background = 'transparent'; };

    const fvFmt = b.totalTradableFV ? `₹${(b.totalTradableFV / 100000).toFixed(2)}L` : '-';
    const price = getUnitPrice(b);
    const priceFmt = `₹${(price / 100000).toFixed(2)}L`;
    const couponFmt = b.coupon ? `${(b.coupon * 100).toFixed(2)}%` : 'Zero Coupon';
    const yieldFmt = `${(b.yield * 100).toFixed(2)}%`;
    const isForced = overrides[b.issuer.trim().toUpperCase()]?.action === 'INCLUDE';
    const isExcluded = overrides[b.issuer.trim().toUpperCase()]?.action === 'EXCLUDE';

    tr.innerHTML = `
      <td style="padding: 0.75rem; font-weight: 600; cursor: pointer;" class="bond-name-cell" title="Click to view detailed insights">
        <div style="color: #fff;">${b.issuer}</div>
        <div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 500;">${b.sector || 'Corporate'}</div>
      </td>
      <td style="padding: 0.75rem; font-family: monospace; color: var(--text-secondary); font-size: 0.82rem;">${b.isin}</td>
      <td style="padding: 0.75rem;"><span style="background: rgba(255,255,255,0.08); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${b.rating}</span></td>
      <td style="padding: 0.75rem;">
        <div style="font-weight: 500;">${couponFmt}</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary);">${b.frequency || 'ON MATURITY'}</div>
      </td>
      <td style="padding: 0.75rem; color: var(--accent-green); font-weight: 700; font-size: 0.95rem;">${yieldFmt}</td>
      <td style="padding: 0.75rem;">
        <div>${b.months.toFixed(1)}m</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary);">${b.maturity}</div>
      </td>
      <td style="padding: 0.75rem; font-weight: 600;">${priceFmt}</td>
      <td style="padding: 0.75rem;">${fvFmt}</td>
      <td style="padding: 0.75rem; text-align: right; white-space: nowrap;">
        <button class="force-add-btn" data-issuer="${b.issuer}" style="border-radius: 6px; padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 600; ${isForced ? 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);' : 'background: rgba(255,255,255,0.08); color: var(--text-primary); border: 1px solid var(--border-glass); cursor: pointer;'}">
          ${isForced ? '✓ Added' : '+ Include'}
        </button>
        <button class="exclude-btn" data-issuer="${b.issuer}" style="border-radius: 6px; padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.35rem; ${isExcluded ? 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);' : 'background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); cursor: pointer;'}">
          ${isExcluded ? '✕ Banned' : 'Exclude'}
        </button>
      </td>
    `;

    // Click bond name to open Bond Detail Modal
    const nameCell = tr.querySelector('.bond-name-cell') as HTMLElement;
    if (nameCell) {
      nameCell.addEventListener('click', () => {
        openBondDetailModal(b);
      });
    }

    // Force Add button handler
    const addBtn = tr.querySelector('.force-add-btn') as HTMLButtonElement;
    if (addBtn && !isForced) {
      addBtn.addEventListener('click', () => {
        const justification = prompt(`Add a justification note for force-including ${b.issuer}:`, "Manually added from Bond Screener");
        if (justification) {
          setCompanyOverride(b.issuer, 'INCLUDE', justification);
          applyFilters();
        }
      });
    }

    // Exclude button handler
    const excludeBtn = tr.querySelector('.exclude-btn') as HTMLButtonElement;
    if (excludeBtn && !isExcluded) {
      excludeBtn.addEventListener('click', () => {
        const justification = prompt(`Add a reason for excluding/banning ${b.issuer}:`, "Excluded via Bond Screener");
        if (justification) {
          setCompanyOverride(b.issuer, 'EXCLUDE', justification);
          applyFilters();
        }
      });
    }

    screenerTableBody.appendChild(tr);
  }

  if (filteredBonds.length > 500) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="9" style="text-align: center; padding: 1rem; color: var(--text-secondary); font-size: 0.85rem;">Showing first 500 results of ${filteredBonds.length}. Use filters above to narrow your query.</td>`;
    screenerTableBody.appendChild(tr);
  }
}

function exportFilteredToCSV() {
  if (filteredBonds.length === 0) {
    alert('No bonds to export in current filter view.');
    return;
  }

  const headers = ['Issuer', 'ISIN', 'Rating', 'Coupon (%)', 'Yield (YTM %)', 'Frequency', 'Tenure (Months)', 'Maturity', 'Unit Price (₹)', 'Tradable FV (₹)', 'Sector', 'Guarantor'];
  const rows = filteredBonds.map(b => [
    `"${(b.issuer || '').replace(/"/g, '""')}"`,
    `"${b.isin}"`,
    `"${b.rating}"`,
    b.coupon ? (b.coupon * 100).toFixed(2) : '0.00',
    (b.yield * 100).toFixed(2),
    `"${b.frequency || 'ON MATURITY'}"`,
    b.months.toFixed(1),
    `"${b.maturity}"`,
    getUnitPrice(b),
    b.totalTradableFV || 0,
    `"${(b.sector || '').replace(/"/g, '""')}"`,
    `"${(b.guarantor || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `bond_screener_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
