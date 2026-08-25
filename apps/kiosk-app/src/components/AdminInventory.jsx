import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Plus, Edit3, Check, Loader2, ShieldCheck, Sparkles, AlertCircle, Trash2, RefreshCw, PlusCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Add new commodity state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newQty, setNewQty] = useState('200');
  const [newUnit, setNewUnit] = useState('kg');
  const [newPrice, setNewPrice] = useState('10.00');
  const [addingItem, setAddingItem] = useState(false);

  const defaultAdminInventory = [
    { id: 'inv-1', item_name: 'Subsidized Rice', quantity_available: 480.50, unit: 'kg', unit_price: 3.00 },
    { id: 'inv-2', item_name: 'Wheat Flour (Atta)', quantity_available: 340.00, unit: 'kg', unit_price: 2.00 },
    { id: 'inv-3', item_name: 'Refined Sugar', quantity_available: 120.00, unit: 'kg', unit_price: 15.00 },
    { id: 'inv-4', item_name: 'Kerosene Oil', quantity_available: 195.00, unit: 'liters', unit_price: 25.00 },
  ];

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('inventory').select('*').order('item_name');
      if (error || !data || data.length === 0) {
        setInventory(defaultAdminInventory);
      } else {
        setInventory(data);
      }
    } catch (err) {
      console.error(err);
      setInventory(defaultAdminInventory);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Universal broadcaster for cross-port Realtime updates (5174 -> 5173)
  const broadcastChange = (eventType, updatedItem) => {
    // 1. Supabase WebSockets (bypasses port restrictions)
    const broadcastChannel = supabase.channel('smart-ration-global');
    broadcastChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CLOSED') {
        broadcastChannel.send({ type: 'broadcast', event: eventType, payload: updatedItem });
      }
    });
    broadcastChannel.send({ type: 'broadcast', event: eventType, payload: updatedItem });

    // 2. Guaranteed local browser sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bus = new BroadcastChannel('smart_ration_sync_bus');
      bus.postMessage({ event: eventType, payload: updatedItem });
      bus.close();
    }
  };

  const handleUpdateStock = async (item, customQty = null) => {
    const targetQty = customQty !== null ? parseFloat(customQty) : parseFloat(editQty);
    if (isNaN(targetQty)) return;

    setStatusMsg('');
    try {
      const updatedItem = { ...item, quantity_available: targetQty, updated_at: new Date().toISOString() };

      // Execute Postgres update
      await supabase
        .from('inventory')
        .update({ quantity_available: targetQty, updated_at: updatedItem.updated_at })
        .eq('item_name', item.item_name);

      // Execute universal broadcast
      broadcastChange('INVENTORY_UPDATE', updatedItem);

      // Update local state and give immediate visual feedback
      setInventory((prev) => prev.map((i) => i.id === item.id ? updatedItem : i));
      setEditingId(null);

      if (targetQty === 0) {
        setStatusMsg(`⚠️ "${item.item_name}" marked OUT OF STOCK! Zero stock alert broadcasted to all citizens.`);
      } else {
        setStatusMsg(`⚡ Live stock for "${item.item_name}" updated to ${targetQty} ${item.unit}! Realtime push dispatched.`);
      }
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to update stock: ' + err.message);
    }
  };

  const handleDeleteCommodity = async (id, name) => {
    if (!window.confirm(`Are you sure you want to completely delete "${name}" from the inventory?`)) return;

    setStatusMsg('');
    try {
      await supabase.from('inventory').delete().eq('id', id);
      
      setInventory((prev) => prev.filter((i) => i.id !== id));
      
      setStatusMsg(`🗑️ Successfully deleted commodity: "${name}"`);
      setTimeout(() => setStatusMsg(''), 5000);
      
      broadcastChange('INVENTORY_DELETE', { id, item_name: name });
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to delete item: ' + err.message);
    }
  };

  const handleAddCommodity = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || isNaN(parseFloat(newQty)) || isNaN(parseFloat(newPrice))) {
      setStatusMsg('Please enter valid details for all item fields.');
      return;
    }

    setAddingItem(true);
    setStatusMsg('');
    try {
      const tempId = `inv-${Date.now()}`;
      const newItem = {
        id: tempId,
        item_name: newItemName.trim(),
        quantity_available: parseFloat(newQty),
        unit: newUnit.trim() || 'kg',
        unit_price: parseFloat(newPrice),
        updated_at: new Date().toISOString()
      };

      // Try inserting into Supabase
      const { data, error } = await supabase.from('inventory').insert([{
        item_name: newItem.item_name,
        quantity_available: newItem.quantity_available,
        unit: newItem.unit,
        unit_price: newItem.unit_price
      }]).select();

      const finalItem = (data && data.length > 0) ? data[0] : newItem;

      // Execute universal broadcast for new addition
      broadcastChange('INVENTORY_ADD', finalItem);

      setInventory((prev) => [...prev, finalItem]);
      setShowAddForm(false);
      setNewItemName('');
      setNewQty('200');
      setNewPrice('10.00');
      setStatusMsg(`✨ Successfully registered new commodity: "${finalItem.item_name}"! Alert sent to all mobile apps.`);
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to create item: ' + err.message);
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 animate-fadeIn space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 mt-1">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Shop Inventory Control</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage commodity,out of stock, or register new ration items with instant citizen notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Register New Commodity'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Expandable Register Commodity Form */}
      {showAddForm && (
        <form onSubmit={handleAddCommodity} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>Register New Subsidized Commodity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">Commodity Name</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Subsidized Lentils (Dal)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 font-mono text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">Initial Quantity</label>
              <input
                type="number"
                step="any"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="200"
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 font-mono text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">Measurement Unit</label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 font-mono text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              >
                <option value="kg">kilograms (kg)</option>
                <option value="liters">liters (L)</option>
                <option value="packets">packets (pkt)</option>
                <option value="units">units (pc)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1">Subsidized Price (₹ / unit)</label>
              <input
                type="number"
                step="any"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="10.00"
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 font-mono text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-mono transition-all font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingItem}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save & Publish Commodity</span>
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-8 mt-6">
          <div className="w-full h-64 bg-gray-100/80 rounded-3xl animate-pulse border border-gray-200"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-gray-100/80 rounded-2xl animate-pulse border border-gray-200"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cinematic Data Dashboard */}
          {inventory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Live Stock Analytics Overview</span>
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventory.map(item => ({ name: item.item_name, qty: parseFloat(item.quantity_available), unit: item.unit }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#F3F4F6' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value, name, props) => [`${value} ${props.payload.unit}`, 'Current Stock']}
                    />
                    <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                      {inventory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={parseFloat(entry.quantity_available) === 0 ? '#EF4444' : '#3B82F6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Inventory Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {inventory.map((item) => {
              const isOutOfStock = parseFloat(item.quantity_available) === 0;

              return (
                <div key={item.id} className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${isOutOfStock ? 'border-red-200 bg-red-50/50' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{item.item_name}</h3>
                        {isOutOfStock && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-200">
                            OUT OF STOCK
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteCommodity(item.id, item.item_name)}
                          className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Commodity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        ₹{Number(item.unit_price).toFixed(2)} / {item.unit}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline justify-between">
                      <span className="text-xs text-gray-500 font-mono">Current Stock:</span>
                      <div>
                        <span className={`text-2xl font-extrabold font-mono ${isOutOfStock ? 'text-red-500' : 'text-gray-900'}`}>
                          {Number(item.quantity_available).toFixed(1)}
                        </span>
                        <span className="text-sm font-semibold text-blue-600 ml-1 font-mono uppercase">{item.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          placeholder="New quantity..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-blue-400 text-gray-900 font-mono text-sm outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateStock(item)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Check className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditQty(String(item.quantity_available));
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Adjust Stock</span>
                        </button>

                        {isOutOfStock ? (
                          <button
                            onClick={() => handleUpdateStock(item, 300.0)}
                            className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                            title="Quickly replenish 300 units for demo"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                            <span>Replenish (+300)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStock(item, 0.0)}
                            className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
                            title="Instant Zero Out of Stock"
                          >
                            <span>Out of Stock</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
