import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ShieldCheck,
  AlertCircle,
  FileText,
  RotateCcw,
  X,
} from 'lucide-react';
import { OrderRecord } from '../services/ordersService';
import { submitReturnRequest } from '../services/returnsAndRefundsService';
import { supabase } from '../supabaseClient';
import { UserAccount } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface ReturnsFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserAccount;
  orders: OrderRecord[];
  onOpenPolicies?: () => void;
}

const RETURN_REASONS = [
  'Wrong size',
  'Item looks different from pictures',
  'Wrong item received',
  'Damaged',
  'Other',
];

export const ReturnsFlowModal: React.FC<ReturnsFlowModalProps> = ({
  isOpen,
  onClose,
  user,
  orders = [],
  onOpenPolicies,
}) => {
  // Step state: 10 (Steps), 20 (Select return), 30 (Reason for return)
  const [step, setStep] = useState<10 | 20 | 30>(10);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReasonText, setOtherReasonText] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [showPolicyOverlay, setShowPolicyOverlay] = useState<boolean>(false);
  const [showExchangeNoticePopup, setShowExchangeNoticePopup] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const getOrderDisplayImage = (order?: OrderRecord | null): string => {
    if (!order) return '';
    if (order.imageUrl && !failedImages[order.imageUrl]) {
      return order.imageUrl;
    }
    if (order.images && order.images.length > 0) {
      const found = order.images.find((img) => img && !failedImages[img]);
      if (found) return found;
    }
    if (order.items && order.items.length > 0) {
      const found = order.items.find((i) => i.imageUrl && !failedImages[i.imageUrl])?.imageUrl;
      if (found) return found;
    }
    return order.imageUrl || '';
  };

  // Reset states when closing
  const handleClose = () => {
    setStep(10);
    setSelectedOrder(null);
    setSelectedReason('');
    setOtherReasonText('');
    setAdditionalDetails('');
    setSubmitError('');
    setSubmittedSuccess(false);
    setShowPolicyOverlay(false);
    setShowExchangeNoticePopup(false);
    onClose();
  };

  // Back handler for each step
  const handleBack = () => {
    if (submittedSuccess) {
      handleClose();
      return;
    }
    if (step === 30) {
      setStep(20);
    } else if (step === 20) {
      setStep(10);
    } else {
      handleClose();
    }
  };

  // Check if an order item is within 7 days of delivery / purchase
  const checkIsReturnable = (order: OrderRecord) => {
    try {
      const rawDate = order.created_at || order.dateBought;
      if (!rawDate) return true;
      const orderTime = new Date(rawDate).getTime();
      if (isNaN(orderTime)) return true;
      const now = Date.now();
      const diffDays = (now - orderTime) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    } catch {
      return true;
    }
  };

  // Format order date for display
  const formatOrderDate = (order: OrderRecord) => {
    try {
      const rawDate = order.created_at || order.dateBought;
      if (!rawDate) return 'Recently ordered';
      const parsed = new Date(rawDate);
      if (isNaN(parsed.getTime())) {
        return order.dateBought || 'Recently ordered';
      }
      return parsed.toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return order.dateBought || 'Recently ordered';
    }
  };

  // Submit return to Supabase `returns_requests`
  const handleSubmitReturn = async () => {
    if (!selectedOrder) {
      setSubmitError('Please select an item to return.');
      return;
    }
    if (!selectedReason) {
      setSubmitError('Please select a reason for return.');
      return;
    }
    if (selectedReason === 'Other' && !otherReasonText.trim()) {
      setSubmitError('Please write your reason for returning this item.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const buyerName =
        user?.name ? (user.surname ? `${user.name} ${user.surname}` : user.name) : selectedOrder.username || 'Customer';
      const buyerEmail = user?.email || selectedOrder.userEmail || 'customer@pinin.co.za';

      const finalDescription =
        selectedReason === 'Other'
          ? otherReasonText.trim()
          : additionalDetails.trim() || undefined;

      const order = selectedOrder;
      const res = await submitReturnRequest({
        orderNumber: order.orderNumber,
        orderId: order.id,
        userEmail: buyerEmail,
        userName: buyerName,
        listingId: order.listingId,
        itemBought: order.itemBought,
        reason: selectedReason,
        description: finalDescription,
      });

      // Send return email via Supabase Edge Function
      try {
        console.log('Sending return email for order', order.id);
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-order-email', {
          body: { order_id: order.id, type: 'return' }
        });
        console.log('Return email result', emailData, emailError);
      } catch (e) {
        console.error('Email failed', e);
      }

      if (res.success) {
        setSubmittedSuccess(true);
      } else {
        setSubmitError(res.error || 'Failed to submit return. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while submitting your return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1 & 2: Top Header Bar (1: Go back <, 2: App Name) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-300">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* 1: go back option ( < ) */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-[#2D8EDE] hover:bg-blue-50/50 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 2: app name */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-6" />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* PAGE 10: Steps Overview                                                   */}
      {/* ========================================================================= */}
      {step === 10 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden w-full max-w-md md:max-w-3xl mx-auto">
          {/* Main scrollable body */}
          <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {/* 3: place the words "Steps" */}
            <div className="space-y-4">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Steps
              </h1>

              {/* Steps List */}
              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900">
                      Step 1
                    </h2>
                    <p className="text-xs text-gray-700 mt-0.5 font-medium leading-relaxed">
                      Log a return &amp; await eligibility confirmation within 24 hours
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900">
                      Step 2
                    </h2>
                    <p className="text-xs text-gray-700 mt-0.5 font-medium leading-relaxed">
                      Select a delivery method
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900">
                      Step 3
                    </h2>
                    <p className="text-xs text-gray-700 mt-0.5 font-medium leading-relaxed">
                      Prepare your parcel
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-900">
                      Step 4
                    </h2>
                    <p className="text-xs text-gray-700 mt-0.5 font-medium leading-relaxed">
                      The Pinin team will assess the returned items
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Bottom Pinned Area: 4 ("Log return") and 5 ("learn more about our return policy") */}
          <footer className="shrink-0 bg-white border-t border-gray-200 px-5 py-4 space-y-3">
            {/* 4: place "Log return" */}
            <button
              type="button"
              onClick={() => setShowExchangeNoticePopup(true)}
              className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center capitalize"
            >
              Log return
            </button>

            {/* 5: place words like "learn more about our return policy", make "Return policy" clickable */}
            <p className="text-center text-xs text-gray-600 font-medium">
              learn more about our{' '}
              <button
                type="button"
                onClick={() => {
                  if (onOpenPolicies) {
                    onOpenPolicies();
                  } else {
                    setShowPolicyOverlay(true);
                  }
                }}
                className="text-[#2D8EDE] font-extrabold underline hover:text-[#2579BE] cursor-pointer"
              >
                Return policy
              </button>
            </p>
          </footer>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 20: Select Return                                                    */}
      {/* ========================================================================= */}
      {step === 20 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden w-full max-w-md md:max-w-3xl mx-auto">
          {/* 3: place words "Select return" in title strip */}
          <div className="shrink-0 border-b border-gray-300 bg-gray-50/70 px-5 py-3">
            <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              Select return
            </h1>
          </div>

          {/* List of items that were bought in the app (only delivered items eligible for return) */}
          <main className="flex-1 overflow-y-auto divide-y divide-gray-300 bg-white">
            {(() => {
              const deliveredOrders = (orders || []).filter((order) => {
                const statusStr = (order.status || order.deliveryStatus || '').trim().toLowerCase();
                return statusStr === 'delivered';
              });

              if (deliveredOrders.length === 0) {
                return (
                  <div className="p-8 text-center space-y-3 my-auto">
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
                      <Package className="w-7 h-7 stroke-[2]" />
                    </div>
                    <h2 className="text-sm font-extrabold text-gray-900">
                      No delivered orders found to return
                    </h2>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                      Items can only be returned once they have been delivered.
                    </p>
                  </div>
                );
              }

              return deliveredOrders.map((order) => {
                const isReturnable = checkIsReturnable(order);
                const orderDateStr = formatOrderDate(order);

                return (
                  <div
                    key={order.id || order.orderNumber}
                    onClick={() => {
                      if (isReturnable) {
                        setSelectedOrder(order);
                        setSubmitError('');
                        setStep(30);
                      }
                    }}
                    className={`grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[140px] transition-colors ${
                      isReturnable
                        ? 'hover:bg-blue-50/30 cursor-pointer active:scale-[0.99]'
                        : 'opacity-70 cursor-not-allowed bg-gray-50/40'
                    }`}
                  >
                    {/* 4: place item picture (left box) */}
                    <div className="p-4 flex items-center justify-center bg-white">
                      {getOrderDisplayImage(order) ? (
                        <img
                          src={getOptimizedImageUrl(getOrderDisplayImage(order), { width: 300, quality: 75, format: 'webp' })}
                          alt={order.itemBought}
                          onError={() => {
                            const img = getOrderDisplayImage(order);
                            if (img) setFailedImages((prev) => ({ ...prev, [img]: true }));
                          }}
                          className="max-h-28 w-auto object-contain pointer-events-none select-none"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8 stroke-[1.5]" />
                        </div>
                      )}
                    </div>

                    {/* Right column: 5 (date ordered) & 6 ("Returnable" / "Non Returnable") */}
                    <div className="p-4 flex flex-col justify-center space-y-3 bg-white">
                      {/* 5: place the date the item was ordered */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Ordered
                        </span>
                        <div className="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug">
                          {orderDateStr}
                        </div>
                      </div>

                      {/* 6: place the words "Returnable" or "Non Returnable" */}
                      <div>
                        {isReturnable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Returnable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gray-200 text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            Non Returnable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 30: Reason for return                                                */}
      {/* ========================================================================= */}
      {step === 30 && selectedOrder && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden w-full max-w-md md:max-w-3xl mx-auto">
          {/* Main scrollable body */}
          <main className="flex-1 overflow-y-auto divide-y divide-gray-300 bg-white">
            {/* 3: place the words "Reason for return" in title strip */}
            <div className="shrink-0 bg-gray-50/70 px-5 py-3">
              <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                Reason for return
              </h1>
            </div>

            {/* 4 & 5: Item picture (left) + Item details (right) */}
            <div className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[140px] bg-white">
              {/* 4: Place picture of item */}
              <div className="p-4 flex items-center justify-center bg-white">
                {getOrderDisplayImage(selectedOrder) ? (
                  <img
                    src={getOptimizedImageUrl(getOrderDisplayImage(selectedOrder), { width: 300, quality: 75, format: 'webp' })}
                    alt={selectedOrder.itemBought}
                    onError={() => {
                      const img = getOrderDisplayImage(selectedOrder);
                      if (img) setFailedImages((prev) => ({ ...prev, [img]: true }));
                    }}
                    className="max-h-28 w-auto object-contain pointer-events-none select-none"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8 stroke-[1.5]" />
                  </div>
                )}
              </div>

              {/* 5: place item details */}
              <div className="p-4 flex flex-col justify-center space-y-1.5 bg-white text-left">
                <h2 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-2 leading-snug">
                  {selectedOrder.itemBought}
                </h2>
                <div className="text-sm sm:text-base font-black text-[#2D8EDE]">
                  R{selectedOrder.itemPrice || selectedOrder.price}
                </div>
                <div className="text-[11px] font-bold text-gray-500">
                  Order #{selectedOrder.orderNumber}
                </div>
              </div>
            </div>

            {/* 6: place "select reason" when clicked show reasons in a dropdown */}
            <div className="p-5 space-y-4 text-left bg-white">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider">
                  Select reason *
                </label>
                <div className="relative">
                  <select
                    value={selectedReason}
                    onChange={(e) => {
                      setSelectedReason(e.target.value);
                      if (submitError) setSubmitError('');
                    }}
                    className="w-full appearance-none text-xs sm:text-sm font-bold text-gray-900 px-4 py-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-[#2D8EDE] cursor-pointer shadow-xs"
                  >
                    <option value="" disabled>
                      Select reason
                    </option>
                    {RETURN_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Space for user to write reason when Other is selected */}
              {selectedReason === 'Other' && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-wider">
                    Write reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={otherReasonText}
                    onChange={(e) => {
                      setOtherReasonText(e.target.value);
                      if (submitError) setSubmitError('');
                    }}
                    placeholder="Please specify why you want to return this item..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white resize-none"
                  />
                </div>
              )}

              {/* Additional details (shown when not Other) */}
              {selectedReason !== 'Other' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-gray-700">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Provide any details to help our team process your return..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white resize-none"
                  />
                </div>
              )}

              {submitError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          </main>

          {/* 7: place "Continue" button at the bottom */}
          <footer className="shrink-0 bg-white border-t border-gray-300 px-5 py-4">
            <button
              type="button"
              disabled={isSubmitting || !selectedReason || (selectedReason === 'Other' && !otherReasonText.trim())}
              onClick={handleSubmitReturn}
              className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center capitalize"
            >
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </button>
          </footer>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {submittedSuccess && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-gray-200 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-black text-gray-900">
                Return Request Submitted
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your return request has been submitted to the Pinin team. We will assess eligibility within 24 hours.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Return Policy Overlay */}
      {showPolicyOverlay && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h2 className="text-base font-black text-gray-900">
                Pinin Return Policy
              </h2>
              <button
                type="button"
                onClick={() => setShowPolicyOverlay(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs text-gray-700 leading-relaxed pr-1">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-900 font-bold">
                7-Day Money-Back Guarantee on all eligible apparel &amp; orders.
              </div>
              <p>
                <strong>1. Eligibility:</strong> Items must be logged within 7 days of delivery. Clothing items must be unwashed, unworn, and have original tags intact.
              </p>
              <p>
                <strong>2. Assessment:</strong> Once logged, our team verifies eligibility within 24 hours and coordinates pickup or drop-off.
              </p>
              <p>
                <strong>3. Refunds:</strong> Approved returns will be refunded via your original payment method (Card, EFT, Capitec Pay, Ozow) within 3-5 business days.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPolicyOverlay(false)}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Exchange Only Notice Popup Modal */}
      {showExchangeNoticePopup && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowExchangeNoticePopup(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-gray-900">Returns & Exchanges</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Returns are only for exchanges. After you return the item, a new one will be sent to you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExchangeNoticePopup(false)}
                className="py-2.5 px-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExchangeNoticePopup(false);
                  setStep(20);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#2D8EDE] hover:bg-[#2579BE] text-white text-xs font-extrabold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
