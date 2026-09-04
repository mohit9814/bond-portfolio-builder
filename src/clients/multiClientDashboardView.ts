import { DefaultBond } from '../defaultInventory';
import { getAllClients, setActiveClientId, deleteClient, resetToSampleClients } from './clientManager';
import { calculateAggregateClientMetrics } from './clientAggregateEngine';
import { openPurchaseSuggestionsModal } from './purchaseModal';
import { openCreateClientModal } from './clientSelectorBar';

let activeInventory: DefaultBond[] = [];
let onSwitchToClientCallback: ((clientId: string) => void) | null = null;

export function setMultiClientInventory(inventory: DefaultBond[]) {
  activeInventory = inventory;
}

export function initMultiClientDashboard(
  inventory: DefaultBond[],
  onSwitchToClient?: (clientId: string) => void
) {
  activeInventory = inventory;
  if (onSwitchToClient) onSwitchToClientCallback = onSwitchToClient;
  renderMultiClientDashboard();
}

export function renderMultiClientDashboard() {
  const container = document.getElementById('multi-client-view');
  if (!container) return;

  const clients = getAllClients();
  const summary = calculateAggregateClientMetrics(clients, activeInventory);

  const gradeColor = summary.firmAverageHealthScore >= 80 ? '#10b981' : summary.firmAverageHealthScore >= 65 ? '#f59e0b' : '#ef4444';

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem; font-family: var(--font-sans);">
      
      <!-- Top Banner & Actions -->
      <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid var(--border-glass); border-radius: 16px; padding: 1.5rem; backdrop-filter: blur(12px);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 style="font-size: 1.45rem; color: var(--accent-gold); margin: 0; display: flex; align-items: center; gap: 0.6rem; font-weight: 800;">
              👥 Aggregate Multi-Client Wealth Advisory Dashboard
            </h2>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0.35rem 0 0 0;">
              Firm-wide AUA intelligence, macro promoter concentration heatmaps, cross-client maturities, and batch rebalancing
            </p>
          </div>
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button id="multi-create-client-btn" class="btn" style="background: linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%); color: #0f172a; font-weight: 700; font-size: 0.85rem; padding: 0.5rem 1rem; border: none; border-radius: 8px;">
              ➕ New Client Portfolio
            </button>
            <button id="multi-export-csv-btn" class="btn" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 700; font-size: 0.85rem; padding: 0.5rem 1rem; border-radius: 8px;">
              📥 Export Firm Report (CSV)
            </button>
            <button id="multi-reset-samples-btn" class="btn" style="background: rgba(255, 255, 255, 0.06); color: #94a3b8; border: 1px solid rgba(255, 255, 255, 0.15); font-size: 0.82rem; padding: 0.5rem 0.85rem; border-radius: 8px;">
              ↺ Reset Samples
            </button>
          </div>
        </div>

        <!-- 6 Executive KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; margin-top: 1.25rem;">
          <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">Total Firm AUA</div>
            <div style="font-size: 1.45rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">
              ₹${(summary.totalFirmAUA / 10000000).toFixed(2)} Cr
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">${summary.totalClients} Clients (${summary.totalHoldingsCount} Holdings)</div>
          </div>

          <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">Firm Weighted Yield</div>
            <div style="font-size: 1.45rem; font-weight: 800; color: #34d399; margin-top: 0.2rem;">
              ${summary.firmWeightedYield.toFixed(2)}%
            </div>
            <div style="font-size: 0.72rem; color: #34d399;">Active portfolio yield</div>
          </div>

          <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">Average Health Score</div>
            <div style="font-size: 1.45rem; font-weight: 800; color: ${gradeColor}; margin-top: 0.2rem;">
              ${summary.firmAverageHealthScore}/100
            </div>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">Risk-weighted rating baseline</div>
          </div>

          <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">Available Surplus Cash</div>
            <div style="font-size: 1.45rem; font-weight: 800; color: #fbbf24; margin-top: 0.2rem;">
              ₹${(summary.totalAvailableCash / 100000).toFixed(2)}L
            </div>
            <div style="font-size: 0.72rem; color: #fbbf24;">Ready for fresh deployment</div>
          </div>

          <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">90-Day Maturity Inflow</div>
            <div style="font-size: 1.45rem; font-weight: 800; color: #38bdf8; margin-top: 0.2rem;">
              ₹${(summary.total90DayMaturityInflow / 100000).toFixed(2)}L
            </div>
            <div style="font-size: 0.72rem; color: #38bdf8;">Redemptions due in 3m</div>
          </div>

          <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">365-Day Maturity Inflow</div>
            <div style="font-size: 1.45rem; font-weight: 800; color: #a78bfa; margin-top: 0.2rem;">
              ₹${(summary.total365DayMaturityInflow / 100000).toFixed(2)}L
            </div>
            <div style="font-size: 0.72rem; color: #a78bfa;">1-Year cumulative redemption</div>
          </div>
        </div>
      </div>

      <!-- Section 1: Client Portfolio Comparison Matrix Table -->
      <div class="table-card" style="padding: 1.5rem; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.12);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.2rem; color: #fbbf24; display: flex; align-items: center; gap: 0.5rem;">
              📋 Client Portfolios Comparison & Management Matrix (${clients.length} Clients)
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
              Click 'Switch' to inspect individual client holdings in the Portfolio Analyzer, or 'Suggest Buys' to deploy cash
            </p>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Client Name & Account</th>
                <th>Category</th>
                <th>Mandate</th>
                <th>Invested Value</th>
                <th>Surplus Cash</th>
                <th>Total AUA</th>
                <th>Weighted Yield</th>
                <th>Health Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${clients.map(c => {
                const investedVal = c.holdings.reduce((s, h) => s + h.estimatedMarketValue, 0);
                const totalAua = investedVal + (c.availableCash || 0);
                const clientYield = investedVal > 0 ? (c.holdings.reduce((s, h) => s + (h.yieldPercent * h.estimatedMarketValue), 0) / investedVal) : 0;
                const clientHealth = c.holdings.length > 0 ? (c.holdings.some(h => h.ratingTrend === 'deteriorating') ? 58 : 84) : 100;
                const hColor = clientHealth >= 80 ? '#10b981' : clientHealth >= 65 ? '#f59e0b' : '#ef4444';

                return `
                  <tr>
                    <td>
                      <div style="font-weight: 700; color: #fff; font-size: 0.92rem;">${c.clientName}</div>
                      <div style="font-family: monospace; font-size: 0.72rem; color: var(--accent-gold);">${c.accountNumber || c.id} • ${c.holdings.length} Securities</div>
                    </td>
                    <td><span style="font-size: 0.78rem; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 4px; color: #cbd5e1;">${c.category}</span></td>
                    <td>
                      <span style="font-size: 0.75rem; font-weight: 700; color: ${c.riskProfile === 'CONSERVATIVE' ? '#38bdf8' : c.riskProfile === 'AGGRESSIVE' ? '#f87171' : '#fbbf24'};">
                        ${c.riskProfile}
                      </span>
                    </td>
                    <td style="font-weight: 700; color: #fff;">₹${(investedVal / 100000).toFixed(2)}L</td>
                    <td style="font-weight: 700; color: #34d399;">₹${((c.availableCash || 0) / 100000).toFixed(2)}L</td>
                    <td style="font-weight: 800; color: #fff;">₹${(totalAua / 100000).toFixed(2)}L</td>
                    <td style="font-weight: 700; color: #34d399;">${clientYield.toFixed(2)}%</td>
                    <td>
                      <span style="font-weight: 800; color: ${hColor};">${clientHealth}/100</span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                        <button class="btn switch-client-btn" data-client-id="${c.id}" style="background: rgba(56,189,248,0.2); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4); padding: 3px 8px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; cursor: pointer;">
                          ➔ Switch & Analyze
                        </button>
                        <button class="btn suggest-client-buys-btn" data-client-id="${c.id}" style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 3px 8px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; cursor: pointer;">
                          🛒 Buy Bonds
                        </button>
                        ${clients.length > 1 ? `
                          <button class="btn delete-client-btn" data-client-id="${c.id}" style="background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 3px 6px; font-size: 0.75rem; border-radius: 4px; cursor: pointer;" title="Delete Client Portfolio">
                            ✕
                          </button>
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

      <!-- Section 2: Macro Cross-Client Risk & Promoter Exposure Heatmap -->
      <div class="table-card" style="border-top: 3px solid #ef4444; padding: 1.5rem; background: rgba(15, 23, 42, 0.7);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="color: #f87171; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem;">
              🏢 Macro Cross-Client Promoter Exposure & Systemic Risk Heatmap
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
              Tracks cumulative conglomerate group concentration across all clients to prevent systemic single-issuer overexposure
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.85rem;">
          ${summary.crossClientPromoterExposures.map(pe => {
            const sevColors = {
              'CRITICAL': { bg: 'rgba(239,68,68,0.18)', border: '#ef4444', text: '#f87171' },
              'HIGH': { bg: 'rgba(245,158,11,0.18)', border: '#f59e0b', text: '#fbbf24' },
              'MODERATE': { bg: 'rgba(56,189,248,0.18)', border: '#38bdf8', text: '#38bdf8' },
              'LOW': { bg: 'rgba(16,185,129,0.18)', border: '#10b981', text: '#34d399' }
            };
            const s = sevColors[pe.riskSeverity];

            return `
              <div style="background: ${s.bg}; border: 1px solid ${s.border}; border-radius: 12px; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
                  <div>
                    <h4 style="margin: 0; font-size: 0.98rem; color: #fff; font-weight: 700;">${pe.parentGroup}</h4>
                    <span style="font-size: 0.72rem; color: var(--text-secondary);">${pe.clientCount} Client(s) • ${pe.holdingCount} Holding(s)</span>
                  </div>
                  <span style="font-size: 0.72rem; font-weight: 800; color: ${s.text}; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px;">
                    ${pe.riskSeverity} RISK
                  </span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.5rem; margin-bottom: 0.5rem;">
                  <span style="font-size: 1.2rem; font-weight: 800; color: #fff;">₹${(pe.totalAmount / 100000).toFixed(2)} Lakhs</span>
                  <span style="font-size: 0.85rem; font-weight: 800; color: ${s.text};">${pe.percentageOfFirmAUA.toFixed(1)}% of Firm AUA</span>
                </div>

                <div style="font-size: 0.72rem; color: #cbd5e1; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.4rem;">
                  Affected: <strong>${pe.affectedClientNames.join(', ')}</strong>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Section 3: Firm-Wide Upcoming Maturities & Redemption Timeline -->
      <div class="table-card" style="border-top: 3px solid #38bdf8; padding: 1.5rem; background: rgba(15, 23, 42, 0.7);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="color: #38bdf8; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem;">
              📅 Firm-Wide Upcoming Maturities & Reinvestment Radar (${summary.firmUpcomingMaturities.length} Redemptions)
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
              Chronological schedule of client redemptions with automated high-yield replacement opportunities
            </p>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Maturity Date</th>
                <th>Client Name</th>
                <th>Maturing Bond</th>
                <th>Inflow (₹)</th>
                <th>Current Coupon</th>
                <th>Suggested Reinvestment Bond</th>
                <th>Reinvest Yield</th>
                <th>Yield Pickup</th>
              </tr>
            </thead>
            <tbody>
              ${summary.firmUpcomingMaturities.slice(0, 10).map(m => `
                <tr>
                  <td>
                    <span style="font-weight: 700; color: #38bdf8;">${m.maturityDate}</span>
                    <div style="font-size: 0.72rem; color: var(--text-secondary);">${m.monthsAway.toFixed(1)}m away</div>
                  </td>
                  <td>
                    <span style="font-weight: 700; color: #fff;">${m.clientName}</span>
                  </td>
                  <td>
                    <div style="font-size: 0.85rem; color: #ffffff; font-weight: 600;">${m.securityName}</div>
                    <div style="font-family: monospace; font-size: 0.72rem; color: var(--text-secondary);">${m.isin}</div>
                  </td>
                  <td style="font-weight: 700; color: #fff;">₹${(m.inflowAmount / 100000).toFixed(2)}L</td>
                  <td>${m.couponPercent.toFixed(2)}%</td>
                  <td>
                    ${m.suggestedReinvestmentBond ? `
                      <div style="font-weight: 600; color: #34d399;">${m.suggestedReinvestmentBond.issuer}</div>
                      <div style="font-size: 0.72rem; color: var(--text-secondary);">Rating: ${m.suggestedReinvestmentBond.rating} • ${m.suggestedReinvestmentBond.months}m</div>
                    ` : `<span style="color: var(--text-secondary);">Market Standard 11.5% Bond</span>`}
                  </td>
                  <td style="font-weight: 700; color: #34d399;">${(m.reinvestmentYield || 11.5).toFixed(2)}%</td>
                  <td style="font-weight: 700; color: ${(m.yieldPickup || 0) > 0 ? '#10b981' : '#94a3b8'};">
                    ${(m.yieldPickup || 0) > 0 ? `+${(m.yieldPickup || 0).toFixed(2)}%` : '0.00%'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 4: Universal Batch Action Radar -->
      <div class="table-card" style="border-top: 3px solid #d4af37; padding: 1.5rem; background: rgba(15, 23, 42, 0.7);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <h3 style="color: #fbbf24; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.15rem;">
              ⚡ Universal Batch Action Radar (Exits & Additions Across All Clients)
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">
              High-priority firm-wide rotation alerts and top inventory buying opportunities
            </p>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${summary.batchActions.map(action => {
            const isExit = action.type === 'EXIT';
            return `
              <div style="background: rgba(255,255,255,0.03); border: 1px solid ${isExit ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}; border-radius: 10px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div style="flex: 1; min-width: 280px;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; flex-wrap: wrap;">
                    <span style="font-size: 0.75rem; font-weight: 800; background: ${isExit ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}; color: ${isExit ? '#f87171' : '#34d399'}; padding: 2px 7px; border-radius: 4px;">
                      ${isExit ? '🚨 UNIVERSAL EXIT' : '💎 INVENTORY BUY OPPORTUNITY'}
                    </span>
                    <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">${action.issuerName}</span>
                    <span style="font-family: monospace; font-size: 0.75rem; color: var(--accent-gold);">${action.isin}</span>
                    <span style="font-size: 0.72rem; color: #94a3b8;">${action.rating}</span>
                  </div>
                  <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.4;">
                    ${action.rationale}
                  </div>
                  <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.3rem;">
                    Affected Clients (${action.affectedClients.length}): <strong>${action.affectedClients.map(c => c.clientName).join(', ')}</strong>
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 1.15rem; font-weight: 800; color: ${isExit ? '#f87171' : '#34d399'};">
                    ₹${(action.totalFirmAmount / 100000).toFixed(2)} Lakhs
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-secondary);">
                    ${isExit ? 'Capital at risk' : 'Deployable potential'}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  // Attach Listeners
  const createBtn = document.getElementById('multi-create-client-btn');
  createBtn?.addEventListener('click', () => {
    openCreateClientModal(() => {
      renderMultiClientDashboard();
    });
  });

  const resetBtn = document.getElementById('multi-reset-samples-btn');
  resetBtn?.addEventListener('click', () => {
    if (confirm('Reset to standard pre-seeded sample clients?')) {
      resetToSampleClients();
      renderMultiClientDashboard();
    }
  });

  const exportBtn = document.getElementById('multi-export-csv-btn');
  exportBtn?.addEventListener('click', () => {
    exportMultiClientCsvReport(summary, clients);
  });

  // Switch to client buttons
  container.querySelectorAll('.switch-client-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clientId = (e.target as HTMLElement).getAttribute('data-client-id');
      if (clientId) {
        setActiveClientId(clientId);
        if (onSwitchToClientCallback) onSwitchToClientCallback(clientId);
      }
    });
  });

  // Suggest buys buttons
  container.querySelectorAll('.suggest-client-buys-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clientId = (e.target as HTMLElement).getAttribute('data-client-id');
      if (clientId) {
        const client = clients.find(c => c.id === clientId);
        if (client) {
          openPurchaseSuggestionsModal(client, activeInventory, () => {
            renderMultiClientDashboard();
          });
        }
      }
    });
  });

  // Delete client buttons
  container.querySelectorAll('.delete-client-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clientId = (e.target as HTMLElement).getAttribute('data-client-id');
      if (clientId && confirm('Are you sure you want to delete this client portfolio?')) {
        deleteClient(clientId);
        renderMultiClientDashboard();
      }
    });
  });
}

function exportMultiClientCsvReport(
  summary: import('./types').MultiClientAggregateSummary,
  clients: import('./types').ClientPortfolio[]
) {
  const rows: string[][] = [
    ['FIRM-WIDE AGGREGATE MULTI-CLIENT WEALTH ADVISORY REPORT'],
    ['Generated Date', new Date().toISOString().split('T')[0]],
    ['Total Clients', summary.totalClients.toString()],
    ['Total Firm AUA (₹ Cr)', (summary.totalFirmAUA / 10000000).toFixed(3)],
    ['Total Holdings Count', summary.totalHoldingsCount.toString()],
    ['Firm Weighted Yield (%)', `${summary.firmWeightedYield.toFixed(2)}%`],
    ['Average Health Score', `${summary.firmAverageHealthScore}/100`],
    ['Available Surplus Cash (₹ Lakhs)', (summary.totalAvailableCash / 100000).toFixed(2)],
    ['90-Day Redemption Inflow (₹ Lakhs)', (summary.total90DayMaturityInflow / 100000).toFixed(2)],
    [],
    ['--- CLIENT PORTFOLIO SUMMARY ROSTER ---'],
    ['Client ID', 'Client Name', 'Category', 'Risk Mandate', 'Invested Value (₹)', 'Available Cash (₹)', 'Total AUA (₹)', 'Holdings Count']
  ];

  clients.forEach(c => {
    const inv = c.holdings.reduce((s, h) => s + h.estimatedMarketValue, 0);
    rows.push([
      c.id,
      `"${c.clientName}"`,
      c.category,
      c.riskProfile,
      inv.toString(),
      c.availableCash.toString(),
      (inv + c.availableCash).toString(),
      c.holdings.length.toString()
    ]);
  });

  rows.push([]);
  rows.push(['--- MACRO CROSS-CLIENT PROMOTER EXPOSURES ---'],
    ['Parent Group', 'Total Amount (₹)', '% of Firm AUA', 'Client Count', 'Risk Severity', 'Affected Clients']
  );
  summary.crossClientPromoterExposures.forEach(pe => {
    rows.push([
      `"${pe.parentGroup}"`,
      pe.totalAmount.toString(),
      pe.percentageOfFirmAUA.toFixed(2),
      pe.clientCount.toString(),
      pe.riskSeverity,
      `"${pe.affectedClientNames.join('; ')}"`
    ]);
  });

  rows.push([]);
  rows.push(['--- FIRM-WIDE UPCOMING MATURITIES CALENDAR ---'],
    ['Maturity Date', 'Client Name', 'ISIN', 'Security Name', 'Inflow (₹)', 'Current Coupon (%)', 'Suggested Replacement', 'Reinvestment Yield (%)']
  );
  summary.firmUpcomingMaturities.forEach(m => {
    rows.push([
      m.maturityDate,
      `"${m.clientName}"`,
      m.isin,
      `"${m.securityName}"`,
      m.inflowAmount.toString(),
      m.couponPercent.toFixed(2),
      `"${m.suggestedReinvestmentBond?.issuer || 'Market Standard'}"`,
      (m.reinvestmentYield || 11.5).toFixed(2)
    ]);
  });

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `firm-wide-multi-client-advisory-report-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
