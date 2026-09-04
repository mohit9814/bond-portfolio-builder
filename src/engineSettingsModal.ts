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
    max-width: 720px;
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

function updateToggleUI(
  checkbox: HTMLInputElement | null,
  activeBg: string,
  activeLeft: string,
  inactiveLeft = '3px'
) {
  if (!checkbox) return;
  const parent = checkbox.closest('label');
  const track = parent?.querySelector('.toggle-track') as HTMLElement | null;
  const knob = parent?.querySelector('.toggle-knob') as HTMLElement | null;
  if (track && knob) {
    track.style.backgroundColor = checkbox.checked ? activeBg : '#475569';
    knob.style.left = checkbox.checked ? activeLeft : inactiveLeft;
  }
}

function renderModalContent() {
  const modal = document.getElementById('engine-settings-modal') as HTMLDialogElement;
  if (!modal) return;

  const currentHp = getEngineHyperparameters();
  const currentInvestment = context?.getCurrentInvestment() || 1000000;
  const currentIssuerRupeeCap = currentInvestment * (currentHp.maxSingleIssuerPct / 100);
  const currentSectorRupeeCap = currentInvestment * (currentHp.maxSingleSectorPct / 100);

  modal.innerHTML = `
    <div style="padding: 1.4rem 1.75rem; border-bottom: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02);">
      <div>
        <h2 style="margin: 0; font-size: 1.25rem; color: var(--accent-gold); display: flex; align-items: center; gap: 0.5rem;">
          ⚙️ Risk Parameters & Hyperparameters
        </h2>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">
          Fine-tune diversification caps, fundamental risk tenure rules, and investor concentration
        </p>
      </div>
      <button id="close-engine-settings-btn" style="background: none; border: none; font-size: 1.4rem; color: var(--text-secondary); cursor: pointer; line-height: 1;">&times;</button>
    </div>

    <div style="padding: 1.4rem 1.75rem; overflow-y: auto; max-height: calc(85vh - 130px); display: flex; flex-direction: column; gap: 1.15rem;">
      
      <!-- Section A: Diversification & Issuer Caps -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <label style="font-weight: 600; font-size: 0.92rem; color: #fff;">
            Max Single Issuer Allocation Cap (%)
          </label>
          <span style="font-size: 0.75rem; background: rgba(212, 175, 55, 0.2); color: var(--accent-gold); padding: 2px 8px; border-radius: 10px; font-weight: 600;">
            Default: ${DEFAULT_HYPERPARAMETERS.maxSingleIssuerPct}%
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

      <!-- Section B: Fundamental Risk-Adjusted Tenure Rules -->
      <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 1.1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem;">
          <div>
            <label style="font-weight: 700; font-size: 0.92rem; color: #34d399; display: flex; align-items: center; gap: 0.4rem;">
              <span>🛡️</span> Fundamental Risk-Adjusted Tenure Capping
            </label>
            <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0.25rem 0 0 0; line-height: 1.4;">
              <strong>Higher risk on bond &rarr; Lower allowable tenure:</strong> Automatically limits holding periods for high-risk / low-fundamental score bonds to reduce exposure duration.
            </p>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; margin-top: 4px; cursor: pointer;">
            <input type="checkbox" id="hp-enable-tenure-cap" ${currentHp.enableFundamentalTenureCapping ? 'checked' : ''} style="position: absolute; opacity: 0; width: 0; height: 0; margin: 0;" />
            <span class="toggle-track" style="position: absolute; inset: 0; background-color: ${currentHp.enableFundamentalTenureCapping ? '#10b981' : '#475569'}; border-radius: 24px; transition: background-color 0.2s ease;">
              <span class="toggle-knob" style="position: absolute; height: 18px; width: 18px; left: ${currentHp.enableFundamentalTenureCapping ? '23px' : '3px'}; bottom: 3px; background-color: white; border-radius: 50%; transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></span>
            </span>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-top: 0.5rem;">
          <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
            <div style="font-size: 0.78rem; font-weight: 600; color: #f87171; margin-bottom: 0.3rem;">
              Max High-Risk / Sub-A Tenor
            </div>
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <input type="number" id="hp-high-risk-tenor-input" min="6" max="36" step="1" value="${currentHp.maxHighRiskTenorMonths}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.35rem 0.5rem; color: #fff; font-weight: 600;" />
              <span style="font-size: 0.8rem; color: var(--text-secondary);">Mo</span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem;">Default: ${DEFAULT_HYPERPARAMETERS.maxHighRiskTenorMonths}m (Sub-A / Gov &lt; 65)</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
            <div style="font-size: 0.78rem; font-weight: 600; color: #fbbf24; margin-bottom: 0.3rem;">
              Max Moderate-Risk (A-Tier) Tenor
            </div>
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <input type="number" id="hp-mod-risk-tenor-input" min="12" max="60" step="1" value="${currentHp.maxModerateRiskTenorMonths}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.35rem 0.5rem; color: #fff; font-weight: 600;" />
              <span style="font-size: 0.8rem; color: var(--text-secondary);">Mo</span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem;">Default: ${DEFAULT_HYPERPARAMETERS.maxModerateRiskTenorMonths}m (A/A- Grade)</div>
          </div>
        </div>
      </div>

      <!-- Section C: Investor Risk Profile Concentration Rules -->
      <div style="background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1.1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem;">
          <div>
            <label style="font-weight: 700; font-size: 0.92rem; color: #38bdf8; display: flex; align-items: center; gap: 0.4rem;">
              <span>⚖️</span> Investor Risk Profile Concentration Scaling
            </label>
            <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0.25rem 0 0 0; line-height: 1.4;">
              <strong>Higher risk appetite &rarr; Lower concentration of risky bonds:</strong> Aggressive portfolios accept higher-yield bonds but enforce granular caps (e.g. max 8% per risky issuer) to prevent single-default damage.
            </p>
          </div>
          <label style="position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; margin-top: 4px; cursor: pointer;">
            <input type="checkbox" id="hp-enable-risk-conc" ${currentHp.enableInvestorRiskConcentration ? 'checked' : ''} style="position: absolute; opacity: 0; width: 0; height: 0; margin: 0;" />
            <span class="toggle-track" style="position: absolute; inset: 0; background-color: ${currentHp.enableInvestorRiskConcentration ? '#38bdf8' : '#475569'}; border-radius: 24px; transition: background-color 0.2s ease;">
              <span class="toggle-knob" style="position: absolute; height: 18px; width: 18px; left: ${currentHp.enableInvestorRiskConcentration ? '23px' : '3px'}; bottom: 3px; background-color: white; border-radius: 50%; transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></span>
            </span>
          </label>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-top: 0.5rem;">
          <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
            <div style="font-size: 0.78rem; font-weight: 600; color: #38bdf8; margin-bottom: 0.3rem;">
              Risky Issuer Cap (Aggressive)
            </div>
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <input type="number" id="hp-risky-conc-input" min="3" max="20" step="1" value="${currentHp.maxRiskyIssuerConcentrationPct}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.35rem 0.5rem; color: #fff; font-weight: 600;" />
              <span style="font-size: 0.8rem; color: var(--text-secondary);">%</span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem;">Default: ${DEFAULT_HYPERPARAMETERS.maxRiskyIssuerConcentrationPct}% (Granular cap)</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.75rem;">
            <div style="font-size: 0.78rem; font-weight: 600; color: #a5b4fc; margin-bottom: 0.3rem;">
              Sub-AA Cap (Conservative)
            </div>
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <input type="number" id="hp-cons-suba-input" min="0" max="30" step="1" value="${currentHp.conservativeSubAACapPct}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.35rem 0.5rem; color: #fff; font-weight: 600;" />
              <span style="font-size: 0.8rem; color: var(--text-secondary);">%</span>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem;">Default: ${DEFAULT_HYPERPARAMETERS.conservativeSubAACapPct}% max Sub-AA</div>
          </div>
        </div>
      </div>

      <!-- Section D: Other Constraints & Overflows -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <!-- Sector Cap -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
          <div style="font-weight: 600; font-size: 0.85rem; color: #fff; margin-bottom: 0.35rem;">
            Max Single Sector Cap (%)
          </div>
          <div style="display: flex; align-items: center; gap: 0.3rem;">
            <input type="number" id="hp-sector-input" min="15" max="100" step="5" value="${currentHp.maxSingleSectorPct}" style="width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 0.4rem 0.5rem; color: #fff; font-weight: 600;" />
            <span style="font-weight: 600; color: var(--text-secondary);">%</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.35rem;">Default: ${DEFAULT_HYPERPARAMETERS.maxSingleSectorPct}%</div>
        </div>

        <!-- Ticket Overflow -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 0.85rem; color: #fff;">
              Allow Unit Overflow
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">Permit unit > issuer cap</div>
          </div>
          <label style="position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; cursor: pointer;">
            <input type="checkbox" id="hp-allow-overflow" ${currentHp.allowUnitOverflow ? 'checked' : ''} style="position: absolute; opacity: 0; width: 0; height: 0; margin: 0;" />
            <span class="toggle-track" style="position: absolute; inset: 0; background-color: ${currentHp.allowUnitOverflow ? '#10b981' : '#475569'}; border-radius: 22px; transition: background-color 0.2s ease;">
              <span class="toggle-knob" style="position: absolute; height: 16px; width: 16px; left: ${currentHp.allowUnitOverflow ? '21px' : '3px'}; bottom: 3px; background-color: white; border-radius: 50%; transition: left 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></span>
            </span>
          </label>
        </div>
      </div>

    </div>

    <div style="padding: 1.1rem 1.75rem; border-top: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); flex-wrap: wrap; gap: 0.75rem;">
      <button id="reset-hp-defaults-btn" class="btn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-secondary); font-size: 0.85rem; padding: 0.5rem 1rem;">
        ↺ Reset to Sane Defaults
      </button>
      <div style="display: flex; gap: 0.6rem;">
        <button id="cancel-hp-btn" class="btn" style="background: transparent; border: 1px solid var(--border-glass); font-size: 0.85rem; padding: 0.5rem 1rem;">
          Cancel
        </button>
        <button id="save-hp-btn" class="btn" style="background: var(--accent-gold); color: #000; font-weight: 700; font-size: 0.85rem; padding: 0.5rem 1.25rem;">
          ✓ Apply Risk Parameters
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

  const issuerRange = modal.querySelector('#hp-issuer-range') as HTMLInputElement | null;
  const issuerInput = modal.querySelector('#hp-issuer-input') as HTMLInputElement | null;
  const issuerCalc = modal.querySelector('#hp-issuer-calc') as HTMLDivElement | null;

  const sectorInput = modal.querySelector('#hp-sector-input') as HTMLInputElement | null;
  const allowOverflow = modal.querySelector('#hp-allow-overflow') as HTMLInputElement | null;
  const enableTenureCap = modal.querySelector('#hp-enable-tenure-cap') as HTMLInputElement | null;
  const highRiskTenorInput = modal.querySelector('#hp-high-risk-tenor-input') as HTMLInputElement | null;
  const modRiskTenorInput = modal.querySelector('#hp-mod-risk-tenor-input') as HTMLInputElement | null;
  const enableRiskConc = modal.querySelector('#hp-enable-risk-conc') as HTMLInputElement | null;
  const riskyConcInput = modal.querySelector('#hp-risky-conc-input') as HTMLInputElement | null;
  const consSubAInput = modal.querySelector('#hp-cons-suba-input') as HTMLInputElement | null;

  const currentInvestment = context?.getCurrentInvestment() || 1000000;

  if (issuerRange && issuerInput && issuerCalc) {
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

  // Smooth toggle interactivity without destructive DOM wipe
  allowOverflow?.addEventListener('change', () => {
    updateToggleUI(allowOverflow, '#10b981', '21px', '3px');
  });
  enableTenureCap?.addEventListener('change', () => {
    updateToggleUI(enableTenureCap, '#10b981', '23px', '3px');
  });
  enableRiskConc?.addEventListener('change', () => {
    updateToggleUI(enableRiskConc, '#38bdf8', '23px', '3px');
  });

  closeBtn?.addEventListener('click', closeEngineSettingsModal);
  cancelBtn?.addEventListener('click', closeEngineSettingsModal);

  resetBtn?.addEventListener('click', () => {
    if (confirm('Reset all engine parameters and risk limits back to Sane Defaults?')) {
      resetEngineHyperparameters();
      renderModalContent();
      context?.onUpdate();
    }
  });

  saveBtn?.addEventListener('click', () => {
    const updated: Partial<EngineHyperparameters> = {
      maxSingleIssuerPct: parseFloat(issuerInput?.value || '15') || 15,
      maxSingleSectorPct: parseFloat(sectorInput?.value || '35') || 35,
      allowUnitOverflow: !!allowOverflow?.checked,
      enableFundamentalTenureCapping: !!enableTenureCap?.checked,
      maxHighRiskTenorMonths: parseFloat(highRiskTenorInput?.value || '18') || 18,
      maxModerateRiskTenorMonths: parseFloat(modRiskTenorInput?.value || '36') || 36,
      enableInvestorRiskConcentration: !!enableRiskConc?.checked,
      maxRiskyIssuerConcentrationPct: parseFloat(riskyConcInput?.value || '8') || 8,
      conservativeSubAACapPct: parseFloat(consSubAInput?.value || '10') || 10
    };
    saveEngineHyperparameters(updated);
    closeEngineSettingsModal();
    context?.onUpdate();
  });
}
