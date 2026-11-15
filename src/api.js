import { createInitialSeedData } from '../server/seedData.js';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const LOCAL_FALLBACK_KEY = 'shop3_inventory_fallback_v1';

function getLocalFallbackStore() {
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading localStorage fallback', e);
  }
  const seed = createInitialSeedData();
  localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(seed));
  return seed;
}

function saveLocalFallbackStore(store) {
  localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(store));
  return store;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('API_UNAVAILABLE');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  async getState() {
    try {
      return await request('/state');
    } catch (err) {
      if (err.message === 'API_UNAVAILABLE' || err.name === 'TypeError') {
        const local = getLocalFallbackStore();
        return { ...local, storageMode: 'browser-fallback' };
      }
      throw err;
    }
  },

  async createProduct(payload) {
    try {
      return await request('/products', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      if (err.message === 'API_UNAVAILABLE' || err.name === 'TypeError') {
        const store = getLocalFallbackStore();
        const newProduct = {
          id: `prod-${Date.now()}`,
          sku: String(payload.sku).trim().toUpperCase(),
          name: String(payload.name).trim(),
          categoryId: payload.categoryId || '',
          supplierId: payload.supplierId || '',
          costPrice: Number(payload.costPrice) || 0,
          sellingPrice: Number(payload.sellingPrice) || 0,
          stock: Number(payload.stock) || 0,
          minStock: Number(payload.minStock) || 0,
          unit: payload.unit || 'pcs',
          updatedAt: new Date().toISOString()
        };
        store.products.unshift(newProduct);
        saveLocalFallbackStore(store);
        return newProduct;
      }
      throw err;
    }
  },

  async updateProduct(id, payload) {
    try {
      return await request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } catch (err) {
      if (err.message === 'API_UNAVAILABLE' || err.name === 'TypeError') {
        const store = getLocalFallbackStore();
        const idx = store.products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          store.products[idx] = { ...store.products[idx], ...payload, updatedAt: new Date().toISOString() };
          saveLocalFallbackStore(store);
          return store.products[idx];
        }
      }
      throw err;
    }
  },

  async deleteProduct(id) {
    try {
      return await request(`/products/${id}`, { method: 'DELETE' });
    } catch (err) {
      if (err.message === 'API_UNAVAILABLE' || err.name === 'TypeError') {
        const store = getLocalFallbackStore();
        store.products = store.products.filter((p) => p.id !== id);
        saveLocalFallbackStore(store);
        return { ok: true };
      }
      throw err;
    }
  },

  async adjustStock(id, payload) {
    try {
      return await request(`/products/${id}/adjust-stock`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      if (err.message === 'API_UNAVAILABLE' || err.name === 'TypeError') {
        const store = getLocalFallbackStore();
        const product = store.products.find((p) => p.id === id);
        const qty = Number(payload.quantity);
        const prev = Number(product.stock) || 0;
        const next = payload.type === 'in' ? prev + qty : payload.type === 'set' ? qty : Math.max(0, prev - qty);
        product.stock = next;
        store.stockMovements.unshift({
          id: `mov-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: payload.type === 'in' ? 'adjustment_in' : 'adjustment_out',
          quantityChange: next - prev,
          previousStock: prev,
          newStock: next,
          reference: 'MANUAL',
          note: payload.note || 'Manual adjustment',
          createdAt: new Date().toISOString()
        });
        saveLocalFallbackStore(store);
        return { product };
      }
      throw err;
    }
  },

  async createCategory(payload) {
    return request('/categories', { method: 'POST', body: JSON.stringify(payload) });
  },

  async deleteCategory(id) {
    return request(`/categories/${id}`, { method: 'DELETE' });
  },

  async createSupplier(payload) {
    return request('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
  },

  async updateSupplier(id, payload) {
    return request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async deleteSupplier(id) {
    return request(`/suppliers/${id}`, { method: 'DELETE' });
  },

  async createSale(payload) {
    try {
      return await request('/sales', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      if (err.message === 'API_UNAVAILABLE' || err.name === 'TypeError') {
        const store = getLocalFallbackStore();
        const nowIso = new Date().toISOString();
        const saleId = `SALE-${1000 + store.sales.length + 1}`;
        let subtotal = 0;
        let totalCost = 0;

        const processedItems = (payload.items || []).map((item) => {
          const product = store.products.find((p) => p.id === item.productId);
          const qty = Number(item.quantity);
          const unitPrice = Number(item.unitPrice ?? product.sellingPrice);
          const unitCost = Number(product.costPrice);
          const lineTotal = +(qty * unitPrice).toFixed(2);
          const lineProfit = +(lineTotal - qty * unitCost).toFixed(2);
          subtotal += lineTotal;
          totalCost += +(qty * unitCost).toFixed(2);

          const prevStock = product.stock;
          product.stock = Math.max(0, prevStock - qty);
          product.updatedAt = nowIso;

          store.stockMovements.unshift({
            id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            type: 'sale',
            quantityChange: -qty,
            previousStock: prevStock,
            newStock: product.stock,
            reference: saleId,
            note: `POS Sale (${payload.customerName || 'Walk-in Customer'})`,
            createdAt: nowIso
          });

          return {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: qty,
            unitPrice,
            unitCost,
            lineTotal,
            lineProfit
          };
        });

        const discountAmt = Math.max(0, Number(payload.discount) || 0);
        const total = Math.max(0, +(subtotal - discountAmt).toFixed(2));
        const newSale = {
          id: saleId,
          createdAt: nowIso,
          customerName: payload.customerName || 'Walk-in Customer',
          paymentMethod: payload.paymentMethod || 'Cash',
          discount: discountAmt,
          subtotal: +subtotal.toFixed(2),
          total,
          totalCost: +totalCost.toFixed(2),
          profit: +(total - totalCost).toFixed(2),
          status: 'completed',
          items: processedItems
        };
        store.sales.unshift(newSale);
        saveLocalFallbackStore(store);
        return newSale;
      }
      throw err;
    }
  },

  async voidSale(id) {
    return request(`/sales/${id}/void`, { method: 'POST' });
  },

  async createPurchaseOrder(payload) {
    return request('/purchase-orders', { method: 'POST', body: JSON.stringify(payload) });
  },

  async receivePurchaseOrder(id) {
    return request(`/purchase-orders/${id}/receive`, { method: 'POST' });
  },

  async cancelPurchaseOrder(id) {
    return request(`/purchase-orders/${id}/cancel`, { method: 'POST' });
  },

  async updateSettings(payload) {
    return request('/settings', { method: 'PUT', body: JSON.stringify(payload) });
  },

  async importData(payload) {
    return request('/import', { method: 'POST', body: JSON.stringify(payload) });
  },

  async resetDemo() {
    return request('/reset-demo', { method: 'POST' });
  }
};

