import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  Search,
  MessageSquare,
  Bell,
  User as UserIcon,
  X,
  MapPin,
} from 'lucide-react';
import { ChatConversation, UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { ChatBoxPage } from './ChatBoxPage';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDisplayName } from '../utils/formatUtils';

interface AppUserOption {
  id: string;
  name: string;
  avatar: string;
  location?: string;
  role?: string;
}

interface MessagesPageProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatConversation[];
  onSendMessage: (conversationId: string, text: string) => void;
  onBlockUser?: (conversationId: string) => void;
  onUnblockUser?: (conversationId: string) => void;
  onClearChat?: (conversationId: string) => void;
  onStartNewConversationWithUser?: (
    userOption: AppUserOption,
    initialMessage?: string
  ) => string;
  activeConversationId?: string | null;
  onSelectConversation: (id: string | null) => void;
  user: UserAccount;
  allUsers?: AppUserOption[];
  onOpenNotifications?: () => void;
  onOpenSearchPage?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  isOpen,
  onClose,
  conversations,
  onSendMessage,
  onBlockUser,
  onUnblockUser,
  onClearChat,
  onStartNewConversationWithUser,
  activeConversationId,
  onSelectConversation,
  user,
  allUsers = [],
  onOpenNotifications,
  onOpenSearchPage,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (u.id === user.id) return false;
      const lowerName = u.name.toLowerCase();
      if (lowerName.includes('marcus') || lowerName.includes('gray')) return false;
      if (!q) return true;
      return (
        lowerName.includes(q) ||
        (u.location && u.location.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, allUsers, user.id]);

  // Only display conversations that the user has actively texted in or received messages in
  const activeConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (
        c.sellerName?.toLowerCase().includes('marcus') ||
        c.sellerName?.toLowerCase().includes('gray') ||
        c.itemTitle?.toLowerCase().includes('marcus')
      ) {
        return false;
      }

      const hasMessages =
        (c.messages && c.messages.length > 0 && c.messages.some((m) => m.text && m.text.trim().length > 0)) ||
        (c.lastMessage && c.lastMessage.trim().length > 0 && c.lastMessage !== 'Chat cleared');

      if (!hasMessages) return false;

      // When user is logged in, show conversations relevant to this user
      if (user && user.isLoggedIn && user.id) {
        const isBuyer =
          c.buyerId === user.id ||
          (user.name && c.buyerName && c.buyerName.trim().toLowerCase() === user.name.trim().toLowerCase());
        const isSeller =
          c.sellerId === user.id ||
          (user.name && c.sellerName && c.sellerName.trim().toLowerCase() === user.name.trim().toLowerCase());

        if (c.buyerId || c.sellerId || c.buyerName) {
          return isBuyer || isSeller;
        }
      }

      return true;
    });
  }, [conversations, user]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  if (!isOpen) return null;

  if (activeConv) {
    return (
      <ChatBoxPage
        conversation={activeConv}
        isOpen={true}
        onClose={() => onSelectConversation(null)}
        onSendMessage={onSendMessage}
        onBlockUser={onBlockUser}
        onUnblockUser={onUnblockUser}
        onClearChat={onClearChat}
        user={user}
      />
    );
  }

  const handleSelectSearchedUser = (targetUser: AppUserOption) => {
    const existing = conversations.find(
      (c) =>
        (c.sellerName && c.sellerName.toLowerCase() === targetUser.name.toLowerCase()) ||
        (c.buyerName && c.buyerName.toLowerCase() === targetUser.name.toLowerCase()) ||
        (c.buyerId && c.buyerId === targetUser.id) ||
        (c.sellerId && c.sellerId === targetUser.id) ||
        c.id.includes(targetUser.id)
    );

    if (existing) {
      onSelectConversation(existing.id);
      setSearchQuery('');
    } else if (onStartNewConversationWithUser) {
      const newId = onStartNewConversationWithUser(targetUser);
      onSelectConversation(newId);
      setSearchQuery('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content Area (Scrollable in middle) */}
      <main className="flex-1 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto w-full overflow-y-auto px-4 md:px-6 pt-4 pb-6 flex flex-col min-h-0">
        {/* Search users Input Box (navigates to Search Page) */}
        <div className="mb-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onOpenSearchPage) {
                onOpenSearchPage();
              }
            }}
            className="w-full bg-white text-gray-400 text-sm font-semibold pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-300 hover:border-[#0052FF] shadow-xs transition-all relative flex items-center text-left cursor-pointer active:scale-[0.99]"
            aria-label="Search users in app"
          >
            <div className="absolute left-3.5 text-[#0052FF]">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-gray-400 font-medium">Search users...</span>
          </button>
        </div>

        {/* If User is Searching */}
        {searchQuery.trim() ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
              <span className="text-xs font-black text-[#0052FF] uppercase tracking-wider">
                Search Results ({searchedUsers.length})
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Tap to message
              </span>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-xs divide-y divide-gray-100 flex-1 overflow-y-auto">
              {searchedUsers.length > 0 ? (
                searchedUsers.map((targetUser) => {
                  const hasExistingConv = activeConversations.some(
                    (c) =>
                      c.sellerName.toLowerCase() ===
                      targetUser.name.toLowerCase()
                  );

                  return (
                    <button
                      key={targetUser.id}
                      type="button"
                      onClick={() => handleSelectSearchedUser(targetUser)}
                      className="w-full p-3.5 flex items-center justify-between text-left hover:bg-blue-50/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getOptimizedImageUrl(targetUser.avatar || DEFAULT_AVATAR_IMAGE, { width: 150, quality: 75, format: 'webp' })}
                          alt={targetUser.name}
                          className="w-11 h-11 rounded-full object-cover border border-gray-200 group-hover:border-[#0052FF]"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs sm:text-sm text-gray-900 group-hover:text-[#0052FF] transition-colors truncate">
                            {formatDisplayName(targetUser.name)}
                          </p>
                          {targetUser.location && (
                            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="w-3 h-3 text-[#0052FF] shrink-0" />
                              <span>{targetUser.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        <span
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                            hasExistingConv
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-[#0052FF] text-white shadow-xs'
                          }`}
                        >
                          {hasExistingConv ? 'Open Chat' : 'Text User'}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <UserIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-800">
                    No user found matching "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Check the exact name or try searching for another seller.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Conversations List: Displays only users that a user has texted in listings or in search */
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
                <span>Conversations</span>
                <span className="text-gray-400 font-medium">
                  ({activeConversations.length})
                </span>
              </span>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-xs divide-y divide-gray-100 flex-1 overflow-y-auto">
              {activeConversations.length > 0 ? (
                activeConversations.map((conv) => {
                  const isCurrentUserSeller =
                    (conv.sellerId && conv.sellerId === user.id) ||
                    (user.name && conv.sellerName && conv.sellerName.trim().toLowerCase() === user.name.trim().toLowerCase());

                  const rawPartnerName = (isCurrentUserSeller && conv.buyerName) ? conv.buyerName : (conv.sellerName || 'User');
                  const partnerName = formatDisplayName(rawPartnerName);
                  const otherPartyId = isCurrentUserSeller ? conv.buyerId : conv.sellerId;
                  const matchingUser = allUsers.find(
                    (u) =>
                      (otherPartyId && u.id === otherPartyId) ||
                      (u.name && rawPartnerName && u.name.trim().toLowerCase() === rawPartnerName.trim().toLowerCase())
                  );
                  const rawAvatar = (matchingUser?.avatar && matchingUser.avatar.trim() !== '')
                    ? matchingUser.avatar
                    : ((isCurrentUserSeller && conv.buyerAvatar) ? conv.buyerAvatar : (conv.sellerAvatar || DEFAULT_AVATAR_IMAGE));
                  const partnerAvatar = rawAvatar || DEFAULT_AVATAR_IMAGE;
                  const displayTitle = conv.itemTitle && !conv.itemTitle.startsWith('Chat with ') && conv.itemPrice > 0 ? conv.itemTitle : null;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => onSelectConversation(conv.id)}
                      className="w-full p-3.5 flex items-center gap-3.5 hover:bg-blue-50/50 transition-colors text-left group cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={getOptimizedImageUrl(partnerAvatar || DEFAULT_AVATAR_IMAGE, { width: 150, quality: 75, format: 'webp' })}
                          alt={partnerName}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover:border-[#0052FF] transition-colors"
                          loading="lazy"
                          decoding="async"
                        />
                        {conv.unread && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                            {partnerName}
                          </span>
                          {conv.lastMessageTime && conv.lastMessageTime !== 'Just now' && (
                            <span className="text-[10px] font-semibold text-gray-400 shrink-0 ml-1">
                              {conv.lastMessageTime}
                            </span>
                          )}
                        </div>

                        {displayTitle && (
                          <p className="text-[11px] font-bold text-gray-700 truncate">
                            {displayTitle}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center my-auto">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      No conversations yet
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-4">
                      You haven't texted any sellers or users yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        searchInputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0052FF] hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Search users</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Dock */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-3 items-center">
          {/* Search Icon at left */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSearchPage) {
                onOpenSearchPage();
              } else {
                onClose();
              }
            }}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#0052FF] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Search listings"
          >
            <div className="relative flex items-center justify-center">
              <Search className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#0052FF]" />
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#0052FF]">
              Search
            </span>
          </button>

          {/* Messages Icon in middle */}
          <button
            type="button"
            onClick={() => {
              onSelectConversation(null);
            }}
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Messages"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-5 h-5 stroke-[2] text-[#0052FF] fill-[#0052FF] transition-transform group-hover:scale-105" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#0052FF] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-[#0052FF]">
              messages
            </span>
          </button>

          {/* Notification Icon at right */}
          <button
            type="button"
            onClick={() => {
              if (onOpenNotifications) onOpenNotifications();
            }}
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Notifications"
          >
            <div className="relative flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2] text-[#0052FF] fill-[#0052FF] transition-transform group-hover:scale-105" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#0052FF] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#0052FF]">
              Notifications
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
