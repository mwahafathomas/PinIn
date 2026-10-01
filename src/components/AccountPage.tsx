import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Home,
  ShoppingCart,
  User as UserIcon,
  Settings,
  ChevronRight,
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
} from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import {
  fetchUserOrders,
  OrderRecord,
  fetchMostSearchedItems,
  fetchMostBoughtItems,
  PopularSearchItem,
  PopularBoughtItem,
} from '../services/ordersService';
import { getCartCount } from '../services/cartService';

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

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  suburb: string;
  city: string;
  isDefault: boolean;
}

const ADDRESS_STORAGE_KEY = 'pinin_saved_addresses_v2';
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
  onGoHome,
}) => {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [cartItemCount, setCartItemCount] = useState(getCartCount());
  const [showPopularStats, setShowPopularStats] = useState(false);
  const [popularSearches, setPopularSearches] = useState<PopularSearchItem[]>([]);
  const [popularBought, setPopularBought] = useState<PopularBoughtItem[]>([]);

  // Sub-modals for requested items
  const [activeModal, setActiveModal] = useState<
    'settings' | 'returns' | 'invoices' | 'address-book' | 'help' | 'credits-refunds' | null
  >(null);

  // Invoices state
  const [selectedInvoice, setSelectedInvoice] = useState<OrderRecord | null>(null);

  // Address book state
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'addr-default',
        label: 'Home',
        fullName: user.name || 'Primary Recipient',
        phone: '+27 82 000 0000',
        address: user.location || '14 Sandton Drive',
        suburb: 'Sandton',
        city: 'Johannesburg, Gauteng',
        isDefault: true,
      },
    ];
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrName, setNewAddrName] = useState(user.name || '');
  const [newAddrPhone, setNewAddrPhone] = useState('');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrSuburb, setNewAddrSuburb] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('Gauteng');

  // Returns state
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<string>('');
  const [returnReason, setReturnReason] = useState("description doesn't match product");
  const [returnDetails, setReturnDetails] = useState('');

  // Save addresses to localStorage
  const saveAddressesToStorage = (updated: SavedAddress[]) => {
    setAddresses(updated);
    try {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet.trim()) return;

    const newEntry: SavedAddress = {
      id: `addr-${Date.now()}`,
      label: newAddrLabel || 'Home',
      fullName: newAddrName || user.name || 'Recipient',
      phone: newAddrPhone || '+27 71 000 0000',
      address: newAddrStreet.trim(),
      suburb: newAddrSuburb.trim() || 'Sandton',
      city: newAddrCity.trim() || 'Johannesburg',
      isDefault: addresses.length === 0,
    };

    const updated = [...addresses, newEntry];
    saveAddressesToStorage(updated);
    setIsAddingAddress(false);
    setNewAddrStreet('');
    setNewAddrSuburb('');
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    saveAddressesToStorage(updated);
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    saveAddressesToStorage(updated);
  };

  // Submit return
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnOrder) return;
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
      setCartItemCount(getCartCount());
      fetchUserOrders(user.email, user.id).then(setOrders);
      fetchMostSearchedItems().then(setPopularSearches);
      fetchMostBoughtItems().then(setPopularBought);
    }
  }, [isOpen, user.email, user.id]);

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
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
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
        {/* User Profile Card (Without upload photo option) */}
        {user.isLoggedIn ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={getOptimizedImageUrl(userAvatar, { width: 160, quality: 75, format: 'webp' })}
                alt={fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-xs"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-black text-gray-900 truncate">
                {fullName}
              </h1>
              {user.email && (
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              )}

              {user.location && user.location.trim() !== '' && (
                <p className="text-xs font-bold text-[#2D8EDE] flex items-center gap-1 mt-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{user.location}</span>
                </p>
              )}

              {userBio.trim() !== '' && (
                <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-snug">
                  {userBio}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Logged out state */
          <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
              <UserIcon className="w-6 h-6" />
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
          {/* 1. Account Settings (Contains Delete Account inside) */}
          <button
            type="button"
            onClick={() => setActiveModal('settings')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Account Settings</p>
                <p className="text-[11px] text-gray-400">Security, preferences &amp; account removal</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 2. Returns */}
          <button
            type="button"
            onClick={() => setActiveModal('returns')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Returns</p>
                <p className="text-[11px] text-gray-400">7-day guarantee, track &amp; request return</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 3. Invoices */}
          <button
            type="button"
            onClick={() => setActiveModal('invoices')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Invoices</p>
                <p className="text-[11px] text-gray-400">View receipts &amp; download tax invoices</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 4. Address Book */}
          <button
            type="button"
            onClick={() => setActiveModal('address-book')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Address Book</p>
                <p className="text-[11px] text-gray-400">Manage delivery locations &amp; defaults</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 5. Help */}
          <button
            type="button"
            onClick={() => setActiveModal('help')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Help &amp; Support</p>
                <p className="text-[11px] text-gray-400">FAQs, ordering guides &amp; contact</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 6. Credits & Refunds */}
          <button
            type="button"
            onClick={() => setActiveModal('credits-refunds')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Credits &amp; Refunds</p>
                <p className="text-[11px] text-gray-400">Wallet balance &amp; refund status</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 7. Edit Profile & Bio */}
          {user.isLoggedIn && (
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">Edit Profile &amp; Bio</p>
                  <p className="text-[11px] text-gray-400">Update name, location and about you</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          )}

          {/* 8. My Orders */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">My Orders</p>
                  <p className="text-[11px] text-gray-400">
                    {orders.length > 0 ? `${orders.length} order(s) placed` : 'No orders yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders list */}
            {orders.length > 0 ? (
              <div className="space-y-2 pt-1">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#2D8EDE]">{order.orderNumber}</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>{order.status || 'Completed'}</span>
                      </span>
                    </div>

                    <p className="font-extrabold text-gray-900 line-clamp-1">{order.itemBought}</p>

                    <div className="flex items-center justify-between text-[11px] text-gray-600 pt-0.5">
                      <span>
                        R{order.price}{' '}
                        {order.quantity && order.quantity > 1 ? `(Qty: ${order.quantity})` : ''}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        {order.dateBought}
                      </span>
                    </div>

                    {order.deliveryEstimation && (
                      <div className="text-[10px] font-bold text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded-lg border border-blue-100 flex items-center justify-between">
                        <span>Est. Delivery:</span>
                        <span>{order.deliveryEstimation}</span>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-500 truncate pt-0.5 border-t border-gray-200">
                      {order.delivery}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-2xl text-center text-xs text-gray-500">
                You haven't placed any orders yet. Browse furniture to get started!
              </div>
            )}
          </div>

          {/* 9. Saved Items */}
          <button
            type="button"
            onClick={onOpenSavedItems}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Saved Items</p>
                <p className="text-[11px] text-gray-400">View bookmarks &amp; favorited furniture</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 10. Popular Items & Search Stats */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowPopularStats((prev) => !prev)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Most Searched &amp; Most Bought Items
                  </p>
                  <p className="text-[11px] text-gray-400">Trends and popular listings</p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showPopularStats ? 'rotate-90' : ''
                }`}
              />
            </button>

            {showPopularStats && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                {/* Most Searched */}
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
                    Most Searched Items
                  </span>
                  <div className="divide-y divide-gray-200">
                    {popularSearches.map((s, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{s.query}</span>
                        <span className="text-gray-500 font-bold">{s.search_count} searches</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Bought */}
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                    Most Bought Items
                  </span>
                  <div className="divide-y divide-gray-200">
                    {popularBought.map((b, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 truncate max-w-[200px]">
                          {b.item_title}
                        </span>
                        <span className="text-gray-500 font-bold">{b.total_sold} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 11. Policies & Contact */}
          <button
            type="button"
            onClick={() => {
              if (onOpenPolicies) onOpenPolicies();
              else if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Policies &amp; Guidelines</p>
                <p className="text-[11px] text-gray-400">Terms, privacy policy, and safety</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={onOpenContactUs}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-gray-800 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Contact Us</p>
                <p className="text-[11px] text-gray-400">24/7 customer support &amp; inquiries</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* 12. Sign Out (Logged in only) */}
          {user.isLoggedIn && (
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-red-600 text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold">Sign Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ACCOUNT SETTINGS (With Delete Account inside)                     */}
      {/* ========================================================================= */}
      {activeModal === 'settings' && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-gray-900">Account Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-1 text-xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Account Profile</p>
              <p className="font-extrabold text-gray-900">{fullName}</p>
              <p className="text-gray-500">{user.email || 'No email attached'}</p>
              <p className="text-[#2D8EDE] font-bold pt-1">Region: South Africa (ZAR • R)</p>
            </div>

            {/* Preferences */}
            <div className="space-y-2 text-xs">
              <p className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Preferences</p>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">Push Notifications</p>
                  <p className="text-[10px] text-gray-500">Receive order &amp; listing updates</p>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Enabled
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">Security &amp; Privacy</p>
                  <p className="text-[10px] text-gray-500">Verified session protection</p>
                </div>
                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Protected
                </span>
              </div>
            </div>

            {/* Danger Zone: Delete Account inside Account Settings */}
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">Danger Zone</p>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  if (onOpenDeleteAccount) onOpenDeleteAccount();
                  else setShowDeleteConfirm(true);
                }}
                className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserX className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RETURNS                                                          */}
      {/* ========================================================================= */}
      {activeModal === 'returns' && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Returns &amp; Replacements</h3>
                  <p className="text-[10px] text-gray-500">7-Day Hassle-Free Return Guarantee</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {returnSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold">
                {returnSuccessMsg}
              </div>
            )}

            {/* Policy badge */}
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs space-y-1">
              <p className="font-extrabold text-purple-900">PinIn Return Policy</p>
              <p className="text-[11px] text-purple-800 leading-snug">
                You can return any purchased furniture item within 7 days of delivery if the condition does not match the listing description or is defective.
              </p>
            </div>

            {/* Request Return Form */}
            {orders.length > 0 ? (
              <form onSubmit={handleSubmitReturn} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Select Order to Return *
                  </label>
                  <select
                    required
                    value={selectedReturnOrder}
                    onChange={(e) => setSelectedReturnOrder(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
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
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
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
                    rows={2}
                    value={returnDetails}
                    onChange={(e) => setReturnDetails(e.target.value)}
                    placeholder="Describe any specifics to arrange pickup..."
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedReturnOrder}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Submit Return Request
                </button>
              </form>
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-500">
                You have no completed orders eligible for return at this time.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INVOICES                                                         */}
      {/* ========================================================================= */}
      {activeModal === 'invoices' && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Tax Invoices &amp; Receipts</h3>
                  <p className="text-[10px] text-gray-500">Download printable invoices for your records</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoice(null);
                  setActiveModal(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedInvoice ? (
              /* Printable digital invoice view */
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs space-y-3 font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-300 font-sans">
                    <span className="font-black text-base text-gray-900">PinIn INVOICE</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                      PAID
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-gray-400 uppercase text-[9px]">Invoice Number</p>
                      <p className="font-bold text-gray-900">INV-{selectedInvoice.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[9px]">Date</p>
                      <p className="font-bold text-gray-900">{selectedInvoice.dateBought}</p>
                    </div>
                  </div>

                  <div className="text-[11px]">
                    <p className="text-gray-400 uppercase text-[9px]">Billed To</p>
                    <p className="font-bold text-gray-900">{selectedInvoice.buyerName}</p>
                    <p className="text-gray-600">{selectedInvoice.buyerEmail}</p>
                  </div>

                  <div className="text-[11px] border-t border-gray-200 pt-2">
                    <p className="text-gray-400 uppercase text-[9px]">Item Description</p>
                    <p className="font-bold text-gray-900">{selectedInvoice.itemBought}</p>
                    <p className="text-gray-600">Seller: {selectedInvoice.sellerName}</p>
                    <p className="text-gray-600">{selectedInvoice.delivery}</p>
                  </div>

                  <div className="border-t border-gray-300 pt-2 flex items-center justify-between font-sans">
                    <span className="font-bold text-gray-800 text-xs">Total Amount</span>
                    <span className="font-black text-[#2D8EDE] text-base">R{selectedInvoice.price}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Back to List
                  </button>
                </div>
              </div>
            ) : (
              /* Invoices list */
              <div className="space-y-2">
                {orders.length > 0 ? (
                  orders.map((o) => (
                    <div
                      key={o.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between text-xs hover:border-[#2D8EDE] transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-black text-gray-900">INV-{o.orderNumber}</p>
                        <p className="text-[11px] text-gray-500 truncate">{o.itemBought}</p>
                        <p className="text-[10px] text-gray-400">{o.dateBought} • R{o.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(o)}
                        className="py-1.5 px-3 bg-white border border-gray-300 hover:border-[#2D8EDE] text-[#2D8EDE] font-extrabold text-xs rounded-xl shadow-2xs shrink-0 cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-500">
                    No orders have been placed yet. Invoices will automatically appear here once you place an order.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADDRESS BOOK                                                     */}
      {/* ========================================================================= */}
      {activeModal === 'address-book' && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Address Book</h3>
                  <p className="text-[10px] text-gray-500">Saved delivery addresses &amp; locations</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingAddress(false);
                  setActiveModal(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAddingAddress ? (
              /* Add new address form */
              <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Address Label</label>
                  <input
                    type="text"
                    value={newAddrLabel}
                    onChange={(e) => setNewAddrLabel(e.target.value)}
                    placeholder="e.g. Home, Office, Parents"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={newAddrName}
                    onChange={(e) => setNewAddrName(e.target.value)}
                    placeholder="e.g. Thabo Ndlovu"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newAddrPhone}
                    onChange={(e) => setNewAddrPhone(e.target.value)}
                    placeholder="e.g. +27 82 123 4567"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={newAddrStreet}
                    onChange={(e) => setNewAddrStreet(e.target.value)}
                    placeholder="e.g. 14 Sandton Drive"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Suburb</label>
                    <input
                      type="text"
                      required
                      value={newAddrSuburb}
                      onChange={(e) => setNewAddrSuburb(e.target.value)}
                      placeholder="e.g. Sandton"
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Province / City</label>
                    <input
                      type="text"
                      required
                      value={newAddrCity}
                      onChange={(e) => setNewAddrCity(e.target.value)}
                      placeholder="e.g. Gauteng"
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* Address list */
              <div className="space-y-3">
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-3 rounded-2xl border text-xs space-y-1 relative transition-colors ${
                        addr.isDefault
                          ? 'border-[#2D8EDE] bg-blue-50/50 ring-1 ring-blue-200'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#2D8EDE]" />
                          <span>{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-[9px] bg-[#2D8EDE] text-white px-2 py-0.2 rounded-full font-bold">
                              Default
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                          aria-label="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="font-semibold text-gray-800">{addr.fullName} • {addr.phone}</p>
                      <p className="text-gray-600">{addr.address}, {addr.suburb}, {addr.city}</p>

                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[10px] text-[#2D8EDE] font-extrabold underline pt-1 cursor-pointer block"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#2D8EDE]" />
                  <span>Add New Address</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: HELP                                                             */}
      {/* ========================================================================= */}
      {activeModal === 'help' && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Help &amp; FAQs</h3>
                  <p className="text-[10px] text-gray-500">Answers to common furniture shopping questions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FAQs Accordion */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                <p className="font-extrabold text-gray-900">How long does delivery take?</p>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Delivery takes 2 to 5 business days across Gauteng and surrounding areas. You can also opt for free self-collection.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                <p className="font-extrabold text-gray-900">What is the return policy?</p>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Items can be returned within 7 days of delivery if they arrive damaged or do not match the photos/description.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                <p className="font-extrabold text-gray-900">Can I pay in person?</p>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Yes, for items marked with the "Pay in Person" badge, you can inspect the item and settle during collection.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                <p className="font-extrabold text-gray-900">How do I report an inaccurate listing?</p>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Open any listing, click the 3 dots in the top right corner, and select "Report Listing".
                </p>
              </div>
            </div>

            {/* Contact Action */}
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  if (onOpenContactUs) onOpenContactUs();
                }}
                className="w-full py-2.5 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Headphones className="w-4 h-4" />
                <span>Contact Customer Support</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CREDITS & REFUNDS                                                */}
      {/* ========================================================================= */}
      {activeModal === 'credits-refunds' && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Credits &amp; Refunds</h3>
                  <p className="text-[10px] text-gray-500">Your store wallet balance &amp; payout history</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wallet Balance Card */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Available Store Credit</p>
              <p className="text-2xl font-black text-indigo-950">R0.00</p>
              <p className="text-[10px] text-indigo-800">
                Credits are automatically applied as discounts during cart checkout.
              </p>
            </div>

            {/* Refund History */}
            <div className="space-y-2 text-xs">
              <p className="font-extrabold text-gray-900 text-[11px] uppercase tracking-wider">Refund History</p>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Standard Payout Speed</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Processed refunds take 2 to 5 business days to appear on your bank card statement or reflect immediately as store credit.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center text-gray-500 text-[11px]">
                No pending or processed refunds.
              </div>
            </div>
          </div>
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
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
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

      {/* Bottom Navigation Dock: Home, Cart, Account */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-3 items-center">
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

          {/* 2. Cart */}
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

          {/* 3. Account (Active) */}
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
