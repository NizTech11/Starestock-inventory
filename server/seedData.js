export function createInitialSeedData() {
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

  const categories = [
    { id: 'cat-1', name: 'Beverages & Drinks', color: '#3b82f6', description: 'Soft drinks, bottled water, juices, energy drinks' },
    { id: 'cat-2', name: 'Groceries & Staples', color: '#10b981', description: 'Rice, cooking oil, pasta, canned goods, spices' },
    { id: 'cat-3', name: 'Snacks & Confectionery', color: '#f59e0b', description: 'Biscuits, chips, chocolates, nuts' },
    { id: 'cat-4', name: 'Household & Cleaning', color: '#8b5cf6', description: 'Detergents, soaps, tissues, toiletries' },
    { id: 'cat-5', name: 'Dairy & Bakery', color: '#ec4899', description: 'Milk, butter, bread, eggs, yogurt' }
  ];

  const suppliers = [
    {
      id: 'sup-1',
      name: 'Metro Wholesale Distributors',
      contactPerson: 'Daniel Mensah',
      phone: '+1 (555) 234-8910',
      email: 'orders@metrowholesale.com',
      address: '42 Industrial Pkwy, Warehouse B',
      notes: 'Delivers every Tuesday and Friday. Net 15 terms.'
    },
    {
      id: 'sup-2',
      name: 'FreshFoods & Beverage Co.',
      contactPerson: 'Sarah Osei',
      phone: '+1 (555) 876-5432',
      email: 'supply@freshfoodsco.com',
      address: '118 Market Avenue',
      notes: 'Primary beverage and dairy supplier.'
    },
    {
      id: 'sup-3',
      name: 'Prime Home & Care Supplies',
      contactPerson: 'Michael K.',
      phone: '+1 (555) 390-1122',
      email: 'sales@primehomecare.com',
      address: '9 Commerce Road',
      notes: 'Bulk discounts on cleaning and household items.'
    }
  ];

  const products = [
    {
      id: 'prod-1',
      sku: 'BEV-001',
      name: 'Sparkling Cola 500ml (Pack of 6)',
      categoryId: 'cat-1',
      supplierId: 'sup-2',
      costPrice: 3.60,
      sellingPrice: 5.50,
      stock: 42,
      minStock: 15,
      unit: 'pack',
      updatedAt: daysAgo(1)
    },
    {
      id: 'prod-2',
      sku: 'BEV-002',
      name: 'Pure Spring Water 1.5L',
      categoryId: 'cat-1',
      supplierId: 'sup-2',
      costPrice: 0.45,
      sellingPrice: 1.00,
      stock: 8,
      minStock: 24,
      unit: 'bottle',
      updatedAt: daysAgo(1)
    },
    {
      id: 'prod-3',
      sku: 'GRO-001',
      name: 'Jasmine Long Grain Rice 5kg',
      categoryId: 'cat-2',
      supplierId: 'sup-1',
      costPrice: 7.20,
      sellingPrice: 10.50,
      stock: 19,
      minStock: 10,
      unit: 'bag',
      updatedAt: daysAgo(2)
    },
    {
      id: 'prod-4',
      sku: 'GRO-002',
      name: 'Pure Vegetable Cooking Oil 2L',
      categoryId: 'cat-2',
      supplierId: 'sup-1',
      costPrice: 4.10,
      sellingPrice: 6.25,
      stock: 5,
      minStock: 12,
      unit: 'bottle',
      updatedAt: daysAgo(2)
    },
    {
      id: 'prod-5',
      sku: 'SNK-001',
      name: 'Butter Shortbread Biscuits 200g',
      categoryId: 'cat-3',
      supplierId: 'sup-1',
      costPrice: 1.10,
      sellingPrice: 2.00,
      stock: 54,
      minStock: 15,
      unit: 'box',
      updatedAt: daysAgo(3)
    },
    {
      id: 'prod-6',
      sku: 'SNK-002',
      name: 'Roasted Salted Cashews 150g',
      categoryId: 'cat-3',
      supplierId: 'sup-1',
      costPrice: 2.80,
      sellingPrice: 4.50,
      stock: 3,
      minStock: 10,
      unit: 'pouch',
      updatedAt: daysAgo(1)
    },
    {
      id: 'prod-7',
      sku: 'HHC-001',
      name: 'Multi-Purpose Liquid Detergent 1L',
      categoryId: 'cat-4',
      supplierId: 'sup-3',
      costPrice: 2.15,
      sellingPrice: 3.75,
      stock: 28,
      minStock: 10,
      unit: 'bottle',
      updatedAt: daysAgo(4)
    },
    {
      id: 'prod-8',
      sku: 'HHC-002',
      name: 'Antibacterial Bath Soap (3-Pack)',
      categoryId: 'cat-4',
      supplierId: 'sup-3',
      costPrice: 1.80,
      sellingPrice: 3.20,
      stock: 0,
      minStock: 8,
      unit: 'pack',
      updatedAt: daysAgo(1)
    },
    {
      id: 'prod-9',
      sku: 'DAI-001',
      name: 'Full Cream Evaporated Milk 400g',
      categoryId: 'cat-5',
      supplierId: 'sup-2',
      costPrice: 0.95,
      sellingPrice: 1.60,
      stock: 64,
      minStock: 20,
      unit: 'tin',
      updatedAt: daysAgo(2)
    },
    {
      id: 'prod-10',
      sku: 'DAI-002',
      name: 'Farm Fresh Crate of Eggs (30 pcs)',
      categoryId: 'cat-5',
      supplierId: 'sup-2',
      costPrice: 4.50,
      sellingPrice: 6.80,
      stock: 6,
      minStock: 8,
      unit: 'crate',
      updatedAt: daysAgo(1)
    }
  ];

  const sales = [
    {
      id: 'SALE-1001',
      createdAt: daysAgo(4),
      customerName: 'Walk-in Customer',
      paymentMethod: 'Cash',
      discount: 0,
      subtotal: 21.50,
      total: 21.50,
      totalCost: 14.40,
      profit: 7.10,
      status: 'completed',
      items: [
        { productId: 'prod-3', name: 'Jasmine Long Grain Rice 5kg', sku: 'GRO-001', quantity: 2, unitPrice: 10.50, unitCost: 7.20, lineTotal: 21.00, lineProfit: 6.60 },
        { productId: 'prod-2', name: 'Pure Spring Water 1.5L', sku: 'BEV-002', quantity: 0.5, unitPrice: 1.00, unitCost: 0.45, lineTotal: 0.50, lineProfit: 0.50 }
      ]
    },
    {
      id: 'SALE-1002',
      createdAt: daysAgo(3),
      customerName: 'Grace A.',
      paymentMethod: 'Mobile Money',
      discount: 1.00,
      subtotal: 24.55,
      total: 23.55,
      totalCost: 15.10,
      profit: 8.45,
      status: 'completed',
      items: [
        { productId: 'prod-1', name: 'Sparkling Cola 500ml (Pack of 6)', sku: 'BEV-001', quantity: 2, unitPrice: 5.50, unitCost: 3.60, lineTotal: 11.00, lineProfit: 3.80 },
        { productId: 'prod-4', name: 'Pure Vegetable Cooking Oil 2L', sku: 'GRO-002', quantity: 1, unitPrice: 6.25, unitCost: 4.10, lineTotal: 6.25, lineProfit: 2.15 },
        { productId: 'prod-7', name: 'Multi-Purpose Liquid Detergent 1L', sku: 'HHC-001', quantity: 1, unitPrice: 3.75, unitCost: 2.15, lineTotal: 3.75, lineProfit: 1.60 },
        { productId: 'prod-9', name: 'Full Cream Evaporated Milk 400g', sku: 'DAI-001', quantity: 2, unitPrice: 1.60, unitCost: 0.95, lineTotal: 3.20, lineProfit: 1.30 }
      ]
    },
    {
      id: 'SALE-1003',
      createdAt: daysAgo(2),
      customerName: 'Walk-in Customer',
      paymentMethod: 'Card',
      discount: 0,
      subtotal: 19.60,
      total: 19.60,
      totalCost: 12.60,
      profit: 7.00,
      status: 'completed',
      items: [
        { productId: 'prod-10', name: 'Farm Fresh Crate of Eggs (30 pcs)', sku: 'DAI-002', quantity: 2, unitPrice: 6.80, unitCost: 4.50, lineTotal: 13.60, lineProfit: 4.60 },
        { productId: 'prod-5', name: 'Butter Shortbread Biscuits 200g', sku: 'SNK-001', quantity: 3, unitPrice: 2.00, unitCost: 1.10, lineTotal: 6.00, lineProfit: 2.70 }
      ]
    },
    {
      id: 'SALE-1004',
      createdAt: daysAgo(1),
      customerName: 'Kwame Boateng',
      paymentMethod: 'Cash',
      discount: 0,
      subtotal: 30.00,
      total: 30.00,
      totalCost: 19.30,
      profit: 10.70,
      status: 'completed',
      items: [
        { productId: 'prod-3', name: 'Jasmine Long Grain Rice 5kg', sku: 'GRO-001', quantity: 1, unitPrice: 10.50, unitCost: 7.20, lineTotal: 10.50, lineProfit: 3.30 },
        { productId: 'prod-6', name: 'Roasted Salted Cashews 150g', sku: 'SNK-002', quantity: 2, unitPrice: 4.50, unitCost: 2.80, lineTotal: 9.00, lineProfit: 3.40 },
        { productId: 'prod-1', name: 'Sparkling Cola 500ml (Pack of 6)', sku: 'BEV-001', quantity: 1, unitPrice: 5.50, unitCost: 3.60, lineTotal: 5.50, lineProfit: 1.90 },
        { productId: 'prod-2', name: 'Pure Spring Water 1.5L', sku: 'BEV-002', quantity: 5, unitPrice: 1.00, unitCost: 0.45, lineTotal: 5.00, lineProfit: 2.75 }
      ]
    },
    {
      id: 'SALE-1005',
      createdAt: daysAgo(0.1),
      customerName: 'Walk-in Customer',
      paymentMethod: 'Mobile Money',
      discount: 0,
      subtotal: 15.85,
      total: 15.85,
      totalCost: 9.95,
      profit: 5.90,
      status: 'completed',
      items: [
        { productId: 'prod-4', name: 'Pure Vegetable Cooking Oil 2L', sku: 'GRO-002', quantity: 1, unitPrice: 6.25, unitCost: 4.10, lineTotal: 6.25, lineProfit: 2.15 },
        { productId: 'prod-9', name: 'Full Cream Evaporated Milk 400g', sku: 'DAI-001', quantity: 6, unitPrice: 1.60, unitCost: 0.95, lineTotal: 9.60, lineProfit: 3.90 }
      ]
    }
  ];

  const purchaseOrders = [
    {
      id: 'PO-2001',
      supplierId: 'sup-2',
      supplierName: 'FreshFoods & Beverage Co.',
      status: 'ordered',
      createdAt: daysAgo(1),
      expectedDate: new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0],
      notes: 'Urgent restock for bottled water and eggs',
      totalAmount: 69.00,
      items: [
        { productId: 'prod-2', name: 'Pure Spring Water 1.5L', sku: 'BEV-002', quantity: 60, unitCost: 0.45, lineTotal: 27.00 },
        { productId: 'prod-10', name: 'Farm Fresh Crate of Eggs (30 pcs)', sku: 'DAI-002', quantity: 10, unitCost: 4.20, lineTotal: 42.00 }
      ]
    },
    {
      id: 'PO-2002',
      supplierId: 'sup-3',
      supplierName: 'Prime Home & Care Supplies',
      status: 'ordered',
      createdAt: daysAgo(2),
      expectedDate: new Date(now.getTime() + 1 * 86400000).toISOString().split('T')[0],
      notes: 'Restock out-of-stock bath soap',
      totalAmount: 43.20,
      items: [
        { productId: 'prod-8', name: 'Antibacterial Bath Soap (3-Pack)', sku: 'HHC-002', quantity: 24, unitCost: 1.80, lineTotal: 43.20 }
      ]
    },
    {
      id: 'PO-2000',
      supplierId: 'sup-1',
      supplierName: 'Metro Wholesale Distributors',
      status: 'received',
      createdAt: daysAgo(6),
      receivedAt: daysAgo(4),
      expectedDate: daysAgo(4).split('T')[0],
      notes: 'Monthly staple restock',
      totalAmount: 144.00,
      items: [
        { productId: 'prod-3', name: 'Jasmine Long Grain Rice 5kg', sku: 'GRO-001', quantity: 20, unitCost: 7.20, lineTotal: 144.00 }
      ]
    }
  ];

  const stockMovements = [
    {
      id: 'mov-1',
      productId: 'prod-3',
      productName: 'Jasmine Long Grain Rice 5kg',
      sku: 'GRO-001',
      type: 'po_receive',
      quantityChange: 20,
      previousStock: 2,
      newStock: 22,
      reference: 'PO-2000',
      note: 'Received Purchase Order PO-2000',
      createdAt: daysAgo(4)
    },
    {
      id: 'mov-2',
      productId: 'prod-3',
      productName: 'Jasmine Long Grain Rice 5kg',
      sku: 'GRO-001',
      type: 'sale',
      quantityChange: -2,
      previousStock: 22,
      newStock: 20,
      reference: 'SALE-1001',
      note: 'POS Sale SALE-1001',
      createdAt: daysAgo(4)
    },
    {
      id: 'mov-3',
      productId: 'prod-4',
      productName: 'Pure Vegetable Cooking Oil 2L',
      sku: 'GRO-002',
      type: 'sale',
      quantityChange: -1,
      previousStock: 6,
      newStock: 5,
      reference: 'SALE-1005',
      note: 'POS Sale SALE-1005',
      createdAt: daysAgo(0.1)
    }
  ];

  const settings = {
    shopName: 'Shop3 Mini-Mart & General Store',
    ownerName: 'Shop Owner',
    currency: 'GH₵ ',
    phone: '+233 24 000 0000',
    address: 'Shop 3, Main Street Commercial Plaza',
    receiptFooter: 'Thank you for shopping at Shop3! Goods sold in good condition are not returnable.'
  };

  return {
    settings,
    categories,
    suppliers,
    products,
    sales,
    purchaseOrders,
    stockMovements
  };
}

