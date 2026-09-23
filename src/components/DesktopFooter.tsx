import React from 'react';
import { ShieldCheck, Headphones } from 'lucide-react';

interface DesktopFooterProps {
  onOpenPrivacyPolicy: () => void;
  onOpenContactUs: () => void;
}

/**
 * Desktop & Tablet Footer containing quick links.
 * Visible on tablet preview (sm:) and desktop.
 */
export const DesktopFooter: React.FC<DesktopFooterProps> = ({
  onOpenPrivacyPolicy,
  onOpenContactUs,
}) => {
  return (
    <footer
      id="app-footer"
      className="hidden sm:block w-full bg-white border-t border-gray-200 mt-auto py-5 sm:py-6 px-4 md:px-8 text-gray-600 font-sans"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand info */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-center sm:text-left">
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-gray-900 font-sans">
            Pin<span className="text-[#2D8EDE]">In</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 font-medium text-[11px] sm:text-xs">
            Local Pre-Loved & Handcrafted Furniture
          </span>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-6 font-semibold">
          {/* Privacy Policy */}
          <button
            type="button"
            onClick={onOpenPrivacyPolicy}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          {/* Contact Support */}
          <button
            type="button"
            onClick={onOpenContactUs}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Contact Us</span>
          </button>
        </div>
      </div>

      {/* Subline */}
      <div className="max-w-7xl mx-auto mt-3.5 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-1 text-center sm:text-left">
        <p>© {new Date().getFullYear()} PinIn. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted for safe, seamless local furniture trading
        </p>
      </div>
    </footer>
  );
};

