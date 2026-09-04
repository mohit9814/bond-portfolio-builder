import { DEFAULT_INVENTORY, LATEST_INVENTORY_METADATA } from './defaultInventory';
import { resolveBondEntity, areBondsSameEntity } from './entityResolver';
import { getPromoterRiskRecord, getAllPromoterRecords } from './data/promoterIntelligence';
import { generateBondPortfolio } from './bondEngine';

console.log('\n=== Running Promoter Governance, Negative Media & Single-Entity Diversification Tests ===\n');

// ─── Test 1: Auto-Loaded Latest Inventory Metadata ────────────────────────────
console.log('Test 1 — Auto-Loaded Inventory Metadata:');
if (LATEST_INVENTORY_METADATA.fileName !== 'Inventory 4-9-26.xlsx') {
  throw new Error(`Expected Inventory 4-9-26.xlsx but got ${LATEST_INVENTORY_METADATA.fileName}`);
}
if (DEFAULT_INVENTORY.length < 100) {
  throw new Error(`Expected at least 100 inventory bonds but got ${DEFAULT_INVENTORY.length}`);
}
console.log(`  ✓ Successfully auto-loaded ${LATEST_INVENTORY_METADATA.fileName} (${DEFAULT_INVENTORY.length} bonds, ${LATEST_INVENTORY_METADATA.totalIssuers} issuers)\n`);

// ─── Test 2: Single-Entity Diversification & Conglomerate Resolution ─────────
console.log('Test 2 — Single-Entity Resolution & Conglomerate Grouping:');

const iiflSamasta = DEFAULT_INVENTORY.find(b => b.issuer.includes('IIFL SAMASTA'));
const iiflHome = DEFAULT_INVENTORY.find(b => b.issuer.includes('IIFL HOME'));
if (!iiflSamasta || !iiflHome) {
  throw new Error('IIFL Samasta and IIFL Home bonds must exist in active inventory');
}

const entitySamasta = resolveBondEntity(iiflSamasta);
const entityHome = resolveBondEntity(iiflHome);

if (entitySamasta.canonicalEntityKey !== 'iifl_group' || entityHome.canonicalEntityKey !== 'iifl_group') {
  throw new Error(`Both IIFL bonds must map to iifl_group, got: ${entitySamasta.canonicalEntityKey}, ${entityHome.canonicalEntityKey}`);
}

if (!areBondsSameEntity(iiflSamasta, iiflHome)) {
  throw new Error('areBondsSameEntity must return true for IIFL group bonds');
}

// Test Edelweiss group resolution
const edelweiss = DEFAULT_INVENTORY.find(b => b.issuer.includes('EDELWEISS FINANCIAL'));
const nido = DEFAULT_INVENTORY.find(b => b.issuer.includes('NIDO HOME'));
if (edelweiss && nido) {
  if (!areBondsSameEntity(edelweiss, nido)) {
    throw new Error('Edelweiss and Nido Home Finance must resolve to same parent conglomerate');
  }
}
console.log('  ✓ Multi-bond conglomerate grouping verified (IIFL Group & Edelweiss Group mapped to single entity)\n');

// ─── Test 3: Promoter Negative Media & Regulatory Risk Elimination ────────────
console.log('Test 3 — Automatic Exclusion of Critical/High Risk Promoters:');

// Edelweiss and Keertana must have autoExclude = true
const edelweissRecord = getPromoterRiskRecord('EDELWEISS FINANCIAL SERV LTD');
if (!edelweissRecord || !edelweissRecord.autoExcludeFromProposals || edelweissRecord.riskSeverity !== 'CRITICAL') {
  throw new Error('Edelweiss must be flagged as CRITICAL risk with autoExclude=true due to RBI supervisory action');
}

