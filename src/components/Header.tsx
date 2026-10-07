import React from 'react';
import { LogIn } from 'lucide-react';
import { UserAccount } from '../types/furniture';

interface HeaderProps {
  onOpenMenu?: () => void;
  onGoHome?: () => void;
  user?: UserAccount;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onOpenAccount?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  user,
  onOpenAuth,
}) => {
  return (
    <header
      className="relative w-full bg-white border-b border-gray-200 shrink-0"
      style={{
        paddingTop: 'env(safe-area-inset-top, 8px)',
      }}
    >
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-center relative">
        {/* Center: App Name (PinIn) right in the middle */}
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

        {/* Right: Sign in icon if user is not logged in */}
        {!user?.isLoggedIn && (
          <button
            type="button"
            onClick={() => onOpenAuth?.('signin')}
            aria-label="Sign In"
            className="absolute right-4 p-2 rounded-xl text-[#2D8EDE] hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
          >
            <LogIn className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}
      </div>
    </header>
  );
};
