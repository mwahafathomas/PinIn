import React from 'react';
import { X, Bookmark, Trash2, ChevronRight } from 'lucide-react';
import { FurnitureItem } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface SavedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: FurnitureItem[];
  onSelectItem: (item: FurnitureItem) => void;
  onRemoveSaved: (id: string, e: React.MouseEvent) => void;
}

export const SavedItemsModal: React.FC<SavedItemsModalProps> = ({
  isOpen,
  onClose,
  savedItems,
  onSelectItem,
  onRemoveSaved,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#0052FF]" />
            <h2 className="font-extrabold text-base text-gray-900">
              Saved Items ({savedItems.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {savedItems.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-gray-700">No saved items yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click the 3 dots on any furniture card to save items to your wishlist.
              </p>
            </div>
          ) : (
            savedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/80 transition-all flex items-center gap-3 cursor-pointer"
              >
                <img
                  src={getOptimizedImageUrl(item.imageUrl, { width: 400, quality: 70, format: 'webp' })}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-xs text-gray-900 truncate">{item.title}</h4>
                  <p className="text-xs text-gray-500 truncate">{item.location}</p>
                  <p className="font-black text-sm text-[#0052FF] mt-1">${item.price}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => onRemoveSaved(item.id, e)}
                  aria-label="Remove saved"
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
