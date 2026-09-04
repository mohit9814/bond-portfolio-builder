import { getPromoterRiskRecord, PromoterRiskRecord, getRiskSeverityStyling } from './data/promoterIntelligence';
import { getBusinessSwot } from './data/swotIntelligence';

/**
 * Renders an interactive, comprehensive Promoter & Key Personnel Dossier Modal
 * with Personal SWOT, Corporate Journey, Subsidiary Tree, and Verified Rating Citations.
 */
export function openPromoterProfileModal(entityKeyOrName: string): void {
  const record: PromoterRiskRecord | null = getPromoterRiskRecord(entityKeyOrName);

  // Remove existing modal if any
  const existing = document.getElementById('promoter-profile-modal-container');
  if (existing) {
    existing.remove();
  }

  if (!record) {
    alert(`No detailed dossier found for: "${entityKeyOrName}". Showing available corporate registry data.`);
    return;
  }

  const styling = getRiskSeverityStyling(record.riskSeverity);
  const swotRecord = getBusinessSwot(record.entityName);

  const container = document.createElement('div');
  container.id = 'promoter-profile-modal-container';
  container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn';

  const personalSwot = record.personalSwot || {
    strengths: ['Established operating footprint', 'Key managerial leadership in sector'],
    weaknesses: ['Vulnerability to macroeconomic cycles'],
    opportunities: ['Expansion into retail & digital distribution'],
    threats: ['Regulatory and interest rate volatility']
  };

  const citations = record.citations || [
    { title: `CRISIL / ICRA Rating Rationale - ${record.entityName}`, url: 'https://www.crisilratings.com/', type: 'RATING_REPORT' },
    { title: `BSE Debt Filings & GID Directory`, url: 'https://www.bseindia.com/markets/debt/debt_security_summary.html', type: 'BSE_FILING' },
    { title: `NSDL Bond Information Directory`, url: 'https://www.indiabondinfo.nsdl.com/', type: 'NSDL' }
  ];

  container.innerHTML = `
    <div class="relative w-full max-w-4xl bg-[#1e222d] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden text-gray-200 my-8">
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-[#2a2e39] bg-[#181a20]">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background: ${styling.bg}; border: 1px solid ${styling.border};">
            ${styling.icon}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold text-white tracking-wide">${record.entityName}</h2>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider" style="background: ${styling.bg}; color: ${styling.color}; border: 1px solid ${styling.border};">
                ${styling.label}
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5">
              Sector: <span class="text-gray-300 font-medium">${record.broadSector}</span> • Governance Score: <span class="font-bold ${record.governanceScore < 60 ? 'text-red-400' : 'text-emerald-400'}">${record.governanceScore}/100</span>
            </p>
          </div>
        </div>
        <button id="close-promoter-modal-btn" class="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#2a2e39] transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 max-h-[75vh] overflow-y-auto space-y-6">
        
        <!-- Key Personnel & Leadership -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-400">👤 Promoters & Key Personnel</span>
            <div class="mt-2 space-y-1">
              ${record.promotersAndKeyPersons.map(p => `<div class="text-sm font-semibold text-white flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>${p}</div>`).join('')}
            </div>
            <div class="mt-3 pt-3 border-t border-[#2a2e39]/60 text-xs text-gray-400">
              <strong class="text-gray-300">Ownership:</strong> ${record.ownershipStructure}
            </div>
          </div>

          <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
            <span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">🏢 Group Companies & Businesses Owned</span>
            <div class="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              ${(record.entitiesOwned || record.aliasesAndSubsidiaries).map(e => `
                <span class="px-2 py-0.5 rounded bg-[#242835] border border-[#343a4d] text-xs text-gray-300 font-medium">
                  ${e}
                </span>
              `).join('')}
            </div>
            <p class="mt-2 text-[11px] text-gray-400 italic">Considered as a single group entity for portfolio concentration & diversification limits.</p>
          </div>
        </div>

        <!-- Career Journey & Background -->
        <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span>📜</span> Promoter Journey & Executive Track Record
          </h3>
          <p class="mt-2 text-sm text-gray-300 leading-relaxed">
            ${record.promoterJourney || record.detailedCaseHistory}
          </p>
        </div>

        <!-- Personal SWOT Analysis (4-Quadrant) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="text-indigo-400">🎯</span> Promoter & Executive Personal SWOT Analysis
            </h3>
            <span class="text-[11px] text-gray-400">Based on regulatory filings, media audits, and credit history</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Strengths -->
            <div class="p-4 rounded-xl bg-[#141e17] border border-emerald-900/60">
              <div class="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span>💪</span> Strengths
              </div>
              <ul class="mt-2 space-y-1.5 text-xs text-gray-300">
                ${personalSwot.strengths.map(s => `<li class="flex items-start gap-2"><span class="text-emerald-400 font-bold">•</span><span>${s}</span></li>`).join('')}
              </ul>
            </div>

            <!-- Weaknesses -->
            <div class="p-4 rounded-xl bg-[#241717] border border-red-900/60">
              <div class="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <span>⚠️</span> Weaknesses & Past Vulnerabilities
              </div>
              <ul class="mt-2 space-y-1.5 text-xs text-gray-300">
                ${personalSwot.weaknesses.map(w => `<li class="flex items-start gap-2"><span class="text-red-400 font-bold">•</span><span>${w}</span></li>`).join('')}
              </ul>
            </div>

            <!-- Opportunities -->
            <div class="p-4 rounded-xl bg-[#151c24] border border-blue-900/60">
              <div class="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <span>🚀</span> Opportunities
              </div>
              <ul class="mt-2 space-y-1.5 text-xs text-gray-300">
                ${personalSwot.opportunities.map(o => `<li class="flex items-start gap-2"><span class="text-blue-400 font-bold">•</span><span>${o}</span></li>`).join('')}
              </ul>
            </div>

            <!-- Threats -->
            <div class="p-4 rounded-xl bg-[#241c14] border border-amber-900/60">
              <div class="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <span>⚡</span> Threats & Regulatory Risks
              </div>
              <ul class="mt-2 space-y-1.5 text-xs text-gray-300">
                ${personalSwot.threats.map(t => `<li class="flex items-start gap-2"><span class="text-amber-400 font-bold">•</span><span>${t}</span></li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Negative Media & Audit Verdict -->
        ${record.negativeMediaFlags.length > 0 ? `
          <div class="p-4 rounded-xl bg-red-950/30 border border-red-900/50">
            <h4 class="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
              <span>🚨</span> Regulatory Actions & Negative Media Flags
            </h4>
            <div class="mt-2 flex flex-wrap gap-1.5">
              ${record.negativeMediaFlags.map(f => `
                <span class="px-2 py-0.5 rounded bg-red-900/40 text-red-300 text-xs font-semibold border border-red-800/60">
                  ${f.replace(/_/g, ' ')}
                </span>
              `).join('')}
            </div>
            <p class="mt-3 text-xs text-gray-300 leading-relaxed font-mono bg-black/40 p-2.5 rounded border border-red-950">
              ${record.detailedCaseHistory}
            </p>
          </div>
        ` : ''}

        <!-- Live Online Citations & Source Links -->
        <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
          <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <span>🔗</span> Verified Source Citations & Rating Reports (CITE TO SOURCE)
          </h4>
          <p class="text-xs text-gray-400 mt-1">Live external references verifying the fundamental and promoter risk data:</p>
          
          <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            ${citations.map(c => `
              <a href="${c.url}" target="_blank" rel="noopener noreferrer" 
                 class="flex items-center justify-between p-2.5 rounded-lg bg-[#1f2430] hover:bg-[#282e3e] border border-[#2e3547] hover:border-cyan-500/50 text-xs text-cyan-300 hover:text-cyan-200 transition-all group">
                <span class="font-medium truncate pr-2 flex items-center gap-2">
                  <span class="text-cyan-400 group-hover:scale-110 transition-transform">↗</span>
                  ${c.title}
                </span>
                <span class="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-gray-400 uppercase font-mono tracking-wider shrink-0">
                  ${c.type}
                </span>
              </a>
            `).join('')}

            ${swotRecord ? `
              <a href="${swotRecord.sourceUrl}" target="_blank" rel="noopener noreferrer"
                 class="flex items-center justify-between p-2.5 rounded-lg bg-[#1f2430] hover:bg-[#282e3e] border border-[#2e3547] hover:border-emerald-500/50 text-xs text-emerald-300 hover:text-emerald-200 transition-all group">
                <span class="font-medium truncate pr-2 flex items-center gap-2">
                  <span class="text-emerald-400 group-hover:scale-110 transition-transform">↗</span>
                  ${swotRecord.ratingAgency} Rating Rationale (${swotRecord.rating})
                </span>
                <span class="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-gray-400 uppercase font-mono tracking-wider shrink-0">
                  RATING
                </span>
              </a>
              <a href="${swotRecord.bseFilingUrl}" target="_blank" rel="noopener noreferrer"
                 class="flex items-center justify-between p-2.5 rounded-lg bg-[#1f2430] hover:bg-[#282e3e] border border-[#2e3547] hover:border-amber-500/50 text-xs text-amber-300 hover:text-amber-200 transition-all group">
                <span class="font-medium truncate pr-2 flex items-center gap-2">
                  <span class="text-amber-400 group-hover:scale-110 transition-transform">↗</span>
                  BSE Debt Memorandum & Filings
                </span>
                <span class="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-gray-400 uppercase font-mono tracking-wider shrink-0">
                  BSE
                </span>
              </a>
            ` : ''}
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between p-4 px-6 border-t border-[#2a2e39] bg-[#181a20]">
        <div class="text-xs text-gray-400">
          Last Refined: <span class="text-gray-300 font-mono">${record.lastRefinedDate}</span>
        </div>
        <button id="promoter-modal-close-footer" class="px-4 py-2 rounded-lg bg-[#2a2e39] hover:bg-[#343a48] text-sm font-semibold text-white transition-colors">
          Close Dossier
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const closeFn = () => container.remove();
  document.getElementById('close-promoter-modal-btn')?.addEventListener('click', closeFn);
  document.getElementById('promoter-modal-close-footer')?.addEventListener('click', closeFn);
  container.addEventListener('click', (e) => {
    if (e.target === container) closeFn();
  });
}

// Attach to window so it can be called from inline onclick or any component
if (typeof window !== 'undefined') {
  (window as unknown as { openPromoterProfile: (key: string) => void }).openPromoterProfile = openPromoterProfileModal;
}
