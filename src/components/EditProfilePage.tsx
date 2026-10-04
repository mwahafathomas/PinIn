import React, { useState } from 'react';
import {
  ChevronLeft,
  User as UserIcon,
  Mail,
} from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden font-sans select-none">
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
            <ChevronLeft className="w-6 h-6 stroke-[2.5] text-[#2D8EDE]" />
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
              Edit Profile
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Update your account name
            </p>
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
                  <UserIcon className="w-4 h-4 text-[#2D8EDE] absolute left-3 pointer-events-none" />
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

            {/* Email (read-only reference) */}
            <div className="space-y-1">
              <label
                htmlFor="edit-email"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
              >
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#2D8EDE] absolute left-3 pointer-events-none" />
                <input
                  id="edit-email"
                  type="email"
                  disabled
                  value={user.email || 'account@pinin.co.za'}
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
