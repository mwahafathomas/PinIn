import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Menu,
  Search,
  Store,
  MessageSquare,
  Bell,
  User as UserIcon,
  X,
  MapPin,
  Users,
} from 'lucide-react';
import { ChatConversation, UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { ChatBoxPage } from './ChatBoxPage';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDisplayName } from '../utils/formatUtils';
import { fetchUserProfilePicture } from '../services/profilesService';

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
  onOpenHome?: () => void;
  onOpenSearch?: () => void;
  onOpenAccount?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  onClearBadgeCount?: () => void;
  onOpenMenu?: () => void;
  onOpenUserProfile?: (userId: string, initialData?: { id?: string; name?: string; surname?: string; avatar?: string; location?: string; bio?: string }) => void;
}

// Persistent module cache for partner avatars to prevent reload/resume re-renders & layout jumps
const partnerAvatarCache: Record<string, string> = {};
const pendingAvatarFetches = new Set<string>();

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
  onOpenHome,
  onOpenSearch,
  onOpenAccount,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
  onClearBadgeCount,
  onOpenMenu,
  onOpenUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'communities'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Badge count is cleared when navigating or clicking tab, eliminating on-focus setState jumps

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
    // When user has not signed in, do not show conversations of other users
    if (!user || !user.isLoggedIn || !user.id || user.id === 'guest') {
      return [];
    }

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

      const isBuyer =
        c.buyerId === user.id ||
        (user.name && c.buyerName && c.buyerName.trim().toLowerCase() === user.name.trim().toLowerCase());
      const isSeller =
        c.sellerId === user.id ||
        (user.name && c.sellerName && c.sellerName.trim().toLowerCase() === user.name.trim().toLowerCase());

      return isBuyer || isSeller;
    });
  }, [conversations, user]);

  // Pre-fetch partner avatars quietly in background without triggering component re-render loops or screen jumps
  useEffect(() => {
    activeConversations.forEach((c) => {
      const isCurrentUserSeller =
        (c.sellerId && c.sellerId === user.id) ||
        (user.name && c.sellerName && c.sellerName.trim().toLowerCase() === user.name.trim().toLowerCase());
      const partnerId = isCurrentUserSeller ? c.buyerId : c.sellerId;
      if (partnerId && !partnerAvatarCache[partnerId] && !pendingAvatarFetches.has(partnerId)) {
        pendingAvatarFetches.add(partnerId);
        fetchUserProfilePicture(partnerId).then((pic) => {
          pendingAvatarFetches.delete(partnerId);
          if (pic) {
            partnerAvatarCache[partnerId] = pic;
          }
        }).catch(() => {
          pendingAvatarFetches.delete(partnerId);
        });
      }
    });
  }, [activeConversations.length, user.id]);

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
        onOpenUserProfile={onOpenUserProfile}
        user={user}
        allUsers={allUsers}
      />
    );
  }

  const handleSelectSearchedUser = (targetUser: AppUserOption) => {
    if (!user || !user.isLoggedIn || user.id === 'guest') {
      if (onOpenAccount) onOpenAccount();
      return;
    }

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
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* 3 bars menu button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (onOpenMenu) {
                  onOpenMenu();
                } else {
                  onClose();
                }
              }}
              aria-label="Open menu"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <Menu className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              type="button"
              onClick={() => {
                if (onOpenHome) onOpenHome();
                else if (onOpenSearch) onOpenSearch();
                else onClose();
              }}
              className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans cursor-pointer focus-visible:outline-none"
              aria-label="PinIn Home"
            >
              Pin<span className="text-[#2D8EDE]">In</span>
            </button>
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
            className="w-full bg-white text-gray-400 text-sm font-semibold pl-11 pr-4 py-3.5 rounded-2xl border-2 border-gray-300 hover:border-[#2D8EDE] shadow-xs transition-all relative flex items-center text-left cursor-pointer active:scale-[0.99]"
            aria-label="Search users in app"
          >
            <div className="absolute left-3.5 text-[#2D8EDE]">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-gray-400 font-medium">Search users...</span>
          </button>
        </div>

        {/* If User is Searching */}
        {searchQuery.trim() ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
              <span className="text-xs font-black text-[#2D8EDE] uppercase tracking-wider">
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
                          className="w-11 h-11 rounded-full object-cover border border-gray-200 group-hover:border-[#2D8EDE]"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs sm:text-sm text-gray-900 group-hover:text-[#2D8EDE] transition-colors truncate">
                            {formatDisplayName(targetUser.name)}
                          </p>
                          {targetUser.location && (
                            <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1 truncate mt-0.5">
                              <MapPin className="w-3 h-3 text-[#2D8EDE] shrink-0" />
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
                              : 'bg-[#2D8EDE] text-white shadow-xs'
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
            {/* Containers for (All, Communities, The circle) styled like (Sell, Categories, Filters) boxes on home page */}
            <div className="w-full bg-[#2D8EDE] text-white rounded-2xl grid grid-cols-3 divide-x divide-white/20 overflow-hidden shadow-xs mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center justify-center py-3 px-2 text-white font-bold text-sm tracking-wide transition-colors cursor-pointer ${
                  activeTab === 'all' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10 active:bg-white/20'
                }`}
              >
                <span className="whitespace-nowrap">All</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('communities')}
                className={`flex items-center justify-center py-3 px-2 text-white font-bold text-sm tracking-wide transition-colors cursor-pointer ${
                  activeTab === 'communities' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10 active:bg-white/20'
                }`}
              >
                <span className="whitespace-nowrap">Communities</span>
              </button>

              {/* The circle - not clickable yet */}
              <div
                aria-disabled="true"
                className="flex items-center justify-center py-3 px-2 text-white/50 font-bold text-sm tracking-wide cursor-default select-none pointer-events-none"
              >
                <span className="whitespace-nowrap">The circle</span>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-xs divide-y divide-gray-100 flex-1 overflow-y-auto">
              {!user || !user.isLoggedIn || !user.id || user.id === 'guest' ? (
                <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      Welcome to Messages
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-5">
                      Your chats with sellers and friends will appear here once you connect.
                    </p>
                    {/* Non-clickable blue box: 'Find users' */}
                    <div
                      aria-disabled="true"
                      className="w-full max-w-xs mx-auto bg-[#2D8EDE] text-white font-bold py-3 px-6 rounded-2xl text-center text-sm shadow-xs select-none opacity-90 cursor-default"
                    >
                      Find users
                    </div>
                  </div>
                </div>
              ) : activeTab === 'communities' ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <Users className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    No community channels yet
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                    Local furniture & neighborhood community chats will appear here.
                  </p>
                </div>
              ) : activeConversations.length > 0 ? (
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
                  const partnerAvatar =
                    (otherPartyId && partnerAvatarCache[otherPartyId]) ||
                    (matchingUser?.avatar && matchingUser.avatar.trim() !== '' ? matchingUser.avatar : null) ||
                    ((isCurrentUserSeller && conv.buyerAvatar) ? conv.buyerAvatar : (conv.sellerAvatar || DEFAULT_AVATAR_IMAGE));

                  const displayTitle = conv.itemTitle && !conv.itemTitle.startsWith('Chat with ') && conv.itemPrice > 0 ? conv.itemTitle : null;

                  // Unread = message where is_read = false and receiver_id = current_user
                  const isLastMessageUnread = (() => {
                    if (conv.messages && conv.messages.length > 0) {
                      const lastMsg = conv.messages[conv.messages.length - 1];
                      const isReceiverMe = !lastMsg.isMe || (user.id && (lastMsg as any).receiverId === user.id) || (lastMsg.senderId !== user.id);
                      const isUnread = (lastMsg as any).isRead === false || (lastMsg as any).is_read === false;
                      return isReceiverMe && isUnread;
                    }
                    return !!conv.unread;
                  })();

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => onSelectConversation(conv.id)}
                      className={`w-full p-3.5 flex items-center gap-3.5 ${
                        isLastMessageUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-gray-50/70'
                      } transition-colors text-left group cursor-pointer`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={getOptimizedImageUrl(partnerAvatar || DEFAULT_AVATAR_IMAGE, { width: 150, quality: 75, format: 'webp' })}
                          alt={partnerName}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover:border-[#2D8EDE] transition-colors"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-xs sm:text-sm truncate ${
                            isLastMessageUnread ? 'font-black text-gray-950' : 'font-extrabold text-gray-900'
                          }`}>
                            {partnerName}
                          </span>
                          {conv.lastMessageTime && conv.lastMessageTime !== 'Just now' && (
                            <span className={`text-[10px] shrink-0 ml-1 ${
                              isLastMessageUnread ? 'font-black text-[#2D8EDE]' : 'font-semibold text-gray-400'
                            }`}>
                              {conv.lastMessageTime}
                            </span>
                          )}
                        </div>

                        {displayTitle && (
                          <p className={`text-[11px] truncate ${
                            isLastMessageUnread ? 'font-extrabold text-gray-900' : 'font-bold text-gray-700'
                          }`}>
                            {displayTitle}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate mt-0.5 ${
                            isLastMessageUnread ? 'font-bold text-gray-950' : 'font-medium text-gray-500'
                          }`}>
                            {conv.lastMessage}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center my-auto">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
                    <MessageSquare className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      No conversations yet
                    </h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-4">
                      You haven't texted any sellers or users yet.
                    </p>
                    {/* Non-clickable blue box: 'Find users' */}
                    <div
                      aria-disabled="true"
                      className="w-full max-w-xs mx-auto bg-[#2D8EDE] text-white font-bold py-3 px-6 rounded-2xl text-center text-sm shadow-xs select-none opacity-90 cursor-default"
                    >
                      Find users
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Dock */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-4 items-center">
          {/* 1. Messages Icon (First at left, active) */}
          <button
            type="button"
            onClick={() => {
              onSelectConversation(null);
            }}
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Messages"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-5 h-5 stroke-[2] text-[#2D8EDE] transition-transform group-hover:scale-105" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-[#2D8EDE]">
              messages
            </span>
          </button>

          {/* 2. Profile Icon (Second) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenAccount) onOpenAccount();
            }}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Profile"
          >
            <div className="relative flex items-center justify-center">
              <UserIcon className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#2D8EDE]" />
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Profile
            </span>
          </button>

          {/* 3. Marketplace Icon (Third) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenHome) {
                onOpenHome();
              } else if (onOpenSearch) {
                onOpenSearch();
              } else {
                onClose();
              }
            }}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Marketplace"
          >
            <div className="relative flex items-center justify-center">
              <Store className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#2D8EDE]" />
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Marketplace
            </span>
          </button>

          {/* 4. Notification Icon (Last at right) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenNotifications) onOpenNotifications();
            }}
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Notifications"
          >
            <div className="relative flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2] text-gray-600 group-hover:text-[#2D8EDE] transition-transform group-hover:scale-105" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#2D8EDE] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Notifications
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
