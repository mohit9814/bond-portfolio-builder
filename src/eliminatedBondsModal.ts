import { EliminatedBond, EliminationReason } from './bondEngine';
import { setCompanyOverride } from './overridesManager';

const MODAL_ID = 'eliminated-bonds-modal-overlay';

// ─── Config ───────────────────────────────────────────────────────────────────

interface ReasonMeta {
  label: string;
  icon: string;
  color: string;        // CSS color for badge
  bgColor: string;      // Pill background
  description: string;  // Shown in the group header
}

const REASON_META: Record<EliminationReason, ReasonMeta> = {
  ILLIQUID_QTY: {
    label: 'Zero Tradable Qty',
    icon: '🚫',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.12)',
    description: 'No units available to trade — bond cannot be purchased regardless of yield.'
  },
  ILLIQUID_FV: {
    label: 'Zero Tradable FV',
    icon: '🚫',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.12)',
    description: 'Total tradable face value is ₹0 — inventory is empty for this bond.'
  },
  TICKET_SIZE_TOO_LARGE: {
    label: 'Unit Price Exceeds Single Issuer Cap',
    icon: '⚖️',
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.12)',
    description: 'Physical unit ticket price exceeds the maximum single-issuer allocation limit for this portfolio size to protect diversification.'
  },
  BBB_TENOR_VIOLATION: {
    label: 'BBB > 12-Month Cap',
    icon: '⚠️',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.12)',
    description: 'Sub-A rated bonds may not be held beyond 12 months — regulatory risk management rule.'
  },
  BELOW_MIN_RATING: {
    label: 'Below Minimum Rating',
    icon: '⛔',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.12)',
    description: 'Rating does not meet the minimum credit quality threshold set for this portfolio.'
  },
  TENURE_MISMATCH: {
    label: 'Tenure Mismatch',
    icon: '📅',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.12)',
    description: 'Maturity date falls outside the investment horizon window.'
  },
  BUNDLE_FLEXI: {
    label: 'Bundle-Flexi Product',
    icon: '🔒',
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.12)',
    description: 'Bundle-Flexi structured products are excluded from all standard portfolios.'
  },
  USER_EXCLUDED: {
    label: 'Manually Excluded',
    icon: '🙅',
    color: '#64748b',
    bgColor: 'rgba(100,116,139,0.12)',
    description: 'Excluded by the advisor from this specific proposal.'
  },
  NOT_SELECTED: {
    label: 'Not Selected (Runner-up)',
    icon: '🏁',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.08)',
    description: 'Passed all risk filters — not chosen because a better-yielding bond filled the same maturity bucket.'
  },
  USER_EXCLUDE: {
    label: "User Excluded",
    icon: "🚫",
    color: "#ef4444",
    bgColor: "rgba(239,68,68,0.12)",
    description: "You manually excluded this company."
  },
  PROMOTER_GOVERNANCE_RISK: {
    label: "Promoter Governance / Negative Media",
    icon: "⚖️",
    color: "#f87171",
    bgColor: "rgba(239, 68, 68, 0.15)",
    description: "Excluded due to adverse promoter negative media, regulatory supervisory restrictions, or corporate governance litigation."
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (n: number) => (n * 100).toFixed(2) + '%';


// ─── Summary Bar (shown inline above the portfolio table) ─────────────────────

/**
 * Renders the collapsed summary bar above the portfolio table.
 * Clicking it opens the full drill-down modal.
 */
export function renderEliminatedSummaryBar(
  eliminated: EliminatedBond[],
  totalInventory: number,
  container: HTMLElement
): void {
  container.innerHTML = '';

  if (eliminated.length === 0) return;

  // Count by reason
  const counts: Partial<Record<EliminationReason, number>> = {};
  for (const e of eliminated) {
    counts[e.reason] = (counts[e.reason] ?? 0) + 1;
  }

  // Priority order for the summary pills — most risk-relevant first
  const priorityOrder: EliminationReason[] = [
    'ILLIQUID_QTY', 'ILLIQUID_FV', 'BBB_TENOR_VIOLATION',
    'BELOW_MIN_RATING', 'TENURE_MISMATCH', 'BUNDLE_FLEXI',
    'USER_EXCLUDED', 'NOT_SELECTED'
  ];

  const pillsHtml = priorityOrder
    .filter(r => counts[r])
    .map(r => {
      const meta = REASON_META[r];
      return `
        <span style="
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.2rem 0.6rem; border-radius: 99px;
          background: ${meta.bgColor}; border: 1px solid ${meta.color}40;
          font-size: 0.72rem; font-weight: 600; color: ${meta.color};
          white-space: nowrap;
        ">
          ${meta.icon} ${counts[r]} ${meta.label}
        </span>`;
    }).join('');

  container.innerHTML = `
    <div id="eliminated-summary-bar" style="
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
      gap: 0.6rem; padding: 0.8rem 1.2rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; margin-bottom: 1rem;
      cursor: pointer; transition: background 0.15s;
    " title="Click to see all screened-out bonds">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); white-space: nowrap;">
          🔍 ${eliminated.length} of ${totalInventory} bonds screened out
        </span>
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">${pillsHtml}</div>
      </div>
      <span style="font-size: 0.75rem; color: var(--accent-blue); font-weight: 600; white-space: nowrap; flex-shrink: 0;">
        View details →
      </span>
    </div>
  `;

  const bar = container.querySelector('#eliminated-summary-bar') as HTMLElement;
  bar.addEventListener('mouseenter', () => { bar.style.background = 'rgba(255,255,255,0.055)'; });
  bar.addEventListener('mouseleave', () => { bar.style.background = 'rgba(255,255,255,0.03)'; });
  bar.addEventListener('click', () => openEliminatedBondsModal(eliminated, totalInventory));
}

// ─── Drill-down Modal ─────────────────────────────────────────────────────────

// Make it globally accessible for the inline onclick handler
(window as any).forceIncludeCompany = (issuer: string) => {
  const comment = prompt(`Please provide a reason to auto-include the company "${issuer}" in future recommendations:`);
  if (comment !== null && comment.trim() !== '') {
    setCompanyOverride(issuer, 'INCLUDE', comment.trim());
    // The main dashboard will catch the event, we can also close this modal
    document.body.removeChild(document.getElementById('eliminated-bonds-modal-overlay')!);
  }
};

export function openEliminatedBondsModal(
  eliminated: EliminatedBond[],
  totalInventory: number
): void {
  closeEliminatedBondsModal();

  // Active filter state
  let activeFilter: EliminationReason | 'ALL' = 'ALL';

  const overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(4px);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 2vh 1rem; overflow-y: auto;
    animation: fadeIn 0.15s ease;
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeEliminatedBondsModal(); });

  const counts: Partial<Record<EliminationReason, number>> = {};
  for (const e of eliminated) {
    counts[e.reason] = (counts[e.reason] ?? 0) + 1;
  }

  // Render the full modal content (rebuilt on filter change)
  const render = () => {
    const filtered = activeFilter === 'ALL' ? eliminated : eliminated.filter(e => e.reason === activeFilter);

    const priorityOrder: EliminationReason[] = [
      'ILLIQUID_QTY', 'ILLIQUID_FV', 'BBB_TENOR_VIOLATION',
      'BELOW_MIN_RATING', 'TENURE_MISMATCH', 'BUNDLE_FLEXI',
      'USER_EXCLUDED', 'NOT_SELECTED'
    ];

    // Filter tabs
    const tabsHtml = [
      { key: 'ALL' as const, label: `All  (${eliminated.length})`, color: 'var(--text-primary)', bg: 'rgba(255,255,255,0.08)' },
      ...priorityOrder.filter(r => counts[r]).map(r => ({
        key: r,
        label: `${REASON_META[r].icon} ${REASON_META[r].label} (${counts[r]})`,
        color: REASON_META[r].color,
        bg: REASON_META[r].bgColor
      }))
    ].map(t => {
      const isActive = activeFilter === t.key;
      return `
        <button data-filter="${t.key}" style="
          padding: 0.3rem 0.75rem; border-radius: 99px; border: 1px solid ${isActive ? t.color : 'rgba(255,255,255,0.12)'};
          background: ${isActive ? t.bg : 'transparent'}; color: ${isActive ? t.color : 'var(--text-secondary)'};
          font-size: 0.72rem; font-weight: 600; cursor: pointer; white-space: nowrap;
          transition: all 0.12s;
        ">${t.label}</button>`;
    }).join('');

    // Bond rows table
    const rowsHtml = filtered.length === 0
      ? `<tr><td colspan="8" style="text-align:center; padding: 2rem; color: var(--text-secondary);">No bonds in this category.</td></tr>`
      : filtered.map(e => {
        const meta = REASON_META[e.reason];
        const yieldStr = e.bond.yield > 0 ? pct(e.bond.yield) : '—';
        const couponStr = e.bond.coupon !== null && e.bond.coupon !== undefined ? pct(e.bond.coupon) : '—';
        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.1s; cursor: pointer;"
              onmouseenter="this.style.background='rgba(255,255,255,0.03)'"
              onmouseleave="this.style.background=''">
            <td style="padding: 0.6rem 0.75rem; font-family: monospace; font-size: 0.77rem; color: var(--text-secondary);">
              ${e.bond.isin}
            </td>
            <td style="padding: 0.6rem 0.75rem; font-weight: 600; font-size: 0.85rem; max-width: 200px; cursor: pointer; color: var(--accent-blue);"
                title="View Bond Details"
                onclick="if(window.openBondDetailByIsin) window.openBondDetailByIsin('${e.bond.isin}')">
              ${e.bond.issuer}
            </td>
            <td style="padding: 0.6rem 0.75rem; text-align: center;">
              <span style="font-size: 0.75rem; background: rgba(255,255,255,0.06); padding: 0.15rem 0.45rem; border-radius: 4px;">
                ${e.bond.rating}
              </span>
            </td>
            <td style="padding: 0.6rem 0.75rem; text-align: right; font-weight: 700; color: #34d399;">${yieldStr}</td>
            <td style="padding: 0.6rem 0.75rem; text-align: right; color: var(--text-secondary); font-size: 0.82rem;">${couponStr}</td>
            <td style="padding: 0.6rem 0.75rem; text-align: center;">
              <span style="
                display: inline-flex; align-items: center; gap: 0.25rem;
                padding: 0.2rem 0.55rem; border-radius: 99px;
                background: ${meta.bgColor}; border: 1px solid ${meta.color}40;
                font-size: 0.68rem; font-weight: 700; color: ${meta.color};
              ">${meta.icon} ${meta.label}</span>
            </td>
            <td style="padding: 0.6rem 0.75rem; font-size: 0.75rem; color: var(--text-secondary); max-width: 280px;">
              ${e.detail}
            </td>
            <td style="padding: 0.6rem 0.75rem; text-align: right;">
              <button onclick="window.forceIncludeCompany('${e.bond.issuer.replace(/'/g, "\\'")}')" 
                style="background: transparent; border: 1px solid var(--border-glass); color: var(--text-primary); font-size: 0.7rem; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;">
                Override
              </button>
            </td>
          </tr>`;
      }).join('');

    overlay.innerHTML = `
      <div style="
        background: var(--bg-card, #111827);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        width: min(1100px, 96vw);
        max-height: 92vh;
        display: flex; flex-direction: column;
        box-shadow: 0 32px 100px rgba(0,0,0,0.65);
        animation: slideUp 0.2s ease;
        overflow: hidden;
      ">
        <!-- Sticky Header -->
        <div style="
          padding: 1.4rem 1.6rem 0.9rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: var(--bg-card, #111827);
          flex-shrink: 0;
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.9rem;">
            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); margin-bottom: 0.25rem;">Risk Screening Report</div>
              <div style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">
                ${eliminated.length} Bonds Screened Out
                <span style="font-size: 0.85rem; font-weight: 400; color: var(--text-secondary); margin-left: 0.5rem;">of ${totalInventory} total in inventory</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.3rem;">
                ${totalInventory - eliminated.filter(e => e.reason === 'NOT_SELECTED').length - (totalInventory - eliminated.length)} bonds passed all filters &nbsp;·&nbsp; 
                ${counts.NOT_SELECTED ?? 0} runner-ups not chosen by optimizer &nbsp;·&nbsp; 
                ${totalInventory - eliminated.length} bonds recommended
              </div>
            </div>
            <button id="eliminated-modal-close" style="
              background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
              border-radius: 8px; color: var(--text-primary); cursor: pointer;
              font-size: 1.1rem; padding: 0.35rem 0.6rem; flex-shrink: 0;
            ">✕</button>
          </div>

          <!-- Filter tabs -->
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;" id="filter-tabs">
            ${tabsHtml}
          </div>
        </div>

        <!-- Scrollable Table -->
        <div style="overflow-y: auto; flex: 1;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.83rem;">
            <thead style="position: sticky; top: 0; background: #0d1117; z-index: 1;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <th style="padding: 0.65rem 0.75rem; text-align: left; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">ISIN</th>
                <th style="padding: 0.65rem 0.75rem; text-align: left; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Issuer</th>
                <th style="padding: 0.65rem 0.75rem; text-align: center; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Rating</th>
                <th style="padding: 0.65rem 0.75rem; text-align: right; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">YTM</th>
                <th style="padding: 0.65rem 0.75rem; text-align: right; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Coupon</th>
                <th style="padding: 0.65rem 0.75rem; text-align: center; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Reason</th>
                <th style="padding: 0.65rem 0.75rem; text-align: left; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Explanation</th>
                <th style="padding: 0.65rem 0.75rem; text-align: right; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); font-weight: 600;">Action</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>

        <!-- Footer note -->
        <div style="
          padding: 0.75rem 1.6rem; border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.72rem; color: var(--text-secondary); flex-shrink: 0;
        ">
          💡 This screening report is generated automatically by the Bond Portfolio Engine. Every exclusion is driven by a specific rule — liquidity, credit quality, tenure, or regulatory constraints — not subjective judgment.
        </div>
      </div>
    `;

    // Close button
    overlay.querySelector('#eliminated-modal-close')?.addEventListener('click', closeEliminatedBondsModal);

    // Filter tab click handlers
    overlay.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = (btn as HTMLElement).dataset.filter as EliminationReason | 'ALL';
        render();
      });
    });
  };

  render();
  document.body.appendChild(overlay);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { closeEliminatedBondsModal(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);
}

export function closeEliminatedBondsModal(): void {
  document.getElementById(MODAL_ID)?.remove();
}
