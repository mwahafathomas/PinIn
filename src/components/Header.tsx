import React from 'react';
import { Menu } from 'lucide-react';
import { UserAccount } from '../types/furniture';

interface HeaderProps {
  onOpenMenu: () => void;
  onGoHome?: () => void;
  user?: UserAccount;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onOpenAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onGoHome,
}) => {
  return (
    <header
      className="relative w-full bg-white border-b border-gray-200 shrink-0"
      style={{
        paddingTop: 'env(safe-area-inset-top, 8px)',
      }}
    >
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
        {/* Left: spacer to keep PinIn centered without 3 bars */}
        <div className="w-8" aria-hidden="true" />

        {/* Center: App Name (PinIn) right in the middle */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-1 focus-visible:outline-none cursor-pointer"
            aria-label="PinIn Home"
          >
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </button>
        </div>

        {/* Right: Clean spacer */}
        <div className="w-8" aria-hidden="true" />
      </div>
    </header>
  );
};
