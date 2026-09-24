import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
  Navigate,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapApp } from '@capacitor/app';
import { Share as CapShare } from '@capacitor/share';

import { Header } from './components/Header';
import { ActionNav } from './components/ActionNav';
import { HeroSearch } from './components/HeroSearch';
import { FurnitureGrid } from './components/FurnitureGrid';
import { BottomNav } from './components/BottomNav';
import { MenuDrawer } from './components/MenuDrawer';
import { ListingDetailPage } from './components/ListingDetailPage';
import { NotificationsPage } from './components/NotificationsPage';
import { SavedItemsPage } from './components/SavedItemsPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { ContactUsPage } from './components/ContactUsPage';
import { DeleteAccountPage } from './components/DeleteAccountPage';
import { EditProfilePage } from './components/EditProfilePage';
import { AuthPage } from './components/AuthPage';
import { SellPage } from './components/SellPage';
import { CategoriesPage } from './components/CategoriesPage';
import { FiltersPage } from './components/FiltersPage';
import { LocationPage } from './components/LocationPage';
import { FilterResultsPage } from './components/FilterResultsPage';
import { AccountPage } from './components/AccountPage';
import { MessagesPage } from './components/MessagesPage';
import { SearchPage } from './components/SearchPage';
import { ChatBoxPage } from './components/ChatBoxPage';
import { UserProfilePage } from './components/UserProfilePage';
import { PullToRefresh } from './components/PullToRefresh';
import { Toast } from './components/Toast';
import { DesktopFooter } from './components/DesktopFooter';
import { InternetBanner } from './components/InternetBanner';
import {
  initGoogleAnalytics,
  trackPageView,
} from './services/analyticsService';
import { supabase } from './supabaseClient';
import {
  fetchAllListings,
  fetchUserListings,
  fetchListingById,
  insertListing,
  deleteListingFromDb,
  mapRowToFurnitureItem,
  isListingRowApproved,
  getLocalListings,
  getLocalUserListings,
  saveLocalListing,
  getDeletedListingIds,
  generateValidUUID,
  SupabaseListingRow,
} from './services/listingsService';
import {
  fetchAllConversations,
  getLocalConversations,
  saveConversationToDb,
  saveMessageToDb,
  setConversationBlockedInDb,
  clearConversationMessagesInDb,
  markConversationMessagesAsReadInDb,
} from './services/messagesService';
import { formatDisplayName } from './utils/formatUtils';
import { submitListingReport } from './services/reportsService';
import {
  fetchUserSavedListingIds,
  getLocalSavedItemIds,
  saveListingForUser,
  removeSavedListingForUser,
} from './services/savedListingsService';
import {
  getStoredNotifications,
  saveStoredNotifications,
  markAllNotificationIdsAsRead,
  createSubmittedNotification,
  createApprovedNotification,
  createRejectedNotification,
  fetchSupabaseNotifications,
  mapSupabaseNotificationRow,
  SupabaseNotificationRow,
} from './services/notificationsService';
import {
  initOneSignal,
  loginUserToOneSignal,
  logoutUserFromOneSignal,
} from './services/oneSignalService';
import {
  fetchUserProfile,
  getLocalUserProfile,
  upsertUserProfile,
  fetchAllRegisteredUsers,
  recordKnownUser,
  AppUserOption,
  markUserProfileUpdated,
  isUserProfileUpdated,
} from './services/profilesService';
import {
  Coordinates,
  getCachedUserLocation,
  requestBrowserLocation,
  clearUserLocationPermission,
  calculateDistanceKm,
  formatDistanceKm,
  getCoordinatesForLocation,
} from './utils/geoUtils';

import {
  INITIAL_FURNITURE,
  CATEGORIES,
  INITIAL_CONVERSATIONS,
  INITIAL_USER,
} from './data/mockData';
import { DEFAULT_AVATAR_IMAGE } from './data/defaultAvatar';
import {
  FurnitureItem,
  FilterState,
  ChatConversation,
  ChatMessage,
  NotificationItem,
  UserAccount,
  SellFormData,
} from './types/furniture';

const initialSellFormData: SellFormData = {
  title: '',
  images: [],
  price: '',
  category: 'sofas',
  categoryLabel: 'Sofas & Couches',
  location: 'Sandton (Gauteng)',
  model: '',
  isNew: 'Used',
  condition: '',
  description: '',
};

// Page Transition Variants for Framer Motion (300ms ease-in-out slide)
const pageVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? '100%' : '-100%',
    zIndex: direction >= 0 ? 20 : 10,
    opacity: 1,
  }),
  center: {
    x: 0,
    zIndex: 15,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? '-100%' : '100%',
    zIndex: direction >= 0 ? 10 : 20,
    opacity: 1,
  }),
};

const pageTransition = {
  duration: 0.3, // 300ms
  ease: [0.4, 0, 0.2, 1], // ease-in-out cubic-bezier
};

// Helper function to match furniture items with one or more categories
function matchFurnitureWithCategories(item: FurnitureItem, categories?: string[], categoryStr?: string): boolean {
  const catsToMatch: string[] = [];
  if (categories && categories.length > 0) {
    catsToMatch.push(...categories);
  } else if (categoryStr && categoryStr !== 'all') {
    catsToMatch.push(...categoryStr.split(',').map((c) => c.trim()).filter(Boolean));
  }

  if (catsToMatch.length === 0 || catsToMatch.includes('all')) {
    return true;
  }

  const titleLower = (item.title || '').toLowerCase();
  const descLower = (item.description || '').toLowerCase();
  const catLower = (item.category || '').toLowerCase();
  const materialLower = (item.material || '').toLowerCase();
  const brandLower = (item.brand || '').toLowerCase();

  return catsToMatch.some((rawCat) => {
    const raw = rawCat.toLowerCase().trim();
    if (!raw || raw === 'all') return true;

    // Direct category ID match
    if (catLower === raw) return true;

    // Category mapping semantics
    if (raw.includes('couch') || raw.includes('sofa')) {
      if (
        catLower === 'sofas' ||
        titleLower.includes('sofa') ||
        titleLower.includes('couch') ||
        descLower.includes('sofa') ||
        descLower.includes('couch') ||
        titleLower.includes('sectional') ||
        titleLower.includes('chaise')
      )
        return true;
    }
    if (raw.includes('table') || raw.includes('coffee') || raw.includes('dining')) {
      if (
        catLower === 'tables' ||
        titleLower.includes('table') ||
        descLower.includes('table') ||
        titleLower.includes('desk') ||
        titleLower.includes('dining')
      )
        return true;
    }
    if (raw.includes('chair') || raw.includes('stool') || raw.includes('bench') || raw.includes('recliner')) {
      if (
        catLower === 'chairs' ||
        titleLower.includes('chair') ||
        descLower.includes('chair') ||
        titleLower.includes('stool') ||
        titleLower.includes('bench') ||
        titleLower.includes('recliner')
      )
        return true;
    }
    if (raw.includes('bed') || raw.includes('mattress') || raw.includes('headboard') || raw.includes('wardrobe') || raw.includes('bedframe')) {
      if (
        catLower === 'beds' ||
        catLower === 'bedroom' ||
        titleLower.includes('bed') ||
        titleLower.includes('mattress') ||
        titleLower.includes('headboard') ||
        titleLower.includes('wardrobe') ||
        titleLower.includes('closet')
      )
        return true;
    }
    if (
      raw.includes('stand') ||
      raw.includes('tv') ||
      raw.includes('cabinet') ||
      raw.includes('storage') ||
      raw.includes('cupboard') ||
      raw.includes('credenza') ||
      raw.includes('bookcase') ||
      raw.includes('shelf') ||
      raw.includes('shelves') ||
      raw.includes('side board') ||
      raw.includes('sideboard')
    ) {
      if (
        catLower === 'storage' ||
        titleLower.includes('stand') ||
        titleLower.includes('tv') ||
        titleLower.includes('cabinet') ||
        titleLower.includes('credenza') ||
        titleLower.includes('storage') ||
        titleLower.includes('bookcase') ||
        titleLower.includes('shelf') ||
        titleLower.includes('shelves') ||
        titleLower.includes('cupboard') ||
        titleLower.includes('sideboard')
      )
        return true;
    }
    if (
      raw.includes('fridge') ||
      raw.includes('refrigerator') ||
      raw.includes('stove') ||
      raw.includes('microwave') ||
      raw.includes('oven') ||
      raw.includes('kettle') ||
      raw.includes('blender') ||
      raw.includes('washing machine')
    ) {
      if (
        catLower === 'kitchen' ||
        catLower === 'storage' ||
        titleLower.includes('fridge') ||
        titleLower.includes('stove') ||
        titleLower.includes('microwave') ||
        titleLower.includes('oven') ||
        titleLower.includes('kettle') ||
        titleLower.includes('blender') ||
        titleLower.includes('washing machine')
      )
        return true;
    }

    // Split category subterms
    const subTerms = raw.split('/').map((s) => s.trim().toLowerCase()).filter(Boolean);
    for (const term of subTerms) {
      if (
        titleLower.includes(term) ||
        descLower.includes(term) ||
        catLower.includes(term) ||
        materialLower.includes(term) ||
        brandLower.includes(term)
      ) {
        return true;
      }
    }

    return false;
  });
}

interface ListingDetailViewProps {
  selectedItem: FurnitureItem | null;
  furnitureList: FurnitureItem[];
  userOwnListings: FurnitureItem[];
  user: UserAccount;
  savedItemIds: string[];
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  onToggleSave: (itemId: string, e?: React.MouseEvent) => void;
  onSendMessageToSeller: (item: FurnitureItem, messageText: string) => void;
  onShare: (item: FurnitureItem, e?: React.MouseEvent) => void;
  onReport: (item: FurnitureItem, reason: string, details?: string) => void;
  onOpenSearch: () => void;
  onOpenMessages: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenUserProfile?: (userId: string, initialData?: any) => void;
  onClose: () => void;
}

