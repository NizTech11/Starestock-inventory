import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  PackageCheck,
  History,
  Upload,
  RotateCcw
} from 'lucide-react';

export default function ReportsTab({
  state,
  currency,
  onImportBackup,
  onResetDemo
}) {
  const { products = [], categories = [], sales = [], stockMovements = [] } = state;

  const [range, setRange] = useState('all'); // 'today' | '7d' | '30d' | 'all'

  const now = Date.now();
  const activeSales = sales.filter((s) => {
    if (s.status === 'voided') return false;
    const t = new Date(s.createdAt).getTime();
    if (range === 'today') return now - t <= 86400000;
    if (range === '7d') return now - t <= 7 * 86400000;
    if (range === '30d') return now - t <= 30 * 86400000;
    return true;
  });

  const grossRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
  const totalCogs = activeSales.reduce((sum, s) => sum + s.totalCost, 0);
  const netProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);
  const profitMargin =
    grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0.0';

  // Aggregate Product Performance
  const productPerfMap = {};
  for (const sale of activeSales) {
    for (const item of sale.items) {
      if (!productPerfMap[item.productId]) {
        const prod = products.find((p) => p.id === item.productId);
        productPerfMap[item.productId] = {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          categoryId: prod?.categoryId || '',
          unitsSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }
      const entry = productPerfMap[item.productId];
      entry.unitsSold += Number(item.quantity);
      entry.revenue += Number(item.lineTotal);
      entry.cost += Number(item.quantity) * Number(item.unitCost);
      entry.profit += Number(item.lineProfit);
    }
  }

  const productPerformance = Object.values(productPerfMap).sort(
    (a, b) => b.profit - a.profit
  );

  // Payment Method Breakdown
  const paymentBreakdown = {};
  for (const sale of activeSales) {
    paymentBreakdown[sale.paymentMethod] =
      (paymentBreakdown[sale.paymentMethod] || 0) + sale.total;
  }

  const exportProfitReportCsv = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Units Sold',
      'Revenue',
      'Cost of Goods Sold (COGS)',
      'Net Profit',
      'Profit Margin %'
    ];
    const rows = productPerformance.map((p) => {
      const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
      return [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.unitsSold,
        p.revenue.toFixed(2),
        p.cost.toFixed(2),
        p.profit.toFixed(2),
        `${margin}%`
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop3-profit-report-${range}.csv`;
    a.click();
  };

  const exportJsonBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop3-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        await onImportBackup(parsed);
      } catch (err) {
        alert('Invalid backup JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Filter & Export Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900 text-sm">Period:</span>
          {[
            { id: 'today', label: 'Today (24h)' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                range === r.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportProfitReportCsv}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Profit CSV
          </button>
          <button
            onClick={exportJsonBackup}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Backup JSON
          </button>
          <label className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Restore JSON
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              if (window.confirm('Reset Shop3 data back to default sample inventory?')) {
                onResetDemo();
              }
            }}
            className="px-3 py-1.5 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>
      </div>

      {/* Profit & Loss Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Gross Sales Revenue
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {currency}{grossRevenue.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {activeSales.length} completed transactions
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Cost of Goods Sold (COGS)
          </span>
          <p className="text-2xl font-bold text-slate-700 mt-2">
            {currency}{totalCogs.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Wholesale product cost</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Net Realized Profit
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            +{currency}{netProfit.toFixed(2)}
          </p>
          <p className="text-xs text-emerald-600 mt-1">Revenue minus COGS & discounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Profit Margin %
          </span>
          <p className="text-2xl font-bold text-blue-600 mt-2">{profitMargin}%</p>
          <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500">
            {Object.entries(paymentBreakdown).map(([method, amt]) => (
              <span key={method}>
                {method}: {currency}{amt.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Product Profitability Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900">
              Product Profitability & Sales Ranking
            </h2>
          </div>
          <span className="text-xs text-slate-400">Sorted by highest net profit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Sales Revenue</th>
                <th className="py-3 px-4 text-right">COGS (Cost)</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {productPerformance.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const margin =
                  p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={p.productId} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {cat ? cat.name : 'Uncategorized'}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {p.unitsSold}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900">
                      {currency}{p.revenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {currency}{p.cost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      +{currency}{p.profit.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-blue-600">
                      {margin}%
                    </td>
                  </tr>
                );
              })}

              {productPerformance.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sales recorded for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movement Audit Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-slate-900">
              Stock Movement Audit Ledger ({stockMovements.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Tracks every sale, PO receipt, and manual adjustment
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4 text-center">Qty Change</th>
                <th className="py-3 px-4 text-center">Stock Before → After</th>
                <th className="py-3 px-4">Reference & Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {stockMovements.map((mov) => {
                const isPositive = mov.quantityChange > 0;
                return (
                  <tr key={mov.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(mov.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{mov.productName}</div>
                      <div className="text-xs font-mono text-slate-400">{mov.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                          mov.type === 'po_receive' || mov.type === 'adjustment_in' || mov.type === 'initial'
                            ? 'bg-emerald-100 text-emerald-700'
                            : mov.type === 'sale'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {mov.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-center font-bold ${
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? `+${mov.quantityChange}` : mov.quantityChange}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-600">
                      {mov.previousStock} → <span className="font-bold">{mov.newStock}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <span className="font-mono font-semibold text-slate-800">
                        [{mov.reference}]
                      </span>{' '}
                      {mov.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

