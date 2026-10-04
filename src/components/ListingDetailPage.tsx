import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  MoreVertical,
  Flag,
  Share,
  Check,
  X,
  Tag,
  Image as ImageIcon,
  ShoppingCart,
  Plus,
  Minus,
  Truck,
  Star,
  Info,
} from 'lucide-react';
import { FurnitureItem, UserAccount } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { addToCart } from '../services/cartService';
import { Share as NativeShare } from '@capacitor/share';

interface ListingDetailPageProps {
  item: FurnitureItem | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onShare: (item: FurnitureItem) => void;
  onReport?: (item: FurnitureItem, reason: string, details?: string) => void;
  onOpenSearch?: () => void;
  onOpenCart?: () => void;
  user?: UserAccount;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  // Deprecated props kept optional for backwards compatibility
  onSendMessageToSeller?: (item: FurnitureItem, message: string) => void;
  onOpenUserProfile?: (userId: string, initialData?: any) => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

const REPORT_REASONS = [
  "description doesn't match product",
  'wrong product image',
  'blurry product image',
  'high price',
  'duplicate product',
  'other',
];

function getEstimatedDeliveryDateRange(): string {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const startDay = String(start.getDate()).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });

  if (start.getMonth() !== end.getMonth()) {
    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  }
  return `${startDay} - ${endDay} ${endMonth}`;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  item,
  isOpen,
  onClose,
  isSaved = false,
  onToggleSave,
  onShare,
  onReport,
  onOpenCart,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<number, boolean>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("description doesn't match product");
  const [otherDetails, setOtherDetails] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCartFeedback, setAddedToCartFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Scroll carousel to top on open
    if (isOpen) {
      setActiveImageIndex(0);
      setIsLoading(false);
    }
  }, [isOpen, item?.id]);

  const carouselRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !item) return null;

  // Multiple photos support
  const rawImages: string[] = [];
  const addImageToList = (img: unknown) => {
    if (img && typeof img === 'string') {
      const clean = img.trim();
      if (clean && !rawImages.includes(clean)) {
        rawImages.push(clean);
      }
    }
  };

  if (item.imageUrl && typeof item.imageUrl === 'string') {
    addImageToList(item.imageUrl);
  }

  const parseAndAddImages = (source: unknown) => {
    if (!source) return;
    if (Array.isArray(source)) {
      source.forEach(addImageToList);
    } else if (typeof source === 'string') {
      const trimmed = source.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsed.forEach(addImageToList);
        } catch {}
      } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        trimmed
          .slice(1, -1)
          .split(',')
          .forEach((s) => {
            addImageToList(s.replace(/^"(.*)"$/, '$1').trim());
          });
      } else if (trimmed.includes(',')) {
        trimmed.split(',').forEach((s) => addImageToList(s.trim()));
      } else if (trimmed !== '') {
        addImageToList(trimmed);
      }
    }
  };

  parseAndAddImages(item.additionalImages);
  parseAndAddImages((item as any).additional_images);
  parseAndAddImages((item as any).images);
  parseAndAddImages((item as any).imageUrls);

  if (rawImages.length === 0 && item.imageUrl) {
    addImageToList(item.imageUrl);
  }

  const allImages = rawImages.map((img) =>
    getOptimizedImageUrl(img, { width: 600, quality: 70, format: 'webp' })
  );

  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      if (clientWidth > 0) {
        const nextIndex = Math.round(scrollLeft / clientWidth);
        if (nextIndex !== activeImageIndex && nextIndex >= 0 && nextIndex < allImages.length) {
          setActiveImageIndex(nextIndex);
        }
      }
    }
  };

  const scrollToImageIndex = (index: number) => {
    const validIndex = Math.max(0, Math.min(index, allImages.length - 1));
    setActiveImageIndex(validIndex);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: validIndex * carouselRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    const prev = activeImageIndex > 0 ? activeImageIndex - 1 : allImages.length - 1;
    scrollToImageIndex(prev);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (allImages.length <= 1) return;
    const next = activeImageIndex < allImages.length - 1 ? activeImageIndex + 1 : 0;
    scrollToImageIndex(next);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImageIndex, allImages.length]);

  const handleAddToCart = () => {
    addToCart(item, quantity);
    setAddedToCartFeedback(true);
    setTimeout(() => {
      setAddedToCartFeedback(false);
    }, 3000);
  };

  const handleBuyNow = () => {
    addToCart(item, quantity);
    if (onOpenCart) {
      onOpenCart();
    }
  };

  const handleConfirmReport = () => {
    if (onReport) {
      const finalReason = reportReason;
      const customText = reportReason.toLowerCase() === 'other' ? otherDetails.trim() : undefined;
      onReport(item, finalReason, customText);
    }
    setIsReportModalOpen(false);
    setIsMenuOpen(false);
    setOtherDetails('');
  };

  const handleNativeShare = async (itemToShare: FurnitureItem) => {
    const shareUrl = `https://pinin.co.za/product/${itemToShare.id}`;
    const shareText = `I found this ${itemToShare.title} (R${itemToShare.price}) on PinIn. Check it out: ${shareUrl}`;

    try {
      await NativeShare.share({
        title: 'Check this on PinIn',
        text: shareText,
        url: shareUrl,
        dialogTitle: 'Share Furniture Listing',
      });
    } catch {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
      }
    }
  };

  const sellerDisplayName = item.seller?.name || 'PinIn Verified Seller';

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans"
      onClick={() => setIsMenuOpen(false)}
    >
      {/* Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              aria-label="More options"
              className="p-2 -mr-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
            >
              <MoreVertical className="w-5 h-5 text-gray-700 hover:text-[#2D8EDE]" />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await handleNativeShare(item);
                    onShare?.(item);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2D8EDE] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Share className="w-4 h-4 text-gray-500" />
                  <span>Share Listing</span>
                </button>

                <div className="h-px bg-gray-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsReportModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Flag className="w-4 h-4 text-red-500" />
                  <span>Report Listing</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-7xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 pt-4 pb-12">
        {isLoading ? (
          <div className="w-full max-w-2xl mx-auto space-y-4 animate-pulse">
            {/* Shimmer Hero Image */}
            <div className="aspect-4/3 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-3xl relative overflow-hidden" />

            {/* Shimmer Thumbnails */}
            <div className="flex gap-2.5 pt-1">
              <div className="w-14 h-14 bg-gray-200 rounded-xl" />
              <div className="w-14 h-14 bg-gray-200 rounded-xl" />
              <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            </div>

            {/* Shimmer Badges */}
            <div className="flex gap-2 pt-2">
              <div className="h-6 w-20 bg-gray-200 rounded-lg" />
              <div className="h-6 w-32 bg-gray-200 rounded-lg" />
              <div className="h-6 w-24 bg-gray-200 rounded-lg" />
            </div>

            {/* Shimmer Title Lines */}
            <div className="space-y-2 pt-1">
              <div className="h-7 w-4/5 bg-gray-200 rounded-lg" />
              <div className="h-7 w-2/5 bg-gray-200 rounded-lg" />
            </div>

            {/* Shimmer Price Pill */}
            <div className="h-9 w-36 bg-gray-200 rounded-xl" />

            {/* Shimmer Delivery and Seller cards */}
            <div className="h-16 w-full bg-gray-200 rounded-2xl" />
            <div className="h-20 w-full bg-gray-200 rounded-2xl" />

            {/* Shimmer Description Lines */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-start">
          {/* Left Column: Photos Carousel & Details */}
          <div className="md:col-span-6 lg:col-span-7 space-y-3.5">
            {/* Swipeable Images Carousel - Full Size Edge-to-Edge Without White Corners */}
            <div className="-mx-4 -mt-4 md:mx-0 md:mt-0 relative w-[calc(100%+2rem)] md:w-full h-[380px] sm:h-[480px] overflow-hidden group rounded-none">
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x rounded-none"
                style={{ scrollBehavior: 'smooth' }}
              >
                {allImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="w-full h-full shrink-0 snap-center snap-always relative flex items-center justify-center cursor-pointer rounded-none"
                  >
                    <img
                      src={imgUrl}
                      alt={`${item.title} photo ${idx + 1}`}
                      className="w-full h-full object-cover select-none rounded-none"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {/* Prev / Next navigation buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all active:scale-90 z-20 cursor-pointer focus-visible:outline-none"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next image"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all active:scale-90 z-20 cursor-pointer focus-visible:outline-none"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </>
              )}

              {/* Photo counter */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-xs z-10 pointer-events-none shadow-md">
                  {activeImageIndex + 1}/{allImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail preview strip */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToImageIndex(idx)}
                    className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                      activeImageIndex === idx
                        ? 'border-[#2D8EDE] ring-2 ring-blue-200 scale-95'
                        : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {failedThumbnails[idx] ? (
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    ) : (
                      <img
                        src={img}
                        alt=""
                        onError={() => {
                          setFailedThumbnails((prev) => ({ ...prev, [idx]: true }));
                        }}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Category & Condition Badges (No location) */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 shadow-xs flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#2D8EDE] rounded-xl border border-blue-200 text-xs font-black">
                <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{item.category}</span>
              </div>

              <div className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-xl text-xs font-extrabold">
                {item.condition}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 sm:p-5 shadow-xs">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2D8EDE]" />
                <span>Description</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line">
                {item.description ||
                  'High quality furniture piece available on PinIn. Well maintained and ready for immediate purchase.'}
              </p>

              {item.dimensions && (
                <p className="text-xs font-bold text-gray-500 mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
                  <span className="font-extrabold text-gray-800">Dimensions:</span>
                  <span className="text-gray-700 font-semibold">{item.dimensions}</span>
                </p>
              )}
            </div>

            {/* Product Information (Info written in Supabase) */}
            {item.productInformation && item.productInformation.trim() !== '' && (
              <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 sm:p-5 shadow-xs space-y-2">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#2D8EDE]" />
                  <span>Product Information</span>
                </h2>
                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200">
                  {item.productInformation}
                </div>
              </div>
            )}

            {/* Customer Reviews Section */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Customer Reviews</span>
                </h2>
                {item.reviewsList && item.reviewsList.length > 0 && (
                  <span className="text-[11px] font-bold text-gray-500">
                    {item.reviewsList.length} review(s)
                  </span>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-2.5">
                {item.reviewsList && item.reviewsList.length > 0 ? (
                  item.reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-gray-900">{rev.author}</span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-700 font-medium leading-relaxed">
                        {rev.comment}
                      </p>
                      {rev.date && <span className="text-[10px] text-gray-400 block pt-0.5">{rev.date}</span>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 font-medium italic py-2">
                    No reviews made yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Price, Add to Cart / Buy Now, and Clean Non-Clickable Seller Info */}
          <div className="md:col-span-6 lg:col-span-5 space-y-3.5">
            {/* Title, Price, Save Bookmark & Share */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight flex-1">
                  {item.title}
                </h1>

                {/* Save / Bookmark Icon */}
                <button
                  type="button"
                  onClick={(e) => onToggleSave(item.id, e)}
                  aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
                  className="w-11 h-11 rounded-2xl bg-gray-50 hover:bg-blue-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#2D8EDE] active:scale-90 transition-all shrink-0 shadow-xs cursor-pointer"
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      isSaved
                        ? 'fill-[#2D8EDE] text-[#2D8EDE]'
                        : 'text-gray-700 hover:text-[#2D8EDE]'
                    }`}
                  />
                </button>
              </div>

              {/* Price & Share */}
              <div className="flex items-center justify-between pt-1">
                <div className="bg-[#2D8EDE] text-white text-base sm:text-lg font-black px-4 py-1.5 rounded-xl shadow-xs inline-flex items-center">
                  R{item.price}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await handleNativeShare(item);
                    onShare?.(item);
                  }}
                  className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Share className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Value Highlights: in stock, warranty, returns, pay in person each in their own blue box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-[#2D8EDE] text-white text-xs sm:text-sm font-extrabold py-2 px-2.5 rounded-xl shadow-xs flex items-center justify-center text-center">
                  In stock
                </div>
                <div className="bg-[#2D8EDE] text-white text-xs sm:text-sm font-extrabold py-2 px-2.5 rounded-xl shadow-xs flex items-center justify-center text-center">
                  Warranty
                </div>
                <div className="bg-[#2D8EDE] text-white text-xs sm:text-sm font-extrabold py-2 px-2.5 rounded-xl shadow-xs flex items-center justify-center text-center">
                  Returns
                </div>
                <div className="bg-[#2D8EDE] text-white text-xs sm:text-sm font-extrabold py-2 px-2.5 rounded-xl shadow-xs flex items-center justify-center text-center">
                  Pay in person
                </div>
              </div>

              {/* Delivery Estimation */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white text-[#2D8EDE] flex items-center justify-center shadow-2xs">
                    <Truck className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                      Delivery Estimation
                    </span>
                    <span className="text-xs font-black text-gray-900">
                      {getEstimatedDeliveryDateRange()}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-100 shadow-2xs">
                  Door-to-door
                </span>
              </div>
            </div>

            {/* Purchase & Cart Actions */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Sold by (without sign icon and without verified seller) */}
              <div className="pb-3 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Sold by
                </span>
                <p className="font-extrabold text-xs sm:text-sm text-gray-900 mt-0.5">
                  {item.soldBy || sellerDisplayName}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-gray-700">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-black text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Button: Add to Cart only (no Buy Now) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>

              {/* Feedback toast when added to cart */}
              {addedToCartFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3] text-emerald-600" />
                    <span>Added to your cart!</span>
                  </div>
                  {onOpenCart && (
                    <button
                      type="button"
                      onClick={onOpenCart}
                      className="underline text-emerald-700 hover:text-emerald-900 font-extrabold cursor-pointer"
                    >
                      View Cart
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </main>

      {/* Comprehensive Report Modal */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <h3 className="text-sm font-black text-gray-900">Report Listing</h3>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
              <p className="text-xs text-gray-600 font-medium pb-1">
                Please specify why you are reporting "{item.title}":
              </p>

              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    reportReason === reason
                      ? 'border-[#2D8EDE] bg-blue-50/60 text-gray-900 shadow-2xs'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="text-[#2D8EDE] focus:ring-[#2D8EDE]"
                  />
                  <span className="capitalize">{reason}</span>
                </label>
              ))}

              {reportReason.toLowerCase() === 'other' && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Write your reason:
                  </label>
                  <textarea
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    placeholder="Write your reason here..."
                    rows={3}
                    autoFocus
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:border-[#2D8EDE] focus:ring-1 focus:ring-[#2D8EDE] outline-none font-medium text-gray-900 placeholder:text-gray-400 resize-none bg-gray-50/50"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReport}
                disabled={reportReason.toLowerCase() === 'other' && !otherDetails.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {isPhotoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center select-none"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPhotoModalOpen(false);
            }}
            aria-label="Close photo view"
            className="absolute top-4 left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 active:scale-90 shadow-lg"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div
            className="relative w-full h-full max-w-4xl p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allImages[activeImageIndex] || item.imageUrl}
              alt={item.title}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain mx-auto shadow-2xl rounded-none"
            />
          </div>

          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/75 px-3.5 py-1 rounded-full text-white text-xs font-bold border border-white/10 backdrop-blur-sm pointer-events-none">
              {activeImageIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
