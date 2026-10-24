import React, { useState } from 'react';
import {
  ChevronLeft,
  Trash2,
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
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col font-sans select-none">
      {/* Top Header Bar (White): 1. Go back (<) on left, 2. App name (PinIn) in middle */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between relative">
          {/* 1: Go back option (<) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5] text-gray-900" />
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

      {/* Main Content Area - Clean text list with dividers, no boxes or cards */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto pb-16 flex flex-col px-4 md:px-6 py-6 space-y-6">
        {/* Title & Account Email */}
        <div className="pb-1">
          <h1 className="text-lg font-black text-gray-900 tracking-tight">
            Delete Account
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Account: <span className="font-bold text-gray-800">{user.email}</span>
          </p>
        </div>

        {/* Clean text list of consequences with grey dividers (no card, no box, no background) */}
        <div>
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
            What happens when you delete your account:
          </h2>

          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            <div className="py-3.5 space-y-0.5">
              <p className="text-xs font-bold text-gray-900">
                1. All active listings will be permanently removed
              </p>
              <p className="text-[11px] text-gray-500">
                Your posted items will immediately vanish from search results and feeds.
              </p>
            </div>

            <div className="py-3.5 space-y-0.5">
              <p className="text-xs font-bold text-gray-900">
                2. Chat history &amp; conversations will be deleted
              </p>
              <p className="text-[11px] text-gray-500">
                All buyer messages, offers, and negotiations will be erased.
              </p>
            </div>

            <div className="py-3.5 space-y-0.5">
              <p className="text-xs font-bold text-gray-900">
                3. Saved items &amp; bookmarks will be cleared
              </p>
              <p className="text-[11px] text-gray-500">
                All favorited items and followed sellers will be deleted.
              </p>
            </div>

            <div className="py-3.5 space-y-0.5">
              <p className="text-xs font-bold text-gray-900">
                4. Profile &amp; verified credentials permanently wiped
              </p>
              <p className="text-[11px] text-gray-500">
                Your details, profile information, and account identity cannot be restored.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium pt-3">
            This action is permanent and cannot be undone.
          </p>
        </div>

        {/* Password confirmation requirement - clean form, no card */}
        <div className="pt-2 space-y-3">
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Confirm with your password
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Please enter your password to confirm that you want to delete your account.
            </p>
          </div>

          <form onSubmit={handleDeleteClick} className="space-y-4 pt-1">
            <div className="relative border-b border-gray-200 focus-within:border-gray-900 transition-colors">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter your password..."
                aria-label="Enter your password"
                className="w-full bg-transparent py-2.5 pr-10 text-xs sm:text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
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

            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={!password.trim()}
                className="w-full py-3.5 px-4 bg-gray-900 hover:bg-black disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 text-gray-600 hover:text-gray-900 font-bold text-xs transition-colors text-center cursor-pointer"
              >
                Keep Account
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
