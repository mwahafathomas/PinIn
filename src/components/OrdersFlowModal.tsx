import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Check,
  Truck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { OrderRecord, OrderItem } from '../services/ordersService';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface OrdersFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onOpenReturns?: (order?: OrderRecord) => void;
  onOpenListing?: (listingId: string) => void;
}

export const OrdersFlowModal: React.FC<OrdersFlowModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  onOpenReturns,
  onOpenListing,
}) => {
  // Step state: 10 (Orders), 20 (All items), 30 (Track order)
  const [step, setStep] = useState<10 | 20 | 30>(10);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  if (!isOpen) return null;

  // Handle back navigation
  const handleBack = () => {
    if (step === 20 || step === 30) {
      setStep(10);
    } else {
      onClose();
    }
  };

  // Helper to get up to 4 images for an order
  const getOrderImages = (order: OrderRecord): string[] => {
    if (order.images && order.images.length > 0) {
      return order.images.slice(0, 4);
    }
    if (order.items && order.items.length > 0) {
      const extracted = order.items
        .map((i) => i.imageUrl)
        .filter((img): img is string => typeof img === 'string' && img.length > 0);
      if (extracted.length > 0) {
        return extracted.slice(0, 4);
      }
    }
    if (order.imageUrl) {
      return [order.imageUrl];
    }
    return [];
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
            {orders && orders.length > 0 ? (
              orders.map((order) => {
                const images = getOrderImages(order);
                const displayStatus =
                  order.status || order.deliveryStatus || 'Being processed';

                return (
                  <div
                    key={order.id || order.orderNumber}
                    onClick={() => {
                      setSelectedOrder(order);
                      setStep(20);
                    }}
                    className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[170px] hover:bg-blue-50/20 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    {/* Left Column: 4, 5, 6, 7 (Image 1, 2, 3, 4 grid or single image) */}
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

                    {/* Right Column: 8 (Status), 10 (Total price), 11 (Return), 12 (Track order) */}
                    {/* (No 9 - removed space) */}
                    {/* All elements 8-12 inside boxes like "All" at homepage */}
                    <div className="p-3.5 flex flex-col justify-between space-y-2 bg-white">
                      {/* 8: Status of order */}
                      <div className="py-1.5 px-3 rounded-xl text-xs font-black bg-gray-100 text-gray-900 border border-gray-200 text-center truncate">
                        {displayStatus}
                      </div>

                      {/* 10: Total price */}
                      <div className="py-1.5 px-3 rounded-xl text-xs font-black bg-gray-100 text-[#2D8EDE] border border-gray-200 text-center">
                        R{order.price}
                      </div>

                      {/* 11: Return button */}
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

                      {/* 12: Track order button */}
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
            {(selectedOrder.items && selectedOrder.items.length > 0
              ? selectedOrder.items
              : [
                  {
                    listingId: selectedOrder.listingId,
                    itemBought: selectedOrder.itemBought,
                    itemPrice: selectedOrder.itemPrice || selectedOrder.price,
                    quantity: selectedOrder.quantity || 1,
                    imageUrl: selectedOrder.imageUrl,
                    size: 'Standard',
                  },
                ]
            ).map((item: OrderItem, idx: number) => {
              const itemSize = item.size || 'Standard';

              return (
                <div
                  key={idx}
                  className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[140px] bg-white"
                >
                  {/* 4: Place item image (when clicked, leads back to listing) */}
                  <div
                    onClick={() => {
                      if (item.listingId && onOpenListing) {
                        onOpenListing(item.listingId);
                      }
                    }}
                    className="p-4 flex items-center justify-center bg-white cursor-pointer group hover:bg-blue-50/20 transition-colors"
                  >
                    {item.imageUrl ? (
                      <div className="relative">
                        <img
                          src={getOptimizedImageUrl(item.imageUrl, { width: 300, quality: 75, format: 'webp' })}
                          alt={item.itemBought}
                          className="max-h-28 w-auto object-contain pointer-events-none select-none group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-xs border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5 text-[#2D8EDE]" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                  {/* Right Column: 5 (Name & size), 6 (Quantity), 7 (Price) */}
                  <div className="p-4 flex flex-col justify-center space-y-2 bg-white text-left">
                    {/* 5: place item name & size */}
                    <div>
                      <h2 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-2 leading-snug">
                        {item.itemBought}
                      </h2>
                      <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                        Size: <span className="text-gray-900">{itemSize}</span>
                      </p>
                    </div>

                    {/* 6: place item quantity */}
                    <div className="text-xs font-bold text-gray-700">
                      Quantity: <span className="font-extrabold text-gray-900">{item.quantity}</span>
                    </div>

                    {/* 7: place item price */}
                    <div className="text-sm sm:text-base font-black text-[#2D8EDE]">
                      R{item.itemPrice}
                    </div>
                  </div>
                </div>
              );
            })}
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
            {/* Top Container: 4-7 (Images) on left + 8 (Order details >), 9 (Package info), 10 (Address) on right */}
            <div className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[170px] bg-white">
              {/* Left Column: 4 - 7: images of items bought */}
              <div className="p-3 bg-white flex items-center justify-center">
                {getOrderImages(selectedOrder).length <= 1 ? (
                  <div className="w-full h-full min-h-[140px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden p-2">
                    {getOrderImages(selectedOrder)[0] ? (
                      <img
                        src={getOptimizedImageUrl(getOrderImages(selectedOrder)[0], {
                          width: 300,
                          quality: 75,
                          format: 'webp',
                        })}
                        alt={selectedOrder.itemBought}
                        className="max-h-32 w-auto object-contain pointer-events-none select-none"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-gray-400 stroke-[1.5]" />
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 w-full h-full max-h-[150px]">
                    {getOrderImages(selectedOrder)
                      .slice(0, 4)
                      .map((imgUrl, idx) => (
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

              {/* Right Column: 8, 9, 10 */}
              <div className="p-3.5 flex flex-col justify-between space-y-2 bg-white text-left">
                {/* 8: place words "Order details >" (when clicked, lead back to page 10) */}
                <button
                  type="button"
                  onClick={() => setStep(10)}
                  className="inline-flex items-center gap-1 text-xs font-black text-[#2D8EDE] hover:underline cursor-pointer text-left self-start"
                >
                  <span>Order details</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* 9: place "Package info :" */}
                <div className="text-[11px] font-bold text-gray-800 leading-snug">
                  <span className="text-gray-500">Package info : </span>
                  <span className="font-extrabold text-gray-900">
                    {selectedOrder.packageInfo || 'Standard parcel'}
                  </span>
                </div>

                {/* 10: place address user provided */}
                <div className="text-[11px] font-medium text-gray-700 leading-tight space-y-0.5 border-t border-gray-100 pt-1.5">
                  <p className="font-extrabold text-gray-900 truncate">
                    {selectedOrder.recipientName || selectedOrder.buyerName}
                  </p>
                  <p className="line-clamp-2 text-gray-600">
                    {selectedOrder.streetAddressLine1}
                    {selectedOrder.streetAddressLine2 ? `, ${selectedOrder.streetAddressLine2}` : ''}
                    {selectedOrder.cityTown ? `, ${selectedOrder.cityTown}` : ''}
                    {selectedOrder.province ? `, ${selectedOrder.province}` : ''}
                    {selectedOrder.postalCode ? ` (${selectedOrder.postalCode})` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Below Section: 11 (Courier :), 12 (tracking number :) */}
            <div className="p-5 space-y-2 text-left bg-white">
              {/* 11: place "Courier :" */}
              <div className="text-xs sm:text-sm font-extrabold text-gray-900">
                <span className="text-gray-500 font-bold">Courier : </span>
                <span>{selectedOrder.courier || 'PinIn Express'}</span>
              </div>

              {/* 12: write "tracking number :" */}
              <div className="text-xs sm:text-sm font-extrabold text-gray-900">
                <span className="text-gray-500 font-bold">tracking number : </span>
                <span className="font-mono text-[#2D8EDE]">
                  {selectedOrder.trackingNumber || selectedOrder.orderNumber.replace('PIN-', 'PIN-TRK-')}
                </span>
              </div>
            </div>

            {/* Progress Stepper Timeline: 13 (order paid), 14 (Shipped), 15 (delivered) */}
            <div className="p-6 bg-gray-50/50">
              <div className="max-w-xs mx-auto space-y-0">
                {/* 13: Order paid (always blue with a tick) */}
                <div className="flex items-start gap-4 relative">
                  {/* Vertical connecting line */}
                  <div className="absolute left-[13px] top-[26px] bottom-[-26px] w-[2px] bg-[#2D8EDE]" />

                  {/* Circle 13 */}
                  <div className="w-7 h-7 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center shrink-0 z-10 shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-xs sm:text-sm font-black text-[#2D8EDE]">
                      Order paid
                    </p>
                  </div>
                </div>

                {/* Vertical spacer */}
                <div className="h-9 relative">
                  <div
                    className={`absolute left-[13px] top-0 bottom-0 w-[2px] ${
                      isShipped(selectedOrder) ? 'bg-[#2D8EDE]' : 'bg-gray-300'
                    }`}
                  />
                </div>

                {/* 14: Shipped */}
                <div className="flex items-start gap-4 relative">
                  {/* Vertical connecting line */}
                  <div
                    className={`absolute left-[13px] top-[26px] bottom-[-26px] w-[2px] ${
                      isDelivered(selectedOrder) ? 'bg-[#2D8EDE]' : 'bg-gray-300'
                    }`}
                  />

                  {/* Circle 14 */}
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

                {/* Vertical spacer */}
                <div className="h-9 relative">
                  <div
                    className={`absolute left-[13px] top-0 bottom-0 w-[2px] ${
                      isDelivered(selectedOrder) ? 'bg-[#2D8EDE]' : 'bg-gray-300'
                    }`}
                  />
                </div>

                {/* 15: Delivered */}
                <div className="flex items-start gap-4 relative">
                  {/* Circle 15 */}
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
    </div>
  );
};
