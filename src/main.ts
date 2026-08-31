import { Chart, registerables } from 'chart.js';
import './style.css';
import { DEFAULT_INVENTORY, DefaultBond } from './defaultInventory';
import { generateBondPortfolio, getUnitPrice, PortfolioSummary, getMaturityBuckets } from './bondEngine';
import { parseExcelInventory } from './excelParser';
import { getCompanyInsights } from './companyReference';
import { openBondDetailModal } from './bondDetailModal';
import { renderEliminatedSummaryBar } from './eliminatedBondsModal';
import * as XLSX from 'xlsx';
import { getCompanyOverrides } from './overridesManager';
import { initScreener, setScreenerInventory } from './screener';
import { initOverridesModal, openOverridesModal, updateOverridesBadge } from './overridesModal';
import { getEngineHyperparameters } from './engineSettingsManager';
import { initEngineSettingsModal, openEngineSettingsModal } from './engineSettingsModal';

Chart.register(...registerables);

// Application State
let activeInventory: DefaultBond[] = [...DEFAULT_INVENTORY];
const excludedIsins = new Set<string>();
const manualReplacements = new Map<number, string>();
(window as any).activeInventory = activeInventory;
(window as any).DEFAULT_INVENTORY = DEFAULT_INVENTORY;
(window as any).excludedIsins = excludedIsins;
const customAllocations = new Map<string, number>();
(window as any).customAllocations = customAllocations;
let isSharedMode = false;
let latestSummary: PortfolioSummary | null = null;

// Expose openBondDetailModal globally for dynamically injected HTML (like eliminated bonds)
(window as any).openBondDetailByIsin = (isin: string) => {
  const fullBond = activeInventory.find(b => b.isin === isin);
  if (fullBond) openBondDetailModal(fullBond);
};
(window as any).openOverridesModal = openOverridesModal;
(window as any).openEngineSettingsModal = openEngineSettingsModal;

let growthChartInstance: Chart | null = null;
let ladderChartInstance: Chart | null = null;
let ratingChartInstance: Chart | null = null;

// DOM Elements
const amountInput = document.getElementById('investment-amount') as HTMLInputElement;
const investorCategorySelect = document.getElementById('investor-category') as HTMLSelectElement;
const allocationStrategySelect = document.getElementById('allocation-strategy') as HTMLSelectElement;
const fdRatesContainer = document.getElementById('fd-rates-table-container') as HTMLDivElement;
const toggleFdRatesBtn = document.getElementById('toggle-fd-rates') as HTMLDivElement;
const fdToggleIcon = document.getElementById('fd-toggle-icon') as HTMLSpanElement;

const fdInputs = {
  t1: document.getElementById('fd-t1') as HTMLInputElement,
  t2: document.getElementById('fd-t2') as HTMLInputElement,
  t3: document.getElementById('fd-t3') as HTMLInputElement,
  t4: document.getElementById('fd-t4') as HTMLInputElement,
  t5: document.getElementById('fd-t5') as HTMLInputElement,
  t6: document.getElementById('fd-t6') as HTMLInputElement,
  t7: document.getElementById('fd-t7') as HTMLInputElement
};

const minRatingSelect = document.getElementById('min-rating') as HTMLSelectElement;
const targetYieldInput = document.getElementById('target-yield') as HTMLInputElement;
const targetQuarterlyCashflowInput = document.getElementById('target-quarterly-cashflow') as HTMLInputElement;
const numIssuersInput = document.getElementById('num-issuers') as HTMLInputElement;
const minTenureInput = document.getElementById('min-tenure') as HTMLInputElement;
const maxTenureInput = document.getElementById('max-tenure') as HTMLInputElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileStatus = document.getElementById('file-status') as HTMLParagraphElement;
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const exportPdfBtn = document.getElementById('export-pdf') as HTMLButtonElement;
const exportExcelBtn = document.getElementById('export-excel') as HTMLButtonElement;
const shareProposalBtn = document.getElementById('share-proposal') as HTMLButtonElement;
const sharedBanner = document.getElementById('shared-banner') as HTMLDivElement;

const quarterlyTableBody = document.getElementById('quarterly-table-body') as HTMLTableSectionElement;
const quarterlyTargetBadge = document.getElementById('quarterly-target-badge') as HTMLDivElement;

// Category defaults
const CATEGORY_DEFAULTS = {
  general: { t1: 2.75, t2: 4.25, t3: 5.75, t4: 6.25, t5: 6.45, t6: 6.50, t7: 6.50 },
  senior: { t1: 3.25, t2: 4.75, t3: 6.25, t4: 6.75, t5: 6.95, t6: 7.10, t7: 7.00 }
};

// KPI Elements
const kpiAlpha = document.getElementById('kpi-alpha') as HTMLDivElement;
const kpiAlphaPct = document.getElementById('kpi-alpha-pct') as HTMLSpanElement;
const kpiYield = document.getElementById('kpi-yield') as HTMLDivElement;
const kpiYieldVsFd = document.getElementById('kpi-yield-vs-fd') as HTMLSpanElement;
const kpiBonds = document.getElementById('kpi-bonds') as HTMLDivElement;

// Table & Summary Elements
const tableBody = document.getElementById('portfolio-table-body') as HTMLTableSectionElement;
const eliminatedSummaryContainer = document.getElementById('eliminated-summary-container') as HTMLDivElement;
const cashflowTableBody = document.getElementById('cashflow-table-body') as HTMLTableSectionElement;
const maturityScheduleSummary = document.getElementById('maturity-schedule-summary') as HTMLDivElement;
const companyAllocationsList = document.getElementById('company-allocations-list') as HTMLDivElement;
const investmentHelper = document.getElementById('investment-helper') as HTMLDivElement;

// Currency Formatter (INR format)
const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

function getFdRateConfig() {
  return {
    t1: parseFloat(fdInputs.t1.value) || 2.75,
    t2: parseFloat(fdInputs.t2.value) || 4.25,
    t3: parseFloat(fdInputs.t3.value) || 5.75,
    t4: parseFloat(fdInputs.t4.value) || 6.25,
    t5: parseFloat(fdInputs.t5.value) || 6.45,
    t6: parseFloat(fdInputs.t6.value) || 6.50,
    t7: parseFloat(fdInputs.t7.value) || 6.50
  };
}

function formatIndianWording(val: number): string {
  if (isNaN(val) || val <= 0) return '₹0';
  const lakhs = val / 100000;
  const crores = val / 10000000;

  const numFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  });

  const formattedNum = numFormatter.format(val);

  if (crores >= 1) {
    return `₹${formattedNum} (${crores.toFixed(2)} Crores)`;
  } else if (lakhs >= 1) {
    return `₹${formattedNum} (${lakhs.toFixed(2)} Lakhs)`;
  }
  return `₹${formattedNum}`;
}

// Calculate and render dashboard
function updateDashboard() {
  const amount = parseFloat(amountInput.value) || 1000000;
  investmentHelper.textContent = formatIndianWording(amount);
  
  const minRating = minRatingSelect.value as 'A' | 'BBB-' | 'ALL';
  
  const targetYieldVal = parseFloat(targetYieldInput.value);
  const targetYield = isNaN(targetYieldVal) ? undefined : targetYieldVal;
  const numIssuers = parseInt(numIssuersInput.value) || 10;

  const minTenure = parseInt(minTenureInput.value) || 7;
  const maxTenure = parseInt(maxTenureInput.value) || 24;
  const strategy = (allocationStrategySelect.value as 'equal' | 'smart') || 'equal';

  const targetQuarterlyVal = parseFloat(targetQuarterlyCashflowInput.value);
  const targetQuarterlyCashflowPct = isNaN(targetQuarterlyVal) ? undefined : targetQuarterlyVal;
  
  const relaxBBBCap = (document.getElementById('relax-bbb-cap') as HTMLInputElement).checked;

  const summary = generateBondPortfolio(
    activeInventory, amount, getFdRateConfig(), minRating, targetYield, numIssuers,
    excludedIsins, manualReplacements, minTenure, maxTenure, strategy, customAllocations,
    targetQuarterlyCashflowPct, relaxBBBCap, getCompanyOverrides(), getEngineHyperparameters()
  );
  latestSummary = summary;
  renderKPIs(summary);
  renderTable(summary);
  renderMaturitySummary(summary);
  renderCompanyAllocations(summary);
  renderCashFlowTable(summary);
  renderQuarterlyTable(summary);
  renderCharts(summary);
  // Show the screening transparency bar above the portfolio table
  renderEliminatedSummaryBar(summary.eliminatedBonds, activeInventory.length, eliminatedSummaryContainer);
  updateOverridesBadge();
}

