import React, { useState } from 'react';
import { X, UploadCloud, MapPin, DollarSign, Tag, Check, Image as ImageIcon } from 'lucide-react';
import { FurnitureItem, UserAccount } from '../types/furniture';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing: (listing: FurnitureItem) => void;
  user: UserAccount;
}

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
];

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
  const [location, setLocation] = useState(user.location || 'Brooklyn, NY');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(SAMPLE_IMAGES[0]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [material, setMaterial] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !location.trim()) {
      alert('Please fill in the furniture name, price, and location.');
      return;
    }

    const newItem: FurnitureItem = {
      id: `item-${Date.now()}`,
      title: title.trim(),
      location: location.trim(),
      price: Number(price) || 100,
      category,
      condition,
      imageUrl: customImageUrl.trim() || selectedImage,
      seller: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        rating: 5.0,
        reviewCount: 1,
        joinedDate: 'Just now',
        responseRate: 'under 15 mins',
      },
      description: description.trim() || 'Beautiful furniture piece in great condition.',
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
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="font-extrabold text-lg text-gray-900">List Furniture on PinIn</h2>
            <p className="text-xs text-gray-500">Post your item for local buyers</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-left">
          {/* Photos */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select or Upload Photo
            </label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {SAMPLE_IMAGES.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setSelectedImage(img);
                    setCustomImageUrl('');
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === img && !customImageUrl ? 'border-[#0052FF] ring-2 ring-blue-100' : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="sample" className="w-full h-full object-cover" />
                  {selectedImage === img && !customImageUrl && (
                    <div className="absolute inset-0 bg-[#0052FF]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="Or paste an image URL..."
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
              />
            </div>
          </div>

          {/* 16 - 21 Focus: Furniture Name */}
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
              className="w-full text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
            />
          </div>

          {/* Location of Seller */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Seller Location *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Brooklyn, NY"
                className="w-full text-sm pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
              />
            </div>
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Price ($) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="250"
                  className="w-full text-sm pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
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
                className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0052FF] bg-white"
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
                      ? 'bg-blue-50 border-[#0052FF] text-[#0052FF] font-bold'
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
              className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0052FF]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#0052FF] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Publish Furniture Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
