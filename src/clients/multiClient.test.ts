import { DEFAULT_INVENTORY } from '../defaultInventory';
import {
  getAllClients,
  getClientById,
  saveClient,
  createClient,
  deleteClient,
  resetToSampleClients
} from './clientManager';
import { generatePurchaseSuggestions } from './purchaseRecommender';
import { calculateAggregateClientMetrics } from './clientAggregateEngine';

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = val; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
});
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true
  };
}

console.log('\n=== Running Multi-Client Portfolio Management & Aggregate Dashboard Tests ===\n');

// Test 1: Client Portfolio CRUD & Persistence
{
  resetToSampleClients();
  const initialClients = getAllClients();
  if (initialClients.length !== 3) {
    throw new Error(`Expected 3 initial sample clients, got ${initialClients.length}`);
  }

  // Create Client
  const created = createClient({
    clientName: 'Sunil Mehta (Ultra HNI)',
    category: 'ULTRA_HNI',
    riskProfile: 'CONSERVATIVE',
    availableCash: 2500000,
    targetYieldPercent: 10.5
  });

  const fetched = getClientById(created.id);
  if (!fetched || fetched.clientName !== 'Sunil Mehta (Ultra HNI)') {
    throw new Error('Failed to retrieve newly created client from storage');
  }

  // Update Client
  fetched.availableCash = 3000000;
  saveClient(fetched);
  const updated = getClientById(created.id);
  if (updated?.availableCash !== 3000000) {
    throw new Error('Failed to update client cash balance');
  }

  // Delete Client
  deleteClient(created.id);
  const afterDelete = getClientById(created.id);
  if (afterDelete !== null) {
    throw new Error('Client still present after deletion');
  }

  console.log('Test 1 — Client Portfolio CRUD & LocalStorage Persistence Passed ✓');
}

// Test 2: Inventory Purchase Recommender for Surplus Cash
{
  const clients = resetToSampleClients();
  const priya = clients[0]; // Balanced Wealth, has ₹6 Lakhs cash

  const plan = generatePurchaseSuggestions(priya, DEFAULT_INVENTORY, 600000);

  if (plan.recommendations.length === 0) {
    throw new Error('Expected purchase recommendations for ₹6L available cash');
  }
  if (plan.totalDeployed > 600000) {
    throw new Error(`Deployed amount (₹${plan.totalDeployed}) exceeded available cash (₹600,000)`);
  }
  if (plan.projectedNewYield < 10.0) {
    throw new Error(`Unusually low projected yield: ${plan.projectedNewYield}%`);
  }

  // Verify none of the recommended bonds duplicate existing Priya holdings
  const existingIsins = new Set(priya.holdings.map(h => h.isin.toUpperCase()));
  for (const rec of plan.recommendations) {
    if (existingIsins.has(rec.bond.isin.toUpperCase())) {
      throw new Error(`Purchase recommender suggested duplicate existing ISIN: ${rec.bond.isin}`);
    }
    if (rec.allocatedAmount <= 0 || rec.suggestedUnits <= 0) {
      throw new Error('Invalid units or allocation amount in recommendation');
    }
  }

  console.log(`Test 2 — Inventory Purchase Recommender: Successfully generated ${plan.recommendations.length} additions deploying ₹${(plan.totalDeployed/100000).toFixed(2)}L (Yield: ${plan.originalYield.toFixed(2)}% → ${plan.projectedNewYield.toFixed(2)}%) ✓`);
}

// Test 3: Multi-Client Aggregate Metrics & Firm AUA
{
  const clients = resetToSampleClients();
  const summary = calculateAggregateClientMetrics(clients, DEFAULT_INVENTORY);

  if (summary.totalClients !== 3) {
    throw new Error(`Expected 3 total clients in aggregate, got ${summary.totalClients}`);
  }
  if (summary.totalFirmAUA <= 0) {
    throw new Error(`Invalid total Firm AUA: ${summary.totalFirmAUA}`);
  }
  if (summary.firmWeightedYield < 8.0 || summary.firmWeightedYield > 15.0) {
    throw new Error(`Unrealistic firm weighted yield: ${summary.firmWeightedYield}%`);
  }
  if (summary.firmAverageHealthScore < 10 || summary.firmAverageHealthScore > 100) {
    throw new Error(`Invalid firm average health score: ${summary.firmAverageHealthScore}`);
  }

  console.log(`Test 3 — Multi-Client Aggregate Engine: Firm AUA=₹${(summary.totalFirmAUA/10000000).toFixed(2)} Cr, Weighted Yield=${summary.firmWeightedYield.toFixed(2)}%, Avg Health=${summary.firmAverageHealthScore}/100 ✓`);
}

// Test 4: Macro Cross-Client Promoter Exposure Heatmap
{
  const clients = resetToSampleClients();
  const summary = calculateAggregateClientMetrics(clients, DEFAULT_INVENTORY);

  if (summary.crossClientPromoterExposures.length === 0) {
    throw new Error('Expected cross-client promoter exposures to be computed');
  }

  const promoterNames = summary.crossClientPromoterExposures.map(p => p.parentGroup);
  if (!promoterNames.some(p => p.includes('Edelweiss')) && !promoterNames.some(p => p.includes('Sammaan') || p.includes('ICCL'))) {
    throw new Error(`Major promoter groups not detected across firm: ${promoterNames.join(', ')}`);
  }

  for (const pe of summary.crossClientPromoterExposures) {
    if (pe.totalAmount <= 0) throw new Error(`Invalid promoter exposure amount: ${pe.totalAmount}`);
    if (pe.clientCount <= 0) throw new Error(`Invalid client count: ${pe.clientCount}`);
    if (pe.affectedClientNames.length === 0) throw new Error('Missing affected client names');
  }

  console.log(`Test 4 — Macro Cross-Client Promoter Exposure Heatmap: Mapped ${summary.crossClientPromoterExposures.length} conglomerate exposures across all client portfolios ✓`);
}

// Test 5: Firm-Wide Upcoming Maturities & Universal Batch Actions
{
  const clients = resetToSampleClients();
  const summary = calculateAggregateClientMetrics(clients, DEFAULT_INVENTORY);

  if (summary.firmUpcomingMaturities.length === 0) {
    throw new Error('Expected upcoming maturities across firm clients');
  }

  // Verify chronological sorting
  for (let i = 0; i < summary.firmUpcomingMaturities.length - 1; i++) {
    if (summary.firmUpcomingMaturities[i].monthsAway > summary.firmUpcomingMaturities[i + 1].monthsAway) {
      throw new Error('Firm upcoming maturities are not sorted chronologically');
    }
  }

  if (summary.batchActions.length === 0) {
    throw new Error('Expected universal batch actions (exits or inventory buy opportunities)');
  }

  const hasExit = summary.batchActions.some(a => a.type === 'EXIT');
  const hasBuy = summary.batchActions.some(a => a.type === 'BUY');

  if (!hasExit || !hasBuy) {
    throw new Error('Expected both universal exits and inventory buy opportunities in batch actions');
  }

  console.log(`Test 5 — Firm Maturities Calendar & Batch Actions: ${summary.firmUpcomingMaturities.length} maturities mapped with ${summary.batchActions.length} universal batch actions ✓`);
}

console.log('\nAll 5 Multi-Client & Wealth Advisory Test Suites Passed Successfully! ✓\n');
