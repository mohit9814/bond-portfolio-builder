import { openCreditFiveCsModal } from './creditFiveCsModal';
import { getCreditCoverageRecord } from './data/creditCoverageIntelligence';
import { DefaultBond } from './defaultInventory';
import { getUnitPrice } from './bondEngine';
import { getCompanyOverrides, setCompanyOverride } from './overridesManager';
import { openBondDetailModal } from './bondDetailModal';
import { resolveBondEntity } from './entityResolver';
import { getBusinessSwot } from './data/swotIntelligence';
import { openPromoterProfileModal } from './promoterProfileModal';
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

type ScreenerSortColumn = 'issuer' | 'isin' | 'rating' | 'governance' | 'coupon' | 'yield' | 'months' | 'price' | 'totalTradableFV' | 'sector';
let sortColumn: ScreenerSortColumn = 'yield';
let sortDirection: 'asc' | 'desc' = 'desc';

let activeScreenId: string | null = null;

let screenerSearch: HTMLInputElement;
let screenerMinYield: HTMLInputElement;
let screenerMaxYield: HTMLInputElement;
let screenerMinCoupon: HTMLInputElement;
let screenerMaxCoupon: HTMLInputElement;
let screenerMinTenure: HTMLInputElement;
let screenerMaxTenure: HTMLInputElement;
let screenerRating: HTMLSelectElement;
let screenerGovernance: HTMLSelectElement;
let screenerSwot: HTMLSelectElement;
let screenerFiveCs: HTMLSelectElement;
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
  screenerGovernance = document.getElementById('screener-governance') as HTMLSelectElement;
  screenerSwot = document.getElementById('screener-swot') as HTMLSelectElement;
  screenerFiveCs = document.getElementById('screener-fivecs') as HTMLSelectElement;
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

  const filterInputs = [
    screenerSearch, screenerMinYield, screenerMaxYield, screenerMinCoupon,
    screenerMaxCoupon, screenerMinTenure, screenerMaxTenure, screenerRating,
    screenerGovernance, screenerSwot, screenerFiveCs, screenerSector, screenerFrequency, screenerMaxPrice,
    screenerMinTradableFV, screenerGuarantorOnly
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

  initSavedScreenControls();

  const exportBtn = document.getElementById('screener-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportFilteredToCSV);
  }

  const resetBtn = document.getElementById('screener-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  const toggleAdvBtn = document.getElementById('screener-toggle-advanced');
  const advPanel = document.getElementById('screener-advanced-panel');
  if (toggleAdvBtn && advPanel) {
    toggleAdvBtn.addEventListener('click', () => {
      const isHidden = advPanel.style.display === 'none';
      advPanel.style.display = isHidden ? 'grid' : 'none';
      toggleAdvBtn.innerText = isHidden ? '▲ Less Filters' : '▼ More Filters';
    });
  }
}

export function updateScreenerData(bonds: DefaultBond[]) {
  inventoryBonds = bonds;
  populateSectorDropdown();
  renderPresetChips();
  populateSavedScreensDropdown();
  applyFilters();
}

function populateSectorDropdown() {
  if (!screenerSector) return;
  const currentVal = screenerSector.value;
  const sectors = Array.from(new Set(inventoryBonds.map(b => b.sector?.trim()).filter(Boolean))).sort();
  
  screenerSector.innerHTML = '<option value="">All Sectors</option>';
  sectors.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s as string;
    opt.innerText = s as string;
    screenerSector.appendChild(opt);
  });
  screenerSector.value = currentVal;
}

function populateSavedScreensDropdown() {
  if (!savedScreensSelect) return;
  savedScreensSelect.innerHTML = '<option value="">-- Select Saved Screen --</option>';

  const screens = getAllScreens();
  const presetsGroup = document.createElement('optgroup');
  presetsGroup.label = '⚡ Built-in Preset Screens';

  const customGroup = document.createElement('optgroup');
  customGroup.label = '📁 My Saved Custom Screens';

  screens.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.innerText = s.name;
    if (s.isPreset) {
      presetsGroup.appendChild(opt);
    } else {
      customGroup.appendChild(opt);
    }
  });

  savedScreensSelect.appendChild(presetsGroup);
  if (customGroup.children.length > 0) {
    savedScreensSelect.appendChild(customGroup);
  }
}

