import { DefaultBond } from './defaultInventory';

/**
 * Renders a full-detail slide-in modal for a selected bond.
 * Displays every field available on the DefaultBond object that was sourced
 * from the uploaded Excel inventory — nothing is hidden.
 *
 * Usage: call openBondDetailModal(bond) from any click handler.
 */

const MODAL_ID = 'bond-detail-modal-overlay';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, decimals = 2) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtCurrency = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const pct = (n: number) => (n * 100).toFixed(2) + '%';

/** Returns a rating CSS class string for badge colouring. */
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

/** Builds one detail row: label + value. Returns empty string if value is falsy. */
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

/** Section heading divider. */
const section = (title: string): string => `
  <div style="grid-column: 1 / -1; margin: 1rem 0 0.25rem; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
    <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent-blue);">${title}</span>
  </div>`;

// ─── Modal Builder ─────────────────────────────────────────────────────────────

export function openBondDetailModal(bond: DefaultBond): void {
  // Remove any existing modal
  closeBondDetailModal();

  const overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.15s ease;
  `;

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBondDetailModal();
  });

  // Trend badge
  const trend = bond.ratingTrend;
  const trendHtml = trend === 'improving'
    ? `<span class="trend-badge improving">▲ Improving</span>`
    : trend === 'deteriorating'
      ? `<span class="trend-badge deteriorating">▼ Deteriorating</span>`
      : `<span class="trend-badge stable">● Stable</span>`;

  // Build field grid
  const fields = `
    ${section('Identification')}
    ${row('ISIN', `<span style="font-family: monospace; font-size: 0.95rem;">${bond.isin}</span>`)}
    ${row('Issuer Name', bond.issuer)}
    ${bond.sector ? row('Sector', bond.sector) : ''}
    ${bond.category ? row('Category', bond.category) : ''}

    ${section('Instrument Details')}
    ${row('Credit Rating', `<span class="rating-badge ${ratingClass(bond.rating)}" style="font-size: 0.85rem;">${bond.rating}</span>`)}
    ${row('Rating Outlook', trendHtml)}
    ${bond.ratingOutlookNote ? row('Rating Note', bond.ratingOutlookNote) : ''}
    ${bond.securedUnsecured ? row('Security Type', bond.securedUnsecured) : ''}
    ${bond.guarantor ? row('Guarantor', bond.guarantor) : ''}
    ${bond.guarantorRating ? row('Guarantor Rating', bond.guarantorRating) : ''}

    ${section('Financials')}
    ${row('Offer Yield (YTM)', pct(bond.yield), true)}
    ${bond.coupon !== null && bond.coupon !== undefined ? row('Coupon Rate', pct(bond.coupon)) : ''}
    ${row('Interest Payment', bond.frequency)}
    ${bond.principalRedemption ? row('Principal Redemption', bond.principalRedemption) : ''}
    ${bond.faceValue ? row('Face Value (per unit)', fmtCurrency(bond.faceValue)) : ''}

    ${section('Tenure & Liquidity')}
    ${row('Redemption Date', bond.maturity)}
    ${row('Residual Tenure (months)', bond.months + 'm')}
    ${bond.residualTenure ? row('Residual Tenure (detailed)', bond.residualTenure) : ''}
    ${bond.totalTradableFV ? row('Total Tradable FV', fmtCurrency(bond.totalTradableFV)) : ''}
    ${bond.totalTradableQty ? row('Total Tradable Qty', fmt(bond.totalTradableQty, 0) + ' units') : ''}
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--bg-card, #1a1a2e);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      width: min(640px, 94vw);
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
          <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem;">Bond Detail</div>
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
    </div>
  `;

  document.body.appendChild(overlay);

  // Close button handler
  document.getElementById('bond-detail-close')?.addEventListener('click', closeBondDetailModal);

  // Keyboard: ESC to close
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { closeBondDetailModal(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

export function closeBondDetailModal(): void {
  document.getElementById(MODAL_ID)?.remove();
}
