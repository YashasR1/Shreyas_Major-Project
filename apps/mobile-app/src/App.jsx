import React, { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import LanguageSelectionScreen from './components/LanguageSelectionScreen';
import Dashboard from './components/Dashboard';
import InventoryView from './components/InventoryView';
import SlotBooking from './components/SlotBooking';
import NotificationToast from './components/NotificationToast';
import { notificationService } from './lib/notificationService';
import { supabase } from './lib/supabaseClient';
import { ShieldCheck, LayoutDashboard, Package, Calendar, LogOut, Smartphone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('smart_ration_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [languageSelected, setLanguageSelected] = useState(false);

  // Global subscriber for Supabase WebSockets & local BroadcastChannel to ensure alerts fire across all ports and tabs
  useEffect(() => {
    // 1. Supabase WebSocket Broadcasts (Bypasses port differences 5174 vs 5173!)
    const channel = supabase.channel('smart-ration-global')
      .on('broadcast', { event: 'INVENTORY_UPDATE' }, (data) => {
        const payload = data.payload;
        if (payload) {
          const isZero = parseFloat(payload.quantity_available) === 0;
          notificationService.sendAlert({
            type: 'inventory',
            title: isZero ? `⚠️ Out of Stock Notice: ${payload.item_name}` : `🌾 Live Stock Replenished: ${payload.item_name}`,
            body: isZero ? `Attention citizens: ${payload.item_name} is currently out of stock at your fair price distribution depot.` : `Shop admin updated commodity stock to ${payload.quantity_available} ${payload.unit || 'kg'} at fair price shop!`
          });
        }
      })
      .on('broadcast', { event: 'INVENTORY_ADD' }, (data) => {
        const payload = data.payload;
        if (payload) {
          notificationService.sendAlert({
            type: 'inventory',
            title: `✨ New Subsidized Commodity Added!`,
            body: `Fair Price Shop now offers "${payload.item_name}" at ₹${Number(payload.unit_price).toFixed(2)} per ${payload.unit || 'unit'}. Check Shop Stock to reserve!`
          });
        }
      })
      .on('broadcast', { event: 'BIOMETRICS_VERIFIED' }, (data) => {
        const payload = data.payload;
        if (payload) {
          notificationService.sendAlert({
            type: 'biometric',
            title: `🛡️ Facial Biometrics Verified!`,
            body: `Ration Card ${payload.ration_id || 'ID'} verified via 128-pt neural face encoding. Your monthly allotment is authorized for dispensing!`
          });
        }
      })
      .subscribe();

    // 2. Same-Origin Local Bus Backup
    let bus = null;
    if (typeof window !== 'undefined' && ('BroadcastChannel' in window)) {
      bus = new BroadcastChannel('smart_ration_sync_bus');
      bus.onmessage = (event) => {
        const { event: type, payload } = event.data || {};
        if (type === 'INVENTORY_UPDATE' && payload) {
          const isZero = parseFloat(payload.quantity_available) === 0;
          notificationService.sendAlert({
            type: 'inventory',
            title: isZero ? `⚠️ Out of Stock Notice: ${payload.item_name}` : `🌾 Live Stock Replenished: ${payload.item_name}`,
            body: isZero ? `Attention citizens: ${payload.item_name} is currently out of stock at your fair price distribution depot.` : `Shop admin updated commodity stock to ${payload.quantity_available} ${payload.unit || 'kg'} at fair price shop!`
          });
        } else if (type === 'INVENTORY_ADD' && payload) {
          notificationService.sendAlert({
            type: 'inventory',
            title: `✨ New Subsidized Commodity Added!`,
            body: `Fair Price Shop now offers "${payload.item_name}" at ₹${Number(payload.unit_price).toFixed(2)} per ${payload.unit || 'unit'}. Check Shop Stock to reserve!`
          });
        }
      };
    }

    return () => {
      supabase.removeChannel(channel);
      if (bus) bus.close();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smart_ration_active_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smart_ration_active_user');
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    if (!languageSelected) {
      return <LanguageSelectionScreen onLanguageSelect={(lang) => setLanguageSelected(true)} />;
    }
    return (
      <>
        <NotificationToast />
        <RegistrationForm onUserLogin={(user) => setCurrentUser(user)} />
      </>
    );
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-12 relative z-0">
      {/* Animated Deep Glassmorphism Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gray-50">
        <motion.div
          className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-blue-500/15 blur-[100px]"
          animate={{ x: [0, 50, 0], y: [0, 100, 0] }}
          transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-cyan-400/15 blur-[100px]"
          animate={{ x: [0, -50, 0], y: [0, -50, 0] }}
          transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
        />
      </div>

      <NotificationToast />
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-200 px-4 sm:px-8 py-3.5 transition-all shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200 shadow-sm">
              <Smartphone className="w-5 h-5 text-blue-700 font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight">
                Smart Ration App
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-gray-700">{currentUser.name}</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-200 text-blue-700">{currentUser.ration_id}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-2 text-xs rounded-xl bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all flex items-center gap-1.5 font-bold shadow-sm"
              title="Sign out of digital card"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 relative overflow-x-hidden pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full"
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                user={currentUser}
                onUserUpdated={(updated) => setCurrentUser(updated)}
                onNavigateToBookings={() => setActiveTab('bookings')}
              />
            )}
            {activeTab === 'inventory' && <InventoryView user={currentUser} />}
            {activeTab === 'bookings' && <SlotBooking user={currentUser} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Floating Navigation Tabs (Optimized for Mobile Web App Experience) */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-1.5 flex items-center gap-2 w-full max-w-sm px-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>My Card</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          <Package className="w-4 h-4" />
          <span>Shop Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Slots</span>
        </button>
      </nav>
    </div>
  );
}
