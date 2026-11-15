import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  History,
  RotateCcw,
  X
} from 'lucide-react';

export default function PosTab({
  state,
  currency,
  onCreateSale,
  onVoidSale
}) {
  const { products = [], categories = [], sales = [], settings = {} } = state;

  const [subTab, setSubTab] = useState('register'); // 'register' | 'history'
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState('');
  const [amountTendered, setAmountTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.sellingPrice,
          unitCost: product.costPrice,
          maxStock: product.stock,
          unit: product.unit,
          quantity: 1
        }
      ];
    });
  };

  const updateCartQty = (productId, nextQty) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(i.maxStock, nextQty) }
          : i
      )
    );
  };

  const subtotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalCost = cart.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);
  const discountVal = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subtotal - discountVal);
  const estimatedProfit = grandTotal - totalCost;
  const changeDue =
    Number(amountTendered) > grandTotal ? Number(amountTendered) - grandTotal : 0;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const completedSale = await onCreateSale({
        customerName: customerName.trim() || 'Walk-in Customer',
        paymentMethod,
        discount: discountVal,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      });
      setLastReceipt(completedSale);
      setCart([]);
      setCustomerName('');
      setDiscount('');
      setAmountTendered('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-navigation */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('register')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'register'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            POS Cash Register
          </button>
          <button
            onClick={() => setSubTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              subTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            Sales History & Receipts ({sales.length})
          </button>
        </div>
      </div>

      {subTab === 'register' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selector Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Scan barcode / SKU or search product to add to sale..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                    selectedCat === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer ${
                      selectedCat === c.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const inCart = cart.find((i) => i.productId === p.id);
                const remainingStock = Math.max(0, p.stock - (inCart?.quantity || 0));
                const isOut = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    disabled={isOut || remainingStock <= 0}
                    onClick={() => addToCart(p)}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isOut || remainingStock <= 0
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'bg-blue-50/50 border-blue-500 shadow-xs cursor-pointer'
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {p.sku}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isOut || remainingStock <= 0
                              ? 'bg-red-100 text-red-700'
                              : remainingStock <= p.minStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOut
                            ? 'Out of stock'
                            : remainingStock <= 0
                            ? 'All in cart'
                            : `${remainingStock} ${p.unit}`}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm mt-2 line-clamp-2">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-base font-bold text-slate-900">
                          {currency}{p.sellingPrice.toFixed(2)}
                        </span>
                        <span className="block text-[11px] text-emerald-600">
                          +{currency}{(p.sellingPrice - p.costPrice).toFixed(2)} profit
                        </span>
                      </div>
                      {inCart && (
                        <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg">
                          {inCart.quantity} in cart
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Sale Cart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-fit sticky top-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900">Current Order</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                Click any product on the left to add it to the customer’s bill.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto px-4">
                {cart.map((item) => (
                  <div key={item.productId} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {currency}{item.unitPrice.toFixed(2)} × {item.quantity} ={' '}
                        <span className="font-semibold text-slate-800">
                          {currency}{(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.maxStock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartQty(item.productId, Number(e.target.value) || 1)
                        }
                        className="w-12 text-center text-xs font-semibold border border-slate-200 rounded py-1"
                      />
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, 0)}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCheckout} className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/60">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Card">Card / POS</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Discount ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cash Tendered ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={grandTotal.toFixed(2)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Discount</span>
                    <span>-{currency}{discountVal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Estimated Profit</span>
                  <span>+{currency}{estimatedProfit.toFixed(2)}</span>
                </div>
                {changeDue > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>Change Due</span>
                    <span>{currency}{changeDue.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                  <span>Total Payable</span>
                  <span>{currency}{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0 || submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Processing Sale...' : `Complete Sale (${currency}${grandTotal.toFixed(2)})`}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Sales History Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Receipt ID & Date</th>
                  <th className="py-3 px-4">Customer & Payment</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">COGS (Cost)</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sales.map((sale) => {
                  const isVoid = sale.status === 'voided';
                  return (
                    <tr key={sale.id} className={isVoid ? 'bg-red-50/40 opacity-60' : 'hover:bg-slate-50'}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{sale.id}</span>
                          {isVoid && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">
                              VOIDED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(sale.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{sale.customerName}</div>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-700 space-y-0.5">
                          {sale.items.map((item, idx) => (
                            <div key={idx}>
                              {item.quantity}× {item.name} ({currency}{item.unitPrice.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {currency}{sale.total.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {currency}{sale.totalCost.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                        +{currency}{sale.profit.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setLastReceipt(sale)}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                          {!isVoid && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Void sale ${sale.id} and restore all items back to stock?`
                                  )
                                ) {
                                  onVoidSale(sale.id);
                                }
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div
            id="printable-receipt"
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {settings.shopName || 'Shop3 Mini-Mart'}
                </h3>
                <p className="text-xs text-slate-500">{settings.address}</p>
                <p className="text-xs text-slate-500">{settings.phone}</p>
              </div>
              <button
                onClick={() => setLastReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 print:hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 border-b border-dashed border-slate-200 pb-3">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-mono font-semibold text-slate-900">{lastReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(lastReceipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{lastReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{lastReceipt.paymentMethod}</span>
              </div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-200 pb-3 text-xs">
              {lastReceipt.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{item.name}</span>
                    <div className="text-slate-400">
                      {item.quantity} × {currency}{item.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {currency}{item.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{currency}{lastReceipt.subtotal.toFixed(2)}</span>
              </div>
              {lastReceipt.discount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span>-{currency}{lastReceipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                <span>Total Paid</span>
                <span>{currency}{lastReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-center text-slate-400 pt-2">
              {settings.receiptFooter || 'Thank you for shopping at Shop3!'}
            </p>

            <div className="flex gap-2 pt-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

