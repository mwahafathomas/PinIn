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
          <div className="absolute left-3.5 pointer-events-none text-gray-500">
            <Search className="w-5 h-5" />
          </div>

          {/* White input box where users type */}
          <input
            type="text"
            value={searchQuery}
            onClick={() => {
              if (onOpenSearchPage) onOpenSearchPage();
            }}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="search furniture"
            aria-label="Search furniture"
            className="w-full bg-white text-gray-900 placeholder:text-gray-500 text-sm md:text-base font-medium pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-gray-300/80 shadow-md focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all cursor-pointer"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Distance & Geolocation permission pill when active */}
        {hasLocationPermission && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="w-full flex items-center justify-between bg-white/95 border border-emerald-200/80 rounded-lg px-2.5 py-1 shadow-xs text-[11px] text-gray-700">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-800 truncate">
                  {searchQuery.trim()
                    ? `Showing nearby results (< 50 km) first with distances`
                    : nearbyCount > 0
                    ? `Showing ${nearbyCount} nearby listings (< 50 km) first`
                    : `Location active · Distances in km enabled`}
                </span>
              </div>

              <button
                type="button"
                onClick={onDisableLocation}
                className="text-[10px] text-gray-400 hover:text-red-600 font-medium ml-2 underline shrink-0 cursor-pointer"
                title="Turn off distance tracking"
              >
                Disable
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
