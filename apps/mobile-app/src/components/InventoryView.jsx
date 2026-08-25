import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { notificationService } from '../lib/notificationService';
import { Package, RefreshCw, ShieldAlert, Sparkles, TrendingDown, ArrowUpRight } from 'lucide-react';

export default function InventoryView({ user }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeNotice, setRealtimeNotice] = useState(false);

  const fallbackDemoInventory = [
    { id: 'inv-1', item_name: 'Subsidized Rice', quantity_available: 480.50, unit: 'kg', unit_price: 3.00, updated_at: new Date().toISOString() },
    { id: 'inv-2', item_name: 'Wheat Flour (Atta)', quantity_available: 340.00, unit: 'kg', unit_price: 2.00, updated_at: new Date().toISOString() },
    { id: 'inv-3', item_name: 'Refined Sugar', quantity_available: 120.00, unit: 'kg', unit_price: 15.00, updated_at: new Date().toISOString() },
    { id: 'inv-4', item_name: 'Kerosene Oil', quantity_available: 195.00, unit: 'liters', unit_price: 25.00, updated_at: new Date().toISOString() },
  ];

  const fetchInventory = async (skipLoading = false) => {
    if (!skipLoading) setLoading(true);
    setError(null);
    try {
      // ALWAYS query live Supabase database even when logged in as Demo account!
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name', { ascending: true });

      if (fetchError || !data || data.length === 0) {
        setInventory((prev) => prev.length > 0 ? prev : fallbackDemoInventory);
      } else {
        setInventory(data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to sync live shop inventory.');
      setInventory((prev) => prev.length > 0 ? prev : fallbackDemoInventory);
    } finally {
      if (!skipLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    // 1. Subscribe to Supabase WebSocket Broadcast channel (Works across different ports & machines instantly!)
    const broadcastChannel = supabase.channel('smart-ration-global')
      .on('broadcast', { event: 'INVENTORY_UPDATE' }, (payload) => {
        const item = payload.payload;
        if (item) {
          console.log('⚡ Supabase WebSocket Stock Update received:', item);
          setRealtimeNotice(true);
          setInventory((current) => {
            const exists = current.some(i => i.item_name === item.item_name || i.id === item.id);
            return exists ? current.map(i => (i.item_name === item.item_name || i.id === item.id) ? { ...i, ...item } : i) : [...current, item];
          });
          setTimeout(() => setRealtimeNotice(false), 5000);
        }
      })
      .on('broadcast', { event: 'INVENTORY_ADD' }, (payload) => {
        const item = payload.payload;
        if (item) {
          console.log('✨ Supabase WebSocket New Commodity created:', item);
          setRealtimeNotice(true);
          setInventory((current) => {
            const exists = current.some(i => i.item_name === item.item_name || i.id === item.id);
            return exists ? current : [...current, item];
          });
          setTimeout(() => setRealtimeNotice(false), 5000);
        }
      })
      .subscribe();

    // 2. Subscribe to Supabase Postgres Table row changes
    const dbChannel = supabase
      .channel('public:inventory-changes-view')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('Supabase Realtime Postgres inventory change:', payload);
          setRealtimeNotice(true);
          fetchInventory(true);
          setTimeout(() => setRealtimeNotice(false), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(dbChannel);
    };
  }, [user]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-mono font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>LIVE SYNC CONNECTED</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Available Ration Inventory</span>
          </h2>
        </div>
        <button
          onClick={() => fetchInventory(false)}
          disabled={loading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold self-start sm:self-center text-xs py-2 px-4 rounded-xl flex items-center gap-2 transition-colors border border-gray-200"
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {realtimeNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center justify-between animate-bounce shadow-sm">
          <span className="font-bold font-mono">⚡ LIVE STOCK UPDATE: Shop Admin just adjusted commodity inventory!</span>
        </div>
      )}

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {inventory.map((item) => {
          const qty = parseFloat(item.quantity_available);
          const isOut = qty <= 0;
          const isLow = !isOut && qty < 50;
          const stockStatus = isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'In Stock');
          const badgeColor = isOut
            ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
            : (isLow ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-green-50 text-green-700 border border-green-200');

          return (
            <div key={item.id} className={`bg-white rounded-3xl p-6 shadow-sm relative overflow-hidden group border transition-all ${isOut ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:shadow-md'}`}>
              <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full blur-xl transition-all pointer-events-none ${isOut ? 'bg-red-100 group-hover:bg-red-200' : 'bg-blue-50 group-hover:bg-blue-100'}`} />

              <div className="flex items-start justify-between relative z-10">
                <div>
                  <h3 className={`text-xl font-bold transition-colors ${isOut ? 'text-red-500 group-hover:text-red-600' : 'text-gray-900 group-hover:text-blue-800'}`}>
                    {item.item_name}
                  </h3>
                  <span className="inline-block mt-1 text-xs text-gray-500 font-mono">
                    {isOut ? '❌ Temporarily Unavailable' : 'Subsidized Commodity'}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${badgeColor}`}>
                  {stockStatus}
                </span>
              </div>

              <div className="mt-6 flex items-baseline justify-between pt-4 border-t border-gray-100 relative z-10">
                <div>
                  <span className={`text-3xl font-extrabold tracking-tight font-mono transition-all duration-500 ${isOut ? 'text-red-500' : 'text-gray-900'}`}>
                    {Number(item.quantity_available).toFixed(1)}
                  </span>
                  <span className={`ml-1 text-sm font-semibold uppercase font-mono ${isOut ? 'text-red-500' : 'text-blue-600'}`}>
                    {item.unit}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5 font-mono">
                    Remaining Shop Capacity
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900 font-mono">
                    ₹{Number(item.unit_price).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 block">per {item.unit}</span>
                  <div className="text-[11px] text-green-600 font-semibold flex items-center justify-end gap-0.5 mt-0.5">
                    <span>Govt Subsidized</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
