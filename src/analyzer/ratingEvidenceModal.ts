import { PortfolioHolding } from './types';
import { getIssuerKnowledge } from './issuerKnowledgeDatabase';

export function openRatingEvidenceModal(holding: PortfolioHolding) {
  let modal = document.getElementById('rating-evidence-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rating-evidence-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 2500;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
      display: flex; justify-content: center; align-items: center; padding: 1.5rem;
    `;
    document.body.appendChild(modal);
  }

  const knowledge = getIssuerKnowledge(holding.securityName + ' ' + holding.isin + ' ' + holding.issuerName);
  const ratings = holding.historicalRatings && holding.historicalRatings.length > 0
    ? holding.historicalRatings
    : (knowledge.historicalRatings || []);

  modal.innerHTML = `
    <div style="background: #0f172a; border: 1px solid var(--border-glass); border-radius: 16px; width: 100%; max-width: 820px; max-height: 88vh; overflow-y: auto; padding: 2rem; color: #fff; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); font-family: var(--font-sans);">
      
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <span style="font-family: monospace; font-size: 0.85rem; color: var(--accent-gold); background: rgba(212,175,55,0.1); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.25);">
              ${holding.isin}
            </span>
            <h3 style="margin: 0; font-size: 1.25rem; color: #fff;">${holding.securityName}</h3>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">
            Issuer: <strong>${holding.issuerName}</strong> • Parent: <strong>${holding.parentGroup}</strong> • Sector: <strong>${holding.sector}</strong>
          </div>
        </div>
        <button id="close-rating-evidence-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; padding: 0 0.5rem; line-height: 1;">✕</button>
      </div>

      <!-- Fundamental Profile & Capitalization Summary -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Current Rating</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #34d399;">${holding.rating}</div>
          <div style="font-size: 0.72rem; color: #94a3b8;">Agency: ${holding.ratingAgency}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Coupon / Yield</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #38bdf8;">${holding.couponPercent.toFixed(2)}%</div>
          <div style="font-size: 0.72rem; color: #94a3b8;">Freq: ${holding.frequency}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Capital Adequacy (CAR)</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">${knowledge.carPercent ? knowledge.carPercent.toFixed(1) + '%' : 'N/A'}</div>
          <div style="font-size: 0.72rem; color: #94a3b8;">Regulatory min: 15%</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">Asset Quality (GNPA)</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: ${knowledge.gnpaPercent && knowledge.gnpaPercent > 5 ? '#f87171' : '#34d399'};">${knowledge.gnpaPercent ? knowledge.gnpaPercent.toFixed(1) + '%' : 'N/A'}</div>
          <div style="font-size: 0.72rem; color: #94a3b8;">Gross Non-Performing</div>
        </div>
      </div>

      <!-- Promoter Pedigree & Commentary -->
      <div style="background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem;">
        <div style="font-size: 0.85rem; font-weight: 700; color: #93c5fd; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
          🏢 Promoter & Credit Enhancement Intelligence:
        </div>
        <p style="font-size: 0.82rem; color: #cbd5e1; margin: 0; line-height: 1.5;">
          ${knowledge.promoterPedigree}
        </p>
      </div>

      <!-- Historical Ratings Timeline & Evidence -->
      <div>
        <h4 style="margin: 0 0 1rem 0; font-size: 1rem; color: var(--accent-gold); display: flex; align-items: center; gap: 0.5rem;">
          📜 Historical Rating Agency Reports & Commentary Evidence (${ratings.length} Records)
        </h4>

        ${ratings.length === 0 ? `
          <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary); background: rgba(255,255,255,0.02); border-radius: 8px;">
            No historical rating transitions recorded in registry for this specific instrument.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1rem; position: relative;">
            ${ratings.map(r => `
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-glass); border-left: 4px solid ${
                r.outlook === 'Positive' ? '#10b981' :
                r.outlook === 'Negative' ? '#ef4444' :
                r.outlook === 'Watch' ? '#f59e0b' : '#3b82f6'
              }; border-radius: 8px; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-weight: 800; font-size: 1.05rem; color: #fff;">${r.rating}</span>
                    <span style="font-size: 0.75rem; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px; color: #94a3b8;">
                      ${r.agency}
                    </span>
                    <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; ${
                      r.outlook === 'Positive' ? 'background: rgba(16,185,129,0.15); color: #34d399;' :
                      r.outlook === 'Negative' ? 'background: rgba(239,68,68,0.15); color: #f87171;' :
                      'background: rgba(59,130,246,0.15); color: #93c5fa;'
                    }">
                      Outlook: ${r.outlook}
                    </span>
                  </div>
                  <span style="font-size: 0.78rem; color: var(--text-secondary); font-family: monospace;">📅 ${r.date}</span>
                </div>

                ${r.creditEnhancement ? `
                  <div style="font-size: 0.78rem; color: #34d399; margin-bottom: 0.4rem; font-weight: 600;">
                    🛡️ Credit Enhancement Structure: ${r.creditEnhancement}
                  </div>
                ` : ''}

                <div style="font-size: 0.82rem; color: #cbd5e1; line-height: 1.45; background: rgba(0,0,0,0.2); padding: 0.65rem 0.85rem; border-radius: 6px;">
                  "${r.commentary}"
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <div style="margin-top: 1.5rem; text-align: right;">
        <button id="close-rating-evidence-btn-2" class="btn" style="background: rgba(255,255,255,0.1); color: #fff; padding: 0.5rem 1.25rem;">
          Close
        </button>
      </div>

    </div>
  `;

  modal.style.display = 'flex';

  const close = () => { if (modal) modal.style.display = 'none'; };
  document.getElementById('close-rating-evidence-btn')?.addEventListener('click', close);
  document.getElementById('close-rating-evidence-btn-2')?.addEventListener('click', close);
  modal.onclick = (e) => { if (e.target === modal) close(); };
}
