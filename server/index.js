import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDb, readStore, writeStore, getStorageMode } from './db.js';
import { createInitialSeedData } from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health & Full State
app.get('/api/health', (req, res) => {
  res.json({ ok: true, storageMode: getStorageMode(), timestamp: new Date().toISOString() });
});

app.get('/api/state', async (req, res) => {
  try {
    const store = await readStore();
    res.json({ ...store, storageMode: getStorageMode() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shop Settings
app.put('/api/settings', async (req, res) => {
  try {
    const store = await readStore();
    store.settings = { ...store.settings, ...req.body };
    await writeStore(store);
    res.json(store.settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products CRUD
app.post('/api/products', async (req, res) => {
  try {
    const store = await readStore();
    const {
      sku,
      name,
      categoryId,
      supplierId,
      costPrice,
      sellingPrice,
      stock = 0,
      minStock = 5,
      unit = 'pcs'
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Product name and SKU are required.' });
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      sku: String(sku).trim().toUpperCase(),
      name: String(name).trim(),
      categoryId: categoryId || (store.categories[0]?.id ?? ''),
      supplierId: supplierId || '',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      unit: unit || 'pcs',
      updatedAt: new Date().toISOString()
    };

    store.products.unshift(newProduct);

    if (newProduct.stock > 0) {
      store.stockMovements.unshift({
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'initial',
        quantityChange: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        reference: 'INIT',
        note: 'Initial opening stock',
        createdAt: new Date().toISOString()
      });
    }

    await writeStore(store);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const store = await readStore();
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const existing = store.products[idx];
    const updated = {
      ...existing,
      ...req.body,
      costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : existing.costPrice,
      sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : existing.sellingPrice,
      minStock: req.body.minStock !== undefined ? Number(req.body.minStock) : existing.minStock,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
      updatedAt: new Date().toISOString()
    };

    store.products[idx] = updated;
    await writeStore(store);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const store = await readStore();
    store.products = store.products.filter((p) => p.id !== req.params.id);
    await writeStore(store);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock Adjustment
app.post('/api/products/:id/adjust-stock', async (req, res) => {
  try {
    const store = await readStore();
    const product = store.products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { type, quantity, note } = req.body;
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    const previousStock = Number(product.stock) || 0;
    let newStock = previousStock;
    let quantityChange = 0;

    if (type === 'in') {
      newStock = previousStock + qty;
      quantityChange = qty;
    } else if (type === 'out' || type === 'damage') {
      newStock = Math.max(0, previousStock - qty);
      quantityChange = newStock - previousStock;
    } else if (type === 'set') {
      newStock = qty;
      quantityChange = newStock - previousStock;
    } else {
      return res.status(400).json({ error: 'Invalid adjustment type' });
    }

    product.stock = newStock;
    product.updatedAt = new Date().toISOString();

    const movement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: type === 'in' ? 'adjustment_in' : type === 'damage' ? 'damage' : 'adjustment_out',
      quantityChange,
      previousStock,
      newStock,
      reference: 'MANUAL',
      note: note || `Manual stock adjustment (${type.toUpperCase()})`,
      createdAt: new Date().toISOString()
    };

    store.stockMovements.unshift(movement);
    await writeStore(store);
    res.json({ product, movement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories CRUD
app.post('/api/categories', async (req, res) => {
  try {
    const store = await readStore();
    const { name, color = '#3b82f6', description = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const newCat = {
      id: `cat-${Date.now()}`,
      name: String(name).trim(),
      color,
      description
    };
    store.categories.push(newCat);
    await writeStore(store);
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const store = await readStore();
    const idx = store.categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Category not found' });
    store.categories[idx] = { ...store.categories[idx], ...req.body };
    await writeStore(store);
    res.json(store.categories[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const store = await readStore();
    store.categories = store.categories.filter((c) => c.id !== req.params.id);
    await writeStore(store);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suppliers CRUD
app.post('/api/suppliers', async (req, res) => {
  try {
    const store = await readStore();
    const { name, contactPerson = '', phone = '', email = '', address = '', notes = '' } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name is required' });

    const newSupplier = {
      id: `sup-${Date.now()}`,
      name: String(name).trim(),
      contactPerson,
      phone,
      email,
      address,
      notes
    };
    store.suppliers.unshift(newSupplier);
    await writeStore(store);
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const store = await readStore();
    const idx = store.suppliers.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Supplier not found' });
    store.suppliers[idx] = { ...store.suppliers[idx], ...req.body };
    await writeStore(store);
    res.json(store.suppliers[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const store = await readStore();
    store.suppliers = store.suppliers.filter((s) => s.id !== req.params.id);
    await writeStore(store);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sales / POS Checkout
app.post('/api/sales', async (req, res) => {
  try {
    const store = await readStore();
    const {
      items = [],
      customerName = 'Walk-in Customer',
      paymentMethod = 'Cash',
      discount = 0,
      note = ''
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sale must contain at least one item.' });
    }

    // Validate stock first
    for (const item of items) {
      const product = store.products.find((p) => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name || item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }
    }

    const saleId = `SALE-${1000 + store.sales.length + 1}`;
    const nowIso = new Date().toISOString();
    let subtotal = 0;
    let totalCost = 0;

    const processedItems = items.map((item) => {
      const product = store.products.find((p) => p.id === item.productId);
      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice ?? product.sellingPrice);
      const unitCost = Number(product.costPrice);
      const lineTotal = +(qty * unitPrice).toFixed(2);
      const lineCost = +(qty * unitCost).toFixed(2);
      const lineProfit = +(lineTotal - lineCost).toFixed(2);

      subtotal += lineTotal;
      totalCost += lineCost;

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
        note: `POS Sale (${customerName})`,
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

    const discountAmt = Math.max(0, Number(discount) || 0);
    const total = Math.max(0, +(subtotal - discountAmt).toFixed(2));
    const profit = +(total - totalCost).toFixed(2);

    const newSale = {
      id: saleId,
      createdAt: nowIso,
      customerName: customerName.trim() || 'Walk-in Customer',
      paymentMethod,
      discount: discountAmt,
      subtotal: +subtotal.toFixed(2),
      total,
      totalCost: +totalCost.toFixed(2),
      profit,
      note,
      status: 'completed',
      items: processedItems
    };

    store.sales.unshift(newSale);
    await writeStore(store);
    res.status(201).json(newSale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Void / Refund Sale
app.post('/api/sales/:id/void', async (req, res) => {
  try {
    const store = await readStore();
    const sale = store.sales.find((s) => s.id === req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    if (sale.status === 'voided') {
      return res.status(400).json({ error: 'Sale is already voided' });
    }

    const nowIso = new Date().toISOString();
    sale.status = 'voided';
    sale.voidedAt = nowIso;

    for (const item of sale.items) {
      const product = store.products.find((p) => p.id === item.productId);
      if (product) {
        const prevStock = product.stock;
        product.stock = prevStock + Number(item.quantity);
        product.updatedAt = nowIso;

        store.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'sale_void',
          quantityChange: Number(item.quantity),
          previousStock: prevStock,
          newStock: product.stock,
          reference: sale.id,
          note: `Voided Sale ${sale.id}`,
          createdAt: nowIso
        });
      }
    }

    await writeStore(store);
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Purchase Orders
app.post('/api/purchase-orders', async (req, res) => {
  try {
    const store = await readStore();
    const {
      supplierId,
      expectedDate = '',
      notes = '',
      receiveImmediately = false,
      items = []
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Purchase order must include at least one product.' });
    }

    const supplier = store.suppliers.find((s) => s.id === supplierId);
    const poId = `PO-${2000 + store.purchaseOrders.length + 1}`;
    const nowIso = new Date().toISOString();

    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const product = store.products.find((p) => p.id === item.productId);
      const qty = Number(item.quantity) || 1;
      const unitCost = Number(item.unitCost ?? product?.costPrice ?? 0);
      const lineTotal = +(qty * unitCost).toFixed(2);
      totalAmount += lineTotal;

      return {
        productId: item.productId,
        name: product ? product.name : item.name,
        sku: product ? product.sku : item.sku,
        quantity: qty,
        unitCost,
        lineTotal
      };
    });

    const newPo = {
      id: poId,
      supplierId: supplierId || '',
      supplierName: supplier ? supplier.name : 'Direct Restock',
      status: receiveImmediately ? 'received' : 'ordered',
      createdAt: nowIso,
      receivedAt: receiveImmediately ? nowIso : undefined,
      expectedDate,
      notes,
      totalAmount: +totalAmount.toFixed(2),
      items: processedItems
    };

    if (receiveImmediately) {
      for (const item of processedItems) {
        const product = store.products.find((p) => p.id === item.productId);
        if (product) {
          const prevStock = product.stock;
          product.stock = prevStock + item.quantity;
          if (item.unitCost > 0) product.costPrice = item.unitCost;
          product.updatedAt = nowIso;

          store.stockMovements.unshift({
            id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            type: 'po_receive',
            quantityChange: item.quantity,
            previousStock: prevStock,
            newStock: product.stock,
            reference: poId,
            note: `Received PO ${poId} (${newPo.supplierName})`,
            createdAt: nowIso
          });
        }
      }
    }

    store.purchaseOrders.unshift(newPo);
    await writeStore(store);
    res.status(201).json(newPo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Receive Pending Purchase Order
app.post('/api/purchase-orders/:id/receive', async (req, res) => {
  try {
    const store = await readStore();
    const po = store.purchaseOrders.find((p) => p.id === req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    if (po.status === 'received') {
      return res.status(400).json({ error: 'Purchase order already received' });
    }

    const nowIso = new Date().toISOString();
    po.status = 'received';
    po.receivedAt = nowIso;

    for (const item of po.items) {
      const product = store.products.find((p) => p.id === item.productId);
      if (product) {
        const prevStock = product.stock;
        product.stock = prevStock + Number(item.quantity);
        if (Number(item.unitCost) > 0) {
          product.costPrice = Number(item.unitCost);
        }
        product.updatedAt = nowIso;

        store.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'po_receive',
          quantityChange: Number(item.quantity),
          previousStock: prevStock,
          newStock: product.stock,
          reference: po.id,
          note: `Received PO ${po.id} (${po.supplierName})`,
          createdAt: nowIso
        });
      }
    }

    await writeStore(store);
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel Purchase Order
app.post('/api/purchase-orders/:id/cancel', async (req, res) => {
  try {
    const store = await readStore();
    const po = store.purchaseOrders.find((p) => p.id === req.params.id);
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    if (po.status === 'received') {
      return res.status(400).json({ error: 'Cannot cancel an already received purchase order' });
    }
    po.status = 'cancelled';
    await writeStore(store);
    res.json(po);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backup Import & Reset Demo Data
app.post('/api/import', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !Array.isArray(data.products)) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }
    await writeStore(data);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset-demo', async (req, res) => {
  try {
    const seed = createInitialSeedData();
    await writeStore(seed);
    res.json(seed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Frontend Build in Production (Railway / Full-stack mode)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Shop3 API Server running on http://localhost:${PORT}`);
  });
});

