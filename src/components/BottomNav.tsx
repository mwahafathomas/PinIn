import React from 'react';
import { Store, MessageSquare, Bell, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'search' | 'marketplace' | 'messages' | 'profile' | 'account' | 'notifications';
  onNavigate: (tab: 'search' | 'marketplace' | 'messages' | 'profile' | 'account' | 'notifications') => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const isMarketplaceActive = activeTab === 'marketplace' || activeTab === 'search';
  const isProfileActive = activeTab === 'profile' || activeTab === 'account';

  return (
    <nav
      aria-label="Bottom navigation bar"
      className="w-full bg-white"
    >
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-4 items-center">
        {/* 1. Messages Icon (First at the left) */}
        <button
          type="button"
          onClick={() => onNavigate('messages')}
          aria-label="Messages"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare
              className={`w-5 h-5 stroke-[2] transition-transform group-hover:scale-105 ${
                activeTab === 'messages' ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
              }`}
            />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              activeTab === 'messages' ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
            }`}
          >
            messages
          </span>
        </button>

        {/* 2. Profile Icon (Second) */}
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          aria-label="Profile"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <User
              className={`w-5 h-5 stroke-[2.2] transition-colors ${
                isProfileActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              isProfileActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
            }`}
          >
            Profile
          </span>
        </button>

        {/* 3. Marketplace Icon (Third) */}
        <button
          type="button"
          onClick={() => onNavigate('marketplace')}
          aria-label="Marketplace"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Store
              className={`w-5 h-5 stroke-[2.2] transition-colors ${
                isMarketplaceActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              isMarketplaceActive ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
            }`}
          >
            Marketplace
          </span>
        </button>

        {/* 4. Notifications Icon (Last at right) */}
        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          aria-label="Notifications"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Bell
              className={`w-5 h-5 stroke-[2] transition-transform group-hover:scale-105 ${
                activeTab === 'notifications' ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
              }`}
            />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#2D8EDE] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              activeTab === 'notifications' ? 'text-[#2D8EDE]' : 'text-gray-600 group-hover:text-[#2D8EDE]'
            }`}
          >
            Notifications
          </span>
        </button>
      </div>
    </nav>
  );
};
