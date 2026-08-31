import { DefaultBond } from './defaultInventory';
import { getUnitPrice } from './bondEngine';
import { getCompanyOverrides, setCompanyOverride } from './overridesManager';
import { openBondDetailModal } from './bondDetailModal';

let inventoryBonds: DefaultBond[] = [];
let filteredBonds: DefaultBond[] = [];

// Sorting State
let sortColumn: keyof DefaultBond | 'price' = 'issuer';
let sortDirection: 'asc' | 'desc' = 'asc';

// DOM Elements
let screenerSearch: HTMLInputElement;
let screenerMinYield: HTMLInputElement;
let screenerMaxTenure: HTMLInputElement;
let screenerRating: HTMLSelectElement;
let screenerTableBody: HTMLTableSectionElement;
let screenerCount: HTMLDivElement;

export function initScreener() {
  screenerSearch = document.getElementById('screener-search') as HTMLInputElement;
  screenerMinYield = document.getElementById('screener-min-yield') as HTMLInputElement;
  screenerMaxTenure = document.getElementById('screener-max-tenure') as HTMLInputElement;
  screenerRating = document.getElementById('screener-rating') as HTMLSelectElement;
  screenerTableBody = document.getElementById('screener-table-body') as HTMLTableSectionElement;
  screenerCount = document.getElementById('screener-count') as HTMLDivElement;

  // Event Listeners for Filters
  screenerSearch.addEventListener('input', applyFilters);
  screenerMinYield.addEventListener('input', applyFilters);
  screenerMaxTenure.addEventListener('input', applyFilters);
  screenerRating.addEventListener('change', applyFilters);

  // Event Listeners for Sorting
  document.querySelectorAll('#screener-view th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort') as keyof DefaultBond | 'price';
      if (sortColumn === col) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = col;
        sortDirection = 'asc';
      }
      updateSortIcons();
      applyFilters();
    });
  });
}

export function setScreenerInventory(bonds: DefaultBond[]) {
  inventoryBonds = bonds;
  applyFilters();
}

function updateSortIcons() {
  document.querySelectorAll('#screener-view th[data-sort]').forEach(th => {
    const span = th.querySelector('span');
    if (span) span.innerHTML = '';
    if (th.getAttribute('data-sort') === sortColumn) {
      if (span) span.innerHTML = sortDirection === 'asc' ? ' &uarr;' : ' &darr;';
    }
  });
}

function applyFilters() {
  const searchTerm = screenerSearch.value.toLowerCase();
  const minYield = parseFloat(screenerMinYield.value) || 0;
  const maxTenure = parseFloat(screenerMaxTenure.value) || Infinity;
  const ratingFilter = screenerRating.value;

  filteredBonds = inventoryBonds.filter(b => {
    // 1. Search Filter
    if (searchTerm) {
      const matchIssuer = b.issuer.toLowerCase().includes(searchTerm);
      const matchIsin = b.isin.toLowerCase().includes(searchTerm);
      if (!matchIssuer && !matchIsin) return false;
    }

    // 2. Yield Filter
    if (b.yield < minYield) return false;

    // 3. Tenure Filter
    if (b.months > maxTenure) return false;

    // 4. Rating Filter
    if (ratingFilter) {
      const r = b.rating.toUpperCase();
      if (ratingFilter === 'AAA' && !r.includes('AAA')) return false;
      if (ratingFilter === 'AA' && !r.match(/^AA/)) return false;
      if (ratingFilter === 'A' && !r.match(/^A[^A]/) && r !== 'A') return false; // Match A+, A-, A, but not AA
      if (ratingFilter === 'BBB') {
        if (r.includes('AAA') || r.startsWith('AA') || (r.startsWith('A') && !r.includes('B'))) return false;
      }
    }

    return true;
  });

  // Apply Sorting
  filteredBonds.sort((a, b) => {
    let valA: any = (a as any)[sortColumn];
    let valB: any = (b as any)[sortColumn];

    if (sortColumn === 'price') {
      valA = getUnitPrice(a);
      valB = getUnitPrice(b);
    }
    
    // Default to handling missing values safely
    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valB > valA ? 1 : -1);
    }
  });

  renderTable();
}

