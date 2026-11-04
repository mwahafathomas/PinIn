import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { fetchHelpByCategory, HelpItem } from '../services/helpSupportService';

interface HelpSupportPageProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContactUs?: () => void;
}

interface CategoryConfig {
  id: string;
  number: number;
  title: string;
}

const HELP_CATEGORIES: CategoryConfig[] = [
  { id: 'ordering', number: 4, title: 'Ordering' },
  { id: 'payments', number: 5, title: 'Payments' },
  { id: 'delivery', number: 6, title: 'Delivery' },
  { id: 'cancellations', number: 7, title: 'Cancellations' },
  { id: 'returns-exchanges', number: 8, title: 'Returns & Exchanges' },
  { id: 'sizing-help', number: 9, title: 'Sizing help' },
];

export const HelpSupportPage: React.FC<HelpSupportPageProps> = ({
  isOpen,
  onClose,
  onOpenContactUs,
}) => {
  // Current open subpage category (null = main help menu)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Q&A items loaded from Supabase for the selected category
  const [questions, setQuestions] = useState<HelpItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Expanded question index for accordion
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // When subpage opens, fetch from Supabase
  useEffect(() => {
    if (selectedCategory) {
      setIsLoading(true);
      setQuestions([]);
      setExpandedId(null);

      fetchHelpByCategory(selectedCategory)
        .then((items) => {
          setQuestions(items);
          // If items exist, expand first one by default
          if (items.length > 0) {
            setExpandedId(items[0].id);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [selectedCategory]);

  if (!isOpen) return null;

  const handleContactUsClick = () => {
    onClose();
    if (onOpenContactUs) {
      onOpenContactUs();
    }
  };

  // =========================================================================
  // SUBPAGE: Questions & Answers for selected category (3 to 9)
  // =========================================================================
  if (selectedCategory) {
    return (
      <div className="fixed inset-0 z-60 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none animate-in fade-in duration-150">
        {/* Top Header Bar */}
        <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200">
          <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between relative">
            {/* Go back option (<) on top left */}
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              aria-label="Go back to help categories"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5] text-gray-900" />
            </button>

            {/* App Name (PinIn) right in the center */}
            <div className="absolute left-1/2 -translate-x-1/2">
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                Pin<span className="text-[#2D8EDE]">In</span>
              </span>
            </div>

            <div className="w-8" aria-hidden="true" />
          </div>
        </header>

        {/* Category Subheader Bar */}
        <div className="shrink-0 w-full bg-white border-b border-gray-200">
          <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 py-3.5">
            <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              {selectedCategory}
            </h1>
          </div>
        </div>

        {/* Questions and Answers Content */}
        <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-4">
          {isLoading ? (
            <div className="divide-y divide-gray-200 animate-pulse pt-2">
              <div className="py-4 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-64 bg-gray-100 rounded" />
              </div>
              <div className="py-4 space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-56 bg-gray-100 rounded" />
              </div>
            </div>
          ) : questions.length > 0 ? (
            <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
              {questions.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div key={item.id} className="py-3.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full flex items-center justify-between text-left gap-3 group cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#2D8EDE] transition-colors">
                        {item.question}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#2D8EDE] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] shrink-0 transition-colors" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="pt-2 pb-1 text-xs text-gray-600 leading-relaxed font-normal whitespace-pre-line animate-in fade-in duration-150">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-bold text-gray-800">No questions added yet</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Questions and answers updated in your Supabase table will appear here.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================================
  // MAIN HELP & SUPPORT PAGE (Items 1 to 10 as in Sketch)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-60 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1 & 2: Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between relative">
          {/* 1: Go back option (<) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5] text-gray-900" />
          </button>

          {/* 2: App Name (PinIn) right in the center */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* 3: Words "Help & Support" (Subheader bar as drawn in layout) */}
      <div className="shrink-0 w-full bg-white border-b border-gray-200">
        <button
          type="button"
          onClick={() => setSelectedCategory('Help & Support')}
          className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer group text-left"
        >
          <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight group-hover:text-[#2D8EDE] transition-colors">
            Help &amp; Support
          </h1>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Main Content Area: Items 4 to 10 as clean text list with grey dividers */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-2">
        <div className="divide-y divide-gray-200">
          {/* 4 to 9: Category list rows */}
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.title)}
              className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-50 text-left transition-colors cursor-pointer group"
            >
              <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#2D8EDE] transition-colors">
                {cat.title}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}

          {/* 10: "Contact us", make it open contact us page when clicked */}
          <button
            type="button"
            onClick={handleContactUsClick}
            className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-50 text-left transition-colors cursor-pointer group"
          >
            <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#2D8EDE] transition-colors">
              Contact us
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </main>
    </div>
  );
};
