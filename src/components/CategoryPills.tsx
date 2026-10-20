import React from 'react';

interface CategoryPillsProps {
  categories?: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories = ['Men', 'Women'],
  selectedCategory,
  onSelectCategory,
}) => {
  const displayCategories = categories && categories.length > 0 ? categories : ['Men', 'Women'];

  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-2xs">
      <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 py-2">
        <div
          role="tablist"
          aria-label="Clothing Department"
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          {displayCategories.map((category) => {
            const isSelected =
              category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  if (isSelected) {
                    onSelectCategory('All');
                  } else {
                    onSelectCategory(category);
                  }
                }}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all duration-150 cursor-pointer text-center select-none active:scale-95 ${
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
