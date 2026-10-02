import React, { useState } from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Network } from '@capacitor/network';

interface OfflineScreenProps {
  onRetry?: () => Promise<boolean> | boolean | void;
}

/**
 * Dedicated Offline Screen component.
 * Automatically displays whenever the device loses internet connection,
 * gracefully blocking the main content and offering a "Retry" button.
 */
export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setStatusMessage(null);

    try {
      // 1. Check Capacitor native network plugin if available
      let isConnected = true;
      try {
        const capStatus = await Network.getStatus();
        isConnected = capStatus.connected;
      } catch {
        isConnected = typeof navigator !== 'undefined' ? navigator.onLine : true;
      }

      // 2. Validate actual internet capability with a quick ping to backend health check
      if (isConnected) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch('/api/health?t=' + Date.now(), {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            isConnected = true;
          }
        } catch {
          // If the ping fails or times out, consider connection still unstable/unavailable
          isConnected = typeof navigator !== 'undefined' ? navigator.onLine : false;
        }
      }

      // 3. If parent provided custom onRetry handler, execute it
      if (onRetry) {
        const customResult = await onRetry();
        if (typeof customResult === 'boolean') {
          isConnected = customResult;
        }
      }

      if (!isConnected) {
        setStatusMessage('Still unable to connect. Please check your network.');
      }
    } catch {
      setStatusMessage('Connection attempt timed out. Please try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white px-6 text-center select-none animate-fadeIn"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Soft tinted circular icon container */}
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mb-6 shadow-xs border border-red-100">
          <WifiOff className="w-12 h-12 text-red-500" strokeWidth={2.2} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
          No Internet Connection
        </h2>

        {/* Informative Subtitle */}
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-8">
          You are currently offline. Please check your Wi-Fi or mobile data connection and try again.
        </p>

        {/* Status Message if retry failed */}
        {statusMessage && (
          <div className="mb-4 flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Retry Button */}
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-[#0066CC] hover:bg-[#0052A3] active:scale-[0.98] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
          />
          <span>{isRetrying ? 'Checking connection…' : 'Try Again'}</span>
        </button>

        {/* Help Hint */}
        <p className="mt-6 text-[11px] text-gray-400">
          The app will automatically resume as soon as connection is restored.
        </p>
      </div>
    </div>
  );
};

export default OfflineScreen;
