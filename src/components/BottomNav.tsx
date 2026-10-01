import React from 'react';
import { Home, ShoppingCart, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'marketplace' | 'search' | 'cart' | 'account' | 'profile';
  onNavigate: (tab: 'home' | 'cart' | 'account') => void;
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  cartCount = 0,
}) => {
  const isHomeActive = activeTab === 'home' || activeTab === 'marketplace' || activeTab === 'search';
  const isCartActive = activeTab === 'cart';
  const isAccountActive = activeTab === 'account' || activeTab === 'profile';

  return (
    <nav
      aria-label="Bottom navigation bar"
      className="w-full bg-white border-t border-gray-200"
    >
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-3 items-center">
        {/* 1. Home Icon (First at the left) */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          aria-label="Home"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Home
              className={`w-5 h-5 stroke-[2.2] transition-colors ${
                isHomeActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              isHomeActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
            }`}
          >
            Home
          </span>
        </button>

        {/* 2. Cart Icon (Second at middle, where messages was) */}
        <button
          type="button"
          onClick={() => onNavigate('cart')}
          aria-label="Cart"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingCart
              className={`w-5 h-5 stroke-[2] transition-transform group-hover:scale-105 ${
                isCartActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
              }`}
            />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#2D8EDE] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              isCartActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
            }`}
          >
            Cart
          </span>
        </button>

        {/* 3. Account Icon (Last at right, where notifications was) */}
        <button
          type="button"
          onClick={() => onNavigate('account')}
          aria-label="Account"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <User
              className={`w-5 h-5 stroke-[2] transition-transform group-hover:scale-105 ${
                isAccountActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              isAccountActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
            }`}
          >
            Account
          </span>
        </button>
      </div>
    </nav>
  );
};
