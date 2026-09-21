import React from 'react';
import {
  ChevronLeft,
  SlidersHorizontal,
  MapPin,
  Bookmark,
} from 'lucide-react';
import { FurnitureItem, FilterState } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface FilterResultsPageProps {
  isOpen: boolean;
  onClose: () => void;
  onEditFilters: () => void;
  items: FurnitureItem[];
  filters: FilterState;
  appliedCount: number;
  onSelectItem: (item: FurnitureItem) => void;
  savedItemIds?: string[];
  onToggleSave?: (itemId: string, e: React.MouseEvent) => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  onOpenSell?: () => void;
}

export const FilterResultsPage: React.FC<FilterResultsPageProps> = ({
  isOpen,
  onClose,
  onEditFilters,
  items,
  filters,
  appliedCount,
  onSelectItem,
  savedItemIds = [],
  onToggleSave,
  onOpenSell,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Subheader Bar */}
      <div className="shrink-0 bg-white/95 backdrop-blur-xs border-b border-gray-200">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
              <span>Results</span>
            </h1>
            <span className="text-xs font-bold text-gray-500">
              ({items.length})
            </span>
          </div>

          <button
            type="button"
            onClick={onEditFilters}
            className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-blue-50 hover:bg-blue-100 active:scale-95 text-[#0052FF] text-xs font-bold transition-all border border-blue-200/80 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit Filters</span>
            {appliedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0052FF] text-white text-[10px] font-black flex items-center justify-center">
                {appliedCount}
              </span>
            )}
          </button>
        </div>

        {/* Categories Chips if active */}
        {((filters.categories && filters.categories.length > 0) || (filters.category && filters.category !== 'all')) && (
          <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {filters.categories && filters.categories.length > 0 ? (
              filters.categories.map((cat) => (
                <span
                  key={cat}
                  className="bg-blue-100/80 text-[#0052FF] font-extrabold text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap capitalize shrink-0"
                >
                  {cat.split('/')[0].trim()}
                </span>
              ))
            ) : filters.category && filters.category !== 'all' ? (
              <span className="bg-blue-100/80 text-[#0052FF] font-extrabold text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap capitalize shrink-0">
                {filters.category}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Main Grid Area (Scrollable in middle) */}
      <main className="flex-1 w-full max-w-md md:max-w-7xl mx-auto overflow-y-auto px-3 md:px-6 lg:px-8 pt-3 pb-6">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
            {items.map((item) => {
              const isSaved = savedItemIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="group bg-white rounded-none border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
                >
                  {/* Photo Container with sharp 90-degree corners */}
                  <div className="relative aspect-4/3 bg-gray-100 rounded-none overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(item.imageUrl, { width: 400, quality: 70, format: 'webp' })}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-none"
                      loading="lazy"
                      decoding="async"
                    />

                    {/* Price Blue Badge with Rand 'R' */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className="bg-[#0052FF] text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                        <span>R{item.price}</span>
                      </div>
                    </div>

                    {/* Bookmark Save Button */}
                    {onToggleSave && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(item.id, e);
                        }}
                        aria-label={isSaved ? 'Remove from saved' : 'Save item'}
                        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-[#0052FF] active:scale-90 transition-all shadow-xs cursor-pointer"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${
                            isSaved
                              ? 'fill-[#0052FF] text-[#0052FF]'
                              : 'text-gray-700 hover:text-[#0052FF]'
                          }`}
                        />
                      </button>
                    )}

                    {/* Condition Pill */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className="bg-black/60 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                        {item.condition}
                      </span>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-xs text-gray-900 line-clamp-1 group-hover:text-[#0052FF] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-[#0052FF] shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-400 capitalize truncate max-w-[80px]">
                        {item.category}
                      </span>
                      {item.distanceText && (
                        <span className="font-bold text-[#0052FF] bg-blue-50 px-1.5 py-0.2 rounded text-[10px]">
                          {item.distanceText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="my-auto py-16 text-center space-y-3 bg-white rounded-3xl border-2 border-gray-200 p-6">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-gray-900">
              No matching listings
            </h2>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              We couldn't find any furniture matching these active filters.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              {onOpenSell && (
                <button
                  type="button"
                  onClick={onOpenSell}
                  className="w-full sm:w-auto py-2.5 px-5 bg-[#0052FF] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  Be the first one to sell
                </button>
              )}
              <button
                type="button"
                onClick={onEditFilters}
                className="w-full sm:w-auto py-2 px-4 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Modify Filters
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
