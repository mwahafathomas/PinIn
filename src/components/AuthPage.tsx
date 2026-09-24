import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Check,
  LogIn,
  UserPlus,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  RotateCw,
} from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { supabase } from '../supabaseClient';
import { upsertUserProfile } from '../services/profilesService';
import { DEFAULT_AVATAR_IMAGE } from '../data/defaultAvatar';

interface AuthPageProps {
  isOpen: boolean;
  onBack: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'signin' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  isOpen,
  onBack,
  onSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // On register page unticked automatically, on signin page ticked automatically
  const [agreedToTerms, setAgreedToTerms] = useState(initialMode === 'signin');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verification code (OTP) states
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  // When switching modes, set appropriate default checkbox state
  useEffect(() => {
    if (mode === 'register') {
      setAgreedToTerms(false);
    } else {
      setAgreedToTerms(true);
    }
  }, [mode]);

  if (!isOpen) return null;

  // Helper after successful auth session (NO green "Account verified" banner as requested)
  const handleSuccessfulSession = async (
    authUser: { id: string; email?: string; user_metadata?: Record<string, any> },
    token?: string
  ) => {
    const userMeta = authUser.user_metadata || {};
    const displayName =
      userMeta.full_name ||
      `${firstName.trim()} ${surname.trim()}`.trim() ||
      (userMeta.first_name
        ? `${userMeta.first_name} ${userMeta.surname || ''}`.trim()
        : authUser.email?.split('@')[0] || 'Member');

    const loggedUser: UserAccount = {
      id: authUser.id,
      name: displayName,
      surname: surname.trim() || userMeta.surname || '',
      bio: userMeta.bio || 'PinIn furniture marketplace member',
      email: authUser.email || email.trim(),
      avatar: userMeta.avatar_url || DEFAULT_AVATAR_IMAGE,
      phone: userMeta.phone || '',
      location: userMeta.location || 'Sandton (Gauteng)',
      savedItemIds: [],
      listedItemsCount: 0,
      joinedDate: 'Just now',
      isLoggedIn: true,
    };

    // Save/upsert profile directly to Supabase 'profiles' table
    upsertUserProfile({
      id: loggedUser.id,
      name: firstName.trim() || userMeta.first_name || displayName,
      surname: surname.trim() || userMeta.surname || '',
      email: loggedUser.email,
      avatar: loggedUser.avatar,
      phone: loggedUser.phone,
      location: loggedUser.location,
      bio: loggedUser.bio,
    });

    let userToken = token;
    if (!userToken) {
      try {
        const { data: sData } = await supabase.auth.getSession();
        userToken = sData?.session?.access_token;
      } catch {}
    }
    if (userToken) {
      try {
        localStorage.setItem('user_token', userToken);
      } catch {}
    }
    try {
      localStorage.setItem('user_data', JSON.stringify(loggedUser));
    } catch {}

    try {
      window.history.pushState({}, '', '/');
    } catch {}
    onSuccess(loggedUser);
  };

