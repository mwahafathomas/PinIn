import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface PoliciesPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoliciesPage: React.FC<PoliciesPageProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const policyItems = [
    '1. Privacy Policy',
    '2. Terms and Conditions',
    '3. PAIA',
    '4. Cookie policy',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar: Back arrow at top-left, PinIn title centered at top */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Back arrow (<) at top-left */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name PinIn centered at top */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area - Non-clickable plain text list */}
      <main className="flex-1 w-full max-w-md md:max-w-xl mx-auto overflow-y-auto no-scrollbar px-4 md:px-6 pt-6 pb-12">
        <div className="bg-white rounded-3xl border-2 border-gray-200 divide-y divide-gray-100 shadow-xs overflow-hidden">
          {policyItems.map((item) => (
            <div
              key={item}
              className="p-4 sm:p-5 flex items-center text-sm sm:text-base font-extrabold text-gray-800 cursor-default select-none pointer-events-none"
            >
              <span>{item}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

