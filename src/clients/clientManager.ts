import { ClientPortfolio } from './types';
import { parsePortfolioInput, SAMPLE_PORTFOLIO_RAW } from '../analyzer/portfolioParser';
import { DEFAULT_INVENTORY } from '../defaultInventory';

const STORAGE_KEY = 'bond_arch_client_portfolios_v1';
const ACTIVE_CLIENT_KEY = 'bond_arch_active_client_id_v1';

export function getSampleClients(): ClientPortfolio[] {
  const standardHoldings = parsePortfolioInput(SAMPLE_PORTFOLIO_RAW, DEFAULT_INVENTORY);

  // Client 1: Conservative HNI (Lower risk, AAA/AA focus)
  const conservativeHoldings = standardHoldings.filter(h => 
    h.rating.includes('AAA') || h.rating.includes('AA') || h.parentGroup === 'ICCL / BSE Group' || h.parentGroup === 'Muthoot Capital Group'
  );
  if (conservativeHoldings.length === 0) {
    conservativeHoldings.push(...standardHoldings.slice(0, 8));
  }

  // Client 3: Aggressive Yield Family Office (Higher yield, NBFC/MFI focus)
  const aggressiveHoldings = standardHoldings.filter(h =>
    h.couponPercent >= 10.5 || h.parentGroup === 'Edelweiss Group' || h.parentGroup === 'Keertana / FinTech'
  );

  const now = new Date().toISOString();

  return [
    {
      id: 'client_priya_patel',
      clientName: 'Priya Patel (Balanced Wealth)',
      accountNumber: 'CL-882910',
      category: 'HNI',
      riskProfile: 'BALANCED',
      targetYieldPercent: 11.0,
      targetMonthlyCashflow: 65000,
      availableCash: 600000,
      holdings: standardHoldings,
      notes: 'Active balanced allocation across housing finance and microfinance with moderate risk tolerance.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'client_rajesh_sharma',
      clientName: 'Rajesh Sharma (Conservative Treasury)',
      accountNumber: 'CL-441209',
      category: 'CORPORATE_TREASURY',
      riskProfile: 'CONSERVATIVE',
      targetYieldPercent: 9.8,
      targetMonthlyCashflow: 40000,
      availableCash: 1200000,
      holdings: conservativeHoldings,
      notes: 'Corporate reserve funds requiring strict capital safety, institutional ratings (AA/AAA), and short-to-medium durations.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'client_vikram_malhotra',
      clientName: 'Vikram Malhotra (High Yield Family Office)',
      accountNumber: 'CL-993812',
      category: 'FAMILY_OFFICE',
      riskProfile: 'AGGRESSIVE',
      targetYieldPercent: 12.5,
      targetMonthlyCashflow: 120000,
      availableCash: 1800000,
      holdings: aggressiveHoldings.length > 0 ? aggressiveHoldings : standardHoldings.slice(0, 10),
      notes: 'Yield maximizer seeking tactical opportunities in secured NBFCs and high coupon subordinate debt.',
      createdAt: now,
      updatedAt: now
    }
  ];
}

export function getAllClients(): ClientPortfolio[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getSampleClients();
      saveAllClients(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as ClientPortfolio[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getSampleClients();
      saveAllClients(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load client portfolios:', err);
    return getSampleClients();
  }
}

export function saveAllClients(clients: ClientPortfolio[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error('Failed to save client portfolios:', err);
  }
}

export function getClientById(id: string): ClientPortfolio | null {
  const clients = getAllClients();
  return clients.find(c => c.id === id) || null;
}

export function saveClient(client: ClientPortfolio): void {
  const clients = getAllClients();
  const index = clients.findIndex(c => c.id === client.id);
  const updatedClient = {
    ...client,
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) {
    clients[index] = updatedClient;
  } else {
    clients.push(updatedClient);
  }
  saveAllClients(clients);
}

export function createClient(data: Partial<ClientPortfolio> & { clientName: string }): ClientPortfolio {
  const now = new Date().toISOString();
  const newClient: ClientPortfolio = {
    id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    clientName: data.clientName,
    accountNumber: data.accountNumber || `CL-${Math.floor(100000 + Math.random() * 900000)}`,
    category: data.category || 'HNI',
    riskProfile: data.riskProfile || 'BALANCED',
    targetYieldPercent: data.targetYieldPercent || 10.5,
    targetMonthlyCashflow: data.targetMonthlyCashflow || 50000,
    availableCash: data.availableCash || 500000,
    holdings: data.holdings || [],
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now
  };

  saveClient(newClient);
  return newClient;
}

export function deleteClient(id: string): boolean {
  const clients = getAllClients();
  if (clients.length <= 1) {
    // Keep at least 1 client
    return false;
  }
  const filtered = clients.filter(c => c.id !== id);
  saveAllClients(filtered);

  if (getActiveClientId() === id) {
    setActiveClientId(filtered[0].id);
  }
  return true;
}

export function getActiveClientId(): string {
  try {
    const active = localStorage.getItem(ACTIVE_CLIENT_KEY);
    if (active) return active;
    const all = getAllClients();
    return all[0]?.id || 'client_priya_patel';
  } catch {
    return 'client_priya_patel';
  }
}

export function setActiveClientId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_CLIENT_KEY, id);
    window.dispatchEvent(new CustomEvent('active-client-changed', { detail: { clientId: id } }));
  } catch (err) {
    console.error('Failed to set active client:', err);
  }
}

export function getActiveClient(): ClientPortfolio {
  const id = getActiveClientId();
  const client = getClientById(id);
  if (client) return client;
  const all = getAllClients();
  return all[0] || getSampleClients()[0];
}

export function resetToSampleClients(): ClientPortfolio[] {
  const sample = getSampleClients();
  saveAllClients(sample);
  setActiveClientId(sample[0].id);
  return sample;
}
