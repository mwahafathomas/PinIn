import React, { useState } from 'react';
import { X, SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import { FilterState } from '../types/furniture';

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
}

const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair', 'Vintage'];
const SORT_OPTIONS: { id: FilterState['sortBy']; label: string }[] = [
  { id: 'featured', label: 'Featured / Recommended' },
  { id: 'newest', label: 'Most Recent' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
];

export const FiltersModal: React.FC<FiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  if (!isOpen) return null;

  const toggleCondition = (cond: string) => {
    const exists = localFilters.condition.includes(cond);
    const newConditions = exists
      ? localFilters.condition.filter((c) => c !== cond)
      : [...localFilters.condition, cond];
    setLocalFilters({ ...localFilters, condition: newConditions });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#0052FF]" />
            <h2 className="font-extrabold text-base text-gray-900">Filter Furniture</h2>
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

        {/* Filters Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-left flex-1">
          {/* Sort by */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setLocalFilters({ ...localFilters, sortBy: opt.id })}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    localFilters.sortBy === opt.id
                      ? 'bg-blue-50 border-[#0052FF] text-[#0052FF] font-bold'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Price Range ($)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[11px] text-gray-400 block mb-1">Min</span>
                <input
                  type="number"
                  min="0"
                  value={localFilters.minPrice || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, minPrice: Number(e.target.value) || 0 })
                  }
                  placeholder="$0"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                />
              </div>
              <span className="text-gray-400 mt-5 font-bold">-</span>
              <div className="flex-1">
                <span className="text-[11px] text-gray-400 block mb-1">Max</span>
                <input
                  type="number"
                  min="0"
                  value={localFilters.maxPrice === 2000 ? '' : localFilters.maxPrice}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      maxPrice: Number(e.target.value) || 2000,
                    })
                  }
                  placeholder="Any"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Condition
            </label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((cond) => {
                const selected = localFilters.condition.includes(cond);
                return (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`py-1.5 px-3 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      selected
                        ? 'bg-[#0052FF] text-white border-[#0052FF] font-semibold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seller Location query */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Filter by Neighborhood / City
            </label>
            <input
              type="text"
              value={localFilters.locationQuery}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, locationQuery: e.target.value })
              }
              placeholder="e.g. Brooklyn, Manhattan, Queens..."
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-xs text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