const ListingDetailView: React.FC<ListingDetailViewProps> = ({
  selectedItem,
  furnitureList,
  userOwnListings,
  user,
  savedItemIds,
  unreadMessagesCount,
  unreadNotificationsCount,
  onToggleSave,
  onSendMessageToSeller,
  onShare,
  onReport,
  onOpenSearch,
  onOpenMessages,
  onOpenNotifications,
  onOpenAuth,
  onOpenUserProfile,
  onClose,
}) => {
  const { id } = useParams<{ id: string }>();
  const [fetchedItem, setFetchedItem] = useState<FurnitureItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      fetchListingById(id).then((mapped) => {
        if (isMounted && mapped) {
          setFetchedItem(mapped);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const fromSelected = selectedItem?.id === id ? selectedItem : null;
  const fromList = furnitureList.find((i) => i.id === id);
  const fromOwn = userOwnListings.find((i) => i.id === id);
  const item =
    (fetchedItem?.additionalImages && fetchedItem.additionalImages.length > 0)
      ? fetchedItem
      : (fromSelected?.additionalImages && fromSelected.additionalImages.length > 0)
      ? fromSelected
      : (fromList?.additionalImages && fromList.additionalImages.length > 0)
      ? fromList
      : (fromOwn?.additionalImages && fromOwn.additionalImages.length > 0)
      ? fromOwn
      : fetchedItem || fromSelected || fromList || fromOwn || null;

  return (
    <ListingDetailPage
      item={item}
      isOpen={true}
      onClose={onClose}
      isSaved={item ? savedItemIds.includes(item.id) : false}
      onToggleSave={onToggleSave}
      onSendMessageToSeller={onSendMessageToSeller}
      onShare={onShare}
      onReport={onReport}
      onOpenSearch={onOpenSearch}
      onOpenMessages={onOpenMessages}
      onOpenNotifications={onOpenNotifications}
      unreadMessagesCount={unreadMessagesCount}
      unreadNotificationsCount={unreadNotificationsCount}
      user={user}
      onOpenAuth={onOpenAuth}
      onOpenUserProfile={onOpenUserProfile}
    />
  );
};

interface SearchPageViewProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  furnitureList: FurnitureItem[];
  savedItemIds: string[];
  conversations: ChatConversation[];
  allUsers: Array<{ id: string; name: string; avatar: string; location?: string; role?: string }>;
  currentUser: UserAccount;
  onClose: () => void;
  onSelectItem: (item: FurnitureItem) => void;
  onToggleSave: (itemId: string, e?: React.MouseEvent) => void;
  onViewAllResults: () => void;
  onSelectUserForChat: (user: { id: string; name: string; avatar: string; location?: string }) => void;
  onSellItemWithTitle?: (title: string) => void;
  onRequireAuth?: () => void;
}

const SearchPageView: React.FC<SearchPageViewProps> = ({
  searchQuery,
  onSearchChange,
  furnitureList,
  savedItemIds,
  conversations,
  allUsers,
  currentUser,
  onClose,
  onSelectItem,
  onToggleSave,
  onViewAllResults,
  onSelectUserForChat,
  onSellItemWithTitle,
  onRequireAuth,
}) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialType = searchParams.get('type') === 'messages' ? 'messages' : 'furniture';

  return (
    <SearchPage
      isOpen={true}
      onClose={onClose}
      initialType={initialType}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      furnitureList={furnitureList}
      savedItemIds={savedItemIds}
      onSelectItem={onSelectItem}
      onToggleSave={onToggleSave}
      onViewAllResults={onViewAllResults}
      conversations={conversations}
      allUsers={allUsers}
      onSelectUserForChat={onSelectUserForChat}
      currentUser={currentUser}
      onSellItemWithTitle={onSellItemWithTitle}
      onRequireAuth={onRequireAuth}
    />
  );
};

interface MessagesListViewProps {
  conversations: ChatConversation[];
  allUsers: Array<{ id: string; name: string; avatar: string; location?: string; role?: string }>;
  user: UserAccount;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  onClose: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onBlockUser: (conversationId: string) => void;
  onUnblockUser: (conversationId: string) => void;
  onClearChat: (conversationId: string) => void;
  onStartNewConversationWithUser: (user: { id: string; name: string; avatar: string; location?: string }, msg?: string) => string;
  onSelectConversation: (convId: string | null) => void;
  onOpenNotifications: () => void;
  onOpenSearchPage: () => void;
  onOpenHome?: () => void;
  onOpenAccount?: () => void;
  onClearBadgeCount?: () => void;
  onOpenMenu?: () => void;
  onOpenUserProfile?: (userId: string, initialData?: any) => void;
}

const MessagesListView: React.FC<MessagesListViewProps> = ({
  conversations,
  allUsers,
  user,
  unreadMessagesCount,
  unreadNotificationsCount,
  onClose,
  onSendMessage,
  onBlockUser,
  onUnblockUser,
  onClearChat,
  onStartNewConversationWithUser,
  onSelectConversation,
  onOpenNotifications,
  onOpenSearchPage,
  onOpenHome,
  onOpenAccount,
  onClearBadgeCount,
  onOpenMenu,
  onOpenUserProfile,
}) => {
  return (
    <MessagesPage
      isOpen={true}
      onClose={onClose}
      conversations={conversations}
      onSendMessage={onSendMessage}
      onBlockUser={onBlockUser}
      onUnblockUser={onUnblockUser}
      onClearChat={onClearChat}
      onStartNewConversationWithUser={onStartNewConversationWithUser}
      activeConversationId={null}
      onSelectConversation={onSelectConversation}
      user={user}
      allUsers={allUsers}
      onOpenNotifications={onOpenNotifications}
      onOpenSearchPage={onOpenSearchPage}
      onOpenHome={onOpenHome}
      onOpenAccount={onOpenAccount}
      unreadMessagesCount={unreadMessagesCount}
      unreadNotificationsCount={unreadNotificationsCount}
      onClearBadgeCount={onClearBadgeCount}
      onOpenMenu={onOpenMenu}
      onOpenUserProfile={onOpenUserProfile}
    />
  );
};

interface ChatBoxViewProps {
  conversations: ChatConversation[];
  user: UserAccount;
  unreadMessagesCount: number;
  allUsers?: Array<{ id: string; name: string; avatar: string; location?: string; role?: string }>;
  onClose: () => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onBlockUser: (conversationId: string) => void;
  onUnblockUser: (conversationId: string) => void;
  onClearChat: (conversationId: string) => void;
  onMarkAsRead: (conversationId: string) => void;
  onGoToMessages: () => void;
  onOpenUserProfile?: (userId: string, initialData?: any) => void;
}

const ChatBoxView: React.FC<ChatBoxViewProps> = ({
  conversations,
  user,
  unreadMessagesCount,
  allUsers,
  onClose,
  onSendMessage,
  onBlockUser,
  onUnblockUser,
  onClearChat,
  onMarkAsRead,
  onGoToMessages,
  onOpenUserProfile,
}) => {
  const { id } = useParams<{ id: string }>();
  const conv = conversations.find((c) => c.id === id);

  if (!conv) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mb-4 text-2xl font-bold">
          💬
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-1">Conversation Not Found</h2>
        <p className="text-xs text-gray-500 max-w-xs mb-6 font-medium">
          This chat might have been removed or you opened an expired link.
        </p>
        <button
          type="button"
          onClick={onGoToMessages}
          className="px-5 py-2.5 bg-[#2D8EDE] hover:bg-[#2579BE] text-white text-xs font-black rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  return (
    <ChatBoxPage
      conversation={conv}
      isOpen={true}
      onClose={onClose}
      onSendMessage={onSendMessage}
      onBlockUser={onBlockUser}
      onUnblockUser={onUnblockUser}
      onClearChat={onClearChat}
      onMarkAsRead={onMarkAsRead}
      unreadMessagesCount={unreadMessagesCount}
      user={user}
      allUsers={allUsers}
      onOpenUserProfile={onOpenUserProfile}
    />
  );
};

interface UserProfileRouteViewProps {
  currentUser: UserAccount;
  onClose: () => void;
  onMessageUser: (targetUser: { id: string; name: string; avatar: string; location?: string }) => void;
  selectedProfile: { id: string; profile?: any } | null;
  onRequireAuth?: () => void;
}

