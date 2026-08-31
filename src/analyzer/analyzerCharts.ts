import { Chart, registerables } from 'chart.js';
import { PortfolioHolding } from './types';

Chart.register(...registerables);

export type ChartViewMode = 'industry' | 'promoter' | 'bond' | 'rating';

export interface DrilldownFilter {
  mode: ChartViewMode;
  value: string;
  subValue?: string;
  parentCategory?: string;
}

let chartInstance: Chart | null = null;
let currentMode: ChartViewMode = 'promoter';
let activeDrilldownFilter: DrilldownFilter | null = null;

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
  isSubCategory?: boolean;
}

export function initDrillableChart(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function setChartViewMode(
  mode: ChartViewMode,
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  currentMode = mode;
  activeDrilldownFilter = null;
  onDrilldownChange(null);
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function clearDrilldownFilter(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  activeDrilldownFilter = null;
  onDrilldownChange(null);
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function getActiveDrilldownFilter(): DrilldownFilter | null {
  return activeDrilldownFilter;
}

export function getChartCurrentMode(): ChartViewMode {
  return currentMode;
}

function aggregateHoldings(
  holdings: PortfolioHolding[],
  mode: ChartViewMode,
  filter: DrilldownFilter | null
): ChartAggItem[] {
  const map = new Map<string, { total: number; count: number }>();
  
  // In industry mode, check if we are drilling into sub-categories of a broad sector
  if (mode === 'industry' && filter && filter.mode === 'industry' && filter.value) {
    const relevantHoldings = holdings.filter(
      h => (h.broadSector === filter.value || h.sector === filter.value)
    );
    const totalVal = relevantHoldings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);

    relevantHoldings.forEach(h => {
      const key = h.subSector || 'General Sub-Sector';
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
        percentage: totalVal > 0 ? (data.total / totalVal) * 100 : 0,
        isSubCategory: true
      }))
      .sort((a, b) => b.value - a.value);
  }

  const totalVal = holdings.reduce((sum, h) => sum + h.estimatedMarketValue, 0);

  holdings.forEach(h => {
    let key = '';
    if (mode === 'industry') {
      key = h.broadSector || h.sector || 'Other Sector';
    } else if (mode === 'promoter') {
      key = h.parentGroup || 'Independent';
    } else if (mode === 'bond') {
      key = h.readableName || h.securityName;
    } else if (mode === 'rating') {
      key = h.rating || 'Unrated';
    }

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
      percentage: totalVal > 0 ? (data.total / totalVal) * 100 : 0,
      isSubCategory: false
    }))
    .sort((a, b) => b.value - a.value);
}

export function getChartAggregatedItems(
  holdings: PortfolioHolding[],
  mode: ChartViewMode = currentMode
): ChartAggItem[] {
  return aggregateHoldings(holdings, mode, activeDrilldownFilter);
}

