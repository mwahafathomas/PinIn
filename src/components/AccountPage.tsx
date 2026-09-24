import React, { useState } from 'react';
import {
  ChevronLeft,
  Store,
  MessageSquare,
  Bell,
  Settings,
  MoreVertical,
  Share,
  Trash2,
  MapPin,
  AlertTriangle,
  X,
  Edit3,
  UserX,
  User as UserIcon,
} from 'lucide-react';
import { FurnitureItem, UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface AccountPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  userListings: FurnitureItem[];
  onDeleteListing: (listingId: string) => void;
  onShareListing: (listing: FurnitureItem) => void;
  onDeleteAccount: () => void;
  onOpenDeleteAccount?: () => void;
  onOpenEditProfile?: () => void;
  onUpdateBio?: (newBio: string, newLocation?: string) => void;
  onOpenSell?: () => void;
  onSelectItem?: (item: FurnitureItem) => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  isOpen,
  onClose,
  user,
  userListings,
  onDeleteListing,
  onShareListing,
  onDeleteAccount,
  onOpenDeleteAccount,
  onOpenEditProfile,
  onUpdateBio,
  onOpenSell,
  onSelectItem,
  onOpenMessages,
  onOpenNotifications,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  // Settings menu modal/dropdown state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);

  // Listing 3-dots active menu ID
  const [activeMenuListingId, setActiveMenuListingId] = useState<string | null>(null);
  const [listingToDelete, setListingToDelete] = useState<FurnitureItem | null>(null);

  if (!isOpen) return null;

  const fullName = user.surname ? `${user.name} ${user.surname}` : user.name;
  const userBio = user.bio || '';

  const handleOpenListingMenu = (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    setActiveMenuListingId((prev) => (prev === listingId ? null : listingId));
  };

  const handleConfirmDeleteListing = () => {
    if (listingToDelete) {
      onDeleteListing(listingToDelete.id);
      setListingToDelete(null);
      setActiveMenuListingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans"
      onClick={() => {
        setActiveMenuListingId(null);
        setIsSettingsOpen(false);
      }}
    >
      {/* Top Header Bar (White) */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          {/* Settings icon */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingsOpen((prev) => !prev);
              }}
              aria-label="Account settings"
              className="p-2 -mr-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <Settings className="w-5 h-5 text-gray-700 hover:text-[#2D8EDE]" />
            </button>

            {/* Settings Dropdown Menu */}
            {isSettingsOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSettingsOpen(false);
                  }}
                />
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3.5 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">Account Settings</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email || 'user@pinin.co.za'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      if (onOpenEditProfile) {
                        onOpenEditProfile();
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2D8EDE] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-gray-500" />
                    <span>Edit Profile &amp; Bio</span>
                  </button>

                  <div className="h-px bg-gray-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      if (onOpenDeleteAccount) {
                        onOpenDeleteAccount();
                      } else {
                        setIsDeleteAccountConfirmOpen(true);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserX className="w-4 h-4 text-red-500" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area (Scrollable in middle) */}
      <main className="flex-1 w-full max-w-md md:max-w-7xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 pt-4 pb-12">
        {/* Profile Section */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-6 text-center md:text-left">
          {/* Profile picture of the user without blue border */}
          <div className="relative shrink-0">
            <img
              src={getOptimizedImageUrl(user.avatar || DEFAULT_AVATAR_IMAGE, { width: 200, quality: 75, format: 'webp' })}
              alt={fullName}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-2 border-gray-200 shadow-sm"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* User name & surname then location below then bio below */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">
              {fullName}
            </h1>

            {user.location &&
            user.location.trim() !== '' &&
            user.location !== 'Gauteng, South Africa' &&
            user.location !== 'Sandton (Gauteng)' &&
            user.location !== 'Gauteng' ? (
              <p className="text-xs md:text-sm font-bold text-[#2D8EDE] flex items-center justify-center md:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.location}</span>
              </p>
            ) : null}

            {userBio.trim() !== '' && (
              <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed pt-1">
                {userBio}
              </p>
            )}
          </div>
        </div>

        {/* User Listings Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2D8EDE]" />
              <span>My Listings</span>
              <span className="text-gray-400 font-medium">
                ({userListings.length})
              </span>
            </h2>
          </div>

          {/* User Listings Stack */}
          {userListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userListings.map((item) => {
                const isMenuOpenForThis = activeMenuListingId === item.id;
                const isUnderReview = item.status === 'pending';

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-none border-2 border-gray-200 overflow-hidden shadow-xs relative ${
                      isUnderReview ? 'cursor-default opacity-95' : 'cursor-pointer'
                    }`}
                    onClick={() => {
                      if (isUnderReview) {
                        alert('This listing is currently awaiting approval in Supabase. It will be publicly viewable once approved.');
                        return;
                      }
                      if (onSelectItem) onSelectItem(item);
                    }}
                  >
                    {/* Card Image Area with sharp 90-degree corners */}
                    <div className="relative aspect-16/10 bg-gray-100 rounded-none overflow-hidden">
                      <img
                        src={getOptimizedImageUrl(item.imageUrl, { width: 600, quality: 70, format: 'webp' })}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-none"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Price Badge with Rand 'R' (No number 6 or number prefix) */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-[#2D8EDE] text-white text-xs sm:text-sm font-black px-3 py-1 rounded-xl shadow-md flex items-center">
                          <span>R{item.price}</span>
                        </div>
                      </div>

                      {/* 3 dots menu */}
                      <div className="absolute top-3 right-3 z-20">
                        <button
                          type="button"
                          onClick={(e) => handleOpenListingMenu(e, item.id)}
                          aria-label="Listing options"
                          className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-gray-800 hover:text-[#2D8EDE] flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpenForThis && (
                          <div
                            className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuListingId(null);
                                onShareListing(item);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-blue-50 hover:text-[#2D8EDE] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Share className="w-4 h-4 text-[#2D8EDE]" />
                              <span>Share listing</span>
                            </button>

                            <div className="h-px bg-gray-100 my-1" />

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuListingId(null);
                                setListingToDelete(item);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span>Delete listing</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name of furniture & location */}
                    <div className="p-3.5 bg-white border-t border-gray-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-sm text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#2D8EDE] shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </p>
                        </div>

                        <span className="text-[11px] font-bold bg-blue-50 text-[#2D8EDE] px-2 py-0.5 rounded-lg shrink-0">
                          {item.condition}
                        </span>
                      </div>

                      {/* Approval Status Badge */}
                      {item.status && item.status !== 'approved' && (
                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                item.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.status === 'pending' ? '⏳ Under Review (Admin Approval)' : '❌ Not Approved'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              {item.status === 'pending' ? 'Will show publicly once approved' : 'Review status'}
                            </span>
                          </div>
                          {item.status === 'rejected' && item.rejectionReason && (
                            <div className="p-2 rounded-lg bg-red-50 text-[11px] text-red-700 border border-red-200/80 leading-snug">
                              <span className="font-bold">Reason: </span>
                              <span>{item.rejectionReason}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2D8EDE] flex items-center justify-center mx-auto">
                <span className="text-xl font-black text-[#2D8EDE]">+</span>
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">
                You haven't listed any furniture yet
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Post your couches, tables, bedroom sets, or appliances to connect with buyers across Gauteng.
              </p>
              {onOpenSell && (
                <button
                  type="button"
                  onClick={onOpenSell}
                  className="py-2.5 px-5 bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  List Furniture on PinIn
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      {isDeleteAccountConfirmOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsDeleteAccountConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900">
                Delete Account?
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Are you sure you want to permanently delete your PinIn account and all active furniture listings? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAccountConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAccountConfirmOpen(false);
                  onDeleteAccount();
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Listing Confirmation Dialog */}
      {listingToDelete && (
        <div
          className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setListingToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-150 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900">
                Delete Listing?
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Are you sure you want to remove <span className="font-bold text-gray-900">"{listingToDelete.title}"</span> from PinIn?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-xs text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteListing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Dock */}
      <footer className="shrink-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-8 h-16 grid grid-cols-4 items-center">
          {/* 1. Messages Icon (First at left) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMessages) onOpenMessages();
            }}
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Messages"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-5 h-5 stroke-[2] text-gray-600 group-hover:text-[#2D8EDE] transition-transform group-hover:scale-105" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              messages
            </span>
          </button>

          {/* 2. Profile Icon (Second, Active) */}
          <button
            type="button"
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Profile"
          >
            <div className="relative flex items-center justify-center">
              <UserIcon className="w-5 h-5 stroke-[2.2] text-[#2D8EDE]" />
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-[#2D8EDE]">
              Profile
            </span>
          </button>

          {/* 3. Marketplace Icon (Third) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-[#2D8EDE] active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Marketplace"
          >
            <div className="relative flex items-center justify-center">
              <Store className="w-5 h-5 stroke-[2.2] text-gray-600 group-hover:text-[#2D8EDE]" />
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Marketplace
            </span>
          </button>

          {/* 4. Notification Icon (Last at right) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenNotifications) onOpenNotifications();
            }}
            className="flex flex-col items-center justify-center h-full active:scale-95 transition-all group relative cursor-pointer"
            aria-label="Notifications"
          >
            <div className="relative flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2] text-gray-600 group-hover:text-[#2D8EDE] transition-transform group-hover:scale-105" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#2D8EDE] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1 leading-none text-gray-600 group-hover:text-[#2D8EDE]">
              Notifications
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};
