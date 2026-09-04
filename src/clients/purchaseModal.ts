import { DefaultBond } from '../defaultInventory';
import { PortfolioHolding } from '../analyzer/types';
import { ClientPortfolio } from './types';
import { generatePurchaseSuggestions } from './purchaseRecommender';
import { saveClient } from './clientManager';

export function openPurchaseSuggestionsModal(
  clientOrHoldings: ClientPortfolio | PortfolioHolding[],
  inventory: DefaultBond[],
  onPurchasesExecuted?: () => void
) {
  const existing = document.getElementById('purchase-suggestions-modal-backdrop');
  if (existing) existing.remove();

  const isClient = 'holdings' in clientOrHoldings;
  const initialCash = isClient ? (clientOrHoldings.availableCash || 500000) : 500000;
  let currentCash = initialCash;

  const modal = document.createElement('div');
  modal.id = 'purchase-suggestions-modal-backdrop';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 1.5rem; box-sizing: border-box;
  `;

  function renderModalBody() {
    const plan = generatePurchaseSuggestions(clientOrHoldings, inventory, currentCash);

    modal.innerHTML = `
      <div style="background: #0f172a; border: 1px solid var(--border-glass); border-radius: 16px; width: 100%; max-width: 880px; max-height: 90vh; overflow-y: auto; padding: 2rem; color: #fff; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); font-family: var(--font-sans);">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.25rem;">🛒</span>
              <h3 style="margin: 0; font-size: 1.3rem; color: var(--accent-gold); font-weight: 700;">
                Latest Inventory Bond Purchase Recommendations
              </h3>
            </div>
            <p style="margin: 0.35rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">
              Optimal high-yield additions filtered from ${inventory.length} active bonds in live inventory (accounting for unit prices & concentration limits)
            </p>
          </div>
          <button id="close-purchase-modal-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; padding: 0 0.5rem; line-height: 1;">✕</button>
        </div>

        <!-- Cash Allocation Controls -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="flex: 1; min-width: 220px;">
            <label style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">
              Deployable Cash Balance (₹):
            </label>
            <input type="number" id="purchase-cash-input" value="${currentCash}" step="50000" min="50000" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--border-glass); border-radius: 8px; color: #34d399; font-weight: 800; font-size: 1.1rem; padding: 0.5rem 0.75rem; box-sizing: border-box;" />
          </div>

          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-secondary);">Targeted Deployed</div>
              <div style="font-size: 1.1rem; font-weight: 800; color: #fff;">₹${(plan.totalDeployed / 100000).toFixed(2)}L</div>
            </div>
            <div>
              <div style="font-size: 0.72rem; color: var(--text-secondary);">Blended Yield Impact</div>
              <div style="font-size: 1.1rem; font-weight: 800; color: #34d399;">
                ${plan.originalYield.toFixed(2)}% → ${plan.projectedNewYield.toFixed(2)}%
                <span style="font-size: 0.75rem; color: #10b981;">(${plan.yieldPickup >= 0 ? '+' : ''}${plan.yieldPickup.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations List -->
        ${plan.recommendations.length === 0 ? `
          <div style="padding: 2rem; text-align: center; color: var(--text-secondary); background: rgba(0,0,0,0.2); border-radius: 10px; margin-bottom: 1.5rem;">
            No suitable inventory bonds found within the specified cash limit. Increase deployable cash to match minimum lot prices.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.5rem;">
            ${plan.recommendations.map(r => `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 1; min-width: 280px;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                    <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">${r.bond.issuer}</span>
                    <span style="font-family: monospace; font-size: 0.75rem; color: var(--accent-gold); background: rgba(212,175,55,0.1); padding: 1px 6px; border-radius: 4px;">${r.bond.isin}</span>
                    <span style="font-size: 0.72rem; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 1px 6px; border-radius: 4px; font-weight: 700;">${r.bond.rating}</span>
                  </div>
                  <div style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.45;">
                    💡 ${r.diversificationGain} • ${r.tenureFitRationale}
                  </div>
                </div>

                <div style="text-align: right; min-width: 160px;">
                  <div style="font-size: 1.15rem; font-weight: 800; color: #34d399;">${r.projectedYield.toFixed(2)}%</div>
                  <div style="font-size: 0.78rem; color: #fff; font-weight: 700; margin-top: 2px;">
                    ${r.suggestedUnits} Unit(s) @ ₹${(r.allocatedAmount / 100000).toFixed(2)}L
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-secondary);">
                    Unit Price: ₹${(r.unitPrice).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <!-- Footer Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.25rem;">
          <button id="cancel-purchase-btn" class="btn" style="background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.15); padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer;">
            Close
          </button>
          ${isClient && plan.recommendations.length > 0 ? `
            <button id="execute-purchase-btn" class="btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; font-weight: 700; padding: 0.5rem 1.25rem; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
              ✓ Execute & Add to ${clientOrHoldings.clientName}
            </button>
          ` : ''}
        </div>

      </div>
    `;

    // Attach Listeners
    const closeBtn = document.getElementById('close-purchase-modal-btn');
    const cancelBtn = document.getElementById('cancel-purchase-btn');
    const cashInput = document.getElementById('purchase-cash-input') as HTMLInputElement;
    const executeBtn = document.getElementById('execute-purchase-btn');

    closeBtn?.addEventListener('click', () => modal.remove());
    cancelBtn?.addEventListener('click', () => modal.remove());

    cashInput?.addEventListener('change', () => {
      const val = parseFloat(cashInput.value) || 0;
      if (val > 0) {
        currentCash = val;
        renderModalBody();
      }
    });

    executeBtn?.addEventListener('click', () => {
      if (!isClient) return;
      
      const client = clientOrHoldings as ClientPortfolio;
      // Convert recommendations to PortfolioHoldings
      const newHoldings: PortfolioHolding[] = plan.recommendations.map(r => ({
        srNo: client.holdings.length + 1,
        isin: r.bond.isin,
        securityName: r.bond.issuer,
        readableName: r.bond.issuer,
        qty: r.suggestedUnits,
        faceValue: r.bond.faceValue || 100000,
        estimatedMarketValue: r.allocatedAmount,
        couponPercent: r.projectedYield,
        yieldPercent: r.projectedYield,
        maturityDate: r.bond.maturity || '2028-12-31',
        monthsToMaturity: r.bond.months || 24,
        frequency: r.bond.frequency || 'ANNUAL',
        rating: r.bond.rating,
        ratingAgency: r.bond.rating ? r.bond.rating.split(' ')[0] : 'CRISIL',
        ratingTrend: r.bond.ratingTrend || 'stable',
        issuerName: r.bond.issuer,
        parentGroup: r.bond.issuer,
        sector: r.bond.sector || 'Financial Services',
        broadSector: 'Diversified Financials & Asset Mgmt',
        subSector: 'Corporate Bonds',
        isSecured: true,
        weightPercent: 0
      }));

      client.holdings.push(...newHoldings);
      client.availableCash = Math.max(0, client.availableCash - plan.totalDeployed);
      saveClient(client);

      alert(`Successfully added ${newHoldings.length} bond(s) to ${client.clientName} (₹${(plan.totalDeployed/100000).toFixed(2)}L deployed)!`);
      modal.remove();

      if (onPurchasesExecuted) onPurchasesExecuted();
    });
  }

  document.body.appendChild(modal);
  renderModalBody();

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}
