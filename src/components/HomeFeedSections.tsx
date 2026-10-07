import React, { useEffect, useState, useMemo } from 'react';
import { FurnitureItem } from '../types/furniture';
import { fetchHomeAdverts, AdvertItem } from '../services/advertsService';
import { fetchDepartments, DepartmentItem } from '../services/departmentsService';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { Bookmark, MapPin } from 'lucide-react';

interface HomeFeedSectionsProps {
  items: FurnitureItem[];
  savedItemIds: string[];
  onSelectItem: (item: FurnitureItem) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  isLoading?: boolean;
}

export const HomeFeedSections: React.FC<HomeFeedSectionsProps> = ({
  items,
  savedItemIds,
  onSelectItem,
  onToggleSave,
  isLoading = false,
}) => {
  const [adverts, setAdverts] = useState<Record<number, AdvertItem>>({});
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  useEffect(() => {
    fetchHomeAdverts().then(setAdverts).catch(console.warn);
    fetchDepartments().then(setDepartments).catch(console.warn);
  }, []);

  // Filter listings for "Trending items"
  // Checks if seller/admin wrote "Trending items" in the column
  const trendingListings = useMemo(() => {
    const matched = items.filter((item) => {
      const tag = (item.trendingTag || '').toLowerCase().trim();
      return tag === 'trending items' || tag.includes('trending');
    });

    // If none are tagged yet in Supabase, show top active listings as fallback so section is populated
    if (matched.length === 0) {
      return items.slice(0, 8);
    }
    return matched;
  }, [items]);

  // Filter listings for "What you might like"
  // Checks if seller/admin wrote "what you might like" in the column
  const whatYouMightLikeListings = useMemo(() => {
    const matched = items.filter((item) => {
      const tag = (item.whatYouMightLike || '').toLowerCase().trim();
      return tag === 'what you might like' || tag.includes('might like');
    });

    // If none are tagged yet in Supabase, show recommended items
    if (matched.length === 0) {
      // Pick items different from trending if possible
      const trendingIds = new Set(trendingListings.map((i) => i.id));
      const remaining = items.filter((i) => !trendingIds.has(i.id));
      return remaining.length > 0 ? remaining.slice(0, 8) : items.slice(0, 8);
    }
    return matched;
  }, [items, trendingListings]);

// Non-clickable Advertisement Card Component
interface AdvertBannerProps {
  slotNumber: number;
  fallbackAlt: string;
  adv?: AdvertItem;
}

const AdvertBanner: React.FC<AdvertBannerProps> = ({
  slotNumber,
  fallbackAlt,
  adv,
}) => {
  const defaultImage =
    slotNumber === 1
      ? 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=80'
      : slotNumber === 2
      ? 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1600&auto=format&fit=crop&q=80';

  const imageUrl = adv?.image_url || defaultImage;

  return (
    <section
      aria-label={`Advertisement ${slotNumber}`}
      className="px-4 w-full select-none cursor-default"
    >
      <div className="w-full overflow-hidden rounded-none">
        <img
          src={getOptimizedImageUrl(imageUrl, { width: 1600, quality: 85, format: 'webp' })}
          alt={adv?.title || fallbackAlt}
          className="w-full h-auto object-contain rounded-none pointer-events-none select-none block"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
};

  // Horizontal Card Component for Listings
  const renderHorizontalListing = (item: FurnitureItem) => {
    const isSaved = savedItemIds.includes(item.id);

    return (
      <div
        key={item.id}
        onClick={() => onSelectItem(item)}
        className="w-38 sm:w-48 shrink-0 bg-white border border-gray-200 rounded-none overflow-hidden shadow-2xs hover:shadow-md active:scale-[0.98] transition-all flex flex-col cursor-pointer group"
      >
        {/* Photo Container - displays FULL uncropped image */}
        <div className="relative aspect-4/3 bg-gray-50 flex items-center justify-center overflow-hidden">
          <img
            src={getOptimizedImageUrl(item.imageUrl, { width: 500, quality: 75, format: 'webp' })}
            alt={item.title}
            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />

          {/* Price Blue Badge with Rand 'R' */}
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-[#2D8EDE] text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
              <span>R{item.price}</span>
            </div>
          </div>

          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={(e) => onToggleSave(item.id, e)}
            aria-label={isSaved ? 'Remove from saved' : 'Save item'}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-sm transition-transform active:scale-90"
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${
                isSaved ? 'fill-[#2D8EDE] text-[#2D8EDE]' : 'text-gray-600'
              }`}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-900 truncate leading-snug">
              {item.title}
            </h3>
            <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span>{item.location || 'Gauteng'}</span>
            </p>
          </div>

          <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="truncate max-w-[85px]">{item.condition}</span>
            <span className="text-[#2D8EDE] font-extrabold text-[10px] uppercase">
              Free delivery
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-5 pb-6">
      {/* 1. Start with "Trending items" */}
      <div className="px-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
          Trending items
        </h2>
      </div>

      {/* Trending items listings (horizontally) */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-38 sm:w-48 h-56 shrink-0 bg-gray-100 border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : trendingListings.length > 0 ? (
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar scroll-smooth px-4 py-1">
            {trendingListings.map(renderHorizontalListing)}
          </div>
        ) : (
          <div className="px-4 py-4 text-xs text-gray-500">
            No trending listings available.
          </div>
        )}
      </div>

      {/* 2. Followed by "Shop by category" */}
      <div className="px-4 pt-1">
        <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
          Shop by category
        </h2>
      </div>

      {/* Categories horizontal preview circles */}
      <div className="w-full px-4">
        <div className="flex items-start justify-between gap-3 overflow-x-auto no-scrollbar py-1">
          {departments.map((dept) => (
            <div
              key={dept.id || dept.name}
              className="flex flex-col items-center gap-1.5 shrink-0 select-none cursor-default"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-2xs bg-gray-100 flex items-center justify-center">
                <img
                  src={getOptimizedImageUrl(dept.image_url, { width: 160, quality: 75, format: 'webp' })}
                  alt={dept.name}
                  className="w-full h-full object-cover pointer-events-none select-none"
                  loading="lazy"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 text-center capitalize max-w-[76px] leading-tight">
                {dept.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Followed by "Ad 1" */}
      <AdvertBanner slotNumber={1} fallbackAlt="Advertisement 1" adv={adverts[1]} />

      {/* 4. Followed by "Items you might like" */}
      <div className="px-4">
        <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
          Items you might like
        </h2>
      </div>

      {/* Items you might like listings (horizontally) */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-38 sm:w-48 h-56 shrink-0 bg-gray-100 border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : whatYouMightLikeListings.length > 0 ? (
          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar scroll-smooth px-4 py-1">
            {whatYouMightLikeListings.map(renderHorizontalListing)}
          </div>
        ) : (
          <div className="px-4 py-4 text-xs text-gray-500">
            No recommended listings available.
          </div>
        )}
      </div>

      {/* 5. Followed by "Ad 2" & "Ad 3" */}
      <AdvertBanner slotNumber={2} fallbackAlt="Advertisement 2" adv={adverts[2]} />
      <AdvertBanner slotNumber={3} fallbackAlt="Advertisement 3" adv={adverts[3]} />
    </div>
  );
};
