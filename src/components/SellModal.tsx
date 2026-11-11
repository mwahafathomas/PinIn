import React, { useState, useRef } from 'react';
import { X, UploadCloud, MapPin, DollarSign, Tag, Check, Image as ImageIcon, Trash2, Loader2, Plus } from 'lucide-react';
import { FurnitureItem, UserAccount } from '../types/furniture';
import { uploadListingImageToBucket, deleteListingImageFromBucket } from '../services/storageService';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing: (listing: FurnitureItem) => void;
  user: UserAccount;
}

interface UploadedImageItem {
  publicUrl: string;
  filePath: string;
}

export const SellModal: React.FC<SellModalProps> = ({
  isOpen,
  onClose,
  onAddListing,
  user,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('sofas');
  const [condition, setCondition] = useState<'Brand New' | 'Like New' | 'Good' | 'Fair' | 'Vintage'>('Like New');
  const [location, setLocation] = useState(user.location || 'Gauteng, South Africa');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [material, setMaterial] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - uploadedImages.length;
    if (remainingSlots <= 0) {
      alert('You can upload a maximum of 5 images.');
      return;
    }

    const filesToUpload: File[] = (Array.from(files) as File[]).slice(0, remainingSlots);
    setIsUploading(true);
    setUploadError('');

    try {
      const newUploads: UploadedImageItem[] = [];
      const userId = user.id || 'anonymous';

      for (const file of filesToUpload) {
        const { publicUrl, filePath } = await uploadListingImageToBucket(file, userId, file.name);
        newUploads.push({ publicUrl, filePath });
      }

      setUploadedImages((prev) => [...prev, ...newUploads].slice(0, 5));
    } catch (err: any) {
      console.warn('Image upload error:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (index: number) => {
    const imageToDelete = uploadedImages[index];
    if (!imageToDelete) return;

    // Delete from storage bucket
    try {
      await deleteListingImageFromBucket(imageToDelete.filePath);
    } catch (err) {
      console.warn('Failed to delete image from storage bucket:', err);
    }

    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert('Please fill in the furniture name and price.');
      return;
    }

    if (uploadedImages.length === 0) {
      alert('Please add at least 1 image for your listing.');
      return;
    }

    const publicUrls = uploadedImages.map((img) => img.publicUrl);

    const newItem: FurnitureItem = {
      id: `item-${Date.now()}`,
      title: title.trim(),
      location: location.trim() || 'Gauteng',
      price: Number(price) || 100,
      category,
      condition,
      imageUrl: publicUrls[0],
      images: publicUrls,
      additionalImages: publicUrls.slice(1),
      seller: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        rating: 5.0,
        reviewCount: 1,
        joinedDate: 'Just now',
        responseRate: 'under 15 mins',
      },
      description: description.trim() || 'Beautiful piece in great condition.',
      dimensions: dimensions.trim() || 'Standard dimensions',
      material: material.trim() || 'Wood / Fabric',
      postedAt: 'Just now',
      isSaved: false,
    };

    onAddListing(newItem);
    onClose();
    // reset
    setTitle('');
    setPrice('');
    setDescription('');
    setUploadedImages([]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="font-extrabold text-lg text-gray-900">List Furniture on PinIn</h2>
            <p className="text-xs text-gray-500">Upload up to 5 photos to Supabase Storage</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-left">
          {/* Image Picker with Supabase Storage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Listing Photos ({uploadedImages.length}/5) *
              </label>
              {isUploading && (
                <span className="text-xs text-[#2D8EDE] font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                </span>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Image Preview Grid & Add Photo Button */}
            <div className="grid grid-cols-5 gap-2">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                  <img src={img.publicUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(idx)}
                    aria-label="Delete image"
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600/90 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 font-bold uppercase">
                      Cover
                    </div>
                  )}
                </div>
              ))}

              {uploadedImages.length < 5 && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#2D8EDE] flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#2D8EDE] bg-gray-50/50 hover:bg-blue-50/20 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-[10px] font-bold">Add</span>
                </button>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-red-600 mt-1 font-medium">{uploadError}</p>
            )}
          </div>

          {/* Furniture Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Furniture Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scandinavian Oak Dining Table"
              className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D8EDE]"
            />
          </div>

          {/* Location of Seller */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Seller Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sandton, Gauteng"
                className="w-full text-sm pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D8EDE]"
              />
            </div>
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Price (R) *
              </label>
              <div className="relative">
                <span className="text-xs font-black text-gray-400 absolute left-3 top-3">R</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="250"
                  className="w-full text-sm pl-8 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D8EDE]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] bg-white"
              >
                <option value="sofas">Sofas & Couches</option>
                <option value="chairs">Chairs & Benches</option>
                <option value="tables">Tables & Desks</option>
                <option value="bedroom">Beds & Bedroom</option>
                <option value="storage">Storage & Credenzas</option>
                <option value="lighting">Lamps & Lighting</option>
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Condition
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['Brand New', 'Like New', 'Good', 'Fair', 'Vintage'] as const).map((cond) => (
                <button
                  type="button"
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`py-2 px-2 rounded-lg font-medium border text-center transition-all ${
                    condition === cond
                      ? 'bg-blue-50 border-[#2D8EDE] text-[#2D8EDE] font-bold'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers about dimensions, condition, materials, and pickup details..."
              className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D8EDE]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3.5 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Tag className="w-4 h-4" />
              <span>Publish Furniture Listing</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