const keertanaRecord = getPromoterRiskRecord('KEERTANA FINSERV LTD');
if (!keertanaRecord || !keertanaRecord.autoExcludeFromProposals || keertanaRecord.riskSeverity !== 'HIGH') {
  throw new Error('Keertana Finserv must be flagged as HIGH risk with autoExclude=true due to promoter boardroom dispute');
}

const fdRates = { t1: 2.75, t2: 4.25, t3: 5.75, t4: 6.25, t5: 6.45, t6: 6.50, t7: 6.50 };
const portfolio = generateBondPortfolio(
  DEFAULT_INVENTORY,
  1000000,
  fdRates,
  'ALL',
  undefined,
  10,
  undefined,
  undefined,
  1,
  60,
  'equal'
);

// Verify that no auto-excluded promoter bonds are present in selectedBonds
const hasEdelweiss = portfolio.selectedBonds.some(b => b.canonicalEntityKey === 'edelweiss_group');
const hasKeertana = portfolio.selectedBonds.some(b => b.canonicalEntityKey === 'keertana_spandana');

if (hasEdelweiss || hasKeertana) {
  throw new Error('Auto-excluded promoter bonds (Edelweiss/Keertana) must NOT be present in generated proposal');
}

// Verify that eliminatedBonds contains PROMOTER_GOVERNANCE_RISK reasons
const promoterEliminations = portfolio.eliminatedBonds.filter(e => e.reason === 'PROMOTER_GOVERNANCE_RISK');
if (promoterEliminations.length === 0) {
  throw new Error('Expected eliminated bonds to contain PROMOTER_GOVERNANCE_RISK entries');
}
console.log(`  ✓ Successfully eliminated ${promoterEliminations.length} bonds due to Promoter Governance & Negative Media Risk\n`);

// ─── Test 4: User Override Bypasses Promoter Risk Exclusion ───────────────────
console.log('Test 4 — User Force-Include Override Bypasses Promoter Risk Gate:');

const overridePortfolio = generateBondPortfolio(
  DEFAULT_INVENTORY,
  1000000,
  fdRates,
  'ALL',
  undefined,
  10,
  undefined,
  new Map([[0, 'INE532F07HN8']]),
  1,
  60,
  'equal',
  undefined,
  undefined,
  false,
  { 'EDELWEISS FINANCIAL SERV LTD': { action: 'INCLUDE', justification: 'User client specifically requested high yield' } }
);

const edelweissRiskEliminated = overridePortfolio.eliminatedBonds.some(
  e => e.bond.isin === 'INE532F07HN8' && e.reason === 'PROMOTER_GOVERNANCE_RISK'
);
if (edelweissRiskEliminated) {
  throw new Error('Overridden / manually swapped bond must NOT be eliminated for PROMOTER_GOVERNANCE_RISK');
}

const hasOverriddenEdelweiss = overridePortfolio.selectedBonds.some(b => b.isin === 'INE532F07HN8');
if (!hasOverriddenEdelweiss) {
  throw new Error('Explicit user manual replacement must successfully place the bond in selectedBonds');
}
console.log('  ✓ User explicit override cleanly permitted with logged audit justification\n');

// ─── Test 5: Comprehensive Knowledge Base Coverage ────────────────────────────
console.log('Test 5 — Forensic Promoter Database Coverage:');
const allRecords = getAllPromoterRecords();
if (allRecords.length < 25) {
  throw new Error(`Expected at least 25 promoter records, got ${allRecords.length}`);
}

const sampleClean = getPromoterRiskRecord('STATE BANK OF INDIA');
if (!sampleClean || sampleClean.riskSeverity !== 'CLEAN' || sampleClean.governanceScore < 90) {
  throw new Error('SBI must have CLEAN severity and governance score >= 90');
}

console.log(`  ✓ Verified ${allRecords.length} persisted promoter records covering public PSUs, banks, NBFCs, and fintechs\n`);

console.log('All 5 Promoter Governance, Negative Media & Single-Entity Diversification Tests Passed Successfully! ✓\n');
