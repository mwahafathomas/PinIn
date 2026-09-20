import React, { useState } from 'react';
import {
  X,
  LogIn,
  LogOut,
  PlusCircle,
  User,
  Bookmark,
  ShieldCheck,
  Headphones,
  ChevronRight,
} from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onToggleAuth: () => void;
  onOpenSell: () => void;
  onOpenAccount: () => void;
  onOpenSavedItems: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenPolicies?: () => void;
  onOpenContactUs: () => void;
  onOpenCookieSettings?: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onToggleAuth,
  onOpenSell,
  onOpenAccount,
  onOpenSavedItems,
  onOpenPrivacyPolicy,
  onOpenPolicies,
  onOpenContactUs,
  onOpenCookieSettings,
}) => {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Clear Backdrop (No Blur) */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity duration-300 animate-in fade-in"
        onClick={() => {
          if (!showSignOutConfirm) onClose();
        }}
      />

      {/* Sliding Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-[280px] sm:max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-4 drawer-safe-top border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card info if logged in */}
        {user.isLoggedIn ? (
          <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={getOptimizedImageUrl(user.avatar || DEFAULT_AVATAR_IMAGE, { width: 100, quality: 75, format: 'webp' })}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-blue-200"
                loading="lazy"
                decoding="async"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-600 mb-2.5 font-medium">Welcome to PinIn</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('signin');
                }}
                className="py-2.5 px-3 bg-[#0052FF] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('register');
                }}
                className="py-2.5 px-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                <span>Register</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {/* Sign In / Sign Out */}
          <button
            type="button"
            onClick={() => {
              if (user.isLoggedIn) {
                setShowSignOutConfirm(true);
              } else {
                onClose();
                onOpenAuth('signin');
              }
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 text-gray-700 font-medium text-sm transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {user.isLoggedIn ? (
                <LogOut className="w-5 h-5 text-red-500" />
              ) : (
                <LogIn className="w-5 h-5 text-[#0052FF]" />
              )}
              <span className={user.isLoggedIn ? 'text-red-600 font-semibold' : 'text-gray-900 font-semibold'}>
                {user.isLoggedIn ? 'Sign Out' : 'Sign In'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {/* Sell */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSell();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-gray-800 font-medium text-sm transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <PlusCircle className="w-5 h-5 text-[#0052FF] group-hover:scale-110 transition-transform" />
              <span className="font-bold text-gray-900">Sell</span>
            </div>
            <span className="text-[10px] bg-blue-100 text-[#0052FF] px-2 py-0.5 rounded font-bold">
              + Post
            </span>
          </button>

          {/* Account */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAccount();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 font-medium text-sm transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Account</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Saved Items */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSavedItems();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 font-medium text-sm transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">Saved Items</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {/* Policies */}
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenPolicies) {
                onOpenPolicies();
              } else if (onOpenPrivacyPolicy) {
                onOpenPrivacyPolicy();
              }
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 font-medium text-sm transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gray-600" />
              <span>Policies</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Cookie Settings */}
          {onOpenCookieSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCookieSettings();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 font-medium text-sm transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🍪</span>
                <span>Cookie Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* Contact us */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenContactUs();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100 text-gray-800 font-medium text-sm transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-gray-600" />
              <span>Contact Us</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Drawer footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
          <p className="text-[11px] text-gray-400 font-medium">PinIn</p>
        </div>
      </div>

      {/* "Are you sure you want to sign out?" Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setShowSignOutConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl z-10 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Are you sure you want to sign out?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                You will need to sign in again to list items or chat with sellers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onClose();
                  onToggleAuth();
                }}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
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
