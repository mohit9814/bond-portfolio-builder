import { PortfolioHolding, PortfolioRiskAssessment } from './types';
import { DefaultBond } from '../defaultInventory';
import { getIssuerKnowledge } from './issuerKnowledgeDatabase';
import { generateBondDeepInsight } from './riskEngine';
import { adoptRebalanceAction, getAdoptedActions } from './rebalancingPlanManager';

export function openBondInsightModal(
  holding: PortfolioHolding,
  allHoldings: PortfolioHolding[],
  availableInventory: DefaultBond[],
  assessment: PortfolioRiskAssessment | null,
  onPlanUpdated?: () => void
) {
  const existingModal = document.getElementById('bond-insight-modal-backdrop');
  if (existingModal) existingModal.remove();

  const knowledge = getIssuerKnowledge(holding.securityName + ' ' + holding.isin + ' ' + holding.issuerName);
  const insight = generateBondDeepInsight(holding, allHoldings, availableInventory, assessment);
  const adoptedActions = getAdoptedActions();
  const currentAdoptedSwap = adoptedActions.find(a => a.sellHolding.isin === holding.isin);

  const modal = document.createElement('div');
  modal.id = 'bond-insight-modal-backdrop';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 1.5rem; box-sizing: border-box;
  `;

  const verdictColors = {
    'HOLD': { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)', icon: '✅' },
    'EXIT_AND_ROTATE': { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)', icon: '🚨' },
    'TRIM_CONCENTRATION': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)', icon: '⚠️' },
    'REINVEST_ON_MATURITY': { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)', icon: '📅' }
  };

  const vStyle = verdictColors[insight.verdict] || verdictColors['HOLD'];
  const historicalRatings = (knowledge.historicalRatings && knowledge.historicalRatings.length > 0)
    ? knowledge.historicalRatings
    : (holding.historicalRatings || []);

  modal.innerHTML = `
    <div style="background: #0f172a; border: 1px solid var(--border-glass); border-radius: 16px; width: 100%; max-width: 860px; max-height: 90vh; overflow-y: auto; padding: 2rem; color: #fff; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); font-family: var(--font-sans);">
      
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <span style="font-family: monospace; font-size: 0.85rem; color: var(--accent-gold); background: rgba(212,175,55,0.1); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.25);">
              ${holding.isin}
            </span>
            <h3 style="margin: 0; font-size: 1.25rem; color: #fff; font-weight: 700;">${holding.readableName || holding.securityName}</h3>
          </div>
          <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.35rem;">
            Issuer: <strong style="color: #38bdf8;">${holding.issuerName}</strong> • Parent: <strong style="color: #93c5fd;">${holding.parentGroup}</strong> • Sector: <strong style="color: #e2e8f0;">${holding.broadSector || holding.sector}</strong> (${holding.subSector || 'General'})
          </div>
        </div>
        <button id="close-bond-insight-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; padding: 0 0.5rem; line-height: 1;">✕</button>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;">
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.75rem;">
          <div style="font-size: 0.72rem; color: var(--text-secondary);">Holding Value</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #fff;">₹${(holding.estimatedMarketValue / 100000).toFixed(2)}L</div>
          <div style="font-size: 0.7rem; color: var(--text-secondary);">${holding.qty} Units (${holding.weightPercent.toFixed(1)}%)</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.75rem;">
          <div style="font-size: 0.72rem; color: var(--text-secondary);">Coupon / Yield</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #34d399;">${holding.couponPercent.toFixed(2)}%</div>
          <div style="font-size: 0.7rem; color: ${insight.yieldSpreadVsPortfolioAvg >= 0 ? '#34d399' : '#f87171'};">
            ${insight.yieldSpreadVsPortfolioAvg >= 0 ? '+' : ''}${insight.yieldSpreadVsPortfolioAvg.toFixed(2)}% vs Port Avg
          </div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.75rem;">
          <div style="font-size: 0.72rem; color: var(--text-secondary);">Credit Rating</div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #38bdf8;">${holding.rating}</div>
          <div style="font-size: 0.7rem; color: ${holding.ratingTrend === 'deteriorating' ? '#f87171' : '#34d399'};">Trend: ${holding.ratingTrend}</div>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.75rem;">
          <div style="font-size: 0.72rem; color: var(--text-secondary);">Maturity</div>
          <div style="font-size: 1rem; font-weight: 800; color: #fbbf24;">${holding.maturityDate}</div>
          <div style="font-size: 0.7rem; color: var(--text-secondary);">${holding.monthsToMaturity.toFixed(1)}m remaining</div>
        </div>
      </div>

      <!-- Strategic Recommendation & Portfolio Context -->
      <div style="background: ${vStyle.bg}; border: 1px solid ${vStyle.border}; border-radius: 12px; padding: 1.1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <div style="font-size: 1rem; font-weight: 800; color: ${vStyle.text}; display: flex; align-items: center; gap: 0.4rem;">
            ${vStyle.icon} STRATEGIC RECOMMENDATION: ${insight.verdict.replace(/_/g, ' ')}
          </div>
          <div style="font-size: 0.78rem; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 6px; color: #e2e8f0;">
            Group Weight: <strong style="color: ${insight.portfolioGroupConcentrationPct > 20 ? '#f87171' : '#38bdf8'};">${insight.portfolioGroupConcentrationPct.toFixed(1)}%</strong> • Sector Weight: <strong>${insight.portfolioSectorConcentrationPct.toFixed(1)}%</strong>
          </div>
        </div>
        <p style="font-size: 0.88rem; color: #f8fafc; line-height: 1.5; margin: 0;">
          ${insight.verdictReason}
        </p>
      </div>

      <!-- Suitable Replacement Options & Rebalancing Action (from Inventory) -->
      ${insight.suitableReplacements.length > 0 ? `
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="margin: 0; color: #38bdf8; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
              🔄 Suitable Replacement Bonds (Risk-Adjusted Yield Maximization)
            </h4>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">Filtered from active available inventory</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${insight.suitableReplacements.map(rep => {
              const isAdopted = currentAdoptedSwap && currentAdoptedSwap.buyBond.isin === rep.bond.isin;
              return `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid ${isAdopted ? '#10b981' : 'var(--border-glass)'}; border-radius: 10px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                  <div style="flex: 1; min-width: 260px;">
                    <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
                      <span style="font-weight: 700; color: #fff; font-size: 0.92rem;">${rep.bond.issuer}</span>
                      <span style="font-family: monospace; font-size: 0.72rem; color: var(--accent-gold);">${rep.bond.isin}</span>
                      <span style="font-size: 0.72rem; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 1px 6px; border-radius: 4px; font-weight: 700;">${rep.bond.rating}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.4;">
                      ${rep.diversificationReason}
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="text-align: right;">
                      <div style="font-size: 1.1rem; font-weight: 800; color: #34d399;">${rep.projectedYield.toFixed(2)}%</div>
                      <div style="font-size: 0.75rem; font-weight: 700; color: ${rep.yieldPickup >= 0 ? '#10b981' : '#f87171'};">
                        ${rep.yieldPickup >= 0 ? '+' : ''}${rep.yieldPickup.toFixed(2)}% Pickup
                      </div>
                    </div>
                    <button data-buy-isin="${rep.bond.isin}" class="btn adopt-swap-btn" style="
                      background: ${isAdopted ? '#10b981' : 'rgba(212,175,55,0.2)'};
                      color: ${isAdopted ? '#0f172a' : '#fbbf24'};
                      border: 1px solid ${isAdopted ? '#10b981' : 'rgba(212,175,55,0.4)'};
                      padding: 0.45rem 0.9rem; font-size: 0.78rem; font-weight: 700; border-radius: 6px; cursor: pointer;
                    ">
                      ${isAdopted ? '✓ Adopted in Plan' : '➕ Adopt Swap'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Historical Ratings & Agency Evidence Timeline -->
      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.25rem;">
        <h4 style="margin: 0 0 0.85rem 0; color: #fbbf24; font-size: 0.92rem; display: flex; align-items: center; gap: 0.4rem;">
          📜 Historical Rating Trajectory & Official Agency Evidence
        </h4>

        ${historicalRatings.length === 0 ? `
          <div style="font-size: 0.8rem; color: var(--text-secondary); padding: 0.5rem 0;">
            Baseline credit assessment derived from institutional capital structure.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${historicalRatings.map((r, idx) => `
              <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.85rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.7rem; background: rgba(212,175,55,0.2); color: var(--accent-gold); padding: 1px 6px; border-radius: 4px; font-weight: 700;">
                      Action #${historicalRatings.length - idx}
                    </span>
                    <span style="font-weight: 700; color: #fff; font-size: 0.88rem;">${r.agency}: ${r.rating}</span>
                    <span style="font-size: 0.75rem; color: #94a3b8;">(${r.outlook || 'Stable'} Outlook)</span>
                  </div>
                  <span style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary);">${r.date}</span>
                </div>
                <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0; line-height: 1.45;">
                  ${r.commentary}
                </p>
                ${r.creditEnhancement ? `
                  <div style="margin-top: 0.35rem; font-size: 0.72rem; color: #34d399;">
                    🔒 <strong>Credit Enhancement:</strong> ${r.creditEnhancement}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  // Event Listeners
  const closeBtn = document.getElementById('close-bond-insight-btn');
  closeBtn?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Adopt Swap Handlers
  modal.querySelectorAll('.adopt-swap-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const buyIsin = (e.target as HTMLElement).getAttribute('data-buy-isin');
      if (!buyIsin) return;
      const targetRep = insight.suitableReplacements.find(r => r.bond.isin === buyIsin);
      if (!targetRep) return;

      adoptRebalanceAction(holding, targetRep.bond, targetRep.diversificationReason);
      if (onPlanUpdated) onPlanUpdated();
      modal.remove();
    });
  });
}
