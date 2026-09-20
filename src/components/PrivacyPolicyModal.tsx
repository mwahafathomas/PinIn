import React from 'react';
import { X, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0052FF]" />
            <h2 className="font-extrabold text-base text-gray-900">Privacy Policy</h2>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto text-left space-y-4 text-xs text-gray-600 leading-relaxed">
          <p className="font-bold text-gray-800 text-sm">PinIn Furniture Marketplace Data & Privacy</p>

          <div>
            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#0052FF]" /> 1. Information We Collect
            </h4>
            <p>
              PinIn only collects information strictly necessary for listing and browsing furniture locally, such as your profile details, contact preferences, and public neighborhood location.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#0052FF]" /> 2. Seller and Buyer Safety
            </h4>
            <p>
              Your exact home address is never displayed publicly. Only your specified general neighborhood or city (e.g. "Brooklyn, NY") is shown alongside your furniture listings.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0052FF]" /> 3. Direct Messaging
            </h4>
            <p>
              All buyer and seller communications within the app are protected to facilitate safe local furniture inspections and handoffs.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-[#0052FF] text-white font-bold rounded-xl text-xs hover:bg-blue-700"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
