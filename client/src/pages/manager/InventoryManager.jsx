import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Package,
  AlertTriangle,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  History,
  TrendingUp,
  X,
  CheckCircle2,
  Boxes
} from 'lucide-react';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Grains & Cereals', value: 'grain' },
  { label: 'Vegetables', value: 'vegetable' },
  { label: 'Pulses & Legumes', value: 'pulse' },
  { label: 'Cooking Oil & Ghee', value: 'oil' },
  { label: 'Dairy & Milk', value: 'dairy' },
  { label: 'Spices & Condiments', value: 'spice' },
  { label: 'Meat & Eggs', value: 'meat_egg' },
  { label: 'Other Sundries', value: 'other' }
];

export const InventoryManager = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'transactions'
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItemForTx, setSelectedItemForTx] = useState(null);

  // New Item Form State
  const [newItemData, setNewItemData] = useState({
    name: '',
    category: 'grain',
    unit: 'kg',
    minimumThreshold: 10,
    currentStock: 0,
    unitCostEstimate: 0
  });

  // Transaction Form State
  const [txData, setTxData] = useState({
    itemId: '',
    type: 'purchase',
    quantity: '',
    unitPrice: '',
    vendor: '',
    invoiceNumber: '',
    remarks: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (lowStockFilter) params.append('lowStockOnly', 'true');

      const [itemsRes, alertsRes] = await Promise.all([
        api.get(`/inventory?${params.toString()}`),
        api.get('/inventory/alerts')
      ]);

      if (itemsRes.success) {
        setItems(itemsRes.data?.items || []);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.data?.alerts || []);
      }
    } catch (err) {
      toast.error('Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/inventory/transactions?limit=40');
      if (res.success) {
        setTransactions(res.data?.transactions || []);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
    } else {
      fetchTransactions();
    }
  }, [activeTab, selectedCategory, searchQuery, lowStockFilter]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemData.name.trim()) {
      toast.error('Item name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/inventory', newItemData);
      if (res.success) {
        toast.success(`'${newItemData.name}' added to inventory.`);
        setShowAddItemModal(false);
        setNewItemData({
          name: '',
          category: 'grain',
          unit: 'kg',
          minimumThreshold: 10,
          currentStock: 0,
          unitCostEstimate: 0
        });
        fetchInventory();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create inventory item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTransaction = (item = null, defaultType = 'purchase') => {
    setSelectedItemForTx(item);
    setTxData({
      itemId: item ? item._id : (items[0]?._id || ''),
      type: defaultType,
      quantity: '',
      unitPrice: item ? item.unitCostEstimate : '',
      vendor: '',
      invoiceNumber: '',
      remarks: ''
    });
    setShowTransactionModal(true);
  };

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    if (!txData.itemId || !txData.quantity || Number(txData.quantity) <= 0) {
      toast.error('Please select an item and provide a valid quantity.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/inventory/transactions', {
        ...txData,
        quantity: Number(txData.quantity),
        unitPrice: Number(txData.unitPrice) || 0
      });

      if (res.success) {
        toast.success('Stock movement recorded successfully.');
        setShowTransactionModal(false);
        fetchInventory();
        if (activeTab === 'transactions') fetchTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record stock movement.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalEstimatedValue = items.reduce(
    (acc, it) => acc + (it.currentStock || 0) * (it.unitCostEstimate || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-emerald-400" />
            Mess Inventory & Raw Stock Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time grain, vegetable and dairy reserves, automate low-stock procurement alerts, and record kitchen consumption.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenTransaction(null, 'purchase')}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <ArrowDownRight className="w-4 h-4" />
            Stock In / Purchase
          </button>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            New Item
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Low-Stock Replenishment Alert ({alerts.length} Items Below Threshold)
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              The following raw materials are critically low: {alerts.map((a) => `${a.name} (${a.currentStock} ${a.unit})`).join(', ')}.
            </p>
          </div>
          <button
            onClick={() => {
              setLowStockFilter(true);
              setActiveTab('inventory');
            }}
            className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-[11px] rounded-lg shrink-0 self-center hover:bg-amber-400 transition"
          >
            View Low Stock
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catalogued Items</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{items.length}</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Active food stock lines</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Low Stock Warnings</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{alerts.length}</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">At or below reorder level</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimated Valuation</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{Math.round(totalEstimatedValue).toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Approx. on-hand capital</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Status</span>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
            {alerts.length === 0 ? 'Optimal' : 'Needs Action'}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Supply pipeline condition</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Stock Levels ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Movement Audit Logs
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search item name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 pl-9 outline-none shadow-sm focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 outline-none shadow-sm focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLowStockFilter(!lowStockFilter)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${
                  lowStockFilter
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 shadow-sm hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Low Stock Only
              </button>

              <button
                onClick={fetchInventory}
                className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-10 text-center shadow-sm">
              <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">No Inventory Items Found</h3>
              <p className="text-xs text-slate-500 mt-1">Add items or reset your search filters.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700/80">
                    <tr>
                      <th className="px-4 py-3">Item Details</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Current Stock</th>
                      <th className="px-4 py-3">Low-Stock Alert Level</th>
                      <th className="px-4 py-3">Est. Unit Price</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {items.map((item) => {
                      const isLowStock = item.currentStock <= item.minimumThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                            {item.lastRestockedAt && (
                              <div className="text-[10px] text-slate-500">
                                Restocked {new Date(item.lastRestockedAt).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 capitalize text-slate-500 dark:text-slate-400">
                            {item.category?.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-black text-sm ${
                                isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                            {isLowStock && (
                              <span className="ml-2 inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                Low
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                            {item.minimumThreshold} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            {item.unitCostEstimate > 0 ? `₹${item.unitCostEstimate}/${item.unit}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenTransaction(item, 'consumption')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-300 font-bold text-[11px] rounded-lg transition"
                                title="Record Kitchen Usage"
                              >
                                Consume
                              </button>
                              <button
                                onClick={() => handleOpenTransaction(item, 'purchase')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition"
                                title="Record Restock / Purchase"
                              >
                                Restock
                              </button>
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
        </>
      ) : (
        /* Transactions Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700/80">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Qty Changed</th>
                  <th className="px-4 py-3">New Balance</th>
                  <th className="px-4 py-3">Recorded By</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500 italic">
                      No stock transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(tx.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-200">{tx.item?.name || 'Item'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            tx.type === 'purchase'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : tx.type === 'consumption'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                        {tx.type === 'purchase' ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.item?.unit}
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900 dark:text-slate-200">
                        {tx.newStock} {tx.item?.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {tx.performedBy ? `${tx.performedBy.firstName} (${tx.performedBy.role})` : 'System'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 italic text-[11px]">
                        {tx.remarks || tx.vendor || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add New Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddItemModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Add Inventory Item
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Register a new raw material or kitchen commodity.</p>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Toor Dal, Mustard Oil"
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure</label>
                  <select
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="litre">litre (Litre)</option>
                    <option value="pieces">pieces</option>
                    <option value="packets">packets</option>
                    <option value="gram">gram</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemData.minimumThreshold}
                    onChange={(e) => setNewItemData({ ...newItemData, minimumThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newItemData.unitCostEstimate}
                    onChange={(e) => setNewItemData({ ...newItemData, unitCostEstimate: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Stock Transaction */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowTransactionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-400" />
              Record Stock Movement
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Log inflow procurement, daily kitchen consumption or inventory count adjustments.
            </p>

            <form onSubmit={handleRecordTransaction} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Item *</label>
                <select
                  required
                  value={txData.itemId}
                  onChange={(e) => {
                    const it = items.find((x) => x._id === e.target.value);
                    setSelectedItemForTx(it);
                    setTxData({ ...txData, itemId: e.target.value, unitPrice: it?.unitCostEstimate || '' });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                >
                  {items.map((it) => (
                    <option key={it._id} value={it._id}>
                      {it.name} (Current: {it.currentStock} {it.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Movement Type</label>
                  <select
                    value={txData.type}
                    onChange={(e) => setTxData({ ...txData, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  >
                    <option value="purchase">Purchase / Restock In (+)</option>
                    <option value="consumption">Kitchen Consumption (-)</option>
                    <option value="adjustment">Physical Audit Count (=)</option>
                    <option value="spoilage_wastage">Spoilage / Loss (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quantity ({selectedItemForTx?.unit || 'unit'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 25"
                    value={txData.quantity}
                    onChange={(e) => setTxData({ ...txData, quantity: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {txData.type === 'purchase' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Unit Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 45"
                      value={txData.unitPrice}
                      onChange={(e) => setTxData({ ...txData, unitPrice: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor / Supplier</label>
                    <input
                      type="text"
                      placeholder="e.g. Metro Wholesale"
                      value={txData.vendor}
                      onChange={(e) => setTxData({ ...txData, vendor: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Remarks / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Morning breakfast batch preparation"
                  value={txData.remarks}
                  onChange={(e) => setTxData({ ...txData, remarks: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Commit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;

