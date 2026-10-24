import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Landmark, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { fetchUserRefunds, withdrawUserRefunds } from '../services/profilesService';
import { recordRefundWithdrawal } from '../services/returnsAndRefundsService';

interface CreditsPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onUserUpdate?: (updated: Partial<UserAccount>) => void;
}

export const CreditsPage: React.FC<CreditsPageProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdate,
}) => {
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    return typeof user?.refunds === 'number' ? user.refunds : 0;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // Fetch latest balance from Supabase when opened
  useEffect(() => {
    if (isOpen && user?.id) {
      setIsLoading(true);
      fetchUserRefunds(user.id)
        .then((val) => {
          setWalletBalance(val);
          if (onUserUpdate) {
            onUserUpdate({ refunds: val });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleWithdrawClick = () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    setWithdrawStatus(null);
    setIsModalOpen(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (!user?.id) return;
    if (walletBalance <= 0) {
      setIsModalOpen(false);
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await withdrawUserRefunds(user.id);
      if (res.success) {
        const withdrawnAmount = res.amount || walletBalance;
        setWalletBalance(0);
        if (onUserUpdate) {
          onUserUpdate({ refunds: 0 });
        }

        // Insert into Supabase `refunds` table
        recordRefundWithdrawal({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          amount: withdrawnAmount,
        }).catch((err) => {
          console.warn('Notice recording to refunds table:', err);
        });

        setWithdrawStatus({
          type: 'success',
          message: `R${withdrawnAmount.toFixed(2)} withdrawal requested, funds can take 2 - 5 business days to reflect in your bank account`,
        });

        // Make the message show for a few seconds then disappear
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => {
          setWithdrawStatus(null);
        }, 4500);
      } else {
        setWithdrawStatus({
          type: 'error',
          message: res.error || 'Failed to process withdrawal.',
        });
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => {
          setWithdrawStatus(null);
        }, 5000);
      }
    } catch {
      setWithdrawStatus({
        type: 'error',
        message: 'Network error processing withdrawal. Please try again.',
      });
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => {
        setWithdrawStatus(null);
      }, 5000);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* 1 & 2: Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between relative">
          {/* 1: Go back option (<) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5] text-gray-900" />
            </button>
          </div>

          {/* 2: App Name (PinIn) in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* 3: Words "Refunds" section (Subheader bar as drawn in layout) */}
      <div className="shrink-0 w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 py-3.5">
          <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            Refunds
          </h1>
        </div>
      </div>

      {/* Main Content Area (Items 4, 5, 6) */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6 flex flex-col justify-start space-y-6 text-left">
        {/* Inline Feedback Banner (if user recently withdrew) */}
        {withdrawStatus && (
          <div
            className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-bold border transition-all ${
              withdrawStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {withdrawStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{withdrawStatus.message}</span>
          </div>
        )}

        {/* 4: "Wallet balance" */}
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Wallet balance
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              {isLoading ? (
                <span className="inline-block w-24 h-8 bg-gray-200 rounded animate-pulse align-middle" />
              ) : (
                `R${walletBalance.toFixed(2)}`
              )}
            </p>
          </div>
        </div>

        {/* 5: "Withdraw to bank" button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleWithdrawClick}
            className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
          >
            Withdraw to bank
          </button>
        </div>

        {/* 6: Message: "Refunds take 2 - 5 business days to reflect in your bank account" */}
        <div className="pt-1">
          <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
            Refunds take 2 - 5 business days to reflect in your bank account
          </p>
        </div>
      </main>

      {/* Center of Screen Modal Dialog (Triggered on "Withdraw to bank") */}
      {isModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-center relative border border-gray-100 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-modal-title"
          >
            {/* Close button on top right */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6 stroke-[2]" />
            </div>

            {/* Title & Exact Required Message in the middle of the screen */}
            <div className="space-y-2">
              <h3 id="withdraw-modal-title" className="text-base font-black text-gray-900">
                Withdraw to bank
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-relaxed px-2">
                Refunds are paid to the same account used for payment
              </p>
              {walletBalance > 0 ? (
                <div className="pt-2 text-xs font-bold text-gray-500">
                  Withdrawal amount:{' '}
                  <span className="text-sm font-black text-[#2D8EDE]">
                    R{walletBalance.toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 font-medium pt-1">
                  Your current wallet balance is R0.00
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {walletBalance > 0 ? (
                <>
                  <button
                    type="button"
                    disabled={isWithdrawing}
                    onClick={async () => {
                      await handleConfirmWithdrawal();
                      setIsModalOpen(false);
                    }}
                    className="w-full py-3 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
