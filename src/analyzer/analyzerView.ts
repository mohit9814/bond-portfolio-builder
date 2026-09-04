import { DefaultBond } from '../defaultInventory';
import { PortfolioHolding, PortfolioRiskAssessment, ExitRecommendation, AddRecommendation, MaturityReinvestmentItem } from './types';
import { parsePortfolioInput, SAMPLE_PORTFOLIO_RAW } from './portfolioParser';
import { assessPortfolioRisk, generateExitRecommendations, generateAddRecommendations, generateMaturityReinvestmentSchedule } from './riskEngine';
import { initDrillableChart, setChartViewMode, clearDrilldownFilter, getActiveDrilldownFilter, ChartViewMode } from './analyzerCharts';
import { openRatingEvidenceModal } from './ratingEvidenceModal';
import { openBondInsightModal } from './bondInsightModal';
import {
  calculateRebalancePlanImpact,
  clearRebalancingPlan,
  generateRebalancePlanCsvContent,
  removeAdoptedAction
} from './rebalancingPlanManager';
import { getActiveClient, getClientById, saveClient } from '../clients/clientManager';
import { renderClientSelectorBar } from '../clients/clientSelectorBar';
import { openPurchaseSuggestionsModal } from '../clients/purchaseModal';
import { getPortfolioConsolidatedSwot, getBusinessSwot } from '../data/swotIntelligence';
import { openPromoterProfileModal } from '../promoterProfileModal';

let currentInventory: DefaultBond[] = [];
let currentHoldings: PortfolioHolding[] = [];
let currentAssessment: PortfolioRiskAssessment | null = null;
let currentExits: ExitRecommendation[] = [];
let currentAdds: AddRecommendation[] = [];
let currentMaturities: MaturityReinvestmentItem[] = [];
let currentChartMode: ChartViewMode = 'promoter';

// Global hooks for inline row buttons
(window as unknown as { openRatingEvidenceByIsin: (isin: string) => void }).openRatingEvidenceByIsin = (isin: string) => {
  const holding = currentHoldings.find(h => h.isin === isin);
  if (holding) openRatingEvidenceModal(holding);
};

(window as unknown as { openBondInsightByIsin: (isin: string) => void }).openBondInsightByIsin = (isin: string) => {
  const holding = currentHoldings.find(h => h.isin === isin);
  if (holding) {
    openBondInsightModal(holding, currentHoldings, currentInventory, currentAssessment, () => recalculatePortfolio());
  }
};

(window as unknown as { openPromoterProfileByIsin: (key: string) => void }).openPromoterProfileByIsin = (key: string) => {
  openPromoterProfileModal(key);
};

(window as unknown as { removeAdoptedRebalanceAction: (id: string) => void }).removeAdoptedRebalanceAction = (id: string) => {
  removeAdoptedAction(id);
  recalculatePortfolio();
};

(window as unknown as { clearActiveRebalancePlan: () => void }).clearActiveRebalancePlan = () => {
  clearRebalancingPlan();
  recalculatePortfolio();
};

export function setAnalyzerInventory(inventory: DefaultBond[]) {
  currentInventory = inventory;
}

export function initPortfolioAnalyzer(inventory: DefaultBond[]) {
  currentInventory = inventory;
  renderAnalyzerLayout();

  const activeClient = getActiveClient();
  if (activeClient && activeClient.holdings && activeClient.holdings.length > 0) {
    currentHoldings = [...activeClient.holdings];
    recalculatePortfolio();
  } else {
    analyzePortfolioText(SAMPLE_PORTFOLIO_RAW);
  }
}

export function loadClientIntoAnalyzer(clientId: string) {
  const client = getClientById(clientId);
  if (!client) return;

  if (client.holdings && client.holdings.length > 0) {
    currentHoldings = [...client.holdings];
    recalculatePortfolio();
  } else {
    analyzePortfolioText(SAMPLE_PORTFOLIO_RAW);
  }

  renderClientSelectorBar('analyzer-client-selector-container', currentInventory, (id) => {
    loadClientIntoAnalyzer(id);
  });
}

