# Bond Portfolio Builder 📈

An advanced, client-side web application designed to automatically generate optimized, diversified, and risk-managed bond investment portfolios. Financial advisors and investors can upload an Excel sheet of live bond inventory, dial in their preferences, and instantly get a tailored proposal.

## 🚀 Key Features

* **Smart Optimization Engine**: Maximizes Yield-to-Maturity (YTM) while strictly enforcing a 15% maximum allocation per issuer (ensuring at least 7 unique issuers) for diversification.
* **Intelligent Cashflow Matching**: Optionally target a specific quarterly cashflow percentage. The engine blends yield and frequency scoring, and performs coupon-staggering optimization to hit cashflow targets without sacrificing yield.
* **Strict Risk Management & Liquidity Guards**: 
  * Automatically filters out illiquid bonds (Zero Tradable Qty/FV).
  * Enforces regulatory caps (e.g., BBB-tier bonds cannot have a tenure > 12 months).
  * Excludes structured "Bundle - Flexi" products by default.
* **Full Transparency (Drill-down)**: A dynamic "Screening Report" panel shows exactly *why* any bond was excluded from the proposal (e.g., Tenure Mismatch, Below Min Rating, Runner-up).
* **Deep Customization**: Swap bonds in and out of the generated portfolio or manually override weightings.
* **Analytics & Visualizations**: Interactive pie charts for Company and Rating allocations, plus a detailed Cash Flow Schedule and Maturity timeline using Chart.js.
* **One-Click Sharing**: Encodes the entire portfolio state into a secure, shareable URL for easy distribution to clients.

## 📸 Screenshots

*(Add your screenshots here by replacing the placeholder links)*

| Portfolio Generation | Transparency Panel |
|:---:|:---:|
| <img src="https://via.placeholder.com/600x400?text=Portfolio+Table+and+KPIs" alt="Portfolio View" width="400"/> | <img src="https://via.placeholder.com/600x400?text=Eliminated+Bonds+Modal" alt="Screening Report" width="400"/> |
| **Cashflow Projections** | **Asset Allocation Charts** |
| <img src="https://via.placeholder.com/600x400?text=Quarterly+Cashflow+Table" alt="Cashflow View" width="400"/> | <img src="https://via.placeholder.com/600x400?text=Pie+Charts" alt="Charts View" width="400"/> |

## 🛠️ How It Works (The 7-Stage Filter)

When an inventory is uploaded, the Bond Engine evaluates candidates through a rigorous pipeline before optimization:
1. **Tenure Window**: Excludes bonds outside the user's min/max horizon.
2. **Category Filter**: Drops excluded categories (Bundle-Flexi).
3. **User Exclusions**: Drops ISINs the user manually swapped out.
4. **Liquidity Guard**: Drops bonds with `0` Tradable Qty or Face Value.
5. **Credit Risk Cap**: Drops BBB/BBB-/BBB+ bonds with > 12m tenure.
6. **Minimum Rating**: Drops bonds below the user's selected credit floor.
7. **Optimization**: Groups remaining candidates into maturity buckets and selects the best risk-adjusted yielders, leaving the rest as "Not Selected (Runner-ups)".

## 💻 Tech Stack

* **TypeScript**: Core engine and UI logic.
* **Vite**: Blazing fast frontend build tooling.
* **Chart.js**: For interactive data visualization.
* **SheetJS (xlsx)**: For client-side parsing of bond inventory spreadsheets.
* **Vanilla DOM**: No heavy UI frameworks, keeping the bundle lean and fast.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mohit9814/bond-portfolio-builder.git
   cd bond-portfolio-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📖 Usage Guide

1. **Upload Inventory**: Click the upload area to select your daily bond inventory Excel file.
2. **Set Parameters**: Define Investment Amount, Target Yield, Minimum Rating, and Investment Horizon.
3. **Target Cashflow (Optional)**: Input a Target Quarterly Cashflow % if the client needs regular income.
4. **Generate**: Click "Generate Proposal".
5. **Review & Tweak**: Review the KPIs. Click a bond row for deep details. Use the "Swap" button to manually replace a bond, or "Customize Allocations" to adjust weights.
6. **Share**: Click "Copy Share Link" to generate a URL you can send directly to the client.

## 📝 License

ISC