function renderQuarterlyTable(summary: PortfolioSummary) {
  if (!quarterlyTableBody || !quarterlyTargetBadge) return;
  quarterlyTableBody.innerHTML = '';

  const qAnalysis = summary.quarterlyCashflow;
  if (!qAnalysis || qAnalysis.items.length === 0) {
    quarterlyTargetBadge.style.background = 'rgba(255, 255, 255, 0.05)';
    quarterlyTargetBadge.style.color = 'var(--text-secondary)';
    quarterlyTargetBadge.style.borderColor = 'var(--border-glass)';
    quarterlyTargetBadge.innerHTML = 'Target: Not Set (Enter % in sidebar)';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="8" style="padding: 2rem; text-align: center; color: var(--text-secondary); font-style: italic;">
        Enter a <strong>Target Quarterly Cashflow (%)</strong> in the sidebar controls (e.g., 5.0%) to track quarterly cashflow requirements.
      </td>
    `;
    quarterlyTableBody.appendChild(tr);
    return;
  }

  const isAllMet = qAnalysis.quartersMet === qAnalysis.totalQuarters;
  quarterlyTargetBadge.style.background = isAllMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  quarterlyTargetBadge.style.color = isAllMet ? '#10b981' : '#ef4444';
  quarterlyTargetBadge.style.borderColor = isAllMet ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
  quarterlyTargetBadge.innerHTML = `${qAnalysis.targetPercent.toFixed(1)}%/Quarter Target (${formatCurrency(qAnalysis.requiredPerQuarter)}) — ${qAnalysis.quartersMet}/${qAnalysis.totalQuarters} Quarters Met`;

  qAnalysis.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-glass)';

    const statusBadge = item.isMet
      ? `<span class="trend-badge improving" style="font-weight: 700; padding: 0.25rem 0.6rem;">✓ Met</span>`
      : `<span class="trend-badge deteriorating" style="font-weight: 700; padding: 0.25rem 0.6rem;">✕ Shortfall</span>`;

    const diffColor = item.surplusDeficit >= 0 ? 'var(--accent-green)' : '#ef4444';
    const diffSign = item.surplusDeficit >= 0 ? '+' : '';

    // Break down actual cashflow into coupon income vs principal returns for this quarter
    const minM = (item.quarter - 1) * 3 + 1;
    const maxM = item.quarter * 3;
    const quarterEvents = summary.periodicCashFlows.filter(cf => cf.month >= minM && cf.month <= maxM);
    const couponIncome = quarterEvents.reduce((s, cf) => s + cf.coupon, 0);
    const principalReturned = quarterEvents.reduce((s, cf) => s + cf.principal, 0);

    // Breakdown tooltip string
    const breakdownParts: string[] = [];
    if (couponIncome > 0) breakdownParts.push(`Coupons: ${formatCurrency(Math.round(couponIncome))}`);
    if (principalReturned > 0) breakdownParts.push(`Principal: ${formatCurrency(Math.round(principalReturned))}`);
    const breakdownHtml = breakdownParts.length > 0
      ? `<span style="display: block; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">${breakdownParts.join(' + ')}</span>`
      : '';

    tr.innerHTML = `
      <td style="padding: 0.85rem 1rem; font-weight: 700; color: var(--accent-gold);">Q${item.quarter}</td>
      <td style="padding: 0.85rem 1rem; color: var(--text-secondary); font-size: 0.85rem;">${item.monthsRange}</td>
      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 600; color: var(--text-primary);">${formatCurrency(item.targetCashflow)}</td>
      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 700; color: var(--accent-green);">
        ${formatCurrency(Math.round(item.actualCashflow))}
        ${breakdownHtml}
      </td>
      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 700;">${item.coveragePercent.toFixed(1)}%</td>
      <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 700; color: ${diffColor};">${diffSign}${formatCurrency(Math.round(item.surplusDeficit))}</td>
      <td style="padding: 0.85rem 1rem; text-align: center;">${statusBadge}</td>
    `;
    quarterlyTableBody.appendChild(tr);
  });
}


function renderCashFlowTable(summary: PortfolioSummary) {
  cashflowTableBody.innerHTML = '';

  // Use periodicCashFlows for the schedule tab — it shows individual coupon events
  summary.periodicCashFlows.forEach(cf => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-glass)';

    // Find the bond details for this ISIN
    const bond = summary.selectedBonds.find(b => b.isin === cf.isin);
    const maturityDate = bond ? bond.maturity : '-';

    tr.innerHTML = `
      <td style="padding: 1rem;">Month ${cf.month}</td>
      <td style="padding: 1rem; color: var(--text-secondary);">${maturityDate}</td>
      <td style="padding: 1rem; font-family: monospace; font-weight: 500; color: var(--accent-gold);">${cf.isin}</td>
      <td style="padding: 1rem; font-weight: 500;">${cf.issuer}</td>
      <td style="padding: 1rem; text-align: right; color: var(--text-primary); font-weight: 600;">${cf.principal > 0 ? formatCurrency(cf.principal) : '—'}</td>
      <td style="padding: 1rem; text-align: right; color: var(--accent-green); font-weight: 600;">+${formatCurrency(Math.round(cf.coupon))}</td>
      <td style="padding: 1rem; text-align: right; color: var(--text-primary); font-weight: 700;">${formatCurrency(Math.round(cf.total))}</td>
    `;
    
    tr.style.cursor = 'pointer';
    tr.title = 'Click to view full bond details';
    tr.addEventListener('mouseenter', () => { tr.style.background = 'rgba(255,255,255,0.04)'; });
    tr.addEventListener('mouseleave', () => { tr.style.background = ''; });
    tr.addEventListener('click', () => {
      (window as any).openBondDetailByIsin(cf.isin);
    });

    cashflowTableBody.appendChild(tr);
  });
}


function renderKPIs(summary: PortfolioSummary) {
  kpiAlpha.textContent = formatCurrency(summary.extraReturn);
  kpiAlphaPct.textContent = `+${((summary.portfolioYield - summary.fdRate) * 100).toFixed(2)}% extra pre-tax yield vs FD`;
  
  kpiYield.textContent = `${(summary.portfolioYield * 100).toFixed(2)}%`;
  kpiYieldVsFd.textContent = `vs ${(summary.fdRate * 100).toFixed(2)}% FD interest rate`;
  
  kpiBonds.textContent = `${summary.selectedBonds.length} Selected Bonds`;

  // Update detailed table in Tab 2 Comparison
  const detailInvestment = document.getElementById('detail-investment');
  const detailBondYield = document.getElementById('detail-bond-yield');
  const detailFdYield = document.getElementById('detail-fd-yield');
  const detailBondReturn = document.getElementById('detail-bond-return');
  const detailFdReturn = document.getElementById('detail-fd-return');
  const detailAlphaVal = document.getElementById('detail-alpha-val');

  if (detailInvestment) detailInvestment.textContent = formatCurrency(summary.totalInvestment);
  if (detailBondYield) detailBondYield.textContent = `${(summary.portfolioYield * 100).toFixed(2)}%`;
  if (detailFdYield) detailFdYield.textContent = `${(summary.fdRate * 100).toFixed(2)}%`;
  
  // Calculate actual total return over the tenures
  const totalBondMaturityInterest = summary.selectedBonds.reduce((sum, b) => sum + (b.allocatedAmount * b.yield * (b.months / 12)), 0);
  const totalFDMaturityInterest = summary.selectedBonds.reduce((sum, b) => sum + (b.allocatedAmount * (b.fdRate || 0) * (b.months / 12)), 0);

  if (detailBondReturn) detailBondReturn.textContent = formatCurrency(totalBondMaturityInterest);
  if (detailFdReturn) detailFdReturn.textContent = formatCurrency(totalFDMaturityInterest);
  if (detailAlphaVal) detailAlphaVal.textContent = formatCurrency(summary.extraReturn);
}

// Table Column Sorting State
type SortColumn = 'isin' | 'issuer' | 'sector' | 'guarantor' | 'rating' | 'ratingTrend' | 'maturity' | 'months' | 'yield' | 'allocatedAmount';
let currentSortColumn: SortColumn = 'months';
let currentSortAsc = true;

function renderTable(summary: PortfolioSummary) {
  tableBody.innerHTML = '';
  
  // Hide Actions column header if in shared mode
  const actionsHeader = document.querySelector('#portfolio-table-headers th:last-child') as HTMLElement;
  if (actionsHeader) {
    actionsHeader.style.display = isSharedMode ? 'none' : '';
  }

  // Helper score for rating sorting
  const getRatingScore = (rating: string): number => {
    let r = rating.toUpperCase().replace(/\(CE\)/g, '').trim();
    const agencies = ['CRISIL', 'ICRA', 'CARE', 'IND', 'ACUITE', 'FITCH'];
    for (const agency of agencies) {
      if (r.startsWith(agency)) {
        r = r.substring(agency.length).trim();
      }
    }
    if (r.includes('SOVEREIGN') || r.includes('GOI')) return 1000;
    if (r === 'AAA') return 900;
    if (r === 'AA+') return 850;
    if (r === 'AA') return 800;
    if (r === 'AA-') return 750;
    if (r === 'A+') return 700;
    if (r === 'A') return 650;
    if (r === 'A-') return 600;
    if (r === 'BBB+') return 550;
    if (r === 'BBB') return 500;
    if (r === 'BBB-') return 450;
    return 100;
  };

  // Sort selected bonds based on active column & direction
  const bonds = [...summary.selectedBonds].sort((a, b) => {
    let valA: any = (a as any)[currentSortColumn] ?? '';
    let valB: any = (b as any)[currentSortColumn] ?? '';

    if (currentSortColumn === 'rating') {
      valA = getRatingScore(a.rating);
      valB = getRatingScore(b.rating);
    } else if (currentSortColumn === 'maturity') {
      valA = new Date(a.maturity).getTime();
      valB = new Date(b.maturity).getTime();
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return currentSortAsc ? -1 : 1;
    if (valA > valB) return currentSortAsc ? 1 : -1;
    return 0;
  });

  // Update table header UI (sort icons & active class)
  document.querySelectorAll('#portfolio-table-headers th.sortable').forEach(th => {
    const col = th.getAttribute('data-sort') as SortColumn;
    const icon = th.querySelector('.sort-icon') as HTMLElement;
    if (col === currentSortColumn) {
      th.classList.add('active');
      if (icon) icon.textContent = currentSortAsc ? '▲' : '▼';
    } else {
      th.classList.remove('active');
      if (icon) icon.textContent = '↕';
    }
  });

  // Calculate min and max yield across selected bonds for Excel-style green gradient scale
  const yields = bonds.map(b => b.yield);
  const minYield = Math.min(...yields);
  const maxYield = Math.max(...yields);

  bonds.forEach(bond => {
    const tr = document.createElement('tr');
    
    // Rating class selection
    let ratingClass = 'unrated';
    const cleanRatingSymbol = (rating: string): string => {
      let r = rating.toUpperCase().replace(/\(CE\)/g, '').trim();
      const agencies = ['CRISIL', 'ICRA', 'CARE', 'IND', 'ACUITE', 'FITCH'];
      for (const agency of agencies) {
        if (r.startsWith(agency)) {
          r = r.substring(agency.length).trim();
        }
      }
      return r;
    };
    
    const symbol = cleanRatingSymbol(bond.rating);
    if (symbol.includes('SOVEREIGN') || symbol.includes('GOI')) {
      ratingClass = 'sovereign';
    } else if (symbol === 'AAA') {
      ratingClass = 'aaa';
    } else if (symbol.startsWith('AA')) {
      ratingClass = 'aa';
    } else if (symbol.startsWith('A')) {
      ratingClass = 'a';
    } else if (symbol.startsWith('BBB')) {
      ratingClass = 'bbb';
    }

    // Guarantor & Insights formatting
    const insights = getCompanyInsights(bond);
    const guarantorDisplay = bond.guarantor ? `<strong>${bond.guarantor}</strong>` : `<span style="color: var(--text-secondary); font-style: italic;">Self Guaranteed</span>`;
    const sectorDisplay = insights.sector;
    const effectiveTrend = bond.ratingTrend || insights.ratingTrend;
    
    let trendBadgeHtml = `<span class="trend-badge stable">● Stable</span>`;
    if (effectiveTrend === 'improving') {
      trendBadgeHtml = `<span class="trend-badge improving">▲ Improving</span>`;
    } else if (effectiveTrend === 'deteriorating') {
      trendBadgeHtml = `<span class="trend-badge deteriorating">▼ Deteriorating</span>`;
    }

    // Excel-style green gradient calculation (ratio from 0 = min yield to 1 = max yield)
    const yieldRatio = maxYield > minYield ? (bond.yield - minYield) / (maxYield - minYield) : 1;
    // HSL green hue scale: 120 is pure green. Saturation: 70%, Lightness: scales from 15% (subtle dark green for min) to 38% (vibrant rich green for max)
    // Alpha: scales from 0.15 to 0.45 for pill background
    const bgAlpha = 0.15 + (yieldRatio * 0.30);
    const borderColor = `rgba(16, 185, 129, ${0.3 + yieldRatio * 0.5})`;
    const textColor = yieldRatio > 0.6 ? '#6ee7b7' : '#34d399';

    tr.innerHTML = `
      <td><span style="font-family: monospace; font-size: 0.85rem;">${bond.isin}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <strong>${bond.issuer}</strong>
          ${bond.overrideJustification ? `<span title="Force Included: ${bond.overrideJustification.replace(/"/g, '&quot;')}" style="cursor: help; background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700;">OVERRIDE</span>` : ''}
        </div>
      </td>
      <td><span style="font-size: 0.82rem; color: var(--accent-gold); font-weight: 500;">${sectorDisplay}</span></td>
      <td>${guarantorDisplay}</td>
      <td><span class="rating-badge ${ratingClass}">${bond.rating}</span></td>
      <td>${trendBadgeHtml}</td>
      <td>${bond.maturity}</td>
      <td>${bond.months}m</td>
      <td>
        <span style="display: inline-block; padding: 0.25rem 0.65rem; border-radius: 8px; font-weight: 700; background: rgba(16, 185, 129, ${bgAlpha}); border: 1px solid ${borderColor}; color: ${textColor}; box-shadow: 0 0 10px rgba(16, 185, 129, ${yieldRatio * 0.2}); font-size: 0.9rem;">
          ${(bond.yield * 100).toFixed(2)}%
        </span>
      </td>
      <td><strong>${formatCurrency(bond.allocatedAmount)}</strong></td>
      ${isSharedMode ? '' : `
      <td style="text-align: center;">
        <button class="btn swap-btn" data-isin="${bond.isin}" data-bucket="${bond.bucketIndex}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--accent-gold); color: #000; font-weight: 600; border-radius: 6px; cursor: pointer; outline: none; border: none; transition: transform 0.1s;">Swap</button>
      </td>
      `}
    `;
    // Make the row clickable — opens the full bond detail modal.
    // Look up the richer full bond object from activeInventory (has all Excel fields);
    // fall back to the summary bond data if not found (e.g. shared/demo mode).
    tr.style.cursor = 'pointer';
    tr.title = 'Click to view full bond details';
    tr.addEventListener('mouseenter', () => { tr.style.background = 'rgba(255,255,255,0.04)'; });
    tr.addEventListener('mouseleave', () => { tr.style.background = ''; });
    tr.addEventListener('click', (e) => {
      // Don't open modal if the click was on the Swap button
      if ((e.target as HTMLElement).closest('.swap-btn')) return;
      const fullBond = activeInventory.find(b => b.isin === bond.isin) ?? bond;
      openBondDetailModal(fullBond);
    });

    tableBody.appendChild(tr);
  });

  if (!isSharedMode) {
    // Bind click handlers to Swap buttons (stop propagation so row click doesn't also fire)
    const swapButtons = tableBody.querySelectorAll('.swap-btn');
    swapButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLButtonElement;
        const isin = target.getAttribute('data-isin') || '';
        const bucketIdx = parseInt(target.getAttribute('data-bucket') || '-1');
        openSwapModal(isin, bucketIdx, summary);
      });
    });
  }
}

function renderMaturitySummary(summary: PortfolioSummary) {
  maturityScheduleSummary.innerHTML = '';

  // Bucket visual timeline
  const buckets = [
    { name: '7-9 Months', count: 0, total: 0 },
    { name: '10-12 Months', count: 0, total: 0 },
    { name: '13-15 Months', count: 0, total: 0 },
    { name: '16-18 Months', count: 0, total: 0 },
    { name: '19-21 Months', count: 0, total: 0 },
    { name: '22-24 Months', count: 0, total: 0 }
  ];

  summary.selectedBonds.forEach(b => {
    if (b.bucketIndex >= 0 && b.bucketIndex < buckets.length) {
      buckets[b.bucketIndex].count++;
      buckets[b.bucketIndex].total += b.allocatedAmount;
    }
  });

  buckets.forEach((bucket, idx) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.padding = '0.5rem 0.75rem';
    div.style.background = 'rgba(255, 255, 255, 0.02)';
    div.style.borderRadius = '8px';
    div.style.borderLeft = `3px solid ${idx % 2 === 0 ? 'var(--accent-gold)' : 'var(--accent-blue)'}`;
    
    div.innerHTML = `
      <div>
        <div style="font-weight: 600; font-size: 0.9rem;">${bucket.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">${bucket.count} Bond(s) Maturing</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${formatCurrency(bucket.total)}</div>
        <div style="font-size: 0.75rem; color: var(--accent-green);">${((bucket.total / summary.totalInvestment) * 100).toFixed(0)}% allocation</div>
      </div>
    `;
    
    maturityScheduleSummary.appendChild(div);
  });
}

function renderCompanyAllocations(summary: PortfolioSummary) {
  companyAllocationsList.innerHTML = '';

  summary.companyAllocations.filter(alloc => alloc.amount > 0).forEach((alloc, idx) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '0.35rem';
    div.style.padding = '0.75rem 1rem';
    div.style.background = 'rgba(255, 255, 255, 0.02)';
    div.style.borderRadius = '10px';
    div.style.border = '1px solid var(--border-glass)';
    div.style.borderLeft = `4px solid ${idx % 2 === 0 ? 'var(--accent-gold)' : 'var(--accent-blue)'}`;

    const guarantorText = alloc.guarantor ? `Guarantor: <strong>${alloc.guarantor}</strong>` : `<span style="font-style: italic;">Self Guaranteed</span>`;
    const sectorVal = alloc.sector || 'Financial Services (NBFC)';

    let trendBadge = `<span class="trend-badge stable" style="font-size: 0.68rem; padding: 0.1rem 0.35rem;">● Stable</span>`;
    if (alloc.ratingTrend === 'improving') {
      trendBadge = `<span class="trend-badge improving" style="font-size: 0.68rem; padding: 0.1rem 0.35rem;">▲ Improving</span>`;
    } else if (alloc.ratingTrend === 'deteriorating') {
      trendBadge = `<span class="trend-badge deteriorating" style="font-size: 0.68rem; padding: 0.1rem 0.35rem;">▼ Deteriorating</span>`;
    }

    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <span style="font-weight: 700; font-size: 0.95rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">${alloc.company}</span>
        <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${formatCurrency(alloc.amount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary);">
        <span style="color: var(--accent-gold); font-weight: 500;">${sectorVal}</span>
        ${trendBadge}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.1rem;">
        <span>${guarantorText}</span>
        <span style="color: var(--accent-green); font-weight: 600;">${(alloc.percent * 100).toFixed(1)}% weight</span>
      </div>
    `;

    companyAllocationsList.appendChild(div);
  });
}

