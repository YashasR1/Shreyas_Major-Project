// Smart Notification Service Engine for OS System Alerts & In-App Toast Banners
// Works seamlessly in Chrome/Edge browser during testing AND inside Android APK via Capacitor

let toastListeners = [];

export const notificationService = {
  // Subscribe UI components (like NotificationToast) to incoming alert events
  subscribe(callback) {
    toastListeners.push(callback);
    return () => {
      toastListeners = toastListeners.filter((cb) => cb !== callback);
    };
  },

  // Notify all active React UI banners
  emitToast(alertPayload) {
    toastListeners.forEach((cb) => cb(alertPayload));
  },

  // Request operating system / browser notification permissions
  async requestPermission() {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const result = await Notification.requestPermission();
          console.log('🔔 [OS Notification Permission Status]:', result);
          return result === 'granted';
        }
        return Notification.permission === 'granted';
      }
    } catch (err) {
      console.warn('⚠️ Notification permission request error:', err);
    }
    return false;
  },

  // Trigger both System Tray Notification (like Airtel / Amazon) & In-App UI Toast
  async sendAlert({ type = 'general', title, body }) {
    console.log(`🔔 [System Notification Triggered]: "${title}" — ${body}`);

    // 1. Emit to In-App React Toast Banner
    this.emitToast({
      id: Date.now(),
      type,
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // 2. Trigger Native Operating System / Browser System Tray Alert
    try {
      // Check if running natively inside Capacitor APK and invoke plugin dynamically
      if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.LocalNotifications) {
        await window.Capacitor.Plugins.LocalNotifications.schedule({
          notifications: [
            {
              title: title,
              body: body,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 200) },
              sound: null,
              attachments: null,
              actionTypeId: '',
              extra: null
            }
          ]
        });
        console.log('✅ Android Native Tray Notification Scheduled via Capacitor');
        return;
      }

      // Standard HTML5 / Desktop OS System Notification fallback
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false
          });
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification(title, { body: body });
          }
        }
      }
    } catch (error) {
      console.error('⚠️ System notification error (Fallback UI toast executed):', error);
    }
  }
};
