import React, { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff } from 'lucide-react';

export const InternetBanner = () => {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    let isMounted = true;

    const setOnlineStatus = (online) => {
      if (isMounted) {
        setIsOnline(Boolean(online));
      }
    };

    // 1. Initial check with navigator.onLine
    if (typeof navigator !== 'undefined') {
      setOnlineStatus(navigator.onLine);
    }

    // 2. Window online/offline event listeners
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Capacitor Network listener for APK / Android accuracy
    let networkListenerHandle = null;

    try {
      Network.getStatus()
        .then((status) => {
          if (isMounted && status && typeof status.connected === 'boolean') {
            setOnlineStatus(status.connected);
          }
        })
        .catch(() => {
          // Graceful fallback in environments where Capacitor is not native
        });

      Network.addListener('networkStatusChange', (status) => {
        if (isMounted && status && typeof status.connected === 'boolean') {
          setOnlineStatus(status.connected);
        }
      })
        .then((handle) => {
          networkListenerHandle = handle;
        })
        .catch(() => {
          // Graceful fallback
        });
    } catch {
      // Capacitor Network not available or in web preview
    }

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (networkListenerHandle && typeof networkListenerHandle.remove === 'function') {
        networkListenerHandle.remove();
      }
    };
  }, []);

  return (
    <div
      id="internet-offline-banner"
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[9999] pointer-events-none transition-all duration-300 ease-in-out transform ${
        !isOnline ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-[#18191a] text-white shadow-md border-b border-gray-800/80 px-4 py-2 sm:py-2.5 flex items-center justify-center gap-2 text-center select-none pointer-events-auto">
        <WifiOff className="w-4 h-4 text-gray-300 shrink-0" aria-hidden="true" />
        <span className="text-xs sm:text-sm font-semibold tracking-tight text-gray-100">
          No internet connection - showing saved posts
        </span>
      </div>
    </div>
  );
};

export default InternetBanner;