function renderCharts(summary: PortfolioSummary) {
  // 1. Growth comparison chart (Line)
  const growthCtx = (document.getElementById('growth-chart') as HTMLCanvasElement).getContext('2d');
  if (growthCtx) {
    if (growthChartInstance) growthChartInstance.destroy();
    
    const labels = Array.from({ length: 25 }, (_, i) => `${i}m`);
    const fdData = labels.map((_, i) => summary.totalInvestment * (1 + (summary.fdRate * i / 12)));
    const bondData = labels.map((_, i) => summary.totalInvestment * (1 + (summary.portfolioYield * i / 12)));

    growthChartInstance = new Chart(growthCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Diversified Bond Portfolio',
            data: bondData,
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            fill: true,
            tension: 0.2
          },
          {
            label: 'Fixed Deposit (FD)',
            data: fdData,
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f3f4f6', font: { family: 'Outfit' } }
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', callback: (value) => formatCurrency(Number(value)) }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#9ca3af' }
          }
        }
      }
    });
  }

  // 2. Maturity ladder stacked bar chart (Principal + Interest breakup)
  const ladderCtx = (document.getElementById('ladder-chart') as HTMLCanvasElement).getContext('2d');
  if (ladderCtx) {
    if (ladderChartInstance) ladderChartInstance.destroy();
    
    const bucketLabels = ['7-9m', '10-12m', '13-15m', '16-18m', '19-21m', '22-24m'];
    const bucketPrincipals = [0, 0, 0, 0, 0, 0];
    const bucketInterests = [0, 0, 0, 0, 0, 0];
    
    summary.selectedBonds.forEach(b => {
      if (b.bucketIndex >= 0 && b.bucketIndex < 6) {
        const principal = b.allocatedAmount;
        const interest = b.allocatedAmount * b.yield * (b.months / 12);
        bucketPrincipals[b.bucketIndex] += principal;
        bucketInterests[b.bucketIndex] += interest;
      }
    });

    ladderChartInstance = new Chart(ladderCtx, {
      type: 'bar',
      data: {
        labels: bucketLabels,
        datasets: [
          {
            label: 'Principal Returned',
            data: bucketPrincipals,
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
            borderRadius: 4
          },
          {
            label: 'Interest Generated',
            data: bucketInterests,
            backgroundColor: 'rgba(212, 175, 55, 0.85)',
            hoverBackgroundColor: 'rgba(212, 175, 55, 1)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#f3f4f6', font: { family: 'Outfit' } }
          }
        },
        scales: {
          y: {
            stacked: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#9ca3af', callback: (value) => formatCurrency(Number(value)) }
          },
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#9ca3af' }
          }
        }
      }
    });
  }

  // 3. Credit rating doughnut chart
  const ratingCtx = (document.getElementById('rating-chart') as HTMLCanvasElement).getContext('2d');
  if (ratingCtx) {
    if (ratingChartInstance) ratingChartInstance.destroy();
    
    const ratings = Object.keys(summary.ratingDistribution);
    const counts = Object.values(summary.ratingDistribution);

    ratingChartInstance = new Chart(ratingCtx, {
      type: 'doughnut',
      data: {
        labels: ratings,
        datasets: [
          {
            data: counts,
            backgroundColor: [
              '#34d399', // Sovereign
              '#d4af37', // AAA
              '#60a5fa', // AA
              '#f472b6', // A
              '#fb7185', // BBB
              '#a78bfa'  // Unrated
            ],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#f3f4f6', font: { family: 'Outfit' } }
          }
        }
      }
    });
  }
}

