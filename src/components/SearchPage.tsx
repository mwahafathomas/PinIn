import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  Search,
  X,
  MapPin,
  Bookmark,
  MessageSquare,
  User as UserIcon,
  Tag,
  ArrowRight,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { FurnitureItem, UserAccount, ChatConversation } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface AppUserOption {
  id: string;
  name: string;
  avatar: string;
  location?: string;
  role?: string;
}

interface SearchPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'furniture' | 'messages';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  furnitureList: FurnitureItem[];
  savedItemIds?: string[];
  onSelectItem: (item: FurnitureItem) => void;
  onToggleSave?: (id: string, e: React.MouseEvent) => void;
  onViewAllResults: () => void;
  conversations?: ChatConversation[];
  allUsers?: AppUserOption[];
  onSelectUserForChat?: (user: AppUserOption) => void;
  onSelectConversation?: (convId: string) => void;
  currentUser: UserAccount;
  onSellItemWithTitle?: (title: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  isOpen,
  onClose,
  initialType = 'furniture',
  searchQuery,
  onSearchChange,
  furnitureList,
  savedItemIds = [],
  onSelectItem,
  onToggleSave,
  onViewAllResults,
  conversations = [],
  allUsers = [],
  onSelectUserForChat,
  onSelectConversation,
  currentUser,
  onSellItemWithTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'furniture' | 'messages'>(initialType);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    onSearchChange(val);
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
    inputRef.current?.focus();
  };

  // Filtered furniture results
  const filteredFurniture = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    if (!q) return furnitureList.slice(0, 10);

    return furnitureList.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const catMatch = item.category.toLowerCase().includes(q);
      const locMatch = item.location.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return titleMatch || catMatch || locMatch || descMatch;
    });
  }, [localQuery, furnitureList]);

  // Filtered users for messages
  const filteredUsers = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (u.id === currentUser.id) return false;
      const lowerName = u.name.toLowerCase();
      if (lowerName.includes('marcus') || lowerName.includes('gray')) return false;
      if (!q) return true;
      return (
        lowerName.includes(q) ||
        (u.location && u.location.toLowerCase().includes(q))
      );
    });
  }, [localQuery, allUsers, currentUser.id]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    const valid = conversations.filter(
      (c) =>
        !c.sellerName?.toLowerCase().includes('marcus') &&
        !c.sellerName?.toLowerCase().includes('gray') &&
        !c.itemTitle?.toLowerCase().includes('marcus')
    );
    if (!q) return valid;

    return valid.filter(
      (c) =>
        c.sellerName.toLowerCase().includes(q) ||
        (c.itemTitle && c.itemTitle.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  }, [localQuery, conversations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1. Header Bar: Go back option on top left, PinIn in the middle */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go Back Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name in the Middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          {/* Right spacer */}
          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* 2. Pinned Search Input Area (Never covered by keyboard) */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-3 shadow-xs">
        <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto space-y-2.5">
          {/* Search Input Box */}
          <div className="relative flex items-center">
            <div className="absolute left-3.5 pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>

            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              value={localQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={
                activeTab === 'furniture'
                  ? 'Search couches, tables, beds...'
                  : 'Search sellers or conversations...'
              }
              aria-label="Search"
              className="w-full bg-gray-100 text-gray-900 placeholder:text-gray-400 text-sm font-semibold pl-10 pr-10 py-3 rounded-2xl border border-gray-200 focus:bg-white focus:border-[#0052FF] focus:ring-2 focus:ring-[#0052FF]/20 focus:outline-none transition-all"
            />

            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search text"
                className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('furniture')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'furniture'
                  ? 'bg-white text-[#0052FF] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Furniture ({filteredFurniture.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-white text-[#0052FF] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sellers &amp; Chat ({filteredUsers.length})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Scrollable Results Area with generous bottom padding for mobile virtual keyboards */}
      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 py-3.5 pb-36">
        {activeTab === 'furniture' ? (
          <div>
            {/* Quick Actions / Results Count */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-500">
                {localQuery.trim()
                  ? `Results for "${localQuery}" (${filteredFurniture.length})`
                  : `Recent & Popular Listings (${filteredFurniture.length})`}
              </span>

              {localQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onViewAllResults();
                  }}
                  className="text-xs font-bold text-[#0052FF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Filter Page</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {filteredFurniture.length > 0 ? (
              <div className="space-y-2.5">
                {filteredFurniture.map((item) => {
                  const isSaved = savedItemIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="bg-white rounded-2xl border border-gray-200 p-2.5 flex items-center gap-3 shadow-xs hover:border-[#0052FF] transition-all cursor-pointer active:scale-[0.99]"
                    >
                      {/* Thumbnail with sharp 90-degree corners */}
                      <div className="relative w-18 h-18 rounded-none overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={getOptimizedImageUrl(item.imageUrl, { width: 400, quality: 70, format: 'webp' })}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-none"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute top-1 left-1 bg-[#0052FF] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                          R{item.price}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-[#0052FF] shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold bg-blue-50 text-[#0052FF] px-1.5 py-0.5 rounded">
                            {item.condition}
                          </span>
                          {item.distanceText && (
                            <span className="text-[10px] font-semibold text-gray-400">
                              {item.distanceText}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Save Button */}
                      {onToggleSave && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave(item.id, e);
                          }}
                          aria-label={isSaved ? 'Saved' : 'Save listing'}
                          className="p-2 text-gray-400 hover:text-[#0052FF] active:scale-90 transition-all shrink-0 cursor-pointer"
                        >
                          <Bookmark
                            className={`w-5 h-5 ${
                              isSaved ? 'fill-[#0052FF] text-[#0052FF]' : 'text-gray-400'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3 bg-white rounded-3xl border-2 border-gray-200 p-6 my-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm md:text-base font-black text-gray-900">
                    Be the first one to sell {localQuery.trim() ? `"${localQuery.trim()}"` : 'this item'}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    List it now on PinIn and connect with local buyers searching in your area.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSellItemWithTitle) {
                        onSellItemWithTitle(localQuery.trim());
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0052FF] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <span>Be the first one to sell {localQuery.trim() ? `"${localQuery.trim()}"` : 'an item'}</span>
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sellers & Chat Tab */
          <div>
            <div className="pb-2.5 mb-2 border-b border-gray-200">
              <span className="text-xs font-bold text-gray-500">
                {localQuery.trim()
                  ? `Sellers matching "${localQuery}" (${filteredUsers.length})`
                  : `Active Sellers & Members (${filteredUsers.length})`}
              </span>
            </div>

            {filteredUsers.length > 0 ? (
              <div className="space-y-2.5">
                {filteredUsers.map((targetUser) => (
                  <div
                    key={targetUser.id}
                    onClick={() => {
                      if (onSelectUserForChat) {
                        onSelectUserForChat(targetUser);
                      }
                    }}
                    className="bg-white rounded-2xl border border-gray-200 p-3 flex items-center justify-between gap-3 shadow-xs hover:border-[#0052FF] transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getOptimizedImageUrl(targetUser.avatar, { width: 150, quality: 75, format: 'webp' })}
                        alt={targetUser.name}
                        className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                          {targetUser.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#0052FF] shrink-0" />
                          <span className="truncate">{targetUser.location || 'Gauteng'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="py-1.5 px-3 bg-blue-50 text-[#0052FF] font-bold text-xs rounded-xl hover:bg-[#0052FF] hover:text-white transition-all flex items-center gap-1 shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 bg-white rounded-3xl border border-gray-200 p-6 my-4">
                <UserIcon className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-sm font-bold text-gray-800">
                  No sellers found matching "{localQuery}"
                </h3>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
