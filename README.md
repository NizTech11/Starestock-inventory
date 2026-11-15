# Shop3 Inventory, POS & Profit Analytics

A complete web-based inventory management, point-of-sale (POS), supplier & purchase order tracking, and profit analytics system built for **Shop3**.

## Features Included

1. **Dashboard & Action Center**:
   - Real-time KPIs: Total Sales Revenue, Net Realized Profit & Margin %, Inventory Valuation (Cost vs. Retail), Low-Stock Alerts, and Pending Purchase Orders.
   - **Low-Stock Alert Center** with 1-click **Order / Restock** into a Purchase Order.
   - Stock Valuation breakdown by Category.
2. **Products, Categories & Stock Tracking**:
   - Track SKU/Barcode, Product Name, Category, Preferred Supplier, **Cost Price**, **Selling Price**, auto-calculated **Unit Profit & Margin %**, Current Stock, and Minimum Stock Alert level.
   - Quick **Stock Adjustment** (`+ Stock In`, `- Stock Out`, `Damaged/Expired`, `Set Exact Count`) with audit notes.
   - Category manager with color-coded badges and CSV export.
3. **Sales / Point-of-Sale (POS) & Receipts**:
   - Fast barcode/SKU search, category filter, live shopping cart, discount support, cash tendered & change calculator, and real-time profit preview.
   - Automatically deducts stock and records exact Cost of Goods Sold (COGS) and profit per line item.
   - Printable thermal/standard Receipt modal + **Sales History** with 1-click **Void / Refund** (automatically restores stock).
4. **Suppliers & Purchase Orders (POs)**:
   - Manage supplier contacts and create multi-item Purchase Orders.
   - 1-click **Receive Stock** when a delivery arrives—automatically increments product stock, updates unit cost prices, and logs stock movements.
5. **Reports, Profit Analytics & Audit Ledger**:
   - Filter by Today, Last 7 Days, Last 30 Days, or All Time.
   - Gross Revenue vs. COGS vs. Net Profit & Profit Margin %.
   - Product Profitability Ranking table & CSV Export.
   - Full **Stock Movement Audit Ledger** tracking every sale, PO receipt, and manual stock change.

---

## Running Locally

```bash
npm install
npm run dev
```
- **Frontend UI**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001/api/state`
- Works out-of-the-box using a persistent local JSON database (`data/inventory.local.json`) pre-loaded with sample Shop3 data.

---

## Deploying with GitHub, Railway & Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Shop3 Inventory & POS app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Deploy Backend + PostgreSQL on Railway
1. Create a new project on [Railway](https://railway.app) and add a **PostgreSQL** service.
2. Add a second service from your **GitHub repository**.
3. In your app service's **Variables** tab on Railway, link or copy `DATABASE_URL` from the PostgreSQL service (`${{Postgres.DATABASE_URL}}`).
4. Railway will automatically use [`railway.json`](./railway.json) to build and start the server (`npm start`). Note your public Railway domain (e.g., `https://shop3-api.up.railway.app`).
   *(Note: Railway also serves the built frontend directly, so your Railway URL works as a complete standalone full-stack app too!)*

### 3. Deploy Frontend on Vercel
1. Import the same GitHub repository into [Vercel](https://vercel.com).
2. In Vercel **Environment Variables**, set:
   - `VITE_API_URL` = `https://<your-railway-domain>.up.railway.app`
3. Click **Deploy** — Vercel will use [`vercel.json`](./vercel.json) to build the Vite React app and connect it to your Railway backend.