// Event Listeners
generateBtn.addEventListener('click', updateDashboard);
amountInput.addEventListener('input', updateDashboard);
minRatingSelect.addEventListener('change', updateDashboard);
targetYieldInput.addEventListener('input', updateDashboard);
numIssuersInput.addEventListener('input', updateDashboard);
minTenureInput.addEventListener('input', updateDashboard);
maxTenureInput.addEventListener('input', updateDashboard);

// Investor category select logic to switch defaults
investorCategorySelect.addEventListener('change', () => {
  const category = investorCategorySelect.value as 'general' | 'senior';
  const defaults = CATEGORY_DEFAULTS[category];
  fdInputs.t1.value = defaults.t1.toFixed(2);
  fdInputs.t2.value = defaults.t2.toFixed(2);
  fdInputs.t3.value = defaults.t3.toFixed(2);
  fdInputs.t4.value = defaults.t4.toFixed(2);
  fdInputs.t5.value = defaults.t5.toFixed(2);
  fdInputs.t6.value = defaults.t6.toFixed(2);
  fdInputs.t7.value = defaults.t7.toFixed(2);
  updateDashboard();
});

// Configure FD rates collapsible panel trigger
toggleFdRatesBtn.addEventListener('click', () => {
  const isCollapsed = fdRatesContainer.classList.toggle('collapsed');
  fdToggleIcon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
});

// Bind listeners to each input in the table to rebalance on change
Object.values(fdInputs).forEach(input => {
  input.addEventListener('input', updateDashboard);
});

// Export PDF functionality
exportPdfBtn.addEventListener('click', () => {
  window.print();
});

// Share Proposal functionality
shareProposalBtn.addEventListener('click', () => {
  if (!latestSummary) {
    alert('Please generate a portfolio first.');
    return;
  }

  // Create a clean, compact payload to serialise
  const payload = {
    i: latestSummary.totalInvestment,
    py: latestSummary.portfolioYield,
    fdr: latestSummary.fdRate,
    par: latestSummary.portfolioAnnualReturn,
    far: latestSummary.fdAnnualReturn,
    er: latestSummary.extraReturn,
    b: latestSummary.selectedBonds,
    cf: latestSummary.monthlyCashFlows,
    ca: latestSummary.companyAllocations,
    mnt: parseInt(minTenureInput.value) || 7,
    mxt: parseInt(maxTenureInput.value) || 24
  };

  try {
    const base64 = btoa(encodeURIComponent(JSON.stringify(payload)));
    const shareUrl = window.location.origin + window.location.pathname + '#share=' + base64;

    navigator.clipboard.writeText(shareUrl).then(() => {
      const originalText = shareProposalBtn.textContent;
      shareProposalBtn.textContent = '✓ Link Copied!';
      shareProposalBtn.style.background = 'rgba(16, 185, 129, 0.2)';
      shareProposalBtn.style.color = '#10b981';
      shareProposalBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';

      setTimeout(() => {
        shareProposalBtn.textContent = originalText;
        shareProposalBtn.style.background = '';
        shareProposalBtn.style.color = '';
        shareProposalBtn.style.borderColor = '';
      }, 3000);
    });
  } catch (err) {
    console.error('Sharing failed:', err);
    alert('Failed to generate share link.');
  }
});

// Yield Optimizer - Brute force best configuration
const optimizeYieldBtn = document.getElementById('optimize-yield-btn') as HTMLButtonElement;
const optimizerModal = document.getElementById('optimizer-modal') as HTMLDivElement;
const optimizerResultsBody = document.getElementById('optimizer-results-body') as HTMLTableSectionElement;
const optimizerModalClose = document.getElementById('optimizer-modal-close') as HTMLButtonElement;

interface OptimizerResult {
  numIssuers: number;
  maxTenure: number;
  yield: number;
  extraReturn: number;
  bondCount: number;
}

