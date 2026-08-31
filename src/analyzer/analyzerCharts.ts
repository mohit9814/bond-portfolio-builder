import { Chart, registerables } from 'chart.js';
import { DrilldownFilter, PortfolioHolding } from './types';

Chart.register(...registerables);

export type ChartViewMode = 'industry' | 'promoter' | 'bond' | 'rating';

export interface HierarchyCrumb {
  level: number;
  label: string;
  key: string;
}

let chartInstance: Chart | null = null;
let currentMode: ChartViewMode = 'promoter';
let currentPath: HierarchyCrumb[] = [];
let onBondInspectCallback: ((holding: PortfolioHolding) => void) | null = null;

const COLOR_PALETTE = [
  '#d4af37', '#38bdf8', '#34d399', '#f59e0b', '#a78bfa',
  '#f87171', '#fb923c', '#4ade80', '#22d3ee', '#818cf8',
  '#e879f9', '#f43f5e', '#64748b', '#10b981', '#6366f1'
];

interface ChartAggItem {
  label: string;
  key: string;
  value: number;
  count: number;
  percentage: number;
  isLeafBond?: boolean;
  holding?: PortfolioHolding;
}

export function initDrillableChart(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void,
  onBondInspect?: (holding: PortfolioHolding) => void
) {
  if (onBondInspect) onBondInspectCallback = onBondInspect;
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function setChartViewMode(
  mode: ChartViewMode,
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  currentMode = mode;
  currentPath = [];
  onDrilldownChange(null);
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function clearDrilldownFilter(
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  currentPath = [];
  onDrilldownChange(null);
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function jumpToBreadcrumbLevel(
  targetLevel: number,
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  if (targetLevel < 0) {
    currentPath = [];
    onDrilldownChange(null);
  } else {
    currentPath = currentPath.slice(0, targetLevel + 1);
    const filter = getActiveDrilldownFilter();
    onDrilldownChange(filter);
  }
  renderChart(canvasId, holdings, onDrilldownChange);
}

export function getActiveDrilldownFilter(): DrilldownFilter | null {
  if (currentPath.length === 0) return null;

  if (currentMode === 'industry') {
    return {
      mode: 'industry',
      value: currentPath[0]?.key || '',
      subValue: currentPath[1]?.key || undefined
    };
  }
  if (currentMode === 'promoter') {
    return {
      mode: 'promoter',
      value: currentPath[0]?.key || '',
      subValue: currentPath[1]?.key || undefined
    };
  }
  if (currentMode === 'rating') {
    return {
      mode: 'rating',
      value: currentPath[0]?.key || ''
    };
  }
  if (currentMode === 'bond') {
    return {
      mode: 'bond',
      value: currentPath[0]?.key || ''
    };
  }
  return null;
}

export function getChartCurrentPath(): HierarchyCrumb[] {
  return [...currentPath];
}

export function getChartCurrentMode(): ChartViewMode {
  return currentMode;
}

function getScopedHoldings(holdings: PortfolioHolding[]): PortfolioHolding[] {
  if (currentPath.length === 0) return holdings;

  if (currentMode === 'industry') {
    const broad = currentPath[0]?.key;
    const sub = currentPath[1]?.key;
    return holdings.filter(h => {
      const broadMatch = (h.broadSector === broad || h.sector === broad);
      if (!sub) return broadMatch;
      return broadMatch && (h.subSector === sub);
    });
  }

  if (currentMode === 'promoter') {
    const promoter = currentPath[0]?.key;
    const sub = currentPath[1]?.key;
    return holdings.filter(h => {
      const promoterMatch = (h.parentGroup === promoter);
      if (!sub) return promoterMatch;
      return promoterMatch && (h.subSector === sub);
    });
  }

  if (currentMode === 'rating') {
    const rating = currentPath[0]?.key;
    return holdings.filter(h => h.rating === rating);
  }

  return holdings;
}

function aggregateHoldings(
  holdings: PortfolioHolding[]
): ChartAggItem[] {
  const scoped = getScopedHoldings(holdings);
  const totalVal = scoped.reduce((sum, h) => sum + h.estimatedMarketValue, 0);
  const map = new Map<string, { total: number; count: number; holding?: PortfolioHolding }>();

  const currentLevel = currentPath.length;

  if (currentMode === 'industry') {
    if (currentLevel === 0) {
      // Level 0: Broad Sectors
      scoped.forEach(h => {
        const k = h.broadSector || h.sector || 'Other Sector';
        const curr = map.get(k) || { total: 0, count: 0 };
        curr.total += h.estimatedMarketValue;
        curr.count += 1;
        map.set(k, curr);
      });
    } else if (currentLevel === 1) {
      // Level 1: Sub-Sectors
      scoped.forEach(h => {
        const k = h.subSector || 'General Sub-Sector';
        const curr = map.get(k) || { total: 0, count: 0 };
        curr.total += h.estimatedMarketValue;
        curr.count += 1;
        map.set(k, curr);
      });
    } else {
      // Level 2: Individual Bonds
      scoped.forEach(h => {
        const k = h.readableName || h.securityName;
        map.set(k, { total: h.estimatedMarketValue, count: 1, holding: h });
      });
    }
  } else if (currentMode === 'promoter') {
    if (currentLevel === 0) {
      // Level 0: Promoter Groups
      scoped.forEach(h => {
        const k = h.parentGroup || 'Independent';
        const curr = map.get(k) || { total: 0, count: 0 };
        curr.total += h.estimatedMarketValue;
        curr.count += 1;
        map.set(k, curr);
      });
    } else if (currentLevel === 1) {
      // Level 1: Sub-Sectors within this promoter
      scoped.forEach(h => {
        const k = h.subSector || 'General';
        const curr = map.get(k) || { total: 0, count: 0 };
        curr.total += h.estimatedMarketValue;
        curr.count += 1;
        map.set(k, curr);
      });
    } else {
      // Level 2: Individual Bonds
      scoped.forEach(h => {
        const k = h.readableName || h.securityName;
        map.set(k, { total: h.estimatedMarketValue, count: 1, holding: h });
      });
    }
  } else if (currentMode === 'rating') {
    if (currentLevel === 0) {
      // Level 0: Rating Tiers
      scoped.forEach(h => {
        const k = h.rating || 'Unrated';
        const curr = map.get(k) || { total: 0, count: 0 };
        curr.total += h.estimatedMarketValue;
        curr.count += 1;
        map.set(k, curr);
      });
    } else {
      // Level 1: Individual Bonds
      scoped.forEach(h => {
        const k = h.readableName || h.securityName;
        map.set(k, { total: h.estimatedMarketValue, count: 1, holding: h });
      });
    }
  } else {
    // Mode === 'bond': direct bonds
    scoped.forEach(h => {
      const k = h.readableName || h.securityName;
      map.set(k, { total: h.estimatedMarketValue, count: 1, holding: h });
    });
  }

  const isLeafLevel = (currentMode === 'bond') ||
    (currentMode === 'rating' && currentLevel === 1) ||
    (currentMode === 'industry' && currentLevel === 2) ||
    (currentMode === 'promoter' && currentLevel === 2);

  return Array.from(map.entries())
    .map(([key, data]) => ({
      label: key,
      key,
      value: data.total,
      count: data.count,
      percentage: totalVal > 0 ? (data.total / totalVal) * 100 : 0,
      isLeafBond: isLeafLevel,
      holding: data.holding
    }))
    .sort((a, b) => b.value - a.value);
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

  const items = aggregateHoldings(holdings);
  if (items.length === 0) return;

  const labels = items.map(i => i.label);
  const data = items.map(i => i.value);
  const bgColors = items.map((_, idx) => COLOR_PALETTE[idx % COLOR_PALETTE.length]);

  // Render Interactive Breadcrumbs and Summary Pills
  const pillsContainer = document.getElementById('analyzer-chart-pills');
  if (pillsContainer) {
    const rootModeNames: Record<ChartViewMode, string> = {
      'industry': 'All Broad Sectors',
      'promoter': 'All Promoter Groups',
      'rating': 'All Rating Tiers',
      'bond': 'All Bonds'
    };

    let breadcrumbHtml = `
      <div style="display: flex; align-items: center; background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 0.5rem 0.85rem; margin-top: 0.85rem; flex-wrap: wrap; gap: 0.35rem;">
        <span style="font-size: 0.78rem; color: #94a3b8; margin-right: 0.2rem;">Path:</span>
        <button class="breadcrumb-jump-btn" data-level="-1" style="background: none; border: none; font-size: 0.82rem; font-weight: 700; color: ${currentPath.length === 0 ? '#38bdf8' : '#cbd5e1'}; cursor: pointer; padding: 2px 5px; border-radius: 4px;">
          ${rootModeNames[currentMode]}
        </button>
    `;

    currentPath.forEach((crumb, idx) => {
      const isLast = idx === currentPath.length - 1;
      breadcrumbHtml += `
        <span style="color: #64748b; font-size: 0.8rem;">›</span>
        <button class="breadcrumb-jump-btn" data-level="${idx}" style="background: none; border: none; font-size: 0.82rem; font-weight: 700; color: ${isLast ? '#fbbf24' : '#cbd5e1'}; cursor: pointer; padding: 2px 5px; border-radius: 4px;">
          ${crumb.label}
        </button>
      `;
    });

    if (currentPath.length > 0) {
      breadcrumbHtml += `
        <div style="margin-left: auto;">
          <button id="btn-chart-reset-root" class="btn" style="background: rgba(239,68,68,0.18); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); padding: 2px 8px; font-size: 0.75rem; border-radius: 4px; cursor: pointer;">
            ↺ Reset
          </button>
        </div>
      `;
    }

    breadcrumbHtml += `</div>`;

    pillsContainer.innerHTML = `
      ${breadcrumbHtml}
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;">
        ${items.map((item, idx) => {
          const color = bgColors[idx];
          const badgeText = item.isLeafBond ? '🔍 Inspect Bond' : '↳ Drill Down';
          const badgeColor = item.isLeafBond ? '#38bdf8' : '#facc15';

          return `
            <button data-drilldown-key="${item.key}" class="chart-drilldown-pill" style="
              display: flex; align-items: center; gap: 0.5rem;
              background: rgba(255,255,255,0.05);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 8px; padding: 0.35rem 0.75rem; color: #ffffff; cursor: pointer;
              transition: all 0.15s ease; text-align: left;
            " title="${item.isLeafBond ? 'Click to inspect complete bond intelligence & rebalance recommendations' : 'Click to drill down to next level'}">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
              <span style="font-weight: 600; font-size: 0.82rem; color: #f8fafc;">${item.label}</span>
              <span style="font-size: 0.78rem; font-weight: 700; color: #38bdf8;">₹${(item.value / 100000).toFixed(2)}L</span>
              <span style="font-size: 0.74rem; background: rgba(255,255,255,0.12); padding: 1px 6px; border-radius: 4px; color: ${badgeColor}; font-weight: 700;">
                ${item.percentage.toFixed(1)}% • ${badgeText}
              </span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Attach Breadcrumb Jump Listeners
    pillsContainer.querySelectorAll('.breadcrumb-jump-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lvl = parseInt((e.target as HTMLElement).getAttribute('data-level') || '-1', 10);
        jumpToBreadcrumbLevel(lvl, canvasId, holdings, onDrilldownChange);
      });
    });

    const resetBtn = document.getElementById('btn-chart-reset-root');
    resetBtn?.addEventListener('click', () => {
      clearDrilldownFilter(canvasId, holdings, onDrilldownChange);
    });

    // Attach Pill Click Listeners
    pillsContainer.querySelectorAll('.chart-drilldown-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.chart-drilldown-pill') as HTMLElement;
        const key = target?.getAttribute('data-drilldown-key');
        if (key) {
          handleItemSelection(key, canvasId, holdings, onDrilldownChange);
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
            color: '#f8fafc',
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
              return ` Value: ₹${(val / 100000).toFixed(2)} Lakhs (${pct}%) — Click to Drilldown / Inspect`;
            }
          }
        }
      },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          const selectedKey = items[index]?.key;
          if (selectedKey) {
            handleItemSelection(selectedKey, canvasId, holdings, onDrilldownChange);
          }
        }
      }
    }
  });
}

