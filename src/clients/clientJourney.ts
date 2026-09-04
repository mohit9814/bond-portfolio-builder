import { getClientById, updateClient, setActiveClientId, getActiveClient } from './clientManager';
import { PortfolioHolding } from '../analyzer/types';
import { PortfolioSummary, getUnitPrice } from '../bondEngine';
import { ClientPortfolio } from './types';

let activeProposalClientId: string | null = null;

export function getActiveProposalClientId(): string | null {
  return activeProposalClientId;
}

export function setActiveProposalClientId(clientId: string | null): void {
  activeProposalClientId = clientId;
}

/**
 * Pre-populates the Portfolio Builder controls with a client's mandate and switches to Builder tab.
 */
export function launchBuilderForClient(clientId: string, onNavigateToBuilder?: () => void): void {
  const client = getClientById(clientId);
  if (!client) return;

  activeProposalClientId = client.id;
  setActiveClientId(client.id);

  // 1. Pre-fill DOM Controls if in browser
  if (typeof document !== 'undefined') {
    const amountInput = document.getElementById('investment-amount') as HTMLInputElement;
    const helper = document.getElementById('investment-helper');
    const catSelect = document.getElementById('investor-category') as HTMLSelectElement;
    const stratSelect = document.getElementById('allocation-strategy') as HTMLSelectElement;
    const yieldInput = document.getElementById('target-yield') as HTMLInputElement;
    const minRatingSelect = document.getElementById('min-rating') as HTMLSelectElement;

    const deployableAmount = client.availableCash > 0 ? client.availableCash : 1000000;
    if (amountInput) {
      amountInput.value = deployableAmount.toString();
      if (helper) {
        helper.textContent = `₹${(deployableAmount / 100000).toFixed(2)} Lakhs`;
      }
    }

    if (catSelect) {
      catSelect.value = client.category === 'RETAIL_SENIOR' ? 'senior' : 'general';
    }

    if (stratSelect) {
      stratSelect.value = client.riskProfile === 'AGGRESSIVE' ? 'smart' : 'equal';
    }

    if (yieldInput && client.targetYieldPercent) {
      yieldInput.value = client.targetYieldPercent.toString();
    }

    if (minRatingSelect) {
      minRatingSelect.value = client.riskProfile === 'CONSERVATIVE' ? 'A' : client.riskProfile === 'BALANCED' ? 'A' : 'BBB-';
    }

    // 2. Render Active Client Proposal Banner in Builder
    renderClientProposalBanner(client);

    // 3. Switch Tab to Builder
    if (onNavigateToBuilder) {
      onNavigateToBuilder();
    } else {
      const builderTabBtn = document.getElementById('tab-builder');
      builderTabBtn?.click();
    }
  }

  // Trigger recalculation if trigger exists
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('client-mandate-loaded'));
  }
}

/**
 * Renders the top contextual banner in Builder View when proposing for a specific client.
 */
export function renderClientProposalBanner(client: ClientPortfolio | null): void {
  let banner = document.getElementById('client-proposal-active-banner');
  
  if (!client) {
    if (banner) banner.style.display = 'none';
    return;
  }

  if (!banner) {
    const builderView = document.getElementById('builder-view');
    if (!builderView) return;
    banner = document.createElement('div');
    banner.id = 'client-proposal-active-banner';
    builderView.insertBefore(banner, builderView.firstChild);
  }

  banner.style.display = 'flex';
  banner.style.cssText = `
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: 12px;
    padding: 0.85rem 1.25rem;
    margin-bottom: 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.85rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  `;

  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
      <span style="font-size: 1.3rem;">👤</span>
      <div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <strong style="font-size: 0.95rem; color: #fff;">
            Building Proposal for: ${client.clientName}
          </strong>
          <span style="background: rgba(212, 175, 55, 0.2); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">
            ${client.category}
          </span>
          <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">
            ${client.riskProfile} MANDATE
          </span>
        </div>
        <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.2rem;">
          Available Cash: <strong style="color: #34d399;">₹${((client.availableCash || 0) / 100000).toFixed(2)}L</strong> | Target Yield: <strong style="color: #fff;">${client.targetYieldPercent}%</strong>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 0.6rem; align-items: center;">
      <button id="commit-proposal-to-client-btn" style="
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff; border: none; font-weight: 700; font-size: 0.82rem;
        padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;
        display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
      ">
        💾 Save & Commit Proposal to Client
      </button>

      <button id="exit-client-proposal-btn" style="
        background: rgba(255, 255, 255, 0.08); color: #94a3b8;
        border: 1px solid rgba(255, 255, 255, 0.15); font-size: 0.8rem;
        padding: 0.5rem 0.75rem; border-radius: 8px; cursor: pointer;
      ">
        ✕ Exit Mode
      </button>
    </div>
  `;

  const commitBtn = banner.querySelector('#commit-proposal-to-client-btn');
  const exitBtn = banner.querySelector('#exit-client-proposal-btn');

  commitBtn?.addEventListener('click', () => {
    const summary = (window as any).latestSummary as PortfolioSummary;
    if (!summary || !summary.selectedBonds || summary.selectedBonds.length === 0) {
      alert('No bond proposal generated yet. Please configure the inputs and generate a portfolio.');
      return;
    }
    commitProposalToClient(client.id, summary);
  });

  exitBtn?.addEventListener('click', () => {
    activeProposalClientId = null;
    banner.style.display = 'none';
  });
}

/**
 * Commits the generated bond proposal into the client's live portfolio storage.
 */
export function commitProposalToClient(clientId: string, summary: PortfolioSummary): void {
  const client = getClientById(clientId);
  if (!client) return;

  const deployedAmount = summary.totalInvestment;
  const newHoldings: PortfolioHolding[] = summary.selectedBonds.map(b => {
    const unitPrice = getUnitPrice(b);
    const qty = Math.round(b.allocatedAmount / unitPrice) || 1;
    return {
      isin: b.isin,
      securityName: b.issuer,
      faceValue: b.faceValue || 100000,
      quantity: qty,
      acquisitionPrice: unitPrice,
      couponRate: (b.coupon ?? b.yield) * 100,
      maturityDate: b.maturity,
      estimatedMarketValue: b.allocatedAmount,
      category: 'Bonds',
      subSector: b.category || 'NBFC',
      creditRating: b.rating
    };
  });

  const updatedCash = Math.max(0, client.availableCash - deployedAmount);
  const updatedClient: ClientPortfolio = {
    ...client,
    holdings: [...client.holdings, ...newHoldings],
    availableCash: updatedCash,
    updatedAt: new Date().toISOString().split('T')[0]
  };

  updateClient(updatedClient);
  if (typeof alert !== 'undefined') {
    alert(`🎉 Successfully committed ${newHoldings.length} bonds (₹${(deployedAmount / 100000).toFixed(2)}L) into ${client.clientName}'s portfolio!`);
  }

  // Navigate to Analyzer tab to view the updated portfolio
  if (typeof document !== 'undefined') {
    const analyzerTabBtn = document.getElementById('tab-analyzer');
    analyzerTabBtn?.click();

    // Hide banner
    activeProposalClientId = null;
    const banner = document.getElementById('client-proposal-active-banner');
    if (banner) banner.style.display = 'none';
  }
}
