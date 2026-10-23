import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
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
    <div className="relative overflow-hidden group select-none">
      {/* Background Revealed Action: Red Delete button on the right */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-600 flex items-center justify-center z-0">
        <motion.button
          type="button"
          style={{ opacity: deleteOpacity, scale: deleteScale }}
          onClick={(e) => onRemoveSaved(item.id, e)}
          className="flex flex-col items-center justify-center text-white active:scale-95 transition-transform p-2 w-full h-full cursor-pointer font-black text-xs uppercase"
          aria-label="Remove from saved"
        >
          <Trash2 className="w-4 h-4 mb-0.5" />
          <span>Remove</span>
        </motion.button>
      </div>

      {/* Foreground Swipeable Item: clean list row with arrow >, no border, no background, no card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={{ x: isOpen ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        style={{ x }}
        onClick={() => {
          if (!isOpen) {
            onSelectItem(item);
          } else {
            setIsOpen(false);
          }
        }}
        className="relative z-10 bg-white py-3 px-2 flex items-center justify-between gap-3 cursor-pointer group hover:bg-gray-50 transition-colors touch-pan-y"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={getOptimizedImageUrl(item.imageUrl, { width: 140, quality: 75, format: 'webp' })}
            alt={item.title}
            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 truncate group-hover:text-[#2D8EDE] transition-colors">
              {item.title}
            </h3>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              {item.location} • <span className="font-bold text-[#2D8EDE]">R{item.price}</span>
            </p>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all shrink-0" />
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
          <div className="divide-y divide-gray-200">
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
