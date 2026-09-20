import React from 'react';
import { X, Armchair, Bed, Grid, Lamp, LayoutGrid, Sparkles } from 'lucide-react';
import { CategoryOption } from '../types/furniture';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-[#0052FF]" />
            <h2 className="font-extrabold text-base text-gray-900">Browse by Category</h2>
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

        {/* Categories List */}
        <div className="p-4 grid grid-cols-1 gap-2 max-h-[65vh] overflow-y-auto">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50/70 border-[#0052FF] text-[#0052FF] shadow-xs'
                    : 'border-gray-100 bg-white hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[#0052FF] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">{cat.name}</span>
                    <span className="text-xs text-gray-400">{cat.count} listings available</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-xs font-bold bg-[#0052FF] text-white px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl border border-gray-300 font-semibold text-xs text-gray-700 hover:bg-gray-100 transition-colors"
          >
            View All Categories
          </button>
        </div>
      </div>
    </div>
  );
};
