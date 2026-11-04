import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Send,
  Mail,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { UserAccount } from '../types/furniture';
import { SUPABASE_PUBLIC_KEY, supabase } from '../supabaseClient';

export const CONTACT_TOPICS_LIST = [
  'where is my order/ i want return',
  'item damaged',
  'wrong item received',
  'refund not received',
  'payment failed but money deducted',
  'can i change my order address',
  'size guide',
  'delete my account',
  'other',
] as const;

interface ContactUsPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  showToast?: (msg: string) => void;
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({
  isOpen,
  onClose,
  user,
  showToast: parentShowToast,
}) => {
  const [topics, setTopics] = useState<string[]>([...CONTACT_TOPICS_LIST]);
  const [topic, setTopic] = useState<string>('where is my order/ i want return');
  const [customTopic, setCustomTopic] = useState('');
  const [name, setName] = useState(user.isLoggedIn ? user.name : '');
  const [email, setEmail] = useState(user.isLoggedIn ? user.email : '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Load custom topics from Supabase contact_topics table if created
  useEffect(() => {
    async function loadTopics() {
      try {
        const { data, error } = await supabase
          .from('contact_topics')
          .select('name')
          .order('id', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
          const names = data.map((d: any) => String(d.name || '').trim()).filter(Boolean);
          if (names.length > 0) {
            if (!names.includes('other')) names.push('other');
            setTopics(names);
          }
        }
      } catch {}
    }
    loadTopics();
  }, []);

  if (!isOpen) return null;

  const displayToast = (msg: string, type: 'success' | 'error') => {
    setToast({ message: msg, type });
    if (parentShowToast) {
      parentShowToast(msg);
    }
    setTimeout(() => {
      setToast((curr) => (curr?.message === msg ? null : curr));
    }, 6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setToast(null);

    const effectiveTopic = topic === 'other' ? (customTopic.trim() || 'Other Inquiry') : topic;
    const finalSubject = subject.trim() ? `${effectiveTopic}: ${subject.trim()}` : effectiveTopic;

    // Save to Supabase contact_messages table in the background
    try {
      await supabase.from('contact_messages').insert([
        {
          name: name.trim() || 'Valued User',
          email: email.trim(),
          subject: finalSubject,
          message: `[Inquiry Topic: ${effectiveTopic}]\n\n${message.trim()}`,
          status: 'new',
        },
      ]);
    } catch {
      // Non-blocking
    }

    const anonKey =
      SUPABASE_PUBLIC_KEY || 'sb_publishable__TcJkIYGsFBbmJ66gUcmzA_hJGn38yE';

    try {
      const response = await fetch(
        'https://ygkyxxrrfcvypcvmnzke.supabase.co/functions/v1/send-contact-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(anonKey
              ? {
                  apikey: anonKey,
                  Authorization: `Bearer ${anonKey}`,
                }
              : {}),
          },
          body: JSON.stringify({
            name,
            email,
            subject,
            message,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success === true) {
        displayToast("Message sent! We'll reply from hello@pinin.co.za", 'success');
        // Clear the form
        setSubject('');
        setMessage('');
        if (!user.isLoggedIn) {
          setName('');
          setEmail('');
        }
      } else {
        const errorDetail =
          data?.error ||
          data?.message ||
          (data && typeof data === 'object' ? JSON.stringify(data) : null) ||
          response.statusText ||
          'Failed to send';
        displayToast(`Failed to send: ${errorDetail}`, 'error');
      }
    } catch (err: any) {
      const errorDetail = err?.message || String(err) || 'Network error';
      displayToast(`Failed to send: ${errorDetail}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="contact-us-page fixed inset-0 z-50 bg-gray-50 overflow-y-auto flex flex-col font-sans select-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .contact-us-page {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .contact-us-page::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        .contact-us-page * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .contact-us-page *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
      `}</style>
      {/* Centered Message Sent / Status Popup */}
      {toast && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto">
          <div
            className={`max-w-sm w-full p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center gap-3 border transition-all animate-in zoom-in-95 duration-200 ${
              toast.type === 'error'
                ? 'bg-white text-gray-900 border-rose-200'
                : 'bg-white text-gray-900 border-gray-100'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                toast.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900">
                {toast.type === 'error' ? 'Sending Failed' : 'Message Sent!'}
              </h4>
              <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-[#2D8EDE] text-white font-bold text-xs hover:bg-[#2579BE] transition-colors shadow-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Top Header Bar (White): 1. Go back (<) on top left, 2. App name (PinIn) in middle */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-xs">
        <div className="w-full max-w-md md:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between relative">
          {/* Go back option (<) on top left */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-lg text-[#2D8EDE] hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D8EDE] cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* App Name (PinIn) right in the middle */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="font-extrabold text-2xl tracking-tight text-gray-900 font-sans">
              Pin<span className="text-[#2D8EDE]">In</span>
            </span>
          </div>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto pb-16 flex flex-col px-4 md:px-6 lg:px-8 pt-4 space-y-6 text-left">
        {/* Header Title */}
        <div className="space-y-1 px-1">
          <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            Contact Support
          </h1>
          <p className="text-xs font-medium text-gray-500">
            we are here to help 24/7
          </p>
        </div>

        {/* Clean text list only with arrow >, no border, no background, no card (Like settings menu list) */}
        <div className="divide-y divide-gray-200">
          <a
            href="mailto:support@pinin.co.za?subject=PinIn%20Support%20Inquiry"
            className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-100/60 text-left transition-colors cursor-pointer group"
          >
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-900">Email Support</p>
              <p className="text-[11px] text-gray-500">support@pinin.co.za</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2D8EDE] group-hover:translate-x-0.5 transition-all" />
          </a>

          <div className="w-full flex items-center justify-between py-3.5 px-2 text-left">
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-900">Response Time</p>
              <p className="text-[11px] text-gray-500">Less than 24 Hours</p>
            </div>
          </div>
        </div>

        {/* Clean Form Container (No card border or background box) */}
        <div className="space-y-4 pt-1">
          <div className="px-1">
            <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider">
              Send a Message
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
          {/* Inline Feedback Banner */}
          {toast && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold border transition-all animate-in fade-in duration-150 ${
                toast.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
              Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#2D8EDE] bg-gray-50"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* When 'other' is clicked, open a box for user to type topic with 25 words maximum */}
            {topic === 'other' && (
              <div className="mt-3 space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Type your topic
                </label>
                <textarea
                  rows={2}
                  required
                  value={customTopic}
                  onChange={(e) => {
                    const val = e.target.value;
                    const words = val.trim().split(/\s+/).filter(Boolean);
                    if (words.length <= 25) {
                      setCustomTopic(val);
                    } else {
                      // Disallow typing beyond 25 words
                      const truncated = words.slice(0, 25).join(' ');
                      setCustomTopic(truncated);
                    }
                  }}
                  placeholder="Describe your inquiry topic (maximum 25 words)..."
                  className="w-full text-xs font-semibold p-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#2D8EDE] bg-gray-50 resize-none"
                />
                <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold px-1">
                  <span>Maximum 25 words</span>
                  <span
                    className={
                      customTopic.trim().split(/\s+/).filter(Boolean).length >= 25
                        ? 'text-amber-600 font-extrabold'
                        : ''
                    }
                  >
                    {customTopic.trim() ? customTopic.trim().split(/\s+/).filter(Boolean).length : 0} / 25 words
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full text-xs font-semibold px-3.5 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#2D8EDE] bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full text-xs font-semibold px-3.5 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#2D8EDE] bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your inquiry..."
              className="w-full text-xs font-semibold px-3.5 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#2D8EDE] bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">
              Your Message
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe how we can assist you..."
              className="w-full text-xs font-semibold p-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#2D8EDE] bg-gray-50 resize-none"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-2.5 text-xs text-gray-600 font-medium">
            <Mail className="w-4 h-4 text-[#2D8EDE] shrink-0" />
            <span>Direct support: <strong>support@pinin.co.za</strong></span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-[#2D8EDE] hover:bg-[#2579BE] active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
          </button>
        </form>
      </div>
    </main>
  </div>
);
};

