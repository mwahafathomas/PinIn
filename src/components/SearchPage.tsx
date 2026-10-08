import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  Search,
  X,
  Tag,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { FurnitureItem, UserAccount } from '../types/furniture';
import { recordSearchQuery } from '../services/ordersService';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface SearchPageProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  furnitureList?: FurnitureItem[];
  savedItemIds?: string[];
  onSelectItem?: (item: FurnitureItem) => void;
  onToggleSave?: (id: string, e: React.MouseEvent) => void;
  onViewAllResults: () => void;
  currentUser?: UserAccount;
  // Deprecated props kept optional for backwards compatibility
  initialType?: any;
  conversations?: any[];
  allUsers?: any[];
  onSelectUserForChat?: (user: any) => void;
  onSelectConversation?: (convId: string) => void;
  onSellItemWithTitle?: (title: string) => void;
  onRequireAuth?: () => void;
}

const DEFAULT_CATEGORIES = [
  'TV & Media Units',
  'Sofas & Couches',
  'Beds & Mattresses',
  'Dining Tables & Chairs',
  'Coffee Tables',
  'Desks & Office Furniture',
  'Wardrobes & Cupboards',
  'Outdoor & Patio',
  'Side Tables & Nightstands',
  'Bookshelves & Storage',
];

export const SearchPage: React.FC<SearchPageProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  furnitureList = [],
  onSelectItem,
  onViewAllResults,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Fake load content first like in cart page
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 600);

      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);

      return () => {
        clearTimeout(timer);
        clearTimeout(focusTimer);
      };
    }
  }, [isOpen]);

  // Debounced search recording to Supabase
  useEffect(() => {
    const trimmed = localQuery.trim();
    if (trimmed.length >= 2) {
      const timer = setTimeout(() => {
        recordSearchQuery(trimmed);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [localQuery]);

  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    onSearchChange(val);
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleSelectTerm = (term: string) => {
    onSearchChange(term);
    onViewAllResults();
  };

  // Find all listings matching the query anywhere in title, desc, brand, category, etc.
  const matchingListings = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    if (!q) return [];
    return (furnitureList || []).filter((item) => {
      const inTitle = item.title?.toLowerCase().includes(q);
      const inDesc = item.description?.toLowerCase().includes(q);
      const inCat = item.category?.toLowerCase().includes(q);
      const inBrand = item.brand?.toLowerCase().includes(q);
      const inMaterial = item.material?.toLowerCase().includes(q);
      const inLocation = item.location?.toLowerCase().includes(q);
      const inInfo = (item as any).productInformation?.toLowerCase().includes(q);
      return inTitle || inDesc || inCat || inBrand || inMaterial || inLocation || inInfo;
    });
  }, [localQuery, furnitureList]);

  // Categories suggestions matching current query
  const matchingCategories = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    if (!q) return DEFAULT_CATEGORIES;
    return DEFAULT_CATEGORIES.filter((cat) => cat.toLowerCase().includes(q));
  }, [localQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1. Header Bar: Go back option on top left, PinIn in the middle */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* 2. Top Search Input Bar */}
      <div className="shrink-0 bg-white border-b border-gray-200 p-3 shadow-xs">
        <div className="w-full max-w-md md:max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (localQuery.trim()) {
                handleSelectTerm(localQuery.trim());
              }
            }}
            className="relative flex items-center bg-gray-100/90 rounded-2xl px-3.5 py-2.5 border border-gray-200/80 focus-within:border-[#2D8EDE] focus-within:bg-white transition-all"
          >
            <Search className="w-4 h-4 text-[#2D8EDE] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search couches, TV, tables, beds..."
              aria-label="Search furniture"
              className="w-full bg-transparent px-2.5 text-xs sm:text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
            />
            {localQuery.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 3. Search Results Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          /* Shimmer Skeleton Loader */
          <div className="space-y-3 animate-pulse pt-1">
            <div className="h-4 w-32 bg-gray-200 rounded-md" />
            <div className="bg-white rounded-3xl border border-gray-200 p-3 space-y-3 shadow-xs">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-gray-200" />
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : localQuery.trim().length > 0 ? (
          /* When user types search query (e.g. "apple"), show matching listings directly */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Results for "{localQuery.trim()}" ({matchingListings.length})
              </span>
            </div>

            {matchingListings.length > 0 ? (
              <div className="space-y-2.5">
                {matchingListings.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onSelectItem) {
                        onSelectItem(item);
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-200 hover:border-[#2D8EDE] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={getOptimizedImageUrl(item.imageUrl, { width: 160, quality: 75, format: 'webp' })}
                        alt={item.title}
                        className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <span className="text-xs font-black text-[#2D8EDE] shrink-0">
                          R{item.price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleSelectTerm(localQuery.trim())}
                  className="w-full py-3 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer mt-3"
                >
                  View all results on marketplace
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
                <p className="text-sm font-bold text-gray-800">
                  No listings found containing "{localQuery.trim()}"
                </p>
                <p className="text-xs text-gray-500">
                  Try searching with a different word or explore categories below.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* When search query is empty, show Categories */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Categories
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
              {matchingCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleSelectTerm(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4 text-[#2D8EDE]" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      {category}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#2D8EDE] group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
