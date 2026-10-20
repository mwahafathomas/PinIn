import React, { useState } from 'react';
import { ChevronLeft, Check, Plus } from 'lucide-react';
import { CartItem, clearCart } from '../services/cartService';
import { createOrder, OrderRecord } from '../services/ordersService';
import { UserAccount, DeliveryAddress } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { DeliveryAddressPage } from './DeliveryAddressPage';

interface CheckoutPageProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  deliveryAddress: DeliveryAddress | null;
  onUpdateDeliveryAddress: (address: DeliveryAddress) => void;
  user?: UserAccount;
  onOrderSuccess: (order: OrderRecord) => void;
}

type PaymentMethod = 'Card' | 'EFT' | 'Capitec Pay' | 'Ozow';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  isOpen,
  onClose,
  items,
  deliveryAddress,
  onUpdateDeliveryAddress,
  user,
  onOrderSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Card');
  const [isAddressConfirmed, setIsAddressConfirmed] = useState<boolean>(true);
  const [isAddNewAddressOpen, setIsAddNewAddressOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  // Calculate total amount
  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const handlePay = async () => {
    if (!deliveryAddress) {
      setErrorMessage('Please add a delivery address to proceed.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const itemsTitle = items.map((i) => `${i.title} (x${i.quantity})`).join(', ');
      const mainSellerName = items[0]?.sellerName || 'PinIn Verified Seller';
      const mainSellerId = items[0]?.sellerId;
      const mainListingId = items[0]?.listingId;
      const buyerDisplayName =
        deliveryAddress.recipientName ||
        (user?.isLoggedIn ? (user.surname ? `${user.name} ${user.surname}` : user.name) : 'Customer');
      const buyerEmail = user?.email || 'customer@pinin.co.za';

      const deliverySummary = `Free Delivery to: ${deliveryAddress.streetAddressLine1}${
        deliveryAddress.streetAddressLine2 ? `, ${deliveryAddress.streetAddressLine2}` : ''
      }, ${deliveryAddress.cityTown}, ${deliveryAddress.province} (${deliveryAddress.postalCode}) [Method: ${selectedMethod}]`;

      const totalQuantity = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

      const res = await createOrder({
        username: buyerDisplayName,
        userEmail: buyerEmail,
        buyerName: buyerDisplayName,
        buyerEmail: buyerEmail,
        buyerId: user?.isLoggedIn ? user.id : undefined,
        sellerName: mainSellerName,
        sellerId: mainSellerId,
        listingId: mainListingId,
        itemBought: itemsTitle,
        itemPrice: items[0]?.price || 0,
        price: totalAmount,
        quantity: totalQuantity,
        delivery: deliverySummary,
        recipientName: deliveryAddress.recipientName || buyerDisplayName,
        recipientPhone: deliveryAddress.recipientPhone || '',
        streetAddressLine1: deliveryAddress.streetAddressLine1,
        streetAddressLine2: deliveryAddress.streetAddressLine2 || undefined,
        cityTown: deliveryAddress.cityTown,
        province: deliveryAddress.province,
        postalCode: deliveryAddress.postalCode,
        deliveryInstructions: deliveryAddress.deliveryInstructions || '',
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
        onOrderSuccess(res.order);
      } else {
        setErrorMessage(res.error || 'Payment failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while processing payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethodsList: PaymentMethod[] = ['Card', 'EFT', 'Capitec Pay', 'Ozow'];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1 & 2: Top Header Bar (1: Go back <, 2: App Name) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-300">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* 1: go back option ( < ) */}
          <button
            type="button"
            onClick={onClose}
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

          <div className="w-6" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-7xl mx-auto overflow-y-auto divide-y divide-gray-300">
        {/* 3, 4, 5: Picture of item (left) + Price & Quantity (right) */}
        <section aria-label="Items being bought" className="w-full">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-2 divide-x divide-gray-300 w-full bg-white min-h-[140px]"
            >
              {/* 3: picture of the item being bought */}
              <div className="p-4 flex items-center justify-center bg-white">
                <img
                  src={getOptimizedImageUrl(item.imageUrl, { width: 320, quality: 75, format: 'webp' })}
                  alt={item.title}
                  className="max-h-28 w-auto object-contain select-none pointer-events-none"
                  loading="lazy"
                />
              </div>

              {/* 4 & 5: price and quantity of that item */}
              <div className="p-4 flex flex-col justify-center space-y-3 bg-white">
                {/* 4: price of that item */}
                <div className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                  R{item.price}
                </div>

                {/* 5: quantity of that item */}
                <div className="text-sm font-bold text-gray-700">
                  Quantity: {item.quantity}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 6: Delivery address, confirm address option, add new address option */}
        <section aria-label="Delivery Address" className="p-4 bg-white space-y-3">
          <div className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Delivery Address
          </div>

          {deliveryAddress ? (
            <div className="p-3 border border-gray-200 rounded-lg text-xs space-y-1 bg-gray-50/60">
              <div className="font-bold text-gray-900">
                {deliveryAddress.recipientName}
                {deliveryAddress.recipientPhone ? ` • ${deliveryAddress.recipientPhone}` : ''}
              </div>
              <div className="text-gray-700">
                {deliveryAddress.streetAddressLine1}
                {deliveryAddress.streetAddressLine2 ? `, ${deliveryAddress.streetAddressLine2}` : ''}
              </div>
              <div className="text-gray-600">
                {deliveryAddress.cityTown}, {deliveryAddress.province} {deliveryAddress.postalCode}
              </div>
            </div>
          ) : (
            <div className="p-3 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500">
              No delivery address added.
            </div>
          )}

          {/* Confirm address option & Add new address option */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Confirm address option */}
            <button
              type="button"
              onClick={() => setIsAddressConfirmed(true)}
              className={`py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isAddressConfirmed
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                  : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'
              }`}
            >
              {isAddressConfirmed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{isAddressConfirmed ? 'Address Confirmed' : 'Confirm Address'}</span>
            </button>

            {/* Add new address option */}
            <button
              type="button"
              onClick={() => setIsAddNewAddressOpen(true)}
              className="py-2 px-3 rounded-lg text-xs font-bold border border-gray-300 hover:border-[#2D8EDE] text-[#2D8EDE] bg-white hover:bg-blue-50/40 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add New Address</span>
            </button>
          </div>
        </section>

        {/* 7: Payments methods (card, eft, capitec pay, ozzow) */}
        <section aria-label="Payment Methods" className="p-4 bg-white space-y-3">
          <div className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Payment Methods
          </div>

          <div className="space-y-2">
            {paymentMethodsList.map((method) => {
              const isSelected = selectedMethod === method;
              return (
                <div
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2D8EDE] bg-blue-50/40 text-gray-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                  }`}
                >
                  <span className="text-xs font-bold">{method}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-[#2D8EDE] bg-[#2D8EDE]'
                        : 'border-gray-400 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
              {errorMessage}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Pinned Bar: 8 (Amount on left) & 7 (Pay with [selected method] on right) */}
      <footer className="shrink-0 bg-white border-t border-gray-300 px-4 py-3 shadow-[0_-3px_10px_rgba(0,0,0,0.04)]">
        <div className="w-full max-w-md md:max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* 8: amount to be paid (just place amount only no words) */}
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              R{totalAmount}
            </span>
          </div>

          {/* 7: Pay with (the payment method selected) */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handlePay}
            className="flex-1 max-w-xs py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center text-center capitalize"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <span>Pay with {selectedMethod}</span>
            )}
          </button>
        </div>
      </footer>

      {/* Add New Address Modal */}
      <DeliveryAddressPage
        isOpen={isAddNewAddressOpen}
        onClose={() => setIsAddNewAddressOpen(false)}
        onSaveAddress={(newAddr) => {
          onUpdateDeliveryAddress(newAddr);
          setIsAddressConfirmed(true);
          setIsAddNewAddressOpen(false);
        }}
        title="Add New Address"
      />
    </div>
  );
};
