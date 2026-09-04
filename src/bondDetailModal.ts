import { DefaultBond } from './defaultInventory';
import { setCompanyOverride } from './overridesManager';
import { getCompanyInsights } from './companyReference';
import { openPromoterAuditModal } from './promoterModal';
import { getBseGidRecord } from './data/bseGidIntelligence';
import { parseRedemptionSchedule } from './redemptionEngine';
import { getBusinessSwot } from './data/swotIntelligence';
import { openPromoterProfileModal } from './promoterProfileModal';
import { resolveBondEntity } from './entityResolver';

/**
 * Renders a full-detail slide-in modal for a selected bond.
 * Displays every field available on the DefaultBond object that was sourced
 * from the uploaded Excel inventory, along with Credit Rating SWOT Analysis,
 * Verified Source Citations, BSE GID covenants, and Promoter Dossiers.
 */

const MODAL_ID = 'bond-detail-modal-overlay';

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtCurrency = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const pct = (n: number) => (n * 100).toFixed(2) + '%';

const ratingClass = (rating: string): string => {
  const r = rating.toUpperCase().replace(/\(CE\)/g, '').trim()
    .replace(/^(CRISIL|ICRA|CARE|IND|ACUITE|FITCH)\s*/i, '');
  if (r.includes('SOVEREIGN') || r.includes('GOI')) return 'sovereign';
  if (r === 'AAA') return 'aaa';
  if (r.startsWith('AA')) return 'aa';
  if (r.startsWith('A')) return 'a';
  if (r.startsWith('BBB')) return 'bbb';
  return 'unrated';
};

const row = (label: string, value: string | number | undefined | null, accent = false): string => {
  if (value === undefined || value === null || value === '') return '';
  const style = accent
    ? 'color: var(--accent-gold); font-weight: 700; font-size: 1rem;'
    : 'color: var(--text-primary); font-weight: 500;';
  return `
    <div style="display: flex; flex-direction: column; gap: 0.2rem; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
      <span style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">${label}</span>
      <span style="${style}">${value}</span>
    </div>`;
};

const section = (title: string): string => `
  <div style="grid-column: 1 / -1; margin: 1rem 0 0.25rem; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
    <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-blue);">${title}</span>
  </div>`;

