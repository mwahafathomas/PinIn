import React from 'react';
import { X, User, MapPin, Mail, Phone, Calendar, ShieldCheck, Tag } from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#2D8EDE]" />
            <h2 className="font-extrabold text-base text-gray-900">PinIn Account</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-5 text-left space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={getOptimizedImageUrl(user.avatar, { width: 200, quality: 75, format: 'webp' })}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#2D8EDE]"
              loading="lazy"
              decoding="async"
            />
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">{user.name}</h3>
              <p className="text-xs text-[#2D8EDE] font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Furniture Seller & Buyer
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Member since {user.joinedDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-400 text-xs block">Active Listings</span>
              <span className="text-lg font-black text-gray-900">{user.listedItemsCount}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-400 text-xs block">Saved Items</span>
              <span className="text-lg font-black text-gray-900">{user.savedItemIds.length}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs border-t border-gray-100 text-gray-600">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{user.location}</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{user.phone}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-xl text-xs hover:bg-black"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
