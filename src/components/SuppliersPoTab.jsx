import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit2,
  PackagePlus,
  X
} from 'lucide-react';

export default function SuppliersPoTab({
  state,
  currency,
  preselectedProduct,
  onClearPreselected,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onCreatePurchaseOrder,
  onReceivePurchaseOrder,
  onCancelPurchaseOrder
}) {
  const { suppliers = [], purchaseOrders = [], products = [] } = state;

  const [poModalOpen, setPoModalOpen] = useState(false);
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

  const openNewPoModal = () => {
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

  return (
    <div className="space-y-6">
      {/* Purchase Orders Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              Purchase Orders & Stock Replenishment
            </h2>
            <p className="text-xs text-slate-500">
              Create supplier orders and click “Receive Stock” when goods arrive at Shop3 to auto-update inventory.
            </p>
          </div>
          <button
            onClick={openNewPoModal}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">PO # & Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Ordered Items</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{po.id}</div>
                    <div className="text-xs text-slate-400">
                      Created: {new Date(po.createdAt).toLocaleDateString()}
                    </div>
                    {po.expectedDate && (
                      <div className="text-xs text-slate-500">Due: {po.expectedDate}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{po.supplierName}</div>
                    {po.notes && <div className="text-xs text-slate-400">{po.notes}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-slate-700 space-y-0.5">
                      {po.items.map((item, i) => (
                        <div key={i}>
                          <span className="font-semibold">+{item.quantity}</span> × {item.name} (@{' '}
                          {currency}{Number(item.unitCost).toFixed(2)})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {currency}{po.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        po.status === 'received'
                          ? 'bg-emerald-100 text-emerald-700'
                          : po.status === 'ordered'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {po.status === 'ordered' ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onReceivePurchaseOrder(po.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Receive Stock
                        </button>
                        <button
                          onClick={() => onCancelPurchaseOrder(po.id)}
                          className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {po.status === 'received' ? 'Stock Added' : 'Cancelled'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suppliers Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">
            Suppliers Directory ({suppliers.length})
          </h2>
          <button
            onClick={() => openSupplierModal(null)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((sup) => {
            const suppliedCount = products.filter((p) => p.supplierId === sup.id).length;
            return (
              <div
                key={sup.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{sup.name}</h3>
                      <p className="text-xs text-slate-500">
                        Contact: {sup.contactPerson || 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      {suppliedCount} products
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    {sup.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.phone}</span>
                      </div>
                    )}
                    {sup.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.email}</span>
                      </div>
                    )}
                    {sup.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup.address}</span>
                      </div>
                    )}
                  </div>
                  {sup.notes && (
                    <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                      {sup.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => openSupplierModal(sup)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete supplier "${sup.name}"?`)) {
                        onDeleteSupplier(sup.id);
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Purchase Order (PO)</h3>
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
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
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={poForm.receiveImmediately}
                  onChange={(e) =>
                    setPoForm({ ...poForm, receiveImmediately: e.target.checked })
                  }
                  className="rounded text-emerald-600"
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
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                  >
                    {poForm.receiveImmediately ? 'Save & Receive Stock' : 'Create Purchase Order'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
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