optimizeYieldBtn.addEventListener('click', () => {
  const amount = parseFloat(amountInput.value) || 1000000;
  const minRating = minRatingSelect.value as 'A' | 'BBB-' | 'ALL';
  const targetYieldVal = parseFloat(targetYieldInput.value);
  const targetYield = isNaN(targetYieldVal) ? undefined : targetYieldVal;
  const minTenure = parseInt(minTenureInput.value) || 7;
  const currentMaxTenure = parseInt(maxTenureInput.value) || 24;
  const currentIssuers = parseInt(numIssuersInput.value) || 10;
  const fdRates = getFdRateConfig();
  const varyMode = (document.getElementById('optimize-vary') as HTMLSelectElement).value;

  // Build sweep ranges based on vary mode: minIssuers acts as minimum count up to 25
  const minIssuers = Math.max(5, currentIssuers);
  const issuerSweep: number[] = [];
  for (let k = minIssuers; k <= 25; k++) {
    issuerSweep.push(k);
  }

  const issuerRange: number[] = varyMode === 'tenure'
    ? [currentIssuers]
    : issuerSweep;

  const tenureRange: number[] = [];
  if (varyMode === 'issuers') {
    tenureRange.push(currentMaxTenure);
  } else {
    for (let mt = minTenure + 3; mt <= 60; mt += 3) {
      tenureRange.push(mt);
    }
  }

  // Update modal title
  const modalTitle = document.getElementById('optimizer-modal-title') as HTMLElement;
  if (varyMode === 'tenure') {
    modalTitle.textContent = `🔍 Best Max Tenure (fixed ${currentIssuers} issuers)`;
  } else if (varyMode === 'issuers') {
    modalTitle.textContent = `🔍 Best No. of Issuers (fixed ${currentMaxTenure}m tenure)`;
  } else {
    modalTitle.textContent = '🔍 Yield Optimization Results';
  }

  const results: OptimizerResult[] = [];

  optimizeYieldBtn.textContent = '⏳ Scanning...';
  optimizeYieldBtn.disabled = true;

  // Use setTimeout to allow the UI to update before the blocking loop
  setTimeout(() => {
    for (const numIssuers of issuerRange) {
      for (const maxTenure of tenureRange) {
        try {
          const strategy = (allocationStrategySelect.value as 'equal' | 'smart') || 'equal';
          const summary = generateBondPortfolio(
            activeInventory, amount, fdRates, minRating,
            targetYield, numIssuers, excludedIsins, manualReplacements,
            minTenure, maxTenure, strategy, customAllocations
          );
          if (summary.selectedBonds.length > 0) {
            results.push({
              numIssuers,
              maxTenure,
              yield: summary.portfolioYield,
              extraReturn: summary.extraReturn,
              bondCount: summary.selectedBonds.length
            });
          }
        } catch {
          // Skip invalid combinations
        }
      }
    }

    // Sort by yield descending
    results.sort((a, b) => b.yield - a.yield);

    // Deduplicate
    const seen = new Set<string>();
    const uniqueResults = results.filter(r => {
      const key = `${r.numIssuers}-${r.maxTenure}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const topResults = uniqueResults.slice(0, 20);

    // Show/hide columns based on vary mode
    const headerRow = document.querySelector('#optimizer-modal thead tr') as HTMLTableRowElement;
    const issuersHeader = headerRow.children[1] as HTMLElement;
    const tenureHeader = headerRow.children[2] as HTMLElement;
    issuersHeader.style.display = varyMode === 'tenure' ? 'none' : '';
    tenureHeader.style.display = varyMode === 'issuers' ? 'none' : '';

    // Render results
    optimizerResultsBody.innerHTML = '';
    topResults.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
      if (idx === 0) {
        tr.style.background = 'rgba(212, 175, 55, 0.08)';
      }
      const hideIssuers = varyMode === 'tenure' ? 'display:none;' : '';
      const hideTenure = varyMode === 'issuers' ? 'display:none;' : '';
      tr.innerHTML = `
        <td style="padding: 0.5rem; font-weight: ${idx === 0 ? '700' : '400'};">${idx === 0 ? '🏆 1' : idx + 1}</td>
        <td style="padding: 0.5rem; ${hideIssuers}">${r.numIssuers}</td>
        <td style="padding: 0.5rem; ${hideTenure}">${r.maxTenure}m</td>
        <td style="padding: 0.5rem; color: var(--accent-green); font-weight: 600;">${(r.yield * 100).toFixed(2)}%</td>
        <td style="padding: 0.5rem; color: var(--accent-gold);">₹${r.extraReturn.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
        <td style="padding: 0.5rem;">
          <button class="btn apply-optimizer-btn" data-issuers="${r.numIssuers}" data-max-tenure="${r.maxTenure}" style="padding: 0.3rem 0.65rem; font-size: 0.75rem; background: var(--accent-green); color: #000; font-weight: 600; border-radius: 6px; border: none; cursor: pointer;">Apply</button>
        </td>
      `;
      optimizerResultsBody.appendChild(tr);
    });

    // Bind apply buttons
    optimizerResultsBody.querySelectorAll('.apply-optimizer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const issuers = target.getAttribute('data-issuers') || '10';
        const maxT = target.getAttribute('data-max-tenure') || '24';

        numIssuersInput.value = issuers;
        maxTenureInput.value = maxT;
        optimizerModal.style.display = 'none';
        updateDashboard();
      });
    });

    optimizerModal.style.display = 'flex';
    optimizeYieldBtn.textContent = '🔍 Find Best Yield';
    optimizeYieldBtn.disabled = false;
  }, 50);
});

optimizerModalClose.addEventListener('click', () => {
  optimizerModal.style.display = 'none';
});

// Export Excel functionality
exportExcelBtn.addEventListener('click', () => {
  const amount = parseFloat(amountInput.value) || 1000000;
  const minRating = minRatingSelect.value as 'A' | 'BBB-' | 'ALL';
  const targetYieldVal = parseFloat(targetYieldInput.value);
  const targetYield = isNaN(targetYieldVal) ? undefined : targetYieldVal;
  const numIssuers = parseInt(numIssuersInput.value) || 10;
  const summary = generateBondPortfolio(activeInventory, amount, getFdRateConfig(), minRating, targetYield, numIssuers);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Selected Bonds Allocation
  const bondSheetData = summary.selectedBonds.map(b => ({
    'ISIN': b.isin,
    'Issuer Name': b.issuer,
    'Credit Rating': b.rating,
    'Maturity Date': b.maturity,
    'Months to Maturity': b.months,
    'Yield (YTM)': `${(b.yield * 100).toFixed(2)}%`,
    'FD Benchmark Rate': b.fdRate ? `${(b.fdRate * 100).toFixed(2)}%` : '-',
    'Allocation %': `${(b.allocationPercent * 100).toFixed(2)}%`,
    'Invested Amount (INR)': b.allocatedAmount,
    'Expected Maturity Value (INR)': b.allocatedAmount + (b.allocatedAmount * b.yield * (b.months / 12))
  }));
  const wsBonds = XLSX.utils.json_to_sheet(bondSheetData);
  XLSX.utils.book_append_sheet(wb, wsBonds, "Portfolio Allocation");

  // Sheet 2: Return Comparison Summary
  const summarySheetData = [
    { 'Metric': 'Total Capital Invested', 'Value': summary.totalInvestment },
    { 'Metric': 'Portfolio Yield (YTM)', 'Value': `${(summary.portfolioYield * 100).toFixed(2)}%` },
    { 'Metric': 'Blended FD Interest Rate', 'Value': `${(summary.fdRate * 100).toFixed(2)}%` },
    { 'Metric': 'Bond Expected Annual Returns', 'Value': summary.portfolioAnnualReturn },
    { 'Metric': 'FD Expected Annual Returns', 'Value': summary.fdAnnualReturn },
    { 'Metric': 'Extra Pre-Tax Profit (Alpha) / Year', 'Value': summary.portfolioAnnualReturn - summary.fdAnnualReturn },
    { 'Metric': 'Total Extra Lifetime Profit (Alpha)', 'Value': summary.extraReturn }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Returns Comparison");

  // Sheet 3: Cash Flow Schedule
  const cashFlowSheetData = summary.monthlyCashFlows.map(cf => {
    const bond = summary.selectedBonds.find(b => b.isin === cf.isin);
    const maturityDate = bond ? bond.maturity : '-';
    return {
      'Maturity Month': `Month ${cf.month}`,
      'Redemption Date': maturityDate,
      'ISIN': cf.isin,
      'Issuer Name': cf.issuer,
      'Principal Returned (INR)': cf.principal,
      'Interest Earned (INR)': cf.interest,
      'Total Payout (INR)': cf.total
    };
  });
  const wsCashFlow = XLSX.utils.json_to_sheet(cashFlowSheetData);
  XLSX.utils.book_append_sheet(wb, wsCashFlow, "Cash Flow Schedule");

  XLSX.writeFile(wb, "Bond_Investment_Proposal_Plan.xlsx");
});

// File Upload Handlers
fileInput.addEventListener('change', async (e) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    try {
      fileStatus.textContent = '⏳ Parsing excel sheet...';
      fileStatus.style.color = 'var(--accent-gold)';
      
      const parsedBonds = await parseExcelInventory(file);
      
      if (parsedBonds.length === 0) {
        throw new Error('No valid bonds parsed from excel.');
      }

      // Reset overrides when a new file is loaded
      excludedIsins.clear();
      manualReplacements.clear();

      activeInventory = parsedBonds;
      (window as any).activeInventory = activeInventory;
      setScreenerInventory(activeInventory);
      fileStatus.textContent = `✓ Uploaded ${file.name} successfully (${parsedBonds.length} bonds parsed)`;
      fileStatus.style.color = 'var(--accent-green)';
      updateDashboard();
    } catch (err) {
      fileStatus.textContent = `✗ Error: ${(err as Error).message}`;
      fileStatus.style.color = 'var(--accent-gold)';
    }
  }
});

// Drag & drop styling hooks
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

// Run initial loading
window.addEventListener('DOMContentLoaded', () => {
  // Tab selection logic
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active classes from all tab buttons and panes
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked tab and show relevant tab pane
      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      const pane = document.getElementById(`tab-${targetTab}`);
      if (pane) pane.classList.add('active');
    });
  });

  // Bind Table Column Header Sort Listeners
  document.querySelectorAll('#portfolio-table-headers th.sortable').forEach(th => {
    th.addEventListener('click', (e) => {
      const col = (e.currentTarget as HTMLElement).getAttribute('data-sort') as SortColumn;
      if (col === currentSortColumn) {
        currentSortAsc = !currentSortAsc;
      } else {
        currentSortColumn = col;
        currentSortAsc = true;
      }
      if (latestSummary) {
        renderTable(latestSummary);
      }
    });
  });

  // Check if viewing shared proposal
  if (window.location.hash.startsWith('#share=')) {
    isSharedMode = true;
    document.body.classList.add('shared-mode');
    try {
      const base64 = window.location.hash.substring(7);
      const payload = JSON.parse(decodeURIComponent(atob(base64)));

      if (sharedBanner) sharedBanner.style.display = 'flex';
      
      const asidePanel = document.querySelector('aside.panel') as HTMLElement;
      if (asidePanel) asidePanel.style.display = 'none';
      
      if (shareProposalBtn) shareProposalBtn.style.display = 'none';

      if (minTenureInput && payload.mnt) minTenureInput.value = payload.mnt.toString();
      if (maxTenureInput && payload.mxt) maxTenureInput.value = payload.mxt.toString();

      // Reconstruct summary
      const ratingDistribution: Record<string, number> = {};
      if (Array.isArray(payload.b)) {
        payload.b.forEach((bond: any) => {
          ratingDistribution[bond.rating] = (ratingDistribution[bond.rating] || 0) + bond.allocatedAmount;
        });
      }

      const reconstructedSummary: PortfolioSummary = {
        totalInvestment: payload.i,
        portfolioYield: payload.py,
        fdRate: payload.fdr,
        portfolioAnnualReturn: payload.par,
        fdAnnualReturn: payload.far,
        extraReturn: payload.er,
        selectedBonds: payload.b,
        monthlyCashFlows: payload.cf,
        // periodicCashFlows is not stored in the share payload; default to empty for read-only shared views
        periodicCashFlows: [],
        companyAllocations: payload.ca,
        ratingDistribution: ratingDistribution,
        // Eliminated bonds are not stored in the share payload — shared view is read-only
        eliminatedBonds: []
      };

      latestSummary = reconstructedSummary;

      // Render shared state directly
      renderKPIs(reconstructedSummary);
      renderTable(reconstructedSummary);
      renderMaturitySummary(reconstructedSummary);
      renderCompanyAllocations(reconstructedSummary);
      renderCashFlowTable(reconstructedSummary);
      renderCharts(reconstructedSummary);
      return;
    } catch (e) {
      console.error('Failed to parse shared proposal:', e);
      alert('The shared proposal link appears to be invalid or corrupted.');
    }
  }

  updateDashboard();
});

// Sleek Customisation Swap Modal Logic
let currentSwappingIsin = '';
let currentSwappingBucketIndex = -1;

const swapModal = document.getElementById('swap-modal') as HTMLDivElement;
const swapModalTitle = document.getElementById('swap-modal-title') as HTMLHeadingElement;
const swapBondSelect = document.getElementById('swap-bond-select') as HTMLSelectElement;
const swapModalSave = document.getElementById('swap-modal-save') as HTMLButtonElement;
const swapModalSuggest = document.getElementById('swap-modal-suggest') as HTMLButtonElement;
const swapModalExclude = document.getElementById('swap-modal-exclude') as HTMLButtonElement;
const swapModalCancel = document.getElementById('swap-modal-cancel') as HTMLButtonElement;

function getCurrentBuckets() {
  const minTenure = parseInt(minTenureInput.value) || 7;
  const maxTenure = parseInt(maxTenureInput.value) || 24;
  const numIssuers = parseInt(numIssuersInput.value) || 10;
  return getMaturityBuckets(minTenure, maxTenure, numIssuers);
}

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

function openSwapModal(isin: string, bucketIdx: number, summary: PortfolioSummary) {
  currentSwappingIsin = isin;
  currentSwappingBucketIndex = bucketIdx;

  const currentBond = summary.selectedBonds.find(b => b.isin === isin);
  if (!currentBond) return;

  const currentBuckets = getCurrentBuckets();
  swapModalTitle.textContent = `Customise Holding (${currentBuckets[bucketIdx]?.name || 'Maturity Bucket'})`;
  swapModal.style.display = 'flex';

  // Render Structured Insights for Current Bond
  const swapInsightsContainer = document.getElementById('swap-modal-insights') as HTMLDivElement;
  if (swapInsightsContainer) {
    const insights = getCompanyInsights(currentBond);
    const sectorVal = insights.sector;
    const guarantorVal = currentBond.guarantor ? `${currentBond.guarantor} (${currentBond.guarantorRating || 'Rated'})` : 'Self Guaranteed';
    const effectiveTrend = currentBond.ratingTrend || insights.ratingTrend;
    const trendText = effectiveTrend === 'improving' ? '▲ Improving' : effectiveTrend === 'deteriorating' ? '▼ Deteriorating' : '● Stable';
    const trendColor = effectiveTrend === 'improving' ? '#10b981' : effectiveTrend === 'deteriorating' ? '#ef4444' : '#3b82f6';
    const noteText = currentBond.ratingOutlookNote || insights.insightNote || 'Credit profile backed by operational history and active monitoring.';

    swapInsightsContainer.style.cursor = 'pointer';
    swapInsightsContainer.title = 'Click to view full bond details';
    swapInsightsContainer.onclick = () => (window as any).openBondDetailByIsin(currentBond.isin);
    swapInsightsContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-weight: 700; font-size: 1.05rem; color: var(--text-primary);">${currentBond.issuer}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); font-family: monospace;">ISIN: ${currentBond.isin}</div>
        </div>
        <span style="font-size: 0.8rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; background: rgba(255,255,255,0.08); color: ${trendColor}; border: 1px solid ${trendColor}40;">
          ${trendText}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 0.4rem; font-size: 0.82rem;">
        <div style="background: rgba(255, 255, 255, 0.02); padding: 0.55rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
          <span style="color: var(--text-secondary); display: block; font-size: 0.75rem;">Sector / Industry</span>
          <strong style="color: var(--accent-gold); line-height: 1.25; display: block; margin-top: 0.15rem;">${sectorVal}</strong>
        </div>
        <div style="background: rgba(255, 255, 255, 0.02); padding: 0.55rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
          <span style="color: var(--text-secondary); display: block; font-size: 0.75rem;">Credit Rating</span>
          <strong style="color: var(--text-primary); line-height: 1.25; display: block; margin-top: 0.15rem;">${currentBond.rating}</strong>
        </div>
        <div style="background: rgba(255, 255, 255, 0.02); padding: 0.55rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
          <span style="color: var(--text-secondary); display: block; font-size: 0.75rem;">Guarantor / Parent</span>
          <strong style="color: var(--text-primary); line-height: 1.25; display: block; margin-top: 0.15rem;">${guarantorVal}</strong>
        </div>
        <div style="background: rgba(255, 255, 255, 0.02); padding: 0.55rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
          <span style="color: var(--text-secondary); display: block; font-size: 0.75rem;">Offer Yield (YTM)</span>
          <strong style="color: var(--accent-green); line-height: 1.25; display: block; margin-top: 0.15rem;">${(currentBond.yield * 100).toFixed(2)}%</strong>
        </div>
      </div>

      <div style="font-size: 0.8rem; color: #e5e7eb; line-height: 1.4; padding: 0.6rem 0.75rem; background: rgba(212, 175, 55, 0.08); border-left: 3px solid var(--accent-gold); border-radius: 6px; margin-top: 0.3rem;">
        💡 <strong>Credit Insight:</strong> ${noteText}
      </div>
    `;
  }

  const minRating = minRatingSelect.value as 'A' | 'BBB-' | 'ALL';
  const today = new Date();

  // Find all bonds in activeInventory belonging to this bucket
  const bucketRange = currentBuckets[bucketIdx];
  const overrides = getCompanyOverrides();
  const relaxBBBCap = (document.getElementById('relax-bbb-cap') as HTMLInputElement)?.checked || false;

  const candidates = activeInventory.map(b => {
    const mat = new Date(b.maturity);
    const diffTime = mat.getTime() - today.getTime();
    const months = Math.round((diffTime / (1000 * 60 * 60 * 24 * 30.4375)) * 10) / 10;
    return { ...b, months };
  }).filter(b => {
    if (b.months < bucketRange.min || b.months > bucketRange.max) return false;
    if (excludedIsins.has(b.isin)) return false;

    const override = overrides[b.issuer.trim().toUpperCase()];
    if (override?.action === 'EXCLUDE') return false;
    const isForceIncluded = override?.action === 'INCLUDE';

    if (b.totalTradableQty !== undefined && b.totalTradableQty <= 0) return false;
    if (b.totalTradableFV !== undefined && b.totalTradableFV <= 0) return false;

    if (isForceIncluded) return true; // BYPASS REMAINING RISK FILTERS

    if (b.category) {
      const cat = b.category.trim().toLowerCase();
      if (cat.includes('bundle - flexi') || cat.includes('bundle-flexi')) return false;
    }
    
    if (minRating === 'A' && !isAOrBetter(b.rating)) return false;
    if (minRating === 'BBB-' && !isBBBMinusOrBetter(b.rating)) return false;
    
    // Special rule: Any bond with BBB or worse rating cannot be held for more than 1 year (12.0 months)
    if (!relaxBBBCap) {
      const symbol = getCleanRatingSymbol(b.rating);
      const isBetterThanBBB = symbol.includes('SOVEREIGN') || symbol.includes('GOI') ||
                              symbol.includes('AAA') || symbol.includes('AA') ||
                              symbol.includes('A');
      if (!isBetterThanBBB && b.months > 12.0) return false;
    }
    
    return true;
  });

  // Sort candidates by yield desc
  candidates.sort((a, b) => b.yield - a.yield);

  // Populate Select Options
  swapBondSelect.innerHTML = '';
  candidates.forEach(cand => {
    const isSelected = summary.selectedBonds.some(sb => sb.isin === cand.isin);
    const option = document.createElement('option');
    option.value = cand.isin;
    option.textContent = `${cand.issuer} (${cand.rating}) - ${(cand.yield * 100).toFixed(2)}% YTM - ${cand.months}m tenure${isSelected ? ' [Current Selection]' : ''}`;
    if (cand.isin === isin) {
      option.selected = true;
    }
    swapBondSelect.appendChild(option);
  });
}

// Bind modal action buttons
swapModalSave.addEventListener('click', () => {
  const selectedIsin = swapBondSelect.value;
  if (selectedIsin && currentSwappingBucketIndex >= 0) {
    if (currentSwappingIsin && selectedIsin !== currentSwappingIsin) {
      excludedIsins.add(currentSwappingIsin);
    }
    excludedIsins.delete(selectedIsin);
    manualReplacements.set(currentSwappingBucketIndex, selectedIsin);
    customAllocations.clear();
    swapModal.style.display = 'none';
    updateDashboard();
  }
});

swapModalSuggest.addEventListener('click', () => {
  if (currentSwappingBucketIndex >= 0) {
    // Get currently selected ISINs
    const currentSelectedIsins = new Set(
      Array.from(document.querySelectorAll('#portfolio-table-body tr')).map(tr => {
        const isinCol = tr.querySelector('td');
        return isinCol ? isinCol.textContent?.trim() || '' : '';
      }).filter(i => i !== '')
    );
    
    const minRating = minRatingSelect.value as 'A' | 'BBB-' | 'ALL';
    const today = new Date();
    const suggestBuckets = getCurrentBuckets();
    const bucketRange = suggestBuckets[currentSwappingBucketIndex];
    
    const options = activeInventory.map(b => {
      const mat = new Date(b.maturity);
      const diffTime = mat.getTime() - today.getTime();
      const months = Math.round((diffTime / (1000 * 60 * 60 * 24 * 30.4375)) * 10) / 10;
      return { ...b, months };
    }).filter(b => {
      if (b.months < bucketRange.min || b.months > bucketRange.max) return false;
      if (excludedIsins.has(b.isin)) return false;
      if (currentSelectedIsins.has(b.isin)) return false;
      if (b.category) {
        const cat = b.category.trim().toLowerCase();
        if (cat.includes('bundle - flexi') || cat.includes('bundle-flexi')) return false;
      }
      if (minRating === 'A' && !isAOrBetter(b.rating)) return false;
      if (minRating === 'BBB-' && !isBBBMinusOrBetter(b.rating)) return false;
      
      const symbol = getCleanRatingSymbol(b.rating);
      const isBetterThanBBB = symbol.includes('SOVEREIGN') || symbol.includes('GOI') ||
                              symbol.includes('AAA') || symbol.includes('AA') ||
                              symbol.includes('A');
      if (!isBetterThanBBB && b.months > 12.0) return false;
      return true;
    });

    // Sort by score
    options.sort((a, b) => {
      const scoreA = a.yield * 100 + (getRatingScore(a.rating) / 100);
      const scoreB = b.yield * 100 + (getRatingScore(b.rating) / 100);
      return scoreB - scoreA;
    });

    if (options.length > 0) {
      const selectedIsin = options[0].isin;
      if (currentSwappingIsin && selectedIsin !== currentSwappingIsin) {
        excludedIsins.add(currentSwappingIsin);
      }
      excludedIsins.delete(selectedIsin);
      manualReplacements.set(currentSwappingBucketIndex, selectedIsin);
      customAllocations.clear();
      swapModal.style.display = 'none';
      updateDashboard();
    } else {
      alert('No alternative bonds found matching rules in this maturity bucket.');
    }
  }
});

function getRatingScore(rating: string): number {
  let r = rating.toUpperCase().replace(/\(CE\)/g, '').trim();
  const agencies = ['CRISIL', 'ICRA', 'CARE', 'IND', 'ACUITE', 'FITCH'];
  for (const agency of agencies) {
    if (r.startsWith(agency)) {
      r = r.substring(agency.length).trim();
    }
  }
  if (r.includes('SOVEREIGN') || r.includes('GOI')) return 5;
  if (r === 'AAA') return 4.5;
  if (r === 'AA+') return 4;
  if (r === 'AA') return 3.5;
  if (r === 'AA-') return 3;
  if (r === 'A+') return 2.5;
  if (r === 'A') return 2;
  if (r === 'A-') return 1.5;
  if (r === 'BBB+') return 1;
  if (r === 'BBB') return 0.5;
  return 0;
}

swapModalExclude.addEventListener('click', () => {
  const currentBond = activeInventory.find(b => b.isin === currentSwappingIsin);
  if (currentBond) {
    const issuerToExclude = currentBond.issuer;
    activeInventory.forEach(b => {
      if (b.issuer === issuerToExclude) {
        excludedIsins.add(b.isin);
      }
    });

    for (const [bIdx, isin] of manualReplacements.entries()) {
      const b = activeInventory.find(x => x.isin === isin);
      if (b && b.issuer === issuerToExclude) {
        manualReplacements.delete(bIdx);
      }
    }

    customAllocations.clear();
    swapModal.style.display = 'none';
    updateDashboard();
  }
});

swapModalCancel.addEventListener('click', () => {
  swapModal.style.display = 'none';
});

// Allocation Strategy & Custom Allocation Modal Logic
allocationStrategySelect.addEventListener('change', () => {
  customAllocations.clear(); // Reset custom overrides on strategy change
  updateDashboard();
});

const customizeAllocBtn = document.getElementById('customize-alloc-btn') as HTMLButtonElement;
const allocCustomModal = document.getElementById('alloc-custom-modal') as HTMLDivElement;
const allocModalClose = document.getElementById('alloc-modal-close') as HTMLButtonElement;
const allocModalRows = document.getElementById('alloc-modal-rows') as HTMLTableSectionElement;
const allocModalSummary = document.getElementById('alloc-modal-summary') as HTMLDivElement;
const allocModalError = document.getElementById('alloc-modal-error') as HTMLDivElement;
const allocModalAuto = document.getElementById('alloc-modal-auto') as HTMLButtonElement;
const allocModalSave = document.getElementById('alloc-modal-save') as HTMLButtonElement;

customizeAllocBtn.addEventListener('click', () => {
  if (!latestSummary || latestSummary.selectedBonds.length === 0) return;

  const bonds = latestSummary.selectedBonds;
  const targetTotal = parseFloat(amountInput.value) || 1000000;

  allocModalRows.innerHTML = '';
  allocModalError.style.display = 'none';

  const baseCompanyCap = targetTotal * 0.15;

  bonds.forEach(bond => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';

    const insights = getCompanyInsights(bond);
    const effectiveTrend = bond.ratingTrend || insights.ratingTrend;
    const trendText = effectiveTrend === 'improving' ? '▲ Impr' : effectiveTrend === 'deteriorating' ? '▼ Det' : '● Stbl';
    const trendColor = effectiveTrend === 'improving' ? '#10b981' : effectiveTrend === 'deteriorating' ? '#ef4444' : '#3b82f6';
    const noteText = bond.ratingOutlookNote || insights.insightNote || 'Credit profile backed by operational history.';

    const unitPrice = getUnitPrice(bond);
    const fvCap = bond.totalTradableFV && bond.totalTradableFV > 0 ? bond.totalTradableFV : Infinity;
    const effectiveCap = Math.max(baseCompanyCap, unitPrice);
    const finalCap = Math.min(fvCap, effectiveCap);

    const currentUnits = Math.floor(bond.allocatedAmount / unitPrice);
    const maxUnits = Math.floor(finalCap / unitPrice);

    const capText = fvCap < Infinity
      ? `${formatCurrency(fvCap)} (Cap: 15% / ${formatCurrency(baseCompanyCap)})`
      : `15% Cap (${formatCurrency(baseCompanyCap)})`;

    tr.innerHTML = `
      <td style="padding: 0.6rem 0.5rem;">
        <div class="bond-name-click" style="font-weight: 700; font-size: 0.88rem; color: var(--accent-blue); cursor: pointer;" title="View Bond Details">${bond.issuer}</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary); font-family: monospace;">${bond.isin}</div>
      </td>
      <td style="padding: 0.6rem 0.5rem;">
        <div style="font-weight: 600; font-size: 0.82rem;">${bond.rating}</div>
        <span style="font-size: 0.7rem; font-weight: 600; color: ${trendColor};">${trendText}</span>
      </td>
      <td style="padding: 0.6rem 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--text-primary); white-space: nowrap;">
        ${bond.months}m
      </td>
      <td style="padding: 0.6rem 0.5rem; color: var(--accent-green); font-weight: 700; font-size: 0.88rem;">
        ${(bond.yield * 100).toFixed(2)}%
      </td>
      <td style="padding: 0.6rem 0.5rem; max-width: 220px;">
        <div style="font-weight: 600; font-size: 0.78rem; color: var(--accent-gold); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${insights.sector}</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 0.1rem;" title="${noteText}">💡 ${noteText}</div>
      </td>
      <td style="padding: 0.6rem 0.5rem; font-size: 0.82rem;">${capText}</td>
      <td style="padding: 0.6rem 0.5rem; text-align: right; white-space: nowrap;">
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
          <input type="number" class="qty-input" data-isin="${bond.isin}" data-issuer="${bond.issuer}" data-unit="${unitPrice}" data-max="${maxUnits}" value="${currentUnits}" min="0" max="${maxUnits}" step="1" style="width: 60px; text-align: center; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass); border-radius: 6px; color: var(--text-primary); padding: 0.35rem 0.5rem; font-family: var(--font-sans); font-size: 0.88rem; font-weight: 600;" />
          <span style="font-size: 0.75rem; color: var(--text-secondary);">units</span>
        </div>
        <div class="alloc-display" style="margin-top: 0.3rem; font-size: 0.82rem; font-weight: 600; color: var(--text-primary);">${formatCurrency(currentUnits * unitPrice)}</div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.1rem;">@ ${formatCurrency(unitPrice)}</div>
      </td>
    `;
    
    // Make the bond name clickable to view bond details
    const nameEl = tr.querySelector('.bond-name-click') as HTMLElement;
    if (nameEl) {
      nameEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const fullBond = activeInventory.find(b => b.isin === bond.isin) ?? bond;
        openBondDetailModal(fullBond);
      });
    }

    allocModalRows.appendChild(tr);
  });

  const updateModalSummary = () => {
    const inputs = allocModalRows.querySelectorAll('.qty-input') as NodeListOf<HTMLInputElement>;
    let currentSum = 0;
    inputs.forEach(inp => {
      const qty = parseInt(inp.value) || 0;
      const unitPrice = parseFloat(inp.getAttribute('data-unit') || '0');
      const alloc = qty * unitPrice;
      currentSum += alloc;

      const display = inp.parentElement?.parentElement?.querySelector('.alloc-display') as HTMLDivElement;
      if (display) display.textContent = formatCurrency(alloc);
    });

    allocModalSummary.textContent = `${formatCurrency(currentSum)} / ${formatCurrency(targetTotal)}`;
    if (currentSum > targetTotal) {
      allocModalSummary.style.color = '#ef4444';
      allocModalError.textContent = `Total allocated cannot exceed target (${formatCurrency(targetTotal)}). Current excess: ${formatCurrency(currentSum - targetTotal)}`;
      allocModalError.style.display = 'block';
    } else {
      allocModalSummary.style.color = 'var(--accent-green)';
      allocModalError.style.display = 'none';
    }
  };

  allocModalRows.querySelectorAll('.qty-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      let val = parseInt(input.value) || 0;
      const maxUnits = parseInt(input.getAttribute('data-max') || '9999');

      if (val > maxUnits) {
        val = maxUnits;
        input.value = val.toString();
      }
      updateModalSummary();
    });
  });

  updateModalSummary();
  allocCustomModal.style.display = 'flex';
});

