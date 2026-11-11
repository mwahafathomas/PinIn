import React, { useState, useEffect } from 'react';
import { FurnitureItem } from '../types/furniture';
import { BLANK_WHITE_IMAGE } from '../utils/imageOptimizer';
import { supabase } from '../supabaseClient';
import { Bookmark, MoreVertical, Flag } from 'lucide-react';

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
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    item.imageUrl && item.imageUrl !== BLANK_WHITE_IMAGE ? item.imageUrl : BLANK_WHITE_IMAGE
  );

  useEffect(() => {
    let isMounted = true;
    if (item.imageUrl && item.imageUrl !== BLANK_WHITE_IMAGE) {
      setThumbnailUrl(item.imageUrl);
      return;
    }

    const fetchThumbnail = async () => {
      try {
        const idStr = item.id.toString();
        const { data: files } = await supabase.storage.from('listing-images').list(idStr);
        if (!isMounted) return;
        if (files && files.length > 0) {
          const validFiles = files.filter((f) => !f.name.startsWith('.'));
          if (validFiles.length > 0) {
            const { data } = supabase.storage.from('listing-images').getPublicUrl(`${idStr}/${validFiles[0].name}`);
            if (data?.publicUrl) {
              setThumbnailUrl(data.publicUrl);
              return;
            }
          }
        }
        setThumbnailUrl(BLANK_WHITE_IMAGE);
      } catch {
        if (isMounted) setThumbnailUrl(BLANK_WHITE_IMAGE);
      }
    };

    fetchThumbnail();
    return () => {
      isMounted = false;
    };
  }, [item.id, item.imageUrl]);

  return (
    <div className="group relative flex flex-col bg-white rounded-none border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
      {/* Photo Container: ~80% of card height with sharp 90-degree corners (Swipeable without side arrows) */}
      <div
        className="relative aspect-4/5 w-full bg-white rounded-none overflow-hidden cursor-pointer"
        onClick={() => onSelect(item)}
      >
        {/* Shimmer skeleton while image loads */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse z-0" />
        )}

        <img
          src={thumbnailUrl || BLANK_WHITE_IMAGE}
          alt={item.title}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            setIsImageLoaded(true);
            const target = e.currentTarget;
            target.src = BLANK_WHITE_IMAGE;
          }}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 select-none ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        {/* 14: Price Blue Badge with Rand 'R' on top-left of photo */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          {item.salePrice !== undefined && item.salePrice !== null && item.salePrice > 0 ? (
            <div className="bg-[#2D8EDE] text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-sm flex flex-col items-start leading-tight">
              <span className="line-through text-white/70 text-[10px] font-semibold">
                R{item.originalPrice || item.price}
              </span>
              <span className="text-white text-xs font-black">
                R{item.salePrice}
              </span>
            </div>
          ) : (
            <div className="bg-[#2D8EDE] text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
              <span>R{item.price}</span>
            </div>
          )}
        </div>



        {/* Save Icon (Bookmark) on top-right of photo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(item.id, e);
          }}
          aria-label={isSaved ? 'Remove from saved' : 'Save item'}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-[#2D8EDE] active:scale-90 transition-all shadow-xs cursor-pointer"
        >
          <Bookmark
            className={`w-4 h-4 ${
              isSaved
                ? 'fill-[#2D8EDE] text-[#2D8EDE]'
                : 'text-gray-700 hover:text-[#2D8EDE]'
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

        {/* Category */}
        <div className="mt-0.5 flex items-center justify-between gap-1 text-gray-500 text-[11px]">
          <span className="truncate">{item.category}</span>
        </div>
      </div>
    </div>
  );
};
