import React, { useState, useEffect, useRef } from 'react';
import { FurnitureItem } from '../types/furniture';
import { FurnitureCard } from './FurnitureCard';
import { ChevronDown } from 'lucide-react';

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

const PAGE_SIZE = 12;

/**
 * Modern shimmer skeleton placeholder for listing cards.
 */
export const FurnitureCardShimmer: React.FC = () => {
  return (
    <div className="bg-white rounded-none border border-gray-200 overflow-hidden shadow-2xs animate-pulse">
      {/* Shimmer Image Box */}
      <div className="aspect-4/5 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden">
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Hook 1: Reset visible count when items list changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items]);

  // Hook 2: Infinite scroll IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && visibleCount < items.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, items.length, isLoadingMore]);

  // Hook 3: If coming from categories with 0 items, automatically reset filters
  useEffect(() => {
    if (!isLoading && items.length === 0 && onResetFilters) {
      onResetFilters();
    }
  }, [items.length, onResetFilters, isLoading]);

  // Early return for loading skeleton state (AFTER all hooks have been called)
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

  // Early return for empty items state (AFTER all hooks have been called)
  if (items.length === 0) {
    return null;
  }

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className="w-full max-w-md md:max-w-7xl mx-auto px-3.5 md:px-6 lg:px-8 pt-3.5 pb-8 md:pt-6 md:pb-12">
      {/* 2-column on mobile, 3-column on tablet and desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6">
        {visibleItems.map((item) => (
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

      {/* Shimmer skeleton while loading more */}
      {isLoadingMore && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-6 mt-4">
          {Array.from({ length: Math.min(4, items.length - visibleCount) }).map((_, idx) => (
            <FurnitureCardShimmer key={`more-${idx}`} />
          ))}
        </div>
      )}

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="h-6 w-full" />

      {/* Pagination button fallback */}
      {hasMore && !isLoadingMore && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length))}
            className="py-2.5 px-6 rounded-full bg-white border border-gray-300 hover:border-[#2D8EDE] text-gray-800 hover:text-[#2D8EDE] text-xs font-black shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Load more items</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-gray-400 font-bold mt-2">
            Showing {visibleItems.length} of {items.length} items
          </p>
        </div>
      )}
    </div>
  );
};