allocModalClose.addEventListener('click', () => {
  allocCustomModal.style.display = 'none';
});

allocModalAuto.addEventListener('click', () => {
  if (!latestSummary) return;

  const targetTotal = parseFloat(amountInput.value) || 1000000;
  const inputs = Array.from(allocModalRows.querySelectorAll('.qty-input')) as HTMLInputElement[];

  let currentSum = 0;
  inputs.forEach(inp => { 
    const qty = parseInt(inp.value) || 0;
    const unitPrice = parseFloat(inp.getAttribute('data-unit') || '0');
    currentSum += qty * unitPrice;
  });

  let diff = targetTotal - currentSum;
  if (diff <= 0) return;

  // Distribute remaining to highest yielding uncapped bonds
  const bondMap = new Map(latestSummary.selectedBonds.map(b => [b.isin, b]));
  inputs.sort((a, b) => {
    const yA = bondMap.get(a.getAttribute('data-isin') || '')?.yield || 0;
    const yB = bondMap.get(b.getAttribute('data-isin') || '')?.yield || 0;
    return yB - yA;
  });

  for (const inp of inputs) {
    if (diff <= 0) break;
    let currentQty = parseInt(inp.value) || 0;
    const maxUnits = parseInt(inp.getAttribute('data-max') || '9999');
    const unitPrice = parseFloat(inp.getAttribute('data-unit') || '0');
    
    if (unitPrice === 0) continue;

    // How many more units can we buy for this bond?
    const maxAddableByCap = maxUnits - currentQty;
    const maxAddableByCash = Math.floor(diff / unitPrice);
    
    const unitsToAdd = Math.min(maxAddableByCap, maxAddableByCash);

    if (unitsToAdd > 0) {
      currentQty += unitsToAdd;
      inp.value = currentQty.toString();
      diff -= unitsToAdd * unitPrice;
      
      const display = inp.parentElement?.parentElement?.querySelector('.alloc-display') as HTMLDivElement;
      if (display) display.textContent = formatCurrency(currentQty * unitPrice);
    }
  }

  // update the modal summary
  const summarySum = targetTotal - diff; // new total
  allocModalSummary.textContent = `${formatCurrency(summarySum)} / ${formatCurrency(targetTotal)}`;
  allocModalSummary.style.color = 'var(--accent-green)';
  allocModalError.style.display = 'none';
});

