import { getVerifiedCitationsForEntity } from './data/citationResolver';
import { getPromoterRiskRecord, getRiskSeverityStyling } from './data/promoterIntelligence';
import { getBusinessSwot } from './data/swotIntelligence';

/**
 * Renders an interactive, comprehensive Promoter & Key Personnel Dossier Modal
 * with Personal SWOT, Corporate Journey, Subsidiary Tree, and Verified Rating Citations.
 * Optionally displays context if opened from a specific subsidiary bond.
 */
export function openPromoterProfileModal(entityKeyOrName: string, contextIssuer?: string): void {
  const record = getPromoterRiskRecord(entityKeyOrName);

  // Remove existing modal if any
  document.getElementById('promoter-profile-modal-container')?.remove();

  if (!record) {
    alert(`No detailed dossier found for: "${entityKeyOrName}". Showing available corporate registry data.`);
    return;
  }

  const styling = getRiskSeverityStyling(record.riskSeverity);
  const swotRecord = getBusinessSwot(contextIssuer || record.entityName);
  const scoreColor = record.governanceScore >= 80 ? '#10b981' : record.governanceScore >= 60 ? '#fbbf24' : '#ef4444';

  const container = document.createElement('div');
  container.id = 'promoter-profile-modal-container';
  container.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; box-sizing: border-box;
    animation: fadeIn 0.15s ease;
  `;

  const personalSwot = record.personalSwot || {
    strengths: ['Established operating footprint', 'Key managerial leadership in sector'],
    weaknesses: ['Vulnerability to macroeconomic cycles'],
    opportunities: ['Expansion into retail & digital distribution'],
    threats: ['Regulatory and interest rate volatility']
  };

  const citations = getVerifiedCitationsForEntity(
    contextIssuer || record.entityName,
    record.entityName,
    undefined,
    swotRecord?.ratingAgency
  );

  container.innerHTML = `
    <div style="
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      width: min(860px, 94vw);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
      color: #f8fafc;
      font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
      display: flex;
      flex-direction: column;
    ">
      <!-- Modal Header -->
      <div style="
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 1.4rem 1.75rem 1.1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 23, 42, 0.95);
        position: sticky; top: 0; z-index: 10;
        border-radius: 16px 16px 0 0;
      ">
        <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
          <div style="
            width: 48px; height: 48px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
            background: ${styling.bg}; border: 1px solid ${styling.border}; flex-shrink: 0;
          ">
            ${styling.icon}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
              <h2 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: #fff; line-height: 1.3;">
                ${record.entityName}
              </h2>
              ${contextIssuer && !record.entityName.toLowerCase().includes(contextIssuer.toLowerCase()) ? `
                <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px;">
                  Parent of: ${contextIssuer}
                </span>
              ` : ''}
              <span style="
                background: ${styling.bg}; color: ${styling.color}; border: 1px solid ${styling.border};
                font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px;
                text-transform: uppercase; letter-spacing: 0.05em;
              ">
                ${styling.label}
              </span>
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem;">
              Sector: <strong style="color: #e2e8f0;">${record.broadSector}</strong> • Governance Score: <span style="font-weight: 800; color: ${scoreColor};">${record.governanceScore}/100</span>
            </div>
          </div>
        </div>
        <button id="close-promoter-modal-btn" style="
          background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px; color: #cbd5e1; cursor: pointer;
          font-size: 1.2rem; line-height: 1; padding: 0.4rem 0.65rem; margin-left: 0.75rem;
        ">&times;</button>
      </div>

      <!-- Modal Body -->
      <div style="padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem;">
        
        <!-- Key Personnel & Structure Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
              Key Promoters & Leadership
            </div>
            <div style="font-size: 0.95rem; font-weight: 700; color: #fff;">
              ${record.promotersAndKeyPersons.join(', ')}
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.4rem; line-height: 1.4;">
              ${record.ownershipStructure}
            </div>
          </div>

          <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
              Corporate Tree & Key Entities Owned
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${record.entitiesOwned.map(e => {
                const isCurrent = contextIssuer && e.toLowerCase().includes(contextIssuer.toLowerCase());
                if (isCurrent) {
                  return `<span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 0.25rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">★ ${e} (Audited Issuer)</span>`;
                }
                return `<span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1; padding: 0.25rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${e}</span>`;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Career Journey & Track Record -->
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px; padding: 1.1rem;">
          <div style="font-size: 0.75rem; color: var(--accent-gold, #f59e0b); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>🧭</span> Executive Journey & Entrepreneurial Track Record
          </div>
          <p style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.6; margin: 0;">
            ${record.promoterJourney}
          </p>
        </div>

        <!-- Personal SWOT Section -->
        <div>
          <div style="font-size: 0.82rem; color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>🎯</span> Comprehensive Personal & Leadership SWOT Analysis
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.85rem;">
            <!-- Strengths -->
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 1rem;">
              <div style="font-size: 0.78rem; font-weight: 700; color: #34d399; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>💪</span> Strengths
              </div>
              <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; display: flex; flex-direction: column; gap: 0.35rem;">
                ${personalSwot.strengths.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>

            <!-- Weaknesses -->
            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 1rem;">
              <div style="font-size: 0.78rem; font-weight: 700; color: #f87171; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>⚠️</span> Weaknesses & Exposure
              </div>
              <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; display: flex; flex-direction: column; gap: 0.35rem;">
                ${personalSwot.weaknesses.map(w => `<li>${w}</li>`).join('')}
              </ul>
            </div>

            <!-- Opportunities -->
            <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 1rem;">
              <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>🚀</span> Opportunities
              </div>
              <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; display: flex; flex-direction: column; gap: 0.35rem;">
                ${personalSwot.opportunities.map(o => `<li>${o}</li>`).join('')}
              </ul>
            </div>

            <!-- Threats -->
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 1rem;">
              <div style="font-size: 0.78rem; font-weight: 700; color: #fbbf24; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>🛡️</span> Threats & Headwinds
              </div>
              <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; display: flex; flex-direction: column; gap: 0.35rem;">
                ${personalSwot.threats.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Negative Media & Regulatory Scrutiny -->
        ${record.negativeMediaFlags.length > 0 && record.negativeMediaFlags[0] !== 'NONE' ? `
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #f87171; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>🚨</span> Regulatory Actions & Negative Media Flags
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem;">
              ${record.negativeMediaFlags.map(f => `
                <span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 4px;">
                  #${f.replace(/_/g, ' ')}
                </span>
              `).join('')}
            </div>
            <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.45;">
              ${record.regulatoryActions}
            </div>
          </div>
        ` : ''}

        <!-- Verified Citations & Online Sources -->
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>🔗</span> Verified Public Citations & Credit Documents (Opens in New Tab)
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem;">
            ${citations.map(c => `
              <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="
                display: flex; justify-content: space-between; align-items: center;
                background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(56, 189, 248, 0.3);
                border-radius: 6px; padding: 0.5rem 0.75rem; text-decoration: none;
                color: #38bdf8; font-size: 0.75rem; font-weight: 600;
              ">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.4rem;">↗ ${c.title}</span>
                <span style="font-size: 0.65rem; color: #94a3b8; font-family: monospace;">${c.type}</span>
              </a>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div style="
        padding: 1rem 1.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex; justify-content: flex-end;
        background: rgba(15, 23, 42, 0.95);
        border-radius: 0 0 16px 16px;
      ">
        <button id="close-promoter-modal-bottom-btn" style="
          background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff; padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 600;
          cursor: pointer; font-size: 0.85rem;
        ">
          Close Dossier
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const closeBtn = container.querySelector('#close-promoter-modal-btn');
  const bottomCloseBtn = container.querySelector('#close-promoter-modal-bottom-btn');

  const closeFn = () => container.remove();
  closeBtn?.addEventListener('click', closeFn);
  bottomCloseBtn?.addEventListener('click', closeFn);

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
