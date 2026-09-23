import React from 'react';

/**
 * Small offline indicator banner at TOP of screen.
 * Requirements:
 * - Shows when offline: "No internet connection"
 * - Grey background, small height (30px)
 * - NOT a full screen, NOT an alert, does NOT block the app (pointer-events-none)
 * - Automatically hides when online
 * - Smooth slide-down animation (not a jump)
 */
export const InternetBanner = ({ isOnline = true }) => {
  return (
    <div
      id="offline-banner"
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-all duration-300 ease-out transform ${
        !isOnline
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
      }`}
      style={{
        height: '30px',
        maxHeight: '30px',
      }}
    >
      <div
        className="w-full h-[30px] bg-[#4b5563] text-white flex items-center justify-center text-center px-3 text-[12px] font-medium tracking-tight select-none shadow-xs border-b border-gray-600/50"
        style={{ height: '30px', lineHeight: '30px' }}
      >
        <span>No internet connection</span>
      </div>
    </div>
  );
};

export default InternetBanner;
