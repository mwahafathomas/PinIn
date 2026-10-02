import React from 'react';
import { FurnitureItem } from '../types/furniture';
import { FurnitureCard } from './FurnitureCard';
import { RefreshCw } from 'lucide-react';

interface FurnitureGridProps {
  items: FurnitureItem[];
  savedItemIds: string[];
  onSelectItem: (item: FurnitureItem) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onShareItem: (item: FurnitureItem, e: React.MouseEvent) => void;
  onMessageSeller: (item: FurnitureItem, e: React.MouseEvent) => void;
  onResetFilters?: () => void;
  showDistance?: boolean;
  isLoading?: boolean;
}

/**
 * Modern shimmer skeleton placeholder for listing cards.
 */
export const FurnitureCardShimmer: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs animate-pulse">
      {/* Shimmer Image Box */}
      <div className="aspect-4/3 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden">
        <div className="absolute top-2 left-2 w-14 h-5 bg-gray-300 rounded-md" />
      </div>
      {/* Shimmer Details */}
      <div className="p-3 space-y-2.5">
        <div className="h-4 w-4/5 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
        <div className="h-5 w-1/3 bg-gray-200 rounded-md pt-1" />
        <div className="flex justify-between items-center pt-1 border-t border-gray-100">
          <div className="h-3 w-1/3 bg-gray-200 rounded" />
          <div className="h-3 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export const FurnitureGrid: React.FC<FurnitureGridProps> = ({
  items,
  savedItemIds,
  onSelectItem,
  onToggleSave,
  onShareItem,
  onMessageSeller,
  onResetFilters,
  showDistance = false,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-3.5 md:px-6 lg:px-8 pt-3.5 pb-6 md:pt-6 md:pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <FurnitureCardShimmer key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-md md:max-w-xl mx-auto px-4 py-16 text-center">
        <h3 className="text-base font-bold text-gray-900 mb-1">No furniture found</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
          We couldn't find any furniture matching your current search or filters.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D8EDE] text-white text-sm font-semibold hover:bg-[#2579BE] active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reset all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md md:max-w-7xl mx-auto px-3.5 md:px-6 lg:px-8 pt-3.5 pb-6 md:pt-6 md:pb-8">
      {/* 2-column on mobile, 3-column on tablet and desktop preview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6">
        {items.map((item) => (
          <FurnitureCard
            key={item.id}
            item={item}
            isSaved={savedItemIds.includes(item.id)}
            onSelect={onSelectItem}
            onToggleSave={onToggleSave}
            onShare={onShareItem}
            onMessageSeller={onMessageSeller}
            showDistance={showDistance}
            showMenuDots={false}
          />
        ))}
      </div>
    </div>
  );
};
