import React from 'react';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Camera,
  FileText,
  AlertTriangle,
  Image as ImageIcon,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface ListingGuidelinesPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ListingGuidelinesPage: React.FC<ListingGuidelinesPageProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col font-sans">
      {/* Top Header Bar (White): Go back (<) on top left, App name (PinIn) in middle */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option (< ) at top left */}
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
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto pb-16 flex flex-col px-4 md:px-6 lg:px-8 pt-4 space-y-4 text-left">
        {/* Page Title Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#2D8EDE] flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">
              Listing Guidelines
            </h1>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              Standards for selling furniture on PinIn
            </p>
          </div>
        </div>

        {/* SECTION 1: REASONS FOR YOUR LISTING TO BE APPROVED */}
        <div className="bg-white rounded-3xl border border-emerald-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-700 pb-2 border-b border-emerald-100">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5] text-emerald-600 shrink-0" />
            <h2 className="text-sm font-extrabold tracking-tight uppercase">
              reasons for your listing to be approved
            </h2>
          </div>

          {/* Photos Sub-section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-900 underline decoration-2 decoration-emerald-500 underline-offset-4 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>photos</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>Clear photos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>all different angles included ( front, back, sides )</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>photos taken in real home</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>good lighting, furniture is fully visible</span>
              </li>
            </ul>
          </div>

          {/* Description Sub-section */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 underline decoration-2 decoration-emerald-500 underline-offset-4 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>description</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>real title</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>condition stated</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>measurements included</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>material stated</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>reason for selling ( optional )</span>
              </li>
            </ul>
          </div>
        </div>

        {/* SECTION 2: REASONS FOR YOUR LISTING TO BE REJECTED */}
        <div className="bg-white rounded-3xl border border-red-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-red-700 pb-2 border-b border-red-100">
            <XCircle className="w-5 h-5 stroke-[2.5] text-red-600 shrink-0" />
            <h2 className="text-sm font-extrabold tracking-tight uppercase">
              reasons for your listing to be rejected
            </h2>
          </div>

          {/* Scam / Illegal Sub-section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-900 underline decoration-2 decoration-red-500 underline-offset-4 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600 inline" />
              <span>scam / illegal</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>Same product photo used for different listing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>No image with handwritten date</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>price R1, R123</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>Contact details in photos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>duplicate listing</span>
              </li>
            </ul>
          </div>

          {/* Photo Sub-section */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 underline decoration-2 decoration-red-500 underline-offset-4 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-red-600 inline" />
              <span>photo</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>photos that are not furniture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>stock photos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>innapropriate photos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>heavy filters that hide damage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>photos with watermarks</span>
              </li>
            </ul>
          </div>

          {/* Description Sub-section */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 underline decoration-2 decoration-red-500 underline-offset-4 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-red-600 inline" />
              <span>description</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>no description just &quot; for sale &quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>false condition, says new but clearly broken</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>offensive language / hate speech</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>misleading words</span>
              </li>
            </ul>
          </div>

          {/* Others Sub-section */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 underline decoration-2 decoration-red-500 underline-offset-4 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 inline" />
              <span>others</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-700 font-medium pl-1">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>seller banned before creating new account</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Back Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back to Sell</span>
          </button>
        </div>
      </main>
    </div>
  );
};
