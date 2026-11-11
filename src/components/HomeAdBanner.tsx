import React, { useState, useEffect, useRef } from 'react';
import { fetchActiveHomeAds, AdItem } from '../services/adsService';

interface HomeAdBannerProps {
  onAdClick?: (link?: string) => void;
}

export const HomeAdBanner: React.FC<HomeAdBannerProps> = ({ onAdClick }) => {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    fetchActiveHomeAds().then((data) => {
      if (isMounted) {
        setAds(data);
      }
    });

    const handleFocus = () => {
      fetchActiveHomeAds().then((data) => {
        if (isMounted) setAds(data);
      });
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Collect all images across active ads (where status = 'show')
  const allImages: { url: string; link?: string; title?: string }[] = [];
  ads.forEach((ad) => {
    ad.images.forEach((img) => {
      allImages.push({
        url: img,
        link: ad.link_url,
        title: ad.title,
      });
    });
  });

  // If no active ads with status = 'show', do not show anything
  if (allImages.length === 0) {
    return null;
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container && container.clientWidth > 0) {
      const idx = Math.round(container.scrollLeft / container.clientWidth);
      if (idx !== activeImageIndex && idx >= 0 && idx < allImages.length) {
        setActiveImageIndex(idx);
      }
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-7xl mx-auto px-3.5 md:px-6 lg:px-8 pt-1 pb-3">
      {/* 
        Container matching the width of the two listings side-by-side.
        Aspect ratio: 16:9 on mobile / 2:1 on wider displays (approx 220-250px height).
        Pure swipe left/right without any < & > arrow buttons.
        Zero mention of the word 'ad'.
      */}
      <div className="relative w-full aspect-16/9 sm:aspect-2/1 max-h-[250px] bg-gray-100 border border-gray-200 overflow-hidden shadow-xs">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x"
        >
          {allImages.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (item.link && onAdClick) {
                  onAdClick(item.link);
                }
              }}
              className={`w-full h-full shrink-0 snap-center relative bg-gray-100 ${
                item.link ? 'cursor-pointer' : ''
              }`}
            >
              <img
                src={item.url}
                alt={item.title || `Promotional Banner ${idx + 1}`}
                className="w-full h-full object-cover select-none pointer-events-none"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Clean dot indicators if there are multiple images */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full pointer-events-none">
            {allImages.map((_, dotIdx) => (
              <div
                key={dotIdx}
                className={`transition-all duration-200 rounded-full ${
                  dotIdx === activeImageIndex
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
