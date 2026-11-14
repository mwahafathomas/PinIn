import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { CreditsPage } from './CreditsPage';
import { HelpSupportPage } from './HelpSupportPage';
import { registerBackHandler } from '../utils/backNavigation';

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
  initialModal?: 'settings' | null;
  onClearSettingsModal?: () => void;
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
  initialModal = null,
  onClearSettingsModal,
}) => {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [cartItemCount, setCartItemCount] = useState(getCartCount());

  // Full sub-pages for requested items
  const [activeModal, setActiveModal] = useState<
    'settings' | 'returns' | 'invoices' | 'address-book' | 'help' | 'credits' | 'credits-refunds' | 'my-orders' | null
  >(initialModal);
  const [returnsOrigin, setReturnsOrigin] = useState<'invoices' | null>(null);
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

  useEffect(() => {
    if (isOpen && initialModal === 'settings') {
      setActiveModal('settings');
    }
  }, [isOpen, initialModal]);

  const closeSettingsModal = () => {
    setActiveModal(null);
    onClearSettingsModal?.();
  };

  const handleAccountOverlayBackRef = useRef<() => boolean>(() => false);
  handleAccountOverlayBackRef.current = () => {
    if (showSignOutConfirm) {
      setShowSignOutConfirm(false);
      return true;
    }
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
      return true;
    }
    if (activeModal === 'settings') {
      closeSettingsModal();
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(() => handleAccountOverlayBackRef.current());
  }, [isOpen]);

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

          <div className="flex items-center text-xs font-bold text-gray-700">
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
                  <div className="h-4 w-32 bg-gray-200 rounded" />
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
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900">Welcome to PinIn</h2>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('signin')}
                    className="py-2.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                  >
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

            {/* Account Menu Navigation - Clean list with grey divider lines (no icons, no box/border background) */}
            <div className="divide-y divide-gray-200">
              {/* 1. Account Settings */}
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
                <p className="text-xs sm:text-sm font-bold text-gray-900">Account Settings</p>
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
                <p className="text-xs sm:text-sm font-bold text-gray-900">Orders</p>
              </button>

              {/* 3. Returns */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setReturnsOrigin(null);
                  setActiveModal('returns');
                }}
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <p className="text-xs sm:text-sm font-bold text-gray-900">Returns</p>
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
                <p className="text-xs sm:text-sm font-bold text-gray-900">Invoices</p>
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
                <p className="text-xs sm:text-sm font-bold text-gray-900">Address Book</p>
              </button>

              {/* 6. Help & Support */}
              <button
                type="button"
                onClick={() => setActiveModal('help')}
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <p className="text-xs sm:text-sm font-bold text-gray-900">Help &amp; Support</p>
              </button>

              {/* 7. Refunds */}
              <button
                type="button"
                onClick={() => {
                  if (!user.isLoggedIn) {
                    onOpenAuth?.('signin');
                    return;
                  }
                  setActiveModal('credits');
                }}
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <p className="text-xs sm:text-sm font-bold text-gray-900">Refunds</p>
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
                <p className="text-xs sm:text-sm font-bold text-gray-900">Saved Items</p>
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
                <p className="text-xs sm:text-sm font-bold text-gray-900">Policies</p>
              </button>

              {/* 10. Contact Us */}
              <button
                type="button"
                onClick={onOpenContactUs}
                className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
              >
                <p className="text-xs sm:text-sm font-bold text-gray-900">Contact Us</p>
              </button>

              {/* 11. Sign Out (Logged in only) */}
              {user.isLoggedIn && (
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-blue-50/50 text-gray-800 text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-gray-900">Sign Out</span>
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
                  onClick={closeSettingsModal}
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
      {/* Animated Sliding Sub-Pages (Opens like page comes from right) */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key={activeModal}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-0 z-50 overflow-hidden bg-white"
          >
            {activeModal === 'my-orders' && (
              <OrdersFlowModal
                isOpen={true}
                onClose={() => setActiveModal(null)}
                orders={orders}
                onOpenReturns={(_selectedReturnOrder) => {
                  setReturnsOrigin(null);
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
                onOpenPolicies={() => {
                  setActiveModal(null);
                  if (onOpenPolicies) {
                    onOpenPolicies();
                  } else if (onOpenPrivacyPolicy) {
                    onOpenPrivacyPolicy();
                  }
                }}
              />
            )}

            {activeModal === 'returns' && (
              <ReturnsFlowModal
                isOpen={true}
                onClose={() => {
                  if (returnsOrigin === 'invoices') {
                    setReturnsOrigin(null);
                    setActiveModal('invoices');
                  } else {
                    setActiveModal(null);
                  }
                }}
                user={user}
                orders={orders}
                onOpenPolicies={() => {
                  setActiveModal(null);
                  if (onOpenPolicies) onOpenPolicies();
                  else if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                }}
              />
            )}

            {activeModal === 'invoices' && (
              <InvoicesFlowModal
                isOpen={true}
                onClose={() => setActiveModal(null)}
                orders={orders}
                onOpenReturns={(_selectedReturnOrder) => {
                  setReturnsOrigin('invoices');
                  setActiveModal('returns');
                }}
              />
            )}

            {activeModal === 'address-book' && (
              <DeliveryAddressPage
                isOpen={true}
                onClose={() => setActiveModal(null)}
                onSaveAddress={() => {}}
                title="Address Book"
              />
            )}

            {activeModal === 'help' && (
              <HelpSupportPage
                isOpen={true}
                onClose={() => setActiveModal(null)}
                onOpenContactUs={() => {
                  setActiveModal(null);
                  if (onOpenContactUs) onOpenContactUs();
                }}
              />
            )}

            {(activeModal === 'credits' || activeModal === 'credits-refunds') && (
              <CreditsPage
                isOpen={true}
                onClose={() => setActiveModal(null)}
                user={user}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
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
                className="py-2.5 px-3 rounded-xl bg-[#2D8EDE] hover:bg-[#2579BE] text-white text-xs font-extrabold shadow-md cursor-pointer"
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
