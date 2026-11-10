import React from 'react';

/**
 * Banner at top of screen when internet drops while user is inside the app.
 * Requirement:
 * - "show message at top saying ' your internet connection appears to be offline' with no icons."
 * - Do NOT lead to the full page saying no internet connection when internet goes off
 */
export const InternetBanner = ({ isOnline, isInitialLaunchOffline = false }) => {
  if (isOnline || isInitialLaunchOffline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] bg-gray-900 text-white text-xs font-semibold py-2 px-4 text-center shadow-sm select-none transition-transform duration-300 ease-in-out"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
      }}
    >
      your internet connection appears to be offline
    </div>
  );
};

export default InternetBanner;
