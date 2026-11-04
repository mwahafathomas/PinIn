import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronDown, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { fetchUserRefunds, withdrawUserRefunds } from '../services/profilesService';
import {
  recordRefundWithdrawal,
  fetchRefundsHistory,
  RefundRecord,
} from '../services/returnsAndRefundsService';

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
  const [isWithdrawPageOpen, setIsWithdrawPageOpen] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Refunds History Dropdown state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<RefundRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const loadHistory = () => {
    setIsLoadingHistory(true);
    fetchRefundsHistory(user?.email)
      .then((data) => setHistoryList(data))
      .catch((err) => console.warn('Failed to load refunds history:', err))
      .finally(() => setIsLoadingHistory(false));
  };

  // Fetch latest balance and history from Supabase when opened
  useEffect(() => {
    if (isOpen) {
      if (user?.id) {
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
      loadHistory();
    }
  }, [isOpen, user?.id, user?.email]);

  if (!isOpen) return null;

  const handleWithdrawClick = () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    setWithdrawStatus(null);
    setIsWithdrawPageOpen(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (!user?.id) return;
    if (walletBalance <= 0) {
      setIsWithdrawPageOpen(false);
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

        // Insert into Supabase `refunds` table and refresh history
        recordRefundWithdrawal({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          amount: withdrawnAmount,
        })
          .then(() => loadHistory())
          .catch((err) => {
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
              <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
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

        {/* Refunds history dropdown: words "Refunds history" with ^ facing down */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className="w-full flex items-center justify-between py-2 text-left cursor-pointer group select-none"
          >
            <span className="text-sm font-black text-gray-900 tracking-tight">
              Refunds history
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-700 transition-transform duration-200 ${
                isHistoryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isHistoryOpen && (
            <div className="mt-2 space-y-2 pt-1">
              {isLoadingHistory ? (
                <div className="py-4 text-center text-xs text-gray-400 animate-pulse">
                  Loading history...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-3 text-xs text-gray-400 italic">
                  No refunds history found.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between text-xs hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-900">
                          {item.refundNumber || `REF-${item.id.slice(0, 6)}`}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('en-ZA', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Recent'}
                          {item.reason ? ` • ${item.reason}` : ''}
                        </p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="font-black text-gray-900">
                          R{Number(item.amount).toFixed(2)}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.status || 'Processing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Full New Page for Withdraw to bank */}
      {isWithdrawPageOpen && (
        <div className="fixed inset-0 z-70 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none animate-in slide-in-from-right duration-200">
          {/* Header with go back (<) in blue at top left and app name in middle */}
          <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200">
            <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between relative">
              <button
                type="button"
                onClick={() => setIsWithdrawPageOpen(false)}
                aria-label="Go back"
                className="p-2 -ml-2 rounded-lg text-[#2D8EDE] hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>

              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                  Pin<span className="text-[#2D8EDE]">In</span>
                </span>
              </div>

              <div className="w-8" aria-hidden="true" />
            </div>
          </header>

          <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6 flex flex-col justify-between text-left">
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  Withdraw to bank
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Transfer your refunds wallet balance to your linked bank account
                </p>
              </div>

              {/* Message in the middle of the screen */}
              <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2.5">
                <p className="text-sm font-black text-gray-900 leading-snug">
                  Refunds are paid to the same account used for payment
                </p>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Refunds take 2 - 5 business days to reflect in your bank account
                </p>
              </div>

              {/* Current balance card */}
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Wallet Balance
                </p>
                <p className="text-3xl sm:text-4xl font-black text-gray-900">
                  R{walletBalance.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-6 space-y-3 pb-6">
              {walletBalance > 0 ? (
                <>
                  <button
                    type="button"
                    disabled={isWithdrawing}
                    onClick={async () => {
                      await handleConfirmWithdrawal();
                      setIsWithdrawPageOpen(false);
                    }}
                    className="w-full py-4 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                  >
                    {isWithdrawing ? 'Processing Withdrawal...' : `Confirm Withdrawal of R${walletBalance.toFixed(2)}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawPageOpen(false)}
                    className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-xs text-gray-500 font-medium">
                    Your current wallet balance is R0.00
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawPageOpen(false)}
                    className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Go Back
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
