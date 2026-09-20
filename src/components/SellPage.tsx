import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  Camera,
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Tag,
  ChevronRight,
  ChevronDown,
  Info,
  LogIn,
  HelpCircle,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { FurnitureItem, UserAccount, SellFormData } from '../types/furniture';
import { getCoordinatesForLocation } from '../utils/geoUtils';
import { ListingGuidelinesPage } from './ListingGuidelinesPage';
import { compressImageBlob } from '../services/storageService';
import { MAX_FILE_SIZE_BYTES, formatFileSize } from '../utils/imageOptimizer';
import { isDefaultAvatar } from '../data/defaultAvatar';
import { isUserProfileUpdated } from '../services/profilesService';

interface SellPageProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing: (listing: FurnitureItem) => void;
  user: UserAccount;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onOpenEditProfile?: () => void;
  onDiscardListing?: () => void;
  formData: SellFormData;
  onUpdateFormData: React.Dispatch<React.SetStateAction<SellFormData>>;
  onOpenCategories: () => void;
  onOpenLocation: () => void;
}

const checkProfileCompleteness = (u: UserAccount) => {
  // If user has already saved their profile, or flagged in localStorage/state:
  const markedUpdated = !!(
    u.isProfileUpdated ||
    u.profileCompleted ||
    isUserProfileUpdated(u.id)
  );

  const rawName = (u.name || '').trim();
  const lowerName = rawName.toLowerCase();
  const isGenericPlaceholder =
    !rawName ||
    lowerName === 'pinin member' ||
    lowerName === 'guest' ||
    lowerName === 'valued user' ||
    lowerName === 'valueduser';

  // First name is valid if not a generic placeholder
  const hasFirstName = !isGenericPlaceholder && rawName.length > 0;

  // Surname is valid if provided, or if full name contains multiple words, or marked updated
  const hasSurname =
    !!(u.surname && u.surname.trim() !== '' && u.surname.trim().toLowerCase() !== 'user') ||
    (rawName.includes(' ') && rawName.split(/\s+/).length >= 2) ||
    markedUpdated;

  // Location: any valid non-empty string (e.g. Sandton, Gauteng, Johannesburg, Cape Town, etc.)
  const hasLocation = !!(u.location && u.location.trim() !== '');

  // Avatar: custom photo uploaded OR user has already completed/saved profile
  const hasAvatar = !!(u.avatar && !isDefaultAvatar(u.avatar)) || markedUpdated;

  // Profile is complete if marked updated and has name & location, or meets initial criteria
  const isComplete = markedUpdated
    ? (hasFirstName && hasLocation)
    : (hasAvatar && hasFirstName && hasSurname && hasLocation);

  return {
    isComplete,
    hasAvatar,
    hasFirstName,
    hasSurname,
    hasLocation,
  };
};

const CONDITIONS = [
  'Brand New',
  'Like New',
  'Good',
  'Fair',
  'Vintage',
] as const;

