import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  MapPin,
  Send,
  MoreVertical,
  Flag,
  Share,
  Check,
  AlertCircle,
  X,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { FurnitureItem, UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { Share as NativeShare } from '@capacitor/share';

interface ListingDetailPageProps {
  item: FurnitureItem | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onSendMessageToSeller: (item: FurnitureItem, message: string) => void;
  onShare: (item: FurnitureItem) => void;
  onReport?: (item: FurnitureItem, reason: string, details?: string) => void;
  onOpenSearch?: () => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  user?: UserAccount;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
}

const REPORT_REASONS = [
  'Requires deposit',
  'Fake photos',
  'Inappropriate content',
  'Spam / duplicate listing',
  'Item is already sold / unavailable',
  'Suspected scam / fraudulent listing',
  'Illegal',
  'Abusive / rude seller',
  'Other',
];

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  item,
  isOpen,
  onClose,
  isSaved = false,
  onToggleSave,
  onSendMessageToSeller,
  onShare,
  onReport,
  user,
  onOpenAuth,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<number, boolean>>({});
  const [messageInput, setMessageInput] = useState('');
  const [messageSentFeedback, setMessageSentFeedback] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Requires deposit');
  const [otherDetails, setOtherDetails] = useState('');
  
  // Scam Alert Notice modal state
  const [isScamWarningOpen, setIsScamWarningOpen] = useState(false);
  const [isUnderstoodChecked, setIsUnderstoodChecked] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  const carouselRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !item) return null;

  // Multiple photos support - gather all available photos (optimized for egress)
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

  // Check if current user is the owner / seller of this item
  const isOwnListing =
    user?.isLoggedIn &&
    ((user?.id && (user.id === item.seller.id || user.id === (item as any).userId)) ||
      (user?.email && item.seller.email && user.email.toLowerCase() === item.seller.email.toLowerCase()) ||
      (user?.name && user.name.trim().toLowerCase() === item.seller.name.trim().toLowerCase()));

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

  // Keyboard navigation for image carousel
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

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (!user?.isLoggedIn) {
      if (onOpenAuth) {
        onOpenAuth('signin');
      } else {
        alert('Please sign in to message sellers.');
      }
      return;
    }

    // Trigger Scam alert popup requirement before sending message
    setPendingMessage(messageInput.trim());
    setIsUnderstoodChecked(false);
    setIsScamWarningOpen(true);
  };

  const handleConfirmSendMessage = () => {
    if (!isUnderstoodChecked || !pendingMessage) return;

    onSendMessageToSeller(item, pendingMessage);
    setIsScamWarningOpen(false);
    setMessageSentFeedback(true);
    setMessageInput('');
    setPendingMessage('');
    setTimeout(() => {
      setMessageSentFeedback(false);
    }, 3500);
  };

  const handleConfirmReport = () => {
    if (onReport) {
      const finalReason = reportReason;
      const customText = reportReason === 'Other' ? otherDetails : undefined;
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
        dialogTitle: 'Share via',
      });
    } catch (err: any) {
      const errStr = String(err?.message || err || '');
      if (
        errStr.includes('canceled') ||
        errStr.includes('cancelled') ||
        errStr.includes('AbortError') ||
        errStr.includes('dismissed')
      ) {
        return;
      }
      console.warn('Native share error:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none"
      onClick={() => setIsMenuOpen(false)}
    >
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

          {/* 3 dots */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              aria-label="More options"
              className="p-2 -mr-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
            >
              <MoreVertical className="w-5 h-5 stroke-[2.5] text-gray-700 hover:text-[#0052FF]" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await handleNativeShare(item);
                    onShare?.(item);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-800 hover:bg-blue-50 hover:text-[#0052FF] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Share className="w-4 h-4 text-[#0052FF]" />
                  <span>Share listing</span>
                </button>

                <div className="h-px bg-gray-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsReportModalOpen(true);
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Flag className="w-4 h-4 text-red-500" />
                  <span>Report listing</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area (Scrollable - responsive for tablet/laptop) */}
      <main className="flex-1 w-full max-w-md md:max-w-5xl lg:max-w-6xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 pt-3 pb-8">
        <div className="md:grid md:grid-cols-12 md:gap-8 md:items-start space-y-3.5 md:space-y-0">
          {/* Left Column on Desktop/Tablet: Image Carousel, Category/Location Space, and Description Space */}
          <div className="md:col-span-6 lg:col-span-7 space-y-3.5">
            {/* Swipeable Images Carousel with square corners */}
            <div className="relative aspect-4/3 bg-gray-900 rounded-none overflow-hidden border-2 border-gray-200 shadow-md group">
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none touch-pan-x"
                style={{ scrollBehavior: 'smooth' }}
              >
                {allImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="w-full h-full shrink-0 snap-center snap-always relative flex items-center justify-center bg-gray-950 cursor-pointer"
                  >
                    <img
                      src={imgUrl}
                      alt={`${item.title} photo ${idx + 1}`}
                      className="w-full h-full object-cover select-none"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {/* Photo counter at bottom left (e.g. 1/5) - without arrows */}
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-xs z-10 pointer-events-none shadow-md">
                  {activeImageIndex + 1}/{allImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail preview strip for quick switching when multiple images exist */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToImageIndex(idx)}
                    className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white ${
                      activeImageIndex === idx
                        ? 'border-[#0052FF] ring-2 ring-blue-200 scale-95'
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

            {/* Space for Location & Category directly under the Image */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Location */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      Location
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                      {item.location}
                    </span>
                  </div>
                </div>

                {/* Category & Condition Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#0052FF] rounded-xl border border-blue-200 text-xs font-black">
                    <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{item.category}</span>
                  </div>

                  <div className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-xl text-xs font-extrabold">
                    {item.condition}
                  </div>
                </div>
              </div>
            </div>

            {/* Space for Description directly under Category & Location */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 sm:p-5 shadow-xs">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
                <span>Description</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line">
                {item.description ||
                  'Beautiful and high quality furniture piece in excellent condition. Well taken care of and ready for pickup.'}
              </p>

              {item.dimensions && (
                <p className="text-xs font-bold text-gray-500 mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
                  <span className="font-extrabold text-gray-800">Dimensions:</span>
                  <span className="text-gray-700 font-semibold">{item.dimensions}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right Column on Desktop/Tablet: Title, Price, Messaging, and Safety */}
          <div className="md:col-span-6 lg:col-span-5 space-y-3.5">
            {/* Title, Price with Rand 'R', Save Bookmark & Share */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 sm:p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight leading-tight flex-1">
                  {item.title}
                </h1>

                {/* Save / Bookmark Icon */}
                <button
                  type="button"
                  onClick={(e) => onToggleSave(item.id, e)}
                  aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
                  className="w-11 h-11 rounded-2xl bg-gray-50 hover:bg-blue-50 border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#0052FF] active:scale-90 transition-all shrink-0 shadow-xs cursor-pointer"
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      isSaved
                        ? 'fill-[#0052FF] text-[#0052FF]'
                        : 'text-gray-700 hover:text-[#0052FF]'
                    }`}
                  />
                </button>
              </div>

              {/* Price with Rand 'R' */}
              <div className="flex items-center justify-between pt-1">
                <div className="bg-[#0052FF] text-white text-base sm:text-lg font-black px-4 py-1.5 rounded-xl shadow-xs inline-flex items-center">
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
            </div>

            {/* Message Seller & Seller Profile Section */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 shadow-xs flex items-center gap-3">
              {/* If the current user owns this item, sellers cannot message themselves */}
              {isOwnListing ? (
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-center">
                  <p className="text-xs sm:text-sm font-bold text-[#0052FF]">
                    This is your listing
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                    You can manage, edit, or delete it from your Account page.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSendDirectMessage}
                  className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-2xl p-2.5 flex flex-col justify-between"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="message seller..."
                    aria-label="Message seller"
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 font-semibold px-1 py-1 outline-none"
                  />

                  <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-200/80">
                    {messageSentFeedback ? (
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Message sent!</span>
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                        Message
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="py-1.5 px-4 bg-[#0052FF] hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-black rounded-xl active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Seller Profile Icon & Name */}
              <div className="flex flex-col items-center text-center shrink-0 w-20 sm:w-24">
                <img
                  src={getOptimizedImageUrl(item.seller.avatar || DEFAULT_AVATAR_IMAGE, { width: 200, quality: 75, format: 'webp' })}
                  alt={item.seller.name}
                  loading="lazy"
                  decoding="async"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-gray-200 shadow-xs"
                />
                <span className="text-xs font-extrabold text-gray-900 line-clamp-1 mt-1">
                  {item.seller.name}
                </span>
                <span className="text-[10px] font-bold text-[#0052FF]">
                  {isOwnListing ? 'You' : 'Seller'}
                </span>
              </div>
            </div>

            {/* Buyer Safety Tips Banner */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <p className="font-extrabold text-amber-950">Safety Reminder</p>
                <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                  Always physically inspect the furniture in person before making any payment. Never pay deposits upfront.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Scam Alert Modal when user clicks message seller */}
      {isScamWarningOpen && (
        <div
          className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsScamWarningOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border-2 border-amber-300 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                  Buyer Safety Protocol
                </span>
                <h3 className="text-sm sm:text-base font-black text-gray-900 leading-tight">
                  Scam Alert: Do Not Pay Deposits
                </h3>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-xs text-gray-800 leading-relaxed font-medium space-y-2">
              <p>
                <strong>Never pay any deposit or transfer funds</strong> before physically inspecting the furniture in person.
              </p>
              <p className="text-gray-700">
                PinIn does not process transactions, hold money in escrow, or offer delivery guarantees. Always meet the seller in a safe location to view the item first before making any payment.
              </p>
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100/80 cursor-pointer transition-all select-none">
              <input
                type="checkbox"
                checked={isUnderstoodChecked}
                onChange={(e) => setIsUnderstoodChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#0052FF] focus:ring-[#0052FF] border-gray-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-800 leading-snug">
                I understand that PinIn does not handle payments and agree never to pay a deposit before inspecting the item in person.
              </span>
            </label>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsScamWarningOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendMessage}
                disabled={!isUnderstoodChecked}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0052FF] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Send Message</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Report Modal with all requested options */}
      {isReportModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-gray-900">
                  Report Listing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Report Options */}
            <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
              <p className="text-xs text-gray-600 font-medium pb-1">
                Please specify why you are reporting "{item.title}":
              </p>

              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    reportReason === reason
                      ? 'border-[#0052FF] bg-blue-50/60 text-gray-900 shadow-2xs'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="text-[#0052FF] focus:ring-[#0052FF]"
                  />
                  <span className="capitalize">{reason}</span>
                </label>
              ))}

              {/* Text box if 'Other' is selected */}
              {reportReason === 'Other' && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Describe the issue in detail:
                  </label>
                  <textarea
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    placeholder="Provide additional context to help our moderation team..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:border-[#0052FF] focus:ring-1 focus:ring-[#0052FF] outline-none font-medium text-gray-900 placeholder:text-gray-400 resize-none bg-gray-50/50"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Buttons */}
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
                disabled={reportReason === 'Other' && !otherDetails.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Listing Photo Modal */}
      {isPhotoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center select-none"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          {/* Top-left back button (X) */}
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

          {/* Centered Image */}
          <div
            className="relative w-full h-full max-w-4xl p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allImages[activeImageIndex] || item.imageUrl}
              alt={item.title}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain mx-auto shadow-2xl rounded-lg"
            />
          </div>

          {/* Counter at bottom if multiple photos */}
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
