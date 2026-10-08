import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Home,
  ShoppingCart,
  User as UserIcon,
  Settings,
  Bookmark,
  ShieldCheck,
  Headphones,
  Edit3,
  UserX,
  LogOut,
  LogIn,
  Package,
  MapPin,
  TrendingUp,
  AlertTriangle,
  X,
  Clock,
  CheckCircle,
  FileText,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Coins,
  Printer,
  Plus,
  Trash2,
  Check,
  Truck,
  ExternalLink,
  LayoutGrid,
} from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import {
  fetchUserOrders,
  OrderRecord,
} from '../services/ordersService';
import {
  submitReturnRequest,
  fetchUserRefunds,
  RefundRecord,
} from '../services/returnsAndRefundsService';
import { getCartCount } from '../services/cartService';
import { DeliveryAddressPage } from './DeliveryAddressPage';

interface AccountPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onDeleteAccount: () => void;
  onOpenDeleteAccount?: () => void;
  onOpenEditProfile?: () => void;
  onOpenSavedItems?: () => void;
  onOpenPolicies?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenContactUs?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onSignOut?: () => void;
  onOpenCart?: () => void;
  onOpenCategories?: () => void;
  onGoHome: () => void;
  // Deprecated props kept optional for compatibility
  userListings?: any[];
  onDeleteListing?: (listingId: string) => void;
  onShareListing?: (listing: any) => void;
  onUpdateBio?: (newBio: string, newLocation?: string) => void;
  onOpenSell?: () => void;
  onSelectItem?: (item: any) => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

const RETURNS_STORAGE_KEY = 'pinin_return_requests_v1';

