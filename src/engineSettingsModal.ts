import {
  getEngineHyperparameters,
  saveEngineHyperparameters,
  resetEngineHyperparameters,
  DEFAULT_HYPERPARAMETERS,
  EngineHyperparameters
} from './engineSettingsManager';

interface EngineSettingsContext {
  getCurrentInvestment: () => number;
  onUpdate: () => void;
}

let context: EngineSettingsContext | null = null;

export function initEngineSettingsModal(ctx: EngineSettingsContext) {
  context = ctx;
  const attachTriggers = () => {
    document.querySelectorAll('[data-action="open-engine-settings"], #engine-settings-btn, #sidebar-engine-settings-btn, #nav-engine-settings-btn').forEach(btn => {
      btn.removeEventListener('click', openEngineSettingsModal);
      btn.addEventListener('click', openEngineSettingsModal);
    });
  };
  attachTriggers();
  // In case DOM nodes change
  setTimeout(attachTriggers, 100);
}

export function openEngineSettingsModal() {
  let modal = document.getElementById('engine-settings-modal') as HTMLDialogElement;
  if (!modal) {
    modal = createModalElement();
    document.body.appendChild(modal);
  }
  renderModalContent();
  modal.showModal();
}

export function closeEngineSettingsModal() {
  const modal = document.getElementById('engine-settings-modal') as HTMLDialogElement;
  if (modal) {
    modal.close();
  }
}

function createModalElement(): HTMLDialogElement {
  const dialog = document.createElement('dialog');
  dialog.id = 'engine-settings-modal';
  dialog.style.cssText = `
    border: 1px solid var(--border-glass);
    border-radius: 16px;
    background: #0f172a;
    color: var(--text-primary);
    padding: 0;
    width: 90%;
    max-width: 680px;
    max-height: 90vh;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    overflow: hidden;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    z-index: 10000;
  `;

  // Close when clicking on dialog backdrop area
  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      dialog.close();
    }
  });

  return dialog;
}

