import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  Search,
  X,
  MapPin,
  Bookmark,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { FurnitureItem, UserAccount } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { recordSearchQuery } from '../services/ordersService';

interface SearchPageProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  furnitureList: FurnitureItem[];
  savedItemIds?: string[];
  onSelectItem: (item: FurnitureItem) => void;
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

export const SearchPage: React.FC<SearchPageProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  furnitureList,
  savedItemIds = [],
  onSelectItem,
  onToggleSave,
  onViewAllResults,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Debounced search recording to Supabase `most_searched_items` table
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

  // Filtered furniture results
  const filteredFurniture = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    if (!q) return furnitureList.slice(0, 15);

    return furnitureList.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const catMatch = item.category.toLowerCase().includes(q);
      const locMatch = item.location.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      return titleMatch || catMatch || locMatch || descMatch;
    });
  }, [localQuery, furnitureList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1. Header Bar: Go back option on top left, PinIn in the middle */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
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
          <div className="relative flex items-center bg-gray-100/90 rounded-2xl px-3.5 py-2.5 border border-gray-200/80 focus-within:border-[#2D8EDE] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search couches, dining tables, beds..."
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
          </div>
        </div>
      </div>

      {/* 3. Results Area */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 py-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
          <span className="text-xs font-bold text-gray-500">
            {localQuery.trim()
              ? `Results for "${localQuery}" (${filteredFurniture.length})`
              : 'Popular Furniture in Gauteng'}
          </span>
          {filteredFurniture.length > 0 && (
            <button
              type="button"
              onClick={onViewAllResults}
              className="text-xs font-extrabold text-[#2D8EDE] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View in Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {filteredFurniture.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredFurniture.map((item) => {
              const isSaved = savedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="py-3 flex items-center gap-3.5 cursor-pointer group active:bg-gray-100/60 rounded-xl px-1 -mx-1 transition-colors"
                >
                  <img
                    src={getOptimizedImageUrl(item.imageUrl, { width: 140, quality: 75, format: 'webp' })}
                    alt={item.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-gray-200 shrink-0 group-hover:scale-102 transition-transform"
                    loading="lazy"
                    decoding="async"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-black text-[#2D8EDE] text-xs sm:text-sm">
                        R{item.price}
                      </span>
                      <span className="text-gray-300 text-xs">•</span>
                      <span className="text-[11px] font-bold text-gray-500 truncate flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-400" />
                        {item.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-[#2D8EDE] shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold bg-blue-50 text-[#2D8EDE] px-1.5 py-0.5 rounded">
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
                      className="p-2 text-gray-400 hover:text-[#2D8EDE] active:scale-90 transition-all shrink-0 cursor-pointer"
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          isSaved ? 'fill-[#2D8EDE] text-[#2D8EDE]' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3 bg-white rounded-3xl border border-gray-200 p-6 my-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm md:text-base font-black text-gray-900">
                No furniture found matching "{localQuery}"
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Try searching for broader keywords like couch, table, bed, or explore categories.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