function renderTable() {
  screenerTableBody.innerHTML = '';
  screenerCount.innerText = `Showing ${filteredBonds.length} bonds`;

  if (filteredBonds.length === 0) {
    screenerTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No bonds match your criteria.</td></tr>`;
    return;
  }

  // Cap rendering to 500 rows to prevent extreme UI freezes on huge inventories
  const displayLimit = Math.min(filteredBonds.length, 500);
  
  for (let i = 0; i < displayLimit; i++) {
    const b = filteredBonds[i];
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    tr.style.transition = 'background 0.2s';
    
    tr.onmouseover = () => { tr.style.background = 'rgba(255,255,255,0.05)'; };
    tr.onmouseout = () => { tr.style.background = 'transparent'; };

    // Format fields
    const fvFmt = b.totalTradableFV ? `₹${(b.totalTradableFV / 100000).toFixed(2)}L` : '-';
    const price = getUnitPrice(b);
    const priceFmt = `₹${(price / 100000).toFixed(2)}L`;
    
    const overrides = getCompanyOverrides();
    const isForced = overrides[b.issuer.trim().toUpperCase()]?.action === 'INCLUDE';
    const btnText = isForced ? 'Added' : 'Force Add';
    const btnStyle = isForced 
      ? 'background: var(--accent-green); color: #000; border: none; cursor: default;' 
      : 'background: rgba(255,255,255,0.1); color: var(--text-primary); border: 1px solid var(--border-glass); cursor: pointer;';

    tr.innerHTML = `
      <td style="padding: 0.75rem; font-weight: 500; cursor: pointer;" class="bond-name-cell">${b.issuer}</td>
      <td style="padding: 0.75rem; font-family: monospace; color: var(--text-secondary);">${b.isin}</td>
      <td style="padding: 0.75rem;"><span style="background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${b.rating}</span></td>
      <td style="padding: 0.75rem; color: var(--accent-green); font-weight: 600;">${b.yield.toFixed(2)}%</td>
      <td style="padding: 0.75rem;">${b.months.toFixed(1)}</td>
      <td style="padding: 0.75rem;">${priceFmt}</td>
      <td style="padding: 0.75rem;">${fvFmt}</td>
      <td style="padding: 0.75rem;">
        <button class="force-add-btn" data-isin="${b.isin}" style="border-radius: 6px; padding: 0.4rem 0.75rem; font-size: 0.8rem; font-weight: 600; ${btnStyle}">${btnText}</button>
      </td>
    `;

    // Add click handler to bond name to open Bond Detail Modal
    const nameCell = tr.querySelector('.bond-name-cell') as HTMLElement;
    if (nameCell) {
        nameCell.addEventListener('click', () => {
          openBondDetailModal(b);
        });
    }

    // Add click handler for "Force Add"
    const addBtn = tr.querySelector('.force-add-btn') as HTMLButtonElement;
    if (!isForced && addBtn) {
      addBtn.addEventListener('click', () => {
        const justification = prompt(`Add a justification for manually including ${b.issuer}:`, "Manually added from Screener");
        if (justification) {
          setCompanyOverride(b.issuer, 'INCLUDE', justification);
          applyFilters(); // Re-render to update button state
          alert(`${b.issuer} has been force-added. Switch to the Portfolio Builder and hit 'Generate Portfolio' to see it.`);
        }
      });
    }

    screenerTableBody.appendChild(tr);
  }

  if (filteredBonds.length > 500) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="8" style="text-align: center; padding: 1rem; color: var(--text-secondary); font-size: 0.85rem;">Showing first 500 results. Use filters to narrow down your search.</td>`;
    screenerTableBody.appendChild(tr);
  }
}
