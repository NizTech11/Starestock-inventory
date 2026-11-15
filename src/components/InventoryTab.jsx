import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Tag,
  Download,
  Package,
  LayoutGrid,
  AlertTriangle,
  Truck,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function InventoryTab({
  state,
  currency,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
  onCreateCategory,
  onDeleteCategory
}) {
  const { products = [], categories = [], suppliers = [] } = state;

  const [stockTab, setStockTab] = useState('all'); // 'all' | 'low' | 'out'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Product Add/Edit Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    categoryId: '',
    supplierId: '',
    costPrice: '',
    sellingPrice: '',
    stock: '',
    minStock: '10',
    unit: 'pcs'
  });

  // Stock Adjustment Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);
  const [adjustData, setAdjustData] = useState({
    type: 'in',
    quantity: '',
    note: ''
  });

  // Category Modal & Inline Quick-Add
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [inlineCatOpen, setInlineCatOpen] = useState(false);
  const [inlineCatName, setInlineCatName] = useState('');
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: '#8CE02C',
    description: ''
  });

  const lowStockList = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockList = products.filter((p) => p.stock <= 0);
  const totalRetailValue = products.reduce(
    (sum, p) => sum + p.stock * p.sellingPrice,
    0
  );
  const totalCostValue = products.reduce(
    (sum, p) => sum + p.stock * p.costPrice,
    0
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesTab =
        stockTab === 'all'
          ? true
          : stockTab === 'low'
          ? p.stock > 0 && p.stock <= p.minStock
          : p.stock <= 0;

      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        categoryFilter === 'all' || p.categoryId === categoryFilter;

      const matchesSup =
        supplierFilter === 'all' || p.supplierId === supplierFilter;

      return matchesTab && matchesSearch && matchesCat && matchesSup;
    });
  }, [products, stockTab, search, categoryFilter, supplierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      categoryId: categories[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      costPrice: '',
      sellingPrice: '',
      stock: '0',
      minStock: '10',
      unit: 'pcs'
    });
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      categoryId: prod.categoryId || '',
      supplierId: prod.supplierId || '',
      costPrice: String(prod.costPrice),
      sellingPrice: String(prod.sellingPrice),
      stock: String(prod.stock),
      minStock: String(prod.minStock),
      unit: prod.unit || 'pcs'
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      costPrice: Number(formData.costPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0
    };
    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onCreateProduct(payload);
    }
    setProductModalOpen(false);
  };

  const handleStockAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    await onAdjustStock(adjustModalProduct.id, {
      type: adjustData.type,
      quantity: Number(adjustData.quantity),
      note: adjustData.note
    });
    setAdjustModalProduct(null);
    setAdjustData({ type: 'in', quantity: '', note: '' });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    await onCreateCategory(newCategory);
    setNewCategory({ name: '', color: '#8CE02C', description: '' });
  };

  const handleInlineAddCategory = async () => {
    const trimmed = inlineCatName.trim();
    if (!trimmed) return;
    const created = await onCreateCategory({
      name: trimmed,
      color: '#8CE02C',
      description: ''
    });
    if (created?.id) {
      setFormData((prev) => ({ ...prev, categoryId: created.id }));
    }
    setInlineCatName('');
    setInlineCatOpen(false);
  };

  const exportCsv = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Supplier',
      'Cost Price',
      'Selling Price',
      'Unit Profit',
      'Stock',
      'Min Stock',
      'Unit'
    ];
    const rows = filteredProducts.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || 'Uncategorized';
      const sup = suppliers.find((s) => s.id === p.supplierId)?.name || '-';
      const profit = p.sellingPrice - p.costPrice;
      return [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${cat}"`,
        `"${sup}"`,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        profit.toFixed(2),
        p.stock,
        p.minStock,
        p.unit
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop3-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every product, every category. One clear view.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export
          </button>
          <button
            onClick={openNewProductModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add product
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total products
            </span>
            <div className="w-8 h-8 rounded-lg bg-lime-50 border border-lime-200/70 flex items-center justify-center text-lime-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {products.length.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Across {categories.length} categories
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Inventory value
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {currency}{totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Cost basis: {currency}{totalCostValue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Low stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {lowStockList.length}
          </p>
          <p className="mt-2 text-xs text-amber-600 font-medium">
            {lowStockList.length} need attention today
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-slate-500">
              Out of stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2.5 text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
            {outOfStockList.length}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Reorder to stay ready
          </p>
        </div>
      </div>

      {/* Main Inventory Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Top Tabs inside card */}
        <div className="px-5 pt-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6 -mb-px">
            {[
              { id: 'all', label: 'All products', count: products.length },
              { id: 'low', label: 'Low stock', count: lowStockList.length },
              { id: 'out', label: 'Out of stock', count: outOfStockList.length }
            ].map((tab) => {
              const active = stockTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStockTab(tab.id);
                    setPage(1);
                  }}
                  className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
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

          <button
            onClick={() => setCategoryModalOpen(true)}
            className="mb-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            Manage Categories ({categories.length})
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[230px] flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by product name or SKU"
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
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
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg"
            >
              <option value="all">All suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Table */}
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
                <th className="py-2.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const isOut = p.stock <= 0;
                const isLow = p.stock > 0 && p.stock <= p.minStock;
                const targetMax = Math.max(p.minStock * 2, 10);
                const unitProfit = p.sellingPrice - p.costPrice;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 text-[13px]">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Cost {currency}{p.costPrice.toFixed(2)} · Profit +{currency}{unitProfit.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {p.sku}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {cat ? cat.name : 'Uncategorized'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {p.stock} {p.unit}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Alert at {p.minStock} {p.unit}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isOut ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 font-semibold">
                          Out of stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 font-semibold">
                          Low stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-lime-50 text-lime-700 font-semibold">
                          In stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      {currency}{p.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setAdjustModalProduct(p);
                            setAdjustData({ type: 'in', quantity: '', note: '' });
                          }}
                          title="Adjust Stock In/Out"
                          className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          Stock
                        </button>
                        <button
                          onClick={() => openEditProductModal(p)}
                          title="Edit Product"
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          title="Delete Product"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No matching products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing{' '}
            {filteredProducts.length === 0
              ? 0
              : (safePage - 1) * pageSize + 1}
            –{Math.min(safePage * pageSize, filteredProducts.length)} of{' '}
            {filteredProducts.length} products
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

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU / Barcode *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pure Vegetable Oil 2L"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setInlineCatOpen((v) => !v)}
                      className="text-[11px] font-semibold text-[#0F2D52] hover:underline cursor-pointer"
                    >
                      {inlineCatOpen ? 'Cancel' : '+ New category'}
                    </button>
                  </div>

                  {inlineCatOpen ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={inlineCatName}
                        onChange={(e) => setInlineCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleInlineAddCategory();
                          }
                        }}
                        placeholder="e.g. Plumbing Pipes"
                        className="flex-1 min-w-0 px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleInlineAddCategory}
                        className="px-3 py-2 text-xs font-semibold bg-[#0F2D52] text-white rounded-lg hover:bg-[#163B6B] shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Supplier
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">None</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price ({currency}) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Price ({currency}) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Alert Qty
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center bg-slate-50 p-3 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Type (pcs, pack, kg, bottle)
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg"
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Estimated Unit Profit</span>
                  <span className="text-base font-bold text-emerald-600">
                    {currency}
                    {(
                      (Number(formData.sellingPrice) || 0) - (Number(formData.costPrice) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Stock Level</h3>
                <p className="text-xs text-slate-500">
                  {adjustModalProduct.name} (Current: {adjustModalProduct.stock}{' '}
                  {adjustModalProduct.unit})
                </p>
              </div>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'in', label: '+ Stock In (Add)' },
                    { id: 'out', label: '- Stock Out (Remove)' },
                    { id: 'damage', label: 'Damaged / Expired' },
                    { id: 'set', label: 'Set Exact Count' }
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setAdjustData({ ...adjustData, type: opt.id })}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border text-left cursor-pointer ${
                        adjustData.type === opt.id
                          ? 'border-[#0F2D52] bg-slate-100 text-[#0F2D52] font-semibold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity ({adjustModalProduct.unit}) *
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0.01"
                  value={adjustData.quantity}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  placeholder="Enter quantity..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Note
                </label>
                <input
                  type="text"
                  value={adjustData.note}
                  onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                  placeholder="e.g. Shelf restock, shelf audit, broken bottle"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg cursor-pointer"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Manage Product Categories</h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                required
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="New category name..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-10 h-8 p-1 border border-slate-200 rounded-lg cursor-pointer"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-semibold bg-[#0F2D52] text-white rounded-lg hover:bg-[#163B6B] cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                return (
                  <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium text-slate-800">{c.name}</span>
                      <span className="text-slate-400">({count} products)</span>
                    </div>
                    <button
                      onClick={() => onDeleteCategory(c.id)}
                      className="text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