function renderPresetChips() {
  if (!presetChipsContainer) return;
  presetChipsContainer.innerHTML = '';

  PRESET_SCREENS.forEach(preset => {
    const chip = document.createElement('button');
    const isActive = activeScreenId === preset.id;
    chip.className = 'preset-chip';
    chip.style.cssText = `
      background: ${isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)'};
      color: ${isActive ? '#000' : 'var(--text-primary)'};
      border: 1px solid ${isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.12)'};
      border-radius: 20px;
      padding: 0.35rem 0.85rem;
      font-size: 0.8rem;
      font-weight: ${isActive ? '700' : '500'};
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    `;
    chip.innerText = preset.name;
    chip.title = preset.description || preset.name;

    chip.addEventListener('click', () => {
      if (activeScreenId === preset.id) {
        resetAllFilters();
      } else {
        loadScreenState(preset);
      }
    });

    presetChipsContainer.appendChild(chip);
  });
}

function initSavedScreenControls() {
  savedScreensSelect?.addEventListener('change', () => {
    const id = savedScreensSelect.value;
    if (!id) return;
    const s = getScreenById(id);
    if (s) {
      loadScreenState(s);
    }
  });

  const saveBtn = document.getElementById('screener-save-screen-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const name = prompt('Enter a name for this custom screen:');
      if (!name || !name.trim()) return;
      const desc = prompt('Optional short description:') || '';

      const currentState = getCurrentFilterState();
      const newScreen = saveCustomScreen(name.trim(), desc.trim(), currentState);
      populateSavedScreensDropdown();
      if (savedScreensSelect) savedScreensSelect.value = newScreen.id;
      activeScreenId = newScreen.id;
      renderPresetChips();
      alert(`Screen "${name}" saved successfully!`);
    });
  }

  const deleteBtn = document.getElementById('screener-delete-screen-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeScreenId) {
        alert('Please select a custom screen to delete.');
        return;
      }
      const s = getScreenById(activeScreenId);
      if (!s || s.isPreset) {
        alert('Preset screens cannot be deleted.');
        return;
      }
      if (confirm(`Are you sure you want to delete custom screen "${s.name}"?`)) {
        deleteSavedScreen(activeScreenId);
        activeScreenId = null;
        populateSavedScreensDropdown();
        renderPresetChips();
        resetAllFilters();
      }
    });
  }
}

function loadScreenState(screen: { id: string; filters: ScreenerFilterState }) {
  activeScreenId = screen.id;
  if (savedScreensSelect) savedScreensSelect.value = screen.id;

  const f = screen.filters;
  if (screenerSearch) screenerSearch.value = f.searchTerm || '';
  if (screenerMinYield) screenerMinYield.value = f.minYield !== undefined ? f.minYield.toString() : '';
  if (screenerMaxYield) screenerMaxYield.value = f.maxYield !== undefined ? f.maxYield.toString() : '';
  if (screenerMinCoupon) screenerMinCoupon.value = f.minCoupon !== undefined ? f.minCoupon.toString() : '';
  if (screenerMaxCoupon) screenerMaxCoupon.value = f.maxCoupon !== undefined ? f.maxCoupon.toString() : '';
  if (screenerMinTenure) screenerMinTenure.value = f.minTenure !== undefined ? f.minTenure.toString() : '';
  if (screenerMaxTenure) screenerMaxTenure.value = f.maxTenure !== undefined ? f.maxTenure.toString() : '';
  if (screenerRating) screenerRating.value = f.rating || '';
  if (screenerGovernance) screenerGovernance.value = f.governanceRisk !== undefined ? f.governanceRisk : '';
  if (screenerSwot) screenerSwot.value = f.swotProfile || '';
  if (screenerFiveCs) screenerFiveCs.value = f.fiveCsProfile || '';
  if (screenerSector) screenerSector.value = f.sector || '';
  if (screenerFrequency) screenerFrequency.value = f.frequency || '';
  if (screenerMaxPrice) screenerMaxPrice.value = f.maxUnitPrice !== undefined ? f.maxUnitPrice.toString() : '';
  if (screenerMinTradableFV) screenerMinTradableFV.value = f.minTradableFV !== undefined ? f.minTradableFV.toString() : '';
  if (screenerGuarantorOnly) screenerGuarantorOnly.checked = !!f.guarantorOnly;

  renderPresetChips();
  applyFilters();
}

