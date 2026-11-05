import React from 'react';
import { WifiOff } from 'lucide-react';

interface OfflineScreenProps {
  onRetry?: () => Promise<boolean> | boolean | void;
}

/**
 * Dedicated Offline Screen component.
 * Displays when connection is lost: blue icon in center and title.
 */
export const OfflineScreen: React.FC<OfflineScreenProps> = () => {
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
        {/* Blue circular icon container in middle of screen */}
        <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-5 shadow-xs border border-blue-100">
          <WifiOff className="w-12 h-12 text-[#2D8EDE]" strokeWidth={2.2} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          No Internet Connection
        </h2>
      </div>
    </div>
  );
};

export default OfflineScreen;
