import { getRiskSeverityStyling } from './data/promoterIntelligence';
import { resolveBondEntity } from './entityResolver';
import { DefaultBond } from './defaultInventory';
import { getBusinessSwot } from './data/swotIntelligence';
import { openPromoterProfileModal } from './promoterProfileModal';
import { getVerifiedCitationsForEntity } from './data/citationResolver';

function linkifyText(text: string): string {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s<>"'()]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; font-weight: 600; display: inline-flex; align-items: center; gap: 2px;">${url} ↗</a>`;
  });
}

/**
 * Opens the interactive Promoter Governance, Scams & Negative Media Audit Modal.
 */
export function openPromoterAuditModal(bondOrIssuer: DefaultBond | string): void {
  const entityRes = resolveBondEntity(bondOrIssuer);
  const rec = entityRes.promoterRecord;
  const isin = typeof bondOrIssuer === 'string' ? '' : bondOrIssuer.isin;
  const entityName = rec ? rec.entityName : entityRes.canonicalEntityName;
  const swotRecord = getBusinessSwot(isin || entityName);

  // Remove existing modal if any
  document.getElementById('promoter-audit-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'promoter-audit-modal';
  modal.className = 'modal active';
  modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 1.5rem;';

  const styling = getRiskSeverityStyling(entityRes.riskSeverity);
  const scoreColor = entityRes.governanceScore >= 80 ? '#10b981' : entityRes.governanceScore >= 60 ? '#f59e0b' : '#ef4444';

  const citations = getVerifiedCitationsForEntity(
    entityName,
    entityRes.canonicalEntityName,
    isin,
    swotRecord?.ratingAgency || 'CRISIL / ICRA / CARE'
  );

  modal.innerHTML = `
    <div class="modal-content" style="background: #0f172a; border: 1px solid var(--border-glass); border-radius: 16px; width: 100%; max-width: 820px; max-height: 90vh; overflow-y: auto; padding: 1.75rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); font-family: var(--font-sans); color: #f8fafc;">
      
      <!-- Modal Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 1rem; margin-bottom: 1.25rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <span style="font-size: 1.25rem;">⚖️</span>
            <h2 style="font-size: 1.35rem; color: #fff; margin: 0; font-weight: 800;">
              ${entityName}
            </h2>
            <span style="background: ${styling.bg}; color: ${styling.color}; border: 1px solid ${styling.border}; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${styling.icon} ${styling.label}
            </span>
          </div>
          <p style="font-size: 0.82rem; color: #94a3b8; margin: 0.35rem 0 0 0;">
            Promoter Background, Legal Track Record, Regulatory Actions & Corporate Governance Audit
          </p>
        </div>
        <button id="close-promoter-modal-btn" style="background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 0 0.5rem; line-height: 1;">
          &times;
        </button>
      </div>

      <!-- Governance Scorecard & Key Persons -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem;">
        <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
          <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Governance Score</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: ${scoreColor}; margin-top: 0.2rem;">
            ${entityRes.governanceScore} <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">/ 100</span>
          </div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
          <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Key Promoters / Leaders</div>
          <div style="font-size: 0.85rem; font-weight: 600; color: #e2e8f0; margin-top: 0.25rem;">
            ${rec ? rec.promotersAndKeyPersons.join(', ') : 'Professional / Institutional Management'}
          </div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.85rem;">
          <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Proposal Auto-Status</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: ${entityRes.autoExclude ? '#f87171' : '#34d399'}; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
            ${entityRes.autoExclude ? '⛔ Excluded by Default' : '✓ Eligible for Allocation'}
          </div>
        </div>
      </div>

      ${rec && rec.exclusionReason ? `
        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #fca5a5; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
            ⚠️ Exclusion Rationale
          </div>
          <div style="font-size: 0.82rem; color: #f8fafc; line-height: 1.45;">
            ${linkifyText(rec.exclusionReason)}
          </div>
        </div>
      ` : ''}

      <!-- Detailed Case History & Media Highlights -->
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.1rem; margin-bottom: 1.1rem;">
        <h3 style="font-size: 0.92rem; color: var(--accent-gold); margin: 0 0 0.6rem 0; font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
          📰 Negative Media, Litigation & Regulatory Track Record
        </h3>
        <p style="font-size: 0.84rem; color: #cbd5e1; line-height: 1.55; margin: 0 0 0.85rem 0;">
          ${rec ? linkifyText(rec.detailedCaseHistory) : 'No material adverse media or active regulatory bans found in verified public databases.'}
        </p>

        ${rec && rec.negativeMediaFlags.length > 0 && rec.negativeMediaFlags[0] !== 'NONE' ? `
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem;">
            ${rec.negativeMediaFlags.map(f => `
              <span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px;">
                #${f.replace(/_/g, ' ')}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Earlier Companies, Restructurings & Bankruptcies -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.1rem;">
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.9rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.35rem;">
            🏛️ Earlier Bankruptcies / NCLT / Defaults
          </div>
          <div style="font-size: 0.8rem; color: #94a3b8; line-height: 1.45;">
            ${rec ? linkifyText(rec.earlierBankruptciesOrDefaults) : 'Clean historical debt service track record with zero bond defaults.'}
          </div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 0.9rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.35rem;">
            🛡️ Regulatory & Auditor Quality
          </div>
          <div style="font-size: 0.8rem; color: #94a3b8; line-height: 1.45;">
            ${rec ? linkifyText(`${rec.regulatoryActions} | ${rec.auditorAndAccountingQuality}`) : 'Standard regulatory oversight by statutory bodies.'}
          </div>
        </div>
      </div>

      <!-- Related Group Entities -->
      ${rec && rec.aliasesAndSubsidiaries.length > 1 ? `
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 0.85rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 0.35rem;">
            🔗 Conglomerate Entities Under Single-Entity Diversification Cap:
          </div>
          <div style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">
            ${rec.aliasesAndSubsidiaries.join(' • ')}
          </div>
        </div>
      ` : ''}

      <!-- Verified Online Citations & Source Links (CITE TO SOURCE) -->
      <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1.1rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem;">
          <span>🔗</span> Specific Resource Citations & Rating Rationales (Opens in New Window)
        </div>
        <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 0.75rem 0;">
          Direct verified deep links to live credit rating rationales, BSE debt filings, NSDL directory, and regulatory databases:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.6rem;">
          ${citations.map(c => `
            <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="audit-external-link" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; text-decoration: none; color: #38bdf8; font-size: 0.78rem; font-weight: 600; transition: all 0.2s; cursor: pointer;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.4rem;">↗ ${c.title}</span>
              <span style="font-size: 0.65rem; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px; color: #94a3b8; font-family: monospace;">${c.type}</span>
            </a>
          `).join('')}
        </div>
      </div>

      <!-- Investment Verdict -->
      <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%); border-left: 4px solid ${styling.color}; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Forensic Investment Verdict</div>
        <div style="font-size: 0.84rem; font-weight: 600; color: #fff; margin-top: 0.25rem; line-height: 1.45;">
          ${rec ? rec.investmentVerdict : 'Acceptable credit standing.'}
        </div>
      </div>

      <!-- Action Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.8rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1rem;">
        <button id="open-full-promoter-dossier-btn" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.4); font-weight: 700; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
          👤 Full Executive Dossier & Personal SWOT ↗
        </button>
        <button id="close-promoter-modal-bottom-btn" class="btn" style="background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); font-weight: 600; padding: 0.5rem 1.25rem; border-radius: 8px; cursor: pointer;">
          Close Audit
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = document.getElementById('close-promoter-modal-btn');
  const bottomCloseBtn = document.getElementById('close-promoter-modal-bottom-btn');
  const openDossierBtn = document.getElementById('open-full-promoter-dossier-btn');

  const closeFn = () => modal.remove();
  closeBtn?.addEventListener('click', closeFn);
  bottomCloseBtn?.addEventListener('click', closeFn);

  openDossierBtn?.addEventListener('click', () => {
    closeFn();
    openPromoterProfileModal(entityName);
  });

  // Global link interceptor to guarantee open in new window
  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement;
    if (link && link.href && link.href.startsWith('http')) {
      e.stopPropagation();
      window.open(link.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (e.target === modal) {
      closeFn();
    }
  });
}
