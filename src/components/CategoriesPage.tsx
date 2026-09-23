import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Search,
  MessageSquare,
  Bell,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  CategoryGroup,
  DEFAULT_CATEGORY_GROUPS,
  fetchCategoriesFromSupabase,
} from '../services/categoriesService';

interface CategoriesPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string, subCategoryName?: string, allSelected?: string[]) => void;
  selectedCategory?: string;
  selectedCategories?: string[];
  fromSell?: boolean;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  selectedCategory,
  selectedCategories,
  fromSell = false,
  onOpenMessages,
  onOpenNotifications,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const [categories, setCategories] = useState<CategoryGroup[]>(DEFAULT_CATEGORY_GROUPS);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastActiveGroup, setLastActiveGroup] = useState<string | null>(null);

  // Initialize selected items when opening
  useEffect(() => {
    if (isOpen) {
      fetchCategoriesFromSupabase().then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
        }
      });

      if (selectedCategories && selectedCategories.length > 0) {
        setSelectedItems([...selectedCategories]);
      } else if (selectedCategory && selectedCategory !== 'all') {
        const parts = selectedCategory
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        setSelectedItems(parts);
      } else {
        setSelectedItems([]);
      }
    }
  }, [isOpen, selectedCategory, selectedCategories]);

  if (!isOpen) return null;

  const handleItemClick = (group: CategoryGroup, item: string) => {
    setLastActiveGroup(group.id);

    if (fromSell) {
      // Single selection for selling
      if (selectedItems.includes(item)) {
        setSelectedItems([]);
      } else {
        setSelectedItems([item]);
      }
      return;
    }

    // Multi-selection for browsing/filtering
    setSelectedItems((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleToggleGroup = (group: CategoryGroup) => {
    if (fromSell) return;

    const allGroupItemsSelected = group.items.every((item) => selectedItems.includes(item));

    if (allGroupItemsSelected) {
      // Unselect all items in this group
      setSelectedItems((prev) => prev.filter((i) => !group.items.includes(i)));
    } else {
      // Select all items in this group
      setSelectedItems((prev) => {
        const newSet = new Set([...prev, ...group.items]);
        return Array.from(newSet);
      });
    }
  };

  const handleExecuteSearch = () => {
    if (selectedItems.length === 0) {
      onSelectCategory('all', undefined, []);
    } else if (selectedItems.length === 1) {
      onSelectCategory(lastActiveGroup || 'all', selectedItems[0], selectedItems);
    } else {
      // Multiple categories selected
      onSelectCategory('multi', selectedItems.join(', '), selectedItems);
    }
  };

  const handleClearAll = () => {
    setSelectedItems([]);
    setLastActiveGroup(null);
  };

  const firstSelectedLabel = selectedItems[0]?.split('/')[0]?.trim() || '';

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) on left */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-3 md:pt-6 pb-4 flex flex-col min-h-0 overflow-hidden">
        {/* Categories Section Title & Status */}
        <div className="mb-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-sm md:text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D8EDE]" />
              <span>{fromSell ? 'Select Category' : 'Furniture Categories'}</span>
              {selectedItems.length > 0 && (
                <span className="text-[11px] md:text-xs font-extrabold bg-blue-100 text-[#2D8EDE] px-2.5 py-0.5 rounded-full ml-1 normal-case">
                  {selectedItems.length} selected
                </span>
              )}
            </h1>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs md:text-sm text-[#2D8EDE] font-bold hover:underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
          {!fromSell && (
            <p className="text-[11px] md:text-xs font-medium text-gray-500 mt-1">
              Select one or multiple categories to filter listings
            </p>
          )}
        </div>

        {/* Scrollable Box for Categories */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 pb-2">
            {categories.map((group) => {
              const groupSelectedCount = group.items.filter((item) =>
                selectedItems.includes(item)
              ).length;
              const isAllGroupSelected =
                group.items.length > 0 && groupSelectedCount === group.items.length;

              return (
                <div key={group.id} className="bg-white border-2 border-gray-200 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs md:text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                      {group.title}
                    </span>
                    {!fromSell && (
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(group)}
                        className="text-[11px] font-bold text-[#2D8EDE] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        {isAllGroupSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    )}
                  </div>

                  {/* Inside Category Buttons */}
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const isItemSelected = selectedItems.includes(item);

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleItemClick(group, item)}
                          className={`w-full py-2.5 px-3.5 rounded-xl border text-left font-bold text-xs md:text-sm transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] ${
                            isItemSelected
                              ? 'bg-[#2D8EDE] border-[#2D8EDE] text-white shadow-sm'
                              : 'bg-white hover:bg-blue-50/60 border-gray-200 text-gray-800 hover:border-blue-300'
                          }`}
                        >
                          <span className="capitalize">{item}</span>
                          {isItemSelected ? (
                            <div className="w-5 h-5 rounded-full bg-white text-[#2D8EDE] flex items-center justify-center shrink-0 shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-[#2D8EDE] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pinned Search or Confirm Button - Always visible without scrolling */}
        <div className="pt-3 pb-2 shrink-0 flex justify-center border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleExecuteSearch}
            className={`w-full max-w-[360px] py-3.5 px-6 active:scale-95 text-xs sm:text-sm font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer ${
              fromSell
                ? 'bg-[#2D8EDE] hover:bg-[#2579BE] text-white'
                : selectedItems.length > 0
                ? 'bg-[#2D8EDE] hover:bg-[#2579BE] text-white'
                : 'bg-white hover:bg-gray-50 border-2 border-[#2D8EDE] text-gray-900'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-xs shrink-0 ${
                fromSell || selectedItems.length > 0
                  ? 'bg-white text-[#2D8EDE]'
                  : 'bg-[#2D8EDE] text-white'
              }`}
            >
              {fromSell ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : selectedItems.length > 1 ? (
                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </div>
            <span className="tracking-wide truncate">
              {fromSell
                ? selectedItems.length > 0
                  ? `Select "${firstSelectedLabel}"`
                  : 'Choose a Category'
                : selectedItems.length === 0
                ? 'Search All Furniture'
                : selectedItems.length === 1
                ? `Search "${firstSelectedLabel}"`
                : `Search (${selectedItems.length}) Categories`}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};
