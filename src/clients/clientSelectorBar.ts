import {
  getAllClients,
  getActiveClient,
  setActiveClientId,
  createClient,
  resetToSampleClients
} from './clientManager';
import { DefaultBond } from '../defaultInventory';
import { openPurchaseSuggestionsModal } from './purchaseModal';
import { ClientCategory, ClientRiskProfile } from './types';
import { launchBuilderForClient } from './clientJourney';

export function renderClientSelectorBar(
  containerId: string,
  inventory: DefaultBond[],
  onClientSelected?: (clientId: string) => void
) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const clients = getAllClients();
  const activeClient = getActiveClient();
  const totalVal = activeClient.holdings.reduce((s, h) => s + h.estimatedMarketValue, 0);

  const riskColors = {
    'CONSERVATIVE': { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' },
    'BALANCED': { bg: 'rgba(212, 175, 55, 0.15)', text: '#fbbf24', border: 'rgba(212, 175, 55, 0.4)' },
    'AGGRESSIVE': { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' }
  };
  const rStyle = riskColors[activeClient.riskProfile] || riskColors['BALANCED'];

  container.innerHTML = `
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid var(--border-glass); border-radius: 12px; padding: 0.85rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
      
      <!-- Left: Client Selector & Profile Pill -->
      <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
        <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">
          👤 Active Client:
        </span>
        <select id="active-client-dropdown" style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 8px; color: #ffffff; font-weight: 700; font-size: 0.92rem; padding: 0.45rem 0.85rem; cursor: pointer; outline: none;">
          ${clients.map(c => `
            <option value="${c.id}" ${c.id === activeClient.id ? 'selected' : ''}>
              ${c.clientName} (${c.category} • ₹${((c.holdings.reduce((s, h) => s + h.estimatedMarketValue, 0) + c.availableCash) / 100000).toFixed(1)}L AUA)
            </option>
          `).join('')}
        </select>

        <span style="font-size: 0.75rem; background: ${rStyle.bg}; color: ${rStyle.text}; border: 1px solid ${rStyle.border}; padding: 3px 8px; border-radius: 6px; font-weight: 700;">
          ${activeClient.riskProfile} MANDATE
        </span>

        <span style="font-size: 0.82rem; color: #cbd5e1;">
          Holdings: <strong style="color: #fff;">₹${(totalVal / 100000).toFixed(2)}L</strong> | Deployable Cash: <strong style="color: #34d399;">₹${((activeClient.availableCash || 0) / 100000).toFixed(2)}L</strong>
        </span>
      </div>

      <!-- Right: Action Buttons -->
      <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
        <button id="build-proposal-client-btn" class="btn" style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(184, 134, 11, 0.15) 100%); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.4); font-weight: 700; font-size: 0.82rem; padding: 0.45rem 0.9rem; border-radius: 6px; cursor: pointer;">
          🏗️ Build Proposal
        </button>
        <button id="suggest-purchases-btn" class="btn" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 700; font-size: 0.82rem; padding: 0.45rem 0.9rem; border-radius: 6px; cursor: pointer;">
          🛒 Suggest Bond Purchases
        </button>

        <button id="create-new-client-btn" class="btn" style="background: rgba(212, 175, 55, 0.15); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.35); font-weight: 600; font-size: 0.82rem; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer;">
          ➕ New Client
        </button>

        <button id="reset-clients-btn" class="btn" style="background: rgba(255, 255, 255, 0.05); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.12); font-size: 0.78rem; padding: 0.45rem 0.75rem; border-radius: 6px; cursor: pointer;" title="Reset back to preloaded sample clients">
          ↺ Reset Samples
        </button>
      </div>

    </div>
  `;

  // Attach Listeners
  const dropdown = document.getElementById('active-client-dropdown') as HTMLSelectElement;
  dropdown?.addEventListener('change', (e) => {
    const selectedId = (e.target as HTMLSelectElement).value;
    setActiveClientId(selectedId);
    if (onClientSelected) onClientSelected(selectedId);
  });

  const buildPropBtn = document.getElementById('build-proposal-client-btn');
  buildPropBtn?.addEventListener('click', () => {
    launchBuilderForClient(activeClient.id);
  });

  const suggestBtn = document.getElementById('suggest-purchases-btn');
  suggestBtn?.addEventListener('click', () => {
    openPurchaseSuggestionsModal(activeClient, inventory, () => {
      renderClientSelectorBar(containerId, inventory, onClientSelected);
      if (onClientSelected) onClientSelected(activeClient.id);
    });
  });

  const newClientBtn = document.getElementById('create-new-client-btn');
  newClientBtn?.addEventListener('click', () => {
    openCreateClientModal(() => {
      renderClientSelectorBar(containerId, inventory, onClientSelected);
      if (onClientSelected) onClientSelected(getActiveClient().id);
    });
  });

  const resetBtn = document.getElementById('reset-clients-btn');
  resetBtn?.addEventListener('click', () => {
    if (confirm('Reset to standard pre-seeded sample clients? (This will restore Priya Patel, Rajesh Sharma, and Vikram Malhotra).')) {
      resetToSampleClients();
      renderClientSelectorBar(containerId, inventory, onClientSelected);
      if (onClientSelected) onClientSelected(getActiveClient().id);
    }
  });
}

export function openCreateClientModal(onClientCreated: () => void) {
  const existing = document.getElementById('create-client-modal-backdrop');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'create-client-modal-backdrop';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 1.5rem; box-sizing: border-box;
  `;

  modal.innerHTML = `
    <div style="background: #0f172a; border: 1px solid var(--border-glass); border-radius: 16px; width: 100%; max-width: 540px; padding: 2rem; color: #fff; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); font-family: var(--font-sans);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3 style="margin: 0; font-size: 1.25rem; color: var(--accent-gold);">Create New Client Portfolio</h3>
        <button id="close-new-client-modal-btn" style="background: none; border: none; font-size: 1.4rem; color: var(--text-secondary); cursor: pointer;">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Client Full Name</label>
          <input type="text" id="new-client-name" placeholder="e.g. Sunil Mehta (Family Office)" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 8px; color: #fff; padding: 0.55rem 0.75rem; box-sizing: border-box;" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Investor Category</label>
            <select id="new-client-category" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 8px; color: #fff; padding: 0.55rem 0.75rem;">
              <option value="HNI" selected>HNI</option>
              <option value="ULTRA_HNI">Ultra HNI</option>
              <option value="FAMILY_OFFICE">Family Office</option>
              <option value="CORPORATE_TREASURY">Corporate Treasury</option>
              <option value="RETAIL_SENIOR">Retail Senior</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Risk Profile</label>
            <select id="new-client-risk" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 8px; color: #fff; padding: 0.55rem 0.75rem;">
              <option value="CONSERVATIVE">Conservative (AAA/AA)</option>
              <option value="BALANCED" selected>Balanced (AA/A)</option>
              <option value="AGGRESSIVE">Aggressive (High Yield)</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Available Cash (₹)</label>
            <input type="number" id="new-client-cash" value="1000000" step="50000" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 8px; color: #34d399; font-weight: 700; padding: 0.55rem 0.75rem; box-sizing: border-box;" />
          </div>
          <div>
            <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Target Yield (%)</label>
            <input type="number" id="new-client-yield" value="11.0" step="0.1" style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 8px; color: #fff; padding: 0.55rem 0.75rem; box-sizing: border-box;" />
          </div>
        </div>

        <div>
          <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Advisory Notes</label>
          <textarea id="new-client-notes" rows="2" placeholder="Specific liquidity or sector requirements..." style="width: 100%; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 8px; color: #fff; padding: 0.55rem 0.75rem; box-sizing: border-box; resize: vertical;"></textarea>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button id="cancel-create-client-btn" class="btn" style="background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); padding: 0.5rem 1rem; border-radius: 8px;">Cancel</button>
        <button id="submit-create-client-btn" class="btn" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px;">Create Only</button>
     <button id="submit-and-build-client-btn" class="btn" style="background: linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%); color: #0f172a; font-weight: 700; border: none; padding: 0.5rem 1.25rem; border-radius: 8px;">🏗️ Create & Build Proposal</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = document.getElementById('close-new-client-modal-btn');
  const cancelBtn = document.getElementById('cancel-create-client-btn');
  const submitBtn = document.getElementById('submit-create-client-btn');

  closeBtn?.addEventListener('click', () => modal.remove());
  cancelBtn?.addEventListener('click', () => modal.remove());

  const submitAndBuildBtn = document.getElementById('submit-and-build-client-btn');
  submitAndBuildBtn?.addEventListener('click', () => {
    const nameInput = document.getElementById('new-client-name') as HTMLInputElement;
    const catSelect = document.getElementById('new-client-category') as HTMLSelectElement;
    const riskSelect = document.getElementById('new-client-risk') as HTMLSelectElement;
    const cashInput = document.getElementById('new-client-cash') as HTMLInputElement;
    const yieldInput = document.getElementById('new-client-yield') as HTMLInputElement;
    const notesInput = document.getElementById('new-client-notes') as HTMLTextAreaElement;

    const name = nameInput.value.trim();
    if (!name) {
      alert('Please enter a client name.');
      return;
    }

    const created = createClient({
      clientName: name,
      category: catSelect.value as ClientCategory,
      riskProfile: riskSelect.value as ClientRiskProfile,
      availableCash: parseFloat(cashInput.value) || 0,
      targetYieldPercent: parseFloat(yieldInput.value) || 10.5,
      notes: notesInput.value.trim()
    });

    setActiveClientId(created.id);
    modal.remove();
    onClientCreated();
    launchBuilderForClient(created.id);
  });

  submitBtn?.addEventListener('click', () => {
    const nameInput = document.getElementById('new-client-name') as HTMLInputElement;
    const catSelect = document.getElementById('new-client-category') as HTMLSelectElement;
    const riskSelect = document.getElementById('new-client-risk') as HTMLSelectElement;
    const cashInput = document.getElementById('new-client-cash') as HTMLInputElement;
    const yieldInput = document.getElementById('new-client-yield') as HTMLInputElement;
    const notesInput = document.getElementById('new-client-notes') as HTMLTextAreaElement;

    const name = nameInput.value.trim();
    if (!name) {
      alert('Please enter a client name.');
      return;
    }

    const created = createClient({
      clientName: name,
      category: catSelect.value as ClientCategory,
      riskProfile: riskSelect.value as ClientRiskProfile,
      availableCash: parseFloat(cashInput.value) || 0,
      targetYieldPercent: parseFloat(yieldInput.value) || 10.5,
      notes: notesInput.value.trim()
    });

    setActiveClientId(created.id);
    modal.remove();
    onClientCreated();
  });
}