function renderChart(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const items = aggregateHoldings(holdings, currentMode, activeDrilldownFilter);
  if (items.length === 0) return;

  const isIndustrySubDrilldown = currentMode === 'industry' && activeDrilldownFilter && activeDrilldownFilter.mode === 'industry' && !!activeDrilldownFilter.value;
  const labels = items.map(i => i.label);
  const data = items.map(i => i.value);
  const bgColors = items.map((_, idx) => COLOR_PALETTE[idx % COLOR_PALETTE.length]);

  // Populate HTML summary pills with sub-category navigation
  const pillsContainer = document.getElementById('analyzer-chart-pills');
  if (pillsContainer) {
    let drilldownHeaderHtml = '';
    if (isIndustrySubDrilldown) {
      drilldownHeaderHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 0.6rem 1rem; margin-top: 0.8rem; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <div style="font-size: 0.85rem; color: #ffffff;">
            🏭 Sector Drilldown: <strong style="color: #fbbf24;">${activeDrilldownFilter?.value}</strong>
            <span style="color: #94a3b8; font-size: 0.78rem; margin-left: 0.4rem;">(${items.length} Sub-Categories • Click any sub-category to filter holdings)</span>
          </div>
          <button id="btn-back-to-broad-sectors" class="btn" style="background: rgba(212,175,55,0.2); color: #fbbf24; border: 1px solid rgba(212,175,55,0.4); padding: 3px 10px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; cursor: pointer;">
            ← Back to All Broad Sectors
          </button>
        </div>
      `;
    }

    pillsContainer.innerHTML = `
      ${drilldownHeaderHtml}
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;">
        ${items.map((item, idx) => {
          let isSelected = false;
          if (isIndustrySubDrilldown) {
            isSelected = activeDrilldownFilter?.subValue === item.label;
          } else {
            isSelected = activeDrilldownFilter?.value === item.label;
          }
          const color = bgColors[idx];
          return `
            <button data-drilldown-label="${item.label}" class="chart-drilldown-pill" style="
              display: flex; align-items: center; gap: 0.5rem;
              background: ${isSelected ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.05)'};
              border: 1px solid ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.15)'};
              border-radius: 8px; padding: 0.35rem 0.75rem; color: #ffffff; cursor: pointer;
              transition: all 0.15s ease; text-align: left;
            " title="${currentMode === 'industry' && !isIndustrySubDrilldown ? 'Click to drill down into sub-categories' : 'Click to filter portfolio'}">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
              <span style="font-weight: 600; font-size: 0.82rem; color: #f8fafc;">${item.label}</span>
              <span style="font-size: 0.78rem; font-weight: 700; color: #38bdf8;">₹${(item.value / 100000).toFixed(2)}L</span>
              <span style="font-size: 0.74rem; background: rgba(255,255,255,0.12); padding: 1px 6px; border-radius: 4px; color: #facc15; font-weight: 700;">${item.percentage.toFixed(1)}%</span>
              ${currentMode === 'industry' && !isIndustrySubDrilldown ? `<span style="font-size: 0.7rem; color: #94a3b8;">↳ Drill</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Handle 'Back to All Broad Sectors'
    const backBtn = document.getElementById('btn-back-to-broad-sectors');
    backBtn?.addEventListener('click', () => {
      activeDrilldownFilter = null;
      onDrilldownChange(null);
      renderChart(canvasId, holdings, onDrilldownChange);
    });

    pillsContainer.querySelectorAll('.chart-drilldown-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.chart-drilldown-pill') as HTMLElement;
        const label = target?.getAttribute('data-drilldown-label');
        if (label) {
          handleDrilldownSelection(label, canvasId, holdings, onDrilldownChange);
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
              const actionHint = currentMode === 'industry' && !isIndustrySubDrilldown 
                ? ' — Click to drill into Sub-Categories' 
                : ' — Click to filter holdings';
              return ` Value: ₹${(val / 100000).toFixed(2)} Lakhs (${pct}%)${actionHint}`;
            }
          }
        }
      },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const selectedLabel = labels[index];
          handleDrilldownSelection(selectedLabel, canvasId, holdings, onDrilldownChange);
        }
      }
    }
  });
}

function handleDrilldownSelection(
  selectedLabel: string,
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  if (currentMode === 'industry') {
    // If not yet drilled into a broad sector, entering broad sector sub-drilldown
    if (!activeDrilldownFilter || activeDrilldownFilter.mode !== 'industry' || !activeDrilldownFilter.value) {
      activeDrilldownFilter = {
        mode: 'industry',
        value: selectedLabel
      };
      onDrilldownChange(activeDrilldownFilter);
      renderChart(canvasId, holdings, onDrilldownChange);
      return;
    }

    // Already inside a broad sector sub-drilldown
    if (activeDrilldownFilter.value && !activeDrilldownFilter.subValue) {
      // User clicked a sub-category
      activeDrilldownFilter.subValue = selectedLabel;
      onDrilldownChange(activeDrilldownFilter);
      renderChart(canvasId, holdings, onDrilldownChange);
      return;
    }

    if (activeDrilldownFilter.subValue === selectedLabel) {
      // Toggle off specific sub-category back to entire broad sector
      activeDrilldownFilter.subValue = undefined;
      onDrilldownChange(activeDrilldownFilter);
      renderChart(canvasId, holdings, onDrilldownChange);
      return;
    } else {
      // Switch sub-category
      activeDrilldownFilter.subValue = selectedLabel;
      onDrilldownChange(activeDrilldownFilter);
      renderChart(canvasId, holdings, onDrilldownChange);
      return;
    }
  }

  // General non-industry drilldown toggle
  if (activeDrilldownFilter && activeDrilldownFilter.value === selectedLabel) {
    activeDrilldownFilter = null;
  } else {
    activeDrilldownFilter = { mode: currentMode, value: selectedLabel };
  }
  onDrilldownChange(activeDrilldownFilter);
  renderChart(canvasId, holdings, onDrilldownChange);
}
