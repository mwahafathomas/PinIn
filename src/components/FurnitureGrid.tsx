import React from 'react';
import { FurnitureItem } from '../types/furniture';
import { FurnitureCard } from './FurnitureCard';
import { Sparkles, RefreshCw } from 'lucide-react';

interface FurnitureGridProps {
  items: FurnitureItem[];
  savedItemIds: string[];
  onSelectItem: (item: FurnitureItem) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onShareItem: (item: FurnitureItem, e: React.MouseEvent) => void;
  onMessageSeller: (item: FurnitureItem, e: React.MouseEvent) => void;
  onResetFilters?: () => void;
  showDistance?: boolean;
}

export const FurnitureGrid: React.FC<FurnitureGridProps> = ({
  items,
  savedItemIds,
  onSelectItem,
  onToggleSave,
  onShareItem,
  onMessageSeller,
  onResetFilters,
  showDistance = false,
}) => {
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052FF] text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm cursor-pointer"
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