export function openBondDetailModal(bond: DefaultBond): void {
  closeBondDetailModal();

  const overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.15s ease;
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBondDetailModal();
  });

  const insights = getCompanyInsights(bond);
  const gid = getBseGidRecord(bond.isin || bond.issuer);
  const entityRes = resolveBondEntity(bond);
  const swotRecord = getBusinessSwot(bond.isin || bond.issuer);
  const redPlan = parseRedemptionSchedule(
    bond.principalRedemption,
    bond.maturity,
    bond.months,
    bond.faceValue || 100000
  );
  
  const trend = bond.ratingTrend || insights.ratingTrend;
  const trendHtml = trend === 'improving'
    ? `<span class="trend-badge improving">▲ Improving</span>`
    : trend === 'deteriorating'
      ? `<span class="trend-badge deteriorating">▼ Deteriorating</span>`
      : `<span class="trend-badge stable">● Stable</span>`;

  const calculatedUnitPrice = (bond.totalTradableFV && bond.totalTradableQty) ? Math.floor(bond.totalTradableFV / bond.totalTradableQty) : bond.faceValue;

  let redemptionScheduleHtml = '';
  if (redPlan.hasAmortization) {
    const tranchesHtml = redPlan.tranches.map(t => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.6rem; background: rgba(0,0,0,0.25); border-radius: 6px; font-size: 0.78rem;">
        <span style="color: #38bdf8; font-weight: 600;">Month ${t.month} ${t.targetDateStr ? `(${t.targetDateStr})` : ''}</span>
        <span style="color: var(--text-secondary);">${t.label}</span>
        <span style="color: #4ade80; font-weight: 700;">${(t.percent * 100).toFixed(1)}%</span>
      </div>
    `).join('');

    redemptionScheduleHtml = `
      <div style="grid-column: 1 / -1; margin-top: 0.6rem; padding: 0.8rem; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px;">
        <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
          ⚡ Structured Principal Amortization Schedule
        </div>
        <div style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 0.6rem;">${redPlan.summaryDescription}</div>
        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          ${tranchesHtml}
        </div>
      </div>
    `;
  }

  // Business SWOT card HTML
  let swotCardHtml = '';
  if (swotRecord) {
    swotCardHtml = `
      <div style="grid-column: 1 / -1; margin-top: 1rem; padding: 1rem; background: rgba(20, 24, 33, 0.7); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem;">
          <div style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem;">
            <span>📊</span> Business Fundamental SWOT Analysis
          </div>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">
            Source: <strong style="color: #e2e8f0;">${swotRecord.ratingAgency}</strong> (${swotRecord.reportDate})
          </div>
        </div>

        <!-- Key Financial Metrics Chips -->
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          ${swotRecord.financialMetrics.crar ? `<span style="padding: 0.25rem 0.6rem; border-radius: 6px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); font-size: 0.72rem; color: #38bdf8;"><strong>CRAR:</strong> ${swotRecord.financialMetrics.crar}%</span>` : ''}
          ${swotRecord.financialMetrics.gnpa !== undefined ? `<span style="padding: 0.25rem 0.6rem; border-radius: 6px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.72rem; color: #f87171;"><strong>GNPA:</strong> ${swotRecord.financialMetrics.gnpa}%</span>` : ''}
          ${swotRecord.financialMetrics.gearing ? `<span style="padding: 0.25rem 0.6rem; border-radius: 6px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.72rem; color: #fbbf24;"><strong>Gearing:</strong> ${swotRecord.financialMetrics.gearing}x</span>` : ''}
          ${swotRecord.financialMetrics.lcr ? `<span style="padding: 0.25rem 0.6rem; border-radius: 6px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem; color: #34d399;"><strong>LCR:</strong> ${swotRecord.financialMetrics.lcr}%</span>` : ''}
        </div>

        <!-- 4-Quadrant SWOT -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 0.6rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #34d399; text-transform: uppercase; margin-bottom: 0.3rem;">💪 Strengths</div>
            <ul style="margin: 0; padding-left: 1rem; font-size: 0.72rem; color: #cbd5e1; line-height: 1.4;">
              ${swotRecord.swot.strengths.slice(0, 3).map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 0.6rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #f87171; text-transform: uppercase; margin-bottom: 0.3rem;">⚠️ Weaknesses</div>
            <ul style="margin: 0; padding-left: 1rem; font-size: 0.72rem; color: #cbd5e1; line-height: 1.4;">
              ${swotRecord.swot.weaknesses.slice(0, 3).map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 8px; padding: 0.6rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; margin-bottom: 0.3rem;">🚀 Opportunities</div>
            <ul style="margin: 0; padding-left: 1rem; font-size: 0.72rem; color: #cbd5e1; line-height: 1.4;">
              ${swotRecord.swot.opportunities.slice(0, 3).map(o => `<li>${o}</li>`).join('')}
            </ul>
          </div>
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 0.6rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 0.3rem;">⚡ Threats</div>
            <ul style="margin: 0; padding-left: 1rem; font-size: 0.72rem; color: #cbd5e1; line-height: 1.4;">
              ${swotRecord.swot.threats.slice(0, 3).map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Verified Source Links (CITE TO SOURCE) -->
        <div style="margin-top: 0.75rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.06); display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center;">
          <span style="font-size: 0.7rem; color: var(--text-secondary); margin-right: 0.2rem;">Citations:</span>
          <a href="${swotRecord.sourceUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-radius: 4px; text-decoration: none; border: 1px solid rgba(56, 189, 248, 0.3);">
            ↗ ${swotRecord.ratingAgency} Rationale
          </a>
          <a href="${swotRecord.bseFilingUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-radius: 4px; text-decoration: none; border: 1px solid rgba(245, 158, 11, 0.3);">
            ↗ BSE Debt Filings
          </a>
          <a href="${swotRecord.nsdlDirectoryUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(16, 185, 129, 0.12); color: #34d399; border-radius: 4px; text-decoration: none; border: 1px solid rgba(16, 185, 129, 0.3);">
            ↗ NSDL Registry
          </a>
        </div>
      </div>
    `;
  }

  // Build field grid
  const fields = `
    ${section('Identification & Group')}
    ${row('ISIN', `<span style="font-family: monospace; font-size: 0.95rem;">${bond.isin}</span>`)}
    ${row('Issuer Name', `<span style="font-weight: 700; color: #f8fafc;">${bond.issuer}</span>`)}
    ${row('Canonical Group / Promoter', `
      <button id="detail-promoter-dossier-btn" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; text-align: left; display: inline-flex; align-items: center; gap: 0.3rem;">
        <span>👤 ${entityRes.canonicalEntityName}</span>
        <span style="font-size: 0.65rem; background: rgba(0,0,0,0.3); padding: 0.1rem 0.3rem; border-radius: 3px;">Dossier ↗</span>
      </button>
    `)}
    ${row('Sector', bond.sector || insights.sector)}
    ${bond.category ? row('Category', bond.category) : ''}

    ${section('Company & Credit Insights')}
    ${row('Core Focus', insights.coreFocus)}
    ${row('Analyst Note', bond.ratingOutlookNote || insights.insightNote)}
    ${row('Credit Rating', `<span class="rating-badge ${ratingClass(bond.rating)}" style="font-size: 0.85rem;">${bond.rating}</span>`)}
    ${row('Rating Outlook', trendHtml)}
    ${bond.securedUnsecured ? row('Security Type', bond.securedUnsecured) : ''}
    ${bond.guarantor || insights.guarantor ? row('Guarantor', bond.guarantor || insights.guarantor) : ''}
    ${bond.guarantorRating || insights.guarantorRating ? row('Guarantor Rating', bond.guarantorRating || insights.guarantorRating) : ''}

    ${section('Financials & Yield')}
    ${row('Offer Yield (YTM)', pct(bond.yield), true)}
    ${bond.coupon !== null && bond.coupon !== undefined ? row('Coupon Rate', pct(bond.coupon)) : ''}
    ${row('Interest Payment', bond.frequency)}
    ${bond.principalRedemption ? row('Principal Redemption', `<span style="color: #38bdf8; font-weight: 600;">${bond.principalRedemption}</span>`) : ''}
    ${calculatedUnitPrice ? row('Face Value / Unit Price', fmtCurrency(calculatedUnitPrice)) : ''}
    ${redemptionScheduleHtml}

    ${swotCardHtml}

    ${section('📑 BSE GID & NSDL Terms Breakdown')}
    ${row('Security Cover Ratio', `<span style="color: #4ade80; font-weight: 700;">${gid?.securityCoverRatio || '1.25x (Standard)'}</span>`)}
    ${row('Debenture Trustee', gid?.debentureTrustee || 'Catalyst Trusteeship Ltd')}
    ${row('Collateral Backing', gid?.collateralDescription)}
    ${row('DSRA Requirement', gid?.dsraRequirement)}
    ${row('Escrow Waterfall', gid?.escrowWaterfall)}
    ${row('Key Covenants', gid?.financialCovenants ? gid.financialCovenants.map(c => `• ${c}`).join('<br>') : 'Standard Asset Cover & CRAR covenants')}
    ${row('Listing & Depository', `${gid?.listingExchange || 'BSE'} | ${gid?.depository || 'NSDL & CDSL'}`)}

    ${section('Tenure & Liquidity (Availability)')}
    ${row('Redemption Date', bond.maturity)}
    ${row('Residual Tenure (months)', bond.months + 'm')}
    ${bond.residualTenure ? row('Residual Tenure (detailed)', bond.residualTenure) : ''}
    ${bond.totalTradableFV ? row('Total Tradable FV', `<span style="color: var(--accent-blue); font-weight: 700;">${fmtCurrency(bond.totalTradableFV)}</span>`) : ''}
    ${bond.totalTradableQty ? row('Available Qty (Units)', `<span style="color: var(--accent-blue); font-weight: 700;">${fmt(bond.totalTradableQty, 0)} units</span>`) : ''}
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--bg-card, #1a1a2e);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      width: min(700px, 94vw);
      max-height: 88vh;
      overflow-y: auto;
      box-shadow: 0 24px 80px rgba(0,0,0,0.6);
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease;
    ">
      <!-- Header -->
      <div style="
        display: flex; align-items: flex-start; justify-content: space-between;
        padding: 1.4rem 1.6rem 1rem;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        position: sticky; top: 0; background: var(--bg-card, #1a1a2e); z-index: 1;
        border-radius: 16px 16px 0 0;
      ">
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem;">Bond Detail & Fundamental Audit</div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); line-height: 1.3; word-break: break-word;">${bond.issuer}</div>
          <div style="font-family: monospace; font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.2rem;">${bond.isin}</div>
        </div>
        <button id="bond-detail-close" style="
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px; color: var(--text-primary); cursor: pointer;
          font-size: 1.1rem; line-height: 1; padding: 0.35rem 0.6rem;
          margin-left: 1rem; flex-shrink: 0; transition: background 0.15s;
        " title="Close">✕</button>
      </div>

      <!-- Body: two-column field grid -->
      <div style="
        padding: 0.75rem 1.6rem 1.6rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 1.5rem;
      ">
        ${fields}
      </div>

      <!-- Action Footer -->
      <div style="padding: 1.2rem 1.6rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; gap: 1rem; background: rgba(0,0,0,0.15); border-radius: 0 0 16px 16px;">
        <div style="display: flex; gap: 0.6rem;">
          <button id="bond-detail-promoter-profile" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.4); padding: 0.5rem 0.9rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
            👤 Promoter Dossier & Personal SWOT
          </button>
          <button id="bond-detail-promoter-audit" style="background: rgba(212, 175, 55, 0.2); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.4); padding: 0.5rem 0.9rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
            ⚖️ Governance Audit
          </button>
        </div>
        <button id="bond-detail-force-exclude" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
          Ban Company
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('bond-detail-close')?.addEventListener('click', closeBondDetailModal);

  document.getElementById('detail-promoter-dossier-btn')?.addEventListener('click', () => {
    openPromoterProfileModal(entityRes.canonicalEntityName || bond.issuer);
  });

  document.getElementById('bond-detail-promoter-profile')?.addEventListener('click', () => {
    openPromoterProfileModal(entityRes.canonicalEntityName || bond.issuer);
  });

  document.getElementById('bond-detail-promoter-audit')?.addEventListener('click', () => {
    openPromoterAuditModal(bond);
  });

  document.getElementById('bond-detail-force-exclude')?.addEventListener('click', () => {
    const comment = prompt(`Please provide a reason to permanently ban the company "${bond.issuer}":`);
    if (comment !== null && comment.trim() !== '') {
      setCompanyOverride(bond.issuer, 'EXCLUDE', comment.trim());
      closeBondDetailModal();
    }
  });

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { closeBondDetailModal(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

export function closeBondDetailModal(): void {
  document.getElementById(MODAL_ID)?.remove();
}