export const SellPage: React.FC<SellPageProps> = ({
  isOpen,
  onClose,
  onAddListing,
  user,
  onOpenAuth,
  onOpenEditProfile,
  onDiscardListing,
  formData,
  onUpdateFormData,
  onOpenCategories,
  onOpenLocation,
}) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [videoValidationNote, setVideoValidationNote] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateImageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // If user is not logged in, show mandatory sign-in gate
  if (!user.isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col font-sans">
        <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
          <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF]"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
                Pin<span className="text-[#0052FF]">In</span>
              </span>
            </div>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 w-full max-w-md md:max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Sign In to List Furniture
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-xs leading-relaxed">
            Please create an account or sign in to sell furniture, manage your listings, and chat with buyers.
          </p>
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth?.('signin');
              }}
              className="w-full py-3.5 px-6 bg-[#0052FF] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth?.('register');
              }}
              className="w-full py-3 px-6 bg-white border border-gray-300 text-gray-800 font-bold text-sm rounded-2xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              Create New Account
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Profile setup check: Do not allow users who haven't set up profile to list
  const profileStatus = checkProfileCompleteness(user);
  if (!profileStatus.isComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto shadow-inner">
            <UserCheck className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-gray-900 leading-tight">
              Update Your Profile First
            </h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              To list furniture on PinIn, please complete your profile first. You need to add a profile picture, your first name, surname, and your location.
            </p>
          </div>

          {/* Missing items checklist */}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">Profile Picture</span>
              {profileStatus.hasAvatar ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">✓ Added</span>
              ) : (
                <span className="text-amber-600 font-extrabold flex items-center gap-1">⚠ Required</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">First Name</span>
              {profileStatus.hasFirstName ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">✓ Added</span>
              ) : (
                <span className="text-amber-600 font-extrabold flex items-center gap-1">⚠ Required</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">Surname</span>
              {profileStatus.hasSurname ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">✓ Added</span>
              ) : (
                <span className="text-amber-600 font-extrabold flex items-center gap-1">⚠ Required</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">Location</span>
              {profileStatus.hasLocation ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">✓ Added</span>
              ) : (
                <span className="text-amber-600 font-extrabold flex items-center gap-1">⚠ Required</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenEditProfile) onOpenEditProfile();
              }}
              className="w-full py-3.5 px-4 bg-[#0052FF] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Update Profile Immediately</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 text-gray-500 hover:text-gray-800 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle uploading photos from device gallery (Max 10 images, max 1MB each with automatic compression)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - formData.images.length;
    if (remainingSlots <= 0) {
      alert('You have reached the maximum limit of 10 photos.');
      return;
    }

    const filesToRead: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);
    
    // Compress each image to ensure it is strictly <= 1MB and optimal format
    const processedImages: string[] = [];
    for (const file of filesToRead) {
      try {
        const { blob } = await compressImageBlob(file, 1200, 0.75);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve((event.target?.result as string) || '');
          };
          reader.readAsDataURL(blob);
        });
        if (dataUrl) {
          processedImages.push(dataUrl);
        }
      } catch (err) {
        console.warn('Error compressing photo:', err);
      }
    }

    if (processedImages.length > 0) {
      onUpdateFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...processedImages].slice(0, 10),
      }));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reorder images
  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      onUpdateFormData((prev) => {
        const copy = [...prev.images];
        const temp = copy[index - 1];
        copy[index - 1] = copy[index];
        copy[index] = temp;
        return { ...prev, images: copy };
      });
    } else if (direction === 'right' && index < formData.images.length - 1) {
      onUpdateFormData((prev) => {
        const copy = [...prev.images];
        const temp = copy[index + 1];
        copy[index + 1] = copy[index];
        copy[index] = temp;
        return { ...prev, images: copy };
      });
    }
  };

  // Remove single image
  const removeImage = (index: number) => {
    onUpdateFormData((prev) => {
      const remaining = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: remaining,
      };
    });
  };

  // Handle uploading image with handwritten date (Verification for approval only, max 1MB)
  const handleHandwrittenDateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const { blob } = await compressImageBlob(file, 1200, 0.75);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateFormData((prev) => ({
            ...prev,
            handwrittenDateImage: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Error compressing handwritten date photo:', err);
    }

    if (dateImageInputRef.current) {
      dateImageInputRef.current.value = '';
    }
  };

  // Handle uploading furniture video (15s min, 45s max - for approval only)
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoValidationNote('');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check video duration with HTML5 video element metadata
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    videoElement.src = objectUrl;

    videoElement.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = Math.round(videoElement.duration);
      if (duration < 15) {
        setVideoValidationNote(`Video is ${duration}s long. Please upload a video that is at least 15 seconds long (15s–45s).`);
      } else if (duration > 45) {
        setVideoValidationNote(`Video is ${duration}s long. Please upload a video that is maximum 45 seconds long (15s–45s).`);
      } else {
        setVideoValidationNote(`Video length: ${duration}s ✓`);
      }

      // Convert to Data URL or keep URL for upload
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateFormData((prev) => ({
            ...prev,
            verificationVideo: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    };

    videoElement.onerror = () => {
      // Fallback if metadata read fails
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateFormData((prev) => ({
            ...prev,
            verificationVideo: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    };

    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  // Submit Listing
  const handlePostListing = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.images.length < 4) {
      setErrorMessage('Please upload at least 4 photos of your furniture before posting.');
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setErrorMessage('Please enter a valid price.');
      return;
    }

    if (!formData.categoryLabel || formData.categoryLabel === 'Select Category') {
      setErrorMessage('Please select a category for your furniture.');
      return;
    }

    const chosenSuburb = (formData.collectionSuburb || formData.location || user.location || 'Sandton').trim();
    if (!chosenSuburb) {
      setErrorMessage('Please select a location for your furniture.');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('Description is compulsory. Please describe your furniture.');
      return;
    }

    // Auto-resolve coordinates from suburb if collectionLat / collectionLng weren't set yet
    let finalLat = formData.collectionLat;
    let finalLng = formData.collectionLng;
    if (finalLat === undefined || finalLng === undefined) {
      const geo = getCoordinatesForLocation(chosenSuburb);
      finalLat = geo.lat;
      finalLng = geo.lng;
    }

    // Use custom title or selected category as the title
    const chosenCategoryName = formData.categoryLabel || 'Furniture Item';
    const finalTitle = formData.title?.trim() || chosenCategoryName;
    const finalDescription =
      formData.description.trim() ||
      `${formData.isNew === 'New' ? 'Brand new' : 'Gently used'} ${finalTitle} located in ${chosenSuburb}. Condition: ${formData.condition}.`;

    const newItem: FurnitureItem = {
      id: `item-${Date.now()}`,
      title: finalTitle,
      location: chosenSuburb,
      price: Math.max(1, Number(formData.price) || 100),
      category: formData.category,
      condition: formData.condition,
      imageUrl: formData.images[0],
      additionalImages: formData.images.slice(1),
      seller: {
        id: user.id || 'seller_current',
        name: user.name || 'PinIn Verified Member',
        avatar:
          user.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 5.0,
        reviewCount: 1,
        joinedDate: user.joinedDate || 'Recently',
        responseRate: 'under 15 mins',
      },
      description: finalDescription,
      dimensions: 'Standard specifications',
      material: 'Quality build',
      brand: chosenCategoryName,
      postedAt: 'Just now',
      isSaved: false,
      status: 'pending', // Listing is under review
      latitude: finalLat,
      longitude: finalLng,
      collectionLat: finalLat,
      collectionLng: finalLng,
      collectionSuburb: chosenSuburb,
      collectionAddress: formData.collectionAddress || formData.location || chosenSuburb,
      handwrittenDateImage: formData.handwrittenDateImage,
      verificationVideo: formData.verificationVideo,
    };

    onAddListing(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col font-sans select-none">
      {/* Hidden File Input for Device Gallery Pick */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload photos from gallery"
      />

      {/* Hidden File Input for Image with Handwritten Date */}
      <input
        ref={dateImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleHandwrittenDateImageChange}
        className="hidden"
        aria-label="Upload image with handwritten date"
      />

      {/* Hidden File Input for Verification Video (15s to 45s) */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        className="hidden"
        aria-label="Upload video showing the furniture"
      />

      {/* Top Header Bar (White) */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option ( < ) */}
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF]"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-4xl lg:max-w-5xl mx-auto pb-12 flex flex-col px-4 md:px-6 lg:px-8 pt-4">
        {/* Error message banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* User Profile Info & Listing Guidelines Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 bg-white p-3.5 sm:p-4 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-100 shadow-xs border border-gray-200 shrink-0">
              <img
                src={
                  user.avatar ||
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
                }
                alt={user.name || 'User avatar'}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                {user.name || 'PinIn Verified Member'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#0052FF]" />
                <span>{formData.collectionSuburb || user.location || 'Gauteng, South Africa'}</span>
              </div>
            </div>
          </div>

          {/* View Listing Guidelines Tab */}
          <button
            type="button"
            onClick={() => setShowGuidelines(true)}
            className="py-2 px-3.5 bg-blue-50/80 hover:bg-blue-100/80 active:scale-[0.99] border border-blue-200 text-[#0052FF] rounded-2xl flex items-center justify-between sm:justify-center gap-2 transition-all cursor-pointer shadow-2xs group shrink-0"
          >
            <div className="w-5 h-5 rounded-md bg-[#0052FF] text-white flex items-center justify-center shrink-0">
              <HelpCircle className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-[#0052FF]">
              Listing guidelines
            </span>
            <ChevronRight className="w-4 h-4 text-[#0052FF] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>

        {/* Responsive Grid for Tablet and Desktop */}
        <div className="md:grid md:grid-cols-12 md:gap-8 md:items-start space-y-4 md:space-y-0">
          {/* Left Column on Tablet/Desktop: Photos & Verification */}
          <div className="md:col-span-6 space-y-4">
            {/* Photo Upload Section (Minimum 4 photos required) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Upload Photos <span className="text-[#0052FF] font-extrabold">(Min. 4) *</span>
                </span>
                <span className={`text-xs font-semibold ${formData.images.length < 4 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                  {formData.images.length}/10 uploaded {formData.images.length < 4 ? `(need ${4 - formData.images.length} more)` : '✓'}
                </span>
              </div>

              <div className={`bg-white border-2 border-dashed rounded-3xl p-4 text-center ${formData.images.length < 4 && formData.images.length > 0 ? 'border-amber-300' : 'border-gray-300'}`}>
                {formData.images.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0052FF] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
                      <Camera className="w-7 h-7 stroke-[2]" />
                    </div>
                    <p className="text-sm font-extrabold text-gray-900">
                      Tap to upload furniture photos
                    </p>
                    <p className="text-xs text-[#0052FF] font-bold mt-1">
                      Upload at least 4 photos (up to 10, max 1MB each)
                    </p>
                  </button>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {formData.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group/img shadow-2xs"
                      >
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />

                        {/* Main cover indicator badge */}
                        {idx === 0 && (
                          <div className="absolute top-1 left-1 bg-[#0052FF] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-xs">
                            Cover
                          </div>
                        )}

                        {/* Remove photo button */}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          aria-label="Remove photo"
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Move image controls */}
                        <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 'left')}
                            disabled={idx === 0}
                            aria-label="Move photo left"
                            className="p-1 text-white hover:text-blue-300 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveImage(idx, 'right')}
                            disabled={idx === formData.images.length - 1}
                            aria-label="Move photo right"
                            className="p-1 text-white hover:text-blue-300 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.images.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#0052FF] hover:bg-blue-50/50 flex flex-col items-center justify-center text-gray-400 hover:text-[#0052FF] transition-all cursor-pointer"
                      >
                        <Plus className="w-6 h-6 mb-1 stroke-[2.5]" />
                        <span className="text-[10px] font-bold">Add</span>
                      </button>
                    )}
                  </div>
                )}

                {formData.images.length > 0 && formData.images.length < 10 && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      {formData.images.length < 4
                        ? `⚠️ ${4 - formData.images.length} more photo${4 - formData.images.length > 1 ? 's' : ''} required`
                        : '✓ Photo minimum met'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-1.5 px-3 bg-[#0052FF]/10 hover:bg-[#0052FF]/15 text-[#0052FF] text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Photos</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Verification for Approval Section (Handwritten Date & 15-45s Video) */}
            <div className="bg-white border border-gray-200/90 rounded-3xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0052FF]" />
                  Verification for Approval
                </span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  Private Review
                </span>
              </div>

              <p className="text-[11px] text-gray-500 leading-snug mb-3">
                The handwritten date photo and video <strong className="text-gray-700 font-bold">won't be uploaded with public furniture photos</strong>. They are strictly for moderation approval.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Handwritten Date Image Upload Card */}
                <div className="border border-gray-200 rounded-2xl p-2.5 bg-gray-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-gray-800 uppercase tracking-tight truncate">
                        Handwritten Date
                      </span>
                      {formData.handwrittenDateImage ? (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Added
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-gray-400">Photo</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight mb-2">
                      Paper with today&apos;s date next to item
                    </p>
                  </div>

                  {formData.handwrittenDateImage ? (
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 group/date">
                      <img
                        src={formData.handwrittenDateImage}
                        alt="Handwritten date verification"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/date:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => dateImageInputRef.current?.click()}
                          className="p-1 rounded-md bg-white text-gray-800 text-[10px] font-bold shadow-xs hover:bg-gray-100 cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateFormData((prev) => ({
                              ...prev,
                              handwrittenDateImage: undefined,
                            }))
                          }
                          className="p-1 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-xs hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => dateImageInputRef.current?.click()}
                      className="w-full py-2 px-2 rounded-xl border border-dashed border-gray-300 hover:border-[#0052FF] hover:bg-blue-50/50 bg-white flex items-center justify-center gap-1.5 text-gray-600 hover:text-[#0052FF] transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">Add Date Image</span>
                    </button>
                  )}
                </div>

                {/* 2. Furniture Video Upload Card (15s min, 45s max) */}
                <div className="border border-gray-200 rounded-2xl p-2.5 bg-gray-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-gray-800 uppercase tracking-tight truncate">
                        Furniture Video
                      </span>
                      {formData.verificationVideo ? (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Added
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-gray-400">15s–45s</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight mb-2">
                      15s minimum, 45s maximum video
                    </p>
                  </div>

                  {formData.verificationVideo ? (
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 bg-black flex items-center justify-center group/vid">
                      <video
                        src={formData.verificationVideo}
                        className="w-full h-full object-cover"
                        controls={false}
                        muted
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/vid:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="p-1 rounded-md bg-white text-gray-800 text-[10px] font-bold shadow-xs hover:bg-gray-100 cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoValidationNote('');
                            onUpdateFormData((prev) => ({
                              ...prev,
                              verificationVideo: undefined,
                            }));
                          }}
                          className="p-1 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-xs hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full py-2 px-2 rounded-xl border border-dashed border-gray-300 hover:border-[#0052FF] hover:bg-blue-50/50 bg-white flex items-center justify-center gap-1.5 text-gray-600 hover:text-[#0052FF] transition-all cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold">Add Video</span>
                    </button>
                  )}
                </div>
              </div>

              {videoValidationNote && (
                <div className="mt-2 text-[10px] font-medium text-[#0052FF] bg-blue-50/70 p-1.5 rounded-lg flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>{videoValidationNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column on Tablet/Desktop: Pricing, Details, Description, Actions */}
          <div className="md:col-span-6 space-y-4">
            {/* Form Inputs: Title, Price, Category, Location, Condition, State */}
            <div className="space-y-3">
              {/* Item Title Input */}
              <div className="bg-[#0052FF] rounded-xl px-3 py-2.5 shadow-md flex flex-col justify-center text-white">
                <label
                  htmlFor="sell-title"
                  className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100 mb-0.5"
                >
                  Listing Title / Item Name *
                </label>
                <input
                  id="sell-title"
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) =>
                    onUpdateFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder={formData.categoryLabel || 'e.g. Leather Recliner Sofa, Wooden Coffee Table...'}
                  className="w-full bg-white/15 focus:bg-white text-white focus:text-gray-900 placeholder:text-blue-200 text-sm font-extrabold px-2.5 py-1.5 rounded-lg outline-none transition-all"
                />
              </div>

              {/* Row 1: Price & Category */}
              <div className="grid grid-cols-2 gap-3">
            {/* Price Option Blue Bar */}
            <div className="bg-[#0052FF] rounded-xl px-3 py-2.5 shadow-md flex flex-col justify-center text-white">
              <label
                htmlFor="sell-price"
                className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100 mb-0.5"
              >
                Price (R) *
              </label>
              <div className="relative flex items-center">
                <span className="text-sm font-black mr-1 text-white">R</span>
                <input
                  id="sell-price"
                  type="number"
                  min="1"
                  step="100"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    onUpdateFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="Set Price"
                  className="w-full bg-white/15 focus:bg-white text-white focus:text-gray-900 placeholder:text-blue-200 text-sm font-extrabold px-2.5 py-1.5 rounded-lg outline-none transition-all"
                />
              </div>
            </div>

            {/* Category Blue Bar Button - leads to Categories Page */}
            <button
              type="button"
              onClick={onOpenCategories}
              className="bg-[#0052FF] hover:bg-blue-700 active:scale-[0.99] rounded-xl px-3 py-2.5 shadow-md flex flex-col justify-center text-white text-left transition-all group cursor-pointer"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100 mb-0.5">
                Category *
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px]">
                  {formData.categoryLabel || 'Select Category'}
                </span>
                <ChevronRight className="w-4 h-4 text-blue-200 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </button>
          </div>

          {/* Row 2: Location & Condition */}
          <div className="grid grid-cols-2 gap-3">
            {/* Location Blue Bar Button - leads to Location Selection Page */}
            <button
              type="button"
              onClick={onOpenLocation}
              className="bg-[#0052FF] hover:bg-blue-700 active:scale-[0.99] rounded-xl px-3 py-2.5 shadow-md flex flex-col justify-center text-white text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-200" />
                  <span>Location *</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[110px]">
                  {formData.collectionSuburb || formData.location || 'Select Location'}
                </span>
                <ChevronRight className="w-4 h-4 text-blue-200 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </button>

            {/* Condition Blue Bar */}
            <div className="bg-[#0052FF] rounded-xl px-3 py-2.5 shadow-md flex flex-col justify-center text-white">
              <label
                htmlFor="sell-condition"
                className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100 mb-0.5"
              >
                Condition
              </label>
              <div className="relative">
                <select
                  id="sell-condition"
                  value={formData.condition}
                  onChange={(e) =>
                    onUpdateFormData((prev) => ({
                      ...prev,
                      condition: e.target.value as
                        | 'Brand New'
                        | 'Like New'
                        | 'Good'
                        | 'Fair'
                        | 'Vintage',
                    }))
                  }
                  className="w-full bg-white/15 focus:bg-white text-white focus:text-gray-900 text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg outline-none cursor-pointer appearance-none pr-6 transition-all"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond} className="text-gray-900 bg-white">
                      {cond}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-white pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Row 3: Item State (New / Used) */}
          <div className="bg-[#0052FF] rounded-xl px-3 py-2.5 shadow-md flex items-center justify-between text-white">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
              Item State
            </span>
            <div className="grid grid-cols-2 gap-1 bg-black/20 p-0.5 rounded-lg w-40">
              <button
                type="button"
                onClick={() =>
                  onUpdateFormData((prev) => ({ ...prev, isNew: 'New' }))
                }
                className={`py-1 text-xs font-extrabold rounded-md transition-all text-center ${
                  formData.isNew === 'New'
                    ? 'bg-white text-[#0052FF] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                New
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateFormData((prev) => ({ ...prev, isNew: 'Used' }))
                }
                className={`py-1 text-xs font-extrabold rounded-md transition-all text-center ${
                  formData.isNew === 'Used'
                    ? 'bg-white text-[#0052FF] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                Used
              </button>
            </div>
          </div>
        </div>

        {/* Description (Compulsory) */}
        <div className="mb-4">
          <label
            htmlFor="sell-description"
            className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 px-1"
          >
            Description <span className="text-[#0052FF] font-extrabold">*</span>
          </label>
          <div className="bg-white border-2 border-gray-300 focus-within:border-[#0052FF] rounded-2xl p-3 shadow-xs transition-all">
            <textarea
              id="sell-description"
              rows={3}
              required
              value={formData.description}
              onChange={(e) =>
                onUpdateFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your furniture: dimensions, materials, care, and pickup details (Compulsory)..."
              className="w-full bg-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 font-medium outline-none resize-none"
            />
          </div>
        </div>

        {/* Post Listing Button & Cancel Action */}
        <div className="mb-4 space-y-2.5">
          <button
            type="button"
            onClick={handlePostListing}
            className="w-full py-3.5 px-6 bg-[#0052FF] hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0052FF] cursor-pointer"
          >
            <Tag className="w-4 h-4 stroke-[2.5]" />
            <span>Post Listing</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-6 bg-white hover:bg-gray-100 active:scale-[0.99] text-gray-700 font-bold text-xs rounded-2xl border border-gray-300 transition-all text-center cursor-pointer"
          >
            Cancel &amp; Exit
          </button>
        </div>

        {/* Terms notice */}
        <div className="text-center px-2">
          <p className="text-[11px] sm:text-xs text-gray-500 leading-normal">
            By posting you agree with PinIn{' '}
            <span className="text-[#0052FF] font-semibold underline underline-offset-2 cursor-pointer hover:text-blue-800">
              Terms &amp; Conditions
            </span>{' '}
            &amp;{' '}
            <span className="text-[#0052FF] font-semibold underline underline-offset-2 cursor-pointer hover:text-blue-800">
              Policies
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  </main>

      {/* View Listing Guidelines Screen */}
      <ListingGuidelinesPage
        isOpen={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />

      {/* Discard Listing Confirmation Modal - Centered */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-gray-900 leading-tight">
                Discard listing
              </h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                Are you sure you want to discard this listing? All filled details will be lost.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  if (onDiscardListing) onDiscardListing();
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

