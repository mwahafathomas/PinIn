import React from 'react';
import { Search, MessageSquare, Bell } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'search' | 'messages' | 'notifications';
  onNavigate: (tab: 'search' | 'messages' | 'notifications') => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  return (
    <nav
      aria-label="Bottom navigation bar"
      className="w-full bg-white"
    >
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-3 items-center">
        {/* Search Icon at bottom left */}
        <button
          type="button"
          onClick={() => onNavigate('search')}
          aria-label="Home and Search"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#0052FF] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Search
              className={`w-5 h-5 stroke-[2.2] transition-colors ${
                activeTab === 'search' ? 'text-[#0052FF]' : 'text-gray-600 group-hover:text-[#0052FF]'
              }`}
            />
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              activeTab === 'search' ? 'text-[#0052FF]' : 'text-gray-600 group-hover:text-[#0052FF]'
            }`}
          >
            Search
          </span>
        </button>

        {/* Messages Icon in the middle */}
        <button
          type="button"
          onClick={() => onNavigate('messages')}
          aria-label="Messages"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#0052FF] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare
              className="w-5 h-5 stroke-[2] text-[#0052FF] fill-[#0052FF] transition-transform group-hover:scale-105"
            />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadMessagesCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              activeTab === 'messages' ? 'text-[#0052FF]' : 'text-gray-600 group-hover:text-[#0052FF]'
            }`}
          >
            messages
          </span>
        </button>

        {/* Notifications Icon (Notification Bell) at bottom right */}
        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          aria-label="Notifications"
          className="flex flex-col items-center justify-center h-full text-gray-700 hover:text-[#0052FF] active:scale-95 transition-all group relative cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Bell
              className="w-5 h-5 stroke-[2] text-[#0052FF] fill-[#0052FF] transition-transform group-hover:scale-105"
            />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-[#0052FF] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-bold mt-1 leading-none transition-colors ${
              activeTab === 'notifications' ? 'text-[#0052FF]' : 'text-gray-600 group-hover:text-[#0052FF]'
            }`}
          >
            Notifications
          </span>
        </button>
      </div>
    </nav>
  );
};
