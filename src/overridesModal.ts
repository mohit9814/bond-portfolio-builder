import { DefaultBond } from './defaultInventory';
import {
  getCompanyOverrides,
  setCompanyOverride,
  removeCompanyOverride,
  clearAllCompanyOverrides,
  clearCompanyOverridesByAction
} from './overridesManager';

interface OverridesModalContext {
  getActiveInventory: () => DefaultBond[];
  getExcludedIsins: () => Set<string>;
  getManualReplacements: () => Map<number, string>;
  onUpdate: () => void;
}

let context: OverridesModalContext | null = null;
let currentTab: 'inclusions' | 'exclusions' | 'swaps' = 'inclusions';

export function initOverridesModal(ctx: OverridesModalContext) {
  context = ctx;

  const modal = document.getElementById('overrides-manager-modal') as HTMLDivElement;
  const closeBtn = document.getElementById('overrides-modal-close') as HTMLButtonElement;
  const triggerBtn = document.getElementById('manage-overrides-btn') as HTMLButtonElement;

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      openOverridesModal();
    });
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Listen for overrides changed event to refresh counts and view if open
  window.addEventListener('portfolio-overrides-changed', () => {
    updateOverridesBadge();
    if (modal && modal.style.display === 'flex') {
      renderModalContent();
    }
  });

  updateOverridesBadge();
}

export function updateOverridesBadge() {
  const badge = document.getElementById('overrides-count-badge') as HTMLElement;
  if (!badge || !context) return;

  const overrides = getCompanyOverrides();
  const overrideCount = Object.keys(overrides).length;
  const excludedIsinCount = context.getExcludedIsins().size;
  const swapsCount = context.getManualReplacements().size;
  const total = overrideCount + excludedIsinCount + swapsCount;

  badge.textContent = total.toString();
  badge.style.display = total > 0 ? 'inline-block' : 'inline-block';
  if (total > 0) {
    badge.style.background = 'rgba(59, 130, 246, 0.35)';
    badge.style.color = '#93c5fd';
  } else {
    badge.style.background = 'rgba(255, 255, 255, 0.08)';
    badge.style.color = 'var(--text-secondary)';
  }
}

export function openOverridesModal(defaultTab: 'inclusions' | 'exclusions' | 'swaps' = 'inclusions') {
  const modal = document.getElementById('overrides-manager-modal') as HTMLDivElement;
  if (!modal) return;

  currentTab = defaultTab;
  modal.style.display = 'flex';
  renderModalContent();
}