function renderAnalyzerLayout() {
  const container = document.getElementById('analyzer-view');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- Multi-Client Selector & Management Toolbar -->
      <div id="analyzer-client-selector-container"></div>

      <!-- Header Banner -->
      <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%); border: 1px solid var(--border-glass); border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(12px);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.4rem; color: var(--accent-gold); margin: 0; display: flex; align-items: center; gap: 0.6rem;">
              🛡️ Client Bond Portfolio Analyzer & Rebalancer
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.35rem 0 0 0;">
              Credit rating SWOT analysis, verified online citations, promoter risk dossiers, and yield optimization
            </p>
          </div>
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button id="analyzer-suggest-buys-btn" class="btn" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 700; font-size: 0.85rem; padding: 0.5rem 1rem;">
              🛒 Suggest Inventory Buys
            </button>
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

  renderClientSelectorBar('analyzer-client-selector-container', currentInventory, (clientId) => {
    loadClientIntoAnalyzer(clientId);
  });

  attachViewListeners();
}

function attachViewListeners() {
  const loadSampleBtn = document.getElementById('load-sample-portfolio-btn');
  const runBtn = document.getElementById('run-portfolio-analysis-btn');
  const textarea = document.getElementById('portfolio-raw-input') as HTMLTextAreaElement;
  const exportBtn = document.getElementById('export-rebalancing-csv-btn');
  const suggestBuysBtn = document.getElementById('analyzer-suggest-buys-btn');

  loadSampleBtn?.addEventListener('click', () => {
    if (textarea) textarea.value = SAMPLE_PORTFOLIO_RAW;
    analyzePortfolioText(SAMPLE_PORTFOLIO_RAW);
  });

  runBtn?.addEventListener('click', () => {
    const txt = textarea ? textarea.value : '';
    analyzePortfolioText(txt);
  });

  exportBtn?.addEventListener('click', exportRebalancingReport);

  suggestBuysBtn?.addEventListener('click', () => {
    const activeClient = getActiveClient();
    openPurchaseSuggestionsModal(activeClient, currentInventory, () => {
      loadClientIntoAnalyzer(activeClient.id);
    });
  });
}

function analyzePortfolioText(rawText: string) {
  const holdings = parsePortfolioInput(rawText, currentInventory);
  currentHoldings = holdings;
  recalculatePortfolio();
}

