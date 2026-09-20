import React from 'react';
import { Cookie, ShieldCheck, Settings, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CookieBannerProps {
  isOpen: boolean;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onOpenPreferences: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
  isOpen,
  onAcceptAll,
  onRejectAll,
  onOpenPreferences,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        role="dialog"
        aria-modal="false"
        aria-label="Cookie consent banner"
        id="cookie-consent-banner"
        className="fixed bottom-16 sm:bottom-6 inset-x-3 sm:right-6 sm:left-auto sm:max-w-md z-50 bg-white rounded-2xl border border-gray-200/90 shadow-2xl p-4 sm:p-5 text-gray-900 font-sans backdrop-blur-md"
      >
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052FF] shrink-0 mt-0.5 shadow-xs">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                We value your privacy
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> GDPR & POPIA
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              PinIn uses cookies and Google Analytics to ensure our marketplace works smoothly, protect user sessions, remember your location preferences, and see which pages and furniture listings are visited.
            </p>
          </div>
        </div>

        {/* Categories Preview Pills */}
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100 flex-wrap text-[11px] text-gray-600 font-medium">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
            <Check className="w-3 h-3 text-emerald-600" /> Essential (Required)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0052FF] font-semibold">
            📊 Google Analytics
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
            📍 Preferences
          </span>
        </div>

        {/* Actions Button Row */}
        <div className="mt-3.5 pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenPreferences}
            className="order-3 sm:order-1 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Manage Preferences</span>
          </button>

          <div className="order-1 sm:order-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onRejectAll}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 rounded-xl transition-all cursor-pointer"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-[#0052FF] hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept All</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
