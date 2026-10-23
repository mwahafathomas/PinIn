import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Download,
  Package,
  RotateCcw,
  FileText,
  Printer,
  Check,
} from 'lucide-react';
import { OrderRecord, OrderItem } from '../services/ordersService';
import {
  BusinessInfo,
  DEFAULT_BUSINESS_INFO,
  fetchBusinessInfo,
} from '../services/businessInfoService';
import {
  downloadInvoice,
  extractPaymentMethod,
  formatInvoiceAddress,
} from '../utils/invoiceDownloadUtils';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface InvoicesFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onOpenReturns?: (order?: OrderRecord) => void;
}

export const InvoicesFlowModal: React.FC<InvoicesFlowModalProps> = ({
  isOpen,
  onClose,
  orders = [],
  onOpenReturns,
}) => {
  // Step 1: Invoices list (matching Page 10 of Orders, but with "Invoices" & "Invoice" button)
  // Step 2: Invoice Detail view (matching uploaded layout drawing)
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(DEFAULT_BUSINESS_INFO);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchBusinessInfo().then(setBusinessInfo);
      setStep(1);
      setSelectedOrder(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle back navigation
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
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

  const handleDownload = (order: OrderRecord) => {
    downloadInvoice(order, businessInfo);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-60 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* ========================================================================= */}
      {/* TOP HEADER: 1 (Go back <) and 2 (App Name: PinIn)                         */}
      {/* ========================================================================= */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-300">
        <div className="w-full max-w-md md:max-w-3xl mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* 1: go back option ( < ) */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-900 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 2: app name */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* STEP 1: Invoices Overview (Identical to Orders Page 10, with "Invoice")   */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-md md:max-w-3xl mx-auto">
          {/* 3: place words "Invoices" */}
          <div className="shrink-0 border-b border-gray-300 bg-gray-50/70 px-5 py-3">
            <h1 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              Invoices
            </h1>
          </div>

          <main className="flex-1 overflow-y-auto divide-y divide-gray-300 bg-white">
            {orders && orders.length > 0 ? (
              orders.map((order) => {
                const images = getOrderImages(order);
                const displayStatus = order.status || order.deliveryStatus || 'Being processed';

                return (
                  <div
                    key={order.id || order.orderNumber}
                    onClick={() => {
                      setSelectedOrder(order);
                      setStep(2);
                    }}
                    className="grid grid-cols-2 divide-x divide-gray-300 w-full min-h-[170px] hover:bg-blue-50/20 transition-colors cursor-pointer active:scale-[0.99]"
                  >
                    {/* Left Column: Image 1, 2, 3, 4 */}
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

                    {/* Right Column: 8 (Status), 10 (Total price), 11 (Return), 12 ("Invoice" button) */}
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

                      {/* 12: INVOICE button (Replaces Track order as requested) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setStep(2);
                        }}
                        className="py-1.5 px-3 rounded-xl text-xs font-black bg-[#2D8EDE] hover:bg-[#2579BE] text-white border border-[#2D8EDE] text-center cursor-pointer active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center space-y-3 my-auto">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7 stroke-[2]" />
                </div>
                <h2 className="text-sm font-extrabold text-gray-900">
                  No invoices available
                </h2>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When you purchase items on PinIn, your tax invoices will appear here with instant download options.
                </p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Dedicated Invoice Details Page (Exact Layout from Drawing)        */}
      {/* ========================================================================= */}
      {step === 2 && selectedOrder && (
        <div className="flex-1 flex flex-col overflow-hidden w-full max-w-md md:max-w-2xl mx-auto bg-white">
          {/* Main Scrollable Invoice Canvas */}
          <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="border border-gray-300 rounded-2xl bg-white shadow-xs overflow-hidden">
              {/* =================================================================== */}
              {/* HEADER STRIP: 3 (App Icon on left) & 30 (Download icon on right)   */}
              {/* =================================================================== */}
              <div className="p-3.5 border-b border-gray-300 flex items-center justify-between bg-gray-50/50">
                {/* 3: Place the app icon (small icon from Supabase business_info) */}
                <div className="flex items-center gap-2">
                  <img
                    src={businessInfo.app_icon_url || '/PinIn-app-icon.png'}
                    alt="PinIn Icon"
                    className="w-9 h-9 object-contain rounded-lg border border-gray-200 bg-white p-0.5"
                    onError={(e) => {
                      // Fallback to text badge if custom image URL fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="font-extrabold text-base tracking-tight text-gray-900">
                    Pin<span className="text-[#2D8EDE]">In</span>
                  </span>
                </div>

                {/* 30: Place download icon (downloads invoice file) */}
                <button
                  type="button"
                  onClick={() => handleDownload(selectedOrder)}
                  aria-label="Download invoice file"
                  title="Download invoice file"
                  className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-blue-50 text-[#2D8EDE] hover:border-[#2D8EDE] transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-2xs"
                >
                  {isDownloaded ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span className="text-[11px] font-black text-emerald-600">Saved</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-[#2D8EDE] stroke-[2.5]" />
                      <span className="text-[11px] font-black text-[#2D8EDE]">Download</span>
                    </>
                  )}
                </button>
              </div>

              {/* =================================================================== */}
              {/* UPPER SECTION: Split into Left Column and Right Column              */}
              {/* =================================================================== */}
              <div className="grid grid-cols-2 divide-x divide-gray-300 border-b border-gray-300">
                {/* LEFT COLUMN: 4 to 12 */}
                <div className="p-3.5 space-y-2 text-xs">
                  {/* 4: Place "invoice number" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Invoice number:
                    </p>
                    <p className="font-black text-gray-900 text-xs sm:text-sm">
                      {selectedOrder.invoiceNumber || selectedOrder.orderNumber.replace('PIN-', 'INV-')}
                    </p>
                  </div>

                  {/* 5: Place "Order number" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Order number:
                    </p>
                    <p className="font-bold text-gray-800 text-xs">
                      {selectedOrder.orderNumber}
                    </p>
                  </div>

                  {/* 6: Place "invoice date" (date item was bought at) */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Invoice date:
                    </p>
                    <p className="font-bold text-gray-800 text-xs">
                      {selectedOrder.dateBought}
                    </p>
                  </div>

                  {/* AFTER 6: Place a line as explicitly instructed */}
                  <div className="border-t border-gray-300 my-2 pt-1" />

                  {/* 7: place "business name" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Business name:
                    </p>
                    <p className="font-bold text-gray-900 text-xs">
                      {businessInfo.business_name}
                    </p>
                  </div>

                  {/* 8: place "address" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Address:
                    </p>
                    <p className="text-gray-700 font-medium text-xs leading-tight">
                      {businessInfo.address}
                    </p>
                  </div>

                  {/* 9: place "telephone number" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Telephone number:
                    </p>
                    <p className="text-gray-800 font-bold text-xs">
                      {businessInfo.telephone_number}
                    </p>
                  </div>

                  {/* 10: place " VAT No" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      VAT No:
                    </p>
                    <p className="text-gray-800 font-bold text-xs">
                      {businessInfo.vat_no}
                    </p>
                  </div>

                  {/* 11: place " REG No" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      REG No:
                    </p>
                    <p className="text-gray-800 font-bold text-xs">
                      {businessInfo.reg_no}
                    </p>
                  </div>

                  {/* 12: Place " Website" */}
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Website:
                    </p>
                    <p className="text-[#2D8EDE] font-bold text-xs break-all">
                      {businessInfo.website}
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN: 13, 14, 16 */}
                <div className="p-3.5 space-y-3 text-xs bg-gray-50/20">
                  {/* 13: place words "Customer Information" */}
                  <div className="border-b border-gray-200 pb-1.5">
                    <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">
                      Customer Information
                    </h2>
                  </div>

                  {/* 14: place "Customer name ", write users name next to it */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Customer name:
                    </p>
                    <p className="font-extrabold text-gray-900 text-xs sm:text-sm">
                      {selectedOrder.buyerName || selectedOrder.username || 'Customer'}
                    </p>
                  </div>

                  {/* 16: place "Delivery address", write users address next to it (no 15) */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Delivery address:
                    </p>
                    <p className="text-gray-700 font-medium text-xs leading-relaxed">
                      {formatInvoiceAddress(selectedOrder)}
                    </p>
                  </div>
                </div>
              </div>

              {/* =================================================================== */}
              {/* LOWER SECTION: 17 to 26 (Items, Price, Delivery fee, Subtotal, etc) */}
              {/* =================================================================== */}
              <div className="p-3.5 space-y-3">
                {/* 17: Place words "Items" */}
                <div className="border-b border-gray-200 pb-1.5 flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wide">
                    Items
                  </h3>
                  <span className="text-[11px] text-gray-400 font-bold">
                    {selectedOrder.items?.length || 1} item(s)
                  </span>
                </div>

                {/* List of items: 18 (name), 19 (size), 20 (quantity), 21 (vat amount: -), 22 (price) */}
                <div className="divide-y divide-gray-200">
                  {(selectedOrder.items && selectedOrder.items.length > 0
                    ? selectedOrder.items
                    : [
                        {
                          itemBought: selectedOrder.itemBought,
                          itemPrice: selectedOrder.itemPrice || selectedOrder.price,
                          quantity: selectedOrder.quantity || 1,
                          size: 'Standard',
                        },
                      ]
                  ).map((item, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        {/* 18: Name of item */}
                        <p className="font-bold text-gray-900 text-xs leading-snug">
                          {item.itemBought}
                        </p>
                        {/* 22: Price of the item */}
                        <p className="font-black text-gray-900 text-xs shrink-0">
                          R{Number(item.itemPrice || 0) * Number(item.quantity || 1)}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        {/* 19: Size of item */}
                        <div>
                          <span className="text-gray-400 font-bold block text-[10px]">Size:</span>
                          <span className="font-extrabold text-gray-800">
                            {item.size || 'Standard'}
                          </span>
                        </div>

                        {/* 20: Quantity of items */}
                        <div>
                          <span className="text-gray-400 font-bold block text-[10px]">Qty:</span>
                          <span className="font-extrabold text-gray-800">
                            {item.quantity || 1}
                          </span>
                        </div>

                        {/* 21: VAT amount (place a dash - ) */}
                        <div>
                          <span className="text-gray-400 font-bold block text-[10px]">VAT:</span>
                          <span className="font-extrabold text-gray-500">-</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Box: 23 (Delivery fee), 24 (Subtotal), 25 (Total), 26 (Payment method) */}
                <div className="border-t border-gray-300 pt-3 space-y-2 bg-gray-50/60 -mx-3.5 -mb-3.5 p-3.5">
                  {/* 23: place delivery fee */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-bold">Delivery fee:</span>
                    <span className="font-extrabold text-gray-900">Free</span>
                  </div>

                  {/* 24: place subtotal (price of items only) */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-bold">Subtotal:</span>
                    <span className="font-extrabold text-gray-900">
                      R
                      {(selectedOrder.items && selectedOrder.items.length > 0)
                        ? selectedOrder.items.reduce(
                            (acc, it) => acc + Number(it.itemPrice || 0) * Number(it.quantity || 1),
                            0
                          )
                        : selectedOrder.price}
                    </span>
                  </div>

                  {/* 25: place total (total of everything) */}
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-200">
                    <span className="font-black text-gray-900">Total:</span>
                    <span className="font-black text-[#2D8EDE] text-base">
                      R{selectedOrder.price}
                    </span>
                  </div>

                  {/* 26: place payment method used */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                    <span className="text-gray-500 font-bold">Payment method used:</span>
                    <span className="font-black text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                      {extractPaymentMethod(selectedOrder.delivery)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BELOW THIS PAGE: Include "Thank you" words */}
            <div className="py-5 text-center space-y-1">
              <p className="text-sm font-black text-[#2D8EDE] tracking-wide">
                Thank you
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                Thank you for shopping with PinIn. Your official tax invoice is confirmed and saved.
              </p>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