const UserProfileRouteView: React.FC<UserProfileRouteViewProps> = ({
  currentUser,
  onClose,
  onMessageUser,
  selectedProfile,
  onRequireAuth,
}) => {
  const { id } = useParams<{ id: string }>();
  const effectiveId = id || selectedProfile?.id || '';
  const initial = selectedProfile?.id === effectiveId ? selectedProfile.profile : null;

  return (
    <UserProfilePage
      userId={effectiveId}
      initialProfile={initial}
      currentUser={currentUser}
      onClose={onClose}
      onMessageUser={onMessageUser}
      onRequireAuth={onRequireAuth}
    />
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation Direction (1 = forward slide in from right, -1 = backward slide in from left)
  const [direction, setDirection] = useState<number>(1);

  // Helper: Navigate forward (Slide in from right, old slides out to left)
  const goTo = (to: string, customDirection = 1) => {
    setDirection(customDirection);
    navigate(to);
  };

  // Helper: Navigate backward (Slide in from left, old slides out to right)
  const goBack = (fallbackPath = '/') => {
    setDirection(-1);
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (window.history.length > 1 && location.pathname !== '/') {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  // Listen for browser / hardware back button popstate
  useEffect(() => {
    const handlePopState = () => {
      setDirection(-1);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // State (Initialized from fast local storage caches so screen is populated immediately on open)
  const [furnitureList, setFurnitureList] = useState<FurnitureItem[]>(() => {
    const local = getLocalListings();
    const deleted = getDeletedListingIds();
    const cleanInitial = INITIAL_FURNITURE.filter((l) => !deleted.has(l.id));
    const validLocal = local.filter((l) => isListingRowApproved(l) && !deleted.has(l.id));
    return validLocal.length > 0 ? validLocal : cleanInitial;
  });
  const [userOwnListings, setUserOwnListings] = useState<FurnitureItem[]>(() => {
    const deleted = getDeletedListingIds();
    return getLocalUserListings(INITIAL_USER.id).filter((l) => !deleted.has(l.id));
  });
  const [user, setUser] = useState<UserAccount>(() => {
    // Task 2: On app start, FIRST check localStorage.getItem('user_data')
    try {
      const storedUserData = localStorage.getItem('user_data');
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        if (parsed && (parsed.id || parsed.email)) {
          return {
            ...INITIAL_USER,
            ...parsed,
            isLoggedIn: true,
          };
        }
      }
    } catch {}

    const cachedProfile = getLocalUserProfile(INITIAL_USER.id);
    const cachedSaved = getLocalSavedItemIds(INITIAL_USER.id);
    const isUpdated = isUserProfileUpdated(INITIAL_USER.id) || !!cachedProfile?.name;
    return {
      ...INITIAL_USER,
      ...(cachedProfile || {}),
      isProfileUpdated: isUpdated,
      profileCompleted: isUpdated,
      savedItemIds: cachedSaved && cachedSaved.length > 0 ? cachedSaved : INITIAL_USER.savedItemIds,
    };
  });
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    const localConvs = getLocalConversations();
    return localConvs && localConvs.length > 0 ? localConvs : INITIAL_CONVERSATIONS;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getStoredNotifications());
  const [registeredUsers, setRegisteredUsers] = useState<AppUserOption[]>([]);

  // Geolocation & Distance State (Active only if user allowed tracking)
  const [userCoords, setUserCoords] = useState<Coordinates | null>(() => getCachedUserLocation().coords);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(() => getCachedUserLocation().hasPermission);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const handleRequestUserLocation = async (silent = false) => {
    setIsLocatingUser(true);
    try {
      const { coords } = await requestBrowserLocation();
      setUserCoords(coords);
      setHasLocationPermission(true);
      if (!silent) {
        showToast('📍 Location enabled! Showing distance in km & nearby furniture.');
      }
    } catch (err: unknown) {
      const isDenied = err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 1;
      if (!silent) {
        if (isDenied) {
          showToast('Location permission denied in browser. Showing all listings.');
        } else {
          showToast('Could not retrieve current GPS location.');
        }
      }
    } finally {
      setIsLocatingUser(false);
    }
  };

  const handleDisableLocation = () => {
    clearUserLocationPermission();
    setUserCoords(null);
    setHasLocationPermission(false);
    showToast('Location tracking turned off.');
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    minPrice: 0,
    maxPrice: 20000,
    condition: [],
    sortBy: 'featured',
    location: '',
    locationQuery: '',
  });

  // Modal / Drawer States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showPostReviewPopup, setShowPostReviewPopup] = useState(false);
  const [submittedListingTitle, setSubmittedListingTitle] = useState<string>('');
  const [editProfileSource, setEditProfileSource] = useState<'sell' | 'account' | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<{ id: string; profile?: any } | null>(null);

  const handleOpenUserProfile = (userId: string, initialData?: any) => {
    setSelectedUserProfile({ id: userId, profile: initialData });
    goTo(`/user/${userId}`, 1);
  };

  // Sell Form Persistent State (retained across Category and Location sub-pages)
  const [sellFormData, setSellFormData] = useState<SellFormData>(() => ({
    ...initialSellFormData,
    location: user.location || 'Sandton (Gauteng)',
  }));

  // Update sellFormData location if user profile location updates
  useEffect(() => {
    if (user.location) {
      setSellFormData((prev) => ({
        ...prev,
        location: prev.location === initialSellFormData.location ? user.location : prev.location,
      }));
    }
  }, [user.location]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Feed Refreshing State
  const [isFeedRefreshing, setIsFeedRefreshing] = useState(false);

  // Offline detection using navigator.onLine and window online/offline events
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Android hardware back button handling via @capacitor/app
  const lastBackPressTimeRef = useRef<number>(0);
  const isMenuOpenRef = useRef(isMenuOpen);
  const showPostReviewPopupRef = useRef(showPostReviewPopup);
  const locationRef = useRef(location);

  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  useEffect(() => {
    showPostReviewPopupRef.current = showPostReviewPopup;
  }, [showPostReviewPopup]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    const handleHardwareBack = () => {
      // 1. If drawer/menu is open, close drawer first
      if (isMenuOpenRef.current) {
        setIsMenuOpen(false);
        return;
      }

      // 2. If modal popups are open, close them first
      if (showPostReviewPopupRef.current) {
        setShowPostReviewPopup(false);
        return;
      }

      const currentPath = locationRef.current.pathname;

      // 3. If current route is / (home/search) then show "Press again to exit", don't exit instantly on first press
      if (currentPath === '/') {
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2000) {
          try {
            CapApp.exitApp();
          } catch (e) {
            console.warn('Could not exit app:', e);
          }
        } else {
          lastBackPressTimeRef.current = now;
          showToast('Press again to exit');
        }
        return;
      }

      // 4. If on product detail / chat / other pages, go back to previous page using navigate(-1)
      setDirection(-1);
      if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
        navigate(-1);
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    };

    let listenerHandle: { remove: () => void } | null = null;
    let isMounted = true;

    const setupListener = async () => {
      try {
        const handle = await CapApp.addListener('backButton', () => {
          handleHardwareBack();
        });
        if (isMounted) {
          listenerHandle = handle;
        } else if (handle && typeof handle.remove === 'function') {
          handle.remove();
        }
      } catch (err) {
        console.warn('Capacitor backButton listener registration:', err);
      }
    };

    setupListener();

    // Also support document backbutton event (Capacitor/Cordova webview fallback)
    const onDocBackButton = (e: Event) => {
      e.preventDefault();
      handleHardwareBack();
    };
    document.addEventListener('backbutton', onDocBackButton);

    return () => {
      isMounted = false;
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      document.removeEventListener('backbutton', onDocBackButton);
    };
  }, [navigate]);

  // Initialize Google Analytics on mount (with Google Consent Mode v2 default denied)
  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  // Track page views on route / URL changes whenever analytics consent is granted
  useEffect(() => {
    const fullPath = location.pathname + location.search;
    const pageTitles: Record<string, string> = {
      '/': 'PinIn',
      '/sell': 'Sell Furniture - PinIn',
      '/categories': 'Categories - PinIn',
      '/filters': 'Filters - PinIn',
      '/location': 'Select Location - PinIn',
      '/results': 'Filter Results - PinIn',
      '/search': 'Search Furniture - PinIn',
      '/messages': 'Messages & Chats - PinIn',
      '/notifications': 'Notifications - PinIn',
      '/account': 'My Account - PinIn',
      '/edit-profile': 'Edit Profile - PinIn',
      '/delete-account': 'Delete Account - PinIn',
      '/saved': 'Saved Items - PinIn',
      '/privacy': 'Privacy Policy - PinIn',
      '/contact': 'Contact Us - PinIn',
      '/auth': 'Sign In / Register - PinIn',
      '/login': 'Sign In - PinIn',
      '/register': 'Register - PinIn',
    };
    let title = pageTitles[location.pathname];
    if (!title && location.pathname.startsWith('/item/')) {
      title = selectedItem ? `${selectedItem.title} - PinIn` : 'Furniture Details - PinIn';
    } else if (!title && location.pathname.startsWith('/messages/')) {
      title = 'Chat Conversation - PinIn';
    }
    title = title || 'PinIn';
    trackPageView(fullPath, title);
  }, [location.pathname, location.search, selectedItem]);

  const handleRefreshFeed = async () => {
    setIsFeedRefreshing(true);
    try {
      const items = await fetchAllListings(true);
      if (items) {
        setFurnitureList(items);
      }
      showToast('Marketplace feed refreshed!');
    } catch (err) {
      console.error('Failed to refresh feed:', err);
    } finally {
      setIsFeedRefreshing(false);
    }
  };

  // Check active Supabase session on mount & load persisted listings & messages
  useEffect(() => {
    const syncStatusNotifications = (userId: string, myListings: FurnitureItem[]) => {
      setNotifications((prev) => {
        let updated = [...prev];
        let changed = false;

        myListings.forEach((item) => {
          if (item.status === 'approved') {
            const hasApproved = updated.some(
              (n) => n.type === 'listing_approved' && n.targetItemId === item.id
            );
            const hasSubmitted = updated.some(
              (n) => (n.type === 'listing_submitted' || n.type === 'system') && n.targetItemId === item.id
            );
            if (!hasApproved && hasSubmitted) {
              const notif = createApprovedNotification(item.title, item.id);
              updated = [notif, ...updated];
              changed = true;
            }
          } else if (item.status === 'rejected') {
            const hasRejected = updated.some(
              (n) => n.type === 'listing_rejected' && n.targetItemId === item.id
            );
            const hasSubmitted = updated.some(
              (n) => (n.type === 'listing_submitted' || n.type === 'system') && n.targetItemId === item.id
            );
            if (!hasRejected && hasSubmitted) {
              const notif = createRejectedNotification(item.title, item.id, item.rejectionReason);
              updated = [notif, ...updated];
              changed = true;
            } else if (hasRejected && item.rejectionReason) {
              // Update notification if rejection reason was newly added/updated
              const existingIndex = updated.findIndex(
                (n) => n.type === 'listing_rejected' && n.targetItemId === item.id
              );
              if (existingIndex !== -1 && updated[existingIndex].rejectionReason !== item.rejectionReason) {
                const refreshedNotif = createRejectedNotification(item.title, item.id, item.rejectionReason);
                updated[existingIndex] = refreshedNotif;
                changed = true;
              }
            }
          }
        });

        if (changed) {
          saveStoredNotifications(userId, updated);
        }
        return changed ? updated : prev;
      });
    };

    const syncRemoteNotifications = (userId?: string) => {
      if (!userId || userId === 'guest') {
        setNotifications([]);
        return;
      }
      fetchSupabaseNotifications(userId).then((remoteNotifs) => {
        if (remoteNotifs && remoteNotifs.length > 0) {
          setNotifications((prev) => {
            let updated = [...prev];
            let changed = false;

            remoteNotifs.forEach((r) => {
              const idx = updated.findIndex((u) => u.id === r.id);
              if (idx === -1) {
                updated.unshift(r);
                changed = true;
              } else if (
                updated[idx].message !== r.message ||
                updated[idx].rejectionReason !== r.rejectionReason ||
                updated[idx].title !== r.title
              ) {
                updated[idx] = { ...updated[idx], ...r };
                changed = true;
              }
            });

            if (changed) {
              saveStoredNotifications(userId, updated);
              return [...updated];
            }
            return prev;
          });
        }
      });
    };

    // 0. Initialize OneSignal Push Notifications
    initOneSignal();

    // 1. Fetch listings from Supabase & offline cache
    fetchAllListings().then((items) => {
      setFurnitureList(items || []);
    });

    // 2. Fetch conversations & messages from Supabase & offline cache
    fetchAllConversations().then((convs) => {
      setConversations(convs || []);
    });

    // 2b. Fetch all registered users for discovery & messaging
    fetchAllRegisteredUsers().then((users) => {
      if (users && users.length > 0) setRegisteredUsers(users);
    });

    // 3. Fetch active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userMeta = session.user.user_metadata || {};
        const displayName =
          userMeta.full_name ||
          (userMeta.first_name
            ? `${userMeta.first_name} ${userMeta.surname || ''}`.trim()
            : session.user.email?.split('@')[0] || '');

        const cachedProfile = getLocalUserProfile(session.user.id);
        const cachedSaved = getLocalSavedItemIds(session.user.id);
        const deletedIds = getDeletedListingIds();
        const cachedUserListings = getLocalUserListings(session.user.id).filter((l) => !deletedIds.has(l.id));

        if (cachedUserListings.length > 0) {
          setUserOwnListings(cachedUserListings);
        }

        // Hydrate from instant cache first
        setUser({
          id: session.user.id,
          name: cachedProfile?.name || displayName,
          surname: cachedProfile?.surname || userMeta.surname || '',
          bio: cachedProfile?.bio || userMeta.bio || '',
          email: cachedProfile?.email || session.user.email || '',
          avatar:
            cachedProfile?.avatar ||
            userMeta.avatar_url ||
            DEFAULT_AVATAR_IMAGE,
          phone: cachedProfile?.phone || userMeta.phone || '',
          location: cachedProfile?.location || userMeta.location || 'Gauteng',
          savedItemIds: cachedSaved,
          listedItemsCount: cachedUserListings.length,
          joinedDate: 'Member',
          isLoggedIn: true,
        });

        recordKnownUser({
          id: session.user.id,
          name: cachedProfile?.name || displayName,
          avatar: cachedProfile?.avatar || userMeta.avatar_url || DEFAULT_AVATAR_IMAGE,
          email: cachedProfile?.email || session.user.email || '',
          location: cachedProfile?.location || userMeta.location || 'Gauteng',
          role: 'Member',
        });
        fetchAllRegisteredUsers().then((users) => {
          if (users && users.length > 0) setRegisteredUsers(users);
        });

        loginUserToOneSignal(session.user.id, session.user.email, displayName);

        const storedNotifs = getStoredNotifications(session.user.id);
        setNotifications(storedNotifs);
        syncRemoteNotifications(session.user.id);

        // Fetch fresh profile in background
        fetchUserProfile(session.user.id).then((dbProfile) => {
          if (dbProfile) {
            setUser((prev) => ({
              ...prev,
              name: dbProfile.name || prev.name,
              surname: dbProfile.surname !== undefined ? dbProfile.surname : prev.surname,
              bio: dbProfile.bio !== undefined ? dbProfile.bio : prev.bio,
              email: dbProfile.email || prev.email,
              avatar: dbProfile.avatar || prev.avatar,
              phone: dbProfile.phone || prev.phone,
              location: dbProfile.location || prev.location,
            }));
          }
        });

        fetchUserSavedListingIds(session.user.id).then((savedIds) => {
          if (savedIds) {
            setUser((prev) => ({ ...prev, savedItemIds: savedIds }));
          }
        });

        fetchUserListings(session.user.id).then((myListings) => {
          if (myListings) {
            const cleanListings = myListings.filter((l) => !getDeletedListingIds().has(l.id));
            setUserOwnListings(cleanListings);
            setUser((prev) => ({ ...prev, listedItemsCount: cleanListings.length }));
            syncStatusNotifications(session.user.id, cleanListings);
          }
        });
      } else {
        syncRemoteNotifications(undefined);
      }
    }).catch(() => {
      // Ignore if supabase credentials or network unavailable
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userMeta = session.user.user_metadata || {};
        const displayName =
          userMeta.full_name ||
          (userMeta.first_name
            ? `${userMeta.first_name} ${userMeta.surname || ''}`.trim()
            : session.user.email?.split('@')[0] || 'Member');

        const cachedProfile = getLocalUserProfile(session.user.id);
        const cachedSaved = getLocalSavedItemIds(session.user.id);
        const deletedIds = getDeletedListingIds();
        const cachedUserListings = getLocalUserListings(session.user.id).filter((l) => !deletedIds.has(l.id));

        if (cachedUserListings.length > 0) {
          setUserOwnListings(cachedUserListings);
        }

        setUser({
          id: session.user.id,
          name: cachedProfile?.name || displayName,
          surname: cachedProfile?.surname || userMeta.surname || '',
          bio: cachedProfile?.bio || userMeta.bio || 'Interior design lover, buying and selling unique pre-loved furniture pieces.',
          email: cachedProfile?.email || session.user.email || '',
          avatar:
            cachedProfile?.avatar ||
            userMeta.avatar_url ||
            DEFAULT_AVATAR_IMAGE,
          phone: cachedProfile?.phone || userMeta.phone || '+1 (555) 234-5678',
          location: cachedProfile?.location || userMeta.location || 'Gauteng',
          savedItemIds: cachedSaved,
          listedItemsCount: cachedUserListings.length,
          joinedDate: 'Member',
          isLoggedIn: true,
          isProfileUpdated: isUserProfileUpdated(session.user.id) || !!cachedProfile?.name,
          profileCompleted: isUserProfileUpdated(session.user.id) || !!cachedProfile?.name,
        });

        loginUserToOneSignal(session.user.id, session.user.email, displayName);

        const storedNotifs = getStoredNotifications(session.user.id);
        setNotifications(storedNotifs);
        syncRemoteNotifications(session.user.id);

        fetchUserProfile(session.user.id).then((dbProfile) => {
          if (dbProfile) {
            const isUpdated = isUserProfileUpdated(session.user.id) || !!dbProfile.name;
            setUser((prev) => ({
              ...prev,
              name: dbProfile.name || prev.name,
              surname: dbProfile.surname !== undefined ? dbProfile.surname : prev.surname,
              bio: dbProfile.bio !== undefined ? dbProfile.bio : prev.bio,
              email: dbProfile.email || prev.email,
              avatar: dbProfile.avatar || prev.avatar,
              phone: dbProfile.phone || prev.phone,
              location: dbProfile.location || prev.location,
              isProfileUpdated: isUpdated || prev.isProfileUpdated,
              profileCompleted: isUpdated || prev.profileCompleted,
            }));
          }
        });

        fetchUserSavedListingIds(session.user.id).then((savedIds) => {
          if (savedIds) {
            setUser((prev) => ({ ...prev, savedItemIds: savedIds }));
          }
        });

        fetchUserListings(session.user.id).then((myListings) => {
          if (myListings) {
            setUserOwnListings(myListings);
            setUser((prev) => ({ ...prev, listedItemsCount: myListings.length }));
            syncStatusNotifications(session.user.id, myListings);
          }
        });
      } else {
        logoutUserFromOneSignal();
        setUser(INITIAL_USER);
        setUserOwnListings([]);
        setNotifications(getStoredNotifications());
        syncRemoteNotifications(undefined);
      }
    });

    // 4. Realtime subscription for listings & messages
    const channel = supabase
      .channel('public:realtime_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        (payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newRow = payload.new as unknown as SupabaseListingRow;
            if (isListingRowApproved(newRow)) {
              const newItem = mapRowToFurnitureItem(newRow);
              setFurnitureList((prev) => {
                const without = prev.filter((item) => item.id !== newItem.id);
                return [newItem, ...without];
              });
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const newRow = payload.new as unknown as SupabaseListingRow;
            if (isListingRowApproved(newRow)) {
              const updatedItem = mapRowToFurnitureItem(newRow);
              setFurnitureList((prev) => {
                const exists = prev.some((item) => item.id === updatedItem.id);
                if (exists) {
                  return prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
                }
                return [updatedItem, ...prev];
              });
            } else {
              setFurnitureList((prev) => prev.filter((item) => item.id !== newRow.id));
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setFurnitureList((prev) => prev.filter((item) => item.id !== deletedId));
              setUserOwnListings((prev) => prev.filter((item) => item.id !== deletedId));
            }
          }

          supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUserId = session?.user?.id;
            if (currentUserId) {
              if (payload?.eventType === 'UPDATE' && payload.new) {
                const newRow = payload.new as { id?: string; title?: string; status?: string; is_approved?: boolean | string; seller_id?: string };
                const oldRow = payload.old as { status?: string; is_approved?: boolean | string } | undefined;
                if (newRow.seller_id === currentUserId && newRow.id && newRow.title) {
                  const nowApproved = isListingRowApproved(newRow);
                  const wasApproved = isListingRowApproved(oldRow);

                  if (nowApproved && !wasApproved) {
                    setNotifications((prev) => {
                      const alreadyNotified = prev.some(
                        (n) => n.type === 'listing_approved' && n.targetItemId === newRow.id
                      );
                      if (alreadyNotified) return prev;
                      const notif = createApprovedNotification(newRow.title!, newRow.id!);
                      const updated = [notif, ...prev];
                      saveStoredNotifications(currentUserId, updated);
                      return updated;
                    });
                    showToast(`🎉 Your listing "${newRow.title}" was approved by admin and is now live!`);
                  } else if (newRow.status === 'rejected' && oldRow?.status !== 'rejected') {
                    const rowReason = (newRow as Record<string, unknown>).rejection_reason ||
                      (newRow as Record<string, unknown>).rejectionReason ||
                      (newRow as Record<string, unknown>).reject_reason ||
                      undefined;
                    setNotifications((prev) => {
                      const alreadyNotified = prev.some(
                        (n) => n.type === 'listing_rejected' && n.targetItemId === newRow.id
                      );
                      if (alreadyNotified) return prev;
                      const notif = createRejectedNotification(
                        newRow.title!,
                        newRow.id!,
                        typeof rowReason === 'string' ? rowReason : undefined
                      );
                      const updated = [notif, ...prev];
                      saveStoredNotifications(currentUserId, updated);
                      return updated;
                    });
                    showToast(`Your listing "${newRow.title}" was reviewed and not approved.`);
                  }
                }
              }

              fetchUserListings(currentUserId).then((myListings) => {
                if (myListings) {
                  setUserOwnListings(myListings);
                  setUser((prev) => ({ ...prev, listedItemsCount: myListings.length }));
                  syncStatusNotifications(currentUserId, myListings);
                }
              });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchAllConversations().then((convs) => {
            if (convs) setConversations(convs);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchAllConversations().then((convs) => {
            if (convs) setConversations(convs);
          });
          fetchAllRegisteredUsers().then((users) => {
            if (users && users.length > 0) setRegisteredUsers(users);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_listings' },
        () => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) {
              fetchUserSavedListingIds(session.user.id).then((savedIds) => {
                if (savedIds) setUser((prev) => ({ ...prev, savedItemIds: savedIds }));
              });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload: { eventType: string; new?: Record<string, unknown> }) => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUserId = session?.user?.id;
            if (payload.new) {
              const row = payload.new as unknown as SupabaseNotificationRow;
              const isTargeted = Boolean(currentUserId && row.user_id === currentUserId);

              if (isTargeted) {
                const notif = mapSupabaseNotificationRow(row);
                setNotifications((prev) => {
                  const existsIdx = prev.findIndex((n) => n.id === notif.id);
                  let updated = [...prev];
                  if (existsIdx === -1) {
                    updated = [notif, ...updated];
                  } else {
                    updated[existsIdx] = { ...updated[existsIdx], ...notif };
                  }
                  saveStoredNotifications(currentUserId, updated);
                  return updated;
                });
                if (payload.eventType === 'INSERT') {
                  showToast(`🔔 ${notif.title}`);
                }
              }
            }
            if (currentUserId) {
              syncRemoteNotifications(currentUserId);
            }
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      markAllNotificationIdsAsRead(prev.map((n) => n.id));
      const hasUnread = prev.some((n) => !n.read);
      if (!hasUnread) return prev;
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveStoredNotifications(user.id, updated);
      return updated;
    });
  }, [user.id]);

  // Delete individual notification
  const handleDeleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== notificationId);
      saveStoredNotifications(user.id, updated);
      return updated;
    });
    showToast('Notification deleted');
  }, [user.id]);

  // Open notifications and clear badge
  const handleOpenNotifications = useCallback(() => {
    handleMarkAllNotificationsRead();
    goTo('/notifications');
  }, [handleMarkAllNotificationsRead]);

  // Guard function to protect private pages & actions with supabase.auth.getSession()
  const requireAuth = async (actionCallback: () => void) => {
    // 1. If user is already logged in, proceed immediately without server requirement
    if (user && user.isLoggedIn && user.id && user.id !== 'guest') {
      actionCallback();
      return;
    }

    // 2. Check localStorage for user_data
    try {
      const storedUserData = localStorage.getItem('user_data');
      if (storedUserData) {
        const parsed = JSON.parse(storedUserData);
        if (parsed && (parsed.id || parsed.email)) {
          setUser((prev) => ({ ...prev, ...parsed, isLoggedIn: true }));
          actionCallback();
          return;
        }
      }
    } catch {}

    // 3. If offline, don't attempt network call to Supabase
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (localStorage.getItem('user_data')) {
        actionCallback();
        return;
      }
      setAuthMode('signin');
      goTo('/auth?mode=signin');
      showToast('Please sign in or register to continue');
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session && session.user) {
        actionCallback();
      } else {
        setAuthMode('signin');
        goTo('/auth?mode=signin');
        showToast('Sign in first to access this page');
      }
    } catch {
      if (user.isLoggedIn || localStorage.getItem('user_data')) {
        actionCallback();
      } else {
        setAuthMode('signin');
        goTo('/auth?mode=signin');
        showToast('Sign in first to access this page');
      }
    }
  };

  // Scroll to top / Go to Home
  const handleGoHome = () => {
    const mainEl = document.getElementById('home-main-scroll');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchQuery('');
    setFilters({
      category: 'all',
      categories: [],
      minPrice: 0,
      maxPrice: 20000,
      condition: [],
      sortBy: 'featured',
      location: '',
      locationQuery: '',
    });
    goTo('/marketplace', -1);
  };

  // Sell item with initial title from empty search
  const handleSellWithTitle = (title: string) => {
    requireAuth(() => {
      setSellFormData((prev) => ({
        ...prev,
        title: title || prev.title,
      }));
      goTo('/sell');
    });
  };

  // Toggle Save Item & Persist to Supabase
  const handleToggleSave = async (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    requireAuth(async () => {
      const isCurrentlySaved = user.savedItemIds.includes(itemId);
      const updatedSavedIds = isCurrentlySaved
        ? user.savedItemIds.filter((id) => id !== itemId)
        : [...user.savedItemIds, itemId];

      setUser((prev) => ({
        ...prev,
        savedItemIds: updatedSavedIds,
      }));

      showToast(isCurrentlySaved ? 'Item removed from wishlist' : 'Item saved to your wishlist');

      if (isCurrentlySaved) {
        await removeSavedListingForUser(user.id, itemId);
      } else {
        await saveListingForUser(user.id, itemId);
      }
    });
  };

  // Native Share Item
  const handleShareItem = async (item: FurnitureItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `https://pinin.co.za/product/${item.id}`;
    const shareText = `I found this ${item.title} (R${item.price}) on PinIn. Check it out: ${shareUrl}`;

    try {
      await CapShare.share({
        title: 'Check this on PinIn',
        text: shareText,
        url: shareUrl,
        dialogTitle: 'Share via',
      });
    } catch (err: any) {
      const errStr = String(err?.message || err || '');
      if (
        errStr.includes('canceled') ||
        errStr.includes('cancelled') ||
        errStr.includes('AbortError') ||
        errStr.includes('dismissed')
      ) {
        return;
      }
      console.warn('Share note:', err);
    }
  };

  // Direct Message from Listing detail
  const handleDirectMessageFromListing = (item: FurnitureItem, messageText: string) => {
    requireAuth(() => {
      let existingConv = conversations.find(
        (c) =>
          c.itemId === item.id ||
          (item.seller?.id && (c.sellerId === item.seller.id || c.buyerId === item.seller.id || c.id.includes(item.seller.id))) ||
          (item.seller?.name && (
            (c.sellerName && c.sellerName.toLowerCase().trim() === item.seller.name.toLowerCase().trim()) ||
            (c.buyerName && c.buyerName.toLowerCase().trim() === item.seller.name.toLowerCase().trim())
          ))
      );

      const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        senderId: user.id,
        senderName: user.name,
        text: messageText,
        timestamp: formattedTime,
        date: 'Today',
        isMe: true,
        isRead: false,
      };

      if (!existingConv) {
        const newConv: ChatConversation = {
          id: `conv-${Date.now()}`,
          itemId: item.id,
          itemTitle: item.title,
          itemImage: item.imageUrl,
          itemPrice: item.price,
          sellerName: formatDisplayName(item.seller?.name || 'Seller'),
          sellerAvatar: item.seller?.avatar || DEFAULT_AVATAR_IMAGE,
          sellerId: item.seller?.id,
          buyerId: user.id,
          buyerName: user.name,
          buyerAvatar: user.avatar || DEFAULT_AVATAR_IMAGE,
          lastMessage: newMsg.text,
          lastMessageTime: formattedTime,
          unread: false,
          messages: [newMsg],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        saveConversationToDb(newConv, user.id, user.name, user.avatar);
        saveMessageToDb(newConv.id, newMsg);
        goTo(`/messages/${newConv.id}`);
      } else {
        const updatedConv: ChatConversation = {
          ...existingConv,
          messages: [...existingConv.messages, newMsg],
          lastMessage: newMsg.text,
          lastMessageTime: formattedTime,
          unread: false,
        };
        setConversations((prev) =>
          prev.map((c) => (c.id === existingConv!.id ? updatedConv : c))
        );
        setActiveConversationId(existingConv.id);
        saveConversationToDb(updatedConv, user.id, user.name, user.avatar);
        saveMessageToDb(existingConv.id, newMsg);
        goTo(`/messages/${existingConv.id}`);
      }
      showToast('Message sent to seller!');
    });
  };

  // Message Seller
  const handleMessageSeller = (item: FurnitureItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    requireAuth(() => {
      let existingConv = conversations.find(
        (c) =>
          c.itemId === item.id ||
          (item.seller?.id && (c.sellerId === item.seller.id || c.buyerId === item.seller.id || c.id.includes(item.seller.id))) ||
          (item.seller?.name && (
            (c.sellerName && c.sellerName.toLowerCase().trim() === item.seller.name.toLowerCase().trim()) ||
            (c.buyerName && c.buyerName.toLowerCase().trim() === item.seller.name.toLowerCase().trim())
          ))
      );

      if (!existingConv) {
        const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsgId = `m-${Date.now()}`;
        const newMsg: ChatMessage = {
          id: newMsgId,
          senderId: user.id,
          senderName: user.name,
          text: `Hi ${formatDisplayName(item.seller.name)}! Is the "${item.title}" in ${item.location} still available?`,
          timestamp: formattedTime,
          date: 'Today',
          isMe: true,
          isRead: false,
        };
        const newConv: ChatConversation = {
          id: `conv-${Date.now()}`,
          itemId: item.id,
          itemTitle: item.title,
          itemImage: item.imageUrl,
          itemPrice: item.price,
          sellerName: formatDisplayName(item.seller.name),
          sellerAvatar: item.seller.avatar,
          sellerId: item.seller.id,
          buyerId: user.id,
          buyerName: user.name,
          buyerAvatar: user.avatar || DEFAULT_AVATAR_IMAGE,
          collectionSuburb: item.collectionSuburb || item.location,
          collectionLat: item.collectionLat || item.latitude,
          collectionLng: item.collectionLng || item.longitude,
          lastMessage: newMsg.text,
          lastMessageTime: formattedTime,
          unread: false,
          messages: [newMsg],
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        saveConversationToDb(newConv, user.id, user.name, user.avatar);
        saveMessageToDb(newConv.id, newMsg);
        goTo(`/messages/${newConv.id}`);
      } else {
        setActiveConversationId(existingConv.id);
        goTo(`/messages/${existingConv.id}`);
      }
    });
  };

  // Send reply in chat
  const handleSendMessage = (conversationId: string, text: string) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      text,
      timestamp: formattedTime,
      date: 'Today',
      isMe: true,
      isRead: false,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          const updatedConv = {
            ...c,
            lastMessage: text,
            lastMessageTime: formattedTime,
            messages: [...c.messages, newMsg],
          };
          saveConversationToDb(updatedConv, user.id, user.name, user.avatar);
          return updatedConv;
        }
        return c;
      })
    );

    saveMessageToDb(conversationId, newMsg);
  };

  // Mark conversation messages as read
  const handleMarkConversationAsRead = useCallback(async (conversationId: string) => {
    if (!conversationId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          const updatedMessages = c.messages.map((m) =>
            m.senderId !== user.id ? { ...m, isRead: true } : m
          );
          return {
            ...c,
            unread: false,
            messages: updatedMessages,
          };
        }
        return c;
      })
    );
    await markConversationMessagesAsReadInDb(conversationId, user.id);
  }, [user.id]);

  // Block / Unblock / Clear chat
  const handleBlockUser = async (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isBlocked: true } : c))
    );
    await setConversationBlockedInDb(conversationId, true);
    showToast('User has been blocked');
  };

  const handleUnblockUser = async (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, isBlocked: false } : c))
    );
    await setConversationBlockedInDb(conversationId, false);
    showToast('User has been unblocked');
  };

  const handleClearChat = async (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, messages: [], lastMessage: 'Chat cleared' } : c
      )
    );
    await clearConversationMessagesInDb(conversationId);
    showToast('Chat history cleared');
  };

  // Start direct conversation with any user
  const handleStartNewConversationWithUser = (
    userOption: { id: string; name: string; avatar: string; location?: string },
    initialMessage?: string
  ): string => {
    const displayName = formatDisplayName(userOption.name);
    let existingConv = conversations.find(
      (c) =>
        (c.sellerId && c.sellerId === userOption.id) ||
        (c.buyerId && c.buyerId === userOption.id) ||
        (c.sellerName && c.sellerName.toLowerCase().trim() === displayName.toLowerCase().trim()) ||
        (c.buyerName && c.buyerName.toLowerCase().trim() === displayName.toLowerCase().trim()) ||
        c.id.includes(userOption.id)
    );

    if (existingConv) {
      if (initialMessage) {
        handleSendMessage(existingConv.id, initialMessage);
      }
      setActiveConversationId(existingConv.id);
      goTo(`/messages/${existingConv.id}`);
      return existingConv.id;
    }

    const newConvId = `conv-user-${userOption.id}-${Date.now()}`;
    const initialMessages: ChatMessage[] = initialMessage
      ? [
          {
            id: `m-${Date.now()}`,
            senderId: user.id,
            senderName: user.name,
            text: initialMessage,
            timestamp: 'Just now',
            date: 'Today',
            isMe: true,
            isRead: false,
          },
        ]
      : [];

    const newConv: ChatConversation = {
      id: newConvId,
      itemId: `direct-${userOption.id}`,
      itemTitle: '',
      itemImage: userOption.avatar || DEFAULT_AVATAR_IMAGE,
      itemPrice: 0,
      sellerName: displayName,
      sellerAvatar: userOption.avatar || DEFAULT_AVATAR_IMAGE,
      sellerId: userOption.id,
      buyerId: user.id,
      buyerName: user.name,
      buyerAvatar: user.avatar || DEFAULT_AVATAR_IMAGE,
      lastMessage: initialMessage || '',
      lastMessageTime: initialMessage ? 'Just now' : '',
      unread: false,
      messages: initialMessages,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConvId);
    saveConversationToDb(newConv, user.id, user.name, user.avatar);
    if (initialMessage && initialMessages[0]) {
      saveMessageToDb(newConvId, initialMessages[0]);
    }
    goTo(`/messages/${newConvId}`);
    return newConvId;
  };

  // Report Listing
  const handleReportListing = async (item: FurnitureItem, reason: string, details?: string) => {
    const reportRes = await submitListingReport(
      item,
      reason,
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      details
    );

    if (reportRes.success) {
      showToast(`Listing "${item.title}" reported for review. Thank you for keeping PinIn safe.`);
    } else {
      showToast(`Report received: "${reason}". Our team will inspect this listing.`);
    }
  };

  // Add new listing (Saved with status 'pending' until approved by admin in Supabase)
  const handleAddListing = async (
    newListing: Omit<FurnitureItem, 'id' | 'seller' | 'createdAt' | 'status'>
  ) => {
    const newItemId = generateValidUUID();
    const newItem: FurnitureItem = {
      ...newListing,
      id: newItemId,
      status: 'pending',
      seller: {
        id: user.id || 'seller_current',
        name: user.name || 'Anonymous Seller',
        avatar: user.avatar,
        rating: 5.0,
        reviewCount: 0,
        joinedDate: user.joinedDate || 'Member',
        responseRate: '100%',
      },
      postedAt: 'Just now',
    };

    // Add to user's private listings so they can track it in their Account page under "Under Review"
    setUserOwnListings((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
    // NOTE: Do NOT add to furnitureList (public home feed)! The listing must be approved in Supabase first.

    setUser((prev) => ({
      ...prev,
      listedItemsCount: prev.listedItemsCount + 1,
    }));

    const notif = createSubmittedNotification(newItem.title, newItem.id);
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      if (user.id) {
        saveStoredNotifications(user.id, updated);
      }
      return updated;
    });

    try {
      const res = await insertListing(newItem);
      if (!res.success) {
        console.warn('Listing Supabase sync note:', res.error);
      }
    } catch (err) {
      console.warn('Listing Supabase sync note:', err);
    }

    // Direct to Home page & trigger review popup alert
    setSubmittedListingTitle(newItem.title);
    setShowPostReviewPopup(true);
    setTimeout(() => {
      setShowPostReviewPopup(false);
    }, 4000);

    goTo('/', -1);
  };

  // Delete listing from user's account & Supabase
  const handleDeleteListing = async (listingId: string) => {
    setUserOwnListings((prev) => prev.filter((item) => item.id !== listingId));
    setFurnitureList((prev) => prev.filter((item) => item.id !== listingId));
    setUser((prev) => ({
      ...prev,
      savedItemIds: prev.savedItemIds.filter((id) => id !== listingId),
      listedItemsCount: Math.max(0, prev.listedItemsCount - 1),
    }));

    await deleteListingFromDb(listingId);
    showToast('Listing deleted successfully');
  };

  // Native Share listing from user's account
  const handleShareListing = async (item: FurnitureItem) => {
    const shareUrl = `https://pinin.co.za/product/${item.id}`;
    const shareText = `I found this ${item.title} (R${item.price}) on PinIn. Check it out: ${shareUrl}`;

    try {
      await CapShare.share({
        title: 'Check this on PinIn',
        text: shareText,
        url: shareUrl,
        dialogTitle: 'Share via',
      });
    } catch (err: any) {
      const errStr = String(err?.message || err || '');
      if (
        errStr.includes('canceled') ||
        errStr.includes('cancelled') ||
        errStr.includes('AbortError') ||
        errStr.includes('dismissed')
      ) {
        return;
      }
      console.warn('Share note:', err);
    }
  };

  // Permanent Delete Account
  const handleDeleteAccount = async () => {
    try {
      if (user.id && user.id !== 'user_default_id') {
        await supabase.from('saved_listings').delete().eq('user_id', user.id);
        await supabase.from('listings').delete().eq('seller_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Account deletion note:', err);
    }

    setUser({
      id: 'guest_deleted',
      name: 'Guest',
      surname: 'User',
      bio: 'New user on PinIn',
      email: '',
      avatar: DEFAULT_AVATAR_IMAGE,
      phone: '',
      location: 'Gauteng',
      savedItemIds: [],
      listedItemsCount: 0,
      joinedDate: 'Just now',
      isLoggedIn: false,
    });
    goTo('/', -1);
    showToast('Your account and listings have been permanently deleted');
  };

  // Update bio & location
  const handleUpdateBio = async (newBio: string, newLocation?: string) => {
    const updatedLocation = newLocation || user.location;
    setUser((prev) => ({
      ...prev,
      bio: newBio,
      location: updatedLocation,
    }));
    showToast('Profile details updated');

    if (user.id && user.isLoggedIn) {
      await upsertUserProfile({
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        location: updatedLocation,
        bio: newBio,
      });
    }
  };

  // Full Profile & Bio Update
  const handleSaveProfileData = async (updatedData: {
    name: string;
    surname?: string;
    bio?: string;
    location?: string;
    phone?: string;
    avatar?: string;
  }) => {
    setUser((prev) => ({
      ...prev,
      ...updatedData,
      isProfileUpdated: true,
      profileCompleted: true,
    }));
    showToast('Profile & bio updated successfully');

    if (user.id) {
      markUserProfileUpdated(user.id);
    }

    if (user.id && user.isLoggedIn) {
      await upsertUserProfile({
        id: user.id,
        name: updatedData.name,
        surname: updatedData.surname || '',
        email: user.email,
        avatar: updatedData.avatar || user.avatar,
        phone: updatedData.phone || user.phone,
        location: updatedData.location || user.location,
        bio: updatedData.bio || '',
      });
    }

    const searchParams = new URLSearchParams(location.search);
    const isFromSell = searchParams.get('from') === 'sell' || editProfileSource === 'sell';
    if (isFromSell) {
      setEditProfileSource(null);
      goTo('/sell', -1);
    } else {
      goTo('/account', -1);
    }
  };

  // Auth handlers
  const handleOpenAuth = (mode: 'signin' | 'register' = 'signin') => {
    setAuthMode(mode);
    goTo(`/auth?mode=${mode}`);
  };

  const handleAuthSuccess = (authenticatedUser: UserAccount) => {
    setUser(authenticatedUser);
    if (authenticatedUser.id) {
      loginUserToOneSignal(authenticatedUser.id, authenticatedUser.email, authenticatedUser.name);
    }
    goTo('/', -1);
    showToast(
      authenticatedUser.name
        ? `Welcome to PinIn, ${authenticatedUser.name}!`
        : 'Signed in successfully!'
    );
  };

  // Toggle Auth / Sign out
  const handleToggleAuth = async () => {
    if (user.isLoggedIn) {
      logoutUserFromOneSignal();
      try {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
      } catch {}
      try {
        await supabase.auth.signOut();
      } catch {}
      setUser(INITIAL_USER);
      showToast('Signed out of PinIn');
    } else {
      handleOpenAuth('signin');
    }
  };

  // Filtered & Sorted Furniture items (with km distance & <50km proximity prioritization)
  const { filteredFurniture, nearbyListingsCount } = useMemo(() => {
    const enrichedList = furnitureList.map((item) => {
      if (hasLocationPermission && userCoords) {
        let itemLat = item.latitude;
        let itemLng = item.longitude;

        if (itemLat === undefined || itemLng === undefined) {
          const derived = getCoordinatesForLocation(item.location);
          if (derived) {
            itemLat = derived.lat;
            itemLng = derived.lng;
          }
        }

        if (typeof itemLat === 'number' && typeof itemLng === 'number') {
          const distKm = calculateDistanceKm(userCoords.lat, userCoords.lng, itemLat, itemLng);
          return {
            ...item,
            distanceKm: distKm,
            distanceText: formatDistanceKm(distKm),
          };
        }
      }

      return {
        ...item,
        distanceKm: undefined,
        distanceText: undefined,
      };
    });

    const filtered = enrichedList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesBrand = item.brand?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesDesc && !matchesBrand) {
          return false;
        }
      }

      if (!matchFurnitureWithCategories(item, filters.categories, filters.category)) {
        return false;
      }

      if (filters.location && filters.location.trim()) {
        const selectedLocs = filters.location
          .split(',')
          .map((l) => l.replace(/\(gauteng\)/i, '').trim().toLowerCase())
          .filter(Boolean);

        if (selectedLocs.length > 0) {
          const itemLoc = item.location.toLowerCase();
          const matchesAny = selectedLocs.some((loc) => itemLoc.includes(loc) || loc.includes(itemLoc));
          if (!matchesAny) {
            return false;
          }
        }
      }

      if (
        filters.locationQuery.trim() &&
        !item.location.toLowerCase().includes(filters.locationQuery.toLowerCase())
      ) {
        return false;
      }

      if (item.price < filters.minPrice) return false;
      if (filters.maxPrice && filters.maxPrice > 0 && item.price > filters.maxPrice) return false;

      if (filters.condition.length > 0 && !filters.condition.includes(item.condition)) {
        return false;
      }

      return true;
    });

    const nearbyCount = filtered.filter(
      (item) => item.distanceKm !== undefined && item.distanceKm <= 50
    ).length;

    if (hasLocationPermission && userCoords) {
      const nearbyItems = filtered
        .filter((item) => item.distanceKm !== undefined && item.distanceKm <= 50)
        .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

      const otherItems = filtered
        .filter((item) => item.distanceKm === undefined || item.distanceKm > 50)
        .sort((a, b) => {
          if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
            return a.distanceKm - b.distanceKm;
          }
          if (filters.sortBy === 'price-asc') return a.price - b.price;
          if (filters.sortBy === 'price-desc') return b.price - a.price;
          if (filters.sortBy === 'newest') return b.id.localeCompare(a.id);
          return 0;
        });

      return {
        filteredFurniture: [...nearbyItems, ...otherItems],
        nearbyListingsCount: nearbyCount,
      };
    }

    const sorted = [...filtered].sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'newest') return b.id.localeCompare(a.id);
      return 0;
    });

    return {
      filteredFurniture: sorted,
      nearbyListingsCount: 0,
    };
  }, [furnitureList, searchQuery, filters, hasLocationPermission, userCoords]);

  // Active filter count for badge
  const appliedFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.categories && filters.categories.length > 0) {
      count += filters.categories.length;
    } else if (filters.category && filters.category !== 'all') {
      count += 1;
    }
    if (filters.maxPrice && filters.maxPrice < 20000 && filters.maxPrice > 0) count += 1;
    if (filters.condition && filters.condition.length > 0) count += 1;
    if (filters.location && filters.location.trim()) count += 1;
    return count;
  }, [filters]);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === filters.category);
  const activeCategoryDisplayName = useMemo(() => {
    if (filters.categories && filters.categories.length > 0) {
      if (filters.categories.length === 1) {
        return filters.categories[0].split('/')[0].trim();
      }
      return `${filters.categories.length} Categories`;
    }
    if (filters.category && filters.category !== 'all') {
      return activeCategoryObj?.name || filters.category.split('/')[0].trim();
    }
    return undefined;
  }, [filters.categories, filters.category, activeCategoryObj]);
  const [messagesBadgeCleared, setMessagesBadgeCleared] = useState(false);

  const unreadMessagesCount = useMemo(() => {
    // If not logged in, guest, or badge manually cleared, return 0
    if (!user.isLoggedIn || !user.id || user.id === 'guest' || messagesBadgeCleared) return 0;

    // If currently viewing messages page or in a chat room, clear badge
    if (location.pathname === '/' || location.pathname === '/messages' || location.pathname.startsWith('/messages/')) {
      return 0;
    }

    return conversations.filter((c) => {
      // Must be a conversation involving the current user
      const isMyConv =
        (c.buyerId && c.buyerId === user.id) ||
        (c.sellerId && c.sellerId === user.id) ||
        (user.name && c.sellerName && c.sellerName.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
        (user.name && c.buyerName && c.buyerName.trim().toLowerCase() === user.name.trim().toLowerCase());

      if (!isMyConv) return false;

      if (c.messages && c.messages.length > 0) {
        const lastMsg = c.messages[c.messages.length - 1];
        // If the last message was sent by me, it's not unread for me
        const isFromMe = lastMsg.isMe || lastMsg.senderId === user.id;
        if (isFromMe) return false;

        const isUnread = (lastMsg as any).isRead === false || (lastMsg as any).is_read === false;
        return isUnread;
      }
      return false;
    }).length;
  }, [conversations, messagesBadgeCleared, user.id, user.isLoggedIn, user.name, location.pathname]);

  const unreadNotificationsCount = useMemo(() => {
    if (!user.isLoggedIn || !user.id || user.id === 'guest') return 0;
    return notifications.filter(
      (n) => !n.read && ['system', 'listing_submitted', 'listing_approved', 'listing_rejected'].includes(n.type)
    ).length;
  }, [notifications, user.isLoggedIn, user.id]);

  const savedFurnitureList = useMemo(() => {
    return furnitureList.filter((item) => user.savedItemIds.includes(item.id));
  }, [furnitureList, user.savedItemIds]);

  const userListings = useMemo(() => {
    const listMap = new Map<string, FurnitureItem>();
    userOwnListings
      .filter((item) => item.status !== 'rejected')
      .forEach((item) => listMap.set(item.id, item));
    furnitureList
      .filter((item) => (item.seller.id === user.id || item.seller.name === user.name) && item.status !== 'rejected')
      .forEach((item) => listMap.set(item.id, item));
    return Array.from(listMap.values());
  }, [furnitureList, userOwnListings, user]);

  const allAppUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; avatar: string; location?: string; role?: string }>();

    // 1. Only registered and active users from Supabase profiles
    registeredUsers.forEach((u) => {
      if (u.id !== user.id && (!user.email || u.email !== user.email)) {
        const lowerName = u.name.toLowerCase();
        if (!lowerName.includes('marcus') && !lowerName.includes('gray')) {
          userMap.set(u.id, {
            id: u.id,
            name: formatDisplayName(u.name),
            avatar: u.avatar || DEFAULT_AVATAR_IMAGE,
            location: u.location || 'Gauteng',
            role: u.role || 'Member',
          });
        }
      }
    });

    return Array.from(userMap.values());
  }, [registeredUsers, user.id, user.email]);

  // Active tab determination for BottomNav
  const currentTab = useMemo(() => {
    if (location.pathname.startsWith('/messages')) return 'messages';
    if (location.pathname.startsWith('/notifications')) return 'notifications';
    return 'marketplace';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 selection:bg-[#2D8EDE]/20 selection:text-[#2D8EDE] relative overflow-x-hidden">
      {/* Toast Feedback */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Pop-up Alert when Listing is Posted ("Submitted for Review") */}
      {showPostReviewPopup && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-xs sm:max-w-sm w-full text-center shadow-2xl border-2 border-blue-200 flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mb-3.5 ring-8 ring-blue-50/50">
              <svg className="w-8 h-8 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2D8EDE] text-[10px] font-extrabold tracking-wider uppercase mb-1.5">
              Submission Received
            </span>
            <h3 className="text-lg font-black text-gray-900 leading-tight mb-2">
              Listing Submitted for Review!
            </h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
              "{submittedListingTitle || 'Your item'}" has been submitted for review! Your listing is under moderation and will appear publicly on PinIn once approved.
            </p>
            <button
              type="button"
              onClick={() => setShowPostReviewPopup(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 mb-3 cursor-pointer"
            >
              Got it
            </button>
            {/* 4s countdown indicator */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2D8EDE] h-full rounded-full"
                style={{
                  animation: 'shrinkWidth 4s linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Offline Internet Banner (Top small 30px grey banner) */}
      <InternetBanner isOnline={isOnline} />

      {/* Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        onOpenAuth={(mode) => {
          setIsMenuOpen(false);
          handleOpenAuth(mode);
        }}
        onToggleAuth={() => {
          setIsMenuOpen(false);
          handleToggleAuth();
        }}
        onOpenSell={() => {
          setIsMenuOpen(false);
          requireAuth(() => goTo('/sell'));
        }}
        onOpenAccount={() => {
          setIsMenuOpen(false);
          requireAuth(() => goTo('/account'));
        }}
        onOpenSavedItems={() => {
          setIsMenuOpen(false);
          requireAuth(() => goTo('/saved'));
        }}
        onOpenPrivacyPolicy={() => {
          setIsMenuOpen(false);
          goTo('/privacy');
        }}
        onOpenContactUs={() => {
          setIsMenuOpen(false);
          goTo('/contact');
        }}
      />

      {/* Framer Motion Animated Routes */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
          className="w-full h-[100dvh] bg-white fixed inset-0 overflow-hidden"
        >
          <Routes location={location}>
            {/* 1. Initial screen: Messages Page directly as first screen in navigation config (no redirect, no flash) */}
            <Route
              path="/messages"
              element={
                <MessagesListView
                  conversations={conversations}
                  allUsers={allAppUsers}
                  user={user}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                  onClose={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                      setDirection(-1);
                      navigate(-1);
                    } else {
                      goTo('/marketplace', -1);
                    }
                  }}
                  onSendMessage={handleSendMessage}
                  onBlockUser={handleBlockUser}
                  onUnblockUser={handleUnblockUser}
                  onClearChat={handleClearChat}
                  onStartNewConversationWithUser={handleStartNewConversationWithUser}
                  onSelectConversation={(convId) => {
                    if (convId) {
                      goTo(`/messages/${convId}`, 1);
                    }
                  }}
                  onOpenNotifications={() => goTo('/notifications', 1)}
                  onOpenSearchPage={() => goTo('/search?type=messages')}
                  onOpenHome={handleGoHome}
                  onOpenAccount={() => requireAuth(() => goTo('/account'))}
                  onClearBadgeCount={() => setMessagesBadgeCleared(true)}
                  onOpenMenu={() => setIsMenuOpen(true)}
                  onOpenUserProfile={handleOpenUserProfile}
                />
              }
            />
            <Route
              path="/"
              element={
                <MessagesListView
                  conversations={conversations}
                  allUsers={allAppUsers}
                  user={user}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                  onClose={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                      setDirection(-1);
                      navigate(-1);
                    } else {
                      goTo('/marketplace', -1);
                    }
                  }}
                  onSendMessage={handleSendMessage}
                  onBlockUser={handleBlockUser}
                  onUnblockUser={handleUnblockUser}
                  onClearChat={handleClearChat}
                  onStartNewConversationWithUser={handleStartNewConversationWithUser}
                  onSelectConversation={(convId) => {
                    if (convId) {
                      goTo(`/messages/${convId}`, 1);
                    }
                  }}
                  onOpenNotifications={() => goTo('/notifications', 1)}
                  onOpenSearchPage={() => goTo('/search?type=messages')}
                  onOpenHome={handleGoHome}
                  onOpenAccount={() => requireAuth(() => goTo('/account'))}
                  onClearBadgeCount={() => setMessagesBadgeCleared(true)}
                  onOpenMenu={() => setIsMenuOpen(true)}
                  onOpenUserProfile={handleOpenUserProfile}
                />
              }
            />
            <Route path="/home" element={<Navigate to="/marketplace" replace />} />

            {/* 2. Home Marketplace Feed */}
            <Route
              path="/marketplace"
              element={
                <div className="h-[100dvh] max-h-[100dvh] flex flex-col font-sans text-gray-900 bg-white overflow-hidden">
                  {/* Pinned Top Header & Controls */}
                  <div className="shrink-0 z-30 bg-white border-b border-gray-200 shadow-2xs">
                    {/* Top Header: 1 = 3 bars, 2 = app name */}
                    <Header
                      onOpenMenu={() => setIsMenuOpen(true)}
                      onGoHome={handleGoHome}
                      user={user}
                      onOpenAuth={handleOpenAuth}
                      onOpenAccount={() => requireAuth(() => goTo('/account'))}
                    />

                    {/* 3 = Search */}
                    <HeroSearch
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      onClearSearch={() => setSearchQuery('')}
                      hasLocationPermission={hasLocationPermission}
                      isLocating={isLocatingUser}
                      onRequestLocation={() => handleRequestUserLocation(false)}
                      onDisableLocation={handleDisableLocation}
                      nearbyCount={nearbyListingsCount}
                      onOpenSearchPage={() => goTo('/search?type=furniture')}
                    />

                    {/* 4 = + sell, 5 = categories, 6 = filters */}
                    <ActionNav
                      onOpenSell={() => requireAuth(() => goTo('/sell'))}
                      onOpenCategories={() => goTo('/categories')}
                      onOpenFilters={() => goTo('/filters')}
                      activeCategoryName={activeCategoryDisplayName}
                      activeFilterCount={appliedFiltersCount}
                    />

                    {/* Active Filter Indicators */}
                    {((filters.categories && filters.categories.length > 0) || filters.category !== 'all' || (filters.location && filters.location.trim()) || filters.locationQuery || filters.condition.length > 0 || searchQuery) && (
                      <div className="max-w-md mx-auto w-full px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs bg-gray-50/80 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {filters.categories && filters.categories.length > 0 ? (
                            filters.categories.map((cat) => (
                              <span
                                key={cat}
                                className="bg-blue-100 text-[#2D8EDE] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                              >
                                <span className="capitalize">{cat.split('/')[0].trim()}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const remaining = filters.categories!.filter((c) => c !== cat);
                                    setFilters({
                                      ...filters,
                                      categories: remaining,
                                      category: remaining.length === 0 ? 'all' : remaining.length === 1 ? remaining[0] : remaining.join(', '),
                                    });
                                  }}
                                  className="hover:text-blue-800 font-bold ml-0.5 cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : filters.category !== 'all' ? (
                            <span className="bg-blue-100 text-[#2D8EDE] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <span className="capitalize">{activeCategoryObj?.name || filters.category}</span>
                              <button
                                type="button"
                                onClick={() => setFilters({ ...filters, category: 'all', categories: [] })}
                                className="hover:text-blue-800 font-bold ml-0.5 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ) : null}
                          {filters.location && filters.location.trim() && (
                            <span className="bg-blue-50 text-[#2D8EDE] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 shrink-0">
                              📍 <span className="truncate max-w-[120px]">{filters.location.replace(/\(Gauteng\)/gi, '')}</span>
                              <button
                                type="button"
                                onClick={() => setFilters({ ...filters, location: '' })}
                                className="hover:text-red-500 font-bold ml-0.5 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          )}
                          {filters.locationQuery && (
                            <span className="bg-gray-200 text-gray-800 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              📍 {filters.locationQuery}
                              <button
                                type="button"
                                onClick={() => setFilters({ ...filters, locationQuery: '' })}
                                className="hover:text-black font-bold ml-0.5 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleGoHome}
                          className="text-xs text-[#2D8EDE] hover:underline font-bold shrink-0 ml-auto cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scrollable Center Content Area */}
                  <main id="home-main-scroll" className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-white flex flex-col">
                    <div className="flex-1 flex flex-col justify-between min-h-full">
                      <div className="flex-1">
                        <FurnitureGrid
                          items={filteredFurniture}
                          savedItemIds={user.savedItemIds}
                          onSelectItem={(item) => {
                            setSelectedItem(item);
                            goTo(`/item/${item.id}`);
                          }}
                          onToggleSave={handleToggleSave}
                          onShareItem={handleShareItem}
                          onMessageSeller={handleMessageSeller}
                          onResetFilters={handleGoHome}
                          showDistance={hasLocationPermission && !!userCoords}
                        />
                      </div>

                      {/* Footer containing quick links */}
                      <DesktopFooter
                        onOpenPrivacyPolicy={() => goTo('/privacy')}
                        onOpenContactUs={() => goTo('/contact')}
                      />
                    </div>
                  </main>

                  {/* Pinned Bottom Navigation Dock */}
                  <footer className="shrink-0 z-30 bg-white border-t border-gray-200 shadow-lg">
                    <BottomNav
                      activeTab={currentTab}
                      onNavigate={(tab) => {
                        if (tab === 'search' || tab === 'marketplace') {
                          handleGoHome();
                        } else if (tab === 'sell') {
                          requireAuth(() => goTo('/sell'));
                        } else if (tab === 'messages') {
                          goTo('/messages');
                        } else if (tab === 'notifications') {
                          handleOpenNotifications();
                        } else if (tab === 'account' || tab === 'profile') {
                          requireAuth(() => goTo('/account'));
                        }
                      }}
                      unreadMessagesCount={unreadMessagesCount}
                      unreadNotificationsCount={unreadNotificationsCount}
                    />
                  </footer>
                </div>
              }
            />

            {/* 2. Item Inspection Detail Route */}
            <Route
              path="/item/:id"
              element={
                <ListingDetailView
                  selectedItem={selectedItem}
                  furnitureList={furnitureList}
                  userOwnListings={userOwnListings}
                  savedItemIds={user.savedItemIds}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                  onToggleSave={(itemId, e) => handleToggleSave(itemId, e)}
                  onSendMessageToSeller={handleDirectMessageFromListing}
                  onShare={handleShareItem}
                  onReport={handleReportListing}
                  onOpenSearch={() => goTo('/search?type=furniture')}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenNotifications={() => goTo('/notifications')}
                  user={user}
                  onOpenAuth={handleOpenAuth}
                  onOpenUserProfile={handleOpenUserProfile}
                  onClose={() => {
                    setDirection(-1);
                    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
                      navigate(-1);
                    } else if (window.history.length > 1 && location.pathname !== '/marketplace' && location.pathname !== '/') {
                      navigate(-1);
                    } else {
                      navigate('/marketplace');
                    }
                  }}
                />
              }
            />

            {/* 3. Sell / List Furniture Page */}
            <Route
              path="/sell"
              element={
                <SellPage
                  isOpen={true}
                  onClose={() => {
                    setIsMenuOpen(false);
                    if (location.search.includes('from=account')) {
                      goTo('/account', -1);
                    } else {
                      goTo('/', -1);
                    }
                  }}
                  onAddListing={(item) => {
                    handleAddListing(item);
                    setSellFormData({
                      ...initialSellFormData,
                      location: user.location || 'Sandton (Gauteng)',
                    });
                  }}
                  onDiscardListing={() => {
                    setSellFormData({
                      ...initialSellFormData,
                      location: user.location || 'Sandton (Gauteng)',
                    });
                  }}
                  onOpenEditProfile={() => {
                    setEditProfileSource('sell');
                    goTo('/edit-profile?from=sell');
                  }}
                  user={user}
                  onOpenAuth={handleOpenAuth}
                  formData={sellFormData}
                  onUpdateFormData={setSellFormData}
                  onOpenCategories={() => {
                    const fromAcc = location.search.includes('from=account') ? '&origin=account' : '';
                    goTo(`/categories?from=sell${fromAcc}`);
                  }}
                  onOpenLocation={() => {
                    const fromAcc = location.search.includes('from=account') ? '&origin=account' : '';
                    goTo(`/location?from=sell${fromAcc}`);
                  }}
                />
              }
            />

            {/* 4. Categories Page */}
            <Route
              path="/categories"
              element={
                <CategoriesPage
                  isOpen={true}
                  fromSell={location.search.includes('from=sell')}
                  onClose={() => {
                    if (location.search.includes('from=sell')) {
                      const origin = location.search.includes('origin=account') ? '?from=account' : '';
                      goTo(`/sell${origin}`, -1);
                    } else if (location.search.includes('from=filters')) {
                      goTo('/filters', -1);
                    } else {
                      goTo('/', -1);
                    }
                  }}
                  selectedCategory={
                    location.search.includes('from=sell')
                      ? sellFormData.categoryLabel || sellFormData.category
                      : filters.category
                  }
                  selectedCategories={
                    location.search.includes('from=sell')
                      ? sellFormData.categoryLabel ? [sellFormData.categoryLabel] : []
                      : filters.categories && filters.categories.length > 0
                      ? filters.categories
                      : filters.category !== 'all'
                      ? filters.category.split(',').map((s) => s.trim()).filter(Boolean)
                      : []
                  }
                  onSelectCategory={(groupId, subItem, allSelected) => {
                    if (location.search.includes('from=sell')) {
                      const catLabel = subItem ? subItem.split('/')[0].trim() : groupId;
                      let mappedCat = groupId;
                      if (groupId === 'living-room-dining') mappedCat = 'sofas';
                      else if (groupId === 'kitchen') mappedCat = 'storage';
                      else if (groupId === 'bedroom') mappedCat = 'beds';
                      else if (groupId === 'others') mappedCat = 'decor';

                      setSellFormData((prev) => ({
                        ...prev,
                        category: mappedCat,
                        categoryLabel: catLabel,
                      }));
                      showToast(`Category selected: ${catLabel}`);
                      const origin = location.search.includes('origin=account') ? '?from=account' : '';
                      goTo(`/sell${origin}`, -1);
                    } else if (location.search.includes('from=filters')) {
                      const chosenList = allSelected && allSelected.length > 0 ? allSelected : subItem ? [subItem] : [];
                      setFilters((prev) => ({
                        ...prev,
                        categories: chosenList,
                        category: chosenList.length === 0 ? 'all' : chosenList.join(', '),
                      }));
                      if (chosenList.length === 1) {
                        showToast(`Category set: ${chosenList[0].split('/')[0].trim()}`);
                      } else if (chosenList.length > 1) {
                        showToast(`${chosenList.length} categories selected`);
                      } else {
                        showToast('Categories cleared');
                      }
                      goTo('/filters', -1);
                    } else {
                      const chosenList = allSelected && allSelected.length > 0 ? allSelected : subItem ? [subItem] : [];
                      if (chosenList.length === 0) {
                        setFilters((prev) => ({ ...prev, category: 'all', categories: [] }));
                        showToast('Showing all categories');
                      } else if (chosenList.length === 1) {
                        const cleanKeyword = chosenList[0].split('/')[0].trim();
                        setFilters((prev) => ({
                          ...prev,
                          categories: chosenList,
                          category: chosenList[0],
                        }));
                        showToast(`Filtering by "${cleanKeyword}"`);
                      } else {
                        setFilters((prev) => ({
                          ...prev,
                          categories: chosenList,
                          category: chosenList.join(', '),
                        }));
                        showToast(`Filtering by ${chosenList.length} categories`);
                      }
                      goTo('/results');
                    }
                  }}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenNotifications={handleOpenNotifications}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                />
              }
            />

            {/* 5. Filters Page */}
            <Route
              path="/filters"
              element={
                <FiltersPage
                  isOpen={true}
                  onClose={() => goTo('/', -1)}
                  filters={filters}
                  onApplyFilters={(newFilters) => {
                    setFilters(newFilters);
                    goTo('/results');
                  }}
                  onResetFilters={() => {
                    setFilters({
                      category: 'all',
                      minPrice: 0,
                      maxPrice: 20000,
                      condition: [],
                      sortBy: 'featured',
                      location: '',
                      locationQuery: '',
                    });
                    showToast('Filters cleared');
                  }}
                  onOpenCategoriesPage={() => goTo('/categories?from=filters')}
                  onOpenLocationPage={() => goTo('/location?from=filters')}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenNotifications={handleOpenNotifications}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                />
              }
            />

            {/* 6. Location Page */}
            <Route
              path="/location"
              element={
                <LocationPage
                  isOpen={true}
                  fromSell={location.search.includes('from=sell')}
                  onClose={() => {
                    if (location.search.includes('from=sell')) {
                      const origin = location.search.includes('origin=account') ? '?from=account' : '';
                      goTo(`/sell${origin}`, -1);
                    } else if (location.search.includes('from=filters')) {
                      goTo('/filters', -1);
                    } else {
                      goTo('/filters', -1);
                    }
                  }}
                  selectedLocation={
                    location.search.includes('from=sell')
                      ? sellFormData.location
                      : filters.location || ''
                  }
                  onSelectLocation={(loc) => {
                    if (location.search.includes('from=sell')) {
                      const cleanLoc = loc.trim() || 'Sandton (Gauteng)';
                      const cleanSuburb = cleanLoc.replace(/\s*\(Gauteng\)\s*/i, '').trim();
                      const coords = getCoordinatesForLocation(cleanSuburb || cleanLoc);
                      setSellFormData((prev) => ({
                        ...prev,
                        location: cleanLoc,
                        collectionSuburb: cleanSuburb || cleanLoc,
                        collectionLat: coords.lat,
                        collectionLng: coords.lng,
                      }));
                      if (loc) {
                        showToast(`Location set to ${cleanLoc}`);
                      }
                      const origin = location.search.includes('origin=account') ? '?from=account' : '';
                      goTo(`/sell${origin}`, -1);
                    } else {
                      setFilters((prev) => ({ ...prev, location: loc }));
                      if (loc) {
                        showToast(`Location set to ${loc}`);
                      }
                      if (location.search.includes('from=filters')) {
                        goTo('/filters', -1);
                      } else {
                        goTo('/filters', -1);
                      }
                    }
                  }}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenNotifications={handleOpenNotifications}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                />
              }
            />

            {/* 7. Filter Results Page */}
            <Route
              path="/results"
              element={
                <FilterResultsPage
                  isOpen={true}
                  onClose={() => goBack('/')}
                  onEditFilters={() => goTo('/filters')}
                  items={filteredFurniture}
                  filters={filters}
                  appliedCount={appliedFiltersCount}
                  onSelectItem={(item) => {
                    setSelectedItem(item);
                    goTo(`/item/${item.id}`);
                  }}
                  savedItemIds={user.savedItemIds}
                  onToggleSave={handleToggleSave}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenNotifications={handleOpenNotifications}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                  onOpenSell={() => requireAuth(() => goTo('/sell'))}
                />
              }
            />

            {/* 7b. Dedicated Mobile Search Page */}
            <Route
              path="/search"
              element={
                <SearchPageView
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  furnitureList={furnitureList}
                  savedItemIds={user.savedItemIds}
                  conversations={conversations}
                  allUsers={allAppUsers}
                  currentUser={user}
                  onClose={() => goBack('/')}
                  onSelectItem={(item) => {
                    setSelectedItem(item);
                    goTo(`/item/${item.id}`);
                  }}
                  onToggleSave={handleToggleSave}
                  onViewAllResults={() => goTo('/results')}
                  onSelectUserForChat={(targetUser) => {
                    requireAuth(() => {
                      const existing = conversations.find(
                        (c) =>
                          c.sellerName.toLowerCase() === targetUser.name.toLowerCase() ||
                          c.sellerAvatar === targetUser.avatar ||
                          c.id.includes(targetUser.id)
                      );
                      if (existing) {
                        goTo(`/messages/${existing.id}`);
                      } else {
                        const newId = handleStartNewConversationWithUser(targetUser);
                        goTo(`/messages/${newId}`);
                      }
                    });
                  }}
                  onRequireAuth={() => requireAuth(() => {})}
                  onSellItemWithTitle={handleSellWithTitle}
                />
              }
            />

            {/* 8. Chat Box Page */}
            <Route
              path="/messages/:id"
              element={
                <ChatBoxView
                  conversations={conversations}
                  allUsers={allAppUsers}
                  user={user}
                  unreadMessagesCount={unreadMessagesCount}
                  onClose={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                      setDirection(-1);
                      navigate(-1);
                    } else {
                      goTo('/messages', -1);
                    }
                  }}
                  onSendMessage={handleSendMessage}
                  onBlockUser={handleBlockUser}
                  onUnblockUser={handleUnblockUser}
                  onClearChat={handleClearChat}
                  onMarkAsRead={handleMarkConversationAsRead}
                  onGoToMessages={() => goTo('/messages', -1)}
                  onOpenUserProfile={handleOpenUserProfile}
                />
              }
            />

            {/* 8b. User Profile Routes */}
            <Route
              path="/user/:id"
              element={
                <UserProfileRouteView
                  currentUser={user}
                  onClose={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                      setDirection(-1);
                      navigate(-1);
                    } else {
                      goTo('/messages', -1);
                    }
                  }}
                  onMessageUser={(target) => {
                    requireAuth(() => {
                      const convId = handleStartNewConversationWithUser(target);
                      goTo(`/messages/${convId}`, 1);
                    });
                  }}
                  selectedProfile={selectedUserProfile}
                  onRequireAuth={() => handleOpenAuth('signin')}
                />
              }
            />
            <Route
              path="/profile/:id"
              element={
                <UserProfileRouteView
                  currentUser={user}
                  onClose={() => {
                    if (window.history.state && window.history.state.idx > 0) {
                      setDirection(-1);
                      navigate(-1);
                    } else {
                      goTo('/messages', -1);
                    }
                  }}
                  onMessageUser={(target) => {
                    requireAuth(() => {
                      const convId = handleStartNewConversationWithUser(target);
                      goTo(`/messages/${convId}`, 1);
                    });
                  }}
                  selectedProfile={selectedUserProfile}
                  onRequireAuth={() => handleOpenAuth('signin')}
                />
              }
            />

            {/* 9. Notifications Page */}
            <Route
              path="/notifications"
              element={
                <NotificationsPage
                  isOpen={true}
                  onClose={() => goBack('/marketplace')}
                  notifications={notifications}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onDeleteNotification={handleDeleteNotification}
                  onOpenSearch={handleGoHome}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenAccount={() => requireAuth(() => goTo('/account'))}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                  isLoggedIn={Boolean(user.isLoggedIn && user.id && user.id !== 'guest')}
                />
              }
            />

            {/* 10. Account Page */}
            <Route
              path="/account"
              element={
                <AccountPage
                  isOpen={true}
                  onClose={() => goBack('/')}
                  user={user}
                  userListings={userListings}
                  onDeleteListing={handleDeleteListing}
                  onShareListing={handleShareListing}
                  onDeleteAccount={handleDeleteAccount}
                  onOpenDeleteAccount={() => goTo('/delete-account')}
                  onOpenEditProfile={() => goTo('/edit-profile')}
                  onUpdateBio={handleUpdateBio}
                  onOpenSell={() => goTo('/sell')}
                  onSelectItem={(item) => {
                    setSelectedItem(item);
                    goTo(`/item/${item.id}`);
                  }}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenNotifications={handleOpenNotifications}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                />
              }
            />

            {/* 10b. Edit Profile & Bio Page */}
            <Route
              path="/edit-profile"
              element={
                <EditProfilePage
                  isOpen={true}
                  onClose={() => {
                    const searchParams = new URLSearchParams(location.search);
                    if (searchParams.get('from') === 'sell' || editProfileSource === 'sell') {
                      setEditProfileSource(null);
                      goBack('/sell');
                    } else {
                      goBack('/account');
                    }
                  }}
                  user={user}
                  onSaveProfile={handleSaveProfileData}
                />
              }
            />

            {/* 11. Delete Account Page */}
            <Route
              path="/delete-account"
              element={
                <DeleteAccountPage
                  isOpen={true}
                  onClose={() => goBack('/account')}
                  user={user}
                  onConfirmDeleteAccount={handleDeleteAccount}
                />
              }
            />

            {/* 12. Saved Items Page */}
            <Route
              path="/saved"
              element={
                <SavedItemsPage
                  isOpen={true}
                  onClose={() => goBack('/')}
                  savedItems={savedFurnitureList}
                  onSelectItem={(item) => {
                    setSelectedItem(item);
                    goTo(`/item/${item.id}`);
                  }}
                  onRemoveSaved={handleToggleSave}
                  onOpenSearch={handleGoHome}
                  onOpenMessages={() => goTo('/messages')}
                  onOpenNotifications={handleOpenNotifications}
                  unreadMessagesCount={unreadMessagesCount}
                  unreadNotificationsCount={unreadNotificationsCount}
                />
              }
            />

            {/* 13. Privacy Policy Page */}
            <Route
              path="/privacy"
              element={
                <PrivacyPolicyPage
                  isOpen={true}
                  onClose={() => goBack('/')}
                />
              }
            />

            {/* 14. Contact Us Page */}
            <Route
              path="/contact"
              element={
                <ContactUsPage
                  isOpen={true}
                  onClose={() => goBack('/')}
                  user={user}
                  showToast={showToast}
                />
              }
            />

            {/* 15. Authentication Page (Sign In / Register) */}
            <Route
              path="/auth"
              element={
                <AuthPage
                  isOpen={true}
                  initialMode={authMode}
                  onBack={() => goBack('/')}
                  onSuccess={handleAuthSuccess}
                />
              }
            />
            <Route
              path="/login"
              element={
                <AuthPage
                  isOpen={true}
                  initialMode="signin"
                  onBack={() => goBack('/')}
                  onSuccess={handleAuthSuccess}
                />
              }
            />
            <Route
              path="/register"
              element={
                <AuthPage
                  isOpen={true}
                  initialMode="register"
                  onBack={() => goBack('/')}
                  onSuccess={handleAuthSuccess}
                />
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
