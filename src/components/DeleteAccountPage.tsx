import React, { useState } from 'react';
import {
  ChevronLeft,
  AlertTriangle,
  Lock,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { UserAccount } from '../types/furniture';

interface DeleteAccountPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onConfirmDeleteAccount: () => void;
}

export const DeleteAccountPage: React.FC<DeleteAccountPageProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmDeleteAccount,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleDeleteClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter your password to confirm account deletion.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    setErrorMsg('');
    setIsConfirmModalOpen(true);
  };

  const handleFinalDelete = () => {
    setIsConfirmModalOpen(false);
    onConfirmDeleteAccount();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col font-sans">
      {/* Top Header Bar (White): 1. Go back (<) on left, 2. App name (PinIn) in middle */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* 1: Go back option (<) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* 2: App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto pb-16 flex flex-col px-4 md:px-6 lg:px-8 pt-4 space-y-4">
        {/* Warning Hero Banner */}
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 text-left shadow-xs flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-black text-red-950 tracking-tight">
              Delete PinIn Account
            </h1>
            <p className="text-xs font-semibold text-red-700 mt-0.5 leading-relaxed">
              Account: <span className="font-bold text-red-900">{user.email}</span>
            </p>
          </div>
        </div>

        {/* List of what will happen once they delete their account */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs text-left space-y-3.5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>What happens when you delete your account:</span>
          </h2>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                1
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  All active furniture listings will be permanently removed
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Your posted items will immediately vanish from search results and buyer feeds.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                2
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  Chat history & buyer conversations will be deleted
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  All messages, price negotiations, and pickup arrangements will be erased.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                3
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  Saved wishlist items & bookmarks will be cleared
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  All your favorited furniture listings and followed sellers will be deleted.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                4
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900">
                  Profile & verified credentials permanently wiped
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Your bio, profile picture, location, and account identity will be lost forever.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-red-50/70 border border-red-100">
              <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                !
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-red-700">
                  This action is permanent and cannot be undone
                </p>
                <p className="text-[11px] text-red-600/90 mt-0.5">
                  You cannot restore your account or retrieve previous conversations once deleted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom of the page: Password confirmation requirement */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs text-left space-y-4">
          <div>
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gray-700" />
              <span>Confirm with your password</span>
            </h2>
            <p className="text-xs text-gray-500">
              Please enter your password to confirm that you want to delete your account.
            </p>
          </div>

          <form onSubmit={handleDeleteClick} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter your password..."
                aria-label="Enter your password"
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:bg-white rounded-2xl py-3 pl-4 pr-11 text-xs sm:text-sm font-semibold text-gray-900 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                Keep Account
              </button>

              <button
                type="submit"
                disabled={!password.trim()}
                className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Are You Sure Confirmation Modal */}
      {isConfirmModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsConfirmModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-red-200 text-center space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Are you sure?
              </h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed font-medium">
                This will permanently delete your profile, listings, and conversations. This action cannot be reversed.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl border-2 border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalDelete}
                className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md active:scale-95 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
