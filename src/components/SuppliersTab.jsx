import React, { useState, useMemo } from 'react';
import {
  Package,
  LayoutGrid,
  AlertTriangle,
  Truck,
  Download,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowRight,
  X
} from 'lucide-react';

export default function SuppliersTab({
  state,
  currency,
  onNavigate,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier
}) {
  const { suppliers = [], purchaseOrders = [], products = [] } = state;

  const [search, setSearch] = useState('');
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supForm, setSupForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const openOrders = purchaseOrders.filter((po) => po.status === 'ordered');
  const receivedOrders = purchaseOrders.filter((po) => po.status === 'received');
  const totalSpend = purchaseOrders
    .filter((po) => po.status !== 'cancelled')
    .reduce((sum, po) => sum + po.totalAmount, 0);

  const nonCancelled = purchaseOrders.filter((po) => po.status !== 'cancelled').length;
  const fulfillmentRate =
    nonCancelled > 0
      ? ((receivedOrders.length / nonCancelled) * 100).toFixed(1)
      : '100.0';

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contactPerson || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    });
  }, [suppliers, search]);

  const openSupplierModal = (sup = null) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupForm({
        name: sup.name,
        contactPerson: sup.contactPerson || '',
        phone: sup.phone || '',
        email: sup.email || '',
        address: sup.address || '',
        notes: sup.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setSupForm({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    }
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (editingSupplier) {
      await onUpdateSupplier(editingSupplier.id, supForm);
    } else {
      await onCreateSupplier(supForm);
    }
    setSupplierModalOpen(false);
  };

  const exportSuppliersCsv = () => {
    const headers = ['Supplier', 'Contact Person', 'Phone', 'Email', 'Address', 'Notes'];
    const rows = filteredSuppliers.map((s) =>
      [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${(s.contactPerson || '').replace(/"/g, '""')}"`,
        `"${(s.phone || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.address || '').replace(/"/g, '""')}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starestock-suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Suppliers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Good relationships. Reliable replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportSuppliersCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export
          </button>
          <button
            onClick={() => openSupplierModal(null)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add supplier
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Active suppliers
            </span>
            <div className="w-8 h-8 rounded-lg bg-lime-50 border border-lime-200/70 flex items-center justify-center text-lime-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {suppliers.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Supplying {products.length} products
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Delivery completion
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {fulfillmentRate}%
          </p>
          <p className="mt-2 text-xs text-emerald-600 font-medium">
            {receivedOrders.length} orders received
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Open orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {openOrders.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Currently in transit
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total PO spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {currency}{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Across {purchaseOrders.length} purchase orders
          </p>
        </div>
      </div>

      {/* Supplier Directory Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            Supplier directory
          </h2>
          <span className="text-xs text-slate-400">
            {suppliers.length} active suppliers
          </span>
        </div>

        <div className="px-5 pb-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers or contacts"
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-100 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-5">Supplier</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Phone / Email</th>
                <th className="py-2.5 px-4">Products</th>
                <th className="py-2.5 px-4">Open orders</th>
                <th className="py-2.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSuppliers.map((sup) => {
                const suppliedCount = products.filter(
                  (p) => p.supplierId === sup.id
                ).length;
                const supOpenOrders = openOrders.filter(
                  (po) => po.supplierId === sup.id
                ).length;

                return (
                  <tr key={sup.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#0F2D52] text-[13px]">
                        {sup.name}
                      </div>
                      {sup.address && (
                        <div className="text-[11px] text-slate-400">
                          {sup.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {sup.contactPerson || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{sup.phone || '—'}</div>
                      <div className="text-[11px] text-slate-400">{sup.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-lime-700">
                      {suppliedCount} items
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {supOpenOrders}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openSupplierModal(sup)}
                          title="Edit Supplier"
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete supplier "${sup.name}"?`)) {
                              onDeleteSupplier(sup.id);
                            }
                          }}
                          title="Delete Supplier"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No suppliers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </span>
          <button
            onClick={() => onNavigate('orders')}
            className="font-semibold text-[#0F2D52] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Review purchase orders <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom 2-Column Performance & Replenishment Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Delivery performance
            </h3>
            <span className="text-[11px] text-slate-400">All orders</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-bold text-[#1E40AF]">
              {fulfillmentRate}%
            </span>
            <span className="text-xs text-slate-500">
              of purchase orders delivered to stock
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#8CE02C] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Number(fulfillmentRate))}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {receivedOrders.length} completed · {openOrders.length} currently in transit
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Keep replenishment on track
            </h3>
            <p className="text-sm font-semibold text-slate-800 mt-2">
              {openOrders.length} {openOrders.length === 1 ? 'order is' : 'orders are'} waiting for delivery
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              When boxes arrive at your shop, open the Orders tab and click Receive to automatically update shelf quantities and unit costs.
            </p>
          </div>
          <div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-[#0F2D52] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Review purchase orders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => setSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Supplier Name *
                </label>
                <input
                  required
                  type="text"
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={supForm.contactPerson}
                    onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={supForm.phone}
                    onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={supForm.email}
                  onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={supForm.address}
                  onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes / Delivery Days
                </label>
                <input
                  type="text"
                  value={supForm.notes}
                  onChange={(e) => setSupForm({ ...supForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