function handleItemSelection(
  selectedKey: string,
  canvasId: string,
  holdings: PortfolioHolding[],
  onDrilldownChange: (filter: DrilldownFilter | null) => void
) {
  const currentLevel = currentPath.length;

  // Max levels per mode:
  // Industry: 0 -> Broad, 1 -> Sub-Sector, 2 -> Bond
  // Promoter: 0 -> Promoter, 1 -> Sub-Sector, 2 -> Bond
  // Rating: 0 -> Rating, 1 -> Bond
  // Bond: 0 -> Bond
  const maxLevels: Record<ChartViewMode, number> = {
    'industry': 2,
    'promoter': 2,
    'rating': 1,
    'bond': 0
  };

  const isLeafLevel = currentLevel >= maxLevels[currentMode];

  if (isLeafLevel) {
    // Look up the specific holding and open the Bond Insight Modal
    const matchedHolding = holdings.find(h => 
      (h.readableName || h.securityName) === selectedKey ||
      h.isin === selectedKey
    );
    if (matchedHolding && onBondInspectCallback) {
      onBondInspectCallback(matchedHolding);
    }
    return;
  }

  // Advance hierarchy down by 1 level
  currentPath.push({
    level: currentLevel,
    label: selectedKey,
    key: selectedKey
  });

  const filter = getActiveDrilldownFilter();
  onDrilldownChange(filter);
  renderChart(canvasId, holdings, onDrilldownChange);
}