function getCurrentFilterState(): ScreenerFilterState {
  return {
    searchTerm: screenerSearch?.value.trim() || undefined,
    minYield: screenerMinYield?.value ? parseFloat(screenerMinYield.value) : undefined,
    maxYield: screenerMaxYield?.value ? parseFloat(screenerMaxYield.value) : undefined,
    minCoupon: screenerMinCoupon?.value ? parseFloat(screenerMinCoupon.value) : undefined,
    maxCoupon: screenerMaxCoupon?.value ? parseFloat(screenerMaxCoupon.value) : undefined,
    minTenure: screenerMinTenure?.value ? parseFloat(screenerMinTenure.value) : undefined,
    maxTenure: screenerMaxTenure?.value ? parseFloat(screenerMaxTenure.value) : undefined,
    rating: screenerRating?.value || undefined,
    governanceRisk: screenerGovernance?.value || undefined,
    swotProfile: screenerSwot?.value || undefined,
    fiveCsProfile: screenerFiveCs?.value || undefined,
    sector: screenerSector?.value || undefined,
    frequency: screenerFrequency?.value || undefined,
    maxUnitPrice: screenerMaxPrice?.value ? parseFloat(screenerMaxPrice.value) : undefined,
    minTradableFV: screenerMinTradableFV?.value ? parseFloat(screenerMinTradableFV.value) : undefined,
    guarantorOnly: screenerGuarantorOnly?.checked || undefined
  };
}

export function resetAllFilters() {
  activeScreenId = null;
  if (savedScreensSelect) savedScreensSelect.value = '';
  if (screenerSearch) screenerSearch.value = '';
  if (screenerMinYield) screenerMinYield.value = '';
  if (screenerMaxYield) screenerMaxYield.value = '';
  if (screenerMinCoupon) screenerMinCoupon.value = '';
  if (screenerMaxCoupon) screenerMaxCoupon.value = '';
  if (screenerMinTenure) screenerMinTenure.value = '';
  if (screenerMaxTenure) screenerMaxTenure.value = '';
  if (screenerRating) screenerRating.value = '';
  if (screenerGovernance) screenerGovernance.value = 'EXCLUDE_CRITICAL_HIGH';
  if (screenerSwot) screenerSwot.value = '';
  if (screenerFiveCs) screenerFiveCs.value = '';
  if (screenerSector) screenerSector.value = '';
  if (screenerFrequency) screenerFrequency.value = '';
  if (screenerMaxPrice) screenerMaxPrice.value = '';
  if (screenerMinTradableFV) screenerMinTradableFV.value = '';
  if (screenerGuarantorOnly) screenerGuarantorOnly.checked = false;

  renderPresetChips();
  applyFilters();
}