export const AccountPage: React.FC<AccountPageProps> = ({
  isOpen,
  onClose,
  user,
  onDeleteAccount,
  onOpenDeleteAccount,
  onOpenEditProfile,
  onOpenSavedItems,
  onOpenPolicies,
  onOpenPrivacyPolicy,
  onOpenContactUs,
  onOpenAuth,
  onSignOut,
  onOpenCart,
  onOpenCategories,
  onGoHome,
}) => {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [cartItemCount, setCartItemCount] = useState(getCartCount());

  // Full sub-pages for requested items
  const [activeModal, setActiveModal] = useState<
    'settings' | 'returns' | 'invoices' | 'address-book' | 'help' | 'credits-refunds' | 'my-orders' | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubpageLoading, setIsSubpageLoading] = useState(false);

  // Invoices state
  const [selectedInvoice, setSelectedInvoice] = useState<OrderRecord | null>(null);

  // Refunds state
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);

  // Returns state
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<string>('');
  const [returnReason, setReturnReason] = useState("description doesn't match product");
  const [returnDetails, setReturnDetails] = useState('');

  // Submit return
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnOrder) return;

    const matchedOrder = orders.find((o) => o.orderNumber === selectedReturnOrder);

    // Save to Supabase returns_requests table
    await submitReturnRequest({
      orderNumber: selectedReturnOrder,
      orderId: matchedOrder?.id,
      userEmail: user.email || '',
      userName: user.surname ? `${user.name} ${user.surname}` : user.name,
      listingId: matchedOrder?.listingId,
      itemBought: matchedOrder?.itemBought || 'Item',
      reason: returnReason,
      description: returnDetails,
    });

    setReturnSuccessMsg(
      `Return request for order #${selectedReturnOrder} submitted. Our logistics team will contact you within 24 hours.`
    );
    setTimeout(() => {
      setReturnSuccessMsg('');
      setSelectedReturnOrder('');
      setReturnDetails('');
    }, 4000);
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1200);
      setCartItemCount(getCartCount());
      fetchUserOrders(user.email, user.id).then(setOrders);
      fetchUserRefunds(user.email).then(setRefunds);
      return () => clearTimeout(timer);
    }
  }, [isOpen, user.email, user.id]);

  useEffect(() => {
    if (activeModal) {
      setIsSubpageLoading(true);
      if (activeModal === 'credits-refunds') {
        fetchUserRefunds(user.email).then(setRefunds);
      } else if (activeModal === 'my-orders') {
        fetchUserOrders(user.email, user.id).then(setOrders);
      }
      const timer = setTimeout(() => {
        setIsSubpageLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeModal, user.email, user.id]);

  if (!isOpen) return null;

  const fullName = user.surname ? `${user.name} ${user.surname}` : user.name;
  const userAvatar = user.avatar && user.avatar.trim() !== '' ? user.avatar : DEFAULT_AVATAR_IMAGE;
  const userBio = user.bio && user.bio.trim() !== '' ? user.bio : '';

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-gray-700">
            <UserIcon className="w-4 h-4 text-[#2D8EDE]" />
            <span>Account</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-4 space-y-4 pb-12">
        {isLoading ? (
          /* Shimmer Skeleton Loader for Account Page */
          <div className="space-y-4 animate-pulse pt-1">
            <div className="bg-white rounded-3xl border border-gray-200 p-5 h-20 bg-gray-200" />
            <div className="bg-white rounded-3xl border border-gray-200 p-4 space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-200" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-48 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* User Profile Card - Only User Email */}
            {user.isLoggedIn ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs">
                <p className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                  {user.email}
                </p>
              </div>
            ) : (
              /* Logged out state */
              <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
                  <UserIcon className="w-6 h-6 text-[#2D8EDE]" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900">Welcome to PinIn</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sign in to view your orders, save furniture, and manage your account.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('signin')}
                    className="py-2.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('register')}
                    className="py-2.5 px-4 bg-white border border-gray-300 text-gray-800 font-extrabold text-xs rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}

            {/* Account Menu Navigation */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
              {/* 1. Account Settings (Contains Account Profile, Edit Profile & Delete Account) */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setActiveModal('settings');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <Settings className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Account Settings</p>
                    <p className="text-[11px] text-gray-400">Profile, edit details &amp; delete account</p>
                  </div>
                </div>
              </button>

              {/* 2. My Orders */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setActiveModal('my-orders');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <Package className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">My Orders</p>
                    <p className="text-[11px] text-gray-400">
                      {orders.length > 0 ? `${orders.length} order(s) placed` : 'View order history & status'}
                    </p>
                  </div>
                </div>
              </button>

              {/* 3. Returns */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setActiveModal('returns');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Returns</p>
                    <p className="text-[11px] text-gray-400">7-day guarantee, track &amp; request return</p>
                  </div>
                </div>
              </button>

              {/* 4. Invoices */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setActiveModal('invoices');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Invoices</p>
                    <p className="text-[11px] text-gray-400">View receipts &amp; download tax invoices</p>
                  </div>
                </div>
              </button>

              {/* 5. Address Book */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setActiveModal('address-book');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Address Book</p>
                    <p className="text-[11px] text-gray-400">Manage delivery locations &amp; defaults</p>
                  </div>
                </div>
              </button>

              {/* 6. Help & Support */}
              <button
                type="button"
                onClick={() => setActiveModal('help')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Help &amp; Support</p>
                    <p className="text-[11px] text-gray-400">FAQs, ordering guides &amp; contact</p>
                  </div>
                </div>
              </button>

              {/* 7. Credits & Refunds */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setActiveModal('credits-refunds');
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <Coins className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Credits &amp; Refunds</p>
                    <p className="text-[11px] text-gray-400">Wallet balance &amp; refund status</p>
                  </div>
                </div>
              </button>

              {/* 8. Saved Items */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  if (onOpenSavedItems) onOpenSavedItems();
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <Bookmark className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Saved Items</p>
                    <p className="text-[11px] text-gray-400">View bookmarks &amp; favorited furniture</p>
                  </div>
                </div>
              </button>

              {/* 9. Policies */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenPolicies) onOpenPolicies();
                  else if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Policies</p>
                    <p className="text-[11px] text-gray-400">Terms, privacy policy, and safety</p>
                  </div>
                </div>
              </button>

              {/* 10. Contact Us */}
              <button
                type="button"
                onClick={onOpenContactUs}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <Headphones className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Contact Us</p>
                    <p className="text-[11px] text-gray-400">24/7 customer support &amp; inquiries</p>
                  </div>
                </div>
              </button>

              {/* 11. Sign Out (Logged in only) */}
              {user.isLoggedIn && (
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-blue-50/50 text-gray-800 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-[#2D8EDE]" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">Sign Out</span>
                  </div>
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* FULL PAGE 1: ACCOUNT SETTINGS (Account Profile, Edit Profile, Delete)       */}
      {/* ========================================================================= */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-60 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
          {/* Header */}
          <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
            <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
                </button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                  Pin<span className="text-[#2D8EDE]">In</span>
                </span>
              </div>

              <div className="w-8" aria-hidden="true" />
            </div>
          </header>

          {/* Main Content Area: Only Account Profile and Delete Account */}
          <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            {isSubpageLoading ? (
              <div className="space-y-4 animate-pulse pt-1">
                <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-3">
                  <div className="h-3.5 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3.5 w-52 bg-gray-200 rounded" />
                  <div className="h-10 w-full bg-gray-200 rounded-xl mt-3" />
                </div>
                <div className="bg-white rounded-3xl border border-gray-200 p-5">
                  <div className="h-10 w-full bg-gray-200 rounded-xl" />
                </div>
              </div>
            ) : (
              <>
                {/* Account Profile (name & user email) with Edit Profile button */}
                <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-500">
                    Account Profile
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">{fullName}</p>
                    <p className="text-xs text-gray-500">{user.email || 'No email attached'}</p>
                  </div>

                  {/* Edit Profile placed under account settings */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        if (onOpenEditProfile) onOpenEditProfile();
                      }}
                      className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (!user.isLoggedIn) {
                        setActiveModal(null);
                        onOpenAuth?.('signin');
                        return;
                      }
                      setActiveModal(null);
                      if (onOpenDeleteAccount) onOpenDeleteAccount();
                      else setShowDeleteConfirm(true);
                    }}
                    className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserX className="w-4 h-4 text-red-600" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE 2: MY ORDERS                                                    */}
      {/* ========================================================================= */}
      {activeModal === 'my-orders' && (
        <div className="fixed inset-0 z-60 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
          <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
            <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
                </button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                  Pin<span className="text-[#2D8EDE]">In</span>
                </span>
              </div>

              <div className="w-8" aria-hidden="true" />
            </div>
          </header>

          <main className="flex-1 w-full max-w-md md:max-w-3xl mx-auto overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {orders.length > 0 ? `${orders.length} order(s) placed` : 'No orders placed yet'}
                </p>
              </div>
            </div>

            {isSubpageLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-4 border border-gray-200 rounded-3xl space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 w-28 bg-gray-200 rounded" />
                      <div className="h-4 w-16 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-4 border border-gray-200 rounded-3xl space-y-2.5 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="font-black text-[#2D8EDE] text-sm">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          (order.deliveryStatus || order.status || '').toLowerCase().includes('delivered') &&
                          !(order.deliveryStatus || '').toLowerCase().includes('still')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>{order.deliveryStatus || order.status || 'Still being delivered'}</span>
                      </span>
                    </div>

                    <p className="font-extrabold text-sm text-gray-900">{order.itemBought}</p>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-bold text-gray-900">
                        R{order.price}{' '}
                        {order.quantity && order.quantity > 1 ? `(Qty: ${order.quantity})` : ''}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        {order.dateBought}
                      </span>
                    </div>

                    {order.deliveryEstimation && (
                      <div className="text-[11px] font-bold text-blue-700 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex items-center justify-between">
                        <span>Delivery Estimation:</span>
                        <span>{order.deliveryEstimation}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                      {order.delivery}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-xs text-gray-500 shadow-xs">
                You haven't placed any orders yet. Browse furniture to get started!
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE 3: RETURNS                                                      */}
      {/* ========================================================================= */}
      {activeModal === 'returns' && (
        <div className="fixed inset-0 z-60 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
          <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
            <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
                </button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                  Pin<span className="text-[#2D8EDE]">In</span>
                </span>
              </div>

              <div className="w-8" aria-hidden="true" />
            </div>
          </header>

          <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h1 className="text-xl font-bold text-gray-900">Returns</h1>
              <p className="text-xs text-gray-500 mt-0.5">7-Day Hassle-Free Return Guarantee</p>
            </div>

            {returnSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold">
                {returnSuccessMsg}
              </div>
            )}

            {/* Policy badge */}
            <div className="p-4 bg-white border border-gray-200 rounded-3xl text-xs space-y-1 shadow-xs">
              <p className="font-extrabold text-gray-900 text-sm">PinIn Return Policy</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                You can return any purchased furniture item within 7 days of delivery if the condition does not match the listing description or is defective.
              </p>
            </div>

            {/* Request Return Form */}
            {orders.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-gray-900">Request a Return</h2>
                <form onSubmit={handleSubmitReturn} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Select Order to Return *
                    </label>
                    <select
                      required
                      value={selectedReturnOrder}
                      onChange={(e) => setSelectedReturnOrder(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white cursor-pointer"
                    >
                      <option value="">-- Choose an order --</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.orderNumber}>
                          {o.orderNumber} - {o.itemBought} (R{o.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Reason for Return *
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white cursor-pointer"
                    >
                      <option value="description doesn't match product">Description doesn't match product</option>
                      <option value="wrong product image">Wrong product image</option>
                      <option value="item arrived damaged">Item arrived damaged / scratched</option>
                      <option value="changed mind">Changed mind</option>
                      <option value="other">Other reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Additional Details
                    </label>
                    <textarea
                      rows={3}
                      value={returnDetails}
                      onChange={(e) => setReturnDetails(e.target.value)}
                      placeholder="Describe any specifics to arrange pickup..."
                      className="w-full text-xs p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedReturnOrder}
                    className="w-full py-3 bg-[#2D8EDE] hover:bg-[#2579BE] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Submit Return Request
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-xs text-gray-500 shadow-xs">
                You have no completed orders eligible for return at this time.
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE 4: INVOICES                                                     */}
      {/* ========================================================================= */}
      {activeModal === 'invoices' && (
        <div className="fixed inset-0 z-60 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
          <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
            <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(null);
                    setActiveModal(null);
                  }}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
                </button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                  Pin<span className="text-[#2D8EDE]">In</span>
                </span>
              </div>

              <div className="w-8" aria-hidden="true" />
            </div>
          </header>

          <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
              <p className="text-xs text-gray-500 mt-0.5">View receipts &amp; download tax invoices</p>
            </div>

            {selectedInvoice ? (
              /* Printable digital invoice view */
              <div className="space-y-4">
                <div className="p-5 bg-white border border-gray-200 rounded-3xl text-xs space-y-4 font-mono shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200 font-sans">
                    <span className="font-black text-lg text-gray-900">PinIn INVOICE</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                      PAID
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">Invoice Number</p>
                      <p className="font-bold text-gray-900">INV-{selectedInvoice.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px]">Date</p>
                      <p className="font-bold text-gray-900">{selectedInvoice.dateBought}</p>
                    </div>
                  </div>

                  <div className="text-xs">
                    <p className="text-gray-400 uppercase text-[10px]">Billed To</p>
                    <p className="font-bold text-gray-900">{selectedInvoice.buyerName}</p>
                    <p className="text-gray-600">{selectedInvoice.buyerEmail}</p>
                  </div>

                  <div className="text-xs border-t border-gray-100 pt-3">
                    <p className="text-gray-400 uppercase text-[10px]">Item Description</p>
                    <p className="font-bold text-gray-900">{selectedInvoice.itemBought}</p>
                    <p className="text-gray-600">Seller: {selectedInvoice.sellerName}</p>
                    <p className="text-gray-600">{selectedInvoice.delivery}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between font-sans">
                    <span className="font-bold text-gray-800 text-sm">Total Amount</span>
                    <span className="font-black text-[#2D8EDE] text-lg">R{selectedInvoice.price}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-3 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="py-3 px-5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Back to List
                  </button>
                </div>
              </div>
            ) : (
              /* Invoices list */
              <div className="space-y-3">
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <div
                      key={o.id}
                      className="p-4 bg-white border border-gray-200 rounded-3xl flex items-center justify-between text-xs hover:border-[#2D8EDE] transition-colors shadow-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-black text-gray-900 text-sm">INV-{o.orderNumber}</p>
                        <p className="text-xs text-gray-600 truncate mt-0.5">{o.itemBought}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{o.dateBought} • R{o.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(o)}
                        className="py-2 px-4 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#2D8EDE] font-extrabold text-xs rounded-xl shadow-2xs shrink-0 cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-xs text-gray-500 shadow-xs">
                    No orders have been placed yet. Invoices will automatically appear here once you place an order.
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE 5: ADDRESS BOOK                                                 */}
      {/* ========================================================================= */}
      <DeliveryAddressPage
        isOpen={activeModal === 'address-book'}
        onClose={() => setActiveModal(null)}
        onSaveAddress={() => {
          // Address is persistently saved in local storage by DeliveryAddressPage
        }}
        title="Address Book"
      />

      {/* ========================================================================= */}
      {/* FULL PAGE 6: HELP & SUPPORT                                               */}
      {/* ========================================================================= */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-60 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
          <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
            <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
                </button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                  Pin<span className="text-[#2D8EDE]">In</span>
                </span>
              </div>

              <div className="w-8" aria-hidden="true" />
            </div>
          </header>

          <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h1 className="text-xl font-bold text-gray-900">Help &amp; Support</h1>
              <p className="text-xs text-gray-500 mt-0.5">Answers to common furniture shopping questions</p>
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-white rounded-3xl border border-gray-200 space-y-1 shadow-xs">
                <p className="font-extrabold text-gray-900 text-sm">How long does delivery take?</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Delivery takes 2 to 5 business days across Gauteng and surrounding areas.
                </p>
              </div>

              <div className="p-4 bg-white rounded-3xl border border-gray-200 space-y-1 shadow-xs">
                <p className="font-extrabold text-gray-900 text-sm">What is the return policy?</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Items can be returned within 7 days of delivery if they arrive damaged or do not match the photos/description.
                </p>
              </div>

              <div className="p-4 bg-white rounded-3xl border border-gray-200 space-y-1 shadow-xs">
                <p className="font-extrabold text-gray-900 text-sm">Can I pay in person?</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Yes, for items marked with the "Pay in Person" badge, you can inspect the item and settle upon handover.
                </p>
              </div>

              <div className="p-4 bg-white rounded-3xl border border-gray-200 space-y-1 shadow-xs">
                <p className="font-extrabold text-gray-900 text-sm">How do I report an inaccurate listing?</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Open any listing, click the 3 dots in the top right corner, and select "Report Listing".
                </p>
              </div>
            </div>

            {/* Contact Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  if (onOpenContactUs) onOpenContactUs();
                }}
                className="w-full py-3.5 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-white" />
                <span>Contact Customer Support</span>
              </button>
            </div>
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE 7: CREDITS & REFUNDS                                            */}
      {/* ========================================================================= */}
      {activeModal === 'credits-refunds' && (
        <div className="fixed inset-0 z-60 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
          <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
            <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Go back"
                  className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
                </button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                  Pin<span className="text-[#2D8EDE]">In</span>
                </span>
              </div>

              <div className="w-8" aria-hidden="true" />
            </div>
          </header>

          <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h1 className="text-xl font-bold text-gray-900">Credits &amp; Refunds</h1>
              <p className="text-xs text-gray-500 mt-0.5">Your store wallet balance &amp; payout history</p>
            </div>

            {/* Wallet Balance Card */}
            <div className="p-6 bg-white border border-gray-200 rounded-3xl text-center space-y-2 shadow-xs">
              <p className="text-xs font-black uppercase tracking-wider text-gray-500">Available Store Credit</p>
              <p className="text-3xl font-black text-[#2D8EDE]">R0.00</p>
              <p className="text-xs text-gray-500">
                Credits are automatically applied as discounts during cart checkout.
              </p>
            </div>

            {/* Refund History */}
            <div className="space-y-3 text-xs">
              <p className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Refund History</p>
              <div className="p-4 bg-white rounded-3xl border border-gray-200 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Standard Payout Speed</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Processed refunds take 2 to 5 business days to appear on your bank card statement or reflect immediately as store credit.
                </p>
              </div>

              {refunds.length > 0 ? (
                <div className="space-y-2.5">
                  {refunds.map((ref) => {
                    const statusLower = (ref.status || 'processing').toLowerCase();
                    const statusColor =
                      statusLower === 'approved' || statusLower === 'refunded' || statusLower === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : statusLower === 'rejected' || statusLower === 'declined'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200';

                    return (
                      <div
                        key={ref.id}
                        className="p-4 bg-white rounded-3xl border border-gray-200 space-y-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                          <div>
                            <span className="font-black text-gray-900 text-xs">{ref.refundNumber}</span>
                            <span className="text-[11px] text-gray-400 ml-2">Order #{ref.orderNumber}</span>
                          </div>
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${statusColor}`}
                          >
                            {ref.status || 'Processing'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-800 truncate max-w-[180px]">
                            {ref.itemBought}
                          </span>
                          <span className="font-black text-[#2D8EDE] text-sm">
                            R{ref.amount}
                          </span>
                        </div>
                        {ref.reason && (
                          <p className="text-[11px] text-gray-500 italic">
                            Reason: {ref.reason}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                          Live status updates automatically from our admin console.
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-white rounded-3xl border border-gray-200 text-center text-gray-500 text-xs shadow-xs">
                  No pending or processed refunds.
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <h3 className="text-base font-black text-gray-900">Are you sure you want to sign out?</h3>
            <p className="text-xs text-gray-500">
              You will need to sign in again to access saved items or place orders.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="py-2.5 px-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onSignOut?.();
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <h3 className="text-base font-black text-gray-900">Delete Account?</h3>
            <p className="text-xs text-gray-500">
              This action cannot be undone. All your profile information and local preferences will be permanently removed.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteAccount();
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Dock: Home, Category, Cart, Account */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-2 md:px-8 h-16 grid grid-cols-4 items-center">
          {/* 1. Home */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Home"
          >
            <Home className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#2D8EDE]" />
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Home
            </span>
          </button>

          {/* 2. Category (Middle between Home and Cart) */}
          <button
            type="button"
            onClick={onOpenCategories}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Categories"
          >
            <LayoutGrid className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#2D8EDE]" />
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Category
            </span>
          </button>

          {/* 3. Cart */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 stroke-[2] text-gray-600 group-hover:text-[#2D8EDE]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#2D8EDE] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {cartItemCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Cart
            </span>
          </button>

          {/* 4. Account (Active) */}
          <button
            type="button"
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all relative cursor-pointer text-[#2D8EDE]"
            aria-label="Account"
          >
            <UserIcon className="w-5 h-5 stroke-[2] text-[#2D8EDE]" />
            <span className="text-[11px] font-bold mt-1 leading-none text-[#2D8EDE]">Account</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
