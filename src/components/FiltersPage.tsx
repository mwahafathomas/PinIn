import React, { useState } from 'react';
import {
  ChevronLeft,
  Search,
  MessageSquare,
  Bell,
  ChevronRight,
  RotateCcw,
  MapPin,
  Plus,
  Minus,
} from 'lucide-react';
import { FilterState } from '../types/furniture';

interface FiltersPageProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  onOpenCategoriesPage: () => void;
  onOpenLocationPage: () => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const FiltersPage: React.FC<FiltersPageProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  onOpenCategoriesPage,
  onOpenLocationPage,
  onOpenMessages,
  onOpenNotifications,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const [localPrice, setLocalPrice] = useState<string>(
    filters.maxPrice && filters.maxPrice < 20000 ? String(filters.maxPrice) : ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(filters.category || 'all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : filters.category && filters.category !== 'all'
      ? filters.category.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  );
  const [conditionType, setConditionType] = useState<'All' | 'New' | 'Used'>(
    filters.condition.length === 1 && filters.condition.includes('Brand New')
      ? 'New'
      : filters.condition.length > 0
      ? 'Used'
      : 'All'
  );
  const [localLocation, setLocalLocation] = useState<string>(filters.location || '');

  // Keep state synced when props change (e.g. returning from /location or /categories)
  React.useEffect(() => {
    setLocalLocation(filters.location || '');
  }, [filters.location]);

  React.useEffect(() => {
    setSelectedCategory(filters.category || 'all');
    if (filters.categories && filters.categories.length > 0) {
      setSelectedCategories(filters.categories);
    } else if (filters.category && filters.category !== 'all') {
      setSelectedCategories(filters.category.split(',').map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedCategories([]);
    }
  }, [filters.category, filters.categories]);

  if (!isOpen) return null;

  // Increment / Decrement price by 100 as requested
  const handlePriceStep = (delta: number) => {
    const current = Number(localPrice) || 0;
    const next = Math.max(0, current + delta);
    setLocalPrice(next === 0 ? '' : String(next));
  };

  // Calculate applied filters count
  const calculateAppliedCount = () => {
    let count = 0;
    if (localPrice && Number(localPrice) > 0) count++;
    if (selectedCategories.length > 0 || (selectedCategory && selectedCategory !== 'all')) count++;
    if (conditionType !== 'All') count++;
    if (localLocation.trim()) count++;
    return count;
  };

  const appliedCount = calculateAppliedCount();

  const handleClearFilters = () => {
    setLocalPrice('');
    setSelectedCategory('all');
    setSelectedCategories([]);
    setConditionType('All');
    setLocalLocation('');
    onResetFilters();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let updatedConditions: string[] = [];
    if (conditionType === 'New') {
      updatedConditions = ['Brand New'];
    } else if (conditionType === 'Used') {
      updatedConditions = ['Like New', 'Good', 'Fair', 'Vintage'];
    }

    const updatedFilters: FilterState = {
      ...filters,
      maxPrice: localPrice && Number(localPrice) > 0 ? Number(localPrice) : 20000,
      category: selectedCategories.length > 0 ? selectedCategories.join(', ') : selectedCategory,
      categories: selectedCategories,
      condition: updatedConditions,
      location: localLocation.trim(),
    };

    onApplyFilters(updatedFilters);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area (Scrollable middle) */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 pt-3 md:pt-6 pb-6">
        {/* Filters Section Title */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-sm md:text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0052FF]" />
              <span>Filters</span>
            </h1>
            {appliedCount > 0 && (
              <span className="text-[11px] md:text-xs font-bold bg-blue-100 text-[#0052FF] px-2.5 py-0.5 rounded-full">
                {appliedCount} active
              </span>
            )}
          </div>
        </div>

        {/* Filter Blue Bars */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Blue Bar with 100 Increment/Decrement buttons */}
            <div className="bg-[#0052FF] rounded-2xl px-4 py-3 shadow-md flex flex-col justify-center text-white">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="filter-price"
                  className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100"
                >
                  Max Price (R)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePriceStep(-100)}
                    disabled={!localPrice || Number(localPrice) <= 0}
                    className="px-2 py-0.5 bg-white/20 hover:bg-white/30 active:scale-95 disabled:opacity-30 rounded text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                    <span>100</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriceStep(100)}
                    className="px-2 py-0.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>100</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center">
                <span className="text-base font-black mr-1.5 text-white">R</span>
                <input
                  id="filter-price"
                  type="number"
                  min="0"
                  step="100"
                  value={localPrice}
                  onChange={(e) => setLocalPrice(e.target.value)}
                  placeholder="Set max price (e.g. 5000)"
                  className="w-full bg-white/15 focus:bg-white text-white focus:text-gray-900 placeholder:text-blue-200 text-sm font-extrabold px-3 py-2 rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            {/* Category Blue Bar */}
            <button
              type="button"
              onClick={onOpenCategoriesPage}
              className="w-full bg-[#0052FF] hover:bg-blue-700 active:scale-[0.99] rounded-2xl px-4 py-3 shadow-md flex items-center justify-between text-white transition-all text-left group cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100 block mb-0.5">
                  Category {selectedCategories.length > 1 ? `(${selectedCategories.length} Selected)` : ''}
                </span>
                <span className="text-sm font-extrabold capitalize text-white truncate max-w-[230px] md:max-w-xs block">
                  {selectedCategories.length === 0 || (selectedCategories.length === 1 && selectedCategories[0] === 'all')
                    ? 'All Categories / Choose Category'
                    : selectedCategories.length === 1
                    ? selectedCategories[0]
                    : selectedCategories.map((c) => c.split('/')[0].trim()).join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-blue-100 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
                <span className="text-xs font-bold">Open</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </button>

            {/* Condition Blue Bar */}
            <div className="bg-[#0052FF] rounded-2xl px-4 py-3 shadow-md flex flex-col justify-center text-white">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100 mb-1.5">
                Condition (New / Used)
              </span>
              <div className="grid grid-cols-3 gap-2 bg-black/20 p-1 rounded-xl">
                {(['All', 'New', 'Used'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setConditionType(type)}
                    className={`py-1.5 text-xs font-extrabold rounded-lg transition-all text-center cursor-pointer ${
                      conditionType === type
                        ? 'bg-white text-[#0052FF] shadow-sm'
                        : 'text-blue-100 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Location Blue Bar */}
            <button
              type="button"
              onClick={onOpenLocationPage}
              className="w-full bg-[#0052FF] hover:bg-blue-700 active:scale-[0.99] rounded-2xl px-4 py-3 shadow-md flex items-center justify-between text-white transition-all text-left group cursor-pointer"
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100 block mb-0.5">
                  Add Location
                </span>
                <span className="text-sm font-extrabold capitalize text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-200 shrink-0" />
                  <span className="truncate max-w-[220px] md:max-w-xs">
                    {localLocation || 'Select Gauteng Locations'}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-blue-100 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                <span className="text-xs font-bold">Choose</span>
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Clear filters */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full bg-[#0052FF]/90 hover:bg-[#0052FF] active:scale-[0.99] rounded-2xl px-4 py-3 shadow-md flex items-center justify-between text-white transition-all text-left border border-white/20 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm font-extrabold">Clear Filters</span>
              </div>
              <span className="text-xs font-black bg-white text-[#0052FF] px-2.5 py-1 rounded-full shadow-xs">
                {appliedCount} Applied
              </span>
            </button>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-[#0052FF] hover:bg-blue-700 active:scale-[0.99] rounded-2xl shadow-lg flex items-center justify-center gap-2 text-white font-black text-sm sm:text-base tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0052FF] cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[3]" />
              <span>Search</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
