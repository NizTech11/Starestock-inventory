import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  LayoutGrid,
  AlertTriangle,
  Truck,
  Download,
  Plus,
  Search,
  CheckCircle2,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function OrdersTab({
  state,
  currency,
  preselectedProduct,
  onClearPreselected,
  onCreatePurchaseOrder,
  onReceivePurchaseOrder,
  onCancelPurchaseOrder
}) {
  const { purchaseOrders = [], suppliers = [], products = [] } = state;

  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'ordered' | 'received' | 'cancelled'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    expectedDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    notes: '',
    receiveImmediately: false,
    items: []
  });

  useEffect(() => {
    if (preselectedProduct) {
      setPoForm({
        supplierId: preselectedProduct.supplierId || suppliers[0]?.id || '',
        expectedDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        notes: `Restock order for ${preselectedProduct.name}`,
        receiveImmediately: false,
        items: [
          {
            productId: preselectedProduct.id,
            quantity: Math.max(10, preselectedProduct.minStock * 2),
            unitCost: preselectedProduct.costPrice
          }
        ]
      });
      setPoModalOpen(true);
      if (onClearPreselected) onClearPreselected();
    }
  }, [preselectedProduct, suppliers, onClearPreselected]);

  const openOrders = purchaseOrders.filter((po) => po.status === 'ordered');
  const receivedOrders = purchaseOrders.filter((po) => po.status === 'received');
  const cancelledOrders = purchaseOrders.filter((po) => po.status === 'cancelled');

  const openOrderValue = openOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const nextDelivery = openOrders[0];

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesTab = statusTab === 'all' || po.status === statusTab;
      const matchesSearch =
        po.id.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [purchaseOrders, statusTab, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const openNewOrderModal = () => {
    const firstProd = products[0];
    setPoForm({
      supplierId: suppliers[0]?.id || '',
      expectedDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      notes: '',
      receiveImmediately: false,
      items: firstProd
        ? [{ productId: firstProd.id, quantity: 10, unitCost: firstProd.costPrice }]
        : []
    });
    setPoModalOpen(true);
  };

  const addPoLineItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setPoForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: firstProd.id, quantity: 10, unitCost: firstProd.costPrice }
      ]
    }));
  };

  const updatePoLine = (idx, field, val) => {
    setPoForm((prev) => {
      const next = [...prev.items];
      if (field === 'productId') {
        const prod = products.find((p) => p.id === val);
        next[idx] = {
          ...next[idx],
          productId: val,
          unitCost: prod ? prod.costPrice : 0
        };
      } else {
        next[idx] = { ...next[idx], [field]: val };
      }
      return { ...prev, items: next };
    });
  };

  const removePoLine = (idx) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    if (poForm.items.length === 0) return;
    await onCreatePurchaseOrder(poForm);
    setPoModalOpen(false);
  };

  const exportOrdersCsv = () => {
    const headers = ['Order ID', 'Supplier', 'Items Count', 'Order Total', 'Expected Delivery', 'Status'];
    const rows = filteredOrders.map((po) => [
      po.id,
      `"${po.supplierName.replace(/"/g, '""')}"`,
      po.items.reduce((s, i) => s + Number(i.quantity), 0),
      po.totalAmount.toFixed(2),
      po.expectedDate || '-',
      po.status
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starestock-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Keep purchase orders moving, from draft to delivery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportOrdersCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export
          </button>
          <button
            onClick={openNewOrderModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New order
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Open orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-lime-50 border border-lime-200/70 flex items-center justify-center text-lime-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {openOrders.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Waiting for delivery
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Delivered orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {receivedOrders.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Added to shop shelves
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              In transit
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {openOrders.length}
          </p>
          <p className="mt-2 text-xs text-amber-600 font-medium">
            {nextDelivery ? `Next due: ${nextDelivery.expectedDate || 'Soon'}` : 'All caught up'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Open order value
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {currency}{openOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Across {suppliers.length} suppliers
          </p>
        </div>
      </div>

      {/* Main Orders Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Status Tabs */}
        <div className="px-5 pt-4 border-b border-slate-100 flex flex-wrap items-center gap-6">
          {[
            { id: 'all', label: 'All orders', count: purchaseOrders.length },
            { id: 'ordered', label: 'In transit', count: openOrders.length },
            { id: 'received', label: 'Delivered', count: receivedOrders.length },
            { id: 'cancelled', label: 'Cancelled', count: cancelledOrders.length }
          ].map((tab) => {
            const active = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusTab(tab.id);
                  setPage(1);
                }}
                className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer -mb-px ${
                  active
                    ? 'border-[#0F2D52] text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[11px] font-medium text-slate-400">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Toolbar */}
        <div className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search orders or suppliers"
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-100 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-5">Order</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Items</th>
                <th className="py-2.5 px-4">Order total</th>
                <th className="py-2.5 px-4">Expected delivery</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedOrders.map((po) => {
                const totalUnits = po.items.reduce(
                  (s, i) => s + Number(i.quantity),
                  0
                );
                return (
                  <tr key={po.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-5 font-semibold text-[#0F2D52]">
                      {po.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {po.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {po.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {totalUnits}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {currency}{po.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {po.expectedDate || new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {po.status === 'ordered' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-semibold">
                          In transit
                        </span>
                      ) : po.status === 'received' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-lime-50 text-lime-700 font-semibold">
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 font-semibold">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {po.status === 'ordered' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onReceivePurchaseOrder(po.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-[#0F2D52] hover:bg-[#163B6B] text-white rounded-md inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 text-[#8CE02C]" />
                            Receive
                          </button>
                          <button
                            onClick={() => onCancelPurchaseOrder(po.id)}
                            className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {po.status === 'received' ? 'Stock added' : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No purchase orders match this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Highlighted Next Delivery Strip */}
        {nextDelivery && (
          <div className="mx-5 my-3 px-4 py-2.5 rounded-xl bg-sky-50/80 border border-sky-100 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Next delivery:</span>{' '}
            {nextDelivery.id} from {nextDelivery.supplierName} — Expected{' '}
            {nextDelivery.expectedDate || 'soon'}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing{' '}
            {filteredOrders.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredOrders.length)} of{' '}
            {filteredOrders.length} orders
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="px-2 font-semibold text-slate-700">
              {safePage} / {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Purchase Order (PO)</h3>
              <button
                onClick={() => setPoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={poForm.supplierId}
                    onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Direct Market Restock</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={poForm.expectedDate}
                    onChange={(e) => setPoForm({ ...poForm, expectedDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Order Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addPoLineItem}
                    className="text-xs font-semibold text-[#0F2D52] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Row
                  </button>
                </div>

                {poForm.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg"
                  >
                    <div className="col-span-6">
                      <select
                        value={item.productId}
                        onChange={(e) => updatePoLine(idx, 'productId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updatePoLine(idx, 'quantity', Number(e.target.value))}
                        placeholder="Qty"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => updatePoLine(idx, 'unitCost', Number(e.target.value))}
                        placeholder="Unit Cost"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removePoLine(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  placeholder="Optional delivery or payment notes..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-lime-50 border border-lime-200 p-3 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={poForm.receiveImmediately}
                  onChange={(e) =>
                    setPoForm({ ...poForm, receiveImmediately: e.target.checked })
                  }
                  className="rounded"
                />
                <span>
                  Goods already arrived — <strong>Receive into stock immediately</strong>
                </span>
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-sm font-bold text-slate-900">
                  Order Total: {currency}
                  {poForm.items
                    .reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0)
                    .toFixed(2)}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPoModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg cursor-pointer"
                  >
                    {poForm.receiveImmediately ? 'Save & Receive Stock' : 'Create Order'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

