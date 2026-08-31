import { DefaultBond } from '../defaultInventory';
import { PortfolioHolding, PortfolioRiskAssessment, ExitRecommendation, AddRecommendation, MaturityReinvestmentItem } from './types';
import { parsePortfolioInput, SAMPLE_PORTFOLIO_RAW } from './portfolioParser';
import { assessPortfolioRisk, generateExitRecommendations, generateAddRecommendations, generateMaturityReinvestmentSchedule } from './riskEngine';
import { initDrillableChart, setChartViewMode, clearDrilldownFilter, getActiveDrilldownFilter, ChartViewMode } from './analyzerCharts';
import { openRatingEvidenceModal } from './ratingEvidenceModal';

let currentInventory: DefaultBond[] = [];
let currentHoldings: PortfolioHolding[] = [];
let currentAssessment: PortfolioRiskAssessment | null = null;
let currentExits: ExitRecommendation[] = [];
let currentAdds: AddRecommendation[] = [];
let currentMaturities: MaturityReinvestmentItem[] = [];
let currentChartMode: ChartViewMode = 'promoter';

// Global hook for inline row buttons
(window as any).openRatingEvidenceByIsin = (isin: string) => {
  const holding = currentHoldings.find(h => h.isin === isin);
  if (holding) openRatingEvidenceModal(holding);
};

export function setAnalyzerInventory(inventory: DefaultBond[]) {
  currentInventory = inventory;
}

export function initPortfolioAnalyzer(inventory: DefaultBond[]) {
  currentInventory = inventory;
  renderAnalyzerLayout();
  // Automatically load sample portfolio by default for instant gratification
  analyzePortfolioText(SAMPLE_PORTFOLIO_RAW);
}

