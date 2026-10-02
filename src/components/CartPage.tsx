import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle,
  Truck,
  MapPin,
  Home,
  User,
  ShieldCheck,
  Package,
} from 'lucide-react';
import {
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  getCartSubtotal,
  subscribeToCart,
  CartItem,
} from '../services/cartService';
import { createOrder, OrderRecord } from '../services/ordersService';
import { UserAccount, DeliveryAddress } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import {
  DeliveryAddressPage,
  getSavedDeliveryAddress,
} from './DeliveryAddressPage';

interface CartPageProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserAccount;
  onGoHome: () => void;
  onOpenAccount: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  isOpen,
  onClose,
  user,
  onGoHome,
  onOpenAccount,
}) => {
  const [items, setItems] = useState<CartItem[]>(getCartItems());
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'collection'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.location || '');
  const [isAddressPageOpen, setIsAddressPageOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<DeliveryAddress | null>(() => getSavedDeliveryAddress());
  const [buyerName, setBuyerName] = useState(
    user?.isLoggedIn ? (user.surname ? `${user.name} ${user.surname}` : user.name) : ''
  );
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2400); // 2.4s artificial delay showing shimmer skeleton

      // Retrieve saved delivery address to show it at the top
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

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, i) => acc + (i.price || 0) * (i.quantity || 1), 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 150 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    if (!buyerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!buyerEmail.trim() || !buyerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for your order confirmation.');
      return;
    }

    if (deliveryMethod === 'delivery' && !currentAddress && !deliveryAddress.trim()) {
      setErrorMessage('Please add a delivery address to proceed.');
      setIsAddressPageOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order in Supabase with all requested fields
      const itemsTitle = items.map((i) => `${i.title} (x${i.quantity})`).join(', ');
      const mainSellerName = items[0]?.sellerName || 'PinIn Verified Seller';
      const mainSellerId = items[0]?.sellerId;
      const mainListingId = items[0]?.listingId;
      const deliveryText =
        deliveryMethod === 'delivery'
          ? currentAddress
            ? `Courier Delivery to: ${currentAddress.streetAddressLine1}${
                currentAddress.streetAddressLine2 ? `, ${currentAddress.streetAddressLine2}` : ''
              }, ${currentAddress.cityTown}, ${currentAddress.province} (${currentAddress.postalCode})`
            : `Courier Delivery to: ${deliveryAddress.trim()}`
          : `Self Collection / Pickup in ${items[0]?.location || 'Gauteng'}`;

      const totalQuantity = items.reduce((acc, i) => acc + (i.quantity || 1), 0);
      const res = await createOrder({
        username: buyerName,
        userEmail: buyerEmail,
        buyerName,
        buyerEmail,
        buyerId: user?.isLoggedIn ? user.id : undefined,
        sellerName: mainSellerName,
        sellerId: mainSellerId,
        listingId: mainListingId,
        itemBought: itemsTitle,
        itemPrice: items[0]?.price || 0,
        price: grandTotal,
        quantity: totalQuantity,
        delivery: deliveryText,
        recipientName: currentAddress?.recipientName || buyerName,
        recipientPhone: currentAddress?.recipientPhone || '',
        streetAddressLine1: currentAddress?.streetAddressLine1 || deliveryAddress,
        streetAddressLine2: currentAddress?.streetAddressLine2 || undefined,
        cityTown: currentAddress?.cityTown || 'Johannesburg',
        province: currentAddress?.province || 'Gauteng',
        postalCode: currentAddress?.postalCode || '',
        deliveryInstructions: currentAddress?.deliveryInstructions || '',
        imageUrl: items[0]?.imageUrl,
        items: items.map((i) => ({
          listingId: i.listingId,
          itemBought: i.title,
          itemPrice: i.price,
          sellerName: i.sellerName || mainSellerName,
          sellerId: i.sellerId || mainSellerId,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
        })),
      });

      if (res.success && res.order) {
        clearCart();
        setPlacedOrder(res.order);
      } else {
        setErrorMessage(res.error || 'Failed to complete order. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
      {/* Header */}
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

          <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
            <ShoppingCart className="w-4 h-4 text-[#2D8EDE]" />
            <span>Cart</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl mx-auto overflow-y-auto px-4 md:px-6 py-4 pb-12">
        {placedOrder ? (
          /* Order Success View */
          <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 text-center space-y-5 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Order Placed Successfully
              </span>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 pt-1">
                Thank You for Your Order!
              </h1>
              <p className="text-xs md:text-sm text-gray-500">
                A confirmation has been recorded and the seller has been notified.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Order Number</span>
                <span className="font-extrabold text-gray-900 text-sm tracking-tight text-[#2D8EDE]">
                  {placedOrder.orderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">Username</span>
                <span className="font-bold text-gray-800">{placedOrder.username || placedOrder.buyerName}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">User Email</span>
                <span className="font-bold text-gray-800 truncate max-w-[180px]">
                  {placedOrder.userEmail || placedOrder.buyerEmail}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">Date Bought</span>
                <span className="font-bold text-gray-800">{placedOrder.dateBought}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">Item Bought</span>
                <span className="font-bold text-gray-900 truncate max-w-[200px]">
                  {placedOrder.itemBought}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">Quantity</span>
                <span className="font-bold text-gray-800">{placedOrder.quantity || 1}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">Item Price</span>
                <span className="font-bold text-gray-800">
                  R{placedOrder.itemPrice || placedOrder.price}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">Seller Name</span>
                <span className="font-bold text-gray-800">{placedOrder.sellerName}</span>
              </div>
              <div className="flex items-center justify-between py-1 bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                <span className="text-blue-700 font-bold">Delivery Estimation</span>
                <span className="font-black text-blue-900 truncate max-w-[200px]">
                  {placedOrder.deliveryEstimation || '2 to 5 days'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-500 font-medium">Delivery Mode</span>
                <span className="font-bold text-gray-800 truncate max-w-[200px]">
                  {placedOrder.delivery}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-800 font-extrabold text-sm">Total Paid</span>
                <span className="font-black text-[#2D8EDE] text-base">R{placedOrder.price}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPlacedOrder(null);
                  onGoHome();
                }}
                className="flex-1 py-3 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlacedOrder(null);
                  onOpenAccount();
                }}
                className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-800 font-bold text-xs sm:text-sm rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                View in Account
              </button>
            </div>
          </div>
        ) : isLoading ? (
          /* Shimmer Skeleton Loader for Cart Page */
          <div className="space-y-4 animate-pulse mt-2">
            {/* Delivery banner shimmer */}
            <div className="h-12 w-full bg-gray-200 rounded-2xl" />

            {/* Cart item shimmers */}
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

            {/* Order summary card shimmer */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="flex justify-between">
                <div className="h-3 w-1/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/6 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-1/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/6 bg-gray-200 rounded" />
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between">
                <div className="h-5 w-1/3 bg-gray-200 rounded" />
                <div className="h-5 w-1/4 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Place Order button shimmer */}
            <div className="h-12 w-full bg-gray-200 rounded-2xl" />
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-xs mt-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Your Cart is Empty</h2>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                Discover couches, dining sets, bedroom furniture, and decor listed across Gauteng.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoHome}
              className="py-2.5 px-6 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Browse Furniture
            </button>
          </div>
        ) : (
          /* Active Cart Form */
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Items List */}
            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#2D8EDE]" />
                  <span>Items in Cart</span>
                  <span className="text-gray-400 font-medium">({items.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex items-start gap-3">
                    <img
                      src={getOptimizedImageUrl(item.imageUrl, { width: 140, quality: 75, format: 'webp' })}
                      alt={item.title}
                      className="w-18 h-18 rounded-2xl object-cover border border-gray-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-[#2D8EDE] shrink-0" />
                        <span>{item.location}</span>
                        <span className="text-gray-300">•</span>
                        <span>{item.condition}</span>
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-black text-[#2D8EDE]">
                          R{item.price * item.quantity}
                        </span>

                        {/* Quantity and Delete */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.listingId, item.quantity - 1)}
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
                              onClick={() => updateCartQuantity(item.listingId, item.quantity + 1)}
                              className="p-1 hover:bg-gray-200 text-gray-700 rounded-r cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.listingId)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Option */}
            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs space-y-3">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#2D8EDE]" />
                <span>Delivery or Collection</span>
              </h2>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    deliveryMethod === 'delivery'
                      ? 'border-[#2D8EDE] bg-blue-50/70 text-gray-900 ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-extrabold text-xs">Courier Delivery</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Gauteng door-to-door (+R150)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod('collection')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    deliveryMethod === 'collection'
                      ? 'border-[#2D8EDE] bg-blue-50/70 text-gray-900 ring-2 ring-blue-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-extrabold text-xs">Self Collection</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Pick up from seller (Free)</p>
                </button>
              </div>

              {deliveryMethod === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Delivery Address / Suburb *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. 14 Sandton Drive, Sandton, Gauteng"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                  />
                </div>
              )}
            </div>

            {/* Buyer Information (for order placement) */}
            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs space-y-3">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2D8EDE]" />
                <span>Buyer Details</span>
              </h2>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Thabo Ndlovu"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="e.g. thabo@example.co.za"
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">R{subtotal}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Delivery</span>
                <span className="font-bold text-gray-900">
                  {deliveryFee === 0 ? 'Free (Self Collection)' : `R${deliveryFee}`}
                </span>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-black text-gray-900">Total</span>
                <span className="font-black text-[#2D8EDE] text-base">R{grandTotal}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold">
                {errorMessage}
              </div>
            )}

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Placing Order...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Place Order • R{grandTotal}</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>

      {/* Bottom Navigation Dock */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-3 items-center">
          {/* 1. Home */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Home"
          >
            <Home className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#2D8EDE]" />
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Home
            </span>
          </button>

          {/* 2. Cart (Active) */}
          <button
            type="button"
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all relative cursor-pointer text-[#2D8EDE]"
            aria-label="Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 stroke-[2] text-[#2D8EDE]" />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#2D8EDE] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {items.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-[#2D8EDE]">Cart</span>
          </button>

          {/* 3. Account */}
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
