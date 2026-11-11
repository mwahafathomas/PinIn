import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Plus } from 'lucide-react';
import { CartItem, clearCart, removeFromCart } from '../services/cartService';
import { createOrder, OrderRecord } from '../services/ordersService';
import { recordListingAsBought } from '../services/listingStockService';
import { UserAccount, DeliveryAddress } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import {
  DeliveryAddressPage,
  getAllSavedAddresses,
  deleteAddressFromStorage,
  saveAllAddressesToStorage,
} from './DeliveryAddressPage';

interface CheckoutPageProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  deliveryAddress: DeliveryAddress | null;
  deliveryMethodName?: string;
  deliveryFee?: number;
  onUpdateDeliveryAddress: (address: DeliveryAddress) => void;
  user?: UserAccount;
  onOrderSuccess: (order: OrderRecord) => void;
}

type PaymentMethod = 'Card' | 'EFT' | 'Capitec Pay' | 'Ozow';

const SwipeableAddressCard: React.FC<{
  address: DeliveryAddress;
  isSelected: boolean;
  isConfirmed: boolean;
  onSelect: () => void;
  onConfirm: () => void;
  onDelete: () => void;
}> = ({ address, isSelected, isConfirmed, onSelect, onConfirm, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -35 || info.velocity.x < -250) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl group select-none">
      {/* Background Revealed Action: Red Delete option on the right, hidden until swiped */}
      <div className={`absolute inset-y-0 right-0 w-20 bg-red-600 rounded-xl flex items-center justify-center z-0 transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-full h-full flex items-center justify-center text-white active:scale-95 transition-transform p-2 cursor-pointer font-black text-xs uppercase tracking-wider"
          aria-label="Delete address"
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
          } else {
            onSelect();
          }
        }}
        className={`relative z-10 p-3.5 rounded-xl border flex flex-col gap-2 cursor-pointer transition-colors ${
          isSelected
            ? 'border-[#2D8EDE] bg-[#f2f7fd] ring-1 ring-[#2D8EDE]/40'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {/* Radio Selection Circle on left */}
          <div className="shrink-0 mt-0.5">
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-[#2D8EDE] bg-[#2D8EDE]'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </div>

          {/* Address Details */}
          <div className="flex-1 min-w-0 text-xs space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-gray-900 truncate">
                {address.recipientName}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                {address.province}
              </span>
            </div>
            {address.recipientPhone && (
              <p className="text-[11px] font-medium text-gray-600">
                {address.recipientPhone}
              </p>
            )}
            <p className="text-[11px] text-gray-700 leading-tight">
              {address.streetAddressLine1}
              {address.streetAddressLine2 ? `, ${address.streetAddressLine2}` : ''}
            </p>
            <p className="text-[11px] text-gray-500">
              {address.cityTown}, {address.province} {address.postalCode}
            </p>
          </div>
        </div>

        {/* Confirmation status / action for this address */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              isConfirmed
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-white border-[#2D8EDE] text-[#2D8EDE] hover:bg-blue-50/50 shadow-xs'
            }`}
          >
            {isConfirmed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            <span>{isConfirmed ? 'Address confirmed' : 'Confirm address'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  isOpen,
  onClose,
  items,
  deliveryAddress,
  deliveryMethodName = 'Door to door',
  deliveryFee = 0,
  onUpdateDeliveryAddress,
  user,
  onOrderSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Card');

  // Address list (maximum 3 addresses)
  const [addressList, setAddressList] = useState<DeliveryAddress[]>(() => {
    const saved = getAllSavedAddresses().slice(0, 3);
    if (saved.length > 0) return saved;
    return deliveryAddress ? [deliveryAddress] : [];
  });
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(() => {
    const saved = getAllSavedAddresses().slice(0, 3);
    return saved.length > 0 || deliveryAddress ? 0 : -1;
  });
  const [isAddressConfirmed, setIsAddressConfirmed] = useState<boolean>(false);
  const [isAddNewAddressOpen, setIsAddNewAddressOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const activeAddress =
    selectedAddressIndex >= 0 && selectedAddressIndex < addressList.length
      ? addressList[selectedAddressIndex]
      : deliveryAddress;

  // Calculate total amount including delivery fee
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );
  const totalAmount = itemsSubtotal + (deliveryFee || 0);

  const handlePay = async () => {
    if (!activeAddress) {
      setErrorMessage('Please add a delivery address to proceed.');
      return;
    }

    if (!isAddressConfirmed) {
      setErrorMessage('Please confirm your delivery address before proceeding to pay.');
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
        activeAddress.recipientName ||
        (user?.isLoggedIn ? (user.surname ? `${user.name} ${user.surname}` : user.name) : 'Customer');
      const buyerEmail = user?.email || 'customer@pinin.co.za';

      const deliverySummary = `Delivery to: ${activeAddress.streetAddressLine1}${
        activeAddress.streetAddressLine2 ? `, ${activeAddress.streetAddressLine2}` : ''
      }, ${activeAddress.cityTown}, ${activeAddress.province} (${activeAddress.postalCode}) [Method: ${selectedMethod}]`;

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
        deliveryFee: deliveryFee,
        delivery: deliverySummary,
        recipientName: activeAddress.recipientName || buyerDisplayName,
        recipientPhone: activeAddress.recipientPhone || '',
        streetAddressLine1: activeAddress.streetAddressLine1,
        streetAddressLine2: activeAddress.streetAddressLine2 || undefined,
        cityTown: activeAddress.cityTown,
        province: activeAddress.province,
        postalCode: activeAddress.postalCode,
        deliveryInstructions: activeAddress.deliveryInstructions || '',
        imageUrl: items[0]?.imageUrl,
        items: items.map((i) => ({
          listingId: i.listingId,
          itemBought: i.title,
          itemPrice: i.price,
          sellerName: i.sellerName || mainSellerName,
          sellerId: i.sellerId || mainSellerId,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
          size: i.size,
        })),
      });

      if (res.success && res.order) {
        items.forEach((i) => {
          const targetId = i.listingId || i.id;
          if (targetId) {
            removeFromCart(targetId);
            recordListingAsBought(targetId);
          }
        });
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

        {/* 6: Delivery address (all addresses up to 3, slide to delete, confirm one) */}
        <section aria-label="Delivery Address" className="p-4 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Delivery Address
            </span>
          </div>

          {addressList.length === 0 ? (
            <div className="p-4 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500 bg-gray-50/50">
              No delivery address added. Please add an address below.
            </div>
          ) : (
            <div className="space-y-2.5">
              {addressList.map((addr, idx) => {
                const isSelected = selectedAddressIndex === idx;
                return (
                  <SwipeableAddressCard
                    key={`${addr.streetAddressLine1}-${addr.postalCode}-${idx}`}
                    address={addr}
                    isSelected={isSelected}
                    isConfirmed={isSelected && isAddressConfirmed}
                    onSelect={() => {
                      if (selectedAddressIndex !== idx) {
                        setSelectedAddressIndex(idx);
                        setIsAddressConfirmed(false); // Let user confirm the one they want!
                        onUpdateDeliveryAddress(addr);
                        setErrorMessage('');
                      }
                    }}
                    onConfirm={() => {
                      if (!isSelected) {
                        setSelectedAddressIndex(idx);
                        onUpdateDeliveryAddress(addr);
                      }
                      setIsAddressConfirmed((prev) => !prev);
                      setErrorMessage('');
                    }}
                    onDelete={() => {
                      const updated = deleteAddressFromStorage(addr).slice(0, 3);
                      setAddressList(updated);
                      if (selectedAddressIndex === idx) {
                        setIsAddressConfirmed(false);
                        const nextIdx = updated.length > 0 ? 0 : -1;
                        setSelectedAddressIndex(nextIdx);
                        if (nextIdx >= 0) {
                          onUpdateDeliveryAddress(updated[nextIdx]);
                        }
                      } else if (selectedAddressIndex > idx) {
                        setSelectedAddressIndex(selectedAddressIndex - 1);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Add New Address Option (Max 3) */}
          <div className="pt-1">
            <button
              type="button"
              disabled={addressList.length >= 3}
              onClick={() => {
                if (addressList.length >= 3) {
                  setErrorMessage('Maximum of 3 addresses added.');
                  return;
                }
                setIsAddNewAddressOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold border border-gray-300 hover:border-[#2D8EDE] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed text-[#2D8EDE] bg-white hover:bg-blue-50/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {addressList.length >= 3
                  ? 'Maximum 3 addresses added'
                  : 'Add New Address'}
              </span>
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
            disabled={isSubmitting || !isAddressConfirmed || !activeAddress}
            onClick={handlePay}
            className="flex-1 max-w-xs py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center text-center capitalize"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : !isAddressConfirmed ? (
              <span>Confirm address first</span>
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
          const updated = [
            newAddr,
            ...addressList.filter(
              (a) =>
                !(
                  a.streetAddressLine1?.toLowerCase().trim() === newAddr.streetAddressLine1?.toLowerCase().trim() &&
                  a.postalCode?.trim() === newAddr.postalCode?.trim()
                )
            ),
          ].slice(0, 3);
          setAddressList(updated);
          saveAllAddressesToStorage(updated);
          setSelectedAddressIndex(0);
          setIsAddressConfirmed(false); // DO NOT display it as address confirmed already!
          onUpdateDeliveryAddress(newAddr);
          setIsAddNewAddressOpen(false);
        }}
        title="Add New Address"
      />
    </div>
  );
};
