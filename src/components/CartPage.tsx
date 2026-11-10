import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle,
  Check,
  AlertCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  subscribeToCart,
  CartItem,
} from '../services/cartService';
import { createOrder, OrderRecord } from '../services/ordersService';
import { isListingInStock } from '../services/listingStockService';
import {
  fetchDeliveryMethods,
  DEFAULT_DELIVERY_METHODS,
  DeliveryMethodOption,
} from '../services/deliveryMethodsService';
import { UserAccount, DeliveryAddress } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import {
  DeliveryAddressPage,
  getSavedDeliveryAddress,
} from './DeliveryAddressPage';
import { CheckoutPage } from './CheckoutPage';

interface CartPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onGoHome: () => void;
  onOpenCategories?: () => void;
  onOpenAccount: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onSelectItem?: (item: any) => void;
}

const SwipeableCartCard: React.FC<{
  item: CartItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onSelectItem?: (item: any) => void;
  onZoomImage?: (img: { url: string; title: string }) => void;
  onUpdateQuantity: (listingId: string, qty: number) => void;
  onRemove: (listingId: string) => void;
}> = ({ item, isSelected, onToggleSelect, onSelectItem, onZoomImage, onUpdateQuantity, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -35 || info.velocity.x < -250) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const itemId = item.listingId || item.id;
  const inStock = isListingInStock({ id: item.listingId, title: item.title });

  return (
    <div className="relative overflow-hidden rounded-2xl group select-none">
      {/* Background Revealed Action: Red Delete option on the right */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-600 rounded-2xl flex items-center justify-center z-0">
        <button
          type="button"
          onClick={() => onRemove(item.listingId)}
          className="w-full h-full flex items-center justify-center text-white active:scale-95 transition-transform p-2 cursor-pointer font-black text-xs uppercase tracking-wider"
          aria-label="Delete item"
        >
          Delete
        </button>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={{ x: isOpen ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          }
        }}
        className="relative z-10 bg-white py-3 border-b border-gray-200 last:border-b-0 flex items-center gap-2.5 cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* Selection Checkbox on left side next to each item picture */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(itemId);
          }}
          className="cursor-pointer shrink-0 p-1 -ml-1 text-gray-500 hover:text-[#2D8EDE] focus:outline-none flex items-center justify-center"
          aria-label={isSelected ? `Deselect ${item.title}` : `Select ${item.title}`}
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-[#2D8EDE] text-white shadow-xs'
                : 'border-2 border-gray-300 bg-white hover:border-[#2D8EDE]'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onZoomImage) {
              onZoomImage({ url: item.imageUrl, title: item.title });
            } else if (onSelectItem) {
              const targetListingId = item.listingId || item.id;
              onSelectItem({
                id: targetListingId,
                title: item.title,
                price: item.price,
                imageUrl: item.imageUrl,
                location: item.location,
                category: item.category || 'Clothing',
                condition: item.condition || 'New',
                sellerName: item.sellerName,
                sellerId: item.sellerId,
              });
            }
          }}
          className="cursor-zoom-in shrink-0 focus-visible:outline-none group/img"
          aria-label={`Zoom image for ${item.title}`}
        >
          <img
            src={getOptimizedImageUrl(item.imageUrl, { width: 140, quality: 75, format: 'webp' })}
            alt={item.title}
            className="w-18 h-18 rounded-none object-cover border border-gray-200 hover:opacity-90 active:scale-95 transition-all"
          />
        </button>

        <div className="flex-1 min-w-0">
          <h3
            onClick={(e) => {
              e.stopPropagation();
              const targetListingId = item.listingId || item.id;
              if (onSelectItem) {
                onSelectItem({
                  id: targetListingId,
                  title: item.title,
                  price: item.price,
                  imageUrl: item.imageUrl,
                  location: item.location,
                  category: item.category || 'Clothing',
                  condition: item.condition || 'New',
                  sellerName: item.sellerName,
                  sellerId: item.sellerId,
                });
              }
            }}
            className="font-extrabold text-xs sm:text-sm text-gray-900 truncate cursor-pointer hover:text-[#2D8EDE] transition-colors"
          >
            {item.title}
          </h3>

          {item.size && (
            <p className="text-[11px] font-bold text-gray-500 mt-0.5">
              Size: {item.size}
            </p>
          )}

          {/* Out of stock warning below item */}
          {!inStock && (
            <p className="text-[11px] font-black text-red-600 mt-0.5">
              Out of stock
            </p>
          )}

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm font-black text-[#2D8EDE]">
              R{item.price * item.quantity}
            </span>

            {/* Quantity controls without trash icon */}
            <div
              className="flex items-center border border-gray-200 rounded-lg bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.listingId, item.quantity - 1)}
                className="p-1 hover:bg-gray-200 text-gray-700 rounded-l cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 text-xs font-bold text-gray-800">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.listingId, Math.min(5, item.quantity + 1))}
                disabled={item.quantity >= 5}
                className={`p-1 text-gray-700 rounded-r ${
                  item.quantity >= 5 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 cursor-pointer'
                }`}
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const CartPage: React.FC<CartPageProps> = ({
  isOpen,
  onClose,
  user,
  onGoHome,
  onOpenAccount,
  onOpenAuth,
  onSelectItem,
}) => {
  const [items, setItems] = useState<CartItem[]>(getCartItems());
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethodOption[]>(DEFAULT_DELIVERY_METHODS);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<string>('Door to door');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.location || '');
  const [isAddressPageOpen, setIsAddressPageOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<DeliveryAddress | null>(() => getSavedDeliveryAddress());
  const [buyerName, setBuyerName] = useState(
    user?.isLoggedIn ? (user.surname ? `${user.name} ${user.surname}` : user.name) : ''
  );
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Image Zoom at all sides state & gestures
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialScaleRef.current = zoomScale;
    } else if (e.touches.length === 1 && zoomScale > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...panPosition };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const nextScale = Math.min(4, Math.max(1, initialScaleRef.current * factor));
      setZoomScale(nextScale);
      if (nextScale === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && zoomScale > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPanPosition({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...panPosition };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomScale > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPanPosition({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchDeliveryMethods().then((res) => {
        if (res && res.length > 0) {
          setDeliveryMethods(res);
        }
      });

      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      const saved = getSavedDeliveryAddress();
      if (saved) {
        setCurrentAddress(saved);
        setDeliveryAddress(
          `${saved.streetAddressLine1}${saved.streetAddressLine2 ? `, ${saved.streetAddressLine2}` : ''}, ${saved.cityTown}, ${saved.province}`
        );
        if (!buyerName && saved.recipientName) {
          setBuyerName(saved.recipientName);
        }
      }

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Subscribe to live cart changes
  useEffect(() => {
    const unsubscribe = subscribeToCart((updated) => {
      setItems(updated);
    });
    return unsubscribe;
  }, []);

  // Update pre-filled info if user changes
  useEffect(() => {
    if (user?.isLoggedIn) {
      if (!buyerName) setBuyerName(user.surname ? `${user.name} ${user.surname}` : user.name);
      if (!buyerEmail) setBuyerEmail(user.email || '');
      if (!deliveryAddress && user.location) setDeliveryAddress(user.location);
    }
  }, [user]);

  const [unselectedItemIds, setUnselectedItemIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setUnselectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = items.filter((item) => !unselectedItemIds.has(item.listingId || item.id));
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setUnselectedItemIds(new Set(items.map((i) => i.listingId || i.id)));
    } else {
      setUnselectedItemIds(new Set());
    }
  };

  if (!isOpen) return null;

  const subtotal = selectedItems.reduce((acc, i) => acc + (Number(i.price) || 0) * (i.quantity || 1), 0);
  const isDeliveryFree = subtotal > 500;
  const doorToDoorMethod = deliveryMethods.find((dm) => dm.name.toLowerCase().includes('door')) || deliveryMethods[0] || { price: 60 };
  const doorToDoorPrice = doorToDoorMethod ? doorToDoorMethod.price : 60;
  const deliveryFee = isDeliveryFree ? 0 : doorToDoorPrice;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
      {/* Header */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-[#2D8EDE] hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
            <ShoppingCart className="w-4 h-4 text-[#2D8EDE]" />
            <span>Cart</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl mx-auto overflow-y-auto px-4 md:px-6 py-4 pb-12 flex flex-col">
        {placedOrder ? (
          /* Order Success View - cleanly rendered without surrounding box */
          <div className="p-4 md:p-6 text-center space-y-6 animate-in zoom-in-95 duration-200 my-auto w-full max-w-sm mx-auto">
            {/* 1. Successful Icon (make it blue) */}
            <div className="w-20 h-20 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-12 h-12 stroke-[2.5]" />
            </div>

            {/* 2 & 3: Order placed successfully (black) & Thank you for your order */}
            <div className="space-y-1.5">
              <h1 className="text-xl md:text-2xl font-black text-black">
                Order placed successfully
              </h1>
              <p className="text-sm font-semibold text-gray-600">
                Thank you for your order
              </p>
            </div>

            {/* 4 & 5: Continue shopping & Track order buttons */}
            <div className="flex flex-col gap-2.5 pt-4 max-w-xs mx-auto w-full">
              <button
                type="button"
                onClick={() => {
                  setPlacedOrder(null);
                  onGoHome();
                }}
                className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Continue shopping
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlacedOrder(null);
                  onOpenAccount();
                }}
                className="w-full py-3.5 px-4 bg-white border border-gray-300 text-gray-900 font-extrabold text-sm rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Track order
              </button>
            </div>
          </div>
        ) : isLoading ? (
          /* Shimmer Skeleton Loader for Cart Page */
          <div className="space-y-4 animate-pulse mt-2">
            <div className="h-12 w-full bg-gray-200 rounded-2xl" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-3 flex gap-3 items-center">
                  <div className="w-18 h-18 bg-gray-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                    <div className="flex justify-between items-center pt-1">
                      <div className="h-4 w-1/4 bg-gray-200 rounded" />
                      <div className="h-6 w-16 bg-gray-200 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-28 w-full bg-gray-200 rounded-2xl" />
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-xs mt-6 my-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Your Cart is Empty</h2>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Discover clothes, shoes, accessories, and new arrivals on PinIn.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoHome}
              className="py-2.5 px-6 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Browse Clothing
            </button>
          </div>
        ) : (
          /* Active Cart Form */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Cart Content: Items, Delivery Address, Delivery Methods, Price Summary */}
            <div className="flex-1 overflow-y-auto px-1 py-2 space-y-5">
              {/* Items List */}
              <div className="space-y-3 pb-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-2 cursor-pointer focus:outline-none text-left select-none"
                    aria-label={allSelected ? 'Deselect all items' : 'Select all items'}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        allSelected
                          ? 'bg-[#2D8EDE] text-white shadow-xs'
                          : 'border-2 border-gray-300 bg-white hover:border-[#2D8EDE]'
                      }`}
                    >
                      {allSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Items in Cart</span>
                      <span className="text-gray-400 font-medium">({selectedItems.length}/{items.length})</span>
                    </h2>
                  </button>
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    className="text-[11px] font-bold text-[#2D8EDE] hover:text-[#2579BE] cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const id = item.listingId || item.id;
                    const isSelected = !unselectedItemIds.has(id);
                    return (
                      <SwipeableCartCard
                        key={id}
                        item={item}
                        isSelected={isSelected}
                        onToggleSelect={handleToggleSelect}
                        onSelectItem={onSelectItem}
                        onZoomImage={(img) => {
                          setZoomedImage(img);
                          setZoomScale(1);
                          setPanPosition({ x: 0, y: 0 });
                        }}
                        onUpdateQuantity={updateCartQuantity}
                        onRemove={removeFromCart}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Delivery Section */}
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Delivery Address</span>
                  </h2>
                  {currentAddress && (
                    <button
                      type="button"
                      onClick={() => setIsAddressPageOpen(true)}
                      className="text-[11px] font-bold text-[#2D8EDE] hover:underline cursor-pointer"
                    >
                      Change address
                    </button>
                  )}
                </div>

                {currentAddress ? (
                  <div
                    onClick={() => setIsAddressPageOpen(true)}
                    className="p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 transition-colors space-y-1 text-left bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-xs text-gray-900">
                        {currentAddress.recipientName}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                        {currentAddress.province}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 font-medium">
                      {currentAddress.recipientPhone}
                    </p>
                    <p className="text-[11px] text-gray-700">
                      {currentAddress.streetAddressLine1}
                      {currentAddress.streetAddressLine2 ? `, ${currentAddress.streetAddressLine2}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-600">
                      {currentAddress.cityTown}, {currentAddress.province}, {currentAddress.postalCode}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddressPageOpen(true)}
                    className="w-full py-2.5 px-4 border border-gray-300 hover:border-[#2D8EDE] rounded-xl text-center font-bold text-xs text-gray-900 transition-colors cursor-pointer"
                  >
                    Add delivery address
                  </button>
                )}

                {/* Delivery Method: Door to door */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-black text-gray-900 uppercase tracking-wider block">
                    Delivery Method
                  </label>

                  <div className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-xs text-gray-900">Door to door</p>
                      <p className="text-[11px] font-bold text-[#2D8EDE] mt-0.5">
                        {isDeliveryFree ? (
                          <span className="font-black text-emerald-600">Free</span>
                        ) : (
                          `R${doorToDoorPrice}`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Summary with Grey Divider */}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-gray-900">R{subtotal}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-bold text-gray-900">
                    {isDeliveryFree ? (
                      <span className="text-emerald-600 font-black">Free</span>
                    ) : (
                      `R${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="h-px bg-gray-200 my-1" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="font-black text-[#2D8EDE] text-base">R{grandTotal}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Pinned & Always Visible "Proceed to check out" Bottom Box */}
      {items.length > 0 && !placedOrder && (
        <div className="shrink-0 z-30 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-3px_10px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            disabled={selectedItems.length === 0}
            onClick={(e) => {
              if (selectedItems.length === 0) return;

              if (!user?.isLoggedIn) {
                e.preventDefault();
                if (onOpenAuth) {
                  onOpenAuth('signin');
                }
                return;
              }

              // check delivery address
              if (!currentAddress && !deliveryAddress.trim()) {
                setErrorMessage('Please add a delivery address to proceed.');
                setIsAddressPageOpen(true);
                return;
              }

              // check for out-of-stock items in selected
              const outOfStockSelected = selectedItems.filter(
                (item) => !isListingInStock({ id: item.listingId, title: item.title })
              );
              if (outOfStockSelected.length > 0) {
                setErrorMessage(
                  `Some selected items are out of stock: ${outOfStockSelected.map((i) => i.title).join(', ')}. Please unselect or remove them to proceed.`
                );
                return;
              }

              setErrorMessage('');
              setIsCheckoutOpen(true);
            }}
            className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center capitalize"
          >
            <span>
              proceed to check out {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
            </span>
          </button>
        </div>
      )}

      {/* Full Page: Delivery Address */}
      <DeliveryAddressPage
        isOpen={isAddressPageOpen}
        onClose={() => setIsAddressPageOpen(false)}
        onSaveAddress={(addr) => {
          setCurrentAddress(addr);
          setDeliveryAddress(
            `${addr.streetAddressLine1}${addr.streetAddressLine2 ? `, ${addr.streetAddressLine2}` : ''}, ${addr.cityTown}, ${addr.province}`
          );
          if (addr.recipientName) {
            setBuyerName(addr.recipientName);
          }
        }}
        title="Delivery Address"
      />

      {/* Checkout Page */}
      <CheckoutPage
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={selectedItems}
        deliveryAddress={currentAddress}
        deliveryMethodName={selectedDeliveryMethod}
        deliveryFee={deliveryFee}
        onUpdateDeliveryAddress={(addr) => {
          setCurrentAddress(addr);
          setDeliveryAddress(
            `${addr.streetAddressLine1}${addr.streetAddressLine2 ? `, ${addr.streetAddressLine2}` : ''}, ${addr.cityTown}, ${addr.province}`
          );
          if (addr.recipientName) {
            setBuyerName(addr.recipientName);
          }
        }}
        user={user}
        onOrderSuccess={(order) => {
          try {
            localStorage.setItem('pinin_has_ever_ordered', 'true');
          } catch {}
          setIsCheckoutOpen(false);
          setPlacedOrder(order);
        }}
      />

      {/* Fullscreen Photo Zoom Modal - Zoom at all sides */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-white flex flex-col justify-between items-center select-none animate-fadeIn"
          onClick={() => {
            if (zoomScale === 1) setZoomedImage(null);
            else {
              setZoomScale(1);
              setPanPosition({ x: 0, y: 0 });
            }
          }}
        >
          {/* Top Bar with Go Back */}
          <div className="w-full p-4 flex items-center justify-between z-20 bg-white border-b border-gray-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomScale(1);
                setPanPosition({ x: 0, y: 0 });
                setZoomedImage(null);
              }}
              aria-label="Close photo view"
              className="w-11 h-11 rounded-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center transition-all cursor-pointer border border-gray-200 active:scale-90 shadow-md"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextScale = Math.max(1, zoomScale - 0.5);
                  setZoomScale(nextScale);
                  if (nextScale === 1) setPanPosition({ x: 0, y: 0 });
                }}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-700 min-w-[3rem] text-center select-none">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale((prev) => Math.min(4, prev + 0.5));
                }}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <div className="w-11" />
          </div>

          {/* Center Zoomable & Pannable Image on All Sides */}
          <div
            className="relative w-full flex-1 flex items-center justify-center overflow-hidden p-2 touch-none bg-white cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (zoomScale === 1) {
                setZoomScale(2.5);
              } else {
                setZoomScale(1);
                setPanPosition({ x: 0, y: 0 });
              }
            }}
          >
            <img
              src={zoomedImage.url}
              alt={zoomedImage.title}
              style={{
                transform: `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain mx-auto select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Bottom Bar: Instructions */}
          <div className="w-full pb-6 pt-2 flex items-center justify-center z-20 bg-white">
            <div className="bg-gray-100 px-4 py-1.5 rounded-full text-gray-700 text-xs font-bold border border-gray-200 shadow-xs pointer-events-none">
              {zoomScale > 1 ? 'Drag in any direction to pan • Double-tap to reset' : 'Pinch or double-tap to zoom'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
