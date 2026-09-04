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

import {
  createClient,
  getClientById,
  getAllClients,
  setActiveClientId,
  getActiveClient
} from './clientManager';
import { commitProposalToClient, setActiveProposalClientId, getActiveProposalClientId } from './clientJourney';
import { generateBondPortfolio } from '../bondEngine';
import { DEFAULT_INVENTORY } from '../defaultInventory';

console.log('\n=== Running New Client Journey & Portfolio Builder Integration Tests ===\n');

// Test 1: New Client Journey Creation & Activation
console.log('Test 1 — Client Onboarding & Builder Pre-population:');
const newClient = createClient({
  clientName: 'Aditya Singhania (Family Office)',
  category: 'FAMILY_OFFICE',
  riskProfile: 'AGGRESSIVE',
  availableCash: 2500000, // ₹25 Lakhs
  targetYieldPercent: 11.75,
  notes: 'Diversified high-yield mandate with strict single-issuer diversification.'
});

if (!newClient.id) throw new Error('Client creation failed to generate ID');
if (newClient.availableCash !== 2500000) throw new Error('Client available cash mismatch');

setActiveProposalClientId(newClient.id);
if (getActiveProposalClientId() !== newClient.id) throw new Error('Active proposal client ID not set');
console.log(`  ✓ Successfully onboarded new client: ${newClient.clientName} (₹25.0L available cash)\n`);

// Test 2: Generate Proposal with Portfolio Engine for Client Mandate
console.log('Test 2 — Generate Tailored Proposal for Client:');
const proposal = generateBondPortfolio(
  DEFAULT_INVENTORY,
  newClient.availableCash,
  { t1: 3.5, t2: 4.5, t3: 6.0, t4: 7.0, t5: 7.0, t6: 7.0, t7: 7.0 },
  'A',
  newClient.targetYieldPercent,
  10,
  undefined,
  undefined,
  0,
  120,
  'smart'
);

if (!proposal.selectedBonds || proposal.selectedBonds.length === 0) {
  throw new Error('Failed to generate bond proposal for client');
}
if (proposal.totalInvestment <= 0) throw new Error('Proposal total investment should be > 0');
console.log(`  ✓ Generated proposal with ${proposal.selectedBonds.length} bonds deploying ₹${(proposal.totalInvestment / 100000).toFixed(2)}L (Yield: ${(proposal.portfolioYield * 100).toFixed(2)}%)\n`);

// Test 3: Commit Proposal into Client Portfolio Holdings
console.log('Test 3 — Commit Proposal to Client Portfolio:');
commitProposalToClient(newClient.id, proposal);

const updatedClient = getClientById(newClient.id);
if (!updatedClient) throw new Error('Failed to retrieve updated client');
if (updatedClient.holdings.length !== proposal.selectedBonds.length) {
  throw new Error(`Holdings count mismatch. Expected ${proposal.selectedBonds.length}, got ${updatedClient.holdings.length}`);
}
const expectedRemainingCash = Math.max(0, 2500000 - proposal.totalInvestment);
if (Math.abs(updatedClient.availableCash - expectedRemainingCash) > 1) {
  throw new Error(`Remaining cash mismatch. Expected ₹${expectedRemainingCash}, got ₹${updatedClient.availableCash}`);
}

console.log(`  ✓ Successfully committed ${updatedClient.holdings.length} holdings into ${updatedClient.clientName} (Remaining cash: ₹${(updatedClient.availableCash / 100000).toFixed(2)}L)\n`);

console.log('🎉 ALL NEW CLIENT JOURNEY & PORTFOLIO BUILDER INTEGRATION TESTS PASSED!\n');
