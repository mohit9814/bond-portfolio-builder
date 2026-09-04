/**
 * Dedicated Forensic Audit & Promoter Governance View
 *
 * Centralized dashboard displaying forensic research, negative media, regulatory actions,
 * past bankruptcies, and BSE GID / NSDL debt memorandum terms across all issuers.
 */

import { getAllPromoterRecords, PromoterRiskRecord, getRiskSeverityStyling } from '../data/promoterIntelligence';
import { getBseGidRecord } from '../data/bseGidIntelligence';
import { openPromoterAuditModal } from '../promoterModal';
import { DefaultBond } from '../defaultInventory';

export interface AuditFilterState {
  searchQuery: string;
  severityFilter: string;
}

const filterState: AuditFilterState = {
  searchQuery: '',
  severityFilter: 'ALL'
};

export function renderAuditView(container: HTMLElement, inventory: DefaultBond[]): void {
  const allPromoters = getAllPromoterRecords();
  
  // Apply search and severity filters
  const filtered = allPromoters.filter(p => {
    if (filterState.severityFilter !== 'ALL' && p.riskSeverity !== filterState.severityFilter) {
      return false;
    }
    if (filterState.searchQuery.trim() !== '') {
      const q = filterState.searchQuery.toLowerCase();
      const matchName = p.entityName.toLowerCase().includes(q);
      const matchPromoter = p.promotersAndKeyPersons.some(k => k.toLowerCase().includes(q));
      const matchSubs = p.aliasesAndSubsidiaries.some(s => s.toLowerCase().includes(q));
      const matchCase = p.detailedCaseHistory.toLowerCase().includes(q);
      if (!matchName && !matchPromoter && !matchSubs && !matchCase) return false;
    }
    return true;
  });

  // KPI Calculations
  const criticalCount = allPromoters.filter(p => p.riskSeverity === 'CRITICAL').length;
  const highCount = allPromoters.filter(p => p.riskSeverity === 'HIGH').length;
  const cleanCount = allPromoters.filter(p => p.riskSeverity === 'CLEAN').length;
  const avgScore = Math.round(allPromoters.reduce((sum, p) => sum + p.governanceScore, 0) / (allPromoters.length || 1));

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 3rem;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(30, 41, 59, 0.7) 100%); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 16px; padding: 1.5rem 1.8rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.6rem;">⚖️</span>
            <h2 style="margin: 0; font-size: 1.4rem; color: var(--accent-gold); font-weight: 700;">Promoter Governance & Forensic Risk Audit</h2>
          </div>
          <p style="margin: 0.4rem 0 0; font-size: 0.88rem; color: var(--text-secondary); max-width: 750px; line-height: 1.4;">
            Institutional forensic intelligence tracking corporate governance, regulatory bans (RBI/SEBI), past bankruptcies, civil/criminal litigation, and BSE GID debt covenants across all inventory issuers.
          </p>
        </div>
        <div style="display: flex; gap: 0.8rem; align-items: center;">
          <button id="audit-export-csv" class="btn" style="background: rgba(255,255,255,0.08); color: var(--text-primary); border: 1px solid rgba(255,255,255,0.15); font-size: 0.85rem; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
            📥 Export Forensic Audit CSV
          </button>
        </div>
      </div>

      <!-- KPI Metrics Bento -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div style="background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.2rem;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">Monitored Entities</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 0.3rem;">${allPromoters.length}</div>
          <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">Covering 100% active inventory</div>
        </div>

        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 1.2rem;">
          <div style="font-size: 0.75rem; color: #f87171; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Critical Regulatory Bans</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #ef4444; margin-top: 0.3rem;">${criticalCount}</div>
          <div style="font-size: 0.72rem; color: #fca5a5; margin-top: 0.2rem;">Auto-excluded from proposals</div>
        </div>

        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 1.2rem;">
          <div style="font-size: 0.75rem; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Elevated Scrutiny / Litigations</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #f59e0b; margin-top: 0.3rem;">${highCount}</div>
          <div style="font-size: 0.72rem; color: #fde68a; margin-top: 0.2rem;">Requires advisor override</div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 1.2rem;">
          <div style="font-size: 0.75rem; color: #34d399; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700;">Clean / Sovereign Grade</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #10b981; margin-top: 0.3rem;">${cleanCount}</div>
          <div style="font-size: 0.72rem; color: #a7f3d0; margin-top: 0.2rem;">Sovereign / AAA Tier-1</div>
        </div>

        <div style="background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.2rem;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em;">Avg Governance Score</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.3rem;">${avgScore}/100</div>
          <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.2rem;">Universe governance health</div>
        </div>
      </div>

      <!-- Search & Filters Control Bar -->
      <div style="background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem 1.4rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 260px; position: relative;">
          <input type="text" id="audit-search-input" value="${filterState.searchQuery}" placeholder="🔍 Search by company, promoter, case history, subsidiary..." style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.65rem 1rem; color: var(--text-primary); font-size: 0.9rem; outline: none; box-sizing: border-box;" />
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Severity:</span>
          <select id="audit-severity-select" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.65rem 0.9rem; color: var(--text-primary); font-size: 0.88rem; outline: none; cursor: pointer;">
            <option value="ALL" ${filterState.severityFilter === 'ALL' ? 'selected' : ''}>All Severities (${allPromoters.length})</option>
            <option value="CRITICAL" ${filterState.severityFilter === 'CRITICAL' ? 'selected' : ''}>Critical Risk (${criticalCount})</option>
            <option value="HIGH" ${filterState.severityFilter === 'HIGH' ? 'selected' : ''}>High Risk (${highCount})</option>
            <option value="MEDIUM" ${filterState.severityFilter === 'MEDIUM' ? 'selected' : ''}>Medium Scrutiny</option>
            <option value="LOW" ${filterState.severityFilter === 'LOW' ? 'selected' : ''}>Low Risk</option>
            <option value="CLEAN" ${filterState.severityFilter === 'CLEAN' ? 'selected' : ''}>Clean / Sovereign (${cleanCount})</option>
          </select>
        </div>
      </div>

      <!-- Forensic Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 1.25rem;">
        ${filtered.map(p => renderPromoterCard(p, inventory)).join('')}
      </div>
    </div>
  `;

  // Attach Event Listeners
  const searchInput = container.querySelector('#audit-search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', () => {
    filterState.searchQuery = searchInput.value;
    renderAuditView(container, inventory);
  });

  const severitySelect = container.querySelector('#audit-severity-select') as HTMLSelectElement;
  severitySelect?.addEventListener('change', () => {
    filterState.severityFilter = severitySelect.value;
    renderAuditView(container, inventory);
  });

  const exportBtn = container.querySelector('#audit-export-csv');
  exportBtn?.addEventListener('click', () => {
    exportAuditCsv(filtered);
  });

  // Bind Card Click to Open Audit Modal
  container.querySelectorAll('.audit-card-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const entityKey = (e.currentTarget as HTMLElement).getAttribute('data-entity-key');
      const rec = allPromoters.find(p => p.entityKey === entityKey);
      if (rec) {
        const dummyBond: DefaultBond = {
          isin: rec.aliasesAndSubsidiaries[0] || 'INE000000000',
          issuer: rec.entityName,
          yield: 0.11,
          coupon: 0.11,
          maturity: '2028-01-01',
          months: 24,
          rating: 'A',
          frequency: 'ANNUALLY'
        };
        openPromoterAuditModal(dummyBond);
      }
    });
  });
}

function renderPromoterCard(p: PromoterRiskRecord, _inventory: DefaultBond[]): string {
  const styling = getRiskSeverityStyling(p.riskSeverity);
  const gid = getBseGidRecord(p.entityName);
  
  const scoreColor = p.governanceScore >= 80 ? '#34d399' : p.governanceScore >= 50 ? '#fbbf24' : '#f87171';
  const promoterText = p.promotersAndKeyPersons && p.promotersAndKeyPersons.length > 0
    ? p.promotersAndKeyPersons.join(', ')
    : 'Professional Board / Institutional Management';

  return `
    <div style="background: var(--bg-card, #1a1a2e); border: 1px solid var(--border-glass); border-radius: 14px; padding: 1.4rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; transition: transform 0.15s, border-color 0.15s;" onmouseenter="this.style.borderColor='rgba(212,175,55,0.4)'" onmouseleave="this.style.borderColor='var(--border-glass)'">
      <div>
        <!-- Top Title & Badge -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.8rem;">
          <div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">${p.entityName}</div>
            <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.2rem;">
              Promoter / Key Person: <strong style="color: var(--accent-gold);">${promoterText}</strong>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem;">
            <span style="font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.5rem; text-transform: uppercase; border-radius: 6px; background: ${styling.bg}; color: ${styling.color}; border: 1px solid ${styling.border};">
              ${styling.icon} ${p.riskSeverity}
            </span>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${scoreColor};">
              Score: ${p.governanceScore}/100
            </span>
          </div>
        </div>

        <!-- Group Subsidiaries / Aliases -->
        <div style="margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.35rem;">
          ${p.aliasesAndSubsidiaries.map(sub => `
            <span style="background: rgba(255,255,255,0.06); color: var(--text-secondary); font-size: 0.68rem; padding: 0.15rem 0.45rem; border-radius: 4px;">${sub}</span>
          `).join('')}
        </div>

        <!-- Case History Snippet -->
        <div style="margin-top: 0.85rem; padding: 0.75rem; background: rgba(0,0,0,0.25); border-radius: 8px; border-left: 3px solid ${p.riskSeverity === 'CRITICAL' ? '#ef4444' : p.riskSeverity === 'HIGH' ? '#f59e0b' : '#38bdf8'};">
          <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 0.25rem;">Forensic History & Background</div>
          <div style="font-size: 0.8rem; color: var(--text-primary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${p.detailedCaseHistory}
          </div>
        </div>

        <!-- BSE GID Fundamental Covenants Snippet -->
        ${gid ? `
          <div style="margin-top: 0.75rem; padding: 0.6rem 0.75rem; background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 8px; font-size: 0.76rem;">
            <div style="color: #38bdf8; font-weight: 700; margin-bottom: 0.2rem;">📑 BSE GID & Covenants:</div>
            <div style="color: var(--text-secondary);">Security Cover: <strong style="color: #4ade80;">${gid.securityCoverRatio}</strong> | Trustee: <strong>${gid.debentureTrustee}</strong></div>
          </div>
        ` : ''}
      </div>

      <!-- Card Action Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem; margin-top: 0.5rem;">
        <div style="font-size: 0.72rem; color: ${p.autoExcludeFromProposals ? '#f87171' : '#34d399'}; font-weight: 600;">
          ${p.autoExcludeFromProposals ? '⛔ Auto-Excluded by Default' : '✓ Approved for Proposals'}
        </div>
        <button class="btn audit-card-action" data-entity-key="${p.entityKey}" style="background: rgba(212, 175, 55, 0.15); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.35); padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 700; border-radius: 6px; cursor: pointer;">
          🔍 Full Forensic Report
        </button>
      </div>
    </div>
  `;
}

function exportAuditCsv(records: PromoterRiskRecord[]): void {
  const headers = [
    'Entity Name',
    'Promoters & Key Persons',
    'Risk Severity',
    'Governance Score',
    'Auto Excluded',
    'Exclusion Reason',
    'Aliases & Group Subsidiaries',
    'Case History',
    'Investment Verdict'
  ];

  const rows = records.map(r => [
    `"${r.entityName.replace(/"/g, '""')}"`,
    `"${r.promotersAndKeyPersons.join('; ').replace(/"/g, '""')}"`,
    `"${r.riskSeverity}"`,
    r.governanceScore,
    r.autoExcludeFromProposals ? 'YES' : 'NO',
    `"${(r.exclusionReason || '').replace(/"/g, '""')}"`,
    `"${r.aliasesAndSubsidiaries.join('; ').replace(/"/g, '""')}"`,
    `"${r.detailedCaseHistory.replace(/"/g, '""')}"`,
    `"${r.investmentVerdict.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Forensic_Promoter_Governance_Audit_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