function renderModalContent() {
  const modal = document.getElementById('engine-settings-modal') as HTMLDialogElement;
  if (!modal) return;

  const currentHp = getEngineHyperparameters();
  const currentInvestment = context?.getCurrentInvestment() || 1000000;
  const currentIssuerRupeeCap = currentInvestment * (currentHp.maxSingleIssuerPct / 100);
  const currentSectorRupeeCap = currentInvestment * (currentHp.maxSingleSectorPct / 100);

  modal.innerHTML = `
    <div style="padding: 1.5rem 1.75rem; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02);">
      <div>
        <h2 style="margin: 0; font-size: 1.25rem; color: var(--accent-gold); display: flex; align-items: center; gap: 0.5rem;">
          ⚙️ Risk Parameters & Hyperparameters
        </h2>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">
          Configure diversification limits, concentration caps, and engine rules
        </p>
      </div>
      <button id="close-engine-settings-btn" style="background: none; border: none; font-size: 1.4rem; color: var(--text-secondary); cursor: pointer; line-height: 1;">&times;</button>
    </div>

    <div style="padding: 1.5rem 1.75rem; overflow-y: auto; max-height: calc(85vh - 130px); display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Parameter 1: Single Issuer Cap -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <label style="font-weight: 600; font-size: 0.92rem; color: #fff;">
            Max Single Issuer Allocation Cap (%)
          </label>
          <span style="font-size: 0.75rem; background: rgba(212, 175, 55, 0.2); color: var(--accent-gold); padding: 2px 8px; border-radius: 10px; font-weight: 600;">
            Sane Default: ${DEFAULT_HYPERPARAMETERS.maxSingleIssuerPct}%
          </span>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <input type="range" id="hp-issuer-range" min="5" max="50" step="1" value="${currentHp.maxSingleIssuerPct}" style="flex: 1; accent-color: var(--accent-gold);" />
          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <input type="number" id="hp-issuer-input" min="5" max="50" step="1" value="${currentHp.maxSingleIssuerPct}" style="width: 65px; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.35rem 0.5rem; color: #fff; text-align: center; font-weight: 600;" />
            <span style="font-weight: 600; color: var(--text-secondary);">%</span>
          </div>
        </div>
        <div id="hp-issuer-calc" style="font-size: 0.8rem; color: #60a5fa; margin-top: 0.4rem; font-family: monospace;">
          On ₹${(currentInvestment / 100000).toFixed(2)}L portfolio &rarr; Max ₹${(currentIssuerRupeeCap / 100000).toFixed(2)}L per company
        </div>
      </div>

      <!-- Parameter 2: Ticket Size Overflow Guard -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
          <div>
            <label style="font-weight: 600; font-size: 0.92rem; color: #fff; display: flex; align-items: center; gap: 0.4rem;">
              Allow Large Ticket Unit Overflow
            </label>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.3rem 0 0 0; line-height: 1.4;">
              If disabled (recommended), bonds with a physical unit size exceeding the single-issuer cap (e.g. ₹6.17L Edelweiss in a ₹10L portfolio) are eliminated to strictly protect diversification.
            </p>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; margin-top: 4px;">
            <input type="checkbox" id="hp-allow-overflow" ${currentHp.allowUnitOverflow ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;" />
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${currentHp.allowUnitOverflow ? '#10b981' : '#475569'}; border-radius: 24px; transition: .3s;">
              <span style="position: absolute; height: 18px; width: 18px; left: ${currentHp.allowUnitOverflow ? '23px' : '3px'}; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s;"></span>
            </span>
          </label>
        </div>
      </div>

      <!-- Parameter 3: Single Sector Cap -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <label style="font-weight: 600; font-size: 0.92rem; color: #fff;">
            Max Single Sector / Industry Cap (%)
          </label>
          <span style="font-size: 0.75rem; background: rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 2px 8px; border-radius: 10px; font-weight: 600;">
            Sane Default: ${DEFAULT_HYPERPARAMETERS.maxSingleSectorPct}%
          </span>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <input type="range" id="hp-sector-range" min="15" max="100" step="5" value="${currentHp.maxSingleSectorPct}" style="flex: 1; accent-color: var(--accent-blue);" />
          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <input type="number" id="hp-sector-input" min="15" max="100" step="5" value="${currentHp.maxSingleSectorPct}" style="width: 65px; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.35rem 0.5rem; color: #fff; text-align: center; font-weight: 600;" />
            <span style="font-weight: 600; color: var(--text-secondary);">%</span>
          </div>
        </div>
        <div id="hp-sector-calc" style="font-size: 0.8rem; color: #93c5fd; margin-top: 0.4rem; font-family: monospace;">
          On ₹${(currentInvestment / 100000).toFixed(2)}L portfolio &rarr; Max ₹${(currentSectorRupeeCap / 100000).toFixed(2)}L per sector
        </div>
      </div>

      <!-- Parameter 4 & 5: Sub-A (BBB) Rules & Tenor -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem;">
          <div style="font-weight: 600; font-size: 0.85rem; color: #fff; margin-bottom: 0.35rem;">
            Max Sub-A / BBB Allocation (%)
          </div>
          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <input type="number" id="hp-suba-input" min="0" max="100" step="5" value="${currentHp.maxSubAPct}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.4rem 0.5rem; color: #fff; font-weight: 600;" />
            <span style="font-weight: 600; color: var(--text-secondary);">%</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.35rem;">Default: ${DEFAULT_HYPERPARAMETERS.maxSubAPct}%</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem;">
          <div style="font-weight: 600; font-size: 0.85rem; color: #fff; margin-bottom: 0.35rem;">
            Max BBB Tenor Window (Months)
          </div>
          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <input type="number" id="hp-bbb-tenor-input" min="3" max="60" step="1" value="${currentHp.maxBBBTenorMonths}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.4rem 0.5rem; color: #fff; font-weight: 600;" />
            <span style="font-weight: 600; color: var(--text-secondary);">Mo</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.35rem;">Default: ${DEFAULT_HYPERPARAMETERS.maxBBBTenorMonths}m (Regulatory rule)</div>
        </div>
      </div>

      <!-- Parameter 6: Cashflow Stagger Tolerance -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <label style="font-weight: 600; font-size: 0.88rem; color: #fff;">
            Quarterly Coupon Stagger Yield Tolerance (%)
          </label>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">Default: ${DEFAULT_HYPERPARAMETERS.cashflowYieldTolerancePct}%</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 0.5rem 0;">
          Maximum yield reduction tolerated when swapping ON MATURITY bonds for periodic-coupon bonds to achieve quarterly cashflow targets.
        </p>
        <div style="display: flex; align-items: center; gap: 0.3rem; max-width: 150px;">
          <input type="number" id="hp-cf-tolerance-input" min="0.1" max="2.0" step="0.1" value="${currentHp.cashflowYieldTolerancePct}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.4rem 0.5rem; color: #fff; font-weight: 600;" />
          <span style="font-weight: 600; color: var(--text-secondary);">%</span>
        </div>
      </div>
    </div>

    <div style="padding: 1.25rem 1.75rem; border-top: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); flex-wrap: wrap; gap: 0.75rem;">
      <button id="reset-hp-defaults-btn" class="btn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-secondary); font-size: 0.85rem; padding: 0.5rem 1rem;">
        ↺ Reset to Sane Defaults
      </button>
      <div style="display: flex; gap: 0.6rem;">
        <button id="cancel-hp-btn" class="btn" style="background: transparent; border: 1px solid var(--border-glass); font-size: 0.85rem; padding: 0.5rem 1rem;">
          Cancel
        </button>
        <button id="save-hp-btn" class="btn" style="background: var(--accent-gold); color: #000; font-weight: 700; font-size: 0.85rem; padding: 0.5rem 1.25rem;">
          ✓ Apply Parameters
        </button>
      </div>
    </div>
  `;

  attachModalEventListeners(modal);
}