allocModalSave.addEventListener('click', () => {
  const targetTotal = parseFloat(amountInput.value) || 1000000;
  const inputs = allocModalRows.querySelectorAll('.qty-input') as NodeListOf<HTMLInputElement>;
  let currentSum = 0;
  const tempMap = new Map<string, number>();

  inputs.forEach(inp => {
    const isin = inp.getAttribute('data-isin') || '';
    const qty = parseInt(inp.value) || 0;
    const unitPrice = parseFloat(inp.getAttribute('data-unit') || '0');
    const val = qty * unitPrice;
    currentSum += val;
    tempMap.set(isin, val);
  });

  if (currentSum > targetTotal) {
    alert(`Total allocated amount (${formatCurrency(currentSum)}) exceeds target investment (${formatCurrency(targetTotal)}). Please adjust quantities.`);
    return;
  }

  customAllocations.clear();
  tempMap.forEach((v, k) => customAllocations.set(k, v));

  allocCustomModal.style.display = 'none';
  updateDashboard();
});

targetQuarterlyCashflowInput.addEventListener('input', () => {
  updateDashboard();
});
document.getElementById('relax-bbb-cap')?.addEventListener('change', () => {
  updateDashboard();
});

window.addEventListener('portfolio-overrides-changed', () => {
  updateDashboard();
});

