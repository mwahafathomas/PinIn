import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  const isSignInPrompt =
    message.toLowerCase().includes('sign in') ||
    message.toLowerCase().includes('access this page');

  if (isSignInPrompt) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="bg-white text-gray-900 text-xs font-bold px-5 py-2.5 rounded-full shadow-xl flex items-center justify-center border border-gray-200">
          <span>{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-white/10">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
};