function attachModalEventListeners(modal: HTMLDialogElement) {
  const closeBtn = modal.querySelector('#close-engine-settings-btn');
  const cancelBtn = modal.querySelector('#cancel-hp-btn');
  const saveBtn = modal.querySelector('#save-hp-btn');
  const resetBtn = modal.querySelector('#reset-hp-defaults-btn');

  const issuerRange = modal.querySelector('#hp-issuer-range') as HTMLInputElement;
  const issuerInput = modal.querySelector('#hp-issuer-input') as HTMLInputElement;
  const issuerCalc = modal.querySelector('#hp-issuer-calc') as HTMLDivElement;

  const sectorRange = modal.querySelector('#hp-sector-range') as HTMLInputElement;
  const sectorInput = modal.querySelector('#hp-sector-input') as HTMLInputElement;
  const sectorCalc = modal.querySelector('#hp-sector-calc') as HTMLDivElement;

  const allowOverflow = modal.querySelector('#hp-allow-overflow') as HTMLInputElement;
  const subaInput = modal.querySelector('#hp-suba-input') as HTMLInputElement;
  const bbbTenorInput = modal.querySelector('#hp-bbb-tenor-input') as HTMLInputElement;
  const cfToleranceInput = modal.querySelector('#hp-cf-tolerance-input') as HTMLInputElement;

  const currentInvestment = context?.getCurrentInvestment() || 1000000;

  // Sync issuer slider & input
  if (issuerRange && issuerInput) {
    issuerRange.addEventListener('input', () => {
      issuerInput.value = issuerRange.value;
      const pct = parseFloat(issuerRange.value) || 15;
      const rupeeCap = currentInvestment * (pct / 100);
      issuerCalc.textContent = `On ₹${(currentInvestment / 100000).toFixed(2)}L portfolio → Max ₹${(rupeeCap / 100000).toFixed(2)}L per company`;
    });
    issuerInput.addEventListener('input', () => {
      issuerRange.value = issuerInput.value;
      const pct = parseFloat(issuerInput.value) || 15;
      const rupeeCap = currentInvestment * (pct / 100);
      issuerCalc.textContent = `On ₹${(currentInvestment / 100000).toFixed(2)}L portfolio → Max ₹${(rupeeCap / 100000).toFixed(2)}L per company`;
    });
  }

  // Sync sector slider & input
  if (sectorRange && sectorInput) {
    sectorRange.addEventListener('input', () => {
      sectorInput.value = sectorRange.value;
      const pct = parseFloat(sectorRange.value) || 35;
      const rupeeCap = currentInvestment * (pct / 100);
      sectorCalc.textContent = `On ₹${(currentInvestment / 100000).toFixed(2)}L portfolio → Max ₹${(rupeeCap / 100000).toFixed(2)}L per sector`;
    });
    sectorInput.addEventListener('input', () => {
      sectorRange.value = sectorInput.value;
      const pct = parseFloat(sectorInput.value) || 35;
      const rupeeCap = currentInvestment * (pct / 100);
      sectorCalc.textContent = `On ₹${(currentInvestment / 100000).toFixed(2)}L portfolio → Max ₹${(rupeeCap / 100000).toFixed(2)}L per sector`;
    });
  }

  // Allow overflow toggle appearance
  if (allowOverflow) {
    allowOverflow.addEventListener('change', () => {
      renderModalContent();
    });
  }

  // Close / Cancel
  closeBtn?.addEventListener('click', closeEngineSettingsModal);
  cancelBtn?.addEventListener('click', closeEngineSettingsModal);

  // Reset Sane Defaults
  resetBtn?.addEventListener('click', () => {
    if (confirm('Reset all engine parameters and risk limits back to Sane Defaults?')) {
      resetEngineHyperparameters();
      renderModalContent();
      context?.onUpdate();
    }
  });

  // Save & Apply
  saveBtn?.addEventListener('click', () => {
    const updated: Partial<EngineHyperparameters> = {
      maxSingleIssuerPct: parseFloat(issuerInput.value) || 15,
      maxSingleSectorPct: parseFloat(sectorInput.value) || 35,
      maxSubAPct: parseFloat(subaInput.value) || 25,
      maxBBBTenorMonths: parseFloat(bbbTenorInput.value) || 12,
      cashflowYieldTolerancePct: parseFloat(cfToleranceInput.value) || 0.5,
      allowUnitOverflow: !!allowOverflow.checked
    };
    saveEngineHyperparameters(updated);
    closeEngineSettingsModal();
    context?.onUpdate();
  });
}
