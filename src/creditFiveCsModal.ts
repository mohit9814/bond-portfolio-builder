import { getCreditCoverageRecord, IssuerCreditProfile } from './data/creditCoverageIntelligence';
import { getVerifiedCitationsForEntity } from './data/citationResolver';

/**
 * Renders an institutional-grade 5 Cs Credit Analysis & Quantitative Coverage Modal
 */
export function openCreditFiveCsModal(isinOrIssuer: string): void {
  const profile: IssuerCreditProfile | null = getCreditCoverageRecord(isinOrIssuer);

  const existing = document.getElementById('credit-five-cs-modal-container');
  if (existing) existing.remove();

  if (!profile) {
    alert(`No detailed 5 Cs institutional credit assessment available for: "${isinOrIssuer}".`);
    return;
  }

  const q = profile.quantitativeCoverage;
  const f = profile.fiveCsAssessment;
  const scoreColor = f.compositeScore >= 85 ? '#10b981' : f.compositeScore >= 70 ? '#38bdf8' : f.compositeScore >= 55 ? '#fbbf24' : '#f87171';

  const citations = getVerifiedCitationsForEntity(
    profile.issuerName,
    profile.parentGroup,
    undefined,
    profile.ratingAgency
  );

  const container = document.createElement('div');
  container.id = 'credit-five-cs-modal-container';
  container.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; box-sizing: border-box;
    animation: fadeIn 0.15s ease;
  `;

  container.innerHTML = `
    <div style="
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      width: min(880px, 94vw);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
      color: #f8fafc;
      font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
      display: flex;
      flex-direction: column;
    ">
      
      <!-- Header -->
      <div style="
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 1.4rem 1.75rem 1.1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 23, 42, 0.95);
        position: sticky; top: 0; z-index: 10;
        border-radius: 16px 16px 0 0;
      ">
        <div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0;">
          <div style="
            width: 56px; height: 56px; border-radius: 14px;
            display: flex; flex-direction: column; items: center; justify-content: center; text-align: center;
            background: ${scoreColor}18; border: 1px solid ${scoreColor}40; color: ${scoreColor}; flex-shrink: 0;
          ">
            <span style="font-size: 1.35rem; font-weight: 800; line-height: 1;">${f.compositeScore}</span>
            <span style="font-size: 0.6rem; text-transform: uppercase; font-weight: 700; margin-top: 2px;">/ 100</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
              <h2 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: #fff; line-height: 1.3;">${profile.issuerName}</h2>
              <span style="
                background: ${scoreColor}20; color: ${scoreColor}; border: 1px solid ${scoreColor}40;
                font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px;
                text-transform: uppercase; letter-spacing: 0.05em;
              ">
                ${f.creditGrade.replace(/_/g, ' ')}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem;">
              Group: <strong style="color: #e2e8f0;">${profile.parentGroup}</strong> • Rating: <strong style="color: #fbbf24;">${profile.rating}</strong> (${profile.ratingAgency})
            </div>
          </div>
        </div>
        <button id="close-five-cs-modal-btn" style="
          background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px; color: #cbd5e1; cursor: pointer;
          font-size: 1.2rem; line-height: 1; padding: 0.4rem 0.65rem; margin-left: 0.75rem;
          transition: background 0.15s;
        " title="Close">✕</button>
      </div>

      <!-- Body -->
      <div style="padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.5rem;">
        
        <!-- Quantitative Cash Flow & Coverage Ratios KPI Grid -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 0.4rem;">
              <span>📊</span> Quantitative Cash Flow & Debt Coverage Metrics
            </h3>
            <span style="font-size: 0.72rem; color: #94a3b8;">Institutional Banking Quality Standards</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
            
            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Interest Coverage (ISCR)</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: ${q.iscr >= 2.5 ? '#34d399' : q.iscr >= 1.75 ? '#fbbf24' : '#f87171'}; margin-top: 0.2rem;">
                ${q.iscr.toFixed(2)}x
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">EBITDA / Interest (Min: &gt; 2.0x)</div>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Debt Service (DSCR)</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: ${q.dscr >= 1.4 ? '#34d399' : q.dscr >= 1.2 ? '#fbbf24' : '#f87171'}; margin-top: 0.2rem;">
                ${q.dscr.toFixed(2)}x
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">Cash Flow / Total Debt Service</div>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Fixed Charge (FCCR)</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: ${q.fccr >= 1.8 ? '#34d399' : '#fbbf24'}; margin-top: 0.2rem;">
                ${q.fccr.toFixed(2)}x
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">Total Fixed Obligations Cover</div>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Security Cover Ratio</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #38bdf8; margin-top: 0.2rem;">
                ${q.securityCoverRatio.toFixed(2)}x
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">Collateral Asset Cover Backing</div>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">OCF-to-Total Debt</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #34d399; margin-top: 0.2rem;">
                ${q.ocfToDebtPercent.toFixed(1)}%
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">Operating Cash Flow %</div>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Operating CFO</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">
                ₹${q.cfoCr.toLocaleString('en-IN')} Cr
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">Annual Operating Cash Inflows</div>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Liquid Cash / Lines</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #a5b4fc; margin-top: 0.2rem;">
                ₹${q.cashEquivalentsCr.toLocaleString('en-IN')} Cr
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">Unencumbered Liquidity Buffer</div>
            </div>

            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
              <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Gearing Multiple</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: ${q.gearingRatio <= 3.5 ? '#34d399' : '#fbbf24'}; margin-top: 0.2rem;">
                ${q.gearingRatio.toFixed(1)}x
              </div>
              <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.2rem;">Debt / Net Worth Ratio</div>
            </div>

          </div>
        </div>

        <!-- The 5 Cs of Credit Framework Scorecard -->
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 0.4rem;">
              <span>🏛️</span> The 5 Cs of Credit Institutional Framework
            </h3>
            <span style="font-size: 0.72rem; color: #94a3b8;">Banking Assessment of Willingness & Ability to Repay</span>
          </div>

          <!-- 1. Character -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem;">
                <span>👤</span> 1. Character (Governance, Integrity & Track Record)
              </div>
              <span style="font-size: 0.75rem; font-weight: 800; background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); padding: 2px 8px; border-radius: 5px;">
                ${f.character.score}/100
              </span>
            </div>
            <p style="margin: 0; font-size: 0.84rem; color: #cbd5e1; line-height: 1.5;">${f.character.summary}</p>
            <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; flex-wrap: wrap; gap: 0.85rem; font-size: 0.75rem; color: #94a3b8;">
              <span><strong>Auditor:</strong> <span style="color: #e2e8f0;">${f.character.auditorQuality}</span></span>
              <span><strong>Creditor Record:</strong> <span style="color: #e2e8f0;">${f.character.creditorTrackRecord}</span></span>
            </div>
          </div>

          <!-- 2. Capacity -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #34d399; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem;">
                <span>⚡</span> 2. Capacity (Cash Flow Generation & Debt Servicing)
              </div>
              <span style="font-size: 0.75rem; font-weight: 800; background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 5px;">
                ${f.capacity.score}/100
              </span>
            </div>
            <p style="margin: 0; font-size: 0.84rem; color: #cbd5e1; line-height: 1.5;">${f.capacity.summary}</p>
            <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; flex-wrap: wrap; gap: 0.85rem; font-size: 0.75rem; color: #94a3b8;">
              <span><strong>Predictability:</strong> <span style="color: #e2e8f0;">${f.capacity.cashFlowPredictability}</span></span>
              <span><strong>Debt Servicing Runway:</strong> <span style="color: #e2e8f0;">${f.capacity.debtServicingRunway}</span></span>
            </div>
          </div>

          <!-- 3. Collateral -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem;">
                <span>🛡️</span> 3. Collateral (Asset Protection & Security Cover)
              </div>
              <span style="font-size: 0.75rem; font-weight: 800; background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); padding: 2px 8px; border-radius: 5px;">
                ${f.collateral.score}/100
              </span>
            </div>
            <p style="margin: 0; font-size: 0.84rem; color: #cbd5e1; line-height: 1.5;">${f.collateral.summary}</p>
            <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; flex-wrap: wrap; gap: 0.85rem; font-size: 0.75rem; color: #94a3b8;">
              <span><strong>Collateral Type:</strong> <span style="color: #e2e8f0;">${f.collateral.collateralType}</span></span>
              <span><strong>Charge Exclusivity:</strong> <span style="color: #e2e8f0;">${f.collateral.chargeExclusivity}</span></span>
              <span><strong>Escrow:</strong> <span style="color: #e2e8f0;">${f.collateral.escrowMechanism}</span></span>
            </div>
          </div>

          <!-- 4. Capital -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #c084fc; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem;">
                <span>💰</span> 4. Capital (Net Worth Cushion & Leverage Buffer)
              </div>
              <span style="font-size: 0.75rem; font-weight: 800; background: rgba(139, 92, 246, 0.15); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.3); padding: 2px 8px; border-radius: 5px;">
                ${f.capital.score}/100
              </span>
            </div>
            <p style="margin: 0; font-size: 0.84rem; color: #cbd5e1; line-height: 1.5;">${f.capital.summary}</p>
            <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; flex-wrap: wrap; gap: 0.85rem; font-size: 0.75rem; color: #94a3b8;">
              <span><strong>Net Worth:</strong> <span style="color: #e2e8f0;">₹${f.capital.netWorthCr ? f.capital.netWorthCr.toLocaleString('en-IN') : 'N/A'} Cr</span></span>
              <span><strong>CRAR / Capital Adequacy:</strong> <span style="color: #e2e8f0;">${f.capital.crarPercent}%</span></span>
            </div>
          </div>

          <!-- 5. Conditions -->
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #f472b6; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem;">
                <span>🌐</span> 5. Conditions (Macro Cycles & Regulatory Tailwinds)
              </div>
              <span style="font-size: 0.75rem; font-weight: 800; background: rgba(236, 72, 153, 0.15); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.3); padding: 2px 8px; border-radius: 5px;">
                ${f.conditions.score}/100
              </span>
            </div>
            <p style="margin: 0; font-size: 0.84rem; color: #cbd5e1; line-height: 1.5;">${f.conditions.summary}</p>
            <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; flex-wrap: wrap; gap: 0.85rem; font-size: 0.75rem; color: #94a3b8;">
              <span><strong>Macro Sensitivity:</strong> <span style="color: #e2e8f0;">${f.conditions.macroSensitivity}</span></span>
              <span><strong>Regulatory Climate:</strong> <span style="color: #e2e8f0;">${f.conditions.regulatoryTailwindHeadwind}</span></span>
            </div>
          </div>

        </div>

        <!-- Verified Online Citations & Source Links -->
        <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1.1rem;">
          <div style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.4rem;">
            <span>🔗</span> Verified Source Citations & Online Rating Reports (Opens in New Window)
          </div>
          <p style="font-size: 0.78rem; color: #94a3b8; margin: 0 0 0.75rem 0;">
            Direct verified deep links to live credit rating reports, BSE debt filings, NSDL directory, and regulatory databases:
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.6rem;">
            ${citations.map(c => `
              <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="
                display: flex; justify-content: space-between; align-items: center;
                padding: 0.6rem 0.85rem; background: rgba(30, 41, 59, 0.7);
                border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px;
                text-decoration: none; color: #38bdf8; font-size: 0.78rem; font-weight: 600;
                cursor: pointer; transition: all 0.15s ease;
              ">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.4rem;">↗ ${c.title}</span>
                <span style="font-size: 0.65rem; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #94a3b8; font-family: monospace;">${c.type}</span>
              </a>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div style="
        display: flex; justify-content: flex-end; align-items: center;
        padding: 1rem 1.75rem; border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 23, 42, 0.95); border-radius: 0 0 16px 16px;
      ">
        <button id="close-five-cs-modal-bottom-btn" style="
          background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff; font-size: 0.82rem; font-weight: 700; padding: 0.5rem 1.25rem;
          border-radius: 8px; cursor: pointer;
        ">
          Close Scorecard
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  const closeFn = () => container.remove();
  document.getElementById('close-five-cs-modal-btn')?.addEventListener('click', closeFn);
  document.getElementById('close-five-cs-modal-bottom-btn')?.addEventListener('click', closeFn);

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement;
    if (link && link.href && link.href.startsWith('http')) {
      e.stopPropagation();
      window.open(link.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (e.target === container) {
      closeFn();
    }
  });
}
