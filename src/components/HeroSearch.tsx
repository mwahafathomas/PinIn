import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onClearSearch: () => void;
  hasLocationPermission?: boolean;
  isLocating?: boolean;
  onRequestLocation?: () => void;
  onDisableLocation?: () => void;
  nearbyCount?: number;
  onOpenSearchPage?: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  hasLocationPermission = false,
  isLocating = false,
  onRequestLocation,
  onDisableLocation,
  nearbyCount = 0,
  onOpenSearchPage,
}) => {
  return (
    <div className="relative w-full overflow-hidden border-b border-gray-200 bg-gray-50">
      {/* Search Furniture space container */}
      <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 md:px-6 pt-3.5 pb-3 sm:py-4 md:py-5">
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={onOpenSearchPage}
            className="absolute left-3.5 text-gray-500 hover:text-[#2D8EDE] transition-colors cursor-pointer"
            aria-label="Open search page"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* White input box that opens full search page when clicked */}
          <div
            onClick={onOpenSearchPage}
            className="w-full bg-white text-gray-900 text-sm md:text-base font-medium pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-gray-300/80 shadow-md cursor-pointer flex items-center transition-all select-none hover:border-[#2D8EDE]"
          >
            <span className={searchQuery ? 'text-gray-900 font-semibold truncate' : 'text-gray-500'}>
              {searchQuery || 'search furniture'}
            </span>
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearSearch();
              }}
              aria-label="Clear search"
              className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
