import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, MapPin, User as UserIcon } from 'lucide-react';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { formatDisplayName } from '../utils/formatUtils';
import { fetchUserProfile } from '../services/profilesService';
import { UserAccount } from '../types/furniture';

export interface UserProfileData {
  id: string;
  name: string;
  surname?: string;
  avatar?: string;
  location?: string;
  bio?: string;
}

interface UserProfilePageProps {
  userId: string;
  initialProfile?: Partial<UserProfileData> | null;
  currentUser: UserAccount;
  onClose: () => void;
  onMessageUser: (targetUser: { id: string; name: string; avatar: string; location?: string }) => void;
  onRequireAuth?: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  userId,
  initialProfile,
  currentUser,
  onClose,
  onMessageUser,
  onRequireAuth,
}) => {
  const [profile, setProfile] = useState<Partial<UserProfileData>>(() => {
    return initialProfile || { id: userId };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (userId) {
      setLoading(true);
      fetchUserProfile(userId)
        .then((fetched) => {
          if (isMounted && fetched) {
            setProfile((prev) => ({
              ...prev,
              ...fetched,
              id: fetched.id || prev.id || userId,
              name: fetched.name || prev.name || '',
              surname: fetched.surname || prev.surname || '',
              avatar: fetched.avatar || prev.avatar || '',
              location: fetched.location || prev.location || '',
              bio: fetched.bio || prev.bio || '',
            }));
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const firstName = profile.name || initialProfile?.name || '';
  const surname = profile.surname || initialProfile?.surname || '';
  const rawFullName = [firstName, surname].filter(Boolean).join(' ').trim() || 'User';
  const displayName = formatDisplayName(rawFullName);
  const avatarUrl = profile.avatar || initialProfile?.avatar || DEFAULT_AVATAR_IMAGE;
  const locationText = profile.location || initialProfile?.location || '';
  const bioText = profile.bio || initialProfile?.bio || '';

  const isSelf = currentUser?.id && currentUser.id === userId;

  const handleMessage = () => {
    if (!currentUser?.isLoggedIn || !currentUser.id || currentUser.id === 'guest') {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }
    onMessageUser({
      id: userId,
      name: displayName,
      avatar: avatarUrl,
      location: locationText,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) at top left */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* App Name at top (PinIn) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          {/* Symmetrical right spacer */}
          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full max-w-md md:max-w-xl mx-auto px-4 py-8 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center">
          {/* User's profile icon */}
          <div className="relative mb-4">
            <img
              src={getOptimizedImageUrl(avatarUrl, { width: 300, quality: 80, format: 'webp' })}
              alt={displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-gray-200 shadow-sm"
              loading="eager"
            />
          </div>

          {/* User's name & surname */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            {displayName}
          </h1>

          {/* User's location */}
          <div className="flex items-center justify-center gap-1.5 mt-2 text-gray-500 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{locationText ? locationText : 'Location not specified'}</span>
          </div>

          {/* User's bio */}
          <div className="w-full mt-6 pt-6 border-t border-gray-100 text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Bio
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {bioText ? bioText : 'No bio provided.'}
            </p>
          </div>

          {/* Message user option */}
          <div className="w-full mt-8">
            {isSelf ? (
              <div className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold text-center">
                This is your profile
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMessage}
                className="w-full bg-[#2D8EDE] hover:bg-[#2579BE] text-white font-bold py-3.5 px-6 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE]"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Message User</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
