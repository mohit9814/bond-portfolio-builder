import { getCreditCoverageRecord, IssuerCreditProfile } from './data/creditCoverageIntelligence';

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

  const container = document.createElement('div');
  container.id = 'credit-five-cs-modal-container';
  container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn';

  container.innerHTML = `
    <div class="relative w-full max-w-4xl bg-[#1e222d] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden text-gray-200 my-8">
      
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-[#2a2e39] bg-[#181a20]">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-lg border" style="background: ${scoreColor}15; border-color: ${scoreColor}40; color: ${scoreColor};">
            <span class="text-xl leading-none">${f.compositeScore}</span>
            <span class="text-[9px] uppercase font-bold tracking-wider mt-0.5">/ 100</span>
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h2 class="text-xl font-bold text-white tracking-wide">${profile.issuerName}</h2>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider" style="background: ${scoreColor}20; color: ${scoreColor}; border: 1px solid ${scoreColor}40;">
                ${f.creditGrade.replace(/_/g, ' ')}
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-1">
              Group: <strong class="text-gray-200">${profile.parentGroup}</strong> • Rating: <strong class="text-amber-300">${profile.rating}</strong> (${profile.ratingAgency})
            </p>
          </div>
        </div>
        <button id="close-five-cs-modal-btn" class="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#2a2e39] transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 max-h-[75vh] overflow-y-auto space-y-6">
        
        <!-- Quantitative Cash Flow & Coverage Ratios KPI Grid -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="text-emerald-400">📊</span> Quantitative Cash Flow & Debt Coverage Metrics
            </h3>
            <span class="text-xs text-gray-400">Institutional Banking Quality Standards</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            
            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Interest Coverage (ISCR)</div>
              <div class="text-xl font-extrabold mt-1 ${q.iscr >= 2.5 ? 'text-emerald-400' : q.iscr >= 1.75 ? 'text-amber-400' : 'text-red-400'}">
                ${q.iscr.toFixed(2)}x
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Benchmark: &gt; 2.0x (EBITDA / Interest)</div>
            </div>

            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Debt Service (DSCR)</div>
              <div class="text-xl font-extrabold mt-1 ${q.dscr >= 1.4 ? 'text-emerald-400' : q.dscr >= 1.2 ? 'text-amber-400' : 'text-red-400'}">
                ${q.dscr.toFixed(2)}x
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Benchmark: &gt; 1.25x (Cash / Debt Service)</div>
            </div>

            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Fixed Charge (FCCR)</div>
              <div class="text-xl font-extrabold mt-1 ${q.fccr >= 1.8 ? 'text-emerald-400' : 'text-amber-400'}">
                ${q.fccr.toFixed(2)}x
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Total Fixed Obligations Cushion</div>
            </div>

            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Security Cover Ratio</div>
              <div class="text-xl font-extrabold mt-1 text-emerald-400">
                ${q.securityCoverRatio.toFixed(2)}x
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Collateral Asset Cover Backing</div>
            </div>

            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">OCF-to-Total Debt</div>
              <div class="text-lg font-bold mt-1 text-cyan-400">
                ${q.ocfToDebtPercent.toFixed(1)}%
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Operational Cash Generation</div>
            </div>

            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Cash Flow from Ops (CFO)</div>
              <div class="text-lg font-bold mt-1 text-white">
                ₹${q.cfoCr.toLocaleString('en-IN')} Cr
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Annual Operating Inflows</div>
            </div>

            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Liquid Cash / Bank Lines</div>
              <div class="text-lg font-bold mt-1 text-indigo-400">
                ₹${q.cashEquivalentsCr.toLocaleString('en-IN')} Cr
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Unencumbered Liquidity</div>
            </div>

            <div class="p-3.5 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Debt-to-Equity Gearing</div>
              <div class="text-lg font-bold mt-1 ${q.gearingRatio <= 3.5 ? 'text-emerald-400' : 'text-amber-400'}">
                ${q.gearingRatio.toFixed(1)}x
              </div>
              <div class="text-[10px] text-gray-400 mt-0.5">Leverage Multiple</div>
            </div>

          </div>
        </div>

        <!-- The 5 Cs of Credit Framework Scorecard -->
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-[#2a2e39] pb-2">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="text-amber-400">🏛️</span> The 5 Cs of Credit Institutional Framework
            </h3>
            <span class="text-xs text-gray-400">Banking Assessment of Willingness & Ability to Repay</span>
          </div>

          <div class="space-y-3">
            
            <!-- 1. Character -->
            <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base">👤</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">1. Character (Governance, Integrity & Track Record)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">Score:</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/50">${f.character.score}/100</span>
                </div>
              </div>
              <p class="text-xs text-gray-300 mt-2 leading-relaxed">${f.character.summary}</p>
              <div class="mt-2.5 pt-2.5 border-t border-[#2a2e39]/60 flex flex-wrap gap-4 text-[11px] text-gray-400">
                <span><strong>Auditor:</strong> <span class="text-gray-300">${f.character.auditorQuality}</span></span>
                <span><strong>Creditor Record:</strong> <span class="text-gray-300">${f.character.creditorTrackRecord}</span></span>
              </div>
            </div>

            <!-- 2. Capacity -->
            <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base">⚡</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">2. Capacity (Cash Flow Generation & Debt Servicing)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">Score:</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-800/50">${f.capacity.score}/100</span>
                </div>
              </div>
              <p class="text-xs text-gray-300 mt-2 leading-relaxed">${f.capacity.summary}</p>
              <div class="mt-2.5 pt-2.5 border-t border-[#2a2e39]/60 flex flex-wrap gap-4 text-[11px] text-gray-400">
                <span><strong>Predictability:</strong> <span class="text-gray-300">${f.capacity.cashFlowPredictability}</span></span>
                <span><strong>Liquidity Runway:</strong> <span class="text-gray-300">${f.capacity.debtServicingRunway}</span></span>
              </div>
            </div>

            <!-- 3. Collateral -->
            <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base">🛡️</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">3. Collateral (Asset Protection & Security Cover)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">Score:</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-800/50">${f.collateral.score}/100</span>
                </div>
              </div>
              <p class="text-xs text-gray-300 mt-2 leading-relaxed">${f.collateral.summary}</p>
              <div class="mt-2.5 pt-2.5 border-t border-[#2a2e39]/60 flex flex-wrap gap-4 text-[11px] text-gray-400">
                <span><strong>Collateral Type:</strong> <span class="text-gray-300">${f.collateral.collateralType}</span></span>
                <span><strong>Charge:</strong> <span class="text-gray-300">${f.collateral.chargeExclusivity}</span></span>
                <span><strong>Escrow:</strong> <span class="text-gray-300">${f.collateral.escrowMechanism}</span></span>
              </div>
            </div>

            <!-- 4. Capital -->
            <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base">💰</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">4. Capital (Equity Cushion & Leverage Structure)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">Score:</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-800/50">${f.capital.score}/100</span>
                </div>
              </div>
              <p class="text-xs text-gray-300 mt-2 leading-relaxed">${f.capital.summary}</p>
              <div class="mt-2.5 pt-2.5 border-t border-[#2a2e39]/60 flex flex-wrap gap-4 text-[11px] text-gray-400">
                <span><strong>Net Worth:</strong> <span class="text-gray-300">₹${f.capital.netWorthCr ? f.capital.netWorthCr.toLocaleString('en-IN') : 'N/A'} Cr</span></span>
                <span><strong>CRAR / Capital Adequacy:</strong> <span class="text-emerald-400 font-bold">${f.capital.crarPercent}%</span></span>
                <span><strong>Leverage Buffer:</strong> <span class="text-gray-300">${f.capital.leverageBuffer}</span></span>
              </div>
            </div>

            <!-- 5. Conditions -->
            <div class="p-4 rounded-xl bg-[#14161c] border border-[#2a2e39]">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base">🌐</span>
                  <span class="text-xs font-bold text-white uppercase tracking-wider">5. Conditions (Macro Resilience & Regulatory Environment)</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">Score:</span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-800/50">${f.conditions.score}/100</span>
                </div>
              </div>
              <p class="text-xs text-gray-300 mt-2 leading-relaxed">${f.conditions.summary}</p>
              <div class="mt-2.5 pt-2.5 border-t border-[#2a2e39]/60 flex flex-wrap gap-4 text-[11px] text-gray-400">
                <span><strong>Macro Sensitivity:</strong> <span class="text-gray-300">${f.conditions.macroSensitivity}</span></span>
                <span><strong>Regulatory Trend:</strong> <span class="text-gray-300">${f.conditions.regulatoryTailwindHeadwind}</span></span>
                <span><strong>Sector Outlook:</strong> <span class="text-gray-300">${f.conditions.sectorOutlook}</span></span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 px-6 border-t border-[#2a2e39] bg-[#181a20]">
        <div class="text-xs text-gray-400">
          Framework: <span class="text-gray-300 font-medium">Standard & Poor's / Basel Institutional Credit Model</span>
        </div>
        <button id="five-cs-modal-close-footer" class="px-4 py-2 rounded-lg bg-[#2a2e39] hover:bg-[#343a48] text-sm font-semibold text-white transition-colors">
          Close Credit Memo
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  const closeFn = () => container.remove();
  document.getElementById('close-five-cs-modal-btn')?.addEventListener('click', closeFn);
  document.getElementById('five-cs-modal-close-footer')?.addEventListener('click', closeFn);
  container.addEventListener('click', (e) => {
    if (e.target === container) closeFn();
  });
}

if (typeof window !== 'undefined') {
  (window as unknown as { openCreditFiveCsModal: (isin: string) => void }).openCreditFiveCsModal = openCreditFiveCsModal;
}
