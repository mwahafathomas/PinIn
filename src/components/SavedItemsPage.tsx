import React, { useState } from 'react';
import {
  ChevronLeft,
  Bookmark,
  Trash2,
  MapPin,
} from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { FurnitureItem } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface SavedItemsPageProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: FurnitureItem[];
  onSelectItem: (item: FurnitureItem) => void;
  onRemoveSaved: (id: string, e: React.MouseEvent) => void;
  onOpenSearch?: () => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

interface SwipeableSavedCardProps {
  item: FurnitureItem;
  onSelectItem: (item: FurnitureItem) => void;
  onRemoveSaved: (id: string, e: React.MouseEvent) => void;
}

const SwipeableSavedCard: React.FC<SwipeableSavedCardProps> = ({
  item,
  onSelectItem,
  onRemoveSaved,
}) => {
  const x = useMotionValue(0);
  const [isOpen, setIsOpen] = useState(false);

  // Trash button opacity and scale based on left drag
  const deleteOpacity = useTransform(x, [0, -30, -70], [0, 0.6, 1]);
  const deleteScale = useTransform(x, [0, -40, -80], [0.7, 0.9, 1]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -40 || info.velocity.x < -300) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl group select-none">
      {/* Background Revealed Action: Red Delete / Recycle Bin button on the right */}
      <div className="absolute inset-y-0 right-0 w-24 bg-red-600 rounded-3xl flex items-center justify-center pr-1 z-0 shadow-inner">
        <motion.button
          type="button"
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          onClick={(e) => onRemoveSaved(item.id, e)}
          className="flex flex-col items-center justify-center text-white hover:text-red-100 active:scale-95 transition-transform p-3 w-full h-full cursor-pointer"
          aria-label="Remove from saved"
        >
          <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center shadow-md">
            <Trash2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] font-extrabold mt-1">Remove</span>
        </motion.button>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -90, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={{ x: isOpen ? -85 : 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        style={{ x }}
        onClick={() => {
          if (!isOpen) {
            onSelectItem(item);
          } else {
            setIsOpen(false);
          }
        }}
        className="relative z-10 bg-white rounded-3xl border-2 border-gray-200 p-3.5 shadow-xs hover:border-[#0052FF] transition-colors flex items-center gap-3.5 cursor-pointer group touch-pan-y"
      >
        {/* Image with sharp 90-degree corners */}
        <div className="relative w-20 h-20 rounded-none overflow-hidden bg-gray-100 shrink-0 border border-gray-200 pointer-events-none">
          <img
            src={getOptimizedImageUrl(item.imageUrl, { width: 400, quality: 70, format: 'webp' })}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-none"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
            {item.condition}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pointer-events-none">
          <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
            {item.title}
          </h3>
          <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-[#0052FF] shrink-0" />
            <span>{item.location}</span>
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-black text-[#0052FF] bg-blue-50 px-2 py-0.5 rounded-md">
              R{item.price}
            </span>
            <span className="text-[10px] text-gray-400 font-bold capitalize">
              {item.category}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const SavedItemsPage: React.FC<SavedItemsPageProps> = ({
  isOpen,
  onClose,
  savedItems,
  onSelectItem,
  onRemoveSaved,
  onOpenSearch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option (<) */}
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

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content Area (Scrollable in middle) */}
      <main className="flex-1 w-full max-w-md md:max-w-7xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 pt-4 pb-12 space-y-4 text-left">
        {/* Title Bar: Shows number of saved items only inside saved items page */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">
              Saved Items
            </h1>
          </div>
          <span className="text-xs font-black text-[#0052FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Empty State vs List of Saved Items */}
        {savedItems.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-xs text-center space-y-3 my-auto max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Bookmark className="w-8 h-8 opacity-40 text-gray-400" />
            </div>
            <h2 className="text-base font-black text-gray-900">
              No saved items yet
            </h2>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Explore furniture on PinIn and tap the save icon on any listing to store it here.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenSearch) onOpenSearch();
                }}
                className="py-2.5 px-5 bg-[#0052FF] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Browse Marketplace
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {savedItems.map((item) => (
              <SwipeableSavedCard
                key={item.id}
                item={item}
                onSelectItem={onSelectItem}
                onRemoveSaved={onRemoveSaved}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