export function applyFilters() {
  const f = getCurrentFilterState();

  filteredBonds = inventoryBonds.filter(b => {
    // 1. Text Search
    if (f.searchTerm) {
      const q = f.searchTerm.toLowerCase();
      const matchIssuer = (b.issuer || '').toLowerCase().includes(q);
      const matchIsin = (b.isin || '').toLowerCase().includes(q);
      const matchSector = (b.sector || '').toLowerCase().includes(q);
      const matchParent = (resolveBondEntity(b).canonicalEntityName || '').toLowerCase().includes(q);
      if (!matchIssuer && !matchIsin && !matchSector && !matchParent) return false;
    }

    // 2. Yield Range (YTM)
    const yieldPct = b.yield * 100;
    if (f.minYield !== undefined && yieldPct < f.minYield) return false;
    if (f.maxYield !== undefined && yieldPct > f.maxYield) return false;

    // 3. Coupon Range (%)
    const couponPct = b.coupon ? b.coupon * 100 : 0;
    if (f.minCoupon !== undefined && couponPct < f.minCoupon) return false;
    if (f.maxCoupon !== undefined && couponPct > f.maxCoupon) return false;

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

    // 6. Forensic & Governance Risk Filter
    if (f.governanceRisk) {
      const entity = resolveBondEntity(b);
      if (f.governanceRisk === 'EXCLUDE_CRITICAL_HIGH') {
        if (entity.riskSeverity === 'CRITICAL' || entity.riskSeverity === 'HIGH') return false;
      } else if (f.governanceRisk === 'CLEAN_ONLY') {
        if (entity.governanceScore < 80 && entity.riskSeverity !== 'CLEAN') return false;
      } else if (f.governanceRisk === 'CRITICAL_HIGH_ONLY') {
        if (entity.riskSeverity !== 'CRITICAL' && entity.riskSeverity !== 'HIGH') return false;
      }
    }

    // 7. Fundamental SWOT Profile Filter
    if (f.swotProfile) {
      const swot = getBusinessSwot(b.isin || b.issuer);
      if (f.swotProfile === 'high_crar') {
        if (!swot || !swot.financialMetrics.crar || swot.financialMetrics.crar < 20) return false;
      } else if (f.swotProfile === 'low_npa') {
        if (!swot || swot.financialMetrics.gnpa === undefined || swot.financialMetrics.gnpa >= 3.0) return false;
      } else if (f.swotProfile === 'institutional') {
        const r = b.rating.toUpperCase();
        if (!r.includes('AAA') && !r.includes('SOVEREIGN') && !r.includes('GOI')) return false;
      }
    }

    
    // 7.5. 5 Cs Credit Framework & Coverage Filter
    if (f.fiveCsProfile) {
      const credit = getCreditCoverageRecord(b.isin || b.issuer);
      if (f.fiveCsProfile === 'prime_5c') {
        if (!credit || credit.compositeCreditScore < 80) return false;
      } else if (f.fiveCsProfile === 'high_iscr') {
        if (!credit || credit.quantitativeCoverage.iscr < 2.5) return false;
      } else if (f.fiveCsProfile === 'high_dscr') {
        if (!credit || credit.quantitativeCoverage.dscr < 1.4) return false;
      } else if (f.fiveCsProfile === 'high_ocf_debt') {
        if (!credit || credit.quantitativeCoverage.ocfToDebtPercent < 15.0) return false;
      } else if (f.fiveCsProfile === 'high_collateral') {
        if (!credit || credit.fiveCs.collateral.score < 17) return false;
      }
    }

    // 8. Sector Filter
    if (f.sector && b.sector?.trim().toLowerCase() !== f.sector.trim().toLowerCase()) return false;

    // 9. Payment Frequency Filter
    if (f.frequency) {
      const freq = (b.frequency || '').toUpperCase();
      if (f.frequency === 'MONTHLY' && !freq.includes('MONTH')) return false;
      if (f.frequency === 'QUARTERLY' && !freq.includes('QUARTER')) return false;
      if (f.frequency === 'SEMI' && !freq.includes('SEMI') && !freq.includes('HALF') && !freq.includes('BI-ANNUAL')) return false;
      if (f.frequency === 'ANNUAL' && !freq.includes('ANNUAL') && !freq.includes('YEAR')) return false;
      if (f.frequency === 'ON_MATURITY' && !freq.includes('MATURITY') && !freq.includes('CUMULATIVE')) return false;
    }

    // 10. Max Unit Price Cap
    if (f.maxUnitPrice !== undefined) {
      const uPrice = getUnitPrice(b);
      if (uPrice > f.maxUnitPrice) return false;
    }

    // 11. Min Tradable FV
    if (f.minTradableFV !== undefined) {
      const fv = b.totalTradableFV || 0;
      if (fv < f.minTradableFV) return false;
    }

    // 12. Guarantor Only
    if (f.guarantorOnly && (!b.guarantor || !b.guarantor.trim())) return false;

    return true;
  });

  filteredBonds.sort((a, b) => {
    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortColumn) {
      case 'issuer': valA = a.issuer; valB = b.issuer; break;
      case 'isin': valA = a.isin; valB = b.isin; break;
      case 'rating': valA = a.rating; valB = b.rating; break;
      case 'governance': {
        const entA = resolveBondEntity(a);
        const entB = resolveBondEntity(b);
        valA = entA.governanceScore;
        valB = entB.governanceScore;
        break;
      }
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
  if (f.governanceRisk) activeChips.push({ label: `Governance: ${f.governanceRisk.replace(/_/g, ' ')}`, clear: () => { if (screenerGovernance) screenerGovernance.value = ''; } });
  if (f.swotProfile) activeChips.push({ label: `SWOT: ${f.swotProfile.replace(/_/g, ' ')}`, clear: () => { if (screenerSwot) screenerSwot.value = ''; } });
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
    screenerTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 3rem; color: var(--text-secondary);">No bonds match your active screening criteria. Try adjusting or clearing your filters.</td></tr>`;
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

    const entityInfo = resolveBondEntity(b);
    const swotRecord = getBusinessSwot(b.isin || b.issuer);

    let govBadgeColor = '#10b981';
    let govBg = 'rgba(16, 185, 129, 0.15)';
    if (entityInfo.riskSeverity === 'CRITICAL') {
      govBadgeColor = '#ef4444';
      govBg = 'rgba(239, 68, 68, 0.2)';
    } else if (entityInfo.riskSeverity === 'HIGH') {
      govBadgeColor = '#f59e0b';
      govBg = 'rgba(245, 158, 11, 0.2)';
    } else if (entityInfo.riskSeverity === 'MODERATE') {
      govBadgeColor = '#38bdf8';
      govBg = 'rgba(56, 189, 248, 0.15)';
    }

    tr.innerHTML = `
      <td style="padding: 0.75rem; font-weight: 600; cursor: pointer;" class="bond-name-cell" title="Click to view detailed insights">
        <div style="color: #fff; font-size: 0.88rem;">${b.issuer}</div>
        <div style="display: flex; gap: 0.35rem; align-items: center; margin-top: 2px; flex-wrap: wrap;">
          <span style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 500;">${b.sector || 'Corporate'}</span>
          ${swotRecord?.financialMetrics.crar ? `<span style="font-size: 0.68rem; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 1px 4px; border-radius: 3px;">CRAR: ${swotRecord.financialMetrics.crar}%</span>` : ''}
        </div>
      </td>
      <td style="padding: 0.75rem; font-family: monospace; color: var(--text-secondary); font-size: 0.82rem;">${b.isin}</td>
      <td style="padding: 0.75rem;">
        <span style="background: rgba(255,255,255,0.08); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${b.rating}</span>
        ${swotRecord ? `
          <a href="${swotRecord.sourceUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.65rem; color: #34d399; margin-left: 3px; text-decoration: none;" title="Verified Rating Rationale">↗</a>
        ` : ''}
      </td>
      <td style="padding: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <span style="background: ${govBg}; color: ${govBadgeColor}; font-weight: 700; font-size: 0.78rem; padding: 0.18rem 0.45rem; border-radius: 4px; border: 1px solid ${govBadgeColor}40;">
            ${entityInfo.governanceScore}/100
          </span>
          <span style="font-size: 0.68rem; color: ${govBadgeColor}; font-weight: 600;">${entityInfo.riskSeverity}</span>
        </div>
        ${entityInfo.canonicalEntityName ? `
          <button class="screener-promoter-btn" data-group="${entityInfo.canonicalEntityName}" style="background: rgba(99,102,241,0.12); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.25); border-radius: 3px; font-size: 0.68rem; padding: 1px 5px; margin-top: 3px; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
            <span>👤 ${entityInfo.canonicalEntityName}</span>
          </button>
        ` : ''}
      </td>
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
        <button class="screener-fivecs-btn" data-isin="${b.isin}" title="5 Cs Credit Scorecard & Coverage Ratios" style="border-radius: 6px; padding: 0.3rem 0.5rem; font-size: 0.75rem; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); cursor: pointer; margin-right: 0.35rem;">
          🏛️ 5C
        </button>
        <button class="audit-row-btn" data-isin="${b.isin}" title="Inspect Forensic Intelligence & Regulatory Records" style="border-radius: 6px; padding: 0.3rem 0.55rem; font-size: 0.75rem; font-weight: 600; background: rgba(212, 175, 55, 0.15); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.35); cursor: pointer; margin-right: 0.35rem;">
          ⚖️ Audit
        </button>
        <button class="force-add-btn" data-issuer="${b.issuer}" style="border-radius: 6px; padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 600; ${isForced ? 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);' : 'background: rgba(255,255,255,0.08); color: var(--text-primary); border: 1px solid var(--border-glass); cursor: pointer;'}">
          ${isForced ? '✓ Added' : '+ Include'}
        </button>
        <button class="exclude-btn" data-issuer="${b.issuer}" style="border-radius: 6px; padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.35rem; ${isExcluded ? 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);' : 'background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); cursor: pointer;'}">
          ${isExcluded ? '✕ Banned' : 'Exclude'}
        </button>
      </td>
    `;

    const nameCell = tr.querySelector('.bond-name-cell') as HTMLElement;
    if (nameCell) {
      nameCell.addEventListener('click', () => {
        openBondDetailModal(b);
      });
    }

    const promoterBtn = tr.querySelector('.screener-promoter-btn') as HTMLButtonElement;
    if (promoterBtn) {
      promoterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const group = promoterBtn.getAttribute('data-group') || b.issuer;
        openPromoterProfileModal(group);
      });
    }

    
    const fiveCsBtn = tr.querySelector('.screener-fivecs-btn') as HTMLButtonElement;
    if (fiveCsBtn) {
      fiveCsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCreditFiveCsModal(b.isin || b.issuer);
      });
    }

    const auditBtn = tr.querySelector('.audit-row-btn') as HTMLButtonElement;
    if (auditBtn) {
      auditBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const globalWin = window as unknown as { openPromoterAuditByIsin?: (isin: string) => void };
        if (typeof globalWin.openPromoterAuditByIsin === 'function') {
          globalWin.openPromoterAuditByIsin(b.isin);
        }
      });
    }

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
    tr.innerHTML = `<td colspan="10" style="text-align: center; padding: 1rem; color: var(--text-secondary); font-size: 0.85rem;">Showing first 500 results of ${filteredBonds.length}. Use filters above to narrow your query.</td>`;
    screenerTableBody.appendChild(tr);
  }
}