function renderAnalyzerLayout() {
  const container = document.getElementById('analyzer-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%); border: 1px solid var(--border-glass); border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(12px);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.4rem; color: var(--accent-gold); margin: 0; display: flex; align-items: center; gap: 0.6rem;">
              🛡️ Current Bond Portfolio Analyzer & Rebalancer
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.35rem 0 0 0;">
              Evidence-based credit ratings, promoter concentration, interactive drilldown analytics, and yield optimization
            </p>
          </div>
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button id="load-sample-portfolio-btn" class="btn" style="background: rgba(212, 175, 55, 0.15); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.35); font-weight: 600; font-size: 0.85rem; padding: 0.5rem 1rem;">
              ⚡ Load Sample Portfolio (21 Holdings)
            </button>
            <button id="export-rebalancing-csv-btn" class="btn" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); font-weight: 600; font-size: 0.85rem; padding: 0.5rem 1rem;">
              📥 Export Rebalancing Report
            </button>
          </div>
        </div>

        <!-- Input Box -->
        <div style="margin-top: 1.25rem; background: rgba(0, 0, 0, 0.3); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-weight: 600; font-size: 0.85rem; color: #e2e8f0;">
              Paste Bond Holdings Data (Tab-delimited, CSV, or Table):
            </label>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">
              Format: <code>Sr. No. | ISIN | Security Name | Qty</code>
            </span>
          </div>
          <textarea id="portfolio-raw-input" rows="4" style="width: 100%; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-glass); border-radius: 8px; color: #fff; font-family: monospace; font-size: 0.82rem; padding: 0.75rem; resize: vertical; outline: none; box-sizing: border-box;" placeholder="Paste portfolio rows here..."></textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 0.6rem; gap: 0.6rem;">
            <button id="run-portfolio-analysis-btn" class="btn" style="background: var(--accent-gold); color: #000; font-weight: 700; font-size: 0.85rem; padding: 0.5rem 1.25rem;">
              🔍 Analyze Portfolio Health
            </button>
          </div>
        </div>
      </div>

      <!-- Analysis Results Container -->
      <div id="analyzer-results-container"></div>
    </div>
  `;

  attachViewListeners();
}

function attachViewListeners() {
  const loadSampleBtn = document.getElementById('load-sample-portfolio-btn');
  const runBtn = document.getElementById('run-portfolio-analysis-btn');
  const textarea = document.getElementById('portfolio-raw-input') as HTMLTextAreaElement;
  const exportBtn = document.getElementById('export-rebalancing-csv-btn');

  loadSampleBtn?.addEventListener('click', () => {
    if (textarea) textarea.value = SAMPLE_PORTFOLIO_RAW;
    analyzePortfolioText(SAMPLE_PORTFOLIO_RAW);
  });

  runBtn?.addEventListener('click', () => {
    const txt = textarea ? textarea.value : '';
    analyzePortfolioText(txt);
  });

  exportBtn?.addEventListener('click', exportRebalancingReport);
}

function analyzePortfolioText(rawText: string) {
  const holdings = parsePortfolioInput(rawText, currentInventory);
  currentHoldings = holdings;
  recalculatePortfolio();
}

function recalculatePortfolio() {
  // Re-weigh based on current estimated values
  const totalVal = currentHoldings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);
  currentHoldings.forEach(h => {
    h.weightPercent = totalVal > 0 ? (h.estimatedMarketValue / totalVal) * 100 : 0;
  });

  currentAssessment = assessPortfolioRisk(currentHoldings);
  currentExits = generateExitRecommendations(currentHoldings, currentAssessment);
  currentAdds = generateAddRecommendations(currentHoldings, currentInventory);
  currentMaturities = generateMaturityReinvestmentSchedule(currentHoldings, currentInventory);

  renderAnalysisResults();
}

function renderAnalysisResults() {
  const container = document.getElementById('analyzer-results-container');
  if (!container || !currentAssessment) return;

  const a = currentAssessment;
  const gradeColor = a.healthScore >= 80 ? '#10b981' : a.healthScore >= 65 ? '#f59e0b' : '#ef4444';
  const drilldownFilter = getActiveDrilldownFilter();

  container.innerHTML = `
    <!-- Top Scorecard KPI Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
      <div class="kpi-card" style="border-left: 4px solid ${gradeColor};">
        <div class="kpi-label">Portfolio Health Score</div>
        <div style="display: flex; align-items: baseline; gap: 0.6rem; margin-top: 0.25rem;">
          <span style="font-size: 2rem; font-weight: 800; color: ${gradeColor};">${a.healthScore}/100</span>
          <span style="font-size: 1.2rem; font-weight: 700; background: rgba(255,255,255,0.08); padding: 2px 10px; border-radius: 8px; color: #fff;">Grade ${a.healthGrade}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Evaluates single-promoter & rating risk</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Total Portfolio Holding Value</div>
        <div class="kpi-value" style="color: var(--accent-gold);">₹${(a.totalInvestedAmount / 100000).toFixed(2)} Lakhs</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">${a.totalHoldingsCount} Unique Debt Securities</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Weighted Portfolio Yield</div>
        <div class="kpi-value" style="color: #38bdf8;">${a.weightedYieldPercent.toFixed(2)}%</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Avg Duration: ${(a.averageDurationMonths / 12).toFixed(1)} yrs (${a.averageDurationMonths.toFixed(0)}m)</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Rating Trajectory Breakdown</div>
        <div style="display: flex; gap: 0.4rem; margin-top: 0.4rem; font-size: 0.75rem; flex-wrap: wrap;">
          <span style="background: rgba(16,185,129,0.2); color: #34d399; padding: 2px 6px; border-radius: 4px;">📈 ${a.ratingTrendBreakdown.improvingPercent.toFixed(0)}% Impr</span>
          <span style="background: rgba(59,130,246,0.2); color: #60a5fa; padding: 2px 6px; border-radius: 4px;">⚖️ ${a.ratingTrendBreakdown.stablePercent.toFixed(0)}% Stbl</span>
          <span style="background: rgba(239,68,68,0.2); color: #f87171; padding: 2px 6px; border-radius: 4px;">📉 ${a.ratingTrendBreakdown.deterioratingPercent.toFixed(0)}% Det</span>
        </div>
      </div>
    </div>

    <!-- High Risk Alert Banners -->
    ${a.highRiskAlerts.length > 0 ? `
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 1.1rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="font-weight: 700; color: #f87171; font-size: 0.92rem; display: flex; align-items: center; gap: 0.4rem;">
          ⚠️ Risk Assessment Findings & Concentration Alerts:
        </div>
        ${a.highRiskAlerts.map(alert => `
          <div style="font-size: 0.84rem; color: #fca5a5; line-height: 1.4; padding-left: 0.5rem; border-left: 2px solid #ef4444;">
            ${alert}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Clickable & Drillable Allocation Pie Chart Section -->
    <div class="table-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
        <div>
          <h3 style="margin: 0; font-size: 1.15rem; color: var(--accent-gold); display: flex; align-items: center; gap: 0.5rem;">
            📊 Interactive Drillable Portfolio Allocation
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
            Click on any chart slice or legend to drill down and filter the holdings roster below
          </p>
        </div>

        <!-- 4 View Mode Pills -->
        <div style="display: flex; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: 10px; padding: 3px; gap: 4px; flex-wrap: wrap;">
          <button id="chart-mode-promoter" class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: none; ${currentChartMode === 'promoter' ? 'background: var(--accent-gold); color: #000; font-weight: 700;' : 'background: transparent; color: var(--text-secondary);'}">
            🏢 Promoter / Co.
          </button>
          <button id="chart-mode-industry" class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: none; ${currentChartMode === 'industry' ? 'background: var(--accent-gold); color: #000; font-weight: 700;' : 'background: transparent; color: var(--text-secondary);'}">
            🏭 Sector / Industry
          </button>
          <button id="chart-mode-bond" class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: none; ${currentChartMode === 'bond' ? 'background: var(--accent-gold); color: #000; font-weight: 700;' : 'background: transparent; color: var(--text-secondary);'}">
            🎯 Individual Bond
          </button>
          <button id="chart-mode-rating" class="btn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; border: none; ${currentChartMode === 'rating' ? 'background: var(--accent-gold); color: #000; font-weight: 700;' : 'background: transparent; color: var(--text-secondary);'}">
            ⭐ Credit Rating Tier
          </button>
        </div>
      </div>

      <div style="position: relative; height: 280px; width: 100%;">
        <canvas id="analyzer-allocation-chart"></canvas>
      </div>

      ${drilldownFilter ? `
        <div style="margin-top: 1rem; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 0.6rem 1rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.84rem; color: #38bdf8;">
            🔍 <strong>Active Drilldown Filter:</strong> ${drilldownFilter.mode.toUpperCase()} = <strong>"${drilldownFilter.value}"</strong>
          </span>
          <button id="clear-drilldown-btn" class="btn" style="background: rgba(255,255,255,0.1); color: #fff; padding: 0.25rem 0.75rem; font-size: 0.75rem;">
            ✕ Clear Filter
          </button>
        </div>
      ` : ''}
    </div>

    <!-- Section 1: Bonds to Exit (Sell / Reallocate) -->
    <div class="table-card" style="border-top: 3px solid #ef4444;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="color: #f87171; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            🚨 Strategic Exit Recommendations (${currentExits.length} Securities)
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
            Holdings flagged for credit deterioration, multi-holding single group concentration, or sub-par yield drag
          </p>
        </div>
      </div>

      ${currentExits.length === 0 ? `
        <div style="padding: 1.5rem; text-align: center; color: var(--accent-green);">
          ✓ No critical exit flags detected. Portfolio holdings meet baseline credit quality.
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${currentExits.map(e => `
            <div style="background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 1rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
              <div style="flex: 1; min-width: 280px;">
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                  <span style="font-family: monospace; font-weight: 700; font-size: 0.85rem; color: #fff;">${e.isin}</span>
                  <span style="font-weight: 600; color: #e2e8f0; font-size: 0.88rem;">${e.securityName}</span>
                  <span style="font-size: 0.72rem; background: ${e.severity === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}; color: ${e.severity === 'HIGH' ? '#f87171' : '#fbbf24'}; padding: 1px 7px; border-radius: 6px; font-weight: 700;">
                    ${e.severity} SEVERITY
                  </span>
                  <span style="font-size: 0.72rem; background: rgba(255,255,255,0.08); color: var(--text-secondary); padding: 1px 7px; border-radius: 6px;">
                    ${e.category.replace(/_/g, ' ')}
                  </span>
                  <button onclick="window.openRatingEvidenceByIsin('${e.isin}')" class="btn" style="background: rgba(59,130,246,0.2); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); padding: 1px 8px; font-size: 0.72rem; border-radius: 6px;">
                    📜 View Agency Evidence
                  </button>
                </div>
                <div style="font-size: 0.82rem; color: #fca5a5; margin-bottom: 0.4rem;">
                  <strong>Risk Rationale:</strong> ${e.rationale}
                </div>
                <div style="font-size: 0.8rem; color: #93c5fd;">
                  <strong>Recommended Action:</strong> ${e.suggestedAction}
                </div>
              </div>
              <div style="text-align: right; min-width: 140px;">
                <div style="font-size: 1rem; font-weight: 700; color: #fff;">₹${(e.estimatedValue / 100000).toFixed(2)}L</div>
                <div style="font-size: 0.78rem; color: var(--text-secondary);">${e.qty} Units | Coupon: ${e.couponPercent.toFixed(2)}%</div>
                <div style="font-size: 0.75rem; color: #f87171; margin-top: 0.2rem;">Rating: ${e.rating} (${e.ratingTrend})</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Section 2: Smart Additions from Available Inventory -->
    <div class="table-card" style="border-top: 3px solid #10b981;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="color: #34d399; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            ✨ Recommended Additions from Current Inventory
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
            High-yield, high-grade replacement bonds to rotate exited capital and diversify sector risk
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
        ${currentAdds.map(a => `
          <div style="background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.6rem;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                <div>
                  <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">${a.bond.issuer}</span>
                  <div style="font-family: monospace; font-size: 0.75rem; color: var(--text-secondary);">${a.bond.isin}</div>
                </div>
                <span style="font-size: 1.1rem; font-weight: 800; color: #34d399;">${(a.projectedYield).toFixed(2)}%</span>
              </div>
              <div style="display: flex; gap: 0.4rem; margin-bottom: 0.5rem; font-size: 0.75rem; flex-wrap: wrap;">
                <span style="background: rgba(16,185,129,0.15); color: #34d399; padding: 1px 6px; border-radius: 4px; font-weight: 600;">Rating: ${a.rating}</span>
                <span style="background: rgba(255,255,255,0.06); color: #cbd5e1; padding: 1px 6px; border-radius: 4px;">Tenure: ${a.targetTenureMonths.toFixed(0)}m</span>
                <span style="background: rgba(59,130,246,0.15); color: #93c5fd; padding: 1px 6px; border-radius: 4px;">${a.sector}</span>
              </div>
              <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0; line-height: 1.4;">
                ${a.rationale}
              </p>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary);">
              <span>Unit Price: ₹${((a.bond.faceValue || 100000)/100000).toFixed(2)}L</span>
              <span style="color: var(--accent-gold); font-weight: 600;">Freq: ${a.bond.frequency || 'ANNUALLY'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Section 3: Upcoming Maturity Radar & Reinvestment Schedule -->
    <div class="table-card" style="border-top: 3px solid #38bdf8;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="color: #38bdf8; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            📅 Upcoming Maturity Radar & Reinvestment Plan (${currentMaturities.length} Maturities)
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
            Chronological redemption schedule with automated reinvestment suggestions
          </p>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Maturity Date</th>
              <th>Maturing Security</th>
              <th>Inflow Amount</th>
              <th>Current Coupon</th>
              <th>Recommended Reinvestment Bond</th>
              <th>Reinvestment Yield</th>
              <th>Yield Pickup</th>
            </tr>
          </thead>
          <tbody>
            ${currentMaturities.map(m => `
              <tr>
                <td>
                  <span style="font-weight: 700; color: #38bdf8;">${m.maturityDate}</span>
                  <div style="font-size: 0.72rem; color: var(--text-secondary);">${m.monthsAway.toFixed(1)} months away</div>
                </td>
                <td>
                  <div style="font-weight: 600; color: #fff;">${m.securityName}</div>
                  <div style="font-family: monospace; font-size: 0.72rem; color: var(--text-secondary);">${m.isin}</div>
                </td>
                <td style="font-weight: 700; color: #fff;">
                  ₹${(m.cashInflowAmount / 100000).toFixed(2)}L
                </td>
                <td>${m.couponPercent.toFixed(2)}%</td>
                <td>
                  ${m.recommendedReplacement ? `
                    <div style="font-weight: 600; color: #34d399;">${m.recommendedReplacement.issuer}</div>
                    <div style="font-size: 0.72rem; color: var(--text-secondary);">Rating: ${m.recommendedReplacement.rating} | ${m.recommendedReplacement.months.toFixed(0)}m</div>
                  ` : `<span style="color: var(--text-secondary);">Market Standard 11.5% AA Bond</span>`}
                </td>
                <td style="font-weight: 700; color: #34d399;">${m.reinvestmentYield.toFixed(2)}%</td>
                <td style="font-weight: 700; color: ${m.yieldPickup > 0 ? '#10b981' : '#94a3b8'};">
                  ${m.yieldPickup > 0 ? `+${m.yieldPickup.toFixed(2)}%` : '0.00%'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Complete Holdings Detail Table with Inline Face Value & Qty Editing -->
    <div class="table-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="margin: 0;">📋 Complete Portfolio Holdings Roster (${currentHoldings.length} Securities)</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
            Edit Unit Face Value or Qty inline to customize holding values • Click 📜 Evidence to inspect agency reports
          </p>
        </div>
      </div>

      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ISIN</th>
              <th>Security / Issuer</th>
              <th>Parent Group</th>
              <th>Sector</th>
              <th style="min-width: 80px;">Qty</th>
              <th style="min-width: 120px;">Unit FV (₹)</th>
              <th>Est. Value (₹)</th>
              <th>Weight</th>
              <th>Coupon</th>
              <th>Rating & Evidence</th>
            </tr>
          </thead>
          <tbody>
            ${currentHoldings.map((h, idx) => {
              const isFilteredOut = drilldownFilter ? (
                (drilldownFilter.mode === 'industry' && h.sector !== drilldownFilter.value) ||
                (drilldownFilter.mode === 'promoter' && h.parentGroup !== drilldownFilter.value) ||
                (drilldownFilter.mode === 'rating' && h.rating !== drilldownFilter.value) ||
                (drilldownFilter.mode === 'bond' && !drilldownFilter.value.includes(h.isin.slice(-5)))
              ) : false;

              return `
                <tr style="${isFilteredOut ? 'opacity: 0.25; filter: grayscale(80%);' : ''}">
                  <td>${h.srNo}</td>
                  <td style="font-family: monospace; font-weight: 600;">${h.isin}</td>
                  <td>
                    <div style="font-weight: 600; color: #fff;">${h.securityName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${h.issuerName}</div>
                  </td>
                  <td><span style="font-size: 0.82rem; color: #93c5fd;">${h.parentGroup}</span></td>
                  <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${h.sector}</span></td>
                  <td>
                    <input type="number" min="1" step="1" value="${h.qty}" data-holding-idx="${idx}" class="holding-qty-input" style="width: 70px; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 4px 6px; color: #fff; font-size: 0.82rem;" />
                  </td>
                  <td>
                    <input type="number" min="1000" step="1000" value="${h.faceValue}" data-holding-idx="${idx}" class="holding-fv-input" style="width: 95px; background: rgba(0,0,0,0.4); border: 1px solid var(--border-glass); border-radius: 6px; padding: 4px 6px; color: #fff; font-size: 0.82rem;" />
                  </td>
                  <td style="font-weight: 700; color: #fff; white-space: nowrap;">
                    ₹${(h.estimatedMarketValue / 100000).toFixed(2)}L
                  </td>
                  <td>${h.weightPercent.toFixed(1)}%</td>
                  <td>${h.couponPercent.toFixed(2)}%</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                      <span style="font-size: 0.8rem; font-weight: 700;">${h.rating}</span>
                      <button onclick="window.openRatingEvidenceByIsin('${h.isin}')" class="btn" style="background: rgba(212,175,55,0.15); color: var(--accent-gold); border: 1px solid rgba(212,175,55,0.3); padding: 2px 7px; font-size: 0.72rem; border-radius: 4px;" title="View Rating Agency Historical Reports">
                        📜 Evidence
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach Chart & Interactive Handlers
  initDrillableChart('analyzer-allocation-chart', currentHoldings, (_filter) => {
    renderAnalysisResults();
  });

  attachResultInteractions();
}

function attachResultInteractions() {
  // Chart Mode Switchers
  const btnPromoter = document.getElementById('chart-mode-promoter');
  const btnIndustry = document.getElementById('chart-mode-industry');
  const btnBond = document.getElementById('chart-mode-bond');
  const btnRating = document.getElementById('chart-mode-rating');
  const btnClearDrilldown = document.getElementById('clear-drilldown-btn');

  btnPromoter?.addEventListener('click', () => {
    currentChartMode = 'promoter';
    setChartViewMode('promoter', 'analyzer-allocation-chart', currentHoldings, () => renderAnalysisResults());
  });

  btnIndustry?.addEventListener('click', () => {
    currentChartMode = 'industry';
    setChartViewMode('industry', 'analyzer-allocation-chart', currentHoldings, () => renderAnalysisResults());
  });

  btnBond?.addEventListener('click', () => {
    currentChartMode = 'bond';
    setChartViewMode('bond', 'analyzer-allocation-chart', currentHoldings, () => renderAnalysisResults());
  });

  btnRating?.addEventListener('click', () => {
    currentChartMode = 'rating';
    setChartViewMode('rating', 'analyzer-allocation-chart', currentHoldings, () => renderAnalysisResults());
  });

  btnClearDrilldown?.addEventListener('click', () => {
    clearDrilldownFilter('analyzer-allocation-chart', currentHoldings, () => renderAnalysisResults());
  });

  // Inline Qty & Face Value Editing
  document.querySelectorAll('.holding-qty-input').forEach(el => {
    el.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-holding-idx') || '-1', 10);
      const val = parseInt((e.target as HTMLInputElement).value, 10) || 1;
      if (idx >= 0 && idx < currentHoldings.length) {
        currentHoldings[idx].qty = val;
        currentHoldings[idx].estimatedMarketValue = val * currentHoldings[idx].faceValue;
        recalculatePortfolio();
      }
    });
  });

  document.querySelectorAll('.holding-fv-input').forEach(el => {
    el.addEventListener('change', (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-holding-idx') || '-1', 10);
      const val = parseFloat((e.target as HTMLInputElement).value) || 1000;
      if (idx >= 0 && idx < currentHoldings.length) {
        currentHoldings[idx].faceValue = val;
        currentHoldings[idx].estimatedMarketValue = currentHoldings[idx].qty * val;
        recalculatePortfolio();
      }
    });
  });
}

function exportRebalancingReport() {
  if (currentHoldings.length === 0) {
    alert('Please analyze a portfolio first before exporting.');
    return;
  }

  const rows = [
    ['PORTFOLIO REBALANCING & RISK REPORT'],
    ['Generated Date', new Date().toISOString().split('T')[0]],
    ['Total Holdings', currentHoldings.length.toString()],
    ['Total Value (₹ Lakhs)', ((currentAssessment?.totalInvestedAmount || 0) / 100000).toFixed(2)],
    ['Health Score', `${currentAssessment?.healthScore}/100 (Grade ${currentAssessment?.healthGrade})`],
    ['Weighted Yield', `${currentAssessment?.weightedYieldPercent.toFixed(2)}%`],
    [],
    ['--- SECTION 1: STRATEGIC EXITS ---'],
    ['ISIN', 'Security Name', 'Parent Group', 'Est Value (₹)', 'Severity', 'Category', 'Rationale', 'Action']
  ];

  currentExits.forEach(e => {
    rows.push([
      e.isin,
      `"${e.securityName}"`,
      `"${e.parentGroup}"`,
      e.estimatedValue.toString(),
      e.severity,
      e.category,
      `"${e.rationale}"`,
      `"${e.suggestedAction}"`
    ]);
  });

  rows.push([]);
  rows.push(['--- SECTION 2: RECOMMENDED ADDITIONS FROM INVENTORY ---']);
  rows.push(['ISIN', 'Issuer Name', 'Rating', 'Projected Yield (%)', 'Tenure (Months)', 'Sector', 'Rationale']);
  currentAdds.forEach(a => {
    rows.push([
      a.bond.isin,
      `"${a.bond.issuer}"`,
      a.rating,
      a.projectedYield.toFixed(2),
      a.targetTenureMonths.toString(),
      `"${a.sector}"`,
      `"${a.rationale}"`
    ]);
  });

  rows.push([]);
  rows.push(['--- SECTION 3: UPCOMING MATURITY REINVESTMENT SCHEDULE ---']);
  rows.push(['Maturity Date', 'ISIN', 'Security Name', 'Inflow (₹)', 'Current Coupon (%)', 'Replacement Bond', 'Reinvest Yield (%)', 'Yield Pickup (%)']);
  currentMaturities.forEach(m => {
    rows.push([
      m.maturityDate,
      m.isin,
      `"${m.securityName}"`,
      m.cashInflowAmount.toString(),
      m.couponPercent.toFixed(2),
      `"${m.recommendedReplacement?.issuer || 'Market Standard'}"`,
      m.reinvestmentYield.toFixed(2),
      m.yieldPickup.toFixed(2)
    ]);
  });

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `bond-portfolio-rebalancing-report-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
