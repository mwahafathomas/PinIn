import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Home,
  LayoutGrid,
  ShoppingCart,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import {
  CategoryGroup,
  CategoryItemEntry,
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
  genderFilter?: string | null;
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
  genderFilter,
  onGoHome,
  onOpenCart,
  onOpenAccount,
  cartCount = 0,
}) => {
  const [categories, setCategories] = useState<CategoryGroup[]>(DEFAULT_CATEGORY_GROUPS);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Determine active gender filter passed from Home page ("men" or "ladies"/"women")
  const rawGenderFilter = (
    genderFilter ||
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('gender') : null) ||
    ''
  )
    .toLowerCase()
    .trim();

  const lockedGender: 'ladies' | 'men' | null =
    rawGenderFilter === 'men'
      ? 'men'
      : rawGenderFilter === 'ladies' || rawGenderFilter === 'women'
      ? 'ladies'
      : null;

  const [selectedGenderTab, setSelectedGenderTab] = useState<'ladies' | 'men'>(
    lockedGender || 'ladies'
  );

  useEffect(() => {
    if (lockedGender) {
      setSelectedGenderTab(lockedGender);
    }
  }, [lockedGender]);

  // Initialize categories from Supabase when opening
  useEffect(() => {
    if (isOpen) {
      fetchCategoriesFromSupabase().then((data) => {
        if (data && data.length > 0) {
          const hasOldFurniture = data.some(
            (g) =>
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

  const activeTab: 'ladies' | 'men' = lockedGender || selectedGenderTab;

  // Strictly match ONLY the active gender group so Ladies never shows on Men and Men never shows on Ladies
  const activeGroup = categories.find((group) => {
    const idLower = group.id.toLowerCase().trim();
    const titleLower = group.title.toLowerCase().trim();
    if (activeTab === 'men') {
      return idLower === 'men' || titleLower === 'men';
    }
    return (
      idLower === 'ladies' ||
      idLower === 'women' ||
      titleLower === 'ladies' ||
      titleLower === 'women'
    );
  });

  const displayEntries: CategoryItemEntry[] = activeGroup
    ? activeGroup.itemEntries && activeGroup.itemEntries.length > 0
      ? activeGroup.itemEntries
      : activeGroup.items.map((name) => ({ name }))
    : [];

  const handleItemClick = (itemName: string) => {
    const targetGroupId = activeGroup?.id || activeTab;
    onSelectCategory(targetGroupId, itemName, [itemName]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1 & 2: Top Header Bar (White) - Blue Go Back (<) on left + PinIn in center */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* 1. Go back option in color blue */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose || onGoHome}
              aria-label="Go back"
              className="min-h-[44px] min-w-[44px] -ml-2 rounded-lg text-[#2D8EDE] hover:bg-blue-50 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* 2. App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* 3 & 4: Ladies & Men selector boxes matching Home page CategoryPills size */}
      <div className="shrink-0 w-full bg-white border-b border-gray-100 shadow-2xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2.5 py-0.5">
            {lockedGender !== 'men' && (
              <button
                type="button"
                onClick={() => setSelectedGenderTab('ladies')}
                className={`${
                  lockedGender === 'ladies' ? 'w-1/3 min-w-[110px]' : 'flex-1'
                } py-2 px-4 rounded-xl text-xs font-black capitalize transition-all duration-150 cursor-pointer text-center select-none active:scale-95 ${
                  activeTab === 'ladies'
                    ? 'bg-[#2D8EDE] text-white shadow-xs ring-2 ring-blue-300/40'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-transparent'
                }`}
              >
                Ladies
              </button>
            )}

            {lockedGender !== 'ladies' && (
              <button
                type="button"
                onClick={() => setSelectedGenderTab('men')}
                className={`${
                  lockedGender === 'men' ? 'w-1/3 min-w-[110px]' : 'flex-1'
                } py-2 px-4 rounded-xl text-xs font-black capitalize transition-all duration-150 cursor-pointer text-center select-none active:scale-95 ${
                  activeTab === 'men'
                    ? 'bg-[#2D8EDE] text-white shadow-xs ring-2 ring-blue-300/40'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-transparent'
                }`}
              >
                Men
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5-12 (Images) & 13-20 (Names): 2-Column Categories Grid */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto overflow-y-auto bg-white">
        <div className="grid grid-cols-2 bg-gray-200 gap-px border-b border-gray-200">
          {displayEntries.map((entry) => {
            const imgKey = `${activeTab}_${entry.name}`;
            const hasValidImage = Boolean(entry.imageUrl && !failedImages[imgKey]);

            return (
              <button
                key={imgKey}
                type="button"
                onClick={() => handleItemClick(entry.name)}
                className="relative block aspect-square w-full overflow-hidden bg-gray-100 text-left transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2D8EDE]"
              >
                {/* 5-12: Full-bleed category image filling entire box */}
                {hasValidImage ? (
                  <>
                    <img
                      src={entry.imageUrl}
                      alt={entry.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [imgKey]: true }))
                      }
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
                      loading="lazy"
                      draggable={false}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none"
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 group-hover:text-[#2D8EDE]/50 transition-colors">
                    <ImageIcon className="w-10 h-10 stroke-[1.6]" />
                  </div>
                )}

                {/* 13-20: Category name anchored at bottom-left */}
                <span
                  className={`absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 text-left text-xs sm:text-sm font-extrabold capitalize leading-snug line-clamp-2 ${
                    hasValidImage
                      ? 'text-white drop-shadow-xs'
                      : 'text-gray-900 group-hover:text-[#2D8EDE] transition-colors'
                  }`}
                >
                  {entry.name}
                </span>
              </button>
            );
          })}

          {/* Clean filler cell when odd number of categories so grid border stays crisp */}
          {displayEntries.length % 2 !== 0 && (
            <div className="bg-white aspect-square w-full" aria-hidden="true" />
          )}
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
