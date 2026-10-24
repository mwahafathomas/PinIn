import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { UserAccount } from '../types/furniture';

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

  if (!isOpen) return null;

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
      bio: user.bio || '',
      location: user.location || '',
      phone: user.phone || '',
      avatar: user.avatar,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
      {/* Top Header Bar */}
      <header className="shrink-0 z-30 w-full bg-white border-b border-gray-200">
        <div className="w-full max-w-md md:max-w-2xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5] text-gray-900" />
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

      {/* Main Content Area - Clean text list like settings menu */}
      <main className="flex-1 w-full max-w-md md:max-w-2xl mx-auto overflow-y-auto px-4 md:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Page Title */}
          <div className="pb-2">
            <h1 className="text-lg font-black text-gray-900 tracking-tight">
              Edit Profile
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Update your account name
            </p>
          </div>

          {/* Clean text list - no boxes, no cards, no borders, with clean grey dividers */}
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {/* First Name */}
            <div className="py-3.5 space-y-1">
              <label
                htmlFor="edit-name"
                className="block text-xs font-bold text-gray-900"
              >
                First Name
              </label>
              <div className="relative flex items-center">
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name"
                  className="w-full text-xs sm:text-sm font-semibold text-gray-900 py-1.5 outline-none bg-transparent placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Surname */}
            <div className="py-3.5 space-y-1">
              <label
                htmlFor="edit-surname"
                className="block text-xs font-bold text-gray-900"
              >
                Surname
              </label>
              <div className="relative flex items-center">
                <input
                  id="edit-surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Surname"
                  className="w-full text-xs sm:text-sm font-semibold text-gray-900 py-1.5 outline-none bg-transparent placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="py-3.5 space-y-1">
              <label
                htmlFor="edit-email"
                className="block text-xs font-bold text-gray-900"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  id="edit-email"
                  type="email"
                  disabled
                  value={user.email || 'account@pinin.co.za'}
                  className="w-full text-xs sm:text-sm font-medium text-gray-400 py-1.5 outline-none bg-transparent cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-6 text-gray-600 hover:text-gray-900 font-bold text-xs transition-colors text-center cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
