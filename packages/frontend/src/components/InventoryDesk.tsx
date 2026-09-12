import React, { useState, useEffect } from 'react';
import { ApiService } from '../api';
import { InventoryItem, InventoryTransactionItem } from '../types';
import {
  Package,
  Layers,
  TrendingDown,
  TrendingUp,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
} from 'lucide-react';

export const InventoryDesk: React.FC = () => {
  const [subTab, setSubTab] = useState<'items' | 'transactions'>('items');

  // Items
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<'STATIONERY' | 'UNIFORMS' | 'BOOKS' | 'LAB_EQUIPMENT' | 'SPORTS' | 'FURNITURE' | 'OTHER'>('STATIONERY');
  const [itemUnit, setItemUnit] = useState('PCS');
  const [itemQuantity, setItemQuantity] = useState(100);
  const [itemMinAlert, setItemMinAlert] = useState(20);

  // Transactions
  const [transactions, setTransactions] = useState<InventoryTransactionItem[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txItemId, setTxItemId] = useState('');
  const [txType, setTxType] = useState<'INWARD' | 'OUTWARD'>('INWARD');
  const [txQty, setTxQty] = useState(50);
  const [txPrice, setTxPrice] = useState(80);
  const [txParty, setTxParty] = useState('');
  const [txInvoice, setTxInvoice] = useState('');
  const [txNotes, setTxNotes] = useState('');

  const [search, setSearch] = useState('');

  const loadAll = async () => {
    try {
      setLoadingItems(true);
      setLoadingTx(true);
      const [iRes, tRes] = await Promise.all([
        ApiService.getInventoryItems(),
        ApiService.getInventoryTransactions(),
      ]);
      setItems(iRes.items || []);
      setTransactions(tRes.transactions || []);
    } catch (err: any) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoadingItems(false);
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createInventoryItem({
        name: itemName,
        category: itemCategory,
        unit: itemUnit,
        currentQuantity: itemQuantity,
        minimumAlertQuantity: itemMinAlert,
      });
      alert('✅ Inventory item registered!');
      setShowItemModal(false);
      setItemName('');
      loadAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txItemId || !txParty) {
      alert('Please select an item and enter vendor/recipient name.');
      return;
    }

    try {
      await ApiService.createInventoryTransaction({
        itemId: txItemId,
        transactionType: txType,
        quantity: txQty,
        unitPrice: txPrice,
        supplierOrRecipient: txParty,
        invoiceOrSlipNo: txInvoice,
        notes: txNotes,
      });
      alert(`✅ Stock ${txType.toLowerCase()} recorded successfully!`);
      setShowTxModal(false);
      setTxParty('');
      setTxInvoice('');
      setTxNotes('');
      loadAll();
    } catch (err: any) {
      alert('Transaction failed: ' + err.message);
    }
  };

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    it.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter((it) => it.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Package size={16} />
            <span>Store & Asset Management</span>
          </div>
          <h1 className="text-2xl font-black">Stock & Inventory Operations</h1>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            Track supplies, uniform stocks, science laboratory equipment, and process vendor purchases and department issuances with low-stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowItemModal(true)}
            className="bg-white text-emerald-950 hover:bg-emerald-50 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
          >
            <Plus size={16} />
            <span>Add Item</span>
          </button>
          <button
            onClick={() => setShowTxModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-black/10 flex items-center gap-2 shrink-0 transition"
          >
            <Layers size={16} />
            <span>Stock Movement</span>
          </button>
        </div>
      </div>

      {/* Subtabs & Low-stock badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              subTab === 'items'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package size={16} />
            <span>Inventory Items Catalog ({items.length})</span>
          </button>
          <button
            onClick={() => setSubTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              subTab === 'transactions'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers size={16} />
            <span>Inward / Outward Ledger ({transactions.length})</span>
          </button>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
            <AlertTriangle size={14} className="text-amber-600" />
            <span>{lowStockCount} Item{lowStockCount > 1 ? 's' : ''} on Low Stock Alert</span>
          </div>
        )}
      </div>

      {/* ================= 1. ITEMS CATALOG ================= */}
      {subTab === 'items' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search size={16} className="text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-medium focus:outline-none bg-transparent"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingItems ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading stock items...</div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No inventory items found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Min. Threshold</th>
                      <th className="py-3 px-4">Inventory Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredItems.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{it.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">
                            {it.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {it.unit}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm">
                          {it.currentQuantity} {it.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {it.minimumAlertQuantity} {it.unit}
                        </td>
                        <td className="py-3 px-4">
                          {it.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                              <AlertTriangle size={12} />
                              Low Stock Reorder
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 size={12} />
                              Sufficient Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 2. TRANSACTIONS LEDGER ================= */}
      {subTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loadingTx ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading transactions ledger...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No stock transactions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Movement</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Supplier / Recipient</th>
                    <th className="py-3 px-4">Invoice / Slip</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        {tx.transactionType === 'INWARD' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <ArrowDownLeft size={12} />
                            INWARD (Purchase)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                            <ArrowUpRight size={12} />
                            OUTWARD (Issued)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{tx.itemName}</div>
                        <div className="text-[10px] text-slate-400">{tx.category}</div>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">
                        {tx.quantity} {tx.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {tx.unitPrice ? `₹${tx.unitPrice}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {tx.supplierOrRecipient}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {tx.invoiceOrSlipNo || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {tx.creatorName || 'Accountant'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-emerald-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Register Inventory Item</h3>
              <button onClick={() => setShowItemModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Item Name *</label>
                <input required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Student School Diary 2026-27" className="w-full p-2 bg-slate-50 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Category</label>
                  <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value as any)} className="w-full p-2 bg-slate-50 border rounded-xl">
                    <option value="STATIONERY">Stationery</option>
                    <option value="UNIFORMS">Uniforms & Apparel</option>
                    <option value="BOOKS">Books & Notebooks</option>
                    <option value="LAB_EQUIPMENT">Science Lab Equipment</option>
                    <option value="SPORTS">Sports Equipment</option>
                    <option value="FURNITURE">Furniture & Fixtures</option>
                    <option value="OTHER">Other Goods</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Unit of Measure</label>
                  <select value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl">
                    <option value="PCS">Pieces (PCS)</option>
                    <option value="BOX">Boxes (BOX)</option>
                    <option value="SET">Sets (SET)</option>
                    <option value="KG">Kilograms (KG)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Initial Quantity</label>
                  <input type="number" value={itemQuantity} onChange={(e) => setItemQuantity(Number(e.target.value))} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Low-Stock Alert Level</label>
                  <input type="number" value={itemMinAlert} onChange={(e) => setItemMinAlert(Number(e.target.value))} className="w-full p-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-800 text-white rounded-xl font-bold shadow">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Movement Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-emerald-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-black">Record Stock Movement</h3>
              <button onClick={() => setShowTxModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRecordTransaction} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Transaction Movement *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('INWARD')}
                    className={`py-2 rounded-xl font-bold border flex items-center justify-center gap-1.5 ${
                      txType === 'INWARD' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ArrowDownLeft size={14} />
                    <span>INWARD (Purchase)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('OUTWARD')}
                    className={`py-2 rounded-xl font-bold border flex items-center justify-center gap-1.5 ${
                      txType === 'OUTWARD' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight size={14} />
                    <span>OUTWARD (Issue)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Select Item *</label>
                <select
                  required
                  value={txItemId}
                  onChange={(e) => setTxItemId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.currentQuantity} {it.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    value={txQty}
                    onChange={(e) => setTxQty(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={txPrice}
                    onChange={(e) => setTxPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {txType === 'INWARD' ? 'Supplier / Vendor *' : 'Issued To Department / Person *'}
                  </label>
                  <input
                    required
                    value={txParty}
                    onChange={(e) => setTxParty(e.target.value)}
                    placeholder={txType === 'INWARD' ? 'e.g. Apex Traders' : 'e.g. Science Department'}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Invoice / Issue Slip No</label>
                  <input
                    value={txInvoice}
                    onChange={(e) => setTxInvoice(e.target.value)}
                    placeholder="e.g. INV-2026-99"
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Remarks / Purpose</label>
                <textarea
                  rows={2}
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl resize-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setShowTxModal(false)} className="px-3 py-1.5 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-800 text-white rounded-xl font-bold shadow">Record Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