// --- Screener & Tabs Logic ---
const tabBuilder = document.getElementById('tab-builder');
const tabScreener = document.getElementById('tab-screener');
const builderView = document.getElementById('builder-view');
const screenerView = document.getElementById('screener-view');

if (tabBuilder && tabScreener && builderView && screenerView) {
  tabBuilder.addEventListener('click', () => {
    tabBuilder.classList.add('tab-active');
    tabScreener.classList.remove('tab-active');
    tabBuilder.style.color = 'var(--accent-gold)';
    tabBuilder.style.borderBottom = '2px solid var(--accent-gold)';
    tabScreener.style.color = 'var(--text-secondary)';
    tabScreener.style.borderBottom = 'none';
    
    builderView.style.display = 'block';
    screenerView.style.display = 'none';
  });

  tabScreener.addEventListener('click', () => {
    tabScreener.classList.add('tab-active');
    tabBuilder.classList.remove('tab-active');
    tabScreener.style.color = 'var(--accent-gold)';
    tabScreener.style.borderBottom = '2px solid var(--accent-gold)';
    tabBuilder.style.color = 'var(--text-secondary)';
    tabBuilder.style.borderBottom = 'none';
    
    builderView.style.display = 'none';
    screenerView.style.display = 'block';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScreener();
  setScreenerInventory(activeInventory);
  initOverridesModal({
    getActiveInventory: () => activeInventory,
    getExcludedIsins: () => excludedIsins,
    getManualReplacements: () => manualReplacements,
    onUpdate: () => updateDashboard()
  });
  initEngineSettingsModal({
    getCurrentInvestment: () => parseFloat(amountInput.value) || 1000000,
    onUpdate: () => updateDashboard()
  });
});

window.addEventListener('engine-hyperparameters-changed', () => {
  updateDashboard();
});

