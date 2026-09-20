import React from 'react';
import { Plus, LayoutGrid, SlidersHorizontal } from 'lucide-react';

interface ActionNavProps {
  onOpenSell: () => void;
  onOpenCategories: () => void;
  onOpenFilters: () => void;
  activeCategoryName?: string;
  activeFilterCount?: number;
}

export const ActionNav: React.FC<ActionNavProps> = ({
  onOpenSell,
  onOpenCategories,
  onOpenFilters,
  activeCategoryName,
  activeFilterCount = 0,
}) => {
  return (
    <nav
      aria-label="Marketplace quick actions"
      className="w-full bg-[#0052FF] text-white shadow-sm border-b border-[#0047E0]"
    >
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-0 md:px-6 lg:px-8 grid grid-cols-3 divide-x divide-white/20">
        {/* Left: + sell */}
        <button
          type="button"
          onClick={onOpenSell}
          className="flex items-center justify-center gap-1.5 py-3 px-2 text-white font-bold text-sm tracking-wide hover:bg-white/10 active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="whitespace-nowrap">Sell</span>
        </button>

        {/* Center: categories */}
        <button
          type="button"
          onClick={onOpenCategories}
          className="flex items-center justify-center gap-1.5 py-3 px-2 text-white font-bold text-sm tracking-wide hover:bg-white/10 active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white relative cursor-pointer"
        >
          <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
          <span className="whitespace-nowrap truncate max-w-[120px] md:max-w-xs">
            {activeCategoryName && activeCategoryName !== 'All Furniture' ? activeCategoryName : 'Categories'}
          </span>
        </button>

        {/* Right: Filters */}
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex items-center justify-center gap-1.5 py-3 px-2 text-white font-bold text-sm tracking-wide hover:bg-white/10 active:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white relative cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
          <span className="whitespace-nowrap">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-white text-[#0052FF] text-[11px] font-black rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
