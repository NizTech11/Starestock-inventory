import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  Menu,
  X,
  Box,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { api } from './api.js';
import DashboardTab from './components/DashboardTab.jsx';
import InventoryTab from './components/InventoryTab.jsx';
import PosTab from './components/PosTab.jsx';
import OrdersTab from './components/OrdersTab.jsx';
import SuppliersTab from './components/SuppliersTab.jsx';
import ReportsTab from './components/ReportsTab.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preselectedRestockProduct, setPreselectedRestockProduct] = useState(null);

  // Shell UI states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickUserName, setQuickUserName] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    shopName: '',
    ownerName: 'Shop Owner',
    currency: 'GH₵ ',
    phone: '',
    address: '',
    receiptFooter: ''
  });

  const loadState = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getState();
      setState(data);
      if (data?.settings) {
        setSettingsForm({
          shopName: data.settings.shopName || 'Shop3 Mini-Mart',
          ownerName: data.settings.ownerName || 'Shop Owner',
          currency: data.settings.currency || 'GH₵ ',
          phone: data.settings.phone || '',
          address: data.settings.address || '',
          receiptFooter: data.settings.receiptFooter || ''
        });
        setQuickUserName(data.settings.ownerName || 'Shop Owner');
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const handleQuickRestock = (product) => {
    setPreselectedRestockProduct(product);
    setActiveTab('orders');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      await loadState();
      setSettingsOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickUserSave = async (e) => {
    e.preventDefault();
    const trimmed = quickUserName.trim();
    if (!trimmed) return;
    try {
      await api.updateSettings({ ...state?.settings, ownerName: trimmed });
      await loadState();
      setUserMenuOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-[#0F2D52] animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Loading Shop3 Workspace...</p>
        </div>
      </div>
    );
  }

  const currency = state?.settings?.currency || 'GH₵ ';
  const shopName = state?.settings?.shopName || 'Shop3 Mini-Mart';
  const shopInitial = shopName.trim().charAt(0).toUpperCase() || 'S';
  const ownerName = state?.settings?.ownerName || 'Shop Owner';
  const ownerInitials = ownerName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || 'U';

  const lowStockCount = (state?.products || []).filter((p) => p.stock <= p.minStock).length;
  const pendingPoCount = (state?.purchaseOrders || []).filter(
    (po) => po.status === 'ordered'
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : null
    },
    {
      id: 'pos',
      label: 'Sales & POS',
      icon: ShoppingCart
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: Truck,
      badge: pendingPoCount > 0 ? pendingPoCount : null
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Truck
    },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  const activeNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  // Global quick search matches
  const searchMatches =
    globalSearch.trim().length > 1
      ? (state?.products || [])
        .filter(
          (p) =>
            p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(globalSearch.toLowerCase())
        )
        .slice(0, 5)
      : [];

  return (
    <div className="min-h-screen flex bg-[#F5F7FA] text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
        />
      )}

      {/* Left Dark Navy Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0B2239] text-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#8CE02C] flex items-center justify-center text-[#0B2239] shadow-xs">
                <Box className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                StareStock
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace Switcher Card */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full p-2.5 rounded-xl bg-[#15314F] hover:bg-[#1A3B5E] border border-white/5 flex items-center justify-between text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#8CE02C] text-[#0B2239] font-extrabold text-sm flex items-center justify-center shrink-0">
                {shopInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="marquee-container text-xs font-semibold text-white">
                  {shopName.length > 18 ? (
                    <div className="marquee-track">
                      <span>{shopName}</span>
                      <span aria-hidden="true">{shopName}</span>
                    </div>
                  ) : (
                    <span>{shopName}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {state?.storageMode === 'postgresql'
                    ? 'Railway Cloud DB'
                    : 'Local Workspace'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {/* Navigation Menu */}
          <div className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition cursor-pointer ${isActive
                      ? 'bg-[#1B3A5C] text-white font-semibold shadow-2xs'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-[#8CE02C]' : 'text-slate-400'
                        }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-[#234970] text-sky-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Bottom Insight Card & Utilities */}
        <div className="p-4 space-y-3 border-t border-white/5">
          <div className="p-3.5 rounded-xl bg-[#132C47] border border-white/5 space-y-2">
            <BarChart3 className="w-4 h-4 text-slate-300" />
            <div className="text-xs font-semibold text-white">
              A little more insight.
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Turn inventory data into your next best decision.
            </p>
            <button
              onClick={() => {
                setActiveTab('reports');
                setMobileMenuOpen(false);
              }}
              className="text-xs font-semibold text-[#8CE02C] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Explore reports <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 text-xs">
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Settings
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              Help & support
            </button>
          </div>

          <div className="px-2.5 pt-1 text-[10px] text-slate-500">
            StareStock © 2026
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top White Bar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-7 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-slate-400">Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">{activeNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative hidden sm:block w-64 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search anything..."
                className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                ⌘K
              </span>

              {searchMatches.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                  {searchMatches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setGlobalSearch('');
                        setActiveTab('inventory');
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {p.sku} · {p.stock} {p.unit}
                        </div>
                      </div>
                      <span className="font-semibold text-slate-700">
                        {currency}{p.sellingPrice.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('inventory')}
              title={
                lowStockCount > 0
                  ? `${lowStockCount} items need restocking`
                  : 'All stock healthy'
              }
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setQuickUserName(ownerName);
                  setUserMenuOpen((v) => !v);
                }}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#0F2D52] text-white text-xs font-bold flex items-center justify-center">
                  {ownerInitials}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-slate-700">
                  {ownerName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Current System User
                    </span>
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleQuickUserSave} className="space-y-2">
                    <input
                      type="text"
                      required
                      value={quickUserName}
                      onChange={(e) => setQuickUserName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Full settings
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold bg-[#0F2D52] hover:bg-[#163B6B] text-white rounded-lg cursor-pointer"
                      >
                        Update Name
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-7 mt-4 w-full">
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="underline font-semibold ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Active View Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-7 py-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              state={state}
              currency={currency}
              onNavigate={setActiveTab}
              onQuickRestock={handleQuickRestock}
              onOpenAddProduct={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              state={state}
              currency={currency}
              onCreateProduct={async (payload) => {
                try {
                  await api.createProduct(payload);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onUpdateProduct={async (id, payload) => {
                try {
                  await api.updateProduct(id, payload);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onDeleteProduct={async (id) => {
                try {
                  await api.deleteProduct(id);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onAdjustStock={async (id, payload) => {
                try {
                  await api.adjustStock(id, payload);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onCreateCategory={async (payload) => {
                try {
                  const created = await api.createCategory(payload);
                  await loadState();
                  return created;
                } catch (e) {
                  setError(e.message);
                }
              }}
              onDeleteCategory={async (id) => {
                try {
                  await api.deleteCategory(id);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
            />
          )}

          {activeTab === 'pos' && (
            <PosTab
              state={state}
              currency={currency}
              onCreateSale={async (payload) => {
                try {
                  const sale = await api.createSale(payload);
                  await loadState();
                  return sale;
                } catch (e) {
                  setError(e.message);
                  throw e;
                }
              }}
              onVoidSale={async (id) => {
                try {
                  await api.voidSale(id);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              state={state}
              currency={currency}
              preselectedProduct={preselectedRestockProduct}
              onClearPreselected={() => setPreselectedRestockProduct(null)}
              onCreatePurchaseOrder={async (payload) => {
                try {
                  await api.createPurchaseOrder(payload);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onReceivePurchaseOrder={async (id) => {
                try {
                  await api.receivePurchaseOrder(id);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onCancelPurchaseOrder={async (id) => {
                try {
                  await api.cancelPurchaseOrder(id);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersTab
              state={state}
              currency={currency}
              onNavigate={setActiveTab}
              onCreateSupplier={async (payload) => {
                try {
                  await api.createSupplier(payload);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onUpdateSupplier={async (id, payload) => {
                try {
                  await api.updateSupplier(id, payload);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onDeleteSupplier={async (id) => {
                try {
                  await api.deleteSupplier(id);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              state={state}
              currency={currency}
              onImportBackup={async (payload) => {
                try {
                  await api.importData(payload);
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
              onResetDemo={async () => {
                try {
                  await api.resetDemo();
                  await loadState();
                } catch (e) {
                  setError(e.message);
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Shop Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Shop3 Workspace Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name (System User / Cashier)
                </label>
                <input
                  required
                  type="text"
                  value={settingsForm.ownerName}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, ownerName: e.target.value })
                  }
                  placeholder="e.g. Kwame Mensah"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop Name
                  </label>
                  <input
                    required
                    type="text"
                    value={settingsForm.shopName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, shopName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency
                  </label>
                  <input
                    required
                    type="text"
                    value={settingsForm.currency}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, address: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt Footer Message
                </label>
                <input
                  type="text"
                  value={settingsForm.receiptFooter}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, receiptFooter: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] hover:bg-[#163B6B] rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Quick Guide: How StareStock Works</h3>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">1. Overview</strong>
                Watch your total stock value, stock health bar, 7-day movement chart, and low-stock watchlist.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">2. Sales & POS</strong>
                Tap items to ring up a customer, apply discounts, calculate change, and print receipts. Stock updates automatically.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="text-slate-900 block mb-0.5">3. Suppliers & Orders</strong>
                Create purchase orders for low-stock items and click <strong>Receive Stock</strong> when boxes arrive.
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D52] rounded-lg cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
