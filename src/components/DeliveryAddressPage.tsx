import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { DeliveryAddress } from '../types/furniture';

export const SAVED_ADDRESS_KEY = 'pinin_saved_delivery_address_v2';
export const ADDRESS_BOOK_KEY = 'pinin_address_book_v2';

export function getSavedDeliveryAddress(): DeliveryAddress | null {
  try {
    const raw = localStorage.getItem(SAVED_ADDRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDeliveryAddressToStorage(address: DeliveryAddress): void {
  try {
    localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(address));
    // Also append / update in user's address book list
    const existingListRaw = localStorage.getItem(ADDRESS_BOOK_KEY);
    let list: DeliveryAddress[] = [];
    if (existingListRaw) {
      try {
        const parsed = JSON.parse(existingListRaw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }
    // Prepend as default/top address without duplicates
    const filtered = list.filter(
      (a) =>
        !(
          a.streetAddressLine1.toLowerCase() === address.streetAddressLine1.toLowerCase() &&
          a.postalCode === address.postalCode
        )
    );
    list = [address, ...filtered];
    localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save delivery address to localStorage:', e);
  }
}

export function getAllSavedAddresses(): DeliveryAddress[] {
  try {
    const raw = localStorage.getItem(ADDRESS_BOOK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const single = getSavedDeliveryAddress();
    return single ? [single] : [];
  } catch {
    return [];
  }
}

interface DeliveryAddressPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAddress: (address: DeliveryAddress) => void;
  title?: string;
}

/**
 * Full page for Delivery Address & Address Book.
 * Rules:
 * - Full page with "Go back" tab and app name "PinIn" at top.
 * - Minimalist styling: NO icons inside the page and NO different/rainbow colors.
 * - Compulsory fields marked with *.
 * - Province is locked to Gauteng.
 * - Saves in user account address book and pre-populates at the top next time.
 */
export const DeliveryAddressPage: React.FC<DeliveryAddressPageProps> = ({
  isOpen,
  onClose,
  onSaveAddress,
  title = 'Delivery Address',
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [streetAddressLine1, setStreetAddressLine1] = useState('');
  const [streetAddressLine2, setStreetAddressLine2] = useState('');
  const [cityTown, setCityTown] = useState('');
  const [province, setProvince] = useState('Gauteng');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1200);

      const all = getAllSavedAddresses();
      setSavedAddresses(all);

      const current = getSavedDeliveryAddress();
      if (current) {
        setRecipientName(current.recipientName || '');
        setRecipientPhone(current.recipientPhone || '');
        setStreetAddressLine1(current.streetAddressLine1 || '');
        setStreetAddressLine2(current.streetAddressLine2 || '');
        setCityTown(current.cityTown || '');
        setPostalCode(current.postalCode || '');
        setDeliveryInstructions(current.deliveryInstructions || '');
      }
      setFormError(null);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation for compulsory fields marked with *
    if (!recipientName.trim()) {
      setFormError('Please enter recipient name');
      return;
    }
    if (!recipientPhone.trim()) {
      setFormError('Please enter recipient phone number');
      return;
    }
    if (!streetAddressLine1.trim()) {
      setFormError('Please enter street address Line 1');
      return;
    }
    if (!cityTown.trim()) {
      setFormError('Please enter city or town');
      return;
    }
    if (!postalCode.trim()) {
      setFormError('Please enter postal / zip code');
      return;
    }
    if (!deliveryInstructions.trim()) {
      setFormError('Please enter delivery instructions');
      return;
    }

    const newAddress: DeliveryAddress = {
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      streetAddressLine1: streetAddressLine1.trim(),
      streetAddressLine2: streetAddressLine2.trim() || undefined,
      cityTown: cityTown.trim(),
      province: 'Gauteng',
      postalCode: postalCode.trim(),
      deliveryInstructions: deliveryInstructions.trim(),
    };

    saveDeliveryAddressToStorage(newAddress);
    onSaveAddress(newAddress);
    onClose();
  };

  const handleSelectSavedAddress = (addr: DeliveryAddress) => {
    saveDeliveryAddressToStorage(addr);
    onSaveAddress(addr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar: standard back button ( < ) and app name PinIn at top */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto px-4 py-6 space-y-5">
        <div className="border-b border-gray-200 pb-3">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* Small box with just the words "Add delivery address" */}
        <div className="pt-1">
          <div className="w-full py-2.5 px-4 border border-gray-300 rounded-xl bg-gray-50 text-center font-bold text-xs text-gray-900 shadow-2xs">
            Add delivery address
          </div>
        </div>

        {isLoading ? (
          /* Shimmer Skeleton Loader for Delivery Address / Address Book */
          <div className="space-y-4 animate-pulse pt-2">
            <div className="h-20 bg-gray-200 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded-xl" />
              <div className="h-10 bg-gray-200 rounded-xl" />
              <div className="h-10 bg-gray-200 rounded-xl" />
              <div className="h-10 bg-gray-200 rounded-xl" />
              <div className="h-24 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-12 bg-gray-200 rounded-xl" />
          </div>
        ) : (
          <>
            {/* Saved Addresses at Top (if existing) */}
            {savedAddresses.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/70 space-y-2">
                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                  Saved in Address Book
                </p>
                <div className="space-y-2">
                  {savedAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs space-y-0.5"
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-900">{addr.recipientName}</p>
                        <button
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className="text-xs font-bold text-gray-900 underline hover:text-black cursor-pointer"
                        >
                          Use this address
                        </button>
                      </div>
                      <p className="text-gray-700">{addr.recipientPhone}</p>
                      <p className="text-gray-700">
                        {addr.streetAddressLine1}
                        {addr.streetAddressLine2 ? `, ${addr.streetAddressLine2}` : ''}
                      </p>
                      <p className="text-gray-700">
                        {addr.cityTown}, {addr.province}, {addr.postalCode}
                      </p>
                      <p className="text-gray-600 italic">
                        Instructions: {addr.deliveryInstructions}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 border border-black bg-gray-100 text-black rounded-lg text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* 1. Recipient Name * */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient full name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-black text-xs"
                />
              </div>

              {/* 2. Recipient Phone Number * */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Recipient Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. 082 123 4567"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-black text-xs"
                />
              </div>

              {/* 3. Street Address Line 1 * */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Street Address Line 1 (street e.g 17 park street) *
                </label>
                <input
                  type="text"
                  required
                  value={streetAddressLine1}
                  onChange={(e) => setStreetAddressLine1(e.target.value)}
                  placeholder="e.g. 17 Park Street"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-black text-xs"
                />
              </div>

              {/* 4. Street Address Line 2 (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Street Address Line 2 (complex/ building name / floor) optional
                </label>
                <input
                  type="text"
                  value={streetAddressLine2}
                  onChange={(e) => setStreetAddressLine2(e.target.value)}
                  placeholder="e.g. Sunset Heights, Block B, Floor 2"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-black text-xs"
                />
              </div>

              {/* 5. City / Town * */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={cityTown}
                  onChange={(e) => setCityTown(e.target.value)}
                  placeholder="e.g. Sandton / Johannesburg / Pretoria"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-black text-xs"
                />
              </div>

              {/* 6. Province * */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Province *
                </label>
                <select
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs font-semibold focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="Gauteng">Gauteng</option>
                </select>
              </div>

              {/* 7. Postal / Zip Code * */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Postal / Zip code *
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 2196"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-black text-xs"
                />
              </div>

              {/* 8. Delivery Instructions * */}
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Delivery instructions *
                </label>
                <textarea
                  required
                  rows={3}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Special instructions for delivery driver upon arrival"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-black text-xs resize-none"
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2 pb-6">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#2D8EDE] hover:bg-[#2079c3] text-white font-bold text-sm rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
};
