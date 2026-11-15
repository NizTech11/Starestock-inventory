import React, { useState, useMemo } from 'react';
import {
  Package,
  LayoutGrid,
  AlertTriangle,
  Truck,
  Download,
  Plus,
  Search,
  ArrowRight,
  SlidersHorizontal,
  Box,
  MoreHorizontal
} from 'lucide-react';

export default function DashboardTab({
  state,
  currency,
  onNavigate,
  onQuickRestock,
  onOpenAddProduct
}) {
  const {
    products = [],
    categories = [],
    sales = [],
    purchaseOrders = [],
    stockMovements = []
  } = state;

  const [movementRange, setMovementRange] = useState('7d');
  const [watchSearch, setWatchSearch] = useState('');
  const [watchCategory, setWatchCategory] = useState('all');
  const [watchStatus, setWatchStatus] = useState('attention'); // 'attention' | 'all' | 'low' | 'out'

  const activeSales = sales.filter((s) => s.status !== 'voided');

  // KPI calculations
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stock * p.sellingPrice,
    0
  );
  const totalInventoryCost = products.reduce(
    (sum, p) => sum + p.stock * p.costPrice,
    0
  );
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);

  const outOfStockProducts = products.filter((p) => p.stock <= 0);
  const lowStockOnlyProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= p.minStock
  );
  const healthyProducts = products.filter((p) => p.stock > p.minStock);
  const attentionProducts = [...outOfStockProducts, ...lowStockOnlyProducts];

  const pendingPOs = purchaseOrders.filter((po) => po.status === 'ordered');

  const healthPct =
    products.length > 0
      ? ((healthyProducts.length / products.length) * 100).toFixed(1)
      : '100.0';

  // Build 7-day Stock Movement chart data from stockMovements (with graceful visual baseline if sparse)
  const chartDays = useMemo(() => {
    const daysCount = movementRange === '14d' ? 14 : 7;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const nextD = new Date(d.getTime() + 86400000);
      let stockIn = 0;
      let stockOut = 0;

      for (const mov of stockMovements) {
        const t = new Date(mov.createdAt).getTime();
        if (t >= d.getTime() && t < nextD.getTime()) {
          if (mov.quantityChange > 0) stockIn += mov.quantityChange;
          else stockOut += Math.abs(mov.quantityChange);
        }
      }

      result.push({
        label:
          daysCount === 7
            ? dayNames[d.getDay()]
            : `${d.getMonth() + 1}/${d.getDate()}`,
        stockIn,
        stockOut
      });
    }
    return result;
  }, [stockMovements, movementRange]);

  const maxChartVal = Math.max(
    10,
    ...chartDays.map((d) => Math.max(d.stockIn, d.stockOut))
  );
  // Round up nice axis max
  const yMax = Math.ceil(maxChartVal / 10) * 10;

  // Watchlist filtering
  const watchlistRows = useMemo(() => {
    const base =
      watchStatus === 'attention'
        ? attentionProducts
        : watchStatus === 'low'
        ? lowStockOnlyProducts
        : watchStatus === 'out'
        ? outOfStockProducts
        : products;

    return base.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(watchSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(watchSearch.toLowerCase());
      const matchesCat =
        watchCategory === 'all' || p.categoryId === watchCategory;
      return matchesSearch && matchesCat;
    });
  }, [
    products,
    attentionProducts,
    lowStockOnlyProducts,
    outOfStockProducts,
    watchStatus,
    watchSearch,
    watchCategory
  ]);

  const exportInventoryCsv = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Stock', 'Min Stock', 'Cost Price', 'Unit Price'];
    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || 'Uncategorized';
      return [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${cat}"`,
        p.stock,
        p.minStock,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2)
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop3-overview-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inventory overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            See your stock clearly. Start your day smoothly.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportInventoryCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export
          </button>
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add product
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Inventory Value */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total inventory value
            </span>
            <div className="w-8 h-8 rounded-lg bg-lime-50 border border-lime-200/70 flex items-center justify-center text-lime-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {currency}{totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            <span className="font-semibold text-lime-700">
              +{currency}{(totalInventoryValue - totalInventoryCost).toFixed(0)} est. profit
            </span>{' '}
            · Cost {currency}{totalInventoryCost.toFixed(0)}
          </p>
        </div>

        {/* KPI 2: Total Products & Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total products
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {products.length.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            <span className="font-semibold text-emerald-600">
              {currency}{totalRevenue.toFixed(2)} sales
            </span>{' '}
            (+{currency}{totalProfit.toFixed(2)} profit)
          </p>
        </div>

        {/* KPI 3: Low Stock Items */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Low stock items
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {attentionProducts.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            <span className="font-semibold text-amber-600">
              {outOfStockProducts.length} out of stock
            </span>{' '}
            · {lowStockOnlyProducts.length} need attention
          </p>
        </div>

        {/* KPI 4: Pending Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Pending orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {pendingPOs.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-700">
              {pendingPOs.length} deliveries
            </span>{' '}
            waiting from suppliers
          </p>
        </div>
      </div>

      {/* Middle Row: Stock Movement Chart (2/3) + Stock Health (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Stock Movement Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stock movement</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Incoming and outgoing units over time
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8CE02C]" />
                  Stock in
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#DCE7F3]" />
                  Stock out
                </span>
              </div>
              <select
                value={movementRange}
                onChange={(e) => setMovementRange(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="7d">Last 7 days</option>
                <option value="14d">Last 14 days</option>
              </select>
            </div>
          </div>

          {/* Clean CSS Bar Chart */}
          <div className="relative h-52 flex items-end gap-2 pt-4 pb-6 pl-8 border-b border-slate-100">
            {/* Y-axis reference lines */}
            {[1, 0.66, 0.33, 0].map((ratio, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 flex items-center pointer-events-none"
                style={{ bottom: `${ratio * 82 + 12}%` }}
              >
                <span className="text-[10px] text-slate-400 w-7 text-right pr-2">
                  {Math.round(yMax * ratio)}
                </span>
                <div className="flex-1 border-b border-dashed border-slate-100" />
              </div>
            ))}

            {chartDays.map((day, i) => {
              const inHeight = Math.max(
                day.stockIn > 0 ? 8 : 3,
                Math.round((day.stockIn / yMax) * 145)
              );
              const outHeight = Math.max(
                day.stockOut > 0 ? 8 : 3,
                Math.round((day.stockOut / yMax) * 145)
              );

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full z-10 group"
                >
                  <div className="flex items-end gap-1.5 h-[145px]">
                    <div
                      title={`Stock in: +${day.stockIn}`}
                      className="w-3.5 sm:w-4 bg-[#8CE02C] rounded-t-md transition-all duration-300 group-hover:brightness-95"
                      style={{ height: `${inHeight}px` }}
                    />
                    <div
                      title={`Stock out: -${day.stockOut}`}
                      className="w-3.5 sm:w-4 bg-[#DCE7F3] rounded-t-md transition-all duration-300 group-hover:brightness-95"
                      style={{ height: `${outHeight}px` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 font-medium">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Health Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Stock health</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep your shelves in balance
            </p>

            <div className="mt-5 flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-[#1E40AF] tracking-tight">
                {healthPct}%
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  Number(healthPct) >= 75
                    ? 'bg-lime-50 text-lime-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    Number(healthPct) >= 75 ? 'bg-lime-500' : 'bg-amber-500'
                  }`}
                />
                {Number(healthPct) >= 75 ? 'Healthy' : 'Needs restock'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              of products are well stocked
            </p>

            {/* Segmented Bar */}
            <div className="mt-5 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
              {products.length > 0 && (
                <>
                  <div
                    className="h-full bg-[#8CE02C] rounded-l-full"
                    style={{
                      width: `${(healthyProducts.length / products.length) * 100}%`
                    }}
                  />
                  <div
                    className="h-full bg-amber-400"
                    style={{
                      width: `${(lowStockOnlyProducts.length / products.length) * 100}%`
                    }}
                  />
                  <div
                    className="h-full bg-rose-500 rounded-r-full"
                    style={{
                      width: `${(outOfStockProducts.length / products.length) * 100}%`
                    }}
                  />
                </>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-[#8CE02C]" />
                In stock
              </span>
              <span className="font-semibold text-slate-900">
                {healthyProducts.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Low stock
              </span>
              <span className="font-semibold text-slate-900">
                {lowStockOnlyProducts.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Out of stock
              </span>
              <span className="font-semibold text-slate-900">
                {outOfStockProducts.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Inventory Watchlist */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Inventory watchlist
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                {attentionProducts.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Products that could use a little attention.
            </p>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            View all inventory <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Row */}
        <div className="px-5 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={watchSearch}
                onChange={(e) => setWatchSearch(e.target.value)}
                placeholder="Search by name or SKU"
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={watchCategory}
              onChange={(e) => setWatchCategory(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={watchStatus}
              onChange={(e) => setWatchStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              <option value="attention">Needs attention ({attentionProducts.length})</option>
              <option value="low">Low stock only</option>
              <option value="out">Out of stock only</option>
              <option value="all">All products ({products.length})</option>
            </select>
          </div>

          <button
            onClick={() => onNavigate('pos')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Open POS
          </button>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-100 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-5">Product name</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Stock level</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Unit price</th>
                <th className="py-2.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {watchlistRows.slice(0, 8).map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStock;
                const targetMax = Math.max(p.minStock * 2, 10);
                const pct = Math.min(100, Math.round((p.stock / targetMax) * 100));

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0">
                          <Box className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-900 text-[13px]">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {p.sku}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {cat ? cat.name : 'Uncategorized'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-28 space-y-1">
                        <div className="text-[11px] font-medium text-slate-600">
                          {p.stock} / {targetMax} {p.unit}
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOut
                                ? 'bg-rose-500'
                                : isLow
                                ? 'bg-amber-400'
                                : 'bg-[#8CE02C]'
                            }`}
                            style={{ width: `${Math.max(pct, isOut ? 0 : 8)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Out of stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Low stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-lime-50 text-lime-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                          In stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      {currency}{p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onQuickRestock(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#0F2D52] bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                );
              })}

              {watchlistRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No products match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Showing {Math.min(8, watchlistRows.length)} of {watchlistRows.length} items
          </span>
          <span>Updated just now</span>
        </div>
      </div>
    </div>
  );
}
