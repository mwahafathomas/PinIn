import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  ShoppingCart,
  User,
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
  onGoHome?: () => void;
  onOpenCart?: () => void;
  onOpenAccount?: () => void;
  cartCount?: number;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  fromSell = false,
  onGoHome,
  onOpenCart,
  onOpenAccount,
  cartCount = 0,
}) => {
  const [categories, setCategories] = useState<CategoryGroup[]>(DEFAULT_CATEGORY_GROUPS);

  // Initialize categories when opening
  useEffect(() => {
    if (isOpen) {
      fetchCategoriesFromSupabase().then((data) => {
        if (data && data.length > 0) {
          const hasOldFurniture = data.some((g) =>
            g.title.toLowerCase().includes('living') ||
            g.title.toLowerCase().includes('kitchen') ||
            g.title.toLowerCase().includes('bedroom')
          );
          if (!hasOldFurniture) {
            setCategories(data);
          } else {
            setCategories(DEFAULT_CATEGORY_GROUPS);
          }
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemClick = (group: CategoryGroup, item: string) => {
    // Single category selection: clicking an item directly opens the results page
    onSelectCategory(group.id, item, [item]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) on left */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onGoHome || onClose}
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
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-3 md:pt-5 pb-4 flex flex-col min-h-0 overflow-hidden">
        {/* Categories Section Title */}
        <div className="mb-3 shrink-0">
          <h1 className="text-sm md:text-base font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D8EDE]" />
            <span>{fromSell ? 'Select Category' : 'Categories'}</span>
          </h1>
          <p className="text-[11px] md:text-xs font-medium text-gray-500 mt-1">
            Tap a category to browse listings
          </p>
        </div>

        {/* Clean text list for categories like settings menu list */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          <div className="space-y-6">
            {categories.map((group) => (
              <div key={group.id} className="space-y-1">
                <div className="py-2 px-1">
                  <span className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-wider">
                    {group.title}
                  </span>
                </div>

                {/* Clean text list only with arrow >, no border, no background, no card */}
                <div className="divide-y divide-gray-200">
                  {group.items.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleItemClick(group, item)}
                      className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-100/60 text-left transition-colors cursor-pointer group active:scale-[0.99]"
                    >
                      <span className="text-xs sm:text-sm font-bold text-gray-900 capitalize">
                        {item}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 4 Bottom Icons Navigation Dock */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-2 md:px-8 h-16 grid grid-cols-4 items-center">
          {/* 1. Home */}
          <button
            type="button"
            onClick={onGoHome || onClose}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Home"
          >
            <Home className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#2D8EDE]" />
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Home
            </span>
          </button>

          {/* 2. Category (Active) */}
          <button
            type="button"
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all relative cursor-pointer text-[#2D8EDE]"
            aria-label="Categories"
          >
            <LayoutGrid className="w-5 h-5 stroke-[2.2] text-[#2D8EDE]" />
            <span className="text-[11px] font-bold mt-1 leading-none text-[#2D8EDE]">
              Category
            </span>
          </button>

          {/* 3. Cart */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all relative cursor-pointer group"
            aria-label="Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 stroke-[2] text-gray-600 group-hover:text-[#2D8EDE]" />
              {cartCount !== undefined && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#2D8EDE] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Cart
            </span>
          </button>

          {/* 4. Account */}
          <button
            type="button"
            onClick={onOpenAccount}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Account"
          >
            <User className="w-5 h-5 stroke-[2] text-gray-600 group-hover:text-[#2D8EDE]" />
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Account
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
