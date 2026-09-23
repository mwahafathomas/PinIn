import React from 'react';
import {
  ChevronLeft,
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  Mail,
  CheckCircle2,
  Globe,
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto no-scrollbar flex flex-col font-sans">
      {/* Top Header Bar (White): 1. Go back (<) on top left, 2. App name (PinIn) in middle */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option (<) on top left */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-gray-800 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#0052FF]">In</span>
            </span>
          </div>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto pb-16 flex flex-col px-4 md:px-6 lg:px-8 pt-4 space-y-4 text-left">
        {/* Title Banner */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              PinIn Furniture Marketplace Security Standards
            </p>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs space-y-2.5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#0052FF]" />
            <span>1. Information We Collect</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            PinIn collects only the information necessary to provide a smooth, trustworthy local furniture buying and selling experience. This includes:
          </p>
          <ul className="space-y-1.5 text-xs text-gray-600 font-medium pl-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-1.5 shrink-0" />
              <span><strong>Profile Details:</strong> Your name, display surname, profile photo, and public bio.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-1.5 shrink-0" />
              <span><strong>Furniture Listings:</strong> Photos, dimensions, prices, condition tags, and descriptions you publish.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-1.5 shrink-0" />
              <span><strong>Direct Messaging:</strong> Chats between buyers and sellers to coordinate furniture inspections and collection.</span>
            </li>
          </ul>
        </div>

        {/* Section 2: Location and Neighborhood Privacy */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs space-y-2.5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0052FF]" />
            <span>2. Location & Neighborhood Privacy</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            Your exact residential address is never shown publicly on the marketplace. PinIn only displays your chosen general suburb or neighborhood (for example, "Brooklyn, NY" or "Manhattan, NY") on your furniture cards so neighbors can estimate pickup proximity safely.
          </p>
        </div>

        {/* Section 3: Safe Marketplace Messaging */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs space-y-2.5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#0052FF]" />
            <span>3. Safe Marketplace Messaging & Protection</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            Direct messages are retained securely to help protect users against fraudulent listings, scams, and harassment. Users can block abusive accounts or report suspicious listings at any time directly through the 3-dots menu.
          </p>
        </div>

        {/* Section 4: Data Security and Zero Third-Party Selling */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs space-y-2.5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-[#0052FF]" />
            <span>4. Data Security & Zero Third-Party Selling</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            We never sell or rent your personal information to third-party advertisers or data brokers. All credentials are fully encrypted and transmitted over secure HTTPS channels.
          </p>
        </div>

        {/* Section 5: Account Deletion and Data Rights */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs space-y-2.5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0052FF]" />
            <span>5. Account Deletion & Right to Erasure</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            You maintain full ownership of your data. You can edit your profile bio, remove any active listing, or permanently delete your account at any time via Account Settings. Account deletion immediately erases all your listings, chats, and saved items from the PinIn marketplace.
          </p>
        </div>

        {/* Section 6: Web Browsing & Security */}
        <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0052FF]" />
            <span>6. Web Browsing & Security</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            When you use PinIn, standard session tokens are securely stored locally on your device for user authentication and offline access. No third-party advertising tracking cookies or intrusive tracking pixels are utilized.
          </p>
        </div>

        {/* Section 7: Contact Us */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-5 shadow-xs space-y-2">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#0052FF]" />
            <span>Questions regarding privacy?</span>
          </h3>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Contact our dedicated privacy and safety team at <strong className="text-gray-900">privacy@pinin.co.za</strong> or submit a ticket through the Contact Us page.
          </p>
        </div>

        {/* Close / Return Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 px-4 bg-[#0052FF] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>I Understand & Agree</span>
        </button>
      </main>
    </div>
  );
};