function renderModalContent() {
  if (!context) return;

  const container = document.getElementById('overrides-modal-content') as HTMLDivElement;
  if (!container) return;

  const overrides = getCompanyOverrides();
  const excludedIsins = context.getExcludedIsins();
  const manualReplacements = context.getManualReplacements();
  const inventory = context.getActiveInventory();

  // Categorize
  const inclusionOverrides = Object.entries(overrides).filter(([_, o]) => o.action === 'INCLUDE');
  const exclusionOverrides = Object.entries(overrides).filter(([_, o]) => o.action === 'EXCLUDE');

  container.innerHTML = `
    <!-- Modal Navigation Tabs -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="override-tab-btn ${currentTab === 'inclusions' ? 'active' : ''}" data-tab="inclusions" style="padding: 0.45rem 1rem; border-radius: 8px; border: 1px solid ${currentTab === 'inclusions' ? 'var(--accent-blue)' : 'transparent'}; background: ${currentTab === 'inclusions' ? 'rgba(59, 130, 246, 0.15)' : 'transparent'}; color: ${currentTab === 'inclusions' ? '#60a5fa' : 'var(--text-secondary)'}; font-weight: 600; cursor: pointer; font-size: 0.88rem; transition: all 0.15s;">
          ✓ Force Inclusions <span style="font-size: 0.75rem; background: rgba(59, 130, 246, 0.25); padding: 1px 6px; border-radius: 10px; margin-left: 0.35rem;">${inclusionOverrides.length}</span>
        </button>
        <button class="override-tab-btn ${currentTab === 'exclusions' ? 'active' : ''}" data-tab="exclusions" style="padding: 0.45rem 1rem; border-radius: 8px; border: 1px solid ${currentTab === 'exclusions' ? '#ef4444' : 'transparent'}; background: ${currentTab === 'exclusions' ? 'rgba(239, 68, 68, 0.15)' : 'transparent'}; color: ${currentTab === 'exclusions' ? '#f87171' : 'var(--text-secondary)'}; font-weight: 600; cursor: pointer; font-size: 0.88rem; transition: all 0.15s;">
          ✕ Exclusions <span style="font-size: 0.75rem; background: rgba(239, 68, 68, 0.25); padding: 1px 6px; border-radius: 10px; margin-left: 0.35rem;">${exclusionOverrides.length + excludedIsins.size}</span>
        </button>
        <button class="override-tab-btn ${currentTab === 'swaps' ? 'active' : ''}" data-tab="swaps" style="padding: 0.45rem 1rem; border-radius: 8px; border: 1px solid ${currentTab === 'swaps' ? 'var(--accent-gold)' : 'transparent'}; background: ${currentTab === 'swaps' ? 'rgba(212, 175, 55, 0.15)' : 'transparent'}; color: ${currentTab === 'swaps' ? 'var(--accent-gold)' : 'var(--text-secondary)'}; font-weight: 600; cursor: pointer; font-size: 0.88rem; transition: all 0.15s;">
          ⇄ Swapped Holdings <span style="font-size: 0.75rem; background: rgba(212, 175, 55, 0.25); padding: 1px 6px; border-radius: 10px; margin-left: 0.35rem;">${manualReplacements.size}</span>
        </button>
      </div>
      <button id="reset-all-overrides-btn" style="background: none; border: 1px solid rgba(255,255,255,0.15); color: var(--text-secondary); font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; transition: all 0.15s;">
        ↺ Reset All Rules
      </button>
    </div>

    <!-- Quick Add Bar -->
    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem;">
      <div style="font-size: 0.82rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">
        ➕ Quick Add Custom Override
      </div>
      <div style="display: grid; grid-template-columns: 1.8fr 1fr 2.5fr auto; gap: 0.6rem; align-items: center;">
        <div>
          <input id="quick-override-issuer" type="text" placeholder="Issuer Name or ISIN..." list="inventory-issuers-datalist" style="width: 100%; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.5rem 0.75rem; color: #fff; font-size: 0.85rem; outline: none;" />
          <datalist id="inventory-issuers-datalist">
            ${Array.from(new Set(inventory.map(b => b.issuer))).slice(0, 100).map(name => `<option value="${name}"></option>`).join('')}
          </datalist>
        </div>
        <div>
          <select id="quick-override-action" style="width: 100%; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.5rem 0.75rem; color: #fff; font-size: 0.85rem; outline: none; cursor: pointer;">
            <option value="INCLUDE" ${currentTab === 'inclusions' ? 'selected' : ''}>Force INCLUDE</option>
            <option value="EXCLUDE" ${currentTab === 'exclusions' ? 'selected' : ''}>Force EXCLUDE</option>
          </select>
        </div>
        <div>
          <input id="quick-override-justification" type="text" placeholder="Justification rationale (optional)..." style="width: 100%; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.5rem 0.75rem; color: #fff; font-size: 0.85rem; outline: none;" />
        </div>
        <div>
          <button id="quick-override-add-btn" class="btn" style="background: var(--accent-blue); color: #fff; font-weight: 600; font-size: 0.82rem; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; white-space: nowrap;">
            Add Rule
          </button>
        </div>
      </div>
    </div>

    <!-- Active Tab Body -->
    <div id="overrides-tab-body">
      ${renderActiveTabBody()}
    </div>
  `;

  // Attach tab switch event listeners
  const tabBtns = container.querySelectorAll('.override-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as any;
      if (targetTab) {
        currentTab = targetTab;
        renderModalContent();
      }
    });
  });

  // Attach Quick Add listener
  const addBtn = document.getElementById('quick-override-add-btn') as HTMLButtonElement;
  const issuerInput = document.getElementById('quick-override-issuer') as HTMLInputElement;
  const actionSelect = document.getElementById('quick-override-action') as HTMLSelectElement;
  const justInput = document.getElementById('quick-override-justification') as HTMLInputElement;

  if (addBtn && issuerInput && actionSelect && justInput) {
    addBtn.addEventListener('click', () => {
      const issuerVal = issuerInput.value.trim();
      if (!issuerVal) {
        alert('Please enter an issuer name or ISIN to override.');
        return;
      }
      const actionVal = actionSelect.value as 'INCLUDE' | 'EXCLUDE';
      const justVal = justInput.value.trim() || `User manually added ${actionVal}`;

      setCompanyOverride(issuerVal, actionVal, justVal);
      if (actionVal === 'INCLUDE') {
        // Un-exclude if previously excluded
        const matchBonds = inventory.filter(b => b.issuer.trim().toUpperCase() === issuerVal.trim().toUpperCase() || b.isin === issuerVal);
        matchBonds.forEach(b => context?.getExcludedIsins().delete(b.isin));
      }

      context?.onUpdate();
      renderModalContent();
    });
  }

  attachRowActionListeners(container);
}

