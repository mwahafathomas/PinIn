import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
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
import { NotificationPermissionBanner } from './NotificationPermissionBanner';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import {
  fetchUserOrders,
  OrderRecord,
} from '../services/ordersService';
import {
  fetchUserRefunds,
  RefundRecord,
} from '../services/returnsAndRefundsService';
import { getCartCount } from '../services/cartService';
import { DeliveryAddressPage } from './DeliveryAddressPage';
import { ReturnsFlowModal } from './ReturnsFlowModal';
import { OrdersFlowModal } from './OrdersFlowModal';
import { InvoicesFlowModal } from './InvoicesFlowModal';

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
  onSelectItem,
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans">
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
            <div className="p-2 space-y-3">
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
              <div className="px-2 py-3 border-b border-gray-200">
                <p className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                  {user.email}
                </p>
              </div>
            ) : (
              /* Logged out state - Keep box and border for Welcome to PinIn */
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

            {/* Push Notifications Custom Button (Requirement 6) */}
            <NotificationPermissionBanner compact className="mb-3" />

            {/* Account Menu Navigation - Clean list with grey divider lines (no box/border background) */}
            <div className="divide-y divide-gray-200">
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                    <Package className="w-4 h-4 text-[#2D8EDE]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">Orders</p>
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
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
                  className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-blue-50/50 text-gray-800 text-left transition-colors cursor-pointer"
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

          {/* Main Content Area: Clean text list only with arrow >, no border, no background, no card */}
          <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-4">
            {isSubpageLoading ? (
              <div className="divide-y divide-gray-200 animate-pulse pt-2">
                <div className="py-4 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
                <div className="py-4">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {/* 1. Account Profile / Edit Profile row */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    if (onOpenEditProfile) onOpenEditProfile();
                  }}
                  className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-100/60 text-left transition-colors cursor-pointer group"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      Edit Profile
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {fullName} {user.email ? `• ${user.email}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 2. Delete Account row: clean text list with arrow >, no icon with x, same color as other words (not red) */}
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
                  className="w-full flex items-center justify-between py-4 px-2 hover:bg-gray-100/60 text-left transition-colors cursor-pointer group"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      Delete Account
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Permanently remove your profile and personal data
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL PAGE 2: ORDERS (Pages 10, 20, 30 Flow)                               */}
      {/* ========================================================================= */}
      <OrdersFlowModal
        isOpen={activeModal === 'my-orders'}
        onClose={() => setActiveModal(null)}
        orders={orders}
        onOpenReturns={(_selectedReturnOrder) => {
          setActiveModal('returns');
        }}
        onOpenListing={(listingId) => {
          setActiveModal(null);
          if (onSelectItem) {
            onSelectItem({ id: listingId });
          } else {
            window.location.hash = `#/listing/${listingId}`;
          }
        }}
      />

      {/* ========================================================================= */}
      {/* FULL PAGE 3: RETURNS (3-Step Return Flow)                                 */}
      {/* ========================================================================= */}
      <ReturnsFlowModal
        isOpen={activeModal === 'returns'}
        onClose={() => setActiveModal(null)}
        user={user}
        orders={orders}
        onOpenPolicies={() => {
          setActiveModal(null);
          if (onOpenPolicies) onOpenPolicies();
          else if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
        }}
      />

      {/* ========================================================================= */}
      {/* FULL PAGE 4: INVOICES (Overview & Details Flow)                           */}
      {/* ========================================================================= */}
      <InvoicesFlowModal
        isOpen={activeModal === 'invoices'}
        onClose={() => setActiveModal(null)}
        orders={orders}
        onOpenReturns={(_selectedReturnOrder) => {
          setActiveModal('returns');
        }}
      />

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
