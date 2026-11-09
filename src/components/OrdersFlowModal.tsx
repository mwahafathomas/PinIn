import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Check,
  Truck,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { OrderRecord, OrderItem, getLocalOrders } from '../services/ordersService';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import {
  fetchOrderCancellationMessage,
  submitOrderRefundRequest,
} from '../services/returnsAndRefundsService';
import { supabase } from '../supabaseClient';
import { getCachedArchivedImage, getArchivedListingImage } from '../services/listingArchiveService';

interface OrdersFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onOpenReturns?: (order?: OrderRecord) => void;
  onOpenListing?: (listingId: string) => void;
  onOpenPolicies?: () => void;
}

export const OrdersFlowModal: React.FC<OrdersFlowModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  onOpenReturns,
  onOpenListing,
  onOpenPolicies,
}) => {
  // Step state: 10 (Orders), 20 (All items), 30 (Track order), 40 (Cancel Order Explanation)
  const [step, setStep] = useState<10 | 20 | 30 | 40>(10);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Local state for orders so cancellations reflect immediately in UI
  const [ordersList, setOrdersList] = useState<OrderRecord[]>(orders);

  // Check if this user/device has ever bought anything
  const [hasEverBought, setHasEverBought] = useState<boolean>(() => {
    try {
      if (orders && orders.length > 0) return true;
      if (localStorage.getItem('pinin_has_ever_ordered') === 'true') return true;
      const local = getLocalOrders();
      if (local && local.length > 0) return true;
    } catch {}
    return false;
  });

  useEffect(() => {
    setOrdersList(orders);
    if (orders && orders.length > 0) {
      setHasEverBought(true);
      try {
        localStorage.setItem('pinin_has_ever_ordered', 'true');
      } catch {}
    }
  }, [orders]);

  // Refund / Cancellation States
  const [orderToRefund, setOrderToRefund] = useState<OrderRecord | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [ineligibleOrder, setIneligibleOrder] = useState<OrderRecord | null>(null);

  // Step 40 Page States
  const [isAgreeChecked, setIsAgreeChecked] = useState(false);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState<string>('');
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [unavailableMessage, setUnavailableMessage] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [archivedImages, setArchivedImages] = useState<Record<string, string>>({});

  // Preload archived images from listing_images_archive so deleted listings retain their original image
  useEffect(() => {
    const listingIds = new Set<string>();
    ordersList.forEach((ord) => {
      if (ord.listingId) listingIds.add(ord.listingId);
      ord.items?.forEach((it) => {
        if (it.listingId) listingIds.add(it.listingId);
      });
    });

    listingIds.forEach(async (id) => {
      const cached = getCachedArchivedImage(id);
      if (cached) {
        setArchivedImages((prev) => ({ ...prev, [id]: cached }));
      } else {
        const fetched = await getArchivedListingImage(id);
        if (fetched) {
          setArchivedImages((prev) => ({ ...prev, [id]: fetched }));
        }
      }
    });
  }, [ordersList]);

  // 8-second auto-dismissing success popup
  const [refundSuccessPopupOpen, setRefundSuccessPopupOpen] = useState(false);

  // Handle 8-second auto-dismiss timer
  useEffect(() => {
    if (refundSuccessPopupOpen) {
      const timer = setTimeout(() => {
        setRefundSuccessPopupOpen(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [refundSuccessPopupOpen]);

  if (!isOpen) return null;

  // Handle back navigation
  const handleBack = () => {
    if (step === 20 || step === 30 || step === 40) {
      setStep(10);
    } else {
      onClose();
    }
  };

  const DEFAULT_PRODUCT_FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=70&auto=format';

  // Helper to get up to 4 images for an order, with graceful fallback for deleted items
  const getOrderImages = (order: OrderRecord): string[] => {
    if (order.images && order.images.length > 0) {
      const valid = order.images.filter((img) => img && !failedImages[img]);
      if (valid.length > 0) return valid.slice(0, 4);
    }
    if (order.items && order.items.length > 0) {
      const extracted = order.items
        .map((i) => i.imageUrl || (i.listingId ? archivedImages[i.listingId] || getCachedArchivedImage(i.listingId) : null))
        .filter((img): img is string => typeof img === 'string' && img.length > 0 && !failedImages[img]);
      if (extracted.length > 0) {
        return extracted.slice(0, 4);
      }
    }
    const fallbackArchived = order.listingId ? archivedImages[order.listingId] || getCachedArchivedImage(order.listingId) : null;
    const finalOrderImg = order.imageUrl || fallbackArchived;
    if (finalOrderImg && !failedImages[finalOrderImg]) {
      return [finalOrderImg];
    }
    return [DEFAULT_PRODUCT_FALLBACK_IMAGE];
  };

  const handleItemClick = async (listingId?: string) => {
    if (!listingId) {
      setUnavailableMessage('The product is unavailable');
      return;
    }
    try {
      const { data } = await supabase
        .from('listings')
        .select('id, status')
        .eq('id', listingId)
        .maybeSingle();

      if (!data || data.status === 'deleted' || data.status === 'rejected') {
        setUnavailableMessage('The product is unavailable');
        return;
      }

      if (onOpenListing) {
        onOpenListing(listingId);
      }
    } catch {
      setUnavailableMessage('The product is unavailable');
    }
  };

  // Helper to format date/time for latest update
  const formatUpdateTime = (isoString?: string): string => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Check shipping progress
  const isOrderPaid = true; // Always blue with tick as requested
  const isShipped = (order?: OrderRecord | null): boolean => {
    if (!order) return false;
    const shipping = (order.shippingStatus || '').toLowerCase();
    const status = (order.status || order.deliveryStatus || '').toLowerCase();
    return (
      shipping === 'shipped' ||
      shipping === 'delivered' ||
      status.includes('shipped') ||
      status.includes('transit') ||
      status.includes('out for delivery') ||
      status.includes('delivered')
    );
  };
  const isDelivered = (order?: OrderRecord | null): boolean => {
    if (!order) return false;
    const shipping = (order.shippingStatus || '').toLowerCase();
    const status = (order.status || order.deliveryStatus || '').toLowerCase();
    return shipping === 'delivered' || (status.includes('delivered') && !status.includes('still'));
  };

  // Check if order is eligible for cancellation / refund
  // Eligible: 'order placed', 'order accepted', or 'being processed'
  const checkCancellationEligibility = (order: OrderRecord): boolean => {
    const s = (order.status || order.deliveryStatus || '').trim().toLowerCase();
    return s === 'order placed' || s === 'order accepted' || s === 'being processed';
  };

  // Handle clicking "Refund" on order card
  const handleRefundClick = (order: OrderRecord) => {
    const isEligible = checkCancellationEligibility(order);
    if (!isEligible) {
      setIneligibleOrder(order);
      return;
    }
    setOrderToRefund(order);
    setIsConfirmModalOpen(true);
  };

  // When user clicks "Continue" in the "Are you sure?" modal
  const handleContinueFromConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setIsAgreeChecked(false);
    setStep(40);
    setIsLoadingMessage(true);

    fetchOrderCancellationMessage()
      .then((msg) => {
        setCancellationMessage(msg);
      })
      .finally(() => {
        setIsLoadingMessage(false);
      });
  };

  // When user ticks box and clicks Continue on Step 40
  const handleFinalizeCancellationAndRefund = async () => {
    if (!orderToRefund) return;
    setIsSubmittingRefund(true);

    try {
      await submitOrderRefundRequest(orderToRefund);

      // Update in-memory orders list so status turns to 'Cancelled' immediately
      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === orderToRefund.id || o.orderNumber === orderToRefund.orderNumber
            ? { ...o, status: 'Cancelled', deliveryStatus: 'Cancelled' }
            : o
        )
      );

      setStep(10);
      setRefundSuccessPopupOpen(true);
    } catch (err) {
      console.warn('Error processing refund request:', err);
      setStep(10);
      setRefundSuccessPopupOpen(true);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1 & 2: Top Header Bar (1: Go back <, 2: App Name PinIn) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-300">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* 1: go back option ( < ) */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-900 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 2: app name PinIn */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-6" />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* PAGE 10: Orders Overview                                                  */}
      {/* ========================================================================= */}
      {step === 10 && (
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-md md:max-w-3xl mx-auto">
          {/* 3: place words "Orders" */}
          <div className="shrink-0 border-b border-gray-300 bg-gray-50/70 px-5 py-3">
            <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              Orders
            </h1>
          </div>

          <main className="flex-1 overflow-y-auto divide-y divide-gray-300 bg-white">
            {ordersList && ordersList.length > 0 ? (
              ordersList.map((order) => {
                const images = getOrderImages(order);
                const displayStatus =
                  order.status || order.deliveryStatus || 'Order placed';

                return (
                  <div
                    key={order.id || order.orderNumber}
                    onClick={() => {
                      setSelectedOrder(order);
                      setStep(20);
                    }}
                    className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[170px] hover:bg-blue-50/20 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    {/* Left Column: Image(s) */}
                    <div className="p-3 bg-white flex items-center justify-center">
                      {images.length <= 1 ? (
                        <div className="w-full h-full min-h-[140px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden p-2">
                          {images[0] ? (
                            <img
                              src={getOptimizedImageUrl(images[0], { width: 300, quality: 75, format: 'webp' })}
                              alt={order.itemBought}
                              className="max-h-32 w-auto object-contain pointer-events-none select-none"
                              loading="lazy"
                            />
                          ) : (
                            <Package className="w-10 h-10 text-gray-400 stroke-[1.5]" />
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 w-full h-full max-h-[150px]">
                          {images.slice(0, 4).map((imgUrl, idx) => (
                            <div
                              key={idx}
                              className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-gray-100"
                            >
                              <img
                                src={getOptimizedImageUrl(imgUrl, { width: 160, quality: 70, format: 'webp' })}
                                alt={`Item ${idx + 1}`}
                                className="w-full h-full object-contain pointer-events-none select-none"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Status (no box), Amount (no box), Return, Refund, Track order */}
                    <div className="p-3.5 flex flex-col justify-between space-y-2 bg-white">
                      {/* Status of order: words "Status" added, no box, non-clickable */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-default select-text truncate text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-gray-500 mr-1">Status</span>
                        <span className="font-black text-gray-900 truncate">{displayStatus}</span>
                      </div>

                      {/* Total price: no box, non-clickable */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-default select-text text-xs sm:text-sm font-black text-[#2D8EDE]"
                      >
                        R{order.price}
                      </div>

                      {/* Return button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenReturns) {
                            onOpenReturns(order);
                          }
                        }}
                        className="py-1.5 px-3 rounded-xl text-xs font-black bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 text-center cursor-pointer active:scale-95 transition-all shadow-2xs"
                      >
                        Return
                      </button>

                      {/* Refund button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefundClick(order);
                        }}
                        className="py-1.5 px-3 rounded-xl text-xs font-black bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 text-center cursor-pointer active:scale-95 transition-all shadow-2xs"
                      >
                        Refund
                      </button>

                      {/* Track order button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setStep(30);
                        }}
                        className="py-1.5 px-3 rounded-xl text-xs font-black bg-[#2D8EDE] hover:bg-[#2579BE] text-white border border-[#2D8EDE] text-center cursor-pointer active:scale-95 transition-all shadow-xs"
                      >
                        Track order
                      </button>
                    </div>
                  </div>
                );
              })
            ) : hasEverBought ? (
              /* Show clean white space while past orders are loading from Supabase */
              <div className="w-full flex-1 bg-white min-h-[320px]" />
            ) : (
              <div className="p-10 text-center space-y-3 my-auto">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
                  <Package className="w-7 h-7 stroke-[2]" />
                </div>
                <h2 className="text-sm font-extrabold text-gray-900">
                  No orders placed yet
                </h2>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When you purchase clothes or items on PinIn, your orders and their live tracking will appear here.
                </p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 20: All items in selected order                                      */}
      {/* ========================================================================= */}
      {step === 20 && selectedOrder && (
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-md md:max-w-3xl mx-auto">
          {/* 3: place words "All items" */}
          <div className="shrink-0 border-b border-gray-300 bg-gray-50/70 px-5 py-3">
            <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              All items
            </h1>
          </div>

          <main className="flex-1 overflow-y-auto divide-y divide-gray-300 bg-white">
            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              selectedOrder.items.map((item, idx) => {
                const itemArchivedFallback = item.listingId ? (archivedImages[item.listingId] || getCachedArchivedImage(item.listingId)) : null;
                const orderArchivedFallback = selectedOrder.listingId ? (archivedImages[selectedOrder.listingId] || getCachedArchivedImage(selectedOrder.listingId)) : null;
                const resolvedUrl =
                  item.imageUrl ||
                  itemArchivedFallback ||
                  selectedOrder.imageUrl ||
                  orderArchivedFallback ||
                  (selectedOrder.images && selectedOrder.images[0]);
                const itemImg = failedImages[resolvedUrl || ''] || !resolvedUrl
                  ? DEFAULT_PRODUCT_FALLBACK_IMAGE
                  : getOptimizedImageUrl(resolvedUrl, { width: 300, quality: 75, format: 'webp' });

                return (
                  <div
                    key={idx}
                    onClick={() => handleItemClick(item.listingId)}
                    className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[140px] hover:bg-blue-50/20 transition-colors cursor-pointer"
                  >
                    <div className="p-4 flex items-center justify-center bg-white">
                      <img
                        src={itemImg}
                        alt={item.itemBought}
                        onError={() => {
                          if (item.imageUrl) {
                            setFailedImages((prev) => ({ ...prev, [item.imageUrl!]: true }));
                          }
                        }}
                        className="max-h-28 w-auto object-contain pointer-events-none select-none"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-4 flex flex-col justify-center space-y-2 bg-white">
                      <h3 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-2">
                        {item.itemBought}
                      </h3>
                      <p className="text-xs font-black text-[#2D8EDE]">
                        R{item.itemPrice}
                      </p>
                      <p className="text-[11px] font-bold text-gray-500">
                        Qty: {item.quantity || 1} {item.size ? `• Size: ${item.size}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              (() => {
                const orderArchivedFallback = selectedOrder.listingId ? (archivedImages[selectedOrder.listingId] || getCachedArchivedImage(selectedOrder.listingId)) : null;
                const resolvedUrl = selectedOrder.imageUrl || orderArchivedFallback || (selectedOrder.images && selectedOrder.images[0]);
                const orderImg = failedImages[resolvedUrl || ''] || !resolvedUrl
                  ? DEFAULT_PRODUCT_FALLBACK_IMAGE
                  : getOptimizedImageUrl(resolvedUrl, { width: 300, quality: 75, format: 'webp' });

                return (
                  <div
                    onClick={() => handleItemClick(selectedOrder.listingId)}
                    className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[140px] hover:bg-blue-50/20 transition-colors cursor-pointer"
                  >
                    <div className="p-4 flex items-center justify-center bg-white">
                      <img
                        src={orderImg}
                        alt={selectedOrder.itemBought}
                        onError={() => {
                          if (selectedOrder.imageUrl) {
                            setFailedImages((prev) => ({ ...prev, [selectedOrder.imageUrl!]: true }));
                          }
                        }}
                        className="max-h-28 w-auto object-contain pointer-events-none select-none"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-4 flex flex-col justify-center space-y-2 bg-white">
                      <h3 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-2">
                        {selectedOrder.itemBought}
                      </h3>
                      <p className="text-xs font-black text-[#2D8EDE]">
                        R{selectedOrder.price}
                      </p>
                      <p className="text-[11px] font-bold text-gray-500">
                        Qty: {selectedOrder.quantity || 1}
                      </p>
                    </div>
                  </div>
                );
              })()
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 30: Track order                                                      */}
      {/* ========================================================================= */}
      {step === 30 && selectedOrder && (
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-md md:max-w-3xl mx-auto">
          {/* 3: place words "Track order" */}
          <div className="shrink-0 border-b border-gray-300 bg-gray-50/70 px-5 py-3">
            <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              Track order
            </h1>
          </div>

          <main className="flex-1 overflow-y-auto divide-y divide-gray-300 bg-white">
            {/* Tracking Header Details */}
            <div className="p-5 space-y-2 bg-white text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Order Number
                </span>
                <span className="text-xs font-black text-gray-900">
                  {selectedOrder.orderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Estimated Delivery
                </span>
                <span className="text-xs font-black text-[#2D8EDE]">
                  {selectedOrder.deliveryEstimation || '2 to 5 days'}
                </span>
              </div>
              {selectedOrder.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tracking Number
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {selectedOrder.trackingNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Vertical Stepper: 13, 14, 15 */}
            <div className="p-6 bg-white text-left">
              <div className="space-y-0 relative">
                {/* 13: Order paid */}
                <div className="flex items-start gap-4 relative">
                  <div className="w-7 h-7 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-xs sm:text-sm font-black text-gray-900">
                      Order paid
                    </p>
                  </div>
                </div>

                {/* Connecting Line 1 */}
                <div className="h-9 relative">
                  <div
                    className={`absolute left-[13px] top-0 bottom-0 w-[2px] ${
                      isShipped(selectedOrder) ? 'bg-[#2D8EDE]' : 'bg-gray-300'
                    }`}
                  />
                </div>

                {/* 14: Shipped */}
                <div className="flex items-start gap-4 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                      isShipped(selectedOrder)
                        ? 'bg-[#2D8EDE] text-white'
                        : 'bg-white border-2 border-gray-300 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="pt-0.5">
                    <p
                      className={`text-xs sm:text-sm font-black ${
                        isShipped(selectedOrder) ? 'text-[#2D8EDE]' : 'text-gray-700'
                      }`}
                    >
                      Shipped
                    </p>
                  </div>
                </div>

                {/* Connecting Line 2 */}
                <div className="h-9 relative">
                  <div
                    className={`absolute left-[13px] top-0 bottom-0 w-[2px] ${
                      isDelivered(selectedOrder) ? 'bg-[#2D8EDE]' : 'bg-gray-300'
                    }`}
                  />
                </div>

                {/* 15: Delivered */}
                <div className="flex items-start gap-4 relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs ${
                      isDelivered(selectedOrder)
                        ? 'bg-[#2D8EDE] text-white'
                        : 'bg-white border-2 border-gray-300 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="pt-0.5">
                    <p
                      className={`text-xs sm:text-sm font-black ${
                        isDelivered(selectedOrder) ? 'text-[#2D8EDE]' : 'text-gray-700'
                      }`}
                    >
                      Delivered
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 16: Latest update */}
            <div className="p-5 space-y-2 bg-white text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                  Latest update
                </span>
                <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatUpdateTime(selectedOrder.latestUpdateTime)}
                </span>
              </div>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 leading-relaxed">
                {selectedOrder.latestUpdate || 'Order confirmed and being prepared'}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 40: Order Cancellation Explanation Page                              */}
      {/* ========================================================================= */}
      {step === 40 && orderToRefund && (
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-md md:max-w-2xl mx-auto">
          {/* Subheader */}
          <div className="shrink-0 border-b border-gray-300 bg-gray-50/70 px-5 py-3 text-left">
            <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              Order Cancellation
            </h1>
          </div>

          <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6 text-left">
            {/* Order Summary Reference */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Order Number</span>
                <span className="text-xs font-black text-gray-900">{orderToRefund.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Item</span>
                <span className="text-xs font-bold text-gray-800 truncate max-w-[200px]">{orderToRefund.itemBought}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-700">Refund Amount</span>
                <span className="text-sm font-black text-[#2D8EDE]">R{orderToRefund.price}</span>
              </div>
            </div>

            {/* Explanation Message (fetched from Supabase order_cancellation_info table) */}
            <div className="space-y-3">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                What happens when you cancel an order:
              </h2>

              {isLoadingMessage ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-4/6" />
                </div>
              ) : (
                <div className="p-4 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-line">
                  {cancellationMessage}
                </div>
              )}
            </div>

            {/* Checkbox: "I understand" */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={isAgreeChecked}
                  onChange={(e) => setIsAgreeChecked(e.target.checked)}
                  className="w-4 h-4 text-[#2D8EDE] rounded focus:ring-[#2D8EDE] cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  I understand
                </span>
              </label>
            </div>

            {/* Continue button below checkbox */}
            <div className="pt-1">
              <button
                type="button"
                disabled={!isAgreeChecked || isSubmittingRefund}
                onClick={handleFinalizeCancellationAndRefund}
                className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingRefund ? 'Processing refund...' : 'Continue'}
              </button>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 1: "Are you sure?" modal with Cancel & Continue                     */}
      {/* ========================================================================= */}
      {isConfirmModalOpen && orderToRefund && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsConfirmModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-center border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900">
                Cancel &amp; Refund Order
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                Are you sure you want to cancel this order and request a refund?
              </p>
              <p className="text-[11px] font-bold text-gray-400 pt-1">
                Order #{orderToRefund.orderNumber} • R{orderToRefund.price}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleContinueFromConfirmModal}
                className="w-full py-3 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setOrderToRefund(null);
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 2: Ineligible Notice Modal ("Cannot Cancel Order")                  */}
      {/* ========================================================================= */}
      {ineligibleOrder && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIneligibleOrder(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-center border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-gray-900">
                Cannot Cancel Order
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed px-1">
                This order cannot be cancelled because it has already progressed past the processing stage. Orders can only be cancelled while status is "Order placed", "Order accepted", or "Being processed".
              </p>
              <div className="text-[11px] font-bold text-gray-500 bg-gray-50 p-2 rounded-lg">
                Current Status: <span className="text-gray-900">{ineligibleOrder.status || ineligibleOrder.deliveryStatus}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {/* Clickable "Learn more" leading to Privacy Policy page */}
              {onOpenPolicies && (
                <button
                  type="button"
                  onClick={() => {
                    setIneligibleOrder(null);
                    onOpenPolicies();
                  }}
                  className="w-full py-2.5 px-4 text-[#2D8EDE] hover:text-[#2579BE] font-black text-xs hover:underline cursor-pointer"
                >
                  Learn more
                </button>
              )}
              <button
                type="button"
                onClick={() => setIneligibleOrder(null)}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 3: 8-second Auto-Dismissing Success Notification Popup              */}
      {/* (Disappears after 8 seconds or when clicking anywhere else)               */}
      {/* ========================================================================= */}
      {refundSuccessPopupOpen && (
        <div
          className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setRefundSuccessPopupOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-center border border-gray-100 animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => {
              // Click inside also dismisses if user clicks anywhere, but allows reading
              e.stopPropagation();
              setRefundSuccessPopupOpen(false);
            }}
            role="alertdialog"
            aria-live="assertive"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-gray-900">
                Refund Requested
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-relaxed px-1">
                A refund will appear in your wallet in less than 24 hours. When you withdraw, money will be sent to the bank account that made the purchase.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setRefundSuccessPopupOpen(false)}
                className="w-full py-2.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unavailable Product Popup */}
      {unavailableMessage && (
        <div
          className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setUnavailableMessage('')}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1 pt-1">
              <h3 className="text-base font-black text-gray-900">Notice</h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">
                {unavailableMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setUnavailableMessage('')}
              className="w-full py-2.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
