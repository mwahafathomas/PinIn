import React, { useState } from 'react';
import { WifiOff, RotateCw } from 'lucide-react';

interface OfflineScreenProps {
  onSuccess?: () => void;
  onRetry?: () => Promise<boolean> | boolean | void;
}

/**
 * Dedicated Offline Screen component shown when user opens app without internet connection.
 * - Centered blue circular icon + "No Internet Connection"
 * - Bottom: blue small icon with words "Tap to refresh"
 * - When tapped: shows app splash screen. If still no internet, returns to no internet page.
 *   If internet is back, leads smoothly into the app.
 */
export const OfflineScreen: React.FC<OfflineScreenProps> = ({ onSuccess, onRetry }) => {
  const [isShowingSplash, setIsShowingSplash] = useState(false);

  const handleTapToRefresh = async () => {
    setIsShowingSplash(true);
    // Show splash screen while checking connectivity
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let connected = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        // Verify real connectivity with cache-busting check
        const res = await fetch('/icon.svg?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
        connected = res.ok;
      }
    } catch {
      connected = false;
    }

    if (!connected && onRetry) {
      try {
        const retryResult = await onRetry();
        if (retryResult) connected = true;
      } catch {}
    }

    if (connected) {
      if (onSuccess) {
        onSuccess();
      }
    } else {
      // Still no internet: return to the same page with no internet connection
      setIsShowingSplash(false);
    }
  };

  if (isShowingSplash) {
    return (
      <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-white px-6 text-center select-none animate-fadeIn">
        <img
          src="/splash.png"
          alt="PinIn"
          className="max-h-[70vh] w-auto max-w-[85vw] object-contain"
        />
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[99999] flex flex-col justify-between items-center bg-white px-6 select-none animate-fadeIn"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
      }}
    >
      <div className="w-1" />

      {/* Blue circular icon container in middle of screen */}
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-5 shadow-xs border border-blue-100">
          <WifiOff className="w-12 h-12 text-[#2D8EDE]" strokeWidth={2.2} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          No Internet Connection
        </h2>
      </div>

      {/* Bottom button: small blue icon with words "Tap to refresh" */}
      <button
        type="button"
        onClick={handleTapToRefresh}
        className="flex items-center justify-center gap-2 py-3 px-5 text-[#2D8EDE] hover:bg-blue-50/50 rounded-2xl active:scale-95 transition-all cursor-pointer font-bold text-sm"
        aria-label="Tap to refresh"
      >
        <RotateCw className="w-4 h-4 text-[#2D8EDE] stroke-[2.5]" />
        <span>Tap to refresh</span>
      </button>
    </div>
  );
};

export default OfflineScreen;
