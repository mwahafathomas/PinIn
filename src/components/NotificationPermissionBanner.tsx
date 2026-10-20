import React, { useState, useEffect } from 'react';
import { Bell, Check, X, ShieldAlert } from 'lucide-react';
import { requestOneSignalPermission, getNotificationPermissionStatus } from '../services/oneSignalService';

interface NotificationPermissionBannerProps {
  onPermissionChanged?: (granted: boolean) => void;
  className?: string;
  compact?: boolean;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onPermissionChanged,
  className = '',
  compact = false,
}) => {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    const status = getNotificationPermissionStatus();
    setPermission(status);
    console.log('[OneSignal Banner] Initial permission status:', status);

    const handlePermissionChange = (e: any) => {
      const granted = e.detail?.granted;
      console.log('[OneSignal Banner] Event received. Granted:', granted);
      setPermission(granted ? 'granted' : getNotificationPermissionStatus());
      if (onPermissionChanged) onPermissionChanged(Boolean(granted));
    };

    window.addEventListener('onesignal-permission-changed', handlePermissionChange);
    return () => {
      window.removeEventListener('onesignal-permission-changed', handlePermissionChange);
    };
  }, [onPermissionChanged]);

  // If already granted or dismissed by user, don't show the banner
  if (permission === 'granted' || isDismissed) {
    return null;
  }

  const handleEnableClick = async () => {
    setIsRequesting(true);
    console.log('[OneSignal UI] Custom "Enable Notifications" button clicked.');
    try {
      const granted = await requestOneSignalPermission();
      console.log('[OneSignal UI] requestOneSignalPermission returned:', granted);
      if (granted) {
        setPermission('granted');
        if (onPermissionChanged) onPermissionChanged(true);
      } else {
        const current = getNotificationPermissionStatus();
        setPermission(current);
        console.log('[OneSignal UI] Current permission after prompt:', current);
      }
    } catch (err) {
      console.error('[OneSignal UI] Error requesting permission:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">Push Notifications</p>
            <p className="text-[11px] text-gray-600 truncate">
              {permission === 'denied' ? 'Blocked in browser settings' : 'Get instant alerts for orders & messages'}
            </p>
          </div>
        </div>

        {permission === 'denied' ? (
          <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full shrink-0">
            Blocked
          </span>
        ) : (
          <button
            type="button"
            disabled={isRequesting}
            onClick={handleEnableClick}
            className="px-3 py-1.5 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            {isRequesting ? 'Enabling...' : 'Enable Notifications'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r from-blue-50 via-white to-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2D8EDE] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Bell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">
              Enable Push Notifications
            </h3>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">
              {permission === 'denied'
                ? 'Notifications are blocked in your browser settings. Please click the lock icon in the URL bar to allow notifications.'
                : 'Stay updated instantly on order status, new clothing arrivals, and messages.'}
            </p>

            {permission !== 'denied' && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isRequesting}
                  onClick={handleEnableClick}
                  className="px-4 py-2 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isRequesting ? 'Requesting...' : 'Enable Notifications'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDismissed(true)}
                  className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss banner"
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
