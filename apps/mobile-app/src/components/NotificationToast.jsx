import React, { useState, useEffect } from 'react';
import { notificationService } from '../lib/notificationService';
import { Bell, ShieldCheck, Package, Calendar, Cpu, X, Sparkles } from 'lucide-react';

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Request permission silently when component mounts
    notificationService.requestPermission();

    const unsubscribe = notificationService.subscribe((newAlert) => {
      setToasts((prev) => [newAlert, ...prev].slice(0, 3)); // keep max 3 on screen

      // Auto-remove toast after 7 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== newAlert.id));
      }, 7000);
    });

    return () => unsubscribe();
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'biometric':
        return <ShieldCheck className="w-6 h-6 text-green-500" />;
      case 'inventory':
        return <Package className="w-6 h-6 text-orange-500" />;
      case 'booking':
        return <Calendar className="w-6 h-6 text-blue-500" />;
      case 'hardware':
        return <Cpu className="w-6 h-6 text-indigo-500" />;
      default:
        return <Bell className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-3 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto w-full p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl transform transition-all duration-300 animate-slideDown flex items-start gap-3.5 relative overflow-hidden"
        >
          {/* Top glowing bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 animate-pulse" />

          <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            {getIcon(t.type)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>REALTIME SYSTEM ALERT</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500">{t.timestamp}</span>
            </div>

            <h4 className="font-extrabold text-gray-900 text-sm tracking-tight leading-tight">
              {t.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-3">
              {t.body}
            </p>
          </div>

          <button
            onClick={() => removeToast(t.id)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