function recalculatePortfolio() {
  const totalVal = currentHoldings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);
  currentHoldings.forEach(h => {
    h.weightPercent = totalVal > 0 ? (h.estimatedMarketValue / totalVal) * 100 : 0;
  });

  const activeClient = getActiveClient();
  if (activeClient) {
    activeClient.holdings = [...currentHoldings];
    saveClient(activeClient);
  }

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
  const consolidatedSwot = getPortfolioConsolidatedSwot(currentHoldings);

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
    <div class="table-card" style="padding: 1.5rem; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.12);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
        <div>
          <h3 style="margin: 0; font-size: 1.2rem; color: #fbbf24; display: flex; align-items: center; gap: 0.5rem; font-weight: 700;">
            📊 Interactive Drillable Portfolio Allocation
          </h3>
          <p style="font-size: 0.85rem; color: #e2e8f0; margin: 0.35rem 0 0 0; font-weight: 500;">
            Click on any chart segment or legend item to drill down and filter the portfolio holdings below
          </p>
        </div>

        <!-- 4 View Mode Pills -->
        <div style="display: flex; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.18); border-radius: 10px; padding: 4px; gap: 6px; flex-wrap: wrap;">
          <button id="chart-mode-promoter" class="btn" style="padding: 0.4rem 0.85rem; font-size: 0.82rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; ${currentChartMode === 'promoter' ? 'background: #d4af37; color: #0f172a; font-weight: 800; border: 1px solid #d4af37;' : 'background: rgba(255,255,255,0.06); color: #f8fafc; font-weight: 600; border: 1px solid rgba(255,255,255,0.15);'}">
            🏢 Promoter / Co.
          </button>
          <button id="chart-mode-industry" class="btn" style="padding: 0.4rem 0.85rem; font-size: 0.82rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; ${currentChartMode === 'industry' ? 'background: #d4af37; color: #0f172a; font-weight: 800; border: 1px solid #d4af37;' : 'background: rgba(255,255,255,0.06); color: #f8fafc; font-weight: 600; border: 1px solid rgba(255,255,255,0.15);'}">
            🏭 Sector / Industry
          </button>
          <button id="chart-mode-bond" class="btn" style="padding: 0.4rem 0.85rem; font-size: 0.82rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; ${currentChartMode === 'bond' ? 'background: #d4af37; color: #0f172a; font-weight: 800; border: 1px solid #d4af37;' : 'background: rgba(255,255,255,0.06); color: #f8fafc; font-weight: 600; border: 1px solid rgba(255,255,255,0.15);'}">
            🎯 Individual Bond
          </button>
          <button id="chart-mode-rating" class="btn" style="padding: 0.4rem 0.85rem; font-size: 0.82rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; ${currentChartMode === 'rating' ? 'background: #d4af37; color: #0f172a; font-weight: 800; border: 1px solid #d4af37;' : 'background: rgba(255,255,255,0.06); color: #f8fafc; font-weight: 600; border: 1px solid rgba(255,255,255,0.15);'}">
            ⭐ Credit Rating Tier
          </button>
        </div>
      </div>

      <div style="position: relative; height: 280px; width: 100%;">
        <canvas id="analyzer-allocation-chart"></canvas>
      </div>

      <div id="analyzer-chart-pills"></div>

      ${drilldownFilter ? `
        <div style="margin-top: 1rem; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 0.65rem 1rem; display: flex; justify-content: space-between; align-items: center; color: #ffffff; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.88rem; color: #ffffff;">
            🔍 <strong style="color: #38bdf8;">Active Drilldown Filter:</strong> ${drilldownFilter.mode.toUpperCase()} = <strong style="color: #fbbf24;">"${drilldownFilter.value}"</strong>
            ${drilldownFilter.subValue ? ` → Sub-Category: <strong style="color: #34d399;">"${drilldownFilter.subValue}"</strong>` : ''}
          </span>
          <button id="clear-drilldown-btn" class="btn" style="background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.3rem 0.85rem; font-size: 0.78rem; font-weight: 600; border-radius: 6px; cursor: pointer;">
            ✕ Clear Filter
          </button>
        </div>
      ` : ''}
    </div>

    <!-- Consolidated Portfolio Business SWOT & Fundamental Vulnerability Matrix -->
    <div class="table-card" style="padding: 1.5rem; background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.7) 100%); border: 1px solid rgba(255, 255, 255, 0.12);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
        <div>
          <h3 style="margin: 0; font-size: 1.15rem; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem; font-weight: 700;">
            🏢 Consolidated Portfolio Business SWOT & Vulnerability Matrix
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0 0 0;">
            Aggregated fundamental credit drivers parsed from credit rating agency rationales (CRISIL, ICRA, CARE, Ind-Ra)
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 6px;">
            Avg CRAR: ${consolidatedSwot.avgCrar}%
          </span>
          <span style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 6px;">
            Avg GNPA: ${consolidatedSwot.avgGnpa}%
          </span>
          <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 6px;">
            Low NPA Coverage: ${consolidatedSwot.lowNpaCount}/${consolidatedSwot.totalHoldingsAnalyzed} Holdings
          </span>
        </div>
      </div>

      <!-- 4-Quadrant Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        <!-- Strengths -->
        <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #34d399; text-transform: uppercase; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>💪</span> Aggregate Core Strengths
          </div>
          <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.78rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.4rem;">
            ${consolidatedSwot.topStrengths.map(s => `
              <li>
                <span style="font-weight: 600; color: #e2e8f0;">${s.text}</span>
                <span style="font-size: 0.7rem; color: #34d399; font-weight: 700; margin-left: 4px;">(${s.percentageOfPortfolio}% of AUM)</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Vulnerabilities -->
        <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #f87171; text-transform: uppercase; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚠️</span> Key Vulnerabilities & Weaknesses
          </div>
          <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.78rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.4rem;">
            ${consolidatedSwot.topWeaknesses.map(w => `
              <li>
                <span style="font-weight: 600; color: #e2e8f0;">${w.text}</span>
                <span style="font-size: 0.7rem; color: #f87171; font-weight: 700; margin-left: 4px;">(${w.percentageOfPortfolio}% of AUM)</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Opportunities -->
        <div style="background: rgba(59, 130, 246, 0.06); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>🚀</span> Strategic Opportunities
          </div>
          <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.78rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.4rem;">
            ${consolidatedSwot.topOpportunities.map(o => `
              <li>
                <span style="font-weight: 600; color: #e2e8f0;">${o.text}</span>
                <span style="font-size: 0.7rem; color: #60a5fa; font-weight: 700; margin-left: 4px;">(${o.percentageOfPortfolio}% of AUM)</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Threats -->
        <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 1rem;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #fbbf24; text-transform: uppercase; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚡</span> Sectoral & Macro Threats
          </div>
          <ul style="margin: 0; padding-left: 1.1rem; font-size: 0.78rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.4rem;">
            ${consolidatedSwot.topThreats.map(t => `
              <li>
                <span style="font-weight: 600; color: #e2e8f0;">${t.text}</span>
                <span style="font-size: 0.7rem; color: #fbbf24; font-weight: 700; margin-left: 4px;">(${t.percentageOfPortfolio}% of AUM)</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
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
                  <span style="font-family: monospace; font-weight: 700; font-size: 0.85rem; color: var(--accent-gold);">${e.isin}</span>
                  <span style="font-weight: 700; color: #ffffff; font-size: 0.92rem;">${e.readableName || e.securityName}</span>
                  <span style="font-size: 0.72rem; background: ${e.severity === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}; color: ${e.severity === 'HIGH' ? '#f87171' : '#fbbf24'}; padding: 1px 7px; border-radius: 6px; font-weight: 700;">
                    ${e.severity} SEVERITY
                  </span>
                  <span style="font-size: 0.72rem; background: rgba(255,255,255,0.08); color: #cbd5e1; padding: 1px 7px; border-radius: 6px;">
                    ${e.category.replace(/_/g, ' ')}
                  </span>
                  <button onclick="window.openRatingEvidenceByIsin('${e.isin}')" class="btn" style="background: rgba(59,130,246,0.2); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); padding: 1px 8px; font-size: 0.72rem; border-radius: 6px;">
                    📜 View Agency Evidence
                  </button>
                  <button onclick="window.openPromoterProfileByIsin('${e.parentGroup || e.issuerName}')" class="btn" style="background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); padding: 1px 8px; font-size: 0.72rem; border-radius: 6px;">
                    👤 Promoter Dossier
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
                <div style="font-size: 0.78rem; color: #f87171; font-weight: 600;">₹${(e.estimatedValue / 100000).toFixed(2)}L</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Section 2: Bonds to Add (Recommended Buys from Live Inventory) -->
    <div class="table-card" style="border-top: 3px solid #10b981;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="color: #34d399; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            🛒 Recommended High-Quality Additions (${currentAdds.length} Opportunities)
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
            Curated from active inventory to optimize risk-adjusted yield and fill sector/promoter diversification gaps
          </p>
        </div>
      </div>

      ${currentAdds.length === 0 ? `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">
          No replacement suggestions available. Inventory matching criteria are satisfied.
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
          ${currentAdds.map(add => `
            <div style="background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                  <div>
                    <span style="font-family: monospace; font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">${add.bond.isin}</span>
                    <div style="font-weight: 700; color: #fff; font-size: 0.95rem; margin-top: 2px;">${add.bond.issuer}</div>
                  </div>
                  <span style="font-size: 0.8rem; font-weight: 800; color: #34d399; background: rgba(16,185,129,0.15); padding: 2px 8px; border-radius: 6px;">
                    ${add.bond.rating}
                  </span>
                </div>
                <div style="display: flex; gap: 0.5rem; font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 0.5rem; flex-wrap: wrap;">
                  <span>Sector: <strong style="color: #cbd5e1;">${add.bond.sector}</strong></span>
                  <span>•</span>
                  <span>Maturity: <strong style="color: #cbd5e1;">${add.bond.maturity} (${add.bond.months}m)</strong></span>
                </div>
                <div style="background: rgba(0,0,0,0.25); border-radius: 6px; padding: 0.6rem; font-size: 0.78rem; color: #38bdf8; line-height: 1.4; margin-bottom: 0.6rem;">
                  💡 <strong>Strategic Rationale:</strong> ${add.rationale}
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.6rem;">
                <div>
                  <div style="font-size: 0.72rem; color: var(--text-secondary);">Offer Yield (YTM)</div>
                  <div style="font-size: 1.15rem; font-weight: 800; color: #34d399;">${(add.bond.yield * 100).toFixed(2)}%</div>
                </div>
                <button onclick="window.openPromoterProfileByIsin('${add.bond.issuer}')" class="btn" style="background: rgba(99,102,241,0.2); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 600; border-radius: 6px;">
                  👤 Inspect Promoter
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Section 3: Upcoming Cashflows & Maturity Reinvestment Horizon -->
    <div class="table-card" style="border-top: 3px solid #38bdf8;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="color: #38bdf8; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            ⏳ Upcoming Cashflows & Maturity Reinvestment Roadmap (${currentMaturities.length} Tranches)
          </h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
            Chronological schedule of principal redemption cash inflows with automated yield-matching reinvestment ideas
          </p>
        </div>
      </div>

      ${currentMaturities.length === 0 ? `
        <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary);">
          No immediate upcoming maturities detected within the next 36 months.
        </div>
      ` : `
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Target Month / Date</th>
                <th>Maturing Security / ISIN</th>
                <th>Principal Cash Inflow</th>
                <th>Redemption Type</th>
                <th>Current Coupon</th>
                <th>Auto-Suggested Reinvestment Match</th>
                <th>Target Reinvestment YTM</th>
              </tr>
            </thead>
            <tbody>
              ${currentMaturities.map(m => `
                <tr>
                  <td style="font-weight: 700; color: #38bdf8;">${m.maturityDate} (${m.monthsAway}m away)</td>
                  <td>
                    <div style="font-weight: 600; color: #fff; font-size: 0.85rem;">${m.readableName || m.securityName}</div>
                    <div style="font-family: monospace; font-size: 0.72rem; color: var(--text-secondary);">${m.isin}</div>
                  </td>
                  <td style="font-weight: 800; color: #fbbf24;">₹${(m.cashInflowAmount / 100000).toFixed(2)} Lakhs</td>
                  <td><span style="font-size: 0.75rem; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">${m.monthsAway <= 12 ? 'Near-Term Maturity' : 'Medium-Term Maturity'}</span></td>
                  <td>${m.couponPercent.toFixed(2)}%</td>
                  <td>
                    ${m.recommendedReplacement ? `
                      <div style="font-weight: 600; color: #34d399; font-size: 0.85rem;">${m.recommendedReplacement.issuer}</div>
                      <div style="font-size: 0.72rem; color: var(--text-secondary);">${m.recommendedReplacement.isin} • ${m.recommendedReplacement.rating}</div>
                    ` : `<span style="color: var(--text-secondary); font-size: 0.78rem;">Explore Active Inventory</span>`}
                  </td>
                  <td style="font-weight: 700; color: #34d399;">
                    ${m.recommendedReplacement ? `${(m.recommendedReplacement.yield * 100).toFixed(2)}%` : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <!-- Active Rebalancing Plan (Interactive Adopted Swaps) -->
    ${(() => {
      const plan = calculateRebalancePlanImpact(currentHoldings, currentAssessment);
      return `
        <div class="table-card" style="border-top: 3px solid var(--accent-gold); background: rgba(15, 23, 42, 0.85);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <h3 style="color: var(--accent-gold); margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                🔄 Selected Portfolio Rebalance Plan (${plan.actions.length} Adopted Swaps)
              </h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
                Simulated execution plan: Replaces high-risk or lower-yielding holdings with selected inventory bonds
              </p>
            </div>
            <div style="display: flex; gap: 0.6rem;">
              ${plan.actions.length > 0 ? `
                <button id="download-rebalance-plan-btn" class="btn" style="background: rgba(212,175,55,0.2); color: var(--accent-gold); border: 1px solid rgba(212,175,55,0.4); font-size: 0.8rem; font-weight: 700; padding: 0.4rem 0.9rem;">
                  📥 Download Rebalancing Plan (CSV)
                </button>
                <button onclick="window.clearActiveRebalancePlan()" class="btn" style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                  ✕ Clear Plan
                </button>
              ` : ''}
            </div>
          </div>

          ${plan.actions.length === 0 ? `
            <div style="padding: 1.5rem; text-align: center; color: var(--text-secondary); background: rgba(0,0,0,0.2); border-radius: 8px;">
              💡 <em>No swap actions adopted yet. Click "🔍 Insights" on any holding in the table below to evaluate and select replacement recommendations.</em>
            </div>
          ` : `
            <!-- Projected Rebalance Impact KPI Summary -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
              <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 10px; padding: 0.85rem;">
                <div style="font-size: 0.72rem; color: var(--text-secondary);">Projected Weighted Yield</div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.2rem;">
                  <span style="font-size: 1.3rem; font-weight: 800; color: #34d399;">
                    ${plan.projectedWeightedYield.toFixed(2)}%
                  </span>
                  <span style="font-size: 0.78rem; font-weight: 700; color: ${plan.yieldDelta >= 0 ? '#10b981' : '#f87171'};">
                    (${plan.yieldDelta >= 0 ? '+' : ''}${plan.yieldDelta.toFixed(2)}%)
                  </span>
                </div>
              </div>

              <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 10px; padding: 0.85rem;">
                <div style="font-size: 0.72rem; color: var(--text-secondary);">Est. Annual Coupon Income</div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.2rem;">
                  <span style="font-size: 1.15rem; font-weight: 800; color: #fbbf24;">
                    ₹${((plan.projectedTotalValue * (plan.projectedWeightedYield / 100)) / 100000).toFixed(2)}L
                  </span>
                  <span style="font-size: 0.78rem; color: #94a3b8;">/ year</span>
                </div>
              </div>

              <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 10px; padding: 0.85rem;">
                <div style="font-size: 0.72rem; color: var(--text-secondary);">Projected Health Score</div>
                <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-top: 0.2rem;">
                  <span style="font-size: 1.15rem; font-weight: 800; color: #38bdf8;">${plan.projectedHealthScore}/100</span>
                  <span style="font-size: 0.78rem; color: #94a3b8;">was ${plan.originalHealthScore}/100</span>
                </div>
              </div>
            </div>

            <!-- Adopted Swaps Table -->
            <div style="overflow-x: auto;">
              <table>
                <thead>
                  <tr>
                    <th>Sell Position</th>
                    <th>Capital Reallocated</th>
                    <th>Recommended Replacement (Buy)</th>
                    <th>Projected Yield</th>
                    <th>Yield Pickup</th>
                    <th>Strategic Justification</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${plan.actions.map(action => `
                    <tr>
                      <td>
                        <div style="font-weight: 700; color: #f87171; font-size: 0.85rem;">${action.sellHolding.readableName || action.sellHolding.securityName}</div>
                        <div style="font-family: monospace; font-size: 0.72rem; color: var(--text-secondary);">${action.sellHolding.isin} • ${action.sellHolding.rating}</div>
                      </td>
                      <td style="font-weight: 700; color: #fff;">
                        ₹${(action.replacementValue / 100000).toFixed(2)}L
                      </td>
                      <td>
                        <div style="font-weight: 700; color: #34d399; font-size: 0.85rem;">${action.buyBond.issuer}</div>
                        <div style="font-family: monospace; font-size: 0.72rem; color: var(--text-secondary);">${action.buyBond.isin} • ${action.buyBond.rating}</div>
                      </td>
                      <td style="font-weight: 700; color: #34d399;">
                        ${(action.buyBond.yield * 100).toFixed(2)}%
                      </td>
                      <td style="font-weight: 700; color: ${action.yieldPickup >= 0 ? '#10b981' : '#f87171'};">
                        ${action.yieldPickup >= 0 ? '+' : ''}${action.yieldPickup.toFixed(2)}%
                      </td>
                      <td style="font-size: 0.8rem; color: #cbd5e1; max-width: 320px;">
                        ${action.rationale}
                      </td>
                      <td>
                        <button onclick="window.removeAdoptedRebalanceAction('${action.id}')" class="btn" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.35); padding: 3px 8px; font-size: 0.75rem; border-radius: 4px; cursor: pointer;">
                          ✕ Remove
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    })()}

    <!-- Complete Holdings Detail Table with Inline Face Value & Qty Editing -->
    <div class="table-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="margin: 0;">📋 Complete Portfolio Holdings Roster (${currentHoldings.length} Securities)</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
            Click 👤 Promoter for executive dossiers, 🔍 Insights for SWOT & swaps, and 📜 Evidence for rating citations
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
              <th>Parent / Promoter</th>
              <th>Sector & Sub-Category</th>
              <th style="min-width: 80px;">Qty</th>
              <th style="min-width: 120px;">Unit FV (₹)</th>
              <th>Est. Value (₹)</th>
              <th>Weight</th>
              <th>Coupon</th>
              <th>Rating & Actions</th>
            </tr>
          </thead>
          <tbody>
            ${currentHoldings.map((h, idx) => {
              const isFilteredOut = drilldownFilter ? (
                (drilldownFilter.mode === 'industry' && (
                  drilldownFilter.subValue
                    ? (h.subSector !== drilldownFilter.subValue || (h.broadSector !== drilldownFilter.value && h.sector !== drilldownFilter.value))
                    : (h.broadSector !== drilldownFilter.value && h.sector !== drilldownFilter.value)
                )) ||
                (drilldownFilter.mode === 'promoter' && (
                  drilldownFilter.subValue
                    ? (h.parentGroup !== drilldownFilter.value || h.subSector !== drilldownFilter.subValue)
                    : (h.parentGroup !== drilldownFilter.value)
                )) ||
                (drilldownFilter.mode === 'rating' && h.rating !== drilldownFilter.value) ||
                (drilldownFilter.mode === 'bond' && (h.readableName !== drilldownFilter.value && !drilldownFilter.value.includes(h.isin.slice(-5))))
              ) : false;

              const swotRecord = getBusinessSwot(h.isin || h.issuerName);

              return `
                <tr style="${isFilteredOut ? 'opacity: 0.25; filter: grayscale(80%);' : ''}">
                  <td>${h.srNo}</td>
                  <td style="font-family: monospace; font-weight: 600;">${h.isin}</td>
                  <td>
                    <div style="font-weight: 700; color: #ffffff; font-size: 0.88rem; margin-bottom: 2px;">
                      ${h.readableName || h.securityName}
                    </div>
                    <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                      <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace;">Raw: ${h.rawSecurityName || h.isin}</span>
                      <span style="font-size: 0.72rem; background: rgba(56,189,248,0.12); color: #38bdf8; padding: 0 5px; border-radius: 3px;">${h.issuerName}</span>
                    </div>
                  </td>
                  <td>
                    <button onclick="window.openPromoterProfileByIsin('${h.parentGroup || h.issuerName}')" style="background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); padding: 2px 7px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; cursor: pointer; text-align: left; display: inline-flex; align-items: center; gap: 4px;">
                      <span>👤 ${h.parentGroup}</span>
                      <span style="font-size: 0.65rem; background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">↗</span>
                    </button>
                  </td>
                  <td>
                    <div style="font-size: 0.82rem; font-weight: 600; color: #e2e8f0;">${h.broadSector || h.sector}</div>
                    <div style="font-size: 0.72rem; color: #94a3b8;">${h.subSector || 'General Debt'}</div>
                  </td>
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
                    <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                      <span style="font-size: 0.8rem; font-weight: 700;">${h.rating}</span>
                      <button onclick="window.openBondInsightByIsin('${h.isin}')" class="btn" style="background: rgba(56,189,248,0.2); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4); padding: 2px 7px; font-size: 0.72rem; font-weight: 700; border-radius: 4px;" title="Inspect bond intelligence & personalized rebalance swaps">
                        🔍 Insights
                      </button>
                      <button onclick="window.openRatingEvidenceByIsin('${h.isin}')" class="btn" style="background: rgba(212,175,55,0.15); color: var(--accent-gold); border: 1px solid rgba(212,175,55,0.3); padding: 2px 7px; font-size: 0.72rem; border-radius: 4px;" title="View Rating Agency Historical Reports">
                        📜 Evidence
                      </button>
                      ${swotRecord ? `
                        <a href="${swotRecord.sourceUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.68rem; padding: 2px 5px; background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.3); border-radius: 3px; text-decoration: none;" title="Verified Live Rating Rationale">
                          ↗ ${swotRecord.ratingAgency}
                        </a>
                      ` : ''}
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

  initDrillableChart(
    'analyzer-allocation-chart',
    currentHoldings,
    () => {
      renderAnalysisResults();
    },
    (holding) => {
      openBondInsightModal(holding, currentHoldings, currentInventory, currentAssessment, () => recalculatePortfolio());
    }
  );

  attachResultInteractions();
}

function attachResultInteractions() {
  const btnPromoter = document.getElementById('chart-mode-promoter');
  const btnIndustry = document.getElementById('chart-mode-industry');
  const btnBond = document.getElementById('chart-mode-bond');
  const btnRating = document.getElementById('chart-mode-rating');
  const btnClearDrilldown = document.getElementById('clear-drilldown-btn');
  const btnDownloadPlan = document.getElementById('download-rebalance-plan-btn');

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
    renderAnalysisResults();
  });

  btnDownloadPlan?.addEventListener('click', () => {
    const plan = calculateRebalancePlanImpact(currentHoldings, currentAssessment);
    const csvContent = generateRebalancePlanCsvContent(plan, currentHoldings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Portfolio_Rebalancing_Plan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.querySelectorAll('.holding-qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const idx = parseInt(target.getAttribute('data-holding-idx') || '-1', 10);
      const newQty = parseFloat(target.value);
      if (idx >= 0 && idx < currentHoldings.length && !isNaN(newQty) && newQty > 0) {
        currentHoldings[idx].qty = newQty;
        currentHoldings[idx].estimatedMarketValue = newQty * currentHoldings[idx].faceValue;
        recalculatePortfolio();
      }
    });
  });

  document.querySelectorAll('.holding-fv-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const idx = parseInt(target.getAttribute('data-holding-idx') || '-1', 10);
      const newFv = parseFloat(target.value);
      if (idx >= 0 && idx < currentHoldings.length && !isNaN(newFv) && newFv > 0) {
        currentHoldings[idx].faceValue = newFv;
        currentHoldings[idx].estimatedMarketValue = currentHoldings[idx].qty * newFv;
        recalculatePortfolio();
      }
    });
  });
}

function exportRebalancingReport() {
  if (!currentAssessment) return;
  const plan = calculateRebalancePlanImpact(currentHoldings, currentAssessment);
  const csvContent = generateRebalancePlanCsvContent(plan, currentHoldings);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Portfolio_Audit_Rebalance_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
