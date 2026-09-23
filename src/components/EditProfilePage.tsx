import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  Camera,
  MapPin,
  User as UserIcon,
  Mail,
  Trash2,
} from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { DEFAULT_AVATAR_IMAGE, isDefaultAvatar } from '../data/defaultAvatar';
import { compressImageBlob } from '../services/storageService';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface EditProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  onSaveProfile: (updatedData: {
    name: string;
    surname?: string;
    bio?: string;
    location?: string;
    phone?: string;
    avatar?: string;
  }) => void;
}

const isNameFromEmail = (nameStr?: string, emailStr?: string) => {
  if (!nameStr) return true;
  const clean = nameStr.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean === '' || clean === 'pininmember' || clean === 'guest' || clean === 'valueduser') return true;
  if (!emailStr) return false;
  const emailPrefix = emailStr.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === emailPrefix;
};

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  isOpen,
  onClose,
  user,
  onSaveProfile,
}) => {
  const [name, setName] = useState(() => {
    let n = (user.name || '').trim();
    const clean = n.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean === 'pininmember' || clean === 'guest' || clean === 'valueduser') return '';
    const s = (user.surname || '').trim();
    if (s && n.toLowerCase().endsWith(s.toLowerCase())) {
      n = n.slice(0, n.length - s.length).trim();
    }
    return n;
  });
  const [surname, setSurname] = useState(user.surname || '');
  const [bio, setBio] = useState(user.bio?.slice(0, 50) || '');
  const [location, setLocation] = useState(() => {
    return user.location || '';
  });
  const [avatar, setAvatar] = useState(
    user.avatar || DEFAULT_AVATAR_IMAGE
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { blob } = await compressImageBlob(file, 400, 0.8);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Error compressing avatar:', err);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar(DEFAULT_AVATAR_IMAGE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanName = name.trim();
    const cleanSurname = surname.trim();
    if (cleanSurname && cleanName.toLowerCase().endsWith(cleanSurname.toLowerCase())) {
      cleanName = cleanName.slice(0, cleanName.length - cleanSurname.length).trim();
    }
    onSaveProfile({
      name: cleanName,
      surname: cleanSurname,
      bio: bio.trim().slice(0, 50),
      location: location.trim(),
      phone: user.phone || '',
      avatar,
    });
  };

  const hasCustomPhoto = !isDefaultAvatar(avatar);

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Hidden File Input for Custom Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileUpload}
        className="hidden"
        aria-label="Upload profile picture"
      />

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

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto overflow-y-auto px-4 md:px-6 lg:px-8 pt-4 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Page Title Header */}
          <div className="text-center pt-1 pb-2">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Edit Profile &amp; Bio
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Customize how other furniture buyers and sellers see you
            </p>
          </div>

          {/* Avatar Section without blue circle/ring */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={getOptimizedImageUrl(avatar, { width: 200, quality: 75, format: 'webp' })}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                loading="lazy"
                decoding="async"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload new photo"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2D8EDE] hover:bg-[#2579BE] text-white flex items-center justify-center shadow-md border-2 border-white transition-all active:scale-90 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#2D8EDE] hover:underline cursor-pointer"
              >
                {hasCustomPhoto ? 'Change Photo' : 'Upload Photo'}
              </button>
              {hasCustomPhoto && (
                <>
                  <span className="text-gray-300 text-xs">•</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-4 shadow-xs space-y-3.5">
            {/* First Name & Surname */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="edit-name"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
                >
                  First Name
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                  <input
                    id="edit-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First name"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl outline-none focus:border-[#2D8EDE] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="edit-surname"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
                >
                  Surname
                </label>
                <input
                  id="edit-surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Surname"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold px-3 py-2.5 rounded-xl outline-none focus:border-[#2D8EDE] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label
                htmlFor="edit-location"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
              >
                Location / Suburb
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                <input
                  id="edit-location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sandton (Gauteng)"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl outline-none focus:border-[#2D8EDE] focus:bg-white transition-all"
                />
              </div>
              <p className="text-[10px] text-gray-400 pl-1">
                PinIn connects furniture buyers &amp; sellers
              </p>
            </div>

            {/* Email (read-only reference) */}
            <div className="space-y-1">
              <label
                htmlFor="edit-email"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                <input
                  id="edit-email"
                  type="email"
                  disabled
                  value={user.email || 'account@pinin.co.za'}
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Bio Textarea: max length 50 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-bio"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
                >
                  Bio / About You
                </label>
                <span className="text-[10px] text-gray-400 font-medium">
                  {bio.length}/50
                </span>
              </div>
              <textarea
                id="edit-bio"
                rows={2}
                maxLength={50}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 50))}
                placeholder="Short bio (e.g. Vintage furniture collector)..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-xs font-semibold p-3 rounded-xl outline-none focus:border-[#2D8EDE] focus:bg-white resize-none transition-all"
              />
            </div>
          </div>

          {/* Action Buttons (No stars on save button as requested) */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-6 bg-white hover:bg-gray-100 active:scale-[0.99] text-gray-700 font-bold text-xs rounded-2xl border border-gray-300 transition-all text-center cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
