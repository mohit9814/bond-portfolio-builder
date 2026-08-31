const fs = require('fs');
const content = fs.readFileSync('src/main.ts', 'utf-8');
const newContent = content + \

// --- Screener & Tabs Logic ---
const tabBuilder = document.getElementById('tab-builder');
const tabScreener = document.getElementById('tab-screener');
const builderView = document.getElementById('builder-view');
const screenerView = document.getElementById('screener-view');

if (tabBuilder && tabScreener && builderView && screenerView) {
  tabBuilder.addEventListener('click', () => {
    tabBuilder.classList.add('tab-active');
    tabScreener.classList.remove('tab-active');
    tabBuilder.style.color = 'var(--accent-gold)';
    tabBuilder.style.borderBottom = '2px solid var(--accent-gold)';
    tabScreener.style.color = 'var(--text-secondary)';
    tabScreener.style.borderBottom = 'none';
    
    builderView.style.display = 'block';
    screenerView.style.display = 'none';
  });

  tabScreener.addEventListener('click', () => {
    tabScreener.classList.add('tab-active');
    tabBuilder.classList.remove('tab-active');
    tabScreener.style.color = 'var(--accent-gold)';
    tabScreener.style.borderBottom = '2px solid var(--accent-gold)';
    tabBuilder.style.color = 'var(--text-secondary)';
    tabBuilder.style.borderBottom = 'none';
    
    builderView.style.display = 'none';
    screenerView.style.display = 'block';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScreener();
  setScreenerInventory(activeInventory);
});
\;
fs.writeFileSync('src/main.ts', newContent);