function renderActiveTabBody(): string {
  if (!context) return '';

  const overrides = getCompanyOverrides();
  const excludedIsins = context.getExcludedIsins();
  const manualReplacements = context.getManualReplacements();
  const inventory = context.getActiveInventory();

  if (currentTab === 'inclusions') {
    const inclusionEntries = Object.entries(overrides).filter(([_, o]) => o.action === 'INCLUDE');
    if (inclusionEntries.length === 0) {
      return `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary); background: rgba(0, 0, 0, 0.15); border-radius: 12px; border: 1px dashed var(--border-glass);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
          <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary);">No Force-Included Companies</div>
          <div style="font-size: 0.82rem; margin-top: 0.25rem;">Use the form above or the "Force Add" button in the Screener/Eliminated Bonds view to include companies.</div>
        </div>
      `;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-size: 0.82rem; color: var(--text-secondary);">Showing <strong>${inclusionEntries.length}</strong> active force-inclusions (bypasses standard risk screening)</span>
        <button id="clear-all-inclusions-btn" style="background: none; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer;">Clear All Inclusions</button>
      </div>
      <div style="overflow-x: auto; max-height: 420px; border: 1px solid var(--border-glass); border-radius: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--border-glass);">
              <th style="padding: 0.65rem 0.85rem;">Company / Issuer</th>
              <th style="padding: 0.65rem 0.85rem;">Status</th>
              <th style="padding: 0.65rem 0.85rem;">Justification Note</th>
              <th style="padding: 0.65rem 0.85rem;">Date Added</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${inclusionEntries.map(([issuer, o]) => {
              const dateStr = o.timestamp ? new Date(o.timestamp).toLocaleDateString() : 'Active';
              return `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                  <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: #fff;">${issuer}</td>
                  <td style="padding: 0.65rem 0.85rem;">
                    <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; border: 1px solid rgba(59, 130, 246, 0.35);">FORCE INCLUDE</span>
                  </td>
                  <td style="padding: 0.65rem 0.85rem; color: #e5e7eb;">${o.justification}</td>
                  <td style="padding: 0.65rem 0.85rem; color: var(--text-secondary); font-size: 0.78rem;">${dateStr}</td>
                  <td style="padding: 0.65rem 0.85rem; text-align: right; white-space: nowrap;">
                    <button class="change-action-btn" data-issuer="${issuer}" data-target="EXCLUDE" style="background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer; margin-right: 0.35rem;">Exclude</button>
                    <button class="remove-override-btn" data-issuer="${issuer}" style="background: rgba(255, 255, 255, 0.06); color: #fff; border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer;">Remove</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (currentTab === 'exclusions') {
    const exclusionEntries = Object.entries(overrides).filter(([_, o]) => o.action === 'EXCLUDE');
    const hasAny = exclusionEntries.length > 0 || excludedIsins.size > 0;

    if (!hasAny) {
      return `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary); background: rgba(0, 0, 0, 0.15); border-radius: 12px; border: 1px dashed var(--border-glass);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛡️</div>
          <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary);">No Active Exclusions</div>
          <div style="font-size: 0.82rem; margin-top: 0.25rem;">All eligible bonds in the inventory are permitted for portfolio optimization.</div>
        </div>
      `;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-size: 0.82rem; color: var(--text-secondary);">Showing <strong>${exclusionEntries.length + excludedIsins.size}</strong> active exclusions</span>
        <button id="clear-all-exclusions-btn" style="background: none; border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer;">Clear All Exclusions</button>
      </div>
      <div style="overflow-x: auto; max-height: 420px; border: 1px solid var(--border-glass); border-radius: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--border-glass);">
              <th style="padding: 0.65rem 0.85rem;">Entity / Identifier</th>
              <th style="padding: 0.65rem 0.85rem;">Type</th>
              <th style="padding: 0.65rem 0.85rem;">Reason / Justification</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${exclusionEntries.map(([issuer, o]) => `
              <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: #fff;">${issuer}</td>
                <td style="padding: 0.65rem 0.85rem;">
                  <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; border: 1px solid rgba(239, 68, 68, 0.35);">COMPANY BANNED</span>
                </td>
                <td style="padding: 0.65rem 0.85rem; color: #e5e7eb;">${o.justification}</td>
                <td style="padding: 0.65rem 0.85rem; text-align: right; white-space: nowrap;">
                  <button class="change-action-btn" data-issuer="${issuer}" data-target="INCLUDE" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer; margin-right: 0.35rem;">Force Include</button>
                  <button class="remove-override-btn" data-issuer="${issuer}" style="background: rgba(255, 255, 255, 0.06); color: #fff; border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer;">Restore</button>
                </td>
              </tr>
            `).join('')}
            ${Array.from(excludedIsins).map(isin => {
              const matchedBond = inventory.find(b => b.isin === isin);
              const label = matchedBond ? `${matchedBond.issuer} (${isin})` : isin;
              return `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                  <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: #fff;">${label}</td>
                  <td style="padding: 0.65rem 0.85rem;">
                    <span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; border: 1px solid rgba(245, 158, 11, 0.35);">ISIN EXCLUDED</span>
                  </td>
                  <td style="padding: 0.65rem 0.85rem; color: #e5e7eb;">Manually swapped or excluded from proposal.</td>
                  <td style="padding: 0.65rem 0.85rem; text-align: right; white-space: nowrap;">
                    <button class="remove-isin-exclusion-btn" data-isin="${isin}" style="background: rgba(255, 255, 255, 0.06); color: #fff; border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer;">Restore</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (currentTab === 'swaps') {
    const swapEntries = Array.from(manualReplacements.entries());
    if (swapEntries.length === 0) {
      return `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary); background: rgba(0, 0, 0, 0.15); border-radius: 12px; border: 1px dashed var(--border-glass);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⇄</div>
          <div style="font-weight: 600; font-size: 1rem; color: var(--text-primary);">No Manual Swaps Active</div>
          <div style="font-size: 0.82rem; margin-top: 0.25rem;">All maturity buckets are currently auto-optimized by the algorithm. Use "Swap" on any portfolio row to lock custom choices.</div>
        </div>
      `;
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span style="font-size: 0.82rem; color: var(--text-secondary);">Showing <strong>${swapEntries.length}</strong> manually locked bucket holding(s)</span>
        <button id="clear-all-swaps-btn" style="background: none; border: 1px solid rgba(212, 175, 55, 0.3); color: var(--accent-gold); font-size: 0.75rem; padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer;">Reset All Swaps to Auto</button>
      </div>
      <div style="overflow-x: auto; max-height: 420px; border: 1px solid var(--border-glass); border-radius: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem; text-align: left;">
          <thead>
            <tr style="background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid var(--border-glass);">
              <th style="padding: 0.65rem 0.85rem;">Bucket Index</th>
              <th style="padding: 0.65rem 0.85rem;">Assigned Bond</th>
              <th style="padding: 0.65rem 0.85rem;">Rating & Yield</th>
              <th style="padding: 0.65rem 0.85rem;">Tenure</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${swapEntries.map(([bIdx, isin]) => {
              const bond = inventory.find(b => b.isin === isin);
              const issuerName = bond ? bond.issuer : 'Custom Selection';
              const ratingYield = bond ? `${bond.rating} @ ${(bond.yield * 100).toFixed(2)}% YTM` : '-';
              const months = bond ? `${bond.months}m` : '-';
              return `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                  <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: var(--accent-gold);">Bucket #${bIdx + 1}</td>
                  <td style="padding: 0.65rem 0.85rem;">
                    <div style="font-weight: 700; color: #fff;">${issuerName}</div>
                    <div style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary);">${isin}</div>
                  </td>
                  <td style="padding: 0.65rem 0.85rem; color: #e5e7eb;">${ratingYield}</td>
                  <td style="padding: 0.65rem 0.85rem; color: var(--text-secondary);">${months}</td>
                  <td style="padding: 0.65rem 0.85rem; text-align: right;">
                    <button class="remove-swap-btn" data-bucket="${bIdx}" style="background: rgba(212, 175, 55, 0.12); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 6px; padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer;">Reset to Auto</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return '';
}

function attachRowActionListeners(container: HTMLElement) {
  if (!context) return;

  // Remove Company Override
  container.querySelectorAll('.remove-override-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const issuer = (e.currentTarget as HTMLElement).getAttribute('data-issuer');
      if (issuer) {
        removeCompanyOverride(issuer);
        context?.onUpdate();
        renderModalContent();
      }
    });
  });

  // Change Company Override Action (Include <-> Exclude)
  container.querySelectorAll('.change-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const issuer = target.getAttribute('data-issuer');
      const targetAction = target.getAttribute('data-target') as 'INCLUDE' | 'EXCLUDE';
      if (issuer && targetAction) {
        setCompanyOverride(issuer, targetAction, `User switched status to ${targetAction}`);
        if (targetAction === 'INCLUDE') {
          // un-exclude bonds from that company
          const match = context?.getActiveInventory().filter(b => b.issuer.trim().toUpperCase() === issuer.trim().toUpperCase());
          match?.forEach(b => context?.getExcludedIsins().delete(b.isin));
        }
        context?.onUpdate();
        renderModalContent();
      }
    });
  });

  // Remove ISIN exclusion
  container.querySelectorAll('.remove-isin-exclusion-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const isin = (e.currentTarget as HTMLElement).getAttribute('data-isin');
      if (isin) {
        context?.getExcludedIsins().delete(isin);
        context?.onUpdate();
        renderModalContent();
      }
    });
  });

  // Remove single Swap
  container.querySelectorAll('.remove-swap-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bIdx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-bucket') || '-1');
      if (bIdx >= 0) {
        context?.getManualReplacements().delete(bIdx);
        context?.onUpdate();
        renderModalContent();
      }
    });
  });

  // Clear All Inclusions
  const clearInclusionsBtn = container.querySelector('#clear-all-inclusions-btn');
  if (clearInclusionsBtn) {
    clearInclusionsBtn.addEventListener('click', () => {
      if (confirm('Clear all force-included companies?')) {
        clearCompanyOverridesByAction('INCLUDE');
        context?.onUpdate();
        renderModalContent();
      }
    });
  }

  // Clear All Exclusions
  const clearExclusionsBtn = container.querySelector('#clear-all-exclusions-btn');
  if (clearExclusionsBtn) {
    clearExclusionsBtn.addEventListener('click', () => {
      if (confirm('Clear all exclusions (both company bans and individual ISINs)?')) {
        clearCompanyOverridesByAction('EXCLUDE');
        context?.getExcludedIsins().clear();
        context?.onUpdate();
        renderModalContent();
      }
    });
  }

  // Clear All Swaps
  const clearSwapsBtn = container.querySelector('#clear-all-swaps-btn');
  if (clearSwapsBtn) {
    clearSwapsBtn.addEventListener('click', () => {
      if (confirm('Reset all swapped holdings back to automated optimization?')) {
        context?.getManualReplacements().clear();
        context?.onUpdate();
        renderModalContent();
      }
    });
  }

  // Global Reset All Overrides & Rules
  const resetAllBtn = container.querySelector('#reset-all-overrides-btn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all inclusions, exclusions, and manual swaps back to default portfolio optimization?')) {
        clearAllCompanyOverrides();
        context?.getExcludedIsins().clear();
        context?.getManualReplacements().clear();
        context?.onUpdate();
        renderModalContent();
      }
    });
  }
}
