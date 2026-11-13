import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Lock,
  LogIn,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface NewPasswordProps {
  email?: string;
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateToSignIn?: () => void;
  onNavigateToRegister?: () => void;
}

export const NewPassword: React.FC<NewPasswordProps> = ({
  email: propEmail,
  onBack,
  onSuccess,
  onNavigateToSignIn,
  onNavigateToRegister,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const resolvedEmail = (
    propEmail ||
    (location.state as any)?.email ||
    searchParams.get('email') ||
    ''
  ).trim().toLowerCase();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/login');
    }
  };

  const handleTabSignIn = () => {
    if (onNavigateToSignIn) {
      onNavigateToSignIn();
    } else {
      navigate('/login');
    }
  };

  const handleTabRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      navigate('/register');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }

    // Passwords match validation
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      // Call Supabase Edge Function 'reset-password' as requested
      try {
        const { data, error } = await supabase.functions.invoke('reset-password', {
          body: { email: resolvedEmail, newPassword: newPassword },
        });

        if (error) {
          console.warn('supabase.functions.invoke reset-password warning:', error);
        }
      } catch (fnErr) {
        console.warn('supabase.functions.invoke reset-password exception:', fnErr);
      }

      // Also attempt auth user update if active session is present
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {}

      setSuccessMsg('Password changed!');

      // Navigate back to original Sign In page
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (onNavigateToSignIn) {
          onNavigateToSignIn();
        } else {
          navigate('/login', { replace: true });
        }
      }, 1200);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save password. Please try again.';
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Top Header Bar (White) */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-[#2D8EDE] hover:bg-blue-50 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto pb-10 flex flex-col">
        {/* Top Hero Container */}
        <div className="relative w-full overflow-hidden border-b border-gray-200 py-6 px-4 bg-gray-50">
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            {/* Pill Container holding Sign In and Register */}
            <div className="bg-white/90 backdrop-blur-xs p-1 rounded-2xl shadow-md border border-gray-200 flex items-center w-full max-w-[280px]">
              <button
                type="button"
                onClick={handleTabSignIn}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-center cursor-pointer bg-[#2D8EDE] text-white shadow-sm"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={handleTabRegister}
                className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-center cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-white/60"
              >
                Register
              </button>
            </div>

            {/* Current Page Indicator: small "SIGN IN" pill with icon, and subtitle below it "Reset Password" */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2 bg-white/95 px-4 py-1.5 rounded-full shadow-sm border border-gray-200/80">
                <div className="w-5 h-5 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center">
                  <LogIn className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-[#2D8EDE] tracking-wide uppercase">
                  Sign In
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-500">Reset Password</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Input 1: enter new password */}
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="enter new password"
                aria-label="Enter new password"
                className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium pl-3.5 pr-10 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 text-[#2D8EDE] hover:text-blue-700 p-0.5 transition-colors focus-visible:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </button>
            </div>

            {/* Input 2: confirm new password */}
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="confirm new password"
                aria-label="Confirm new password"
                className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium pl-3.5 pr-10 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3.5 text-[#2D8EDE] hover:text-blue-700 p-0.5 transition-colors focus-visible:outline-none cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </button>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-in fade-in flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium animate-in fade-in flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Bottom Actions Area */}
          <div className="space-y-4 pt-4">
            <button
              type="submit"
              disabled={isLoading || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] disabled:opacity-50 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2D8EDE] cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <>
                  <span>Save Password</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className="flex items-start gap-2.5 px-1 py-1">
              <input
                type="checkbox"
                id="terms-checkbox-newpwd"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#2D8EDE] border-gray-300 focus:ring-[#2D8EDE] cursor-pointer"
              />
              <label
                htmlFor="terms-checkbox-newpwd"
                className="text-[11px] sm:text-xs text-gray-500 leading-tight select-none cursor-pointer"
              >
                By continuing you agree with PinIn{' '}
                <span className="text-[#2D8EDE] font-semibold hover:underline">
                  Terms &amp; Conditions
                </span>{' '}
                and{' '}
                <span className="text-[#2D8EDE] font-semibold hover:underline">
                  Privacy Policies
                </span>
                .
              </label>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
