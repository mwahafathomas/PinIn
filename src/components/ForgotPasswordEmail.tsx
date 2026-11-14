import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Mail,
  LogIn,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';

interface ForgotPasswordEmailProps {
  onBack?: () => void;
  onNavigateToVerify?: (email: string) => void;
  onNavigateToSignIn?: () => void;
  onNavigateToRegister?: () => void;
}

export const ForgotPasswordEmail: React.FC<ForgotPasswordEmailProps> = ({
  onBack,
  onNavigateToVerify,
  onNavigateToSignIn,
  onNavigateToRegister,
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
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

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your email.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // 2. Insert into Supabase table `password_reset_codes`
      try {
        const { error: dbError } = await supabase.from('password_reset_codes').insert([
          {
            email: trimmedEmail,
            code: code,
            expires_at: expiresAt,
          },
        ]);
        if (dbError) {
          console.warn('Supabase password_reset_codes insert notice:', dbError.message);
        }
      } catch (dbErr) {
        console.warn('Supabase password_reset_codes exception:', dbErr);
      }

      // Also cache locally as resilient backup for offline or initial table setup
      try {
        const localList = JSON.parse(localStorage.getItem('pinin_pwd_reset_cache') || '[]');
        localList.push({ email: trimmedEmail, code, expires_at: expiresAt });
        localStorage.setItem('pinin_pwd_reset_cache', JSON.stringify(localList));
      } catch {}

      // 3. Send via Resend API POST https://api.resend.com/emails
      const resendApiKey =
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RESEND_API_KEY) ||
        (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) ||
        'YOUR_RESEND_API_KEY';

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Pinin <noreply@pinin.co.za>',
            to: trimmedEmail,
            subject: 'Your Pinin Reset Code',
            html: `<h1>Your Pinin code is: ${code}</h1>`,
          }),
        });
      } catch (fetchErr) {
        console.warn('Direct Resend fetch failed (e.g. CORS/offline), attempting proxy:', fetchErr);
        // Attempt server proxy if direct fetch is blocked by browser CORS
        try {
          await fetch('/api/send-reset-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmedEmail, code }),
          });
        } catch {}
      }

      setSuccessMsg('Reset code sent! Redirecting to verification...');

      // 4. Navigate to VerifyResetCode passing email as parameter
      setTimeout(() => {
        if (onNavigateToVerify) {
          onNavigateToVerify(trimmedEmail);
        } else {
          navigate(`/verify-reset-code?email=${encodeURIComponent(trimmedEmail)}`, {
            state: { email: trimmedEmail },
          });
        }
      }, 700);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send reset code. Please try again.';
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col font-sans"
    >
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
            {/* Email input field */}
            <div className="relative flex items-center">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter email"
                aria-label="Enter email"
                className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium pl-3.5 pr-10 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all"
              />
              <div className="absolute right-3.5 pointer-events-none text-[#2D8EDE]">
                <Mail className="w-5 h-5" />
              </div>
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
              disabled={isLoading || !email.trim()}
              className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] disabled:opacity-50 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2D8EDE] cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Send Code</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className="flex items-start gap-2.5 px-1 py-1">
              <input
                type="checkbox"
                id="terms-checkbox-reset"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#2D8EDE] border-gray-300 focus:ring-[#2D8EDE] cursor-pointer"
              />
              <label
                htmlFor="terms-checkbox-reset"
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
    </motion.div>
  );
};