  // Handle OTP verification submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const token = otpCode.trim();
    if (!token || token.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      // 1) Verify OTP with Supabase Auth (type: 'signup')
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token,
        type: 'signup',
      });

      if (error) {
        // Retry with 'email' token type in case configured as standard token
        const retryResult = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token,
          type: 'email',
        });

        if (retryResult.error) {
          setErrorMsg(retryResult.error.message || 'Invalid or expired verification code.');
          setIsLoading(false);
          return;
        }

        if (retryResult.data?.session && retryResult.data?.user) {
          handleSuccessfulSession(retryResult.data.user);
          return;
        }
      }

      if (data?.session && data?.user) {
        handleSuccessfulSession(data.user);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          handleSuccessfulSession(sessionData.session.user);
        } else {
          setSuccessMsg('Email verified successfully! You can now sign in.');
          setIsVerifyingOtp(false);
          setMode('signin');
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Verification failed. Please check your code and try again.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to resend verification code.');
      } else {
        setSuccessMsg('A new 6-digit code has been sent to your email.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error resending code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    if (mode === 'register') {
      if (!firstName.trim() || !surname.trim()) {
        setErrorMsg('Please enter your name and surname.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (!agreedToTerms) {
        setErrorMsg('Please accept the Terms & Conditions and Privacy Policies to create an account.');
        return;
      }

      setIsLoading(true);

      try {
        // Register using Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              first_name: firstName.trim(),
              surname: surname.trim(),
              full_name: `${firstName.trim()} ${surname.trim()}`.trim(),
            },
          },
        });

        if (error) {
          setErrorMsg(error.message || 'Registration failed. Please try again.');
          setIsLoading(false);
          return;
        }

        // If email confirmation is required and no session yet -> switch to code verification UI
        if (data && !data.session) {
          setIsVerifyingOtp(true);
          setSuccessMsg(`We sent a 6-digit code to ${email.trim()}. Enter it below to activate your account.`);
          setIsLoading(false);
          return;
        }

        // If session exists immediately
        if (data?.session && data?.user) {
          handleSuccessfulSession(data.user);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred. Please try again.';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign In using Supabase Auth
      setIsLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setIsVerifyingOtp(true);
            setErrorMsg('Your email is not confirmed yet. Please enter the 6-digit code from your email.');
          } else {
            setErrorMsg(error.message || 'Invalid email or password.');
          }
          setIsLoading(false);
          return;
        }

        if (data?.session && data?.user) {
          handleSuccessfulSession(data.user);
        } else {
          setErrorMsg('No active session found. Please verify your email and try logging in again.');
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred. Please try again.';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col font-sans">
      {/* Top Header Bar (White) */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option */}
          <button
            type="button"
            onClick={() => {
              if (isVerifyingOtp) {
                setIsVerifyingOtp(false);
                setErrorMsg('');
                setSuccessMsg('');
              } else {
                onBack();
              }
            }}
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

          {/* Spacer for symmetry */}
          <div className="w-8" aria-hidden="true" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto pb-10 flex flex-col">
        {/* Top Hero Container */}
        <div className="relative w-full overflow-hidden border-b border-gray-200 py-6 px-4 bg-gray-50">
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            {!isVerifyingOtp ? (
              <>
                {/* Pill Container holding Sign In and Register */}
                <div className="bg-white/90 backdrop-blur-xs p-1 rounded-2xl shadow-md border border-gray-200 flex items-center w-full max-w-[280px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-center cursor-pointer ${
                      mode === 'signin'
                        ? 'bg-[#2D8EDE] text-white shadow-sm'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all text-center cursor-pointer ${
                      mode === 'register'
                        ? 'bg-[#2D8EDE] text-white shadow-sm'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Current Page Indicator */}
                <div className="flex items-center gap-2 bg-white/95 px-4 py-1.5 rounded-full shadow-sm border border-gray-200/80">
                  <div className="w-5 h-5 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center">
                    {mode === 'signin' ? (
                      <LogIn className="w-3 h-3 stroke-[2.5]" />
                    ) : (
                      <UserPlus className="w-3 h-3 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-[#2D8EDE] tracking-wide uppercase">
                    {mode === 'signin' ? 'Sign In' : 'Register'}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-white/95 px-4 py-1.5 rounded-full shadow-sm border border-gray-200/80">
                <div className="w-5 h-5 rounded-full bg-[#2D8EDE] text-white flex items-center justify-center">
                  <KeyRound className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-[#2D8EDE] tracking-wide uppercase">
                  Verify Email Code
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form Container */}
        {isVerifyingOtp ? (
          /* OTP Code Verification Form */
          <form onSubmit={handleVerifyOtp} className="px-4 py-6 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Enter 6-digit Code
                </h3>
                <p className="text-xs text-gray-500">
                  We sent a confirmation code to <span className="font-semibold text-gray-800">{email}</span>
                </p>
              </div>

              {/* 6-digit code input */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  aria-label="6-digit verification code"
                  className="w-full bg-white text-gray-900 text-center tracking-[0.6em] placeholder:tracking-normal placeholder:text-gray-300 text-2xl font-black py-3.5 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all"
                />
                <div className="absolute right-3.5 pointer-events-none text-[#2D8EDE]">
                  <KeyRound className="w-5 h-5" />
                </div>
              </div>

              {/* Error & Success Messages */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-in fade-in flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium animate-in fade-in flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Resend Code Action */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingOtp(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Change email
                </button>

                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendOtp}
                  className="text-[#2D8EDE] font-bold hover:underline flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Resending...' : 'Resend code'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading || otpCode.trim().length < 6}
                className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] disabled:opacity-60 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2D8EDE] cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Log In</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Regular Sign In / Register Form */
          <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* Name & Surname on register page */}
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="enter name"
                      aria-label="Enter name"
                      className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium px-3.5 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="enter surname"
                      aria-label="Enter surname"
                      className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium px-3.5 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
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

              {/* Password */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="enter password"
                  aria-label="Enter password"
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

              {/* Confirm Password */}
              {mode === 'register' && (
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="confirm password"
                    aria-label="Confirm password"
                    className="w-full bg-white text-gray-900 placeholder:text-gray-400 text-xs sm:text-sm font-medium pl-3.5 pr-10 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8EDE] focus:border-transparent transition-all"
                  />
                  <div className="absolute right-3.5 pointer-events-none text-[#2D8EDE]">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
              )}

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
                disabled={isLoading || (mode === 'register' && !agreedToTerms)}
                className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] disabled:opacity-50 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2D8EDE] cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'signin' ? 'Signing In...' : 'Registering...'}</span>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register</span>
                  </>
                )}
              </button>

              <div className="flex items-start gap-2.5 px-1 py-1">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#2D8EDE] border-gray-300 focus:ring-[#2D8EDE] cursor-pointer"
                />
                <label
                  htmlFor="terms-checkbox"
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
        )}
      </main>
    </div>
  );
};
