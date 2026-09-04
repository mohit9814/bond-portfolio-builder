import latestBonds from './data/latestInventoryParsed.json';
import metadata from './data/inventoryMetadata.json';

export interface DefaultBond {
  isin: string;
  issuer: string;
  coupon: number | null;
  yield: number;
  maturity: string;
  months: number;
  rating: string;
  frequency: string;
  totalTradableFV?: number;
  /** Total tradable quantity in units. Bonds with qty = 0 or undefined are illiquid and must be excluded. */
  totalTradableQty?: number;
  /** Per-unit face value of the bond (e.g. ₹1,00,000) */
  faceValue?: number;
  /** Whether the bond is secured or unsecured (e.g. "Secured", "Unsecured") */
  securedUnsecured?: string;
  /** Residual tenure as formatted string from the Excel (e.g. "1Y,3M,12D") */
  residualTenure?: string;
  /** How the principal is redeemed (e.g. "ON MATURITY", "Amortising") */
  principalRedemption?: string;
  sector?: string;
  category?: string;
  guarantor?: string;
  guarantorRating?: string;
  ratingTrend?: 'stable' | 'improving' | 'deteriorating';
  ratingOutlookNote?: string;
}

export interface InventoryMetadata {
  fileName: string;
  totalBonds: number;
  totalIssuers: number;
  lastUpdated: string;
}

export const LATEST_INVENTORY_METADATA: InventoryMetadata = metadata as InventoryMetadata;
export const DEFAULT_INVENTORY: DefaultBond[] = latestBonds as DefaultBond[];
