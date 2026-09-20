import React, { useState, useRef } from 'react';
import { FurnitureItem } from '../types/furniture';
import { MapPin, Bookmark, MoreVertical, Flag } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface FurnitureCardProps {
  item: FurnitureItem;
  isSaved?: boolean;
  onSelect: (item: FurnitureItem) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onShare?: (item: FurnitureItem, e: React.MouseEvent) => void;
  onMessageSeller?: (item: FurnitureItem, e: React.MouseEvent) => void;
  showDistance?: boolean;
  showMenuDots?: boolean;
}

export const FurnitureCard: React.FC<FurnitureCardProps> = ({
  item,
  isSaved = false,
  onSelect,
  onToggleSave,
  onShare,
  onMessageSeller,
  showDistance = false,
  showMenuDots = true,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const rawImages =
    item.images && item.images.length > 0
      ? item.images
      : item.additionalImages && item.additionalImages.length > 0
      ? [item.imageUrl, ...item.additionalImages]
      : [item.imageUrl];

  const allImages = rawImages.map((img) =>
    getOptimizedImageUrl(img, { width: 600, quality: 70, format: 'webp' })
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const container = e.currentTarget;
    if (container && container.clientWidth > 0) {
      const idx = Math.round(container.scrollLeft / container.clientWidth);
      if (idx !== activeImageIndex && idx >= 0 && idx < allImages.length) {
        setActiveImageIndex(idx);
      }
    }
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-none border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
      {/* Photo Container: ~80% of card height with sharp 90-degree corners (Swipeable without side arrows) */}
      <div
        className="relative aspect-4/5 w-full bg-gray-100 rounded-none overflow-hidden cursor-pointer"
        onClick={() => onSelect(item)}
      >
        {allImages.length > 1 ? (
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x"
          >
            {allImages.map((img, idx) => (
              <div
                key={idx}
                className="w-full h-full shrink-0 snap-center relative bg-gray-100"
              >
                <img
                  src={img}
                  alt={`${item.title} photo ${idx + 1}`}
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <img
            src={getOptimizedImageUrl(item.imageUrl, { width: 600, quality: 70, format: 'webp' })}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        )}

        {/* 14: Price Blue Badge with Rand 'R' on top-left of photo */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <div className="bg-[#0052FF] text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
            <span>R{item.price}</span>
          </div>
        </div>

        {/* Condition tag on bottom-left of photo */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {item.condition}
          </span>
        </div>

        {/* Multiple images indicator dots (Subtle, no side arrows) */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-xs pointer-events-none">
            {allImages.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  activeImageIndex === i ? 'w-3 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Save Icon (Bookmark) on top-right of photo */}
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

        {/* 3-dots Menu Icon on bottom-right of photo */}
        {showMenuDots && (
          <div className="absolute bottom-2 right-2 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              aria-label="More options"
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-gray-900 active:scale-90 transition-all shadow-xs cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                className="absolute bottom-8 right-0 w-32 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20 text-xs font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onSelect(item);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5 text-red-500" />
                  <span>Report</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section: Compact name & location */}
      <div
        className="px-2.5 py-2 bg-white flex flex-col justify-center cursor-pointer border-t border-gray-100 min-h-[3.25rem]"
        onClick={() => onSelect(item)}
      >
        {/* Furniture Name */}
        <h3 className="font-bold text-gray-900 text-xs leading-tight truncate">
          {item.title}
        </h3>

        {/* Location & Distance */}
        <div className="mt-0.5 flex items-center justify-between gap-1 text-gray-500 text-[11px]">
          <div className="flex items-center gap-1 min-w-0 truncate">
            <MapPin className="w-3 h-3 shrink-0 text-[#0052FF]" />
            <span className="truncate">{item.location}</span>
          </div>
          {showDistance && item.distanceText && (
            <span className="shrink-0 font-bold text-[#0052FF] bg-blue-50 px-1.5 py-0.2 rounded text-[10px]">
              {item.distanceText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
