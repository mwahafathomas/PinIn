import React, { useState, useEffect } from 'react';
import {
  X,
  Cookie,
  BarChart3,
  Check,
  Lock,
} from 'lucide-react';
import {
  CookieConsentSettings,
  getSavedConsent,
  saveConsent,
  acceptAllCookies,
  rejectAllCookies,
} from '../services/analyticsService';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentUpdated?: (consent: CookieConsentSettings) => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onClose,
  onConsentUpdated,
}) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState<boolean>(true);

  // Load existing preferences when opened
  useEffect(() => {
    if (isOpen) {
      const consent = getSavedConsent();
      if (consent) {
        setAnalyticsEnabled(consent.analytics);
        setPersonalizationEnabled(consent.personalization);
      } else {
        setAnalyticsEnabled(true);
        setPersonalizationEnabled(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAcceptAll = () => {
    const consent = acceptAllCookies();
    setAnalyticsEnabled(true);
    setPersonalizationEnabled(true);
    if (onConsentUpdated) onConsentUpdated(consent);
    onClose();
  };

  const handleRejectAll = () => {
    const consent = rejectAllCookies();
    setAnalyticsEnabled(false);
    setPersonalizationEnabled(false);
    if (onConsentUpdated) onConsentUpdated(consent);
    onClose();
  };

  const handleSavePreferences = () => {
    const consent = saveConsent({
      analytics: analyticsEnabled,
      personalization: personalizationEnabled,
    });
    if (onConsentUpdated) onConsentUpdated(consent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052FF] shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                Cookie & Privacy Preferences
              </h2>
              <p className="text-xs text-gray-500">Manage how cookies & analytics are used on PinIn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preferences"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed bg-blue-50/50 border border-blue-100 rounded-xl p-3">
            We respect your right to privacy. You can choose which cookies to allow. Essential cookies are required for basic functions like logging in and secure messaging, while analytics help us improve search and popular furniture discovery.
          </p>

          {/* 1. Essential Cookies */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">Essential Cookies</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Always Active
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Required for session authentication, security checks, anti-fraud verification, and core marketplace functionality.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Google Analytics & Performance Cookies */}
          <div className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0052FF]" />
                  <span className="font-bold text-sm text-gray-900">Google Analytics & Metrics</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Allows us to measure website traffic and interactions to improve search and furniture discovery.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052FF]"></div>
              </label>
            </div>
          </div>

          {/* 3. Personalization & Functional Cookies */}
          <div className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <span className="font-bold text-sm text-gray-900">Functional & Location Preferences</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Remembers your chosen radius, Gauteng location filters, and sorting criteria so you don't have to set them each time.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={personalizationEnabled}
                  onChange={(e) => setPersonalizationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052FF]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleRejectAll}
            className="px-3.5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-center"
          >
            Reject All Non-Essential
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSavePreferences}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all cursor-pointer"
            >
              Save Preferences
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-white bg-[#0052FF] hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Accept All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

