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
            color: '#cbd5e1',
            font: { size: 11, family: 'Inter, sans-serif' },
            boxWidth: 12,
            padding: 10,
            generateLabels: (chart) => {
              const dataset = chart.data.datasets[0];
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              return (chart.data.labels as string[]).map((lbl, idx) => {
                const val = (dataset.data[idx] as number) || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return {
                  text: `${lbl} (${pct}%)`,
                  fillStyle: (dataset.backgroundColor as string[])[idx],
                  strokeStyle: '#0f172a',
                  lineWidth: 1,
                  hidden: false,
                  index: idx
                };
              });
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#d4af37',
          bodyColor: '#fff',
          borderColor: 'rgba(212, 175, 55, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw as number;
              const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
              return ` Amount: ₹${(val / 100000).toFixed(2)}L (${pct}%) [Click to Drilldown]`;
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