function exportFilteredToCSV() {
  if (filteredBonds.length === 0) {
    alert('No bonds to export in current filter view.');
    return;
  }

  const headers = ['Issuer', 'ISIN', 'Rating', 'Governance Score', 'Governance Risk', 'Parent Group', 'Coupon (%)', 'Yield (YTM %)', 'Frequency', 'Tenure (Months)', 'Maturity', 'Unit Price (₹)', 'Tradable FV (₹)', 'Sector', 'Guarantor'];
  const rows = filteredBonds.map(b => {
    const entity = resolveBondEntity(b);
    return [
      `"${(b.issuer || '').replace(/"/g, '""')}"`,
      `"${b.isin}"`,
      `"${b.rating}"`,
      entity.governanceScore,
      `"${entity.riskSeverity}"`,
      `"${(entity.canonicalEntityName || '').replace(/"/g, '""')}"`,
      b.coupon ? (b.coupon * 100).toFixed(2) : 0,
      (b.yield * 100).toFixed(2),
      `"${b.frequency || 'ON MATURITY'}"`,
      b.months.toFixed(1),
      `"${b.maturity}"`,
      getUnitPrice(b),
      b.totalTradableFV || 0,
      `"${(b.sector || '').replace(/"/g, '""')}"`,
      `"${(b.guarantor || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bond_Screening_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function setScreenerInventory(bonds: DefaultBond[]) {
  updateScreenerData(bonds);
}
