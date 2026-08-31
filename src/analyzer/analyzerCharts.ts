import { Chart, registerables } from 'chart.js';
import { PortfolioHolding } from './types';

Chart.register(...registerables);

export type ChartViewMode = 'industry' | 'promoter' | 'bond' | 'rating';

let chartInstance: Chart | null = null;
let currentMode: ChartViewMode = 'promoter';
let activeDrilldownFilter: { mode: ChartViewMode; value: string } | null = null;

const COLOR_PALETTE = [
  '#d4af37', '#38bdf8', '#34d399', '#f59e0b', '#a78bfa',
  '#f87171', '#fb923c', '#4ade80', '#22d3ee', '#818cf8',
  '#e879f9', '#f43f5e', '#64748b', '#10b981', '#6366f1'
];

interface ChartAggItem {
  label: string;
  value: number;
  count: number;
  percentage: number;
}

export function initDrillableChart(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: { mode: ChartViewMode; value: string } | null) => void
) {
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function setChartViewMode(
  mode: ChartViewMode,
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: { mode: ChartViewMode; value: string } | null) => void
) {
  currentMode = mode;
  activeDrilldownFilter = null;
  onDrilldownChange(null);
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function clearDrilldownFilter(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: { mode: ChartViewMode; value: string } | null) => void
) {
  activeDrilldownFilter = null;
  onDrilldownChange(null);
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function getActiveDrilldownFilter() {
  return activeDrilldownFilter;
}

function aggregateHoldings(holdings: PortfolioHolding[], mode: ChartViewMode): ChartAggItem[] {
  const map = new Map<string, { total: number; count: number }>();
  const totalVal = holdings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);

  holdings.forEach(h => {
    let key = '';
    if (mode === 'industry') key = h.sector || 'Other Sector';
    else if (mode === 'promoter') key = h.parentGroup || 'Independent';
    else if (mode === 'bond') key = `${h.securityName} (${h.isin.slice(-5)})`;
    else if (mode === 'rating') key = h.rating || 'Unrated';

    const curr = map.get(key) || { total: 0, count: 0 };
    curr.total += h.estimatedMarketValue;
    curr.count += 1;
    map.set(key, curr);
  });

  return Array.from(map.entries())
    .map(([label, data]) => ({
      label,
      value: data.total,
      count: data.count,
      percentage: totalVal > 0 ? (data.total / totalVal) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);
}

export function getChartAggregatedItems(holdings: PortfolioHolding[], mode: ChartViewMode = currentMode): ChartAggItem[] {
  return aggregateHoldings(holdings, mode);
}

function renderChart(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: { mode: ChartViewMode; value: string } | null) => void
) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const items = aggregateHoldings(holdings, currentMode);
  if (items.length === 0) return;

  const labels = items.map(i => i.label);
  const data = items.map(i => i.value);
  const bgColors = items.map((_, idx) => COLOR_PALETTE[idx % COLOR_PALETTE.length]);

  // Also populate HTML summary pills if container exists
  const pillsContainer = document.getElementById('analyzer-chart-pills');
  if (pillsContainer) {
    pillsContainer.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem;">
        ${items.map((item, idx) => {
          const isSelected = activeDrilldownFilter && activeDrilldownFilter.value === item.label;
          const color = bgColors[idx];
          return `
            <button data-drilldown-label="${item.label}" class="chart-drilldown-pill" style="
              display: flex; align-items: center; gap: 0.5rem;
              background: ${isSelected ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.05)'};
              border: 1px solid ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.15)'};
              border-radius: 8px; padding: 0.35rem 0.75rem; color: #ffffff; cursor: pointer;
              transition: all 0.15s ease; text-align: left;
            ">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
              <span style="font-weight: 600; font-size: 0.82rem; color: #f8fafc;">${item.label}</span>
              <span style="font-size: 0.78rem; font-weight: 700; color: #38bdf8;">₹${(item.value / 100000).toFixed(2)}L</span>
              <span style="font-size: 0.74rem; background: rgba(255,255,255,0.12); padding: 1px 6px; border-radius: 4px; color: #facc15; font-weight: 700;">${item.percentage.toFixed(1)}%</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    pillsContainer.querySelectorAll('.chart-drilldown-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.chart-drilldown-pill') as HTMLElement;
        const label = target?.getAttribute('data-drilldown-label');
        if (label) {
          if (activeDrilldownFilter && activeDrilldownFilter.value === label) {
            activeDrilldownFilter = null;
          } else {
            activeDrilldownFilter = { mode: currentMode, value: label };
          }
          onDrilldownChange(activeDrilldownFilter);
        }
      });
    });
  }

  chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#0f172a',
          hoverOffset: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#f8fafc', // Bright crisp white for high contrast
            font: { size: 12, family: 'Inter, sans-serif', weight: 600 },
            boxWidth: 14,
            padding: 12,
            generateLabels: (chart) => {
              const dataset = chart.data.datasets[0];
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              return (chart.data.labels as string[]).map((lbl, idx) => {
                const val = (dataset.data[idx] as number) || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return {
                  text: `${lbl} — ₹${(val / 100000).toFixed(2)}L (${pct}%)`,
                  fillStyle: (dataset.backgroundColor as string[])[idx],
                  strokeStyle: '#1e293b',
                  lineWidth: 1.5,
                  fontColor: '#ffffff',
                  hidden: false,
                  index: idx
                };
              });
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.98)',
          titleColor: '#fbbf24',
          bodyColor: '#ffffff',
          bodyFont: { size: 13, weight: 600 },
          titleFont: { size: 13, weight: 700 },
          borderColor: 'rgba(212, 175, 55, 0.5)',
          borderWidth: 1.5,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw as number;
              const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
              return ` Value: ₹${(val / 100000).toFixed(2)} Lakhs (${pct}%) — Click to Drilldown`;
            }
          }
        }
      },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const selectedLabel = labels[index];
          
          if (activeDrilldownFilter && activeDrilldownFilter.value === selectedLabel) {
            // Toggle off
            activeDrilldownFilter = null;
          } else {
            activeDrilldownFilter = { mode: currentMode, value: selectedLabel };
          }
          onDrilldownChange(activeDrilldownFilter);
        }
      }
    }
  });
}
