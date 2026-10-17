import React from 'react';

interface CategoryPillsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  if (!categories || categories.length <= 1) return null;

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-2xs">
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 py-2.5">
        <div
          role="tablist"
          aria-label="Categories"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          {categories.map((category) => {
            const isSelected =
              category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(category)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer capitalize select-none active:scale-95 ${
                  isSelected
                    ? 'bg-[#2D8EDE] text-white shadow-xs ring-2 ring-blue-300/40'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-transparent'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
